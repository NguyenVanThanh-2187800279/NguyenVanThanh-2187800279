const express = require('express');
const router = express.Router();
const controller = require('../controllers/topics.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Route công khai, ai cũng có thể xem
router.get('/', controller.getAllTopics);

// Route cần đăng nhập và phải là giảng viên
router.post('/', verifyToken, checkRole(['lecturer']), controller.createTopic);

// Route để lấy thông tin đăng ký của một đề tài cụ thể (chỉ giảng viên)
router.get('/:topicId/registration', verifyToken, checkRole(['lecturer']), controller.getRegistrationByTopic);

// [Lecturer] Cập nhật một đề tài
router.put('/:id', verifyToken, checkRole(['lecturer']), controller.updateTopic);

// [Lecturer] Xóa một đề tài
router.delete('/:id', verifyToken, checkRole(['lecturer']), controller.deleteTopic);

module.exports = router;