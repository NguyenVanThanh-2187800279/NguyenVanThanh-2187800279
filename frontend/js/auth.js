// frontend/assets/js/auth.js

import { loginUser } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const messageElement = document.getElementById('login-message');

    // Nếu người dùng đã đăng nhập mà vào lại trang login, chuyển họ về trang chính
    if (localStorage.getItem('authToken')) {
        window.location.href = 'index.html';
        return;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            messageElement.textContent = ''; // Xóa thông báo cũ

            const username = loginForm.username.value;
            const password = loginForm.password.value;

            try {
                const data = await loginUser(username, password);
                
                if (data && data.token) {
                    // Lưu token và thông tin người dùng vào localStorage
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userInfo', JSON.stringify(data.user));

                    // Chuyển hướng đến trang chính
                    window.location.href = 'index.html';
                }
            } catch (error) {
                // Hiển thị lỗi cho người dùng
                messageElement.textContent = error.message || "Đăng nhập thất bại. Vui lòng thử lại.";
                messageElement.style.color = 'red';
            }
        });
    }
});