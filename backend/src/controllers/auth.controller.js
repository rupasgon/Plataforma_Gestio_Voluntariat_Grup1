const pool = require('../config/db');
const { verifyPassword } = require('../utils/password');
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
