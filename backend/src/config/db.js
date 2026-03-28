// Configuracio de base de dades (pendent de connexio real a MySQL).
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'parelles_linguistiques',
  port: process.env.DB_PORT || 3306
};
