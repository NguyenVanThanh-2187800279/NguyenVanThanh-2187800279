// backend/middleware/upload.middleware.js
const multer = require('multer');
const path = require('path');

// Tạo một thư mục 'uploads' trong backend nếu chưa có
const fs = require('fs');
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Cấu hình nơi lưu trữ file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Lưu file vào thư mục 'uploads'
    },
    filename: function (req, file, cb) {
        // Tạo một tên file duy nhất để tránh trùng lặp
        // Tên file sẽ có dạng: ten-goc-file-TIMESTAMP.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Kiểm tra loại file (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new Error('Chỉ được phép tải lên file ảnh!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn kích thước file 5MB
    fileFilter: fileFilter
});

module.exports = upload;