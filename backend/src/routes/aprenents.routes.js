const express = require('express');
const router = express.Router();
const aprenentController = require('../controllers/aprenent.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

router.get('/', roleMiddleware(['admin']), aprenentController.listAprenents);
router.get('/:id', roleMiddleware(['admin']), aprenentController.getAprenent);

module.exports = router;
