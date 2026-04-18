const pool = require('../config/db');

exports.llistarVoluntaris = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         v.id,
         v.user_id,
         u.nom,
         u.cognoms,
         u.email,
         u.rol,
         v.telefon,
         v.parroquia,
         v.data_naixement,
         v.disponibilitat,
         v.observacions
       FROM voluntaris v
       INNER JOIN users u ON u.id = v.user_id
       ORDER BY u.nom ASC, u.cognoms ASC`
    );

    res.json({
      message: 'Llistat de voluntaris recuperat correctament.',
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.obtenirVoluntari = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         v.id,
         v.user_id,
         u.nom,
         u.cognoms,
         u.email,
         u.rol,
         v.telefon,
         v.parroquia,
         v.data_naixement,
         v.disponibilitat,
         v.observacions
       FROM voluntaris v
       INNER JOIN users u ON u.id = v.user_id
       WHERE v.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No s\'ha trobat el voluntari demanat.' });
    }

    res.json({
      message: 'Detall de voluntari recuperat correctament.',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
