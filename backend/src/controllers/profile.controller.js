exports.getMyProfile = (req, res) => {
  res.json({ message: 'Get my profile mock', user: req.user });
};

exports.updateMyProfile = (req, res) => {
  res.json({ message: 'Update my profile mock', user: req.user, data: req.body });
};
