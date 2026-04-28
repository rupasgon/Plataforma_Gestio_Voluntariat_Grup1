const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authorizationHeader = req.headers.authorization || '';
  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Cal iniciar la sessio per accedir a aquest recurs.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'canvia-aquest-secret-en-produccio');

    req.user = {
      id: payload.sub,
      rol: payload.rol,
      email: payload.email,
      nom: payload.nom,
      cognoms: payload.cognoms
    };
    req.tokenExpiresAt = payload.exp ? payload.exp * 1000 : null;

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'La sessio no es valida o ha expirat.' });
  }
};
