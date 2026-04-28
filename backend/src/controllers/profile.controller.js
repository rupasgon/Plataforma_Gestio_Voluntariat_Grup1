const pool = require('../config/db');
const { obtenirUsuariAmbPerfil, sincronitzarPerfilUsuari } = require('../utils/user-profile');

function correuElectronicValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

exports.getMyProfile = async (req, res, next) => {
  try {
    const perfil = await obtenirUsuariAmbPerfil(pool, req.user.id);

    if (!perfil) {
      return res.status(404).json({ message: 'No s ha trobat el perfil de l usuari.' });
    }

    return res.json({
      message: 'Perfil recuperat correctament.',
      data: perfil
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateMyProfile = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { nom, cognoms, email, telefon, parroquia, data_naixement, disponibilitat, observacions } = req.body;
    const emailNormalitzat = String(email || '').trim().toLowerCase();

    if (!nom || !cognoms || !emailNormalitzat) {
      connection.release();
      return res.status(400).json({ message: 'Nom, cognoms i correu electronic son obligatoris.' });
    }

    if (!correuElectronicValid(emailNormalitzat)) {
      connection.release();
      return res.status(400).json({ message: 'Cal informar un correu electronic valid.' });
    }

    await connection.beginTransaction();

    const [duplicats] = await connection.execute(
      'SELECT id FROM users WHERE email = ? AND id <> ?',
      [emailNormalitzat, req.user.id]
    );

    if (duplicats.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ message: 'Ja existeix un usuari amb aquest correu electronic.' });
    }

    await connection.execute(
      'UPDATE users SET nom = ?, cognoms = ?, email = ? WHERE id = ?',
      [String(nom).trim(), String(cognoms).trim(), emailNormalitzat, req.user.id]
    );

    await sincronitzarPerfilUsuari(connection, req.user.id, req.user.rol, {
      telefon,
      parroquia,
      data_naixement,
      disponibilitat,
      observacions
    });

    await connection.commit();
    connection.release();

    const perfilActualitzat = await obtenirUsuariAmbPerfil(pool, req.user.id);

    return res.json({
      message: 'Perfil actualitzat correctament.',
      data: perfilActualitzat
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    return next(error);
  }
};
