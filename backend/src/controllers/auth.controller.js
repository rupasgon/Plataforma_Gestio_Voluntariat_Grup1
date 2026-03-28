exports.login = (req, res) => {
  res.json({ message: 'Login mock', token: 'mock-token', user: { id: 1, rol: 'admin' } });
};

exports.logout = (req, res) => {
  res.json({ message: 'Logout mock' });
};
