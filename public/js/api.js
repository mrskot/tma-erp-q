// public/js/api.js
// API клиент для TMA-ERP
class TMA_API {
    constructor() {
        this.baseURL = window.location.origin + '/api/v1';
        this.token = localStorage.getItem('jwt_token');
        this.refreshToken = localStorage.getItem('refresh_token');
    }

    // Установка токена после аутентификации
    setToken(token, refreshToken) {
        this.token = token;
        this.refreshToken = refreshToken;
        localStorage.setItem('jwt_token', token);
        localStorage.setItem('refresh_token', refreshToken);
    }

    // Очистка токенов (выход)
    clearTokens() {
        this.token = null;
        this.refreshToken = null;
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('refresh_token');
    }

    // Базовый метод для запросов
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        this.token = localStorage.getItem('jwt_token');

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401 && this.refreshToken) {
                const refreshed = await this.refreshAuthToken();
                if (refreshed) {
                    headers['Authorization'] = `Bearer ${this.token}`;
                    return await fetch(url, { ...config, headers });
                }
            }

            return response;
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Обновление токена
    async refreshAuthToken() {
        try {
            const response = await fetch(`${this.baseURL}/users/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token: this.refreshToken })
            });

            if (response.ok) {
                const data = await response.json();
                this.setToken(data.access_token, data.refresh_token);
                return true;
            }
        } catch (error) {
            console.error('Token refresh failed:', error);
        }
        
        this.clearTokens();
        window.location.href = '/telegram/index.html?auth=expired';
        return false;
    }

    // --- Пользователи (Users) ---

    async getProfile() {
        const response = await this.request('/users/profile');
        if (response.ok) return await response.json();
        throw new Error('Failed to get profile');
    }

    async getUsers(status = 'active') {
        const response = await this.request(`/users?status=${status}`);
        if (response.ok) return await response.json();
        throw new Error('Failed to get users');
    }

    async getUsersByRole(role) {
        const response = await this.request(`/users/role/${role}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error(`Failed to get users with role ${role}`);
    }

    async createUser(userData) {
        const response = await this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
    }

    async updateUser(userId, userData) {
        const response = await this.request(`/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
    }

    async deactivateUser(userId) {
        const response = await this.request(`/users/${userId}`, { method: 'DELETE' });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to deactivate user');
    }

    async reactivateUser(userId) {
        const response = await this.request(`/users/${userId}/restore`, { method: 'POST' });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate user');
    }

    // --- Участки (Lots) ---

    async getLots(status = 'active') {
        const response = await this.request(`/lots?status=${status}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to get lots');
    }

    async getLotsWithMasters(status = 'active') {
        const response = await this.request(`/lots/with-masters?status=${status}`);
        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                return result.data || [];
            }
        }
        throw new Error('Failed to get lots with masters');
    }

    async createLot(lotData) {
        const response = await this.request('/lots', {
            method: 'POST',
            body: JSON.stringify(lotData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to create lot');
    }

    async updateLot(lotId, lotData) {
        const response = await this.request(`/lots/${lotId}`, {
            method: 'PUT',
            body: JSON.stringify(lotData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update lot');
    }

    async deleteLot(lotId) {
        const response = await this.request(`/lots/${lotId}`, {
            method: 'DELETE'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete lot');
    }

    async reactivateLot(lotId) {
        const response = await this.request(`/lots/${lotId}/restore`, {
            method: 'POST'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate lot');
    }

    // --- Изделия (Products) ---
    async getProducts(status = 'active') {
        const response = await this.request(`/products?status=${status}`);
        if (response.ok) {
            return await response.json();
        }
        throw new Error('Failed to get products');
    }

    async createProduct(productData) {
        const response = await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
    }

    async updateProduct(productId, productData) {
        const response = await this.request(`/products/${productId}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update product');
    }

    async deleteProduct(productId) {
        const response = await this.request(`/products/${productId}`, {
            method: 'DELETE'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete product');
    }
    
    async reactivateProduct(productId) {
        const response = await this.request(`/products/${productId}/restore`, {
            method: 'POST'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to reactivate product');
    }

    // --- Заявки (Applications) ---

    async getApplications(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const response = await this.request(`/applications?${query}`);
        if (response.ok) return await response.json();
        throw new Error('Failed to get applications');
    }

    async getApplicationById(applicationId) {
        const response = await this.request(`/applications/${applicationId}`);
        if (response.ok) return await response.json();
        throw new Error('Failed to get application');
    }

    async createBatchApplications(batchData) {
        const response = await this.request('/applications/batch', {
            method: 'POST',
            body: JSON.stringify(batchData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to create batch applications');
    }

    async updateApplication(applicationId, applicationData) {
        const response = await this.request(`/applications/${applicationId}`, {
            method: 'PUT',
            body: JSON.stringify(applicationData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application');
    }
    
    async updateApplicationStatus(applicationId, status) {
        const response = await this.request(`/applications/${applicationId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update application status');
    }

    async deleteApplication(applicationId) {
        const response = await this.request(`/applications/${applicationId}`, {
            method: 'DELETE'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete application');
    }

    async getApplicationStatistics() {
        const response = await this.request('/applications/statistics');
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to get application statistics');
    }

    // --- Несоответствия (Discrepancies) ---

    async getDiscrepancies(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        const response = await this.request(`/discrepancies?${query}`);
        if (response.ok) return await response.json();
        throw new Error('Failed to get discrepancies');
    }

    async getDiscrepancyById(id) {
        const response = await this.request(`/discrepancies/${id}`);
        if (response.ok) return await response.json();
        throw new Error('Failed to get discrepancy');
    }

    async createDiscrepancy(discrepancyData) {
        const response = await this.request('/discrepancies', {
            method: 'POST',
            body: JSON.stringify(discrepancyData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to create discrepancy');
    }

    async updateDiscrepancy(id, discrepancyData) {
        const response = await this.request(`/discrepancies/${id}`, {
            method: 'PUT',
            body: JSON.stringify(discrepancyData)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update discrepancy');
    }

    async updateDiscrepancyStatus(id, payload) {
        // payload может содержать status, closure_scenario, fix_photo_url, special_opinion, is_disputed
        const response = await this.request(`/discrepancies/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to update discrepancy status');
    }

    async deleteDiscrepancy(id) {
        const response = await this.request(`/discrepancies/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete discrepancy');
    }

    async getDiscrepancyStatistics() {
        const response = await this.request('/discrepancies/statistics');
        if (response.ok) return await response.json();
        const error = await response.json();
        throw new Error(error.message || 'Failed to get discrepancy statistics');
    }
}

window.TMA_API = new TMA_API();