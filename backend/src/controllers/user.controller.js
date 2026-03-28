exports.listUsers = (req, res) => {
  res.json({ message: 'List users mock', data: [] });
};

exports.getUser = (req, res) => {
  res.json({ message: 'Get user mock', id: req.params.id });
};

exports.createUser = (req, res) => {
  res.status(201).json({ message: 'Create user mock', data: req.body });
};

exports.updateUser = (req, res) => {
  res.json({ message: 'Update user mock', id: req.params.id, data: req.body });
};
