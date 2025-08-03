// backend/controllers/progress.controller.js
const db = require('../config/db');

// [Student] Tạo một bản cập nhật tiến độ mới
exports.createProgressUpdate = async (req, res) => {
    const { registrationId, content } = req.body;
    const studentId = req.user.userId;

    // Đường dẫn file (nếu có) sẽ nằm trong req.file
    const filePath = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    // Kiểm tra xem sinh viên này có đúng là chủ của registrationId không
    const checkOwnerQuery = 'SELECT * FROM registrations WHERE registration_id = $1 AND student_id = $2';
    const ownerResult = await db.query(checkOwnerQuery, [registrationId, studentId]);

    if (ownerResult.rows.length === 0) {
        return res.status(403).send({ message: "Bạn không có quyền cập nhật cho đăng ký này." });
    }

    try {
        const query = 'INSERT INTO progress_updates (registration_id, content, file_path) VALUES ($1, $2, $3) RETURNING *';
        const result = await db.query(query, [registrationId, content, filePath]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi tạo cập nhật tiến độ." });
    }
};

// [Student & Lecturer] Lấy lịch sử trao đổi của một đăng ký (PHIÊN BẢN CẢI TIẾN)
exports.getProgressHistory = async (req, res) => {
    const { registrationId } = req.params;
     console.log(`[Backend] Đang tìm lịch sử cho registration_id: ${registrationId}`);

    try {
        // Lấy tất cả các bản cập nhật tiến độ
        const updatesQuery = `
            SELECT update_id, content as update_content, file_path, created_at as update_created_at
            FROM progress_updates
            WHERE registration_id = $1
            ORDER BY update_created_at ASC;
        `;
        const updatesResult = await db.query(updatesQuery, [registrationId]);
        let updates = updatesResult.rows;
         console.log(`[Backend] Tìm thấy ${updatesResult.rowCount} bản cập nhật.`);

        if (updates.length > 0) {
            // Lấy tất cả các bình luận liên quan
            const updateIds = updates.map(u => u.update_id);
            const commentsQuery = `
                SELECT 
                    c.comment_id, c.update_id, c.content as comment_content, c.created_at as comment_created_at,
                    u.full_name as lecturer_name
                FROM comments c
                JOIN users u ON c.lecturer_id = u.user_id
                WHERE c.update_id = ANY($1::int[])
                ORDER BY c.created_at ASC;
            `;
            const commentsResult = await db.query(commentsQuery, [updateIds]);
            const comments = commentsResult.rows;

            // Ghép các bình luận vào đúng bản cập nhật của nó
            updates = updates.map(update => {
                return {
                    ...update,
                    // Tìm tất cả comment cho update này (trong tương lai có thể có nhiều)
                    comments: comments.filter(c => c.update_id === update.update_id)
                };
            });
        }
        
        res.status(200).json(updates);
    } catch (err) {
        console.error("Lỗi tại getProgressHistory:", err);
        res.status(500).send({ message: "Lỗi server khi lấy lịch sử tiến độ." });
    }
};