exports.listAprenents = (req, res) => {
  res.json({ message: 'List aprenents mock', data: [] });
};

exports.getAprenent = (req, res) => {
  res.json({ message: 'Get aprenent mock', id: req.params.id });
};
