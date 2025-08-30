// user-system.js
class UserSystem {
    constructor(authSystem) {
        this.authSystem = authSystem;
        this.init();
        this.scoresPerPage = 10; // Số điểm mỗi trang
    }

    init() {
        this.setupEventListeners();
        this.loadProfileData();
    }

    setupEventListeners() {
        // Profile form submission
        const profileForm = document.getElementById('profile-form');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }

        // Avatar change
        const changeAvatarBtn = document.getElementById('change-avatar-btn');
        const avatarUpload = document.getElementById('avatar-upload');
        if (changeAvatarBtn && avatarUpload) {
            changeAvatarBtn.addEventListener('click', () => avatarUpload.click());
            avatarUpload.addEventListener('change', (e) => this.handleAvatarUpload(e));
        }

        // Progress filters
        const progressGameFilter = document.getElementById('progress-game-filter');
        const progressSort = document.getElementById('progress-sort');
        if (progressGameFilter) {
            progressGameFilter.addEventListener('change', () => this.loadProgressData());
        }
        if (progressSort) {
            progressSort.addEventListener('change', () => this.loadProgressData());
        }

        // Challenge button
        const challengeBtn = document.getElementById('challenge-btn');
        if (challengeBtn) {
            challengeBtn.addEventListener('click', () => this.openChallengeModal());
        }

