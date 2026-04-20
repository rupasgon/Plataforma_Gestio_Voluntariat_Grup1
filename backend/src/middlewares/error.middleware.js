module.exports = (err, req, res, next) => {
  console.error(err);

  if (err && err.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(500).json({ message: 'No s\'ha pogut connectar amb la base de dades.' });
  }

  if (err && err.code === 'ER_BAD_DB_ERROR') {
    return res.status(500).json({ message: 'La base de dades configurada no existeix.' });
  }

  return res.status(500).json({ message: 'S\'ha produït un error intern del servidor.' });
};
