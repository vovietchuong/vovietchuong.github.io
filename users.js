// users.js - Quản lý dữ liệu người dùng

// Hàm khởi tạo dữ liệu người dùng nếu chưa có
function initializeUsers() {
    if (!localStorage.getItem('mathhub_users')) {
        localStorage.setItem('mathhub_users', JSON.stringify([]));
    }
}

// Hàm lấy danh sách người dùng
function getUsers() {
    return JSON.parse(localStorage.getItem('mathhub_users') || '[]');
}

// Hàm lưu danh sách người dùng
function saveUsers(users) {
    localStorage.setItem('mathhub_users', JSON.stringify(users));
}

// Hàm thêm người dùng mới
function addUser(user) {
    const users = getUsers();
    users.push(user);
    saveUsers(users);
}

// Hàm tìm người dùng theo email
function findUserByEmail(email) {
    const users = getUsers();
    return users.find(user => user.email === email);
}

// Hàm kiểm tra email đã tồn tại chưa
function isEmailExists(email) {
    return findUserByEmail(email) !== undefined;
}

// Hàm xác thực đăng nhập
function authenticateUser(email, password) {
    const user = findUserByEmail(email);
    if (user && user.password === password) {
        return user;
    }
    return null;
}

// Hàm lấy người dùng hiện tại
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('mathhub_user') || 'null');
}

// Hàm lưu người dùng hiện tại
function setCurrentUser(user) {
    if (user) {
        localStorage.setItem('mathhub_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('mathhub_user');
    }
}

// Khởi tạo dữ liệu khi load file
initializeUsers();