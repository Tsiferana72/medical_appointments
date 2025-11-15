const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetAdminPassword() {
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

    // Afficher les admins existants
    const [admins] = await connection.execute(
      'SELECT id, email, username, role FROM users WHERE role = ?',
      ['admin']
    );

    console.log('\n📋 Administrateurs trouvés:');
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ID: ${admin.id} | Email: ${admin.email} | Username: ${admin.username}`);
    });

    // Choisir l'email de l'admin à modifier
    const adminEmail = 'admin@medical.com'; // ⬅️ CHANGEZ ICI
    const newPassword = 'Admin123!';        // ⬅️ CHANGEZ ICI

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, adminEmail]
    );

    if (result.affectedRows === 0) {
      console.log('\n❌ Aucun utilisateur trouvé avec cet email');
    } else {
      console.log('\n✓ Mot de passe réinitialisé avec succès !');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:', adminEmail);
      console.log('Nouveau mot de passe:', newPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

  } catch (error) {
    console.error('✗ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Connexion fermée');
    }
  }
}

resetAdminPassword();