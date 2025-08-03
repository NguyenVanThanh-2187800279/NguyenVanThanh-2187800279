// backend/controllers/users.controller.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// [Admin] Lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const result = await db.query('SELECT user_id, username, full_name, email, role FROM users ORDER BY user_id ASC');
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi lấy danh sách người dùng." });
    }
};

// [Admin] Tạo người dùng mới
exports.createUser = async (req, res) => {
    const { username, password, fullName, email, role } = req.body;
    if (!username || !password || !fullName || !email || !role) {
        return res.status(400).send({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const query = 'INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, username, full_name, email, role';
        const values = [username, hashedPassword, fullName, email, role];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Lỗi trùng lặp username/email
            return res.status(409).send({ message: "Tên đăng nhập hoặc email đã tồn tại." });
        }
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi tạo người dùng." });
    }
};

// [Admin] Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { fullName, email, role } = req.body;
    // Lưu ý: Không cập nhật mật khẩu ở đây để đơn giản. Cần một quy trình riêng.
    
    if (!fullName || !email || !role) {
        return res.status(400).send({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    try {
        const query = 'UPDATE users SET full_name = $1, email = $2, role = $3 WHERE user_id = $4 RETURNING user_id, username, full_name, email, role';
        const values = [fullName, email, role, id];
        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).send({ message: "Không tìm thấy người dùng." });
        }
        res.status(200).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).send({ message: "Email đã được sử dụng bởi tài khoản khác." });
        }
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi cập nhật người dùng." });
    }
};

// [Admin] Xóa người dùng
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Cảnh báo: Việc xóa có thể thất bại nếu người dùng này có các bản ghi liên quan
        // (ví dụ: giảng viên có đề tài, sinh viên đã đăng ký).
        // Cần xử lý các bản ghi liên quan trước khi xóa.
        const result = await db.query('DELETE FROM users WHERE user_id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).send({ message: 'Không tìm thấy người dùng để xóa.' });
        }
        res.status(200).send({ message: 'Xóa người dùng thành công.' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server khi xóa người dùng. Có thể do người dùng này còn dữ liệu liên quan (đề tài, đăng ký,...)." });
    }
};