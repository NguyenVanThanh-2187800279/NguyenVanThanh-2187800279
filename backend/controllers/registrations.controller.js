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
// Giảng viên lấy danh sách các đăng ký đang chờ duyệt cho đề tài của mình
exports.getPendingRegistrations = async (req, res) => {
    const lecturerId = req.user.userId; // Lấy ID giảng viên từ token đã xác thực

    try {
        const query = `
            SELECT 
                r.registration_id,
                u.full_name as student_name,
                t.title as topic_title
            FROM registrations r
            JOIN users u ON r.student_id = u.user_id
            JOIN topics t ON r.topic_id = t.topic_id
            WHERE t.lecturer_id = $1 AND r.status = 'pending';
        `;
        const result = await db.query(query, [lecturerId]);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi lấy danh sách chờ duyệt." });
    }
};

// Lấy thông tin đăng ký của sinh viên đang đăng nhập
exports.getStudentRegistration = async (req, res) => {
    const studentId = req.user.userId; // Lấy từ token

    try {
        // CÂU TRUY VẤN ĐÃ ĐƯỢC KIỂM TRA LẠI CẨN THẬN
        const query = `
    SELECT 
        r.registration_id, r.status, r.topic_id,
        t.title, t.description, t.lecturer_id,
        u.full_name as lecturer_name
    FROM registrations r
    JOIN topics t ON r.topic_id = t.topic_id
    JOIN users u ON t.lecturer_id = u.user_id
    WHERE r.student_id = $1;
`;
        const result = await db.query(query, [studentId]);

        if (result.rows.length === 0) {
            // Trả về null là đúng, đây không phải là lỗi
            return res.status(200).json(null); 
        }

        res.status(200).json(result.rows[0]);

    } catch (err) {
        // Log lỗi chi tiết ra terminal để gỡ lỗi
        console.error("LỖI TRUY VẤN getStudentRegistration:", err);
        res.status(500).send({ message: "Lỗi server khi lấy thông tin đăng ký." });
    }
};