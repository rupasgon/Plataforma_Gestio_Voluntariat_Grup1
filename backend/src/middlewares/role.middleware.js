// Control d'acces segons el rol de l'usuari
module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tens permisos per accedir a aquest recurs.' });
    }
    next();
  };
};
