const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

const router = express.Router();

// Middleware pour vérifier le token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role = 'patient', phone } = req.body;

    console.log('📝 Tentative d\'inscription:', { email, name, role, phone });

    // Validation des champs requis
    if (!email || !password || !name) {
      console.log('❌ Validation échouée: champs manquants');
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Email invalide:', email);
      return res.status(400).json({ error: 'Email invalide' });
    }

    // Validation mot de passe
    if (password.length < 6) {
      console.log('❌ Mot de passe trop court');
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    // Vérifier si l'utilisateur existe déjà
    console.log('🔍 Vérification si l\'email existe...');
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existing.length > 0) {
      console.log('❌ Email déjà utilisé:', email);
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    console.log('🔐 Hashage du mot de passe...');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Générer un username à partir de l'email
    const username = email.split('@')[0];

    // Insérer l'utilisateur dans la base de données
    console.log('💾 Insertion dans la base de données...');
    const [result] = await db.query(
      'INSERT INTO users (email, password, username, full_name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [email, hashedPassword, username, name, role, phone || null]
    );

    console.log('✅ Utilisateur créé avec succès, ID:', result.insertId);

    res.status(201).json({
      message: 'Inscription réussie',
      userId: result.insertId
    });

  } catch (error) {
    console.error('❌ Erreur inscription:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'inscription',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔑 Tentative de connexion:', email);

    // Validation
    if (!email || !password) {
      console.log('❌ Email ou mot de passe manquant');
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    // Trouver l'utilisateur
    console.log('🔍 Recherche de l\'utilisateur...');
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      console.log('❌ Utilisateur non trouvé:', email);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = users[0];
    console.log('✅ Utilisateur trouvé, ID:', user.id);

    // Vérifier le mot de passe
    console.log('🔐 Vérification du mot de passe...');
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      console.log('❌ Mot de passe incorrect');
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    console.log('✅ Mot de passe correct');

    // Créer le token JWT
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Token JWT créé');

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('❌ Erreur connexion:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la connexion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route pour vérifier le token
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // Récupérer les infos complètes de l'utilisateur
    const [users] = await db.query(
      'SELECT id, email, username, full_name, role, phone FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ 
      valid: true, 
      user: users[0]
    });
  } catch (error) {
    console.error('Erreur verify:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour obtenir le profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, username, full_name, role, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur profile:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Exporter le router et le middleware
router.authenticateToken = authenticateToken;

module.exports = router;