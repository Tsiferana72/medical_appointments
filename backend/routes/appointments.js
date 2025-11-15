const express = require('express');
const db = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Créer un rendez-vous
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { doctor_id, appointment_date, reason } = req.body;
    const patient_id = req.user.id;

    // Validation
    if (!doctor_id || !appointment_date) {
      return res.status(400).json({ error: 'Docteur et date requis' });
    }

    // Vérifier que le docteur existe
    const [doctors] = await db.query(
      'SELECT id FROM users WHERE id = ? AND role = ?',
      [doctor_id, 'doctor']
    );

    if (doctors.length === 0) {
      return res.status(404).json({ error: 'Docteur non trouvé' });
    }

    // Créer le rendez-vous
    const [result] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status) VALUES (?, ?, ?, ?, ?)',
      [patient_id, doctor_id, appointment_date, reason, 'pending']
    );

    res.status(201).json({
      message: 'Rendez-vous créé avec succès',
      appointmentId: result.insertId
    });
  } catch (error) {
    console.error('Erreur création rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les rendez-vous
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'admin') {
      // Admin voit tous les rendez-vous
      query = `
        SELECT a.*, 
               d.full_name as doctor_name, d.email as doctor_email,
               p.full_name as patient_name, p.email as patient_email
        FROM appointments a
        JOIN users d ON a.doctor_id = d.id
        JOIN users p ON a.patient_id = p.id
        ORDER BY a.appointment_date DESC
      `;
    } else if (req.user.role === 'doctor') {
      // Docteur voit ses rendez-vous
      query = `
        SELECT a.*, 
               p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone
        FROM appointments a
        JOIN users p ON a.patient_id = p.id
        WHERE a.doctor_id = ?
        ORDER BY a.appointment_date DESC
      `;
      params = [req.user.id];
    } else {
      // Patient voit ses rendez-vous
      query = `
        SELECT a.*, 
               d.full_name as doctor_name, d.email as doctor_email, d.phone as doctor_phone
        FROM appointments a
        JOIN users d ON a.doctor_id = d.id
        WHERE a.patient_id = ?
        ORDER BY a.appointment_date DESC
      `;
      params = [req.user.id];
    }

    const [appointments] = await db.query(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un rendez-vous spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [appointments] = await db.query(
      `SELECT a.*, 
              d.full_name as doctor_name, d.email as doctor_email, d.phone as doctor_phone,
              p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone
       FROM appointments a
       JOIN users d ON a.doctor_id = d.id
       JOIN users p ON a.patient_id = p.id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const appointment = appointments[0];

    // Vérifier les permissions
    if (req.user.role !== 'admin' && 
        req.user.id !== appointment.patient_id && 
        req.user.id !== appointment.doctor_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json(appointment);
  } catch (error) {
    console.error('Erreur récupération rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'un rendez-vous
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    // Validation du statut
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    // Récupérer le rendez-vous
    const [appointments] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [appointmentId]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const appointment = appointments[0];

    // Vérifier les permissions
    if (req.user.role !== 'admin' && 
        req.user.role !== 'doctor' && 
        req.user.id !== appointment.patient_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Mettre à jour le statut
    await db.query(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, appointmentId]
    );

    res.json({ message: 'Statut mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un rendez-vous
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    // Récupérer le rendez-vous
    const [appointments] = await db.query(
      'SELECT * FROM appointments WHERE id = ?',
      [appointmentId]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'Rendez-vous non trouvé' });
    }

    const appointment = appointments[0];

    // Seuls admin et le patient peuvent supprimer
    if (req.user.role !== 'admin' && req.user.id !== appointment.patient_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await db.query('DELETE FROM appointments WHERE id = ?', [appointmentId]);

    res.json({ message: 'Rendez-vous supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression rendez-vous:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;