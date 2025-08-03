// frontend/js/socket-client.js

// Biến socket được khai báo ở phạm vi module
let socket = null;

/**
 * Khởi tạo và kết nối tới server Socket.IO
 */
export function connectSocket() {
    // Lấy thông tin người dùng từ localStorage để xác thực
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    if (!userInfo || !userInfo.userId) {
        console.log("Không tìm thấy thông tin người dùng, không thể kết nối socket.");
        return;
    }

    // Kết nối đến server Socket.IO (đảm bảo URL đúng)
    socket = io('http://localhost:3000'); 

    // === LẮNG NGHE CÁC SỰ KIỆN TỪ SERVER ===

    // Sự kiện #1: Khi kết nối thành công
    socket.on('connect', () => {
        console.log('Đã kết nối tới Socket.IO server!');
        // Gửi thông tin người dùng lên để server "định danh"
        socket.emit('authenticate', userInfo.userId);
    });

    // Sự kiện #2: Lắng nghe xác nhận từ server
    socket.on('authenticated', (message) => {
        console.log('Socket đã được xác thực:', message);
    });

    // Sự kiện #3: Lắng nghe nhận xét mới từ giảng viên (dành cho sinh viên)
    socket.on('new_comment_from_lecturer', (data) => {
        console.log('Nhận xét mới:', data);
        // "Phát" một sự kiện tùy chỉnh để thông báo cho toàn bộ ứng dụng
        const event = new CustomEvent('new-notification', {
            detail: data.message // Nội dung thông báo
        });
        window.dispatchEvent(event);
    });
    
    // Sự kiện #4: Lắng nghe cập nhật tiến độ mới (dành cho giảng viên)
    socket.on('new_progress_update', (data) => {
        console.log('Cập nhật tiến độ mới:', data);
        // "Phát" một sự kiện tùy chỉnh tương tự
        const event = new CustomEvent('new-notification', {
            detail: data.message // Nội dung thông báo
        });
        window.dispatchEvent(event);
    });

    // Lắng nghe khi mất kết nối
    socket.on('disconnect', () => {
        console.log('Đã mất kết nối với Socket.IO server.');
    });
}

/**
 * Gửi sự kiện cập nhật tiến độ từ sinh viên lên server
 * @param {object} updateData - Dữ liệu cập nhật
 */
export function emitProgressUpdate(updateData) {
    if (socket) {
        socket.emit('student_update_progress', updateData);
    }
}

/**
 * Gửi sự kiện nhận xét từ giảng viên lên server
 * @param {object} commentData - Dữ liệu nhận xét
 */
export function emitLecturerComment(commentData) {
    if (socket) {
        socket.emit('lecturer_give_comment', commentData);
    }
}
