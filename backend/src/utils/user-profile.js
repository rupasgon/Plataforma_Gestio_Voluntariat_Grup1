function obtenirTaulaPerfilPerRol(rol) {
  if (rol === 'voluntari') {
    return 'voluntaris';
  }

  if (rol === 'aprenent') {
    return 'aprenents';
  }

  return null;
}

function normalitzarText(value) {
  if (value === undefined || value === null) {
    return null;
  }

  const text = String(value).trim();
  return text === '' ? null : text;
}

function construirDadesPerfil(payload = {}) {
  return {
    telefon: normalitzarText(payload.telefon),
    parroquia: normalitzarText(payload.parroquia),
    data_naixement: payload.data_naixement || null,
    nivell_catala: normalitzarText(payload.nivell_catala),
    objectiu_principal: normalitzarText(payload.objectiu_principal),
    pot_conversar: normalitzarText(payload.pot_conversar),
    disponibilitat: normalitzarText(payload.disponibilitat),
    observacions: normalitzarText(payload.observacions)
  };
}

function validarDadesPerfil(rol, payload = {}) {
  if (rol === 'admin') {
    return null;
  }

  const perfil = construirDadesPerfil(payload);
  const campsBaseObligatoris = [
    ['telefon', perfil.telefon],
    ['parroquia', perfil.parroquia],
    ['data_naixement', perfil.data_naixement],
    ['disponibilitat', perfil.disponibilitat]
  ];

  const campsObligatoris = rol === 'aprenent'
    ? [
        ...campsBaseObligatoris,
        ['nivell_catala', perfil.nivell_catala],
        ['objectiu_principal', perfil.objectiu_principal],
        ['pot_conversar', perfil.pot_conversar]
      ]
    : campsBaseObligatoris;

  const campFaltant = campsObligatoris.find(([, valor]) => !valor);
  if (campFaltant) {
    return `El camp ${campFaltant[0]} es obligatori per al rol ${rol}.`;
  }

  if (rol === 'aprenent' && !['si', 'no'].includes(perfil.pot_conversar)) {
    return 'El camp pot_conversar ha de ser "si" o "no".';
  }

  return null;
}

async function obtenirUsuariAmbPerfil(executor, userId) {
  const [rows] = await executor.execute(
    `SELECT
       u.id,
       u.nom,
       u.cognoms,
       u.email,
       u.rol,
       u.created_at,
       u.updated_at,
       CASE
         WHEN u.rol = 'voluntari' THEN v.id
         WHEN u.rol = 'aprenent' THEN a.id
         ELSE NULL
       END AS perfil_id,
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
         WHEN u.rol = 'voluntari' THEN v.data_naixement
         WHEN u.rol = 'aprenent' THEN a.data_naixement
         ELSE NULL
       END AS data_naixement,
       CASE
         WHEN u.rol = 'aprenent' THEN a.nivell_catala
         ELSE NULL
       END AS nivell_catala,
       CASE
         WHEN u.rol = 'aprenent' THEN a.objectiu_principal
         ELSE NULL
       END AS objectiu_principal,
       CASE
         WHEN u.rol = 'aprenent' THEN a.pot_conversar
         ELSE NULL
       END AS pot_conversar,
       CASE
         WHEN u.rol = 'voluntari' THEN v.disponibilitat
         WHEN u.rol = 'aprenent' THEN a.disponibilitat
         ELSE NULL
       END AS disponibilitat,
       CASE
         WHEN u.rol = 'voluntari' THEN v.observacions
         WHEN u.rol = 'aprenent' THEN a.observacions
         ELSE NULL
       END AS observacions
     FROM users u
     LEFT JOIN voluntaris v ON v.user_id = u.id
     LEFT JOIN aprenents a ON a.user_id = u.id
     WHERE u.id = ?`,
    [userId]
  );

  return rows[0] || null;
}

async function sincronitzarPerfilUsuari(connection, userId, rol, payload = {}) {
  const perfil = construirDadesPerfil(payload);

  await connection.execute('DELETE FROM voluntaris WHERE user_id = ? AND ? <> "voluntari"', [userId, rol]);
  await connection.execute('DELETE FROM aprenents WHERE user_id = ? AND ? <> "aprenent"', [userId, rol]);

  const taulaPerfil = obtenirTaulaPerfilPerRol(rol);
  if (!taulaPerfil) {
    return;
  }

  const [rows] = await connection.execute(`SELECT id FROM ${taulaPerfil} WHERE user_id = ?`, [userId]);

  if (rol === 'aprenent') {
    const values = [
      perfil.telefon,
      perfil.parroquia,
      perfil.data_naixement,
      perfil.nivell_catala,
      perfil.objectiu_principal,
      perfil.pot_conversar,
      perfil.disponibilitat,
      perfil.observacions
    ];

    if (rows.length > 0) {
      await connection.execute(
        `UPDATE aprenents
         SET telefon = ?, parroquia = ?, data_naixement = ?, nivell_catala = ?,
             objectiu_principal = ?, pot_conversar = ?, disponibilitat = ?, observacions = ?
         WHERE user_id = ?`,
        [...values, userId]
      );
      return;
    }

    await connection.execute(
      `INSERT INTO aprenents (
         telefon, parroquia, data_naixement, nivell_catala, objectiu_principal,
         pot_conversar, disponibilitat, observacions, user_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...values, userId]
    );
    return;
  }

  const values = [perfil.telefon, perfil.parroquia, perfil.data_naixement, perfil.disponibilitat, perfil.observacions];

  if (rows.length > 0) {
    await connection.execute(
      `UPDATE voluntaris
       SET telefon = ?, parroquia = ?, data_naixement = ?, disponibilitat = ?, observacions = ?
       WHERE user_id = ?`,
      [...values, userId]
    );
    return;
  }

  await connection.execute(
    `INSERT INTO voluntaris (telefon, parroquia, data_naixement, disponibilitat, observacions, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [...values, userId]
  );
}

module.exports = {
  obtenirTaulaPerfilPerRol,
  construirDadesPerfil,
  validarDadesPerfil,
  obtenirUsuariAmbPerfil,
  sincronitzarPerfilUsuari
};
