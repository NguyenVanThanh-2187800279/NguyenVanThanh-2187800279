// backend/controllers/comments.controller.js
const db = require('../config/db');

// [Lecturer] Tạo một nhận xét mới cho một bản cập nhật
exports.createComment = async (req, res) => {
    const { updateId, content } = req.body;
    const lecturerId = req.user.userId;

    // TODO: Cần một bước kiểm tra để đảm bảo giảng viên này có quyền nhận xét cho updateId này.
    // (Kiểm tra xem updateId có thuộc về một registration mà registration đó lại thuộc về một topic của giảng viên này)
    // Tạm thời bỏ qua để đơn giản hóa.

    try {
        const query = 'INSERT INTO comments (update_id, lecturer_id, content) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [updateId, lecturerId, content]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi tạo nhận xét." });
    }
};