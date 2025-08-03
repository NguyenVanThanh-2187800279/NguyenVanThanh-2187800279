// frontend/js/main.js

import * as api from './api.js';
import { connectSocket, emitProgressUpdate, emitLecturerComment } from './socket-client.js';

// === KHAI BÁO BIẾN TOÀN CỤC (CHƯA GÁN GIÁ TRỊ) ===
let studentHasRegistration = false;
let notifications = [];

// Biến cho các phần tử DOM, sẽ được gán giá trị sau khi HTML tải xong
let progressModal, modalTopicTitle, modalProgressHistory, closeProgressModalBtn;
let notificationBell, notificationCount, notificationPanel;

// Biến cho các modal và form liên quan đến việc chỉnh sửa đề tài
let editTopicModal, editTopicForm, closeEditModalBtn;


// Hàm đóng modal chỉnh sửa
function closeEditModal() {
    if (editTopicModal) {
        editTopicModal.classList.add('hidden');
    }
}

// Hàm mở modal và điền dữ liệu
function openEditModal(topic) {
    document.getElementById('edit-topic-id').value = topic.topic_id;
    document.getElementById('edit-topic-title').value = topic.title;
    document.getElementById('edit-topic-description').value = topic.description;
    editTopicModal.classList.remove('hidden');
}

// Hàm xử lý khi submit form chỉnh sửa
async function handleEditTopicSubmit(e) {
    e.preventDefault();
    const topicId = document.getElementById('edit-topic-id').value;
    const topicData = {
        title: document.getElementById('edit-topic-title').value,
        description: document.getElementById('edit-topic-description').value,
    };

    try {
        await api.updateTopic(topicId, topicData);
        alert('Cập nhật đề tài thành công!');
        closeEditModal();
        loadAllTopics(); // Tải lại danh sách để thấy thay đổi
    } catch (error) {
        alert('Lỗi khi cập nhật: ' + error.message);
    }
}

// Hàm xử lý khi nhấn nút xóa
async function handleDeleteTopic(topicId) {
    if (!confirm('Bạn có chắc chắn muốn xóa đề tài này? Hành động này không thể hoàn tác.')) {
        return;
    }
    try {
        await api.deleteTopic(topicId);
        alert('Xóa đề tài thành công!');
        loadAllTopics(); // Tải lại danh sách
    } catch (error) {
        alert('Lỗi khi xóa: ' + error.message);
    }
}
// --- CÁC HÀM TIỆN ÍCH ---

function displayNotification(message) {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    container.appendChild(notification);
    setTimeout(() => { notification.remove(); }, 5000);
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}

function closeProgressModal() {
    if (progressModal) {
        progressModal.classList.add('hidden');
    }
}

// --- CÁC HÀM XỬ LÝ THÔNG BÁO ---

function updateNotificationUI() {
    console.log("updateNotificationUI được gọi. Số thông báo:", notifications.length);
    if (!notificationBell || !notificationCount || !notificationPanel) return;
    const unreadCount = notifications.filter(n => !n.read).length;

    if (unreadCount > 0) {
        notificationCount.textContent = unreadCount;
        notificationCount.classList.remove('hidden');
    } else {
        notificationCount.classList.add('hidden');
    }

    notificationPanel.innerHTML = '';
    if (notifications.length === 0) {
        notificationPanel.innerHTML = '<div class="notification-item">Không có thông báo nào.</div>';
    } else {
         console.log("Đang render danh sách thông báo...");
        notifications.slice(0, 5).forEach(notif => {
            const item = document.createElement('div');
            item.className = 'notification-item' + (!notif.read ? ' unread' : '');
            item.textContent = notif.message;
            notificationPanel.appendChild(item);
        });
    }
}

function markNotificationsAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationUI();
}

// --- LOGIC CHO VAI TRÒ SINH VIÊN ---

