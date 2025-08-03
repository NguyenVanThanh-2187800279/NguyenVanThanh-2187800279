// backend/routes/users.routes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/users.controller');
const { verifyToken, checkRole } = require('../middleware/auth.middleware');

// Tất cả các route trong file này đều yêu cầu đăng nhập và phải là admin
router.use(verifyToken, checkRole(['admin']));

// Định nghĩa các API
router.get('/', controller.getAllUsers);         // GET /api/users
router.post('/', controller.createUser);        // POST /api/users
router.put('/:id', controller.updateUser);      // PUT /api/users/123
router.delete('/:id', controller.deleteUser);   // DELETE /api/users/123

module.exports = router;