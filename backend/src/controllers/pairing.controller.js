const pool = require('../config/db');

const ESTATS_VALIDS = ['activa', 'tancada', 'pausada'];

async function obtenirParella(executor, pairingId) {
  const [rows] = await executor.execute(
    `SELECT
       p.id,
       p.data_inici,
       p.data_fi,
       p.estat,
       p.observacions,
       p.voluntari_id,
       p.aprenent_id,
       uv.nom AS voluntari_nom,
       uv.cognoms AS voluntari_cognoms,
       ua.nom AS aprenent_nom,
       ua.cognoms AS aprenent_cognoms
     FROM parelles p
     INNER JOIN voluntaris v ON v.id = p.voluntari_id
     INNER JOIN aprenents a ON a.id = p.aprenent_id
     INNER JOIN users uv ON uv.id = v.user_id
     INNER JOIN users ua ON ua.id = a.user_id
     WHERE p.id = ?`,
    [pairingId]
  );

  return rows[0] || null;
}

exports.listPairings = async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.estat && ESTATS_VALIDS.includes(req.query.estat)) {
      conditions.push('p.estat = ?');
      params.push(req.query.estat);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.execute(
      `SELECT
         p.id,
         p.data_inici,
         p.data_fi,
         p.estat,
         p.observacions,
         p.voluntari_id,
         p.aprenent_id,
         CONCAT(uv.nom, ' ', uv.cognoms) AS voluntari_nom_complet,
         CONCAT(ua.nom, ' ', ua.cognoms) AS aprenent_nom_complet
       FROM parelles p
       INNER JOIN voluntaris v ON v.id = p.voluntari_id
       INNER JOIN aprenents a ON a.id = p.aprenent_id
       INNER JOIN users uv ON uv.id = v.user_id
       INNER JOIN users ua ON ua.id = a.user_id
       ${whereClause}
       ORDER BY p.data_inici DESC, p.id DESC`,
      params
    );

    res.json({
      message: 'Llistat de parelles recuperat correctament.',
      total: rows.length,
      data: rows
    });
  } catch (error) {
    next(error);
  }
};

exports.createPairing = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { voluntari_id, aprenent_id, data_inici, data_fi, estat, observacions } = req.body;

    if (!voluntari_id || !aprenent_id || !data_inici) {
      connection.release();
      return res.status(400).json({ message: 'Voluntari, aprenent i data d\'inici son obligatoris.' });
    }

    const estatNormalitzat = estat || 'activa';
    if (!ESTATS_VALIDS.includes(estatNormalitzat)) {
      connection.release();
      return res.status(400).json({ message: 'L\'estat indicat no es valid.' });
    }

    const [voluntariRows] = await connection.execute('SELECT id FROM voluntaris WHERE id = ?', [voluntari_id]);
    const [aprenentRows] = await connection.execute('SELECT id FROM aprenents WHERE id = ?', [aprenent_id]);

    if (voluntariRows.length === 0 || aprenentRows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'Cal indicar un voluntari i un aprenent existents.' });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO parelles (voluntari_id, aprenent_id, data_inici, data_fi, estat, observacions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [voluntari_id, aprenent_id, data_inici, data_fi || null, estatNormalitzat, observacions || null]
    );

    await connection.commit();
    connection.release();

    const parella = await obtenirParella(pool, result.insertId);

    res.status(201).json({
      message: 'Parella creada correctament.',
      data: parella
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};

exports.updatePairingStatus = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { estat, data_fi, observacions } = req.body;
    const pairingId = Number(req.params.id);

    if (!estat || !ESTATS_VALIDS.includes(estat)) {
      connection.release();
      return res.status(400).json({ message: 'Cal indicar un estat valid per a la parella.' });
    }

    const [rows] = await connection.execute('SELECT id FROM parelles WHERE id = ?', [pairingId]);
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No s\'ha trobat la parella indicada.' });
    }

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE parelles SET estat = ?, data_fi = ?, observacions = ? WHERE id = ?',
      [estat, data_fi || null, observacions || null, pairingId]
    );

    await connection.commit();
    connection.release();

    const parellaActualitzada = await obtenirParella(pool, pairingId);

    res.json({
      message: 'Estat de la parella actualitzat correctament.',
      data: parellaActualitzada
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};

exports.deletePairing = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const pairingId = Number(req.params.id);

    if (!Number.isInteger(pairingId) || pairingId <= 0) {
      connection.release();
      return res.status(400).json({ message: 'Cal indicar un identificador de parella valid.' });
    }

    const [rows] = await connection.execute('SELECT id FROM parelles WHERE id = ?', [pairingId]);
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No s ha trobat la parella indicada.' });
    }

    await connection.beginTransaction();
    await connection.execute('DELETE FROM parelles WHERE id = ?', [pairingId]);
    await connection.commit();
    connection.release();

    res.json({
      message: 'Parella eliminada correctament.'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    next(error);
  }
};
