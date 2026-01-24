// Модуль авторизации для TMA-ERP

class AuthManager {
    constructor() {
        this.isAuthenticated = false;
        this.user = null;
        this.token = localStorage.getItem('jwt_token');
        
        if (this.token) {
            this.isAuthenticated = true;
            this.loadUserFromStorage();
        }
    }

    // Загрузка данных пользователя из localStorage
    loadUserFromStorage() {
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                this.user = JSON.parse(userData);
            } catch (e) {
                console.error('Failed to parse user data:', e);
            }
        }
    }

    // Сохранение данных пользователя
    saveUserToStorage(user) {
        this.user = user;
        localStorage.setItem('user_data', JSON.stringify(user));
    }

    // Получение текущего пользователя
    getCurrentUser() {
        return this.user;
    }

    // Авторизация по PIN-коду (алиас для authenticateWithPin)
    async authenticateWithPin(pinCode) {
        return this.login(pinCode);
    }

    // Авторизация по PIN-коду
    async login(pinCode) {
        try {
            // В разработке: карта соответствия PIN-кода и telegram_id
            const pinToTelegramId = {
                '1234': 'admin_123',
                '4567': 'director_456',
                '7890': 'inspector_789',
                '9999': 'inspector_999',
                '1111': 'master_111',
                '2222': 'master_222',
                '3333': 'worker_333',
                '4444': 'worker_444'
            };

            let telegramId;

            // ШАГ 1: Приоритет для карты PIN -> ID. Если PIN совпал, используем его ID.
            if (pinToTelegramId[pinCode]) {
                telegramId = pinToTelegramId[pinCode];
                console.log(`PIN-код ${pinCode} найден в карте, используется Telegram ID: ${telegramId}`);
            } else {
                // ШАГ 2: Если PIN не в карте, используем ID из Telegram WebApp (реального или фейкового).
                const telegramUser = window.TelegramApp?.getUserData();
                telegramId = telegramUser?.id?.toString();
                console.log(`PIN-код не в карте, используется Telegram ID из WebApp: ${telegramId}`);
            }

            if (!telegramId) {
                return { success: false, error: 'Не удалось определить Telegram ID' };
            }
            
            const response = await fetch('/api/v1/users/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    telegram_id: telegramId,
                    pin_code: pinCode,
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.token = data.data.token;
                this.user = data.data.user;
                this.isAuthenticated = true;

                localStorage.setItem('jwt_token', this.token);
                this.saveUserToStorage(this.user);

                // Обновляем токен в API клиенте
                if (window.TMA_API) {
                    window.TMA_API.token = this.token;
                }

                return { success: true, user: this.user };
            } else {
                return { success: false, error: data.message || 'Ошибка авторизации' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Ошибка сети' };
        }
    }

    // Выход из системы
    logout() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;

        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');

        if (window.TMA_API) {
            window.TMA_API.clearTokens();
        }

        console.log('Пользователь вышел из системы.');
        // Теперь App.js сам отреагирует на изменение состояния
    }

    // Проверка авторизации
    checkAuth() {
        return this.isAuthenticated && this.token;
    }

    // Получение текущего пользователя
    getUser() {
        return this.user;
    }

    // Получение роли пользователя
    getRole() {
        return this.user?.role || null;
    }

    // Проверка роли
    hasRole(roles) {
        if (!this.user) return false;
        if (typeof roles === 'string') {
            return this.user.role === roles;
        }
        return roles.includes(this.user.role);
    }

    // Проверка доступа админа
    isAdmin() {
        return this.hasRole('admin');
    }

    // Проверка доступа инспектора
    isInspector() {
        return this.hasRole(['inspector', 'admin', 'director']);
    }

    // Проверка доступа мастера
    isMaster() {
        return this.hasRole(['master', 'admin', 'director']);
    }

    // Обновление токена
    async refreshToken() {
        try {
            const response = await fetch('/api/v1/users/auth/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                this.token = data.data.token;
                localStorage.setItem('jwt_token', this.token);
                
                if (window.TMA_API) {
                    window.TMA_API.token = this.token;
                }
                
                return true;
            }
        } catch (error) {
            console.error('Token refresh error:', error);
        }

        // Если обновление не удалось - выходим
        this.logout();
        return false;
    }

    // Получение заголовков авторизации
    getAuthHeaders() {
        if (!this.token) return {};
        return {
            'Authorization': `Bearer ${this.token}`,
        };
    }
}

// Создаём глобальный экземпляр
window.AuthManager = new AuthManager();
// Алиас для совместимости
window.Auth = window.AuthManager;
