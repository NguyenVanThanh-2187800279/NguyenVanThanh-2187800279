require('dotenv').config(); // Phải gọi đầu tiên để các file khác có thể dùng process.env
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import các modules tự tạo
const socketHandler = require('./sockets/socketHandler');
const authRoutes = require('./routes/auth.routes');
const topicRoutes = require('./routes/topics.routes');
const registrationRoutes = require('./routes/registrations.routes');
const userRoutes = require('./routes/users.routes');
const progressRoutes = require('./routes/progress.routes');
const commentRoutes = require('./routes/comments.routes');

// Khởi tạo
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép tất cả các nguồn, nên đổi thành địa chỉ của frontend khi deploy
        methods: ["GET", "POST", "PUT"]
    }
});

// Sử dụng Middleware
app.use(cors());
app.use(express.json()); // Để server có thể đọc được JSON từ body của request
app.use(express.urlencoded({ extended: true })); // Để đọc được form data
app.use('/uploads', express.static('uploads')); // Để phục vụ file tĩnh từ thư mục uploads

// Thiết lập các Routes API
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/registrations', registrationRoutes);

// Thiết lập các Routes API
app.use('/api/auth', authRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/progress', progressRoutes);

// Thiết lập các Routes API cho comments
app.use('/api/progress', progressRoutes);
app.use('/api/comments', commentRoutes);

// Route mặc định để kiểm tra server có hoạt động không
app.get('/', (req, res) => {
    res.send('Chào mừng đến với API Server cho Đồ Án Realtime!');
});

// Gắn trình xử lý Socket.IO
socketHandler(io);

// Khởi động server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}`);
    // Dòng này chỉ để kiểm tra xem đã kết nối CSDL chưa
    require('./config/db');
});