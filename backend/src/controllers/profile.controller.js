exports.getMyProfile = (req, res) => {
  res.json({
    message: 'Perfil recuperat correctament.',
    user: req.user
  });
};

exports.updateMyProfile = (req, res) => {
  res.json({
    message: 'Perfil actualitzat correctament.',
    user: req.user,
    data: req.body
  });
};
