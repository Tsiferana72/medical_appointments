import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'patient'
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

     try {
      if (isRegister) {
        // Inscription
        await axios.post('/auth/register', formData);
        setSuccess('Inscription réussie ! Vous pouvez maintenant vous connecter.');
        setIsRegister(false);
        setFormData({ email: '', password: '', name: '', phone: '', role: 'patient' });
      } else {
        // Connexion
        const response = await axios.post('/auth/login', {
          email: formData.email,
          password: formData.password
        });

        onLogin(response.data.token, response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
        <h1 className="card-title" style={{ textAlign: 'center', color: '#667eea' }}>
          🏥 Rendez-vous Médicaux
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#777' }}>
          {isRegister ? 'Créer un compte' : 'Connectez-vous à votre compte'}
        </p>

         {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <div className="form-group">
                <label>Nom complet</label>
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
                <label>Rôle</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Docteur</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label>Mot de passe</label>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Chargement...' : isRegister ? 'S\'inscrire' : 'Se connecter'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
              setSuccess('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#667eea',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister
              ? 'Vous avez déjà un compte ? Se connecter'
              : 'Pas de compte ? S\'inscrire'}
          </button>
        </div>

        {!isRegister && (
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
              <strong>Compte de test :</strong>
            </p>
            <p style={{ fontSize: '0.85rem', color: '#666', margin: 0 }}>
              Email: admin@medical.com<br />
              Mot de passe: admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;