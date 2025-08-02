const jwt = require('jsonwebtoken');
require('dotenv').config(); // Để đọc JWT_SECRET từ file .env

// Middleware để xác thực token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Lấy token từ header "Bearer TOKEN"

    if (!token) {
        return res.status(403).send({ message: "Cần cung cấp token để xác thực." });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: "Token không hợp lệ hoặc đã hết hạn." });
        }
        // Lưu thông tin người dùng đã giải mã vào request để các hàm sau có thể dùng
        req.user = decoded; 
        next(); // Chuyển sang middleware hoặc controller tiếp theo
    });
};

// Middleware để kiểm tra vai trò người dùng
const checkRole = (roles) => {
    return (req, res, next) => {
        // Hàm này phải được dùng SAU KHI verifyToken
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).send({ message: "Bạn không có quyền truy cập chức năng này." });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole,
};