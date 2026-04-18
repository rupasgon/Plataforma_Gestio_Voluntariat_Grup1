const pool = require('../config/db');

exports.listAprenents = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         a.id,
         a.user_id,
         u.nom,
         u.cognoms,
         u.email,
         u.rol,
         a.telefon,
         a.parroquia,
         a.data_naixement,
         a.disponibilitat,
         a.observacions
       FROM aprenents a
       INNER JOIN users u ON u.id = a.user_id
       ORDER BY u.nom ASC, u.cognoms ASC`
    );

    res.json({
      message: 'Llistat d\'aprenents recuperat correctament.',
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.getAprenent = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
         a.id,
         a.user_id,
         u.nom,
         u.cognoms,
         u.email,
         u.rol,
         a.telefon,
         a.parroquia,
         a.data_naixement,
         a.disponibilitat,
         a.observacions
       FROM aprenents a
       INNER JOIN users u ON u.id = a.user_id
       WHERE a.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No s\'ha trobat l\'aprenent demanat.' });
    }

    res.json({
      message: 'Detall d\'aprenent recuperat correctament.',
      data: rows[0]
    });
  } catch (error) {
    next(error);
  }
};
