// auth-system.js (Cập nhật: hồ sơ cá nhân + leaderboard + storage + firestore)
class AuthSystem {
    constructor() {
        this.initFirebase();
        this.setupEventListeners();
        this.checkAuthState();
    }

    initFirebase() {
        // Cấu hình Firebase (giữ nguyên id thầy đã từng dùng)
        const firebaseConfig = {
            apiKey: "AIzaSyAPcaScN-HrCcxiUz_J1QrrREF9sxCfvD8",
            authDomain: "mathhubvn.firebaseapp.com",
            projectId: "mathhubvn",
            storageBucket: "mathhubvn.firebasestorage.app",
            messagingSenderId: "1001364433767",
            appId: "1:1001364433767:web:ae1547dc7d1524a6319dc2",
            measurementId: "G-2YNQZ48JVK"
        };

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        this.analytics = firebase.analytics ? firebase.analytics() : null;
        this.auth = firebase.auth();
        this.db = firebase.firestore();
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

        // Profile elements
        this.profileBtn = document.getElementById('profile-btn');
        this.profileModal = document.getElementById('profile-modal');
        this.closeProfile = document.getElementById('close-profile');
        this.saveProfileBtn = document.getElementById('save-profile');
        this.changePassword = document.getElementById('change-password');
        this.profileAvatarInput = document.getElementById('profile-avatar');
        this.profileAvatarPreview = document.getElementById('profile-avatar-preview');
        this.headerAvatar = document.getElementById('header-avatar');

        // Leaderboard elements
        this.leaderboardModal = document.getElementById('leaderboard-modal');
        this.closeLeaderboard = document.getElementById('close-leaderboard');
        this.closeLeaderboardBtn = document.getElementById('close-leaderboard-btn');
        this.leaderboardList = document.getElementById('leaderboard-list');
        this.leaderboardTitle = document.getElementById('leaderboard-game-title');

        // Event listeners
        if (this.loginBtn) this.loginBtn.addEventListener('click', () => this.openLoginModal());
        if (this.closeModal) this.closeModal.addEventListener('click', () => this.closeLoginModal());
        if (this.loginTab) this.loginTab.addEventListener('click', () => this.switchToLogin());
        if (this.registerTab) this.registerTab.addEventListener('click', () => this.switchToRegister());
        if (this.loginForm) this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (this.registerForm) this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());

        if (this.profileBtn) this.profileBtn.addEventListener('click', () => this.openProfile());
        if (this.closeProfile) this.closeProfile.addEventListener('click', () => this.closeProfileModal());
        if (this.saveProfileBtn) this.saveProfileBtn.addEventListener('click', () => this.saveProfile());
        if (this.changePassword) this.changePassword.addEventListener('click', () => this.handleChangePassword());
        if (this.profileAvatarInput) this.profileAvatarInput.addEventListener('change', (e) => this.previewAvatar(e));

