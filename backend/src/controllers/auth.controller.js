const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { hashPassword } = require('../utils/password');
const { sincronitzarPerfilUsuari } = require('../utils/user-profile');

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

function correuElectronicValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.register = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { nom, cognoms, email, password, rol, telefon, parroquia, data_naixement, disponibilitat, observacions } = req.body;
    const correuNormalitzat = String(email || '').trim().toLowerCase();

    if (!nom || !cognoms || !correuNormalitzat || !password || !rol) {
      connection.release();
      return res.status(400).json({ message: 'Nom, cognoms, correu electronic, contrasenya i rol son obligatoris.' });
    }

    if (!['voluntari', 'aprenent'].includes(rol)) {
      connection.release();
      return res.status(400).json({ message: 'El rol de registre public ha de ser voluntari o aprenent.' });
    }

    if (!correuElectronicValid(correuNormalitzat)) {
      connection.release();
      return res.status(400).json({ message: 'Cal informar un correu electronic valid.' });
    }

    if (String(password).trim().length < 6) {
      connection.release();
      return res.status(400).json({ message: 'La contrasenya ha de tenir minim 6 caracters.' });
    }

    const [duplicats] = await connection.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [correuNormalitzat]);
    if (duplicats.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Ja existeix un usuari amb aquest correu electronic.' });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO users (nom, cognoms, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [String(nom).trim(), String(cognoms).trim(), correuNormalitzat, hashPassword(password), rol]
    );

    await sincronitzarPerfilUsuari(connection, result.insertId, rol, {
      telefon,
      parroquia,
      data_naixement,
      disponibilitat,
      observacions
    });

    await connection.commit();
    connection.release();

    return res.status(201).json({
      message: 'Registre completat correctament. Ara ja pots iniciar sessio.',
      data: {
        id: result.insertId,
        nom: String(nom).trim(),
        cognoms: String(cognoms).trim(),
        email: correuNormalitzat,
        rol
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    return res.status(500).json({
      message: 'No s ha pogut completar el registre ara mateix.',
      detail: error.code || error.message
    });
  }
};

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

exports.me = (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'La sessio no es valida o ha expirat.' });
  }

  return res.json({ user: req.user });
};
