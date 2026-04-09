const db = require('../config/db');

const CORREU_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MVP = 'registre_mvp_sense_login';

function netejarText(valor) {
  if (typeof valor !== 'string') return '';
  return valor.trim();
}

exports.crearAprenent = async (req, res, next) => {
  const nom = netejarText(req.body.nom);
  const cognoms = netejarText(req.body.cognoms);
  const correu = netejarText(req.body.correu).toLowerCase();
  const telefon = netejarText(req.body.telefon);
  const parroquia = netejarText(req.body.parroquia);
  const dataNaixement = netejarText(req.body.data_naixement);
  const disponibilitat = netejarText(req.body.disponibilitat);
  const nivellCatala = netejarText(req.body.nivell_catala);
  const objectiuPrincipal = netejarText(req.body.objectiu_principal);
  const potConversar = netejarText(req.body.pot_conversar);
  const observacions = netejarText(req.body.observacions);

  if (
    !nom ||
    !cognoms ||
    !correu ||
    !telefon ||
    !parroquia ||
    !dataNaixement ||
    !nivellCatala ||
    !objectiuPrincipal ||
    !potConversar ||
    !disponibilitat
  ) {
    return res.status(400).json({ message: 'Falten camps obligatoris per registrar l\'aprenent.' });
  }

  if (!CORREU_REGEX.test(correu)) {
    return res.status(400).json({ message: 'El correu electronic no te un format valid.' });
  }

  if (potConversar !== 'si' && potConversar !== 'no') {
    return res.status(400).json({ message: 'El camp pot_conversar ha de ser "si" o "no".' });
  }

  const connexio = await db.getConnection();

  try {
    await connexio.beginTransaction();

    // Primer creem l'usuari base amb rol aprenent.
    const [resultatUsuari] = await connexio.execute(
      `INSERT INTO users (nom, cognoms, email, password, rol)
       VALUES (?, ?, ?, ?, 'aprenent')`,
      [nom, cognoms, correu, PASSWORD_MVP]
    );

    // Despres guardem les dades especifiques de l'aprenent vinculades a user_id.
    await connexio.execute(
      `INSERT INTO aprenents (
        user_id,
        telefon,
        parroquia,
        data_naixement,
        nivell_catala,
        objectiu_principal,
        pot_conversar,
        disponibilitat,
        observacions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        resultatUsuari.insertId,
        telefon,
        parroquia,
        dataNaixement,
        nivellCatala,
        objectiuPrincipal,
        potConversar,
        disponibilitat,
        observacions || null
      ]
    );

    await connexio.commit();

    return res.status(201).json({
      message: 'Aprenent registrat correctament.',
      data: { user_id: resultatUsuari.insertId, rol: 'aprenent' }
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

exports.listAprenents = async (req, res, next) => {
  try {
    // Recuperem els aprenents amb les dades base de l'usuari.
    const [files] = await db.execute(
      `SELECT
        a.id AS aprenent_id,
        a.user_id,
        u.nom,
        u.cognoms,
        u.email,
        a.telefon,
        a.parroquia,
        a.data_naixement,
        a.nivell_catala,
        a.objectiu_principal,
        a.pot_conversar,
        a.disponibilitat,
        a.observacions,
        u.created_at
      FROM aprenents a
      INNER JOIN users u ON u.id = a.user_id
      ORDER BY u.created_at DESC`
    );

    return res.json({ message: 'Llista d\'aprenents', data: files });
  } catch (error) {
    return next(error);
  }
};

exports.getAprenent = async (req, res, next) => {
  const aprenentId = Number(req.params.id);

  if (!Number.isInteger(aprenentId) || aprenentId <= 0) {
    return res.status(400).json({ message: 'L\'identificador de l\'aprenent no es valid.' });
  }

  try {
    const [files] = await db.execute(
      `SELECT
        a.id AS aprenent_id,
        a.user_id,
        u.nom,
        u.cognoms,
        u.email,
        a.telefon,
        a.parroquia,
        a.data_naixement,
        a.nivell_catala,
        a.objectiu_principal,
        a.pot_conversar,
        a.disponibilitat,
        a.observacions,
        u.created_at
      FROM aprenents a
      INNER JOIN users u ON u.id = a.user_id
      WHERE a.id = ?
      LIMIT 1`,
      [aprenentId]
    );

    if (files.length === 0) {
      return res.status(404).json({ message: 'No s\'ha trobat l\'aprenent.' });
    }

    return res.json({ message: 'Detall d\'aprenent', data: files[0] });
  } catch (error) {
    return next(error);
  }
};
