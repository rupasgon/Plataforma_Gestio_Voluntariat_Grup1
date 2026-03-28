const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

router.use(authMiddleware);

// Admin only
router.get('/', roleMiddleware(['admin']), userController.listUsers);
router.get('/:id', roleMiddleware(['admin']), userController.getUser);
router.post('/', roleMiddleware(['admin']), userController.createUser);
router.put('/:id', roleMiddleware(['admin']), userController.updateUser);

module.exports = router;
