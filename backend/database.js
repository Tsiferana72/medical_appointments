const mysql = require('mysql2');
require('dotenv').config();

// Créer un pool de connexions
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Utiliser les promesses
const promisePool = pool.promise();

// Tester la connexion
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base de données:', err.message);
    return;
  }
  console.log('✅ Connecté à MySQL avec succès');
  connection.release();
});

module.exports = promisePool;