import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function AdminPanel({ user, onLogout }) {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'patient',
    phone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersResponse, statsResponse] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/admin/stats')
      ]);
      setUsers(usersResponse.data);
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la récupération des données');
    } finally {
      setLoading(false);
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
      if (editingUser) {
        await axios.put(`/admin/users/${editingUser.id}`, {
          name: formData.name,
          role: formData.role,
          phone: formData.phone
        });
        setSuccess('Utilisateur mis à jour avec succès');
      } else {
        await axios.post('/admin/users', formData);
        setSuccess('Utilisateur créé avec succès');
      }
      setShowModal(false);
      setFormData({ email: '', password: '', name: '', role: 'patient', phone: '' });
      setEditingUser(null);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    }
  };

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit);
    setFormData({
      email: userToEdit.email,
      password: '',
      name: userToEdit.name,
      role: userToEdit.role,
      phone: userToEdit.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Tous ses rendez-vous seront également supprimés.')) {
      return;
    }

    try {
      await axios.delete(`/admin/users/${userId}`);
      setSuccess('Utilisateur supprimé avec succès');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">🏥 Medical App</div>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Tableau de bord</Link>
          <Link to="/appointments" className="navbar-link">Rendez-vous</Link>
          <Link to="/admin" className="navbar-link active">Administration</Link>
          <button onClick={onLogout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h1>⚙️ Panel Administrateur</h1>
          <p>Gérez les utilisateurs et le système</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">👥</div>
                  <div className="stat-content">
                    <h3>{stats.total_users}</h3>
                    <p>Utilisateurs totaux</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">📅</div>
                  <div className="stat-content">
                    <h3>{stats.total_appointments}</h3>
                    <p>Rendez-vous totaux</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">⏳</div>
                  <div className="stat-content">
                    <h3>{stats.pending_appointments}</h3>
                    <p>En attente</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon purple">👨‍⚕️</div>
                  <div className="stat-content">
                    <h3>{stats.total_doctors}</h3>
                    <p>Docteurs actifs</p>
                  </div>
                </div>
              </div>
            )}

            {/* Gestion des utilisateurs */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 className="card-title" style={{ marginBottom: 0 }}>Gestion des Utilisateurs</h2>
                <button
                  onClick={() => {
                    setShowModal(true);
                    setEditingUser(null);
                    setFormData({ email: '', password: '', name: '', role: 'patient', phone: '' });
                  }}
                  className="btn btn-primary"
                >
                  ➕ Nouvel Utilisateur
                </button>
              </div>

              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Email</th>
                      <th>Téléphone</th>
                      <th>Rôle</th>
                      <th>Date d'inscription</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.name}</td>
                        <td>{u.email}</td>
                        <td>{u.phone || '-'}</td>
                        <td>
                          <span className={`badge badge-${u.role}`}>
                            {u.role === 'patient' && '🧑 Patient'}
                            {u.role === 'doctor' && '👨‍⚕️ Docteur'}
                            {u.role === 'admin' && '⚙️ Admin'}
                          </span>
                        </td>
                        <td>{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                        <td>
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(u)}
                              className="btn btn-secondary btn-sm"
                            >
                              ✏️ Modifier
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleDelete(u.id)}
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
            </div>
          </>
        )}
      </div>

      {/* Modal pour créer/modifier un utilisateur */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)} className="btn-close">×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nom complet *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Jean Dupont"
                />
              </div>

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="form-group">
                    <label>Mot de passe *</label>
                    <input
                      type="password"
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="••••••••"
                      minLength="6"
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Téléphone</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+261 34 00 000 00"
                />
              </div>

              <div className="form-group">
                <label>Rôle *</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Docteur</option>
                  <option value="admin">Administrateur</option>
                </select>
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
                  {editingUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;