import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Appointments({ user, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [formData, setFormData] = useState({
    doctor_id: '',
    appointment_date: '',
    reason: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchAppointments();
    if (user.role === 'patient') {
      fetchDoctors();
    }
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await axios.get('/appointments');
      setAppointments(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la récupération des rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/users/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingAppointment) {
        await axios.put(`/appointments/${editingAppointment.id}`, formData);
        setSuccess('Rendez-vous mis à jour avec succès');
      } else {
        await axios.post('/appointments', formData);
        setSuccess('Rendez-vous créé avec succès');
      }
      setShowModal(false);
      setFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '' });
      setEditingAppointment(null);
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleEdit = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      doctor_id: appointment.doctor_id,
      appointment_date: new Date(appointment.appointment_date).toISOString().slice(0, 16),
      reason: appointment.reason || '',
      notes: appointment.notes || ''
    });
    setShowModal(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await axios.put(`/appointments/${id}`, { status: newStatus });
      setSuccess('Statut mis à jour');
      fetchAppointments();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) return;

    try {
      await axios.delete(`/appointments/${id}`);
      setSuccess('Rendez-vous supprimé');
      fetchAppointments();
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">🏥 Medical App</div>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Tableau de bord</Link>
          <Link to="/appointments" className="navbar-link active">Rendez-vous</Link>
          {user.role === 'patient' && (
            <Link to="/users" className="navbar-link">Docteurs</Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" className="navbar-link">Administration</Link>
          )}
          <button onClick={onLogout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h1>📅 Gestion des Rendez-vous</h1>
          <p>Consultez et gérez vos rendez-vous médicaux</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="card">
          <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom:'1.5rem' 
            }}
        >
            <h2 className="card-title" style={{ marginBottom: 0 }}>
                Mes Rendez-vous
            </h2>
            
            {user.role === 'patient' && (
                <button
                onClick={() => {
                    setShowModal(true);
                    setEditingAppointment(null);
                    setFormData({ doctor_id: '', appointment_date: '', reason: '', notes: '' });
                }}
                className="btn btn-primary"
                >
                    ➕ Nouveau Rendez-vous
                    </button>
                )}
                </div>
                {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Chargement...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <h3>Aucun rendez-vous</h3>
          <p>Vous n'avez pas encore de rendez-vous</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date et Heure</th>
                {user.role !== 'patient' && <th>Patient</th>}
                {user.role !== 'doctor' && <th>Docteur</th>}
                <th>Motif</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td>{new Date(apt.appointment_date).toLocaleString('fr-FR')}</td>
                  {user.role !== 'patient' && (
                    <td>
                      {apt.patient_name}
                      <br />
                      <small style={{ color: '#999' }}>{apt.patient_email}</small>
                    </td>
                  )}
                  {user.role !== 'doctor' && (
                    <td>
                      {apt.doctor_name}
                      <br />
                      <small style={{ color: '#999' }}>{apt.doctor_email}</small>
                    </td>
                  )}
                  <td>{apt.reason || '-'}</td>
                  <td>
                    <span className={`badge badge-${apt.status}`}>
                      {apt.status === 'pending' && 'En attente'}
                      {apt.status === 'confirmed' && 'Confirmé'}
                      {apt.status === 'cancelled' && 'Annulé'}
                      {apt.status === 'completed' && 'Terminé'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'doctor' && apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(apt.id, 'confirmed')}
                            className="btn btn-success btn-sm"
                          >
                            ✓ Confirmer
                          </button>
                          <button
                            onClick={() => handleStatusChange(apt.id, 'cancelled')}
                            className="btn btn-danger btn-sm"
                          >
                            ✗ Annuler
                          </button>
                        </>
                      )}
                      {user.role === 'doctor' && apt.status === 'confirmed' && (
                        <button
                          onClick={() => handleStatusChange(apt.id, 'completed')}
                          className="btn btn-success btn-sm"
                        >
                          ✓ Terminer
                        </button>
                      )}
                      {user.role === 'patient' && apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleEdit(apt)}
                            className="btn btn-secondary btn-sm"
                          >
                            ✏️ Modifier
                          </button>
                          <button
                            onClick={() => handleDelete(apt.id)}
                            className="btn btn-danger btn-sm"
                          >
                            🗑️ Supprimer
                          </button>
                        </>
                      )}
                      {user.role === 'admin' && (
                        <button
                          onClick={() => handleDelete(apt.id)}
                          className="btn btn-danger btn-sm"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>

  {/* Modal pour créer/modifier un rendez-vous */}
  {showModal && (
    <div className="modal-overlay" onClick={() => setShowModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {editingAppointment ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}
          </h2>
          <button onClick={() => setShowModal(false)} className="btn-close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Docteur *</label>
            <select
              name="doctor_id"
              className="form-control"
              value={formData.doctor_id}
              onChange={handleChange}
              required
            >
              <option value="">Sélectionner un docteur</option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date et Heure *</label>
            <input
              type="datetime-local"
              name="appointment_date"
              className="form-control"
              value={formData.appointment_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div className="form-group">
            <label>Motif de consultation</label>
            <textarea
              name="reason"
              className="form-control"
              value={formData.reason}
              onChange={handleChange}
              rows="3"
              placeholder="Décrivez brièvement le motif de votre consultation..."
            ></textarea>
          </div>

          <div className="form-group">
            <label>Notes supplémentaires</label>
            <textarea
              name="notes"
              className="form-control"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              placeholder="Informations complémentaires..."
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingAppointment ? 'Mettre à jour' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>
  );
}

export default Appointments;
