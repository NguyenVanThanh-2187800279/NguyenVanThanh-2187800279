const db = require('../config/db');

// Lấy tất cả đề tài
exports.getAllTopics = async (req, res) => {
    try {
        const query = `
            SELECT t.topic_id, t.title, t.description, t.status, u.full_name as lecturer_name
            FROM topics t
            JOIN users u ON t.lecturer_id = u.user_id
            ORDER BY t.topic_id DESC;
        `;
        const result = await db.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
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