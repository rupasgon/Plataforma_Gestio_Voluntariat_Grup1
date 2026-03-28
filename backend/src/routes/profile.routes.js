const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Voluntari o aprenent pot accedir al seu perfil
router.get('/me', roleMiddleware(['voluntari', 'aprenent']), profileController.getMyProfile);
router.put('/me', roleMiddleware(['voluntari', 'aprenent']), profileController.updateMyProfile);

module.exports = router;
