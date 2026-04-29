CREATE DATABASE IF NOT EXISTS parelles_linguistiques;
USE parelles_linguistiques;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  cognoms VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin','voluntari','aprenent') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voluntaris (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  telefon VARCHAR(30) NOT NULL,
  parroquia VARCHAR(150) NOT NULL,
  data_naixement DATE NOT NULL,
  disponibilitat VARCHAR(255) NOT NULL,
  observacions TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS aprenents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  telefon VARCHAR(30) NOT NULL,
  parroquia VARCHAR(150) NOT NULL,
  data_naixement DATE NOT NULL,
  nivell_catala VARCHAR(30) NOT NULL,
  objectiu_principal VARCHAR(255) NOT NULL,
  pot_conversar ENUM('si','no') NOT NULL,
  disponibilitat VARCHAR(255) NOT NULL,
  observacions TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS parelles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  voluntari_id INT NOT NULL,
  aprenent_id INT NOT NULL,
  data_inici DATE NOT NULL,
  data_fi DATE,
  estat ENUM('activa','tancada','pausada') DEFAULT 'activa',
  observacions TEXT,
  INDEX idx_parelles_voluntari_estat (voluntari_id, estat),
  INDEX idx_parelles_aprenent_estat (aprenent_id, estat),
  INDEX idx_parelles_estat_data (estat, data_inici),
  FOREIGN KEY (voluntari_id) REFERENCES voluntaris(id),
  FOREIGN KEY (aprenent_id) REFERENCES aprenents(id)
);
