// frontend/assets/js/api.js

const API_BASE_URL = 'http://localhost:3000/api'; // Đảm bảo cổng này khớp với server backend của bạn

/**
 * Hàm chung để thực hiện các yêu cầu fetch
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/auth/login')
 * @param {object} options - Các tùy chọn cho fetch (method, headers, body)
 * @returns {Promise<object>} - Dữ liệu JSON từ server
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            // Cố gắng đọc lỗi từ body, nếu không được thì dùng statusText
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || 'Có lỗi xảy ra');
        }

        // Nếu request không có nội dung trả về (ví dụ: mã 204 No Content)
        if (response.status === 204) {
            return null;
        }
        
        return response.json();
    } catch (error) {
        console.error(`Lỗi API tại ${endpoint}:`, error);
        throw error; // Ném lỗi ra để nơi gọi có thể xử lý
    }
}

// --- Các hàm cụ thể cho từng API ---

export const loginUser = (username, password) => {
    return apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    });
};

export const getAllTopics = () => {
    return apiFetch('/topics', {
        method: 'GET',
    });
};

export const createTopic = (title, description) => {
    return apiFetch('/topics', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
    });
};

export const registerForTopic = (topicId) => {
    return apiFetch('/registrations', {
        method: 'POST',
        body: JSON.stringify({ topicId }),
    });
};
export const getPendingRegistrations = () => {
    return apiFetch('/registrations/pending', {
        method: 'GET',
    });
};

export const updateRegistrationStatus = (registrationId, status) => {
    return apiFetch(`/registrations/${registrationId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }), // status là 'approved' hoặc 'rejected'
    });
};

// === HÀM MỚI ĐỂ GỌI API /registrations/me ===
export const getMyRegistration = () => {
    return apiFetch('/registrations/me', {
        method: 'GET',
    });
};

export const getAllUsers = () => {
    return apiFetch('/users');
};

export const createUser = (userData) => {
    return apiFetch('/users', { method: 'POST', body: JSON.stringify(userData) });
};

export const updateUser = (userId, userData) => {
    return apiFetch(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) });
};

export const deleteUser = (userId) => {
    return apiFetch(`/users/${userId}`, { method: 'DELETE' });
};

// === API CHO TIẾN ĐỘ ===
export const createProgressUpdate = (formData) => {
    const token = localStorage.getItem('authToken');
    return fetch(`${API_BASE_URL}/progress`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    }).then(async res => {
        if (!res.ok) {
        // Cố gắng đọc lỗi từ body JSON của server
        const errorData = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(errorData.message);
         }
    return res.json();
    });
};

export const getProgressHistory = (registrationId) => {
    return apiFetch(`/progress/${registrationId}`);
};

// === API CHO NHẬN XÉT ===
export const createComment = (updateId, content) => {
    return apiFetch('/comments', {
        method: 'POST',
        body: JSON.stringify({ updateId, content })
    });
};

// === API ĐỂ LẤY THÔNG TIN ĐĂNG KÝ CỦA MỘT ĐỀ TÀI ===
export const getRegistrationByTopic = (topicId) => {
    return apiFetch(`/topics/${topicId}/registration`);
};

// === API CHO ĐỀ TÀI ===
export const updateTopic = (topicId, topicData) => {
    return apiFetch(`/topics/${topicId}`, {
        method: 'PUT',
        body: JSON.stringify(topicData)
    });
};

export const deleteTopic = (topicId) => {
    return apiFetch(`/topics/${topicId}`, {
        method: 'DELETE'
    });
};