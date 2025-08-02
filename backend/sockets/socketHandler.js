const onlineUsers = {};

const socketHandler = (io) => {
    // Hàm này sẽ được gọi mỗi khi có một client kết nối tới server
    io.on('connection', (socket) => {
        console.log(`Một client đã kết nối: ${socket.id}`);

        // Sự kiện #1: Client gửi thông tin để "định danh" sau khi đăng nhập thành công
        // Client sẽ gửi user ID của mình lên đây.
        socket.on('authenticate', (userId) => {
            console.log(`Người dùng ${userId} đã xác thực với socket id ${socket.id}`);
            // Lưu lại vào danh bạ
            onlineUsers[userId] = socket.id;
            
            // Phản hồi cho client biết là đã kết nối real-time thành công
            socket.emit('authenticated', 'Kết nối real-time thành công!');
        });
        
        // Sự kiện #2: Sinh viên cập nhật tiến độ
        socket.on('student_update_progress', (data) => {
            // Dữ liệu nhận được có dạng: { registrationId: 1, content: "Đã xong chương 1", lecturerId: 5 }
            console.log('Sự kiện: Sinh viên cập nhật tiến độ:', data);

            // Tìm socket của giảng viên trong danh bạ online
            const lecturerSocketId = onlineUsers[data.lecturerId];
            if (lecturerSocketId) {
                // Nếu giảng viên đang online, gửi thông báo real-time CHỈ cho giảng viên đó
                io.to(lecturerSocketId).emit('new_progress_update', {
                    message: `Sinh viên vừa cập nhật tiến độ mới.`,
                    update: data,
                });
            }
        });

        // Sự kiện #3: Giảng viên gửi nhận xét
        socket.on('lecturer_give_comment', (data) => {
            // Dữ liệu nhận được có dạng: { content: "Tốt, cần làm rõ thêm...", studentId: 10 }
            console.log('Sự kiện: Giảng viên gửi nhận xét:', data);

            // Tìm socket của sinh viên trong danh bạ online
            const studentSocketId = onlineUsers[data.studentId];
            if (studentSocketId) {
                // Nếu sinh viên đang online, gửi thông báo real-time CHỈ cho sinh viên đó
                io.to(studentSocketId).emit('new_comment_from_lecturer', {
                    message: 'Bạn có nhận xét mới từ giảng viên.',
                    comment: data,
                });
            }
        });

        // Sự kiện mặc định: Khi client ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`Client đã ngắt kết nối: ${socket.id}`);
            // Tìm và xóa người dùng này khỏi danh bạ online để tránh gửi thông báo lỗi
            for (const userId in onlineUsers) {
                if (onlineUsers[userId] === socket.id) {
                    delete onlineUsers[userId];
                    console.log(`Người dùng ${userId} đã offline.`);
                    break;
                }
            }
        });
    });
};

module.exports = socketHandler;