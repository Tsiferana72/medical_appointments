import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Récupérer les statistiques pour les admins
      if (user.role === 'admin') {
        const statsResponse = await axios.get('/admin/stats');
        setStats(statsResponse.data);
      }

      // Récupérer les derniers rendez-vous
      const appointmentsResponse = await axios.get('/appointments');
      setRecentAppointments(appointmentsResponse.data.slice(0, 5));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">🏥 Medical App</div>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link active">Tableau de bord</Link>
          <Link to="/appointments" className="navbar-link">Rendez-vous</Link>
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
          <h1>{getGreeting()}, {user.name} !</h1>
          <p>Bienvenue sur votre tableau de bord</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Chargement...</p>
          </div>
        ) : (
          <>
            {user.role === 'admin' && stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon blue">👥</div>
                  <div className="stat-content">
                    <h3>{stats.total_users}</h3>
                    <p>Utilisateurs</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon green">📅</div>
                  <div className="stat-content">
                    <h3>{stats.total_appointments}</h3>
                    <p>Rendez-vous</p>
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
                    <p>Docteurs</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="card-title">Rendez-vous récents</h2>
              {recentAppointments.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📅</div>
                  <h3>Aucun rendez-vous</h3>
                  <p>Vous n'avez pas encore de rendez-vous</p>
                  {user.role === 'patient' && (
                    <Link to="/appointments" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                      Prendre un rendez-vous
                    </Link>
                  )}
                </div>
              ) : (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        {user.role !== 'patient' && <th>Patient</th>}
                        {user.role !== 'doctor' && <th>Docteur</th>}
                        <th>Statut</th>
                        <th>Motif</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppointments.map((apt) => (
                        <tr key={apt.id}>
                          <td>{new Date(apt.appointment_date).toLocaleString('fr-FR')}</td>
                          {user.role !== 'patient' && <td>{apt.patient_name}</td>}
                          {user.role !== 'doctor' && <td>{apt.doctor_name}</td>}
                          <td>
                            <span className={`badge badge-${apt.status}`}>
                              {apt.status === 'pending' && 'En attente'}
                              {apt.status === 'confirmed' && 'Confirmé'}
                              {apt.status === 'cancelled' && 'Annulé'}
                              {apt.status === 'completed' && 'Terminé'}
                            </span>
                          </td>
                          <td>{apt.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {recentAppointments.length > 0 && (
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Link to="/appointments" className="btn btn-secondary">
                    Voir tous les rendez-vous
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;