const express = require('express');
const router = express.Router();
const pairingController = require('../controllers/pairing.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin']), pairingController.listPairings);
router.post('/', roleMiddleware(['admin']), pairingController.createPairing);
router.patch('/:id/status', roleMiddleware(['admin']), pairingController.updatePairingStatus);

module.exports = router;
