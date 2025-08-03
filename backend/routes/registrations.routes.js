const express = require('express');
const router = express.Router();
const controller = require('../controllers/registrations.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Sinh viên đăng ký đề tài
router.post('/', verifyToken, checkRole(['student']), controller.registerForTopic);

// Route mới: Giảng viên lấy danh sách chờ duyệt
router.get('/pending', verifyToken, checkRole(['lecturer']), controller.getPendingRegistrations);

// Giảng viên duyệt/từ chối đăng ký
router.put('/:registrationId/status', verifyToken, checkRole(['lecturer']), controller.updateRegistrationStatus);

// Lấy thông tin đăng ký của chính sinh viên đang đăng nhập
router.get('/me', verifyToken, checkRole(['student']), controller.getStudentRegistration);

module.exports = router;