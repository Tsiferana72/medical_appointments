import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Users({ user, onLogout }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('/users/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la récupération des docteurs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">🏥 Medical App</div>
        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">Tableau de bord</Link>
          <Link to="/appointments" className="navbar-link">Rendez-vous</Link>
          {user.role === 'patient' && (
            <Link to="/users" className="navbar-link active">Docteurs</Link>
          )}
          {user.role === 'admin' && (
            <Link to="/admin" className="navbar-link">Administration</Link>
          )}
          <button onClick={onLogout} className="btn-logout">Déconnexion</button>
        </div>
      </nav>

      <div className="main-content">
        <div className="page-header">
          <h1>👨‍⚕️ Liste des Docteurs</h1>
          <p>Découvrez nos médecins disponibles</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="card">
          <h2 className="card-title">Nos Médecins</h2>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Chargement...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👨‍⚕️</div>
              <h3>Aucun docteur disponible</h3>
              <p>Il n'y a pas de docteurs enregistrés pour le moment</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  style={{
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#667eea';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: 'white',
                        marginRight: '1rem'
                      }}
                    >
                      👨‍⚕️
                    </div>
                    <div>
                      <h3 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>
                        Dr. {doctor.name}
                      </h3>
                      <span className="badge badge-doctor" style={{ marginTop: '0.3rem' }}>
                        Médecin
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.95rem' }}>
                      <strong>📧 Email:</strong> {doctor.email}
                    </p>
                    {doctor.phone && (
                      <p style={{ margin: '0.5rem 0', color: '#666', fontSize: '0.95rem' }}>
                        <strong>📞 Téléphone:</strong> {doctor.phone}
                      </p>
                    )}
                  </div>

                  <Link to="/appointments">
                    <button className="btn btn-primary" style={{ width: '100%' }}>
                      📅 Prendre rendez-vous
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;