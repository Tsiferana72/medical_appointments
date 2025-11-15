const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importer les routes
const authRoutes = require('./routes/auth');
const appointmentsRoutes = require('./routes/appointments');
const usersRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: '🏥 API Système de Rendez-vous Médicaux',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/appointments',
      '/api/users',
      '/api/admin'
    ]
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});