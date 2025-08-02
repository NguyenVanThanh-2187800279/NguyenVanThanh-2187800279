const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Đăng ký người dùng mới
exports.register = async (req, res) => {
    const { username, password, fullName, email, role } = req.body;

    if (!username || !password || !fullName || !email || !role) {
        return res.status(400).send({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    try {
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = 'INSERT INTO users (username, password, full_name, email, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id';
        const values = [username, hashedPassword, fullName, email, role];

        await db.query(query, values);

        res.status(201).send({ message: "Đăng ký người dùng thành công!" });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server hoặc người dùng/email đã tồn tại." });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Tìm người dùng trong CSDL
        const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length === 0) {
            return res.status(404).send({ message: "Tên đăng nhập không tồn tại." });
        }
        const user = userResult.rows[0];

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).send({ message: "Mật khẩu không chính xác." });
        }

        // Tạo và ký token
        const token = jwt.sign(
            { userId: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token hết hạn sau 24 giờ
        );

        res.status(200).send({
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                userId: user.user_id,
                fullName: user.full_name,
                role: user.role
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Lỗi server." });
    }
};