async function handleRegisterTopic(event) {
    const topicId = event.target.dataset.topicId;
    if (!confirm(`Bạn có chắc chắn muốn đăng ký đề tài này không?`)) return;

    try {
        const result = await api.registerForTopic(topicId);
        alert(result.message);
        loadMyRegistrationStatus();
        loadAllTopics();
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

async function handleProgressSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const registrationId = form.dataset.registrationId;
    const lecturerId = form.dataset.lecturerId;

    // --- TẠO FORMDATA MỘT CÁCH TƯỜNG MINH ---

    const formData = new FormData();

    // 1. Lấy và thêm nội dung text
    const content = document.getElementById('progress-content').value;
    formData.append('content', content);

    // 2. Thêm registrationId
    formData.append('registrationId', registrationId);

    // 3. Lấy và thêm file ảnh (nếu có)
    const imageFile = document.getElementById('progress-image').files[0];
    if (imageFile) {
        formData.append('progressImage', imageFile); // 'progressImage' phải khớp với tên trong middleware Multer
    }
    
    // Kiểm tra xem có nội dung hoặc ảnh không
    if (!content && !imageFile) {
        alert("Vui lòng nhập nội dung hoặc đính kèm một file ảnh.");
        return;
    }
    // --- GỬI DỮ LIỆU VÀ XỬ LÝ KẾT QUẢ ---

    try {
        const newUpdate = await api.createProgressUpdate(formData);
        
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        emitProgressUpdate({
            registrationId: parseInt(registrationId),
            content: newUpdate.content,
            lecturerId: parseInt(lecturerId),
            studentName: userInfo.fullName
        });

        alert('Gửi cập nhật thành công!');
        form.reset();
        loadAndRenderProgress(registrationId);
    } catch (error) {
        alert('Lỗi khi gửi cập nhật: ' + (error.message || 'Yêu cầu thất bại.'));
    }
}

function renderProgressHistory(history) {
    const container = document.getElementById('progress-history');
    container.innerHTML = '';
    if (!history || history.length === 0) {
        container.innerHTML = '<p><em>Chưa có cập nhật nào. Hãy là người đầu tiên!</em></p>';
        return;
    }
    history.forEach(update => {
        const updateDate = new Date(update.update_created_at).toLocaleString('vi-VN');
        const imageHTML = update.file_path ? `<img src="http://localhost:3000${update.file_path}" alt="Ảnh đính kèm" class="progress-image">` : '';
        const updateHTML = `<div class="update-block"><p>${update.update_content}</p>${imageHTML}<div class="block-meta">Bạn đã gửi lúc: ${updateDate}</div></div>`;
        container.innerHTML += updateHTML;
        if (update.comments && update.comments.length > 0) {
            update.comments.forEach(comment => {
                const commentDate = new Date(comment.comment_created_at).toLocaleString('vi-VN');
                const commentHTML = `<div class="comment-block"><p><strong>${comment.lecturer_name} nhận xét:</strong> ${comment.comment_content}</p><div class="block-meta">Lúc: ${commentDate}</div></div>`;
                container.innerHTML += commentHTML;
            });
        }
    });
    container.scrollTop = container.scrollHeight;
}

async function loadAndRenderProgress(registrationId) {
    try {
        const history = await api.getProgressHistory(registrationId);
        renderProgressHistory(history);
    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
    }
}

async function loadMyRegistrationStatus() {
    const statusDiv = document.getElementById('my-registration-status');
    const progressSection = document.getElementById('progress-section');
    const progressForm = document.getElementById('progress-form');

    try {
        // --- BƯỚC 1: RESET TRẠNG THÁI ---
        // Luôn ẩn khu vực tiến độ và xóa các thông tin cũ trên form
        progressSection.classList.add('hidden');
        progressForm.removeAttribute('data-registration-id');
        progressForm.removeAttribute('data-lecturer-id');
        statusDiv.innerHTML = ''; 

        // --- BƯỚC 2: LẤY THÔNG TIN MỚI ---
        const registration = await api.getMyRegistration();

        if (!registration || registration.status === 'rejected') {
            studentHasRegistration = false;
            let message = '<p>Bạn chưa đăng ký đề tài nào.</p>';
            if (registration && registration.status === 'rejected') {
                message = `<p class="status-rejected-message">Rất tiếc, đăng ký cho đề tài "<em>${registration.title}</em>" đã bị từ chối. Vui lòng chọn một đề tài khác.</p>`;
            }
            statusDiv.innerHTML = message;
        } else if (registration.status === 'pending') {
            studentHasRegistration = true;
            statusDiv.innerHTML = `<div class="topic-card pending-topic"><h4>${registration.title}</h4><p>Trạng thái: <strong class="status status-pending">Đang chờ giảng viên duyệt...</strong></p></div>`;
        } else if (registration.status === 'approved') {
            studentHasRegistration = true;
            statusDiv.innerHTML = `<div class="topic-card registered-topic"><h4>${registration.title}</h4><p class="lecturer">GVHD: ${registration.lecturer_name}</p><p><strong>Trạng thái: <span class="status status-approved">Đã được duyệt</span></strong></p></div>`;
            
            // --- BƯỚC 3: CẬP NHẬT GIAO DIỆN VỚI DỮ LIỆU MỚI ---
            progressSection.classList.remove('hidden');
            
            // Gán lại các giá trị dataset chính xác cho form
            progressForm.dataset.registrationId = registration.registration_id;
            progressForm.dataset.lecturerId = registration.lecturer_id;
            
            progressForm.onsubmit = handleProgressSubmit;
            
            loadAndRenderProgress(registration.registration_id);
        }
        
        loadAllTopics();
    } catch (error) {
        console.error("Lỗi khi tải trạng thái đăng ký:", error);
        statusDiv.innerHTML = '<p style="color: red;">Không thể tải thông tin đề tài.</p>';
    }
}

// --- LOGIC CHO VAI TRÒ GIẢNG VIÊN ---

async function handleCreateTopic(event) {
    event.preventDefault();
    const title = document.getElementById('topic-title').value;
    const description = document.getElementById('topic-description').value;
    try {
        await api.createTopic(title, description);
        alert('Tạo đề tài thành công!');
        event.target.reset();
        loadAllTopics();
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

async function handleUpdateStatus(event) {
    const button = event.target;
    const registrationId = button.dataset.id;
    const action = button.dataset.action;
    if (!confirm(`Bạn có chắc chắn muốn ${action === 'approved' ? 'DUYỆT' : 'TỪ CHỐI'} đăng ký này?`)) return;
    try {
        await api.updateRegistrationStatus(registrationId, action);
        alert(`Đã ${action === 'approved' ? 'duyệt' : 'từ chối'} thành công!`);
        loadPendingRegistrations();
        loadAllTopics();
    } catch (error) {
        alert(`Lỗi: ${error.message}`);
    }
}

function renderPendingRegistrations(registrations) {
    const listContainer = document.getElementById('pending-registrations-list');
    listContainer.innerHTML = '';
    if (!registrations || registrations.length === 0) {
        listContainer.innerHTML = '<p>Không có sinh viên nào đang chờ duyệt.</p>';
        return;
    }
    registrations.forEach(reg => {
        const item = document.createElement('div');
        item.className = 'pending-item';
        item.innerHTML = `<p><strong>${reg.student_name}</strong> đã đăng ký đề tài "<em>${reg.topic_title}</em>"</p><div class="actions"><button class="btn btn-success" data-id="${reg.registration_id}" data-action="approved">Duyệt</button><button class="btn btn-danger" data-id="${reg.registration_id}" data-action="rejected">Từ chối</button></div>`;
        listContainer.appendChild(item);
    });
    listContainer.querySelectorAll('.btn-success, .btn-danger').forEach(button => {
        button.addEventListener('click', handleUpdateStatus);
    });
}

async function loadPendingRegistrations() {
    try {
        const registrations = await api.getPendingRegistrations();
        renderPendingRegistrations(registrations);
    } catch (error) {
        console.error("Lỗi khi tải danh sách chờ duyệt:", error);
    }
}

async function handleCommentSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const content = form.querySelector('textarea').value;
    const updateId = form.dataset.updateId;
    const studentId = form.dataset.studentId; // Lấy studentId từ form
    const registrationId = form.dataset.registrationId;

    try {
        await api.createComment(updateId, content);

        // Chuẩn bị dữ liệu để gửi đi
        const commentData = {
            content: content,
            studentId: parseInt(studentId) // Đảm bảo studentId là một số
        };
        
        // Log để kiểm tra
        console.log("GV Đang gửi sự kiện 'lecturer_give_comment' với dữ liệu:", commentData);
        
        // Gửi sự kiện real-time tới sinh viên
        emitLecturerComment(commentData);

        alert('Gửi nhận xét thành công!');
        loadAndRenderLecturerProgress(registrationId, studentId);
    } catch (error) {
        alert('Lỗi khi gửi nhận xét: ' + error.message);
    }
}

function renderLecturerProgressHistory(history, registrationId, studentId) {
    modalProgressHistory.innerHTML = '';
    if (!history || history.length === 0) {
        modalProgressHistory.innerHTML = '<p><em>Sinh viên chưa có cập nhật nào.</em></p>';
        return;
    }
    history.forEach(update => {
        const updateDate = new Date(update.update_created_at).toLocaleString('vi-VN');
        const imageHTML = update.file_path ? `<img src="http://localhost:3000${update.file_path}" alt="Ảnh đính kèm" class="progress-image">` : '';
        const updateHTML = `<div class="update-block"><p>${update.update_content}</p>${imageHTML}<div class="block-meta">Sinh viên đã gửi lúc: ${updateDate}</div></div>`;
        modalProgressHistory.innerHTML += updateHTML;
        if (update.comments && update.comments.length > 0) {
            update.comments.forEach(comment => {
                const commentDate = new Date(comment.comment_created_at).toLocaleString('vi-VN');
                const commentHTML = `<div class="comment-block"><p><strong>Bạn nhận xét:</strong> ${comment.comment_content}</p><div class="block-meta">Lúc: ${commentDate}</div></div>`;
                modalProgressHistory.innerHTML += commentHTML;
            });
        } else {
            const commentFormHTML = `<form class="comment-form" data-update-id="${update.update_id}" data-registration-id="${registrationId}" data-student-id="${studentId}"><div class="form-group"><label>Gửi nhận xét cho cập nhật này:</label><textarea rows="3" required></textarea></div><button type="submit" class="btn">Gửi nhận xét</button></form>`;
            modalProgressHistory.innerHTML += commentFormHTML;
        }
    });
    modalProgressHistory.querySelectorAll('.comment-form').forEach(form => {
        form.addEventListener('submit', handleCommentSubmit);
    });
}

async function loadAndRenderLecturerProgress(registrationId, studentId) {
    try {
        const history = await api.getProgressHistory(registrationId);
        renderLecturerProgressHistory(history, registrationId, studentId);
    } catch (error) {
        console.error('Lỗi tải lịch sử:', error);
    }
}

// --- CÁC HÀM CHUNG ---

async function loadAllTopics() {
    try {
        const topics = await api.getAllTopics();
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        // === SỬA LẠI ĐÂY: Truyền cả đối tượng userInfo đi ===
        renderTopics(topics, userInfo); 
    } catch (error) {
        console.error("Không thể tải danh sách đề tài:", error);
        document.getElementById('topics-list').innerHTML = `<p style="color: red;">Lỗi khi tải danh sách đề tài.</p>`;
    }
}

function renderTopics(topics, userInfo) {
    const topicsList = document.getElementById('topics-list');
    const userRole = userInfo.role;
    topicsList.innerHTML = '';

    if (!topics || topics.length === 0) {
        topicsList.innerHTML = '<p>Hiện chưa có đề tài nào.</p>';
        return;
    }

    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';

        // --- TẠO CÁC CHUỖI HTML RIÊNG BIỆT ---

        // Nội dung chính của đề tài
        const contentHTML = `
            <div class="topic-content">
                <h4>${topic.title}</h4>
                <p class="lecturer">GVHD: ${topic.lecturer_name}</p>
                <p>${topic.description}</p>
                ${topic.student_name
                    ? `<p><strong>Sinh viên đăng ký:</strong> ${topic.student_name}</p>`
                    : `<p><strong>Trạng thái:</strong> Còn trống</p>`
                }
            </div>
        `;

        // Các nút hành động (Sửa/Xóa/Đăng ký)
        let actionsHTML = '';
        if (userRole === 'lecturer' && topic.lecturer_id == userInfo.userId && !topic.student_name) {
            actionsHTML = `
                <div class="topic-actions">
                    <button class="btn btn-sm btn-edit-topic" data-topic-id="${topic.topic_id}">Sửa</button>
                    <button class="btn btn-sm btn-danger btn-delete-topic" data-topic-id="${topic.topic_id}">Xóa</button>
                </div>
            `;
        } else if (userRole === 'student' && !topic.student_name && !studentHasRegistration) {
            // Đặt nút đăng ký vào cùng khu vực actions
            actionsHTML = `
                <div class="topic-actions">
                    <button class="btn register-btn" data-topic-id="${topic.topic_id}">Đăng ký</button>
                </div>
            `;
        }
        
        // --- GHÉP CÁC PHẦN LẠI VÀ RENDER ---

        topicCard.innerHTML = contentHTML + actionsHTML;

        // Gắn sự kiện click để xem tiến độ (nếu là giảng viên)
        if (userRole === 'lecturer' && topic.student_name) {
            topicCard.style.cursor = 'pointer';
            topicCard.addEventListener('click', () => openLecturerProgressModal(topic));
        }
        
        topicsList.appendChild(topicCard);
    });

    // === GẮN SỰ KIỆN CHO CÁC NÚT VỪA TẠO ===
    document.querySelectorAll('.btn-edit-topic').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const topicId = e.target.dataset.topicId;
            const topicData = topics.find(t => t.topic_id == topicId);
            if (topicData) openEditModal(topicData);
        });
    });

    document.querySelectorAll('.btn-delete-topic').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const topicId = e.target.dataset.topicId;
            handleDeleteTopic(topicId);
        });
    });
    
    document.querySelectorAll('.register-btn').forEach(button => {
        button.addEventListener('click', handleRegisterTopic);
    });
}

 // Gắn sự kiện cho các nút chỉnh sửa và xóa
    document.querySelectorAll('.btn-edit-topic').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Ngăn sự kiện click của thẻ cha
            const topicId = e.target.dataset.topicId;
            const topicData = topics.find(t => t.topic_id == topicId);
            openEditModal(topicData);
        });
    });

    document.querySelectorAll('.btn-delete-topic').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const topicId = e.target.dataset.topicId;
            handleDeleteTopic(topicId);
        });
    });


