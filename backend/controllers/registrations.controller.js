const db = require('../config/db');
// Lưu ý: Để emit socket từ controller, bạn cần một cơ chế phức tạp hơn (event emitter).
// Ở đây chúng ta sẽ giả định logic đó sẽ được xử lý riêng trong file socket.

// Sinh viên đăng ký đề tài
exports.registerForTopic = async (req, res) => {
    const { topicId } = req.body;
    const studentId = req.user.userId; // Lấy từ token

    try {
        const query = 'INSERT INTO registrations (student_id, topic_id) VALUES ($1, $2) RETURNING *';
        const values = [studentId, topicId];
        const result = await db.query(query, values);
        
        // TODO: Phát một sự kiện socket tới giảng viên của đề tài này.
        
        res.status(201).send({ message: "Đăng ký đề tài thành công, vui lòng chờ duyệt.", data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server hoặc bạn đã đăng ký đề tài này rồi." });
    }
};

// Giảng viên duyệt đăng ký
exports.updateRegistrationStatus = async (req, res) => {
    const { registrationId } = req.params;
    const { status } = req.body; // 'approved' hoặc 'rejected'
    const lecturerId = req.user.userId;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).send({ message: "Trạng thái không hợp lệ." });
    }

    try {
        // Cập nhật trạng thái
        const query = `
            UPDATE registrations r SET status = $1
            FROM topics t
            WHERE r.registration_id = $2 AND r.topic_id = t.topic_id AND t.lecturer_id = $3
            RETURNING r.*;
        `;
        const values = [status, registrationId, lecturerId];
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(403).send({ message: "Bạn không có quyền duyệt đăng ký này hoặc đăng ký không tồn tại." });
        }
        
        // TODO: Phát một sự kiện socket tới sinh viên có đăng ký này.

        res.status(200).send({ message: `Đã ${status} đăng ký.`, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server." });
    }
};