        // Send challenge
        const sendChallengeBtn = document.getElementById('send-challenge-btn');
        if (sendChallengeBtn) {
            sendChallengeBtn.addEventListener('click', () => this.sendChallenge());
        }
    }

    async loadProfileData() {
        const user = this.authSystem.auth.currentUser;
        if (!user) return;

        // Update profile form
        document.getElementById('profile-name').value = user.displayName || '';
        document.getElementById('profile-email').value = user.email || '';

        // Update avatar if exists
        if (user.photoURL) {
            const avatarElement = document.getElementById('profile-avatar');
            if (avatarElement) {
                avatarElement.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                userAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
        }

        // Load progress data
        this.loadProgressData();

        // Load challenge history
        this.loadChallengeHistory();
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        const user = this.authSystem.auth.currentUser;
        if (!user) return;

        const name = document.getElementById('profile-name').value;
        
        try {
            await user.updateProfile({
                displayName: name
            });

            // Update UI
            document.getElementById('user-name').textContent = name;
            
            // Update localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.name = name;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            this.authSystem.showToast('Cập nhật hồ sơ thành công!', 'success');
        } catch (error) {
            this.authSystem.showToast(error.message, 'error');
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        const user = this.authSystem.auth.currentUser;
        if (!user) return;

        try {
            // Upload to Firebase Storage
            const storageRef = this.authSystem.storage.ref();
            const avatarRef = storageRef.child(`avatars/${user.uid}`);
            await avatarRef.put(file);

            // Get download URL
            const downloadURL = await avatarRef.getDownloadURL();

            // Update user profile
            await user.updateProfile({
                photoURL: downloadURL
            });

            // Update UI
            const avatarElement = document.getElementById('profile-avatar');
            if (avatarElement) {
                avatarElement.innerHTML = `<img src="${downloadURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }

            // Update user avatar in header
            const userAvatar = document.getElementById('user-avatar');
            if (userAvatar) {
                userAvatar.innerHTML = `<img src="${downloadURL}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }

            // Update localStorage
            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            currentUser.photoURL = downloadURL;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));

            this.authSystem.showToast('Cập nhật ảnh đại diện thành công!', 'success');
        } catch (error) {
            this.authSystem.showToast(error.message, 'error');
        }
    }

    async loadProgressData(page = 1) {
        const user = this.authSystem.auth.currentUser;
        if (!user) return;

        const progressList = document.getElementById('progress-list');
        if (!progressList) return;

        progressList.innerHTML = '<p class="no-progress">Đang tải dữ liệu...</p>';

        try {
            let query = this.authSystem.firestore.collection('scores')
                .where('userId', '==', user.uid);

            // Apply game filter
            const gameFilter = document.getElementById('progress-game-filter').value;
            if (gameFilter !== 'all') {
                query = query.where('gameId', '==', gameFilter);
            }

            // Apply sort
            const sortValue = document.getElementById('progress-sort').value;
            let sortField, sortDirection;
            
            switch (sortValue) {
                case 'newest':
                    sortField = 'timestamp';
                    sortDirection = 'desc';
                    break;
                case 'oldest':
                    sortField = 'timestamp';
                    sortDirection = 'asc';
                    break;
                case 'highest':
                    sortField = 'score';
                    sortDirection = 'desc';
                    break;
                case 'lowest':
                    sortField = 'score';
                    sortDirection = 'asc';
                    break;
                default:
                    sortField = 'timestamp';
                    sortDirection = 'desc';
            }

            // Get total count for pagination
            const countQuery = await query.count().get();
            const totalScores = countQuery.data().count;
            const totalPages = Math.ceil(totalScores / this.scoresPerPage);

            // Get paginated data
            const snapshot = await query
                .orderBy(sortField, sortDirection)
                .limit(this.scoresPerPage)
                .offset((page - 1) * this.scoresPerPage)
                .get();

            const scores = [];
            snapshot.forEach(doc => {
                scores.push({ id: doc.id, ...doc.data() });
            });

            // Calculate stats
            this.calculateStats(scores);

            // Display scores
            this.displayProgressScores(scores, page, totalPages);
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu tiến trình:', error);
            progressList.innerHTML = '<p class="no-progress">Có lỗi xảy ra khi tải dữ liệu.</p>';
        }
    }

    calculateStats(scores) {
        if (scores.length === 0) {
            document.getElementById('total-games').textContent = '0';
            document.getElementById('high-score').textContent = '0';
            document.getElementById('average-score').textContent = '0';
            return;
        }

        const totalGames = scores.length;
        const highScore = Math.max(...scores.map(score => score.score));
        const averageScore = scores.reduce((sum, score) => sum + score.score, 0) / totalGames;

        document.getElementById('total-games').textContent = totalGames;
        document.getElementById('high-score').textContent = highScore;
        document.getElementById('average-score').textContent = averageScore.toFixed(1);
    }

    displayProgressScores(scores, currentPage, totalPages) {
        const progressList = document.getElementById('progress-list');
        const pagination = document.getElementById('progress-pagination');

        if (scores.length === 0) {
            progressList.innerHTML = '<p class="no-progress">Chưa có dữ liệu tiến trình. Hãy chơi các trò chơi để xem tiến trình tại đây!</p>';
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        scores.forEach(score => {
            const date = score.timestamp ? score.timestamp.toDate().toLocaleDateString('vi-VN') : 'Chưa xác định';
            
            html += `
                <div class="progress-item">
                    <div class="progress-game">${score.gameName}</div>
                    <div class="progress-score">${score.score} điểm</div>
                    <div class="progress-date">${date}</div>
                </div>
            `;
        });

        progressList.innerHTML = html;

        // Create pagination
        this.createProgressPagination(pagination, currentPage, totalPages);
    }

    createProgressPagination(element, currentPage, totalPages) {
        if (totalPages <= 1) {
            element.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Nút Previous
        if (currentPage > 1) {
            html += `<button class="pagination-btn" data-page="${currentPage - 1}">←</button>`;
        }
        
        // Các trang
        for (let i = 1; i <= totalPages; i++) {
            if (i === currentPage) {
                html += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
            } else if (
                i === 1 || 
                i === totalPages || 
                (i >= currentPage - 1 && i <= currentPage + 1)
            ) {
                html += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            } else if (
                i === currentPage - 2 || 
                i === currentPage + 2
            ) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        // Nút Next
        if (currentPage < totalPages) {
            html += `<button class="pagination-btn" data-page="${currentPage + 1}">→</button>`;
        }
        
        element.innerHTML = html;
        
        // Thêm sự kiện cho các nút phân trang
        element.querySelectorAll('.pagination-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.loadProgressData(page);
            });
        });
    }

    openChallengeModal() {
        const challengeModal = document.getElementById('challenge-modal');
        if (challengeModal) challengeModal.style.display = 'flex';
        
        // Load friends list for challenge
        this.loadFriendsForChallenge();
    }

    async loadFriendsForChallenge() {
        // Placeholder - sẽ được phát triển trong phiên bản tiếp theo
        const challengeFriend = document.getElementById('challenge-friend');
        if (challengeFriend) {
            challengeFriend.innerHTML = `
                <option value="">-- Tính năng bạn bè sẽ được phát triển sau --</option>
            `;
        }
    }

    async sendChallenge() {
        const friendId = document.getElementById('challenge-friend').value;
        const gameId = document.getElementById('challenge-game').value;
        const message = document.getElementById('challenge-message').value;

        if (!friendId) {
            this.authSystem.showToast('Vui lòng chọn một người bạn để thách đấu!', 'error');
            return;
        }

        try {
            // Placeholder - sẽ được phát triển trong phiên bản tiếp theo
            this.authSystem.showToast('Tính năng thách đấu sẽ được phát triển trong phiên bản tiếp theo!', 'success');
            
            // Clear form
            document.getElementById('challenge-message').value = '';
        } catch (error) {
            this.authSystem.showToast('Có lỗi xảy ra khi gửi thách đấu: ' + error.message, 'error');
        }
    }

    async loadChallengeHistory() {
        // Placeholder - sẽ được phát triển trong phiên bản tiếp theo
        const challengeHistoryList = document.getElementById('challenge-history-list');
        if (challengeHistoryList) {
            challengeHistoryList.innerHTML = `
                <p style="text-align: center; color: #777; padding: 20px;">
                    Tính năng thách đấu sẽ được phát triển trong phiên bản tiếp theo.
                </p>
            `;
        }
    }
}

// Thêm CSS cho các phần tử mới
const progressStyles = `
    .progress-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border-bottom: 1px solid #eee;
        transition: background 0.3s ease;
    }
    
    .progress-item:hover {
        background: #f8f9fa;
    }
    
    .progress-game {
        flex: 2;
        font-weight: 500;
    }
    
    .progress-score {
        flex: 1;
        text-align: center;
        font-weight: bold;
        color: #4a90e2;
    }
    
    .progress-date {
        flex: 1;
        text-align: right;
        color: #777;
        font-size: 0.9rem;
    }
    
    @media (max-width: 768px) {
        .progress-item {
            flex-direction: column;
            text-align: center;
            gap: 0.5rem;
        }
        
        .progress-game,
        .progress-score,
        .progress-date {
            text-align: center;
        }
    }
`;

// Thêm styles vào DOM
if (document.head) {
    const styleElement = document.createElement('style');
    styleElement.textContent = progressStyles;
    document.head.appendChild(styleElement);
}