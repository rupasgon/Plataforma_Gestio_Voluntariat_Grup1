module.exports = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Cal iniciar la sessio per continuar.' });
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tens permisos per accedir a aquesta funcionalitat.' });
    }

    next();
  };
};
