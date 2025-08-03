const db = require('../config/db');

// Lấy tất cả đề tài
// backend/controllers/topics.controller.js

// === THAY THẾ TOÀN BỘ HÀM NÀY ===
exports.getAllTopics = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.topic_id,
                t.title,
                t.description,
                t.lecturer_id, -- <-- THÊM CỘT NÀY VÀO
                u_lecturer.full_name AS lecturer_name,
                u_student.full_name AS student_name 
            FROM 
                topics t
            JOIN 
                users u_lecturer ON t.lecturer_id = u_lecturer.user_id
            LEFT JOIN 
                registrations r ON t.topic_id = r.topic_id AND r.status IN ('approved', 'pending')
            LEFT JOIN 
                users u_student ON r.student_id = u_student.user_id
            ORDER BY 
                t.topic_id DESC;
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Lỗi tại getAllTopics:", err);
        res.status(500).send({ message: "Lỗi server khi lấy danh sách đề tài." });
    }
};


// Tạo đề tài mới (chỉ giảng viên)
exports.createTopic = async (req, res) => {
    const { title, description } = req.body;
    const lecturerId = req.user.userId; // Lấy từ token đã được xác thực

    try {
        const query = 'INSERT INTO topics (title, description, lecturer_id) VALUES ($1, $2, $3) RETURNING *';
        const values = [title, description, lecturerId];
        const result = await db.query(query, values);

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi tạo đề tài." });
    }
};

// Lấy thông tin đăng ký của một đề tài cụ thể (chỉ giảng viên)
exports.getRegistrationByTopic = async (req, res) => {
    const { topicId } = req.params;
    try {
        // Câu truy vấn này sẽ tìm bản ghi đăng ký có trạng thái 'approved' hoặc 'pending'
        const query = `
            SELECT registration_id, student_id 
            FROM registrations 
            WHERE topic_id = $1 AND status IN ('approved', 'pending')
            LIMIT 1; -- Đảm bảo chỉ trả về 1 kết quả
        `;
        const result = await db.query(query, [topicId]);
        
        // Log lại để gỡ lỗi
        console.log(`[Backend-getRegByTopic] Tìm thấy cho topicId ${topicId}:`, result.rows[0]);

        res.status(200).json(result.rows[0] || null);
    } catch (err) {
        console.error("Lỗi tại getRegistrationByTopic:", err);
        res.status(500).send({ message: "Lỗi server." });
    }
};

// [Lecturer] Cập nhật đề tài của mình
exports.updateTopic = async (req, res) => {
    const { id } = req.params; // ID của đề tài cần sửa
    const { title, description } = req.body;
    const lecturerId = req.user.userId; // ID của giảng viên đang đăng nhập

    try {
        // Query này cập nhật đề tài VÀ kiểm tra xem giảng viên có phải là chủ sở hữu không
        const query = `
            UPDATE topics 
            SET title = $1, description = $2 
            WHERE topic_id = $3 AND lecturer_id = $4
            RETURNING *;
        `;
        const values = [title, description, id, lecturerId];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            // Lỗi xảy ra nếu không tìm thấy đề tài hoặc giảng viên không có quyền
            return res.status(403).send({ message: "Không tìm thấy đề tài hoặc bạn không có quyền sửa." });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi cập nhật đề tài." });
    }
};

// [Lecturer] Xóa đề tài của mình
exports.deleteTopic = async (req, res) => {
    const { id } = req.params;
    const lecturerId = req.user.userId;

    try {
        // Cảnh báo: Việc xóa này có thể thất bại nếu đề tài đã có sinh viên đăng ký,
        // do ràng buộc khóa ngoại trong bảng `registrations`.
        const query = 'DELETE FROM topics WHERE topic_id = $1 AND lecturer_id = $2';
        const result = await db.query(query, [id, lecturerId]);

        if (result.rowCount === 0) {
            return res.status(403).send({ message: "Không tìm thấy đề tài hoặc bạn không có quyền xóa." });
        }
        res.status(200).send({ message: 'Xóa đề tài thành công.' });
    } catch (err) {
        // Bắt lỗi khóa ngoại
        if (err.code === '23503') { 
            return res.status(409).send({ message: "Không thể xóa đề tài này vì đã có sinh viên đăng ký." });
        }
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi xóa đề tài." });
    }
};