function openLecturerProgressModal(topic) {
    if(!modalTopicTitle) return;
    modalTopicTitle.textContent = `Chi tiết tiến độ: ${topic.title}`;
    api.getRegistrationByTopic(topic.topic_id)
        .then(reg => {
            if (reg && reg.registration_id) {
                console.log(`[GV-Side] Lấy được registration_id: ${reg.registration_id} cho sinh viên ${reg.student_id}. Bắt đầu tải lịch sử...`);
                loadAndRenderLecturerProgress(reg.registration_id, reg.student_id);
                progressModal.classList.remove('hidden');
            } else {
                alert('Lỗi: Không tìm thấy thông tin đăng ký cho đề tài này.');
            }
        })
        .catch(err => {
            console.error("Lỗi khi lấy thông tin đăng ký:", err);
            alert("Đã xảy ra lỗi khi cố gắng xem chi tiết.");
        });
}


// === HÀM CHÍNH CHẠY KHI TẢI TRANG ===
document.addEventListener('DOMContentLoaded', () => {
    // === GÁN THÊM BIẾN CHO MODAL SỬA ===
    editTopicModal = document.getElementById('edit-topic-modal');
    editTopicForm = document.getElementById('edit-topic-form');
    closeEditModalBtn = document.getElementById('close-edit-modal');
    
        // Bước 1: Gán giá trị cho các biến DOM sau khi HTML đã sẵn sàng
    notificationBell = document.getElementById('notification-bell');
    notificationCount = document.getElementById('notification-count');
    notificationPanel = document.getElementById('notification-panel');
    progressModal = document.getElementById('lecturer-progress-modal');
    modalTopicTitle = document.getElementById('modal-topic-title');
    modalProgressHistory = document.getElementById('modal-progress-history');
    closeProgressModalBtn = document.getElementById('close-progress-modal');

    // Bước 2: Kiểm tra xác thực
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || !localStorage.getItem('authToken')) {
        logout();
        return;
    }

    // Bước 3: Cập nhật giao diện và gắn sự kiện
    document.getElementById('user-fullname').textContent = userInfo.fullName;
    document.getElementById('user-role').textContent = userInfo.role;
    document.getElementById('logout-btn').addEventListener('click', logout);
    const createTopicForm = document.getElementById('create-topic-form');
    if (createTopicForm) {
        createTopicForm.addEventListener('submit', handleCreateTopic);
    }
    if (closeProgressModalBtn) {
        closeProgressModalBtn.addEventListener('click', closeProgressModal);
    }
    window.addEventListener('click', (e) => { 
        if (e.target == progressModal) closeProgressModal();
    });

    // Thiết lập hệ thống thông báo
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            notificationPanel.classList.toggle('hidden');
            if (!notificationPanel.classList.contains('hidden')) {
                markNotificationsAsRead();
            }
        });
    }
    window.addEventListener('new-notification', (e) => {
        const message = e.detail;
        displayNotification(message);
        notifications.unshift({ message: message, read: false });
        updateNotificationUI();
    });
    updateNotificationUI(); // Khởi tạo

    // Bước 4: Tải dữ liệu và hiển thị theo vai trò
    if (userInfo.role === 'admin') {
        document.getElementById('admin-link').classList.remove('hidden');
        document.getElementById('lecturer-section').style.display = 'none';
        document.getElementById('student-section').style.display = 'none';
        const topicsSection = document.getElementById('topics-section');
        if (topicsSection) topicsSection.style.display = 'none';
        document.querySelectorAll('main.container hr').forEach(hr => { hr.style.display = 'none'; });
    } else if (userInfo.role === 'lecturer') {
        document.getElementById('lecturer-section').classList.remove('hidden');
        loadPendingRegistrations();
        loadAllTopics();
    } else if (userInfo.role === 'student') {
        document.getElementById('student-section').classList.remove('hidden');
        loadMyRegistrationStatus();
    }

    // Gắn sự kiện cho modal chỉnh sửa
     if (editTopicForm) {
        editTopicForm.addEventListener('submit', handleEditTopicSubmit);
    }
    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener('click', closeEditModal);
    }
    window.addEventListener('click', (e) => { 
        if (e.target == progressModal || e.target == editTopicModal) {
            closeProgressModal();
            closeEditModal();
        }
    });

    // Bước 5: Kết nối Socket.IO
    connectSocket();
});