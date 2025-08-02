const express = require('express');
const router = express.Router();
const controller = require('../controllers/topics.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Route công khai, ai cũng có thể xem
router.get('/', controller.getAllTopics);

// Route cần đăng nhập và phải là giảng viên
router.post('/', verifyToken, checkRole(['lecturer']), controller.createTopic);

module.exports = router;