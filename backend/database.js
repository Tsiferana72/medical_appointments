const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'medical_appointments',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// En production, ajouter des options SSL si nécessaire
if (process.env.NODE_ENV === 'production' && process.env.DB_SSL === 'true') {
  dbConfig.ssl = {
    rejectUnauthorized: false
  };
}

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Tester la connexion
pool.getConnection()
  .then(connection => {
    console.log('✅ Connecté à MySQL avec succès');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;