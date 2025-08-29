// user-system.js
class UserSystem {
    constructor(authSystem) {
        this.authSystem = authSystem;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const filterElement = document.getElementById('progress-filter');
        if (filterElement) {
            filterElement.addEventListener('change', () => {
                this.loadScores();
            });
        }
    }

    loadProfileData() {
        this.loadScores();
        this.loadUserInfo();
        this.updateAvatarDisplay();
    }

    loadUserInfo() {
        const user = this.authSystem.auth.currentUser;
        if (user) {
            document.getElementById('profile-name').value = user.displayName || '';
            document.getElementById('profile-email').value = user.email || '';
        }
    }

    loadScores() {
        this.authSystem.getUserScores().then(scores => {
            const progressList = document.getElementById('progress-list');
            const filter = document.getElementById('progress-filter').value;
            
            // Lọc scores nếu cần
            let filteredScores = scores;
            if (filter !== 'all') {
                filteredScores = scores.filter(score => score.gameId === filter);
            }
            
            // Cập nhật thống kê
            const stats = this.calculateStats(filteredScores);
            this.updateStatsDisplay(stats);
            
            if (filteredScores.length === 0) {
                progressList.innerHTML = '<p class="no-progress" style="text-align: center; color: #777; padding: 20px;">Chưa có dữ liệu tiến trình. Hãy chơi các trò chơi để xem tiến trình tại đây!</p>';
                return;
            }
            
            let html = '';
            filteredScores.forEach(scoreData => {
                const date = scoreData.timestamp ? scoreData.timestamp.toDate().toLocaleDateString('vi-VN') : 'Chưa xác định';
                const isHighScore = scoreData.score === stats.highScore;
                
                html += `
                    <div class="progress-item ${isHighScore ? 'high-score' : ''}">
                        <div class="progress-info">
                            <div class="progress-game">${scoreData.gameName}</div>
                            <div class="progress-date">${date}</div>
                            ${scoreData.level ? `<div class="progress-level">Cấp độ: ${scoreData.level}</div>` : ''}
                        </div>
                        <div class="progress-score">Điểm: ${scoreData.score}</div>
                    </div>
                `;
            });
            
            progressList.innerHTML = html;
        }).catch(error => {
            console.error('Lỗi khi tải điểm:', error);
        });
    }

    calculateStats(scores) {
        if (scores.length === 0) {
            return {
                total: 0,
                highScore: 0,
                average: 0
            };
        }
        
        let total = scores.length;
        let highScore = Math.max(...scores.map(s => s.score));
        let average = scores.reduce((sum, score) => sum + score.score, 0) / total;
        
        return {
            total,
            highScore,
            average: Math.round(average)
        };
    }

    updateStatsDisplay(stats) {
        document.getElementById('total-games').textContent = stats.total;
        document.getElementById('high-score').textContent = stats.highScore;
        document.getElementById('average-score').textContent = stats.average;
    }

    updateProfile(displayName) {
        const user = this.authSystem.auth.currentUser;
        
        user.updateProfile({
            displayName: displayName
        }).then(() => {
            this.authSystem.showToast('Cập nhật hồ sơ thành công!', 'success');
            document.getElementById('user-name').textContent = displayName;
            
            // Cập nhật thông tin trong localStorage
            const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
            currentUser.name = displayName;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }).catch(error => {
            this.authSystem.showToast(error.message, 'error');
        });
    }

    uploadAvatar(file) {
        const user = this.authSystem.auth.currentUser;
        const storageRef = this.authSystem.storage.ref();
        const avatarRef = storageRef.child(`avatars/${user.uid}`);
        
        avatarRef.put(file).then(snapshot => {
            return snapshot.ref.getDownloadURL();
        }).then(downloadURL => {
            return user.updateProfile({
                photoURL: downloadURL
            });
        }).then(() => {
            this.authSystem.showToast('Cập nhật ảnh đại diện thành công!', 'success');
            this.updateAvatarDisplay();
        }).catch(error => {
            this.authSystem.showToast(error.message, 'error');
        });
    }

    updateAvatarDisplay() {
        const user = this.authSystem.auth.currentUser;
        const avatarElement = document.getElementById('profile-avatar');
        
        if (user.photoURL) {
            avatarElement.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
        } else {
            avatarElement.innerHTML = '<i class="fas fa-user"></i>';
        }
        
        // Cập nhật avatar ở header nếu có
        const headerAvatar = document.querySelector('.user-avatar:not(.large)');
        if (headerAvatar) {
            if (user.photoURL) {
                headerAvatar.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
            } else {
                headerAvatar.innerHTML = '<i class="fas fa-user"></i>';
            }
        }
    }
}