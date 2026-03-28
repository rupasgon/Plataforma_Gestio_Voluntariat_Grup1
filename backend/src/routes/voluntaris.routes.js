const express = require('express');
const router = express.Router();
const voluntariController = require('../controllers/voluntari.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin']), voluntariController.llistarVoluntaris);
router.get('/:id', roleMiddleware(['admin']), voluntariController.obtenirVoluntari);

module.exports = router;
