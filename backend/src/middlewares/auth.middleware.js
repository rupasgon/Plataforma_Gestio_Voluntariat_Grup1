// Middleware basic d'autenticacio (simulacio)
module.exports = (req, res, next) => {
  // Pendent: validar JWT o sessio real
  req.user = { id: 1, rol: 'admin' };
  next();
};
