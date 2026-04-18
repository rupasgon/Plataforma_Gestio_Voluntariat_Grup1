const pool = require('../config/db');

exports.getDashboard = async (req, res, next) => {
  try {
    const [[usersResult], [pairingsResult], [activePairingsResult], [lastUsers]] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS total FROM users'),
      pool.execute('SELECT COUNT(*) AS total FROM parelles'),
      pool.execute('SELECT COUNT(*) AS total FROM parelles WHERE estat = "activa"'),
      pool.execute(
        `SELECT id, nom, cognoms, email, rol, created_at
         FROM users
         ORDER BY created_at DESC, id DESC
         LIMIT 5`
      )
    ]);

    res.json({
      message: 'Resum del portal d\'administracio recuperat correctament.',
      data: {
        usuarisTotals: usersResult[0].total,
        parellesTotals: pairingsResult[0].total,
        parellesActives: activePairingsResult[0].total,
        ultimsUsuaris: lastUsers
      }
    });
  } catch (error) {
    next(error);
  }
};
