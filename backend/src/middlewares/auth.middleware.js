const { getSession } = require('../utils/session-store');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (!token) {
    return res.status(401).json({ message: 'Cal iniciar la sessio per accedir a aquest recurs.' });
  }

  const session = getSession(token);
  if (!session) {
    return res.status(401).json({ message: 'La sessio no es valida o ha caducat.' });
  }

  req.sessionToken = token;
  req.user = { ...session.user };
  next();
};
