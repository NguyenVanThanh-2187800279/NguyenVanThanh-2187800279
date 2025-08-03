import * as api from './api.js';

// Các biến DOM
const userListBody = document.getElementById('user-list-body');
const modal = document.getElementById('user-modal');
const modalTitle = document.getElementById('modal-title');
const userForm = document.getElementById('user-form');
const closeBtn = document.querySelector('.close-btn');
const createUserBtn = document.getElementById('create-user-btn');

let currentEditUserId = null;

// Hàm render danh sách người dùng ra bảng
function renderUsers(users) {
    userListBody.innerHTML = '';
    users.forEach(user => {
        const row = `
            <tr>
                <td>${user.user_id}</td>
                <td>${user.username}</td>
                <td>${user.full_name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td class="actions">
                    <button class="btn btn-edit" data-id="${user.user_id}">Sửa</button>
                    <button class="btn btn-danger btn-delete" data-id="${user.user_id}">Xóa</button>
                </td>
            </tr>
        `;
        userListBody.innerHTML += row;
    });
}

// Hàm tải tất cả người dùng
async function loadUsers() {
    try {
        const users = await api.getAllUsers();
        renderUsers(users);
    } catch (error) {
        alert('Lỗi khi tải danh sách người dùng: ' + error.message);
    }
}

// Mở modal
function openModal(mode, userData = {}) {
    userForm.reset();
    if (mode === 'create') {
        modalTitle.textContent = 'Tạo người dùng mới';
        currentEditUserId = null;
        document.getElementById('password').required = true;
         document.getElementById('password-group').style.display = 'block';
    } else {
        modalTitle.textContent = 'Sửa thông tin người dùng';
        currentEditUserId = userData.user_id;
        document.getElementById('user-id').value = userData.user_id;
        document.getElementById('username').value = userData.username;
        document.getElementById('username').disabled = true; // Không cho sửa username
        document.getElementById('fullName').value = userData.full_name;
        document.getElementById('email').value = userData.email;
        document.getElementById('role').value = userData.role;
        document.getElementById('password').required = false;
        document.getElementById('password-group').style.display = 'block'; // Có thể sửa
    }
    modal.classList.remove('hidden');
}

// Đóng modal
function closeModal() {
    modal.classList.add('hidden');
}

// Xử lý form submit (Tạo hoặc Sửa)
async function handleFormSubmit(e) {
    e.preventDefault();
    const userData = {
        fullName: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        role: document.getElementById('role').value,
    };

    try {
        if (currentEditUserId) { // Chế độ sửa
            await api.updateUser(currentEditUserId, userData);
            alert('Cập nhật thành công!');
        } else { // Chế độ tạo
            userData.username = document.getElementById('username').value;
            userData.password = document.getElementById('password').value;
            await api.createUser(userData);
            alert('Tạo người dùng thành công!');
        }
        closeModal();
        loadUsers();
    } catch (error) {
        alert('Lỗi: ' + error.message);
    }
}

// Xử lý click trên bảng (nút Sửa, Xóa)
function handleTableClick(e) {
    const target = e.target;
    const userId = target.dataset.id;

    if (target.classList.contains('btn-edit')) {
        const row = target.closest('tr');
        const userData = {
            user_id: userId,
            username: row.cells[1].textContent,
            full_name: row.cells[2].textContent,
            email: row.cells[3].textContent,
            role: row.cells[4].textContent,
        };
        openModal('edit', userData);
    }

    if (target.classList.contains('btn-delete')) {
        if (confirm(`Bạn có chắc chắn muốn xóa người dùng ID ${userId}? Hành động này không thể hoàn tác.`)) {
            api.deleteUser(userId)
                .then(() => {
                    alert('Xóa thành công!');
                    loadUsers();
                })
                .catch(err => alert('Lỗi khi xóa: ' + err.message));
        }
    }
}


// Chạy khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard - Bảo vệ trang
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    if (!userInfo || userInfo.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này.');
        window.location.href = 'index.html';
        return;
    }

    // Gắn các sự kiện
    createUserBtn.addEventListener('click', () => openModal('create'));
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == modal) closeModal(); });
    userForm.addEventListener('submit', handleFormSubmit);
    userListBody.addEventListener('click', handleTableClick);

    // Tải dữ liệu ban đầu
    loadUsers();
});