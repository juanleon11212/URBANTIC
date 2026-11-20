const { Router } = require('express');
const controller = require('../controllers/notification.controller');
const authenticate = require('../middleware/auth.middleware');

const router = Router();
router.use(authenticate);
router.get('/', controller.list);
router.patch('/read-all', controller.markAllAsRead);
router.patch('/:id/read', controller.markAsRead);

module.exports = router;
