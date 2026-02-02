// public/js/auth.js
import api from './api.js';
import store from './store.js';

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('jwt_token');
        this.isAuthenticated = !!this.token;
        if (this.isAuthenticated) {
            api.setToken(this.token);
        }
    }

    async login(pinCode) {
        try {
            const pinToTelegramId = {
                '1234': 'admin_123', '4567': 'director_456', '7890': 'inspector_789',
                '1111': 'master_111', '4444': 'worker_444',
            };
            const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
            let telegramId = telegramUser?.id?.toString();
            if (!telegramId) {
                telegramId = pinToTelegramId[pinCode];
            }
            if (!telegramId) {
                return { success: false, error: 'Неверный PIN для тестового режима.' };
            }

            const response = await fetch('/api/v1/users/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram_id: telegramId, pin_code: pinCode }),
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                return { success: false, error: data.message || 'Ошибка авторизации' };
            }

            this.token = data.data.token;
            this.isAuthenticated = true;
            localStorage.setItem('jwt_token', this.token);
            localStorage.setItem('user_data', JSON.stringify(data.data.user));
            api.setToken(this.token);
            store.setCurrentUser(data.data.user);

            return { success: true, user: data.data.user };
        } catch (error) {
            return { success: false, error: 'Ошибка сети' };
        }
    }

    async loadProfileOnRefresh() {
        if (this.isAuthenticated && !store.state.currentUser) {
            try {
                const storedUser = localStorage.getItem('user_data');
                if (storedUser) {
                    store.setCurrentUser(JSON.parse(storedUser));
                    return true;
                }
                const profileResponse = await api.getProfile();
                if (profileResponse.success) {
                    store.setCurrentUser(profileResponse.data);
                    localStorage.setItem('user_data', JSON.stringify(profileResponse.data));
                    return true;
                }
            } catch (error) {
                this.logout();
                return false;
            }
        }
        return this.isAuthenticated;
    }

    logout() {
        this.token = null;
        this.isAuthenticated = false;
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_data');
        api.clearTokens();
        store.clear();
        window.location.reload();
    }

    checkAuth() {
        return this.isAuthenticated;
    }
}

const authManager = new AuthManager();
export default authManager;