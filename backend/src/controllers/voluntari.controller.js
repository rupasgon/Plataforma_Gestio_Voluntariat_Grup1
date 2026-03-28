exports.llistarVoluntaris = (req, res) => {
  res.json({ message: 'Llista de voluntaris (simulacio)', data: [] });
};

exports.obtenirVoluntari = (req, res) => {
  res.json({ message: 'Detall de voluntari (simulacio)', id: req.params.id });
};
