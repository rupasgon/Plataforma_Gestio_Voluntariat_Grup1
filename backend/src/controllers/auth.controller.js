const pool = require('../config/db');
const { hashPassword, verifyPassword } = require('../utils/password');
const { sincronitzarPerfilUsuari } = require('../utils/user-profile');
const { createSession, deleteSession, getSession } = require('../utils/session-store');

function correuElectronicValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function construirRespostaUsuari(row) {
  return {
    id: row.id,
    nom: row.nom,
    cognoms: row.cognoms,
    email: row.email,
    rol: row.rol
  };
}

function obtenirRedireccioPerRol(rol) {
  if (rol === 'admin') {
    return '/frontend/pages/admin.html';
  }

  return '/frontend/pages/profile.html';
}

exports.register = async (req, res, next) => {
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
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password, recordarSessio } = req.body;
    const correuNormalitzat = String(email || '').trim().toLowerCase();

    if (!correuNormalitzat || !password) {
      return res.status(400).json({ message: 'Cal informar el correu electronic i la contrasenya.' });
    }

    if (!correuElectronicValid(correuNormalitzat)) {
      return res.status(400).json({ message: 'Cal informar un correu electronic valid.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, nom, cognoms, email, password, rol FROM users WHERE email = ?',
      [correuNormalitzat]
    );

    const user = rows[0];
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ message: 'Credencials incorrectes.' });
    }

    const session = createSession(construirRespostaUsuari(user), Boolean(recordarSessio));

    res.json({
      message: 'Inici de sessio correcte.',
      token: session.token,
      expiresAt: session.expiresAt,
      redirectTo: obtenirRedireccioPerRol(user.rol),
      user: session.user
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : req.sessionToken;

  if (token) {
    deleteSession(token);
  }

  res.json({ message: 'Sessio tancada correctament.' });
};

exports.me = (req, res) => {
  const session = getSession(req.sessionToken);

  if (!session) {
    return res.status(401).json({ message: 'La sessio no es valida o ha caducat.' });
  }

  res.json({ user: session.user, expiresAt: session.expiresAt });
};
