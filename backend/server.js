const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialiser Express EN PREMIER
const app = express();

// Configuration CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  process.env.FRONTEND_URL
].filter(Boolean); // Enlève les valeurs undefined

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (comme Postman, curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import des routes
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const appointmentsRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/admin', adminRoutes);

// Route de test
app.get('/', (req, res) => {
  res.json({ 
    message: 'API Medical Appointments',
    version: '1.0.0',
    status: 'running'
  });
});

// Route de santé pour le monitoring
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur globale:', err);
  res.status(500).json({ 
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Une erreur est survenue'
  });
});

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('🚀 Serveur démarré sur le port', PORT);
  console.log('📍 URL:', `http://localhost:${PORT}`);
  console.log('🌍 Environnement:', process.env.NODE_ENV || 'development');
});