// backend/routes/comments.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/comments.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Giảng viên tạo một nhận xét mới
router.post('/', verifyToken, checkRole(['lecturer']), controller.createComment);

module.exports = router;