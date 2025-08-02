const express = require('express');
const router = express.Router();
const controller = require('../controllers/registrations.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Sinh viên đăng ký đề tài
router.post('/', verifyToken, checkRole(['student']), controller.registerForTopic);

// Giảng viên duyệt/từ chối đăng ký
router.put('/:registrationId/status', verifyToken, checkRole(['lecturer']), controller.updateRegistrationStatus);

module.exports = router;