// backend/sockets/socketHandler.js

// Danh bạ lưu socket ID của những người dùng đang online.
// Key sẽ là User ID (luôn được chuyển thành chuỗi), Value là Socket ID.
const onlineUsers = {};

const socketHandler = (io) => {
    // Hàm này sẽ được gọi mỗi khi có một client kết nối tới server
    io.on('connection', (socket) => {
        console.log(`Một client đã kết nối: ${socket.id}`);

        // Sự kiện #1: Client gửi thông tin để "định danh"
        socket.on('authenticate', (userId) => {
            console.log(`Người dùng ${userId} đã xác thực với socket id ${socket.id}`);
            // CHUẨN HÓA: Luôn lưu key dưới dạng chuỗi để tra cứu nhất quán
            onlineUsers[String(userId)] = socket.id;
            socket.emit('authenticated', 'Kết nối real-time thành công!');
        });
        
        // Sự kiện #2: Sinh viên cập nhật tiến độ
        socket.on('student_update_progress', (data) => {
            console.log('Sự kiện nhận được: SV cập nhật tiến độ:', data);

            // CHUẨN HÓA: Luôn tra cứu key dưới dạng chuỗi
            const lecturerSocketId = onlineUsers[String(data.lecturerId)];
            
            // Log chi tiết để gỡ lỗi
            console.log(`Đang tìm socket cho lecturerId: ${data.lecturerId}. Tìm thấy: ${lecturerSocketId}`);
            console.log('Danh sách online hiện tại:', onlineUsers);

            if (lecturerSocketId) {
                io.to(lecturerSocketId).emit('new_progress_update', {
                    message: `Sinh viên "${data.studentName}" vừa cập nhật tiến độ mới.`,
                    update: data,
                });
                console.log(`Đã gửi thông báo 'new_progress_update' tới socket ${lecturerSocketId}`);
            } else {
                console.log(`Không tìm thấy giảng viên ${data.lecturerId} trong danh sách online.`);
            }
        });

        // Sự kiện #3: Giảng viên gửi nhận xét
        socket.on('lecturer_give_comment', (data) => {
            console.log('Sự kiện nhận được: Giảng viên gửi nhận xét:', data);
            
            // SỬA LỖI: Khai báo biến studentSocketId và chuẩn hóa key
            const studentSocketId = onlineUsers[String(data.studentId)];
            
            // Log chi tiết để gỡ lỗi
            console.log(`Đang tìm socket cho studentId: ${data.studentId}. Tìm thấy: ${studentSocketId}`);
            console.log('Danh sách online hiện tại:', onlineUsers);

            if (studentSocketId) {
                io.to(studentSocketId).emit('new_comment_from_lecturer', {
                    message: 'Bạn có nhận xét mới từ giảng viên.',
                    comment: data,
                });
                console.log(`Đã gửi thông báo 'new_comment_from_lecturer' tới socket ${studentSocketId}`);
            } else {
                console.log(`Không tìm thấy sinh viên ${data.studentId} trong danh sách online.`);
            }
        });

        // Sự kiện mặc định: Khi client ngắt kết nối
        socket.on('disconnect', () => {
            console.log(`Client đã ngắt kết nối: ${socket.id}`);
            // Tìm và xóa người dùng này khỏi danh bạ online
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