-- Créer la table users
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'patient',
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la table appointments
CREATE TABLE IF NOT EXISTS appointments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  doctor_id INT NOT NULL,
  appointment_date DATETIME NOT NULL,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES users(id),
  FOREIGN KEY (doctor_id) REFERENCES users(id)
);

-- Créer un admin par défaut
INSERT INTO users (username, email, password, full_name, role, phone)
VALUES (
  'admin',
  'admin@medical.com',
  '$2a$10$YourHashedPasswordHere',
  'Administrateur',
  'admin',
  '0000000000'
);
```

Connectez-vous à Railway MySQL via un client MySQL et exécutez ce script.

---

### **Phase 4 : Déployer le backend sur Railway**

#### **4.1 - Créer un nouveau service**
1. Dans votre projet Railway, cliquez "+ New"
2. Choisissez "GitHub Repo"
3. Sélectionnez votre repository
4. Choisissez le dossier `backend`

#### **4.2 - Configurer les variables d'environnement**
1. Cliquez sur votre service backend
2. Allez dans "Variables"
3. Ajoutez :
```
DB_HOST=votre_mysql_host_railway
DB_USER=votre_mysql_user_railway
DB_PASSWORD=votre_mysql_password_railway
DB_NAME=railway
DB_PORT=votre_mysql_port_railway
PORT=5000
JWT_SECRET=votre_secret_tres_long_et_securise_123456789
NODE_ENV=production
DB_SSL=false
```

#### **4.3 - Configurer le démarrage**
1. Dans "Settings"
2. Start Command: `node server.js`
3. Root Directory: `/backend`

#### **4.4 - Obtenir l'URL**
1. Allez dans "Settings"
2. Activez "Generate Domain"
3. Notez l'URL : `https://votre-backend.railway.app`

---

### **Phase 5 : Déployer le frontend sur Vercel**

#### **5.1 - Créer un compte Vercel**
1. Allez sur [vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub

#### **5.2 - Importer le projet**
1. Cliquez sur "Add New" → "Project"
2. Sélectionnez votre repository GitHub
3. Configurez :
   - Framework Preset: Create React App
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `build`

#### **5.3 - Ajouter les variables d'environnement**
1. Dans "Environment Variables", ajoutez :
```
REACT_APP_API_URL=https://votre-backend.railway.app