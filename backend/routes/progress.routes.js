// backend/routes/progress.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/progress.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

// Sinh viên tạo một cập nhật tiến độ mới
router.post('/', verifyToken, checkRole(['student']), upload.single('progressImage'), controller.createProgressUpdate);

// Lấy lịch sử trao đổi của một đăng ký (cả SV và GV đều có thể xem)
router.get('/:registrationId', verifyToken, checkRole(['student', 'lecturer']), controller.getProgressHistory);

module.exports = router;