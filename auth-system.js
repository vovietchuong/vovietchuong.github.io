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
        this.rankingBtn = document.getElementById('ranking-btn');

        // Event listeners
        if (this.loginBtn) this.loginBtn.addEventListener('click', () => this.openLoginModal());
        if (this.closeModal) this.closeModal.addEventListener('click', () => this.closeLoginModal());
        if (this.loginTab) this.loginTab.addEventListener('click', () => this.switchToLogin());
        if (this.registerTab) this.registerTab.addEventListener('click', () => this.switchToRegister());
        if (this.loginForm) this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        if (this.registerForm) this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        if (this.logoutBtn) this.logoutBtn.addEventListener('click', () => this.handleLogout());
        if (this.profileBtn) this.profileBtn.addEventListener('click', () => this.openProfileModal());
        if (this.rankingBtn) this.rankingBtn.addEventListener('click', () => this.openRankingModal());
        
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

    openRankingModal() {
        const rankingModal = document.getElementById('ranking-modal');
        if (rankingModal) rankingModal.style.display = 'flex';
        
        // Tải dữ liệu xếp hạng
        this.loadRankings('all');
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
                // ❌ Khi logout thì xoá user khỏi localStorage
                localStorage.removeItem("currentUser");
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
                
                // ✅ Lưu thông tin user vào localStorage để game đọc được
                const currentUser = {
                    name: user.displayName || user.email,
                    email: user.email,
                    uid: user.uid
                };
                localStorage.setItem("currentUser", JSON.stringify(currentUser));

                // Khởi tạo hệ thống người dùng khi đã đăng nhập
                if (!window.userSystem && typeof UserSystem !== 'undefined') {
                    window.userSystem = new UserSystem(this);
                }
            } else {
                this.userInfo.style.display = 'none';
                this.loginBtn.style.display = 'block';
                // ❌ Nếu chưa đăng nhập thì xoá currentUser
                localStorage.removeItem("currentUser");
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

    // Phương thức lưu điểm
    saveGameScore(gameId, gameName, score, level = null) {
        const user = this.auth.currentUser;
        if (!user) return Promise.reject(new Error('User not authenticated'));
        
        const scoreData = {
            userId: user.uid,
            userName: user.displayName || 'Người dùng ẩn danh',
            gameId,
            gameName,
            score,
            level,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        return this.firestore.collection('scores').add(scoreData)
            .then(() => {
                this.analytics.logEvent('game_score_saved', {
                    game_id: gameId,
                    score: score
                });
                return scoreData;
            });
    }

    // Phương thức lấy điểm theo user
    getUserScores(limit = 50, gameFilter = 'all') {
        const user = this.auth.currentUser;
        if (!user) return Promise.resolve([]);
        
        let query = this.firestore.collection('scores')
            .where('userId', '==', user.uid);
            
        if (gameFilter !== 'all') {
            query = query.where('gameId', '==', gameFilter);
        }
            
        return query.orderBy('timestamp', 'desc')
            .limit(limit)
            .get()
            .then(querySnapshot => {
                const scores = [];
                querySnapshot.forEach(doc => {
                    scores.push({ id: doc.id, ...doc.data() });
                });
                return scores;
            });
    }

    // Phương thức lấy tất cả điểm (cho xếp hạng)
    getAllScores(limit = 100, gameFilter = 'all') {
        let query = this.firestore.collection('scores');
        
        if (gameFilter !== 'all') {
            query = query.where('gameId', '==', gameFilter);
        }
        
        return query.orderBy('score', 'desc')
            .limit(limit)
            .get()
            .then(querySnapshot => {
                const scores = [];
                querySnapshot.forEach(doc => {
                    scores.push({ id: doc.id, ...doc.data() });
                });
                return scores;
            });
    }

    // Phương thức lấy dữ liệu xếp hạng
    async loadRankings(filter) {
        const rankingList = document.getElementById('ranking-list');
        rankingList.innerHTML = '<li class="ranking-loading">Đang tải dữ liệu xếp hạng...</li>';
        
        try {
            // Lấy tất cả điểm số từ Firestore
            const scores = await this.getAllScores(100, filter);
            
            // Nhóm điểm theo user và lấy điểm cao nhất
            const userScores = {};
            
            scores.forEach(score => {
                const userId = score.userId;
                
                if (!userScores[userId] || score.score > userScores[userId].score) {
                    userScores[userId] = {
                        userId: userId,
                        score: score.score,
                        gameName: score.gameName,
                        userName: score.userName || 'Người dùng ẩn danh'
                    };
                }
            });
            
            // Chuyển đổi thành mảng và sắp xếp
            const rankings = Object.values(userScores).sort((a, b) => b.score - a.score);
            
            // Hiển thị kết quả
            this.displayRankings(rankings);
        } catch (error) {
            console.error('Lỗi khi tải xếp hạng:', error);
            rankingList.innerHTML = '<li class="ranking-loading">Có lỗi xảy ra khi tải dữ liệu.</li>';
        }
    }

    // Hiển thị bảng xếp hạng
    displayRankings(rankings) {
        const rankingList = document.getElementById('ranking-list');
        
        if (rankings.length === 0) {
            rankingList.innerHTML = '<li class="ranking-loading">Chưa có dữ liệu xếp hạng.</li>';
            return;
        }
        
        let html = '';
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        rankings.forEach((item, index) => {
            const isCurrentUser = currentUser.uid === item.userId;
            const positionClass = index < 3 ? `ranking-position-${index + 1}` : '';
            
            html += `
                <li class="ranking-item ${isCurrentUser ? 'current-user-highlight' : ''}">
                    <div class="ranking-position ${positionClass}">${index + 1}</div>
                    <div class="ranking-user">
                        <div class="ranking-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="ranking-name">${item.userName}</div>
                    </div>
                    <div class="ranking-score">${item.score} điểm</div>
                </li>
            `;
        });
        
        rankingList.innerHTML = html;
        
        // Thiết lập sự kiện cho bộ lọc xếp hạng
        const rankingFilters = document.querySelectorAll('.ranking-filter');
        rankingFilters.forEach(filter => {
            filter.addEventListener('click', () => {
                rankingFilters.forEach(f => f.classList.remove('active'));
                filter.classList.add('active');
                const filterValue = filter.dataset.filter;
                this.loadRankings(filterValue);
            });
        });
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
    
    // Đóng modal ranking
    const closeRankingModal = document.getElementById('close-ranking-modal');
    if (closeRankingModal) {
        closeRankingModal.addEventListener('click', () => {
            document.getElementById('ranking-modal').style.display = 'none';
        });
    }
});