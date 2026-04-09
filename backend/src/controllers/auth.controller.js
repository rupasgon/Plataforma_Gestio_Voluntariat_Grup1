const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function normalitzarIdentificador(identificador = '') {
  return identificador.trim().toLowerCase();
}

function crearToken(user) {
  return jwt.sign(
    { sub: user.id, rol: user.rol, email: user.email, nom: user.nom, cognoms: user.cognoms },
    process.env.JWT_SECRET || 'canvia-aquest-secret-en-produccio',
    { expiresIn: '8h' }
  );
}

exports.login = async (req, res) => {
  const identificador = normalitzarIdentificador(req.body.identificador);
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!identificador || !password) {
    return res.status(400).json({
      message: 'Cal indicar l usuari o correu electronic i la contrasenya.'
    });
  }

  try {
    const [rows] = await pool.query(
      `
        SELECT id, nom, cognoms, email, password, rol
        FROM users
        WHERE LOWER(email) = ?
          OR LOWER(SUBSTRING_INDEX(email, '@', 1)) = ?
        LIMIT 1
      `,
      [identificador, identificador]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'Credencials incorrectes.' });
    }

    const user = rows[0];
    const passwordCorrecta = await bcrypt.compare(password, user.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ message: 'Credencials incorrectes.' });
    }

    const token = crearToken(user);

    return res.json({
      message: 'Login correcte.',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        cognoms: user.cognoms,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: 'No s ha pogut validar l autenticacio ara mateix.',
      detail: error.code || error.message
    });
  }
};

exports.logout = (_req, res) => {
  res.json({ message: 'Logout correcte.' });
};
