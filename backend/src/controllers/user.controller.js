const pool = require('../config/db');
const { hashPassword } = require('../utils/password');
const { obtenirUsuariAmbPerfil, sincronitzarPerfilUsuari } = require('../utils/user-profile');

const ROLS_VALIDS = ['admin', 'voluntari', 'aprenent'];

function construirFiltreUsers(req) {
  const conditions = [];
  const params = [];

  if (req.query.rol && ROLS_VALIDS.includes(req.query.rol)) {
    conditions.push('u.rol = ?');
    params.push(req.query.rol);
  }

  if (req.query.search) {
    conditions.push('(u.nom LIKE ? OR u.cognoms LIKE ? OR u.email LIKE ?)');
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }

  return {
    whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
}

exports.listUsers = async (req, res, next) => {
  try {
    const { whereClause, params } = construirFiltreUsers(req);
    const [rows] = await pool.execute(
      `SELECT
         u.id,
         u.nom,
         u.cognoms,
         u.email,
         u.rol,
         u.created_at,
         u.updated_at,
         CASE
           WHEN u.rol = 'voluntari' THEN v.telefon
           WHEN u.rol = 'aprenent' THEN a.telefon
           ELSE NULL
         END AS telefon,
         CASE
           WHEN u.rol = 'voluntari' THEN v.parroquia
           WHEN u.rol = 'aprenent' THEN a.parroquia
           ELSE NULL
         END AS parroquia,
         CASE
           WHEN u.rol = 'voluntari' THEN v.disponibilitat
           WHEN u.rol = 'aprenent' THEN a.disponibilitat
           ELSE NULL
         END AS disponibilitat
       FROM users u
       LEFT JOIN voluntaris v ON v.user_id = u.id
       LEFT JOIN aprenents a ON a.user_id = u.id
       ${whereClause}
       ORDER BY u.created_at DESC, u.id DESC`,
      params
    );

    res.json({
      message: 'Llistat d\'usuaris recuperat correctament.',
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const usuari = await obtenirUsuariAmbPerfil(pool, req.params.id);

    if (!usuari) {
      return res.status(404).json({ message: 'No s\'ha trobat l\'usuari demanat.' });
    }

    res.json({
      message: 'Detall d\'usuari recuperat correctament.',
      data: usuari
    });
  } catch (error) {
    next(error);
  }
};

exports.createUser = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { nom, cognoms, email, password, rol } = req.body;
    const emailNormalitzat = String(email || '').trim().toLowerCase();

    if (!nom || !cognoms || !emailNormalitzat || !password || !rol) {
      connection.release();
      return res.status(400).json({ message: 'Nom, cognoms, correu electronic, contrasenya i rol son obligatoris.' });
    }

    if (!ROLS_VALIDS.includes(rol)) {
      connection.release();
      return res.status(400).json({ message: 'El rol indicat no es valid.' });
    }

    const [duplicats] = await connection.execute('SELECT id FROM users WHERE email = ?', [emailNormalitzat]);
    if (duplicats.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Ja existeix un usuari amb aquest correu electronic.' });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      'INSERT INTO users (nom, cognoms, email, password, rol) VALUES (?, ?, ?, ?, ?)',
      [String(nom).trim(), String(cognoms).trim(), emailNormalitzat, hashPassword(password), rol]
    );

    await sincronitzarPerfilUsuari(connection, result.insertId, rol, req.body);
    await connection.commit();
    connection.release();

    const usuariCreat = await obtenirUsuariAmbPerfil(pool, result.insertId);

    res.status(201).json({
      message: 'Usuari creat correctament.',
      data: usuariCreat
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const userId = Number(req.params.id);
    const { nom, cognoms, email, password, rol } = req.body;
    const emailNormalitzat = String(email || '').trim().toLowerCase();

    if (!nom || !cognoms || !emailNormalitzat || !rol) {
      connection.release();
      return res.status(400).json({ message: 'Nom, cognoms, correu electronic i rol son obligatoris.' });
    }

    if (!ROLS_VALIDS.includes(rol)) {
      connection.release();
      return res.status(400).json({ message: 'El rol indicat no es valid.' });
    }

    const [existents] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
    if (existents.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No s\'ha trobat l\'usuari que es vol actualitzar.' });
    }

    const [duplicats] = await connection.execute('SELECT id FROM users WHERE email = ? AND id <> ?', [emailNormalitzat, userId]);
    if (duplicats.length > 0) {
      connection.release();
      return res.status(409).json({ message: 'Ja existeix un usuari amb aquest correu electronic.' });
    }

    await connection.beginTransaction();

    if (password) {
      await connection.execute(
        'UPDATE users SET nom = ?, cognoms = ?, email = ?, password = ?, rol = ? WHERE id = ?',
        [String(nom).trim(), String(cognoms).trim(), emailNormalitzat, hashPassword(password), rol, userId]
      );
    } else {
      await connection.execute(
        'UPDATE users SET nom = ?, cognoms = ?, email = ?, rol = ? WHERE id = ?',
        [String(nom).trim(), String(cognoms).trim(), emailNormalitzat, rol, userId]
      );
    }

    await sincronitzarPerfilUsuari(connection, userId, rol, req.body);
    await connection.commit();
    connection.release();

    const usuariActualitzat = await obtenirUsuariAmbPerfil(pool, userId);

    res.json({
      message: 'Usuari actualitzat correctament.',
      data: usuariActualitzat
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};
