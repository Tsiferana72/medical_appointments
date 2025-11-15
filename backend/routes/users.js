const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Récupérer tous les docteurs
router.get('/doctors', async (req, res) => {
  try {
    console.log('🔍 Récupération de la liste des docteurs...');
    
    const [doctors] = await db.query(
      'SELECT id, username, full_name, email, phone FROM users WHERE role = ? ORDER BY full_name',
      ['doctor']
    );

    console.log(`✅ ${doctors.length} docteur(s) trouvé(s)`);
    
    res.json(doctors);
  } catch (error) {
    console.error('Erreur récupération docteurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un utilisateur spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, email, role, phone, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil utilisateur
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    const userId = req.user.id;

    let updateFields = [];
    let updateValues = [];

    if (full_name) {
      updateFields.push('full_name = ?');
      updateValues.push(full_name);
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

    // Récupérer les données mises à jour
    const [users] = await db.query(
      'SELECT id, username, full_name, email, role, phone FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Profil mis à jour avec succès',
      user: users[0]
    });
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques d'un docteur
router.get('/doctors/:id/stats', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Vérifier que c'est un docteur
    const [doctors] = await db.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [doctorId, 'doctor']
    );

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Docteur non trouvé' });
    }

    // Statistiques des rendez-vous
    const [appointmentStats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM appointments
      WHERE doctor_id = ?
    `, [doctorId]);

    // Rendez-vous à venir
    const [upcomingAppointments] = await db.query(`
      SELECT COUNT(*) as count
      FROM appointments
      WHERE doctor_id = ? AND appointment_date >= NOW() AND status != 'cancelled'
    `, [doctorId]);

    res.json({
      appointments: appointmentStats[0],
      upcoming: upcomingAppointments[0].count
    });
  } catch (error) {
    console.error('Erreur récupération statistiques docteur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Rechercher des utilisateurs (admin uniquement)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    }

    const { query, role } = req.query;

    let sql = 'SELECT id, username, full_name, email, role, phone, created_at FROM users WHERE 1=1';
    let params = [];

    if (query) {
      sql += ' AND (full_name LIKE ? OR email LIKE ? OR username LIKE ?)';
      const searchTerm = `%${query}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (role) {
      sql += ' AND role = ?';
      params.push(role);
    }

    sql += ' ORDER BY created_at DESC LIMIT 50';

    const [users] = await db.query(sql, params);
    res.json(users);
  } catch (error) {
    console.error('Erreur recherche utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;