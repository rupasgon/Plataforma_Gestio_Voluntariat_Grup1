const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);
router.use(roleMiddleware(['admin']));

router.get('/dashboard', adminController.getDashboard);

module.exports = router;
