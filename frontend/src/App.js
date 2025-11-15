import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Users from './pages/Users';
import AdminPanel from './pages/AdminPanel';

// Configuration axios
axios.defaults.baseURL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si un token existe au chargement
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const response = await axios.get('/auth/verify');
      setUser(response.data.user);
    } catch (error) {
      console.error('Token invalide:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

   if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

   return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
             }
        />
        <Route
          path="/appointments"
          element={
            user ? <Appointments user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/users"
          element={
            user ? <Users user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin"
          element={
            user && user.role === 'admin' ? (
              <AdminPanel user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}
export default App;
