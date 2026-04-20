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
    disponibilitat: normalitzarText(payload.disponibilitat),
    observacions: normalitzarText(payload.observacions)
  };
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
  const values = [
    perfil.telefon,
    perfil.parroquia,
    perfil.data_naixement,
    perfil.disponibilitat,
    perfil.observacions
  ];

  if (rows.length > 0) {
    await connection.execute(
      `UPDATE ${taulaPerfil}
       SET telefon = ?, parroquia = ?, data_naixement = ?, disponibilitat = ?, observacions = ?
       WHERE user_id = ?`,
      [...values, userId]
    );
    return;
  }

  await connection.execute(
    `INSERT INTO ${taulaPerfil} (telefon, parroquia, data_naixement, disponibilitat, observacions, user_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [...values, userId]
  );
}

module.exports = {
  obtenirTaulaPerfilPerRol,
  construirDadesPerfil,
  obtenirUsuariAmbPerfil,
  sincronitzarPerfilUsuari
};
