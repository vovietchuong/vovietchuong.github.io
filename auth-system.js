// auth-system.js
class AuthSystem {
    constructor() {
        this.initFirebase();
        this.setupEventListeners();
        this.checkAuthState();
    }

    initFirebase() {
        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyAPcaScN-HrCcxiUz_J1QrrREF9sxCfvD8",
            authDomain: "mathhubvn.firebaseapp.com",
            projectId: "mathhubvn",
            storageBucket: "mathhubvn.firebasestorage.app",
            messagingSenderId: "1001364433767",
            appId: "1:1001364433767:web:ae1547dc7d1524a6319dc2",
            measurementId: "G-2YNQZ48JVK"
        };

        // Initialize Firebase với nhiều services
        firebase.initializeApp(firebaseConfig);
        this.analytics = firebase.analytics();
        this.auth = firebase.auth();
        // Khởi tạo Firestore và Storage
        this.firestore = firebase.firestore();
        this.storage = firebase.storage();
    }

    setupEventListeners() {
        // DOM Elements
        this.loginBtn = document.getElementById('login-btn');
        this.logoutBtn = document.getElementById('logout-btn');
        this.userInfo = document.getElementById('user-info');
        this.userName = document.getElementById('user-name');
        this.loginModal = document.getElementById('login-modal');
        this.closeModal = document.getElementById('close-modal');
        this.loginTab = document.getElementById('login-tab');
        this.registerTab = document.getElementById('register-tab');
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.toast = document.getElementById('toast');
        this.profileBtn = document.getElementById('profile-btn');

        // Event listeners
        if (this.loginBtn) this.loginBtn.addEventListener('click', () => this.openLoginModal());
        if (this.closeModal) this.closeModal.addEventListener('click', () => this.closeLoginModal());
        if (this.loginTab) this.loginTab.addEventListener('click', () => this.switchToLogin());
        if (this.registerTab) this.registerTab.addEventListener('click', () => this.switchToRegister());
        if (this.loginForm) this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (this.registerForm) this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());
        if (this.profileBtn) this.profileBtn.addEventListener('click', () => this.openProfileModal());
        
        const forgotPassword = document.getElementById('forgot-password');
        if (forgotPassword) forgotPassword.addEventListener('click', (e) => this.handleForgotPassword(e));
    }

    openLoginModal() {
        if (this.loginModal) this.loginModal.style.display = 'flex';
    }

    closeLoginModal() {
        if (this.loginModal) this.loginModal.style.display = 'none';
    }

    openProfileModal() {
        const profileModal = document.getElementById('profile-modal');
        if (profileModal) profileModal.style.display = 'flex';
        
        // Tải dữ liệu hồ sơ nếu hệ thống người dùng đã khởi tạo
        if (window.userSystem) {
            window.userSystem.loadProfileData();
        }
    }

    switchToLogin() {
        this.loginTab.classList.add('active');
        this.registerTab.classList.remove('active');
        this.loginForm.classList.add('active');
        this.registerForm.classList.remove('active');
    }

    switchToRegister() {
        this.registerTab.classList.add('active');
        this.loginTab.classList.remove('active');
        this.registerForm.classList.add('active');
        this.loginForm.classList.remove('active');
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        this.auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                this.showToast('Đăng nhập thành công!', 'success');
                this.analytics.logEvent('login', { method: 'email' });
                this.closeLoginModal();
            })
            .catch((error) => {
                this.showToast(error.message, 'error');
            });
    }

    handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        
        if (password !== confirm) {
            this.showToast('Mật khẩu xác nhận không khớp!', 'error');
            return;
        }
        
        this.auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return user.updateProfile({
                    displayName: name
                });
            })
            .then(() => {
                this.showToast('Đăng ký thành công!', 'success');
                this.analytics.logEvent('sign_up', { method: 'email' });
                this.switchToLogin();
                
                // Clear registration form
                document.getElementById('register-name').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm').value = '';
            })
            .catch((error) => {
                this.showToast(error.message, 'error');
            });
    }

    handleLogout() {
        this.auth.signOut()
            .then(() => {
                this.showToast('Đã đăng xuất!', 'success');
                this.analytics.logEvent('logout');
            })
            .catch((error) => {
                this.showToast(error.message, 'error');
            });
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value || prompt('Vui lòng nhập email của bạn:');
        
        if (email) {
            this.auth.sendPasswordResetEmail(email)
                .then(() => {
                    this.showToast('Email đặt lại mật khẩu đã được gửi!', 'success');
                })
                .catch((error) => {
                    this.showToast(error.message, 'error');
                });
        }
    }

    checkAuthState() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.userName.textContent = user.displayName || user.email;
                this.userInfo.style.display = 'flex';
                this.loginBtn.style.display = 'none';
                
                // Khởi tạo hệ thống người dùng khi đã đăng nhập
                if (!window.userSystem && typeof UserSystem !== 'undefined') {
                    window.userSystem = new UserSystem(this);
                }
            } else {
                this.userInfo.style.display = 'none';
                this.loginBtn.style.display = 'block';
            }
        });
    }

    showToast(message, type = '') {
        this.toast.textContent = message;
        this.toast.className = 'toast';
        if (type) this.toast.classList.add(type);
        this.toast.classList.add('show');
        
        setTimeout(() => {
            this.toast.classList.remove('show');
        }, 3000);
    }
}

// Khởi tạo hệ thống xác thực khi DOM đã sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    window.authSystem = new AuthSystem();
    
    // Track page view
    if (window.authSystem.analytics) {
        window.authSystem.analytics.logEvent('home_page_view');
    }
    
    // Đóng modal khi click bên ngoài
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    // Đóng modal profile
    const closeProfileModal = document.getElementById('close-profile-modal');
    if (closeProfileModal) {
        closeProfileModal.addEventListener('click', () => {
            document.getElementById('profile-modal').style.display = 'none';
        });
    }
});