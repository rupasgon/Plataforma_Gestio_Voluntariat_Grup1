exports.listPairings = (req, res) => {
  res.json({ message: 'List pairings mock', data: [] });
};

exports.createPairing = (req, res) => {
  res.status(201).json({ message: 'Create pairing mock', data: req.body });
};

exports.updatePairingStatus = (req, res) => {
  res.json({ message: 'Update pairing status mock', id: req.params.id, data: req.body });
};
