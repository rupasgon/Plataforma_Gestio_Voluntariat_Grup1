const pool = require('../config/db');

const ESTATS_VALIDS = ['activa', 'tancada', 'pausada'];
const ESTATS_OBERTS = ['activa', 'pausada'];

function normalitzarText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text === '' ? null : text;
}

function validarIdPositiu(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function esDataValida(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}

function dataAvuiISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDataSQL(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function normalitzarDadesParella(payload = {}) {
  const estat = payload.estat || 'activa';
  const dataFi = payload.data_fi || null;

  return {
    voluntari_id: validarIdPositiu(payload.voluntari_id),
    aprenent_id: validarIdPositiu(payload.aprenent_id),
    data_inici: payload.data_inici,
    data_fi: estat === 'tancada' ? dataFi || dataAvuiISO() : dataFi,
    estat,
    observacions: normalitzarText(payload.observacions)
  };
}

function validarDadesParella(dades) {
  if (!dades.voluntari_id || !dades.aprenent_id || !dades.data_inici) {
    return 'Voluntari, aprenent i data d inici son obligatoris.';
  }

  if (!esDataValida(dades.data_inici)) {
    return 'La data d inici no es valida.';
  }

  if (dades.data_fi && !esDataValida(dades.data_fi)) {
    return 'La data de finalitzacio no es valida.';
  }

  if (dades.data_fi && dades.data_fi < dades.data_inici) {
    return 'La data de finalitzacio no pot ser anterior a la data d inici.';
  }

  if (!ESTATS_VALIDS.includes(dades.estat)) {
    return 'L estat indicat no es valid.';
  }

  return null;
}

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
       uv.email AS voluntari_email,
       ua.nom AS aprenent_nom,
       ua.cognoms AS aprenent_cognoms,
       ua.email AS aprenent_email,
       CONCAT(uv.nom, ' ', uv.cognoms) AS voluntari_nom_complet,
       CONCAT(ua.nom, ' ', ua.cognoms) AS aprenent_nom_complet,
       v.disponibilitat AS voluntari_disponibilitat,
       a.disponibilitat AS aprenent_disponibilitat
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

async function comprovarParticipantsDisponibles(connection, dades, pairingIdExclos = null) {
  const [voluntariRows] = await connection.execute(
    `SELECT v.id, u.nom, u.cognoms
     FROM voluntaris v
     INNER JOIN users u ON u.id = v.user_id
     WHERE v.id = ?`,
    [dades.voluntari_id]
  );
  const [aprenentRows] = await connection.execute(
    `SELECT a.id, u.nom, u.cognoms
     FROM aprenents a
     INNER JOIN users u ON u.id = a.user_id
     WHERE a.id = ?`,
    [dades.aprenent_id]
  );

  if (voluntariRows.length === 0 || aprenentRows.length === 0) {
    return { status: 404, message: 'Cal indicar un voluntari i un aprenent existents.' };
  }

  if (!ESTATS_OBERTS.includes(dades.estat)) {
    return null;
  }

  const paramsVoluntari = [dades.voluntari_id, ESTATS_OBERTS];
  const paramsAprenent = [dades.aprenent_id, ESTATS_OBERTS];
  let filtreExclos = '';

  if (pairingIdExclos) {
    filtreExclos = 'AND id <> ?';
    paramsVoluntari.push(pairingIdExclos);
    paramsAprenent.push(pairingIdExclos);
  }

  const [parellesVoluntari] = await connection.query(
    `SELECT id FROM parelles WHERE voluntari_id = ? AND estat IN (?) ${filtreExclos} LIMIT 1`,
    paramsVoluntari
  );

  if (parellesVoluntari.length > 0) {
    return { status: 409, message: 'Aquest voluntari ja te una parella activa o pausada.' };
  }

  const [parellesAprenent] = await connection.query(
    `SELECT id FROM parelles WHERE aprenent_id = ? AND estat IN (?) ${filtreExclos} LIMIT 1`,
    paramsAprenent
  );

  if (parellesAprenent.length > 0) {
    return { status: 409, message: 'Aquest aprenent ja te una parella activa o pausada.' };
  }

  return null;
}

exports.listPairings = async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.estat && ESTATS_VALIDS.includes(req.query.estat)) {
      conditions.push('p.estat = ?');
      params.push(req.query.estat);
    }

    const voluntariId = validarIdPositiu(req.query.voluntari_id);
    if (voluntariId) {
      conditions.push('p.voluntari_id = ?');
      params.push(voluntariId);
    }

    const aprenentId = validarIdPositiu(req.query.aprenent_id);
    if (aprenentId) {
      conditions.push('p.aprenent_id = ?');
      params.push(aprenentId);
    }

    if (req.query.search) {
      const search = `%${req.query.search}%`;
      conditions.push('(uv.nom LIKE ? OR uv.cognoms LIKE ? OR ua.nom LIKE ? OR ua.cognoms LIKE ?)');
      params.push(search, search, search, search);
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
         uv.email AS voluntari_email,
         ua.email AS aprenent_email,
         CONCAT(uv.nom, ' ', uv.cognoms) AS voluntari_nom_complet,
         CONCAT(ua.nom, ' ', ua.cognoms) AS aprenent_nom_complet,
         v.disponibilitat AS voluntari_disponibilitat,
         a.disponibilitat AS aprenent_disponibilitat
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
    const dades = normalitzarDadesParella(req.body);
    const errorValidacio = validarDadesParella(dades);

    if (errorValidacio) {
      connection.release();
      return res.status(400).json({ message: errorValidacio });
    }

    const errorParticipants = await comprovarParticipantsDisponibles(connection, dades);
    if (errorParticipants) {
      connection.release();
      return res.status(errorParticipants.status).json({ message: errorParticipants.message });
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO parelles (voluntari_id, aprenent_id, data_inici, data_fi, estat, observacions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [dades.voluntari_id, dades.aprenent_id, dades.data_inici, dades.data_fi || null, dades.estat, dades.observacions]
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

exports.updatePairing = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const pairingId = validarIdPositiu(req.params.id);
    if (!pairingId) {
      connection.release();
      return res.status(400).json({ message: 'Cal indicar un identificador de parella valid.' });
    }

    const [existents] = await connection.execute('SELECT id FROM parelles WHERE id = ?', [pairingId]);
    if (existents.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No s ha trobat la parella indicada.' });
    }

    const dades = normalitzarDadesParella(req.body);
    const errorValidacio = validarDadesParella(dades);
    if (errorValidacio) {
      connection.release();
      return res.status(400).json({ message: errorValidacio });
    }

    const errorParticipants = await comprovarParticipantsDisponibles(connection, dades, pairingId);
    if (errorParticipants) {
      connection.release();
      return res.status(errorParticipants.status).json({ message: errorParticipants.message });
    }

    await connection.beginTransaction();

    await connection.execute(
      `UPDATE parelles
       SET voluntari_id = ?, aprenent_id = ?, data_inici = ?, data_fi = ?, estat = ?, observacions = ?
       WHERE id = ?`,
      [dades.voluntari_id, dades.aprenent_id, dades.data_inici, dades.data_fi || null, dades.estat, dades.observacions, pairingId]
    );

    await connection.commit();
    connection.release();

    const parellaActualitzada = await obtenirParella(pool, pairingId);

    res.json({
      message: 'Parella actualitzada correctament.',
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

exports.updatePairingStatus = async (req, res, next) => {
  const connection = await pool.getConnection();

  try {
    const { estat, data_fi, observacions } = req.body;
    const pairingId = validarIdPositiu(req.params.id);

    if (!pairingId) {
      connection.release();
      return res.status(400).json({ message: 'Cal indicar un identificador de parella valid.' });
    }

    if (!estat || !ESTATS_VALIDS.includes(estat)) {
      connection.release();
      return res.status(400).json({ message: 'Cal indicar un estat valid per a la parella.' });
    }

    const [rows] = await connection.execute(
      'SELECT id, voluntari_id, aprenent_id, data_inici FROM parelles WHERE id = ?',
      [pairingId]
    );
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ message: 'No s ha trobat la parella indicada.' });
    }

    const dataFiNormalitzada = estat === 'tancada' ? data_fi || dataAvuiISO() : null;
    if (dataFiNormalitzada && !esDataValida(dataFiNormalitzada)) {
      connection.release();
      return res.status(400).json({ message: 'La data de finalitzacio no es valida.' });
    }

    const dataInici = formatDataSQL(rows[0].data_inici);
    if (dataFiNormalitzada && dataInici && dataFiNormalitzada < dataInici) {
      connection.release();
      return res.status(400).json({ message: 'La data de finalitzacio no pot ser anterior a la data d inici.' });
    }

    const errorParticipants = await comprovarParticipantsDisponibles(
      connection,
      {
        voluntari_id: rows[0].voluntari_id,
        aprenent_id: rows[0].aprenent_id,
        estat
      },
      pairingId
    );

    if (errorParticipants) {
      connection.release();
      return res.status(errorParticipants.status).json({ message: errorParticipants.message });
    }

    await connection.beginTransaction();

    await connection.execute(
      'UPDATE parelles SET estat = ?, data_fi = ?, observacions = ? WHERE id = ?',
      [estat, dataFiNormalitzada, normalitzarText(observacions), pairingId]
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
    const pairingId = validarIdPositiu(req.params.id);

    if (!pairingId) {
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
