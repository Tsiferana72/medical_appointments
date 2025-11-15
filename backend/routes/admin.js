const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

// Appliquer l'authentification et la vérification admin à toutes les routes
router.use(authenticateToken);
router.use(requireAdmin);

// Récupérer tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, email, username, full_name, role, phone, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un utilisateur
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role = 'patient', phone } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Vérifier si l'utilisateur existe déjà
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer un username à partir de l'email
    const username = email.split('@')[0];

    // Insérer l'utilisateur
    const [result] = await db.query(
      'INSERT INTO users (email, password, username, full_name, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, username, name, role, phone]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un utilisateur
router.put('/users/:id', async (req, res) => {
  try {
    const { email, name, role, phone } = req.body;
    const userId = req.params.id;

    // Vérifier que l'utilisateur existe
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Construire la requête de mise à jour
    let updateFields = [];
    let updateValues = [];

    if (email) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    if (name) {
      updateFields.push('full_name = ?');
      updateValues.push(name);
    }
    if (role) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    updateValues.push(userId);

    await db.query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Empêcher la suppression de son propre compte
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    // Vérifier que l'utilisateur existe
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Supprimer l'utilisateur
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques
router.get('/stats', async (req, res) => {
  try {
    // Nombre total d'utilisateurs par rôle
    const [userStats] = await db.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `);

    // Nombre de rendez-vous par statut
    const [appointmentStats] = await db.query(`
      SELECT status, COUNT(*) as count 
      FROM appointments 
      GROUP BY status
    `);

    // Rendez-vous récents
    const [recentAppointments] = await db.query(`
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      users: userStats,
      appointments: appointmentStats,
      recentAppointments: recentAppointments[0].count
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer tous les rendez-vous (admin)
router.get('/appointments', async (req, res) => {
  try {
    const [appointments] = await db.query(`
      SELECT a.*, 
             d.full_name as doctor_name, d.email as doctor_email,
             p.full_name as patient_name, p.email as patient_email
      FROM appointments a
      JOIN users d ON a.doctor_id = d.id
      JOIN users p ON a.patient_id = p.id
      ORDER BY a.appointment_date DESC
    `);
    res.json(appointments);
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;