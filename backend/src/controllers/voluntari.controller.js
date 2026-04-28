const db = require('../config/db');

const CORREU_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MVP = 'registre_mvp_sense_login';

function netejarText(valor) {
  if (typeof valor !== 'string') return '';
  return valor.trim();
}

function composarObservacions(motivacio, observacions) {
  const parts = [];

  if (motivacio) {
    parts.push(`Motivacio: ${motivacio}`);
  }

  if (observacions) {
    parts.push(`Observacions: ${observacions}`);
  }

  return parts.join('\n');
}

exports.crearVoluntari = async (req, res, next) => {
  const nom = netejarText(req.body.nom);
  const cognoms = netejarText(req.body.cognoms);
  const correu = netejarText(req.body.correu).toLowerCase();
  const telefon = netejarText(req.body.telefon);
  const parroquia = netejarText(req.body.parroquia);
  const dataNaixement = netejarText(req.body.data_naixement);
  const disponibilitat = netejarText(req.body.disponibilitat);
  const motivacio = netejarText(req.body.motivacio);
  const observacions = netejarText(req.body.observacions);

  if (!nom || !cognoms || !correu || !telefon || !parroquia || !dataNaixement || !disponibilitat) {
    return res.status(400).json({ message: 'Falten camps obligatoris per registrar el voluntari.' });
  }

  if (!CORREU_REGEX.test(correu)) {
    return res.status(400).json({ message: 'El correu electronic no te un format valid.' });
  }

  const observacionsFinals = composarObservacions(motivacio, observacions) || null;
  const connexio = await db.getConnection();

  try {
    await connexio.beginTransaction();

    // Primer creem l'usuari base amb rol voluntari.
    const [resultatUsuari] = await connexio.execute(
      `INSERT INTO users (nom, cognoms, email, password, rol)
       VALUES (?, ?, ?, ?, 'voluntari')`,
      [nom, cognoms, correu, PASSWORD_MVP]
    );

    // Despres guardem les dades especifiques de voluntari vinculades a user_id.
    await connexio.execute(
      `INSERT INTO voluntaris (user_id, telefon, parroquia, data_naixement, disponibilitat, observacions)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [resultatUsuari.insertId, telefon, parroquia, dataNaixement, disponibilitat, observacionsFinals]
    );

    await connexio.commit();

    return res.status(201).json({
      message: 'Voluntari registrat correctament.',
      data: { user_id: resultatUsuari.insertId, rol: 'voluntari' }
    });
  } catch (error) {
    await connexio.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ja existeix un usuari amb aquest correu electronic.' });
    }

    return next(error);
  } finally {
    connexio.release();
  }
};

exports.llistarVoluntaris = async (req, res, next) => {
  try {
    // Recuperem els voluntaris amb les dades base de l'usuari.
    const [files] = await db.execute(
      `SELECT
        v.id AS voluntari_id,
        v.user_id,
        u.nom,
        u.cognoms,
        u.email,
        v.telefon,
        v.parroquia,
        v.data_naixement,
        v.disponibilitat,
        v.observacions,
        u.created_at
      FROM voluntaris v
      INNER JOIN users u ON u.id = v.user_id
      ORDER BY u.created_at DESC`
    );

    return res.json({ message: 'Llista de voluntaris', data: files });
  } catch (error) {
    return next(error);
  }
};

exports.obtenirVoluntari = async (req, res, next) => {
  const voluntariId = Number(req.params.id);

  if (!Number.isInteger(voluntariId) || voluntariId <= 0) {
    return res.status(400).json({ message: 'L\'identificador del voluntari no es valid.' });
  }

  try {
    const [files] = await db.execute(
      `SELECT
        v.id AS voluntari_id,
        v.user_id,
        u.nom,
        u.cognoms,
        u.email,
        v.telefon,
        v.parroquia,
        v.data_naixement,
        v.disponibilitat,
        v.observacions,
        u.created_at
      FROM voluntaris v
      INNER JOIN users u ON u.id = v.user_id
      WHERE v.id = ?
      LIMIT 1`,
      [voluntariId]
    );

    if (files.length === 0) {
      return res.status(404).json({ message: 'No s\'ha trobat el voluntari.' });
    }

    return res.json({ message: 'Detall de voluntari', data: files[0] });
  } catch (error) {
    return next(error);
  }
};
