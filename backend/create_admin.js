const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
  let connection;
  
  try {
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'medical_appointments'
    });
    
    console.log('✓ Connecté à MySQL');

    // Données de l'administrateur
    const adminData = {
      username: 'admin',
      email: 'admin@medical.com',
      password: 'Admin123!',
      full_name: 'Administrateur Système',
      role: 'admin',
      phone: '0000000000'
    };

    // Vérifier si l'admin existe déjà
    const [existingUsers] = await connection.execute(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [adminData.email, adminData.username]
    );

    if (existingUsers.length > 0) {
      console.log('⚠ Un administrateur avec cet email ou username existe déjà');
      console.log('\nUtilisateur(s) trouvé(s):');
      existingUsers.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}, Username: ${user.username}, Role: ${user.role}`);
      });
      return;
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminData.password, salt);

    // Créer l'administrateur
    await connection.execute(
      'INSERT INTO users (username, email, password, full_name, role, phone, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
      [
        adminData.username,
        adminData.email,
        hashedPassword,
        adminData.full_name,
        adminData.role,
        adminData.phone
      ]
    );

    console.log('\n✓ Administrateur créé avec succès !');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:', adminData.email);
    console.log('Mot de passe:', adminData.password);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('⚠ Changez ce mot de passe après la première connexion !');

  } catch (error) {
    console.error('✗ Erreur:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 La table "users" n\'existe pas.');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 La base de données n\'existe pas.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Vérifiez vos identifiants MySQL dans le fichier .env');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✓ Connexion fermée');
    }
  }
}

createAdmin();