        if (this.closeLeaderboard) this.closeLeaderboard.addEventListener('click', () => this.closeLeaderboardModal());
        if (this.closeLeaderboardBtn) this.closeLeaderboardBtn.addEventListener('click', () => this.closeLeaderboardModal());

        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target === this.loginModal) this.closeLoginModal();
            if (e.target === this.profileModal) this.closeProfileModal();
            if (e.target === this.leaderboardModal) this.closeLeaderboardModal();
        });

        // Track page view event (if analytics available)
        if (this.analytics) this.analytics.logEvent('home_page_loaded');
    }

    // ----- Login/Register -----
    openLoginModal() { this.loginModal.style.display = 'flex'; }
    closeLoginModal() { this.loginModal.style.display = 'none'; }
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
                if (this.analytics) this.analytics.logEvent('login', { method: 'email' });
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
                return user.updateProfile({ displayName: name });
            })
            .then(() => {
                this.showToast('Đăng ký thành công!', 'success');
                if (this.analytics) this.analytics.logEvent('sign_up', { method: 'email' });
                this.switchToLogin();
                // Clear registration form
                document.getElementById('register-name').value = '';
                document.getElementById('register-email').value = '';
                document.getElementById('register-password').value = '';
                document.getElementById('register-confirm').value = '';
            })
            .catch((error) => this.showToast(error.message, 'error'));
    }

    handleLogout() {
        this.auth.signOut()
            .then(() => {
                this.showToast('Đã đăng xuất!', 'success');
                if (this.analytics) this.analytics.logEvent('logout');
            })
            .catch((error) => this.showToast(error.message, 'error'));
    }

    handleForgotPassword(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value || prompt('Vui lòng nhập email của bạn:');
        if (email) {
            this.auth.sendPasswordResetEmail(email)
                .then(() => this.showToast('Email đặt lại mật khẩu đã được gửi!', 'success'))
                .catch((error) => this.showToast(error.message, 'error'));
        }
    }

    // ----- Auth state -----
    checkAuthState() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                this.userName.textContent = user.displayName || user.email;
                this.userInfo.style.display = 'flex';
                this.loginBtn.style.display = 'none';
                // header avatar
                if (user.photoURL) {
                    this.headerAvatar.innerHTML = `<img src="${user.photoURL}" alt="avatar">`;
                    this.profileAvatarPreview.src = user.photoURL;
                    this.profileAvatarPreview.style.display = 'block';
                } else {
                    this.headerAvatar.innerHTML = `<i class="fas fa-user"></i>`;
                    this.profileAvatarPreview.style.display = 'none';
                }
            } else {
                this.userInfo.style.display = 'none';
                this.loginBtn.style.display = 'block';
                this.headerAvatar.innerHTML = `<i class="fas fa-user"></i>`;
            }
        });

        // Attach forgot password link (may be null until DOM loaded)
        const fp = document.getElementById('forgot-password');
        if (fp) fp.addEventListener('click', (e) => this.handleForgotPassword(e));
    }

    // ----- Profile functions -----
    openProfile() {
        const user = this.auth.currentUser;
        if (!user) {
            this.showToast('Bạn cần đăng nhập để xem hồ sơ', 'error');
            return;
        }
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-name').value = user.displayName || '';
        if (user.photoURL) {
            this.profileAvatarPreview.src = user.photoURL;
            this.profileAvatarPreview.style.display = 'block';
        } else {
            this.profileAvatarPreview.style.display = 'none';
        }
        this.profileModal.style.display = 'flex';
    }

    closeProfileModal() { this.profileModal.style.display = 'none'; }

    previewAvatar(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.profileAvatarPreview.src = ev.target.result;
            this.profileAvatarPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }

    saveProfile() {
        const user = this.auth.currentUser;
        if (!user) {
            this.showToast('Bạn cần đăng nhập để cập nhật hồ sơ', 'error');
            return;
        }

        const newName = document.getElementById('profile-name').value.trim();
        const file = this.profileAvatarInput.files[0];

        const doUpdate = (photoURL) => {
            const updates = {};
            if (newName) updates.displayName = newName;
            if (photoURL) updates.photoURL = photoURL;

            user.updateProfile(updates)
                .then(() => {
                    // Optionally update in Firestore users collection
                    this.db.collection('users').doc(user.uid).set({
                        displayName: user.displayName || newName,
                        email: user.email,
                        photoURL: photoURL || user.photoURL || null,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    }, { merge: true }).catch(()=>{});
                    this.showToast('Cập nhật hồ sơ thành công!', 'success');
                    this.closeProfileModal();
                })
                .catch(err => this.showToast(err.message, 'error'));
        };

        if (file) {
            // Upload avatar to storage
            const ext = file.name.split('.').pop();
            const storageRef = this.storage.ref().child(`avatars/${user.uid}.${ext}`);
            const uploadTask = storageRef.put(file);

            uploadTask.on('state_changed',
                null,
                (error) => this.showToast(error.message, 'error'),
                () => {
                    uploadTask.snapshot.ref.getDownloadURL()
                        .then((url) => doUpdate(url))
                        .catch(err => this.showToast(err.message, 'error'));
                }
            );
        } else {
            doUpdate(null);
        }
    }

    handleChangePassword() {
        const user = this.auth.currentUser;
        if (!user) {
            this.showToast('Bạn cần đăng nhập để đổi mật khẩu', 'error');
            return;
        }
        const email = user.email;
        this.auth.sendPasswordResetEmail(email)
            .then(() => this.showToast('Email đổi mật khẩu đã được gửi!', 'success'))
            .catch(err => this.showToast(err.message, 'error'));
    }

    // ----- Scores / Leaderboard -----
    /**
     * Lưu điểm của user cho một game.
     * gameId: string - mã game
     * score: number - điểm
     */
    saveScore(gameId, score) {
        const user = this.auth.currentUser;
        if (!user) {
            this.showToast('Bạn cần đăng nhập để lưu điểm!', 'error');
            return Promise.reject(new Error('not-authenticated'));
        }

        const payload = {
            userId: user.uid,
            userName: user.displayName || user.email,
            gameId: gameId,
            score: Number(score),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        return this.db.collection('scores').add(payload)
            .then(() => {
                this.showToast('Điểm đã được lưu!', 'success');
                if (this.analytics) this.analytics.logEvent('score_saved', { gameId, score });
            })
            .catch(err => this.showToast(err.message, 'error'));
    }

    /**
     * Hiển thị leaderboard cho một game (top 10)
     */
    loadLeaderboard(gameId) {
        this.leaderboardList.innerHTML = '';
        this.leaderboardTitle.textContent = `Top 10 - ${gameId}`;
        // Query top scores desc
        this.db.collection('scores')
            .where('gameId', '==', gameId)
            .orderBy('score', 'desc')
            .limit(10)
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    this.leaderboardList.innerHTML = '<li>Chưa có điểm nào</li>';
                } else {
                    snapshot.forEach(doc => {
                        const data = doc.data();
                        const li = document.createElement('li');
                        const ts = data.timestamp && data.timestamp.toDate ? data.timestamp.toDate().toLocaleString() : '';
                        li.textContent = `${data.userName}: ${data.score} điểm ${ts ? ' - ' + ts : ''}`;
                        this.leaderboardList.appendChild(li);
                    });
                }
                this.leaderboardModal.style.display = 'flex';
            })
            .catch(err => this.showToast(err.message, 'error'));
    }

    closeLeaderboardModal() { this.leaderboardModal.style.display = 'none'; }

    // ----- Utility: Toast -----
    showToast(message, type = '') {
        this.toast.textContent = message;
        this.toast.className = 'toast';
        if (type) this.toast.classList.add(type);
        this.toast.classList.add('show');
        setTimeout(() => { this.toast.classList.remove('show'); }, 3000);
    }
}

// Khởi tạo khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', function() {
    window.authSystem = new AuthSystem();
    // Track page view if analytics available
    if (window.authSystem.analytics) window.authSystem.analytics.logEvent('home_page_view');
});
