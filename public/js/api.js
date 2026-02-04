// public/js/api.js
class TMA_API {
    constructor() {
        this.baseURL = window.location.origin + '/api/v1';
        this.token = localStorage.getItem('jwt_token');
        this.activeRequests = 0;
        this.loader = document.getElementById('loading-screen');
    }

    showLoader() {
        this.activeRequests++;
        if (this.loader) {
            this.loader.classList.remove('hidden');
            // Если запрос затянулся, можем добавить полупрозрачность
            this.loader.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        }
    }

    hideLoader() {
        this.activeRequests = Math.max(0, this.activeRequests - 1);
        if (this.activeRequests === 0 && this.loader) {
            this.loader.classList.add('hidden');
            this.loader.style.backgroundColor = ''; // Сброс
        }
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('jwt_token', token);
    }

    clearTokens() {
        this.token = null;
        localStorage.removeItem('jwt_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        this.token = localStorage.getItem('jwt_token'); 
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        const config = { ...options, headers };
        
        this.showLoader();
        try {
            const response = await fetch(url, config);
            const json = await response.json();

            if (!response.ok) {
                throw new Error(json.message || `Ошибка сервера: ${response.status}`);
            }

            // МАГИЯ ТУТ: если бэкенд прислал { success: true, data: ... }, 
            // возвращаем только data, чтобы не переписывать логику страниц
            return json.data !== undefined ? { success: true, data: json.data } : json;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        } finally {
            this.hideLoader();
        }
    }

    // --- Users ---
    async getProfile() { return this.request('/users/profile'); }
    async getUsers(status = 'all') { return this.request(`/users?status=${status}`); }
    async getUsersByRole(role) { return this.request(`/users/role/${role}`); }
    async createUser(userData) { return this.request('/users', { method: 'POST', body: JSON.stringify(userData) }); }
    async updateUser(userId, userData) { return this.request(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }); }
    async deactivateUser(userId) { return this.request(`/users/${userId}`, { method: 'DELETE' }); }
    async reactivateUser(userId) { return this.request(`/users/${userId}/restore`, { method: 'POST' }); }
    
    // --- Lots ---
    async getLots(status = 'active') { return this.request(`/lots?status=${status}&with_masters=true`); }
    async getLotsWithMasters(status = 'active') { return this.request(`/lots?status=${status}&with_masters=true`); }
    async createLot(lotData) { return this.request('/lots', { method: 'POST', body: JSON.stringify(lotData) }); }
    async updateLot(lotId, lotData) { return this.request(`/lots/${lotId}`, { method: 'PUT', body: JSON.stringify(lotData) }); }
    async deleteLot(lotId) { return this.request(`/lots/${lotId}`, { method: 'DELETE' }); }
    async reactivateLot(lotId) { return this.request(`/lots/${lotId}/restore`, { method: 'POST' }); }

    // --- Products ---
    async getProducts(status = 'active') { return this.request(`/products?status=${status}`); }
    async createProduct(productData) { return this.request('/products', { method: 'POST', body: JSON.stringify(productData) }); }
    async updateProduct(productId, productData) { return this.request(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(productData) }); }
    async deleteProduct(productId) { return this.request(`/products/${productId}`, { method: 'DELETE' }); }
    async reactivateProduct(productId) { return this.request(`/products/${productId}/restore`, { method: 'POST' }); }

    // --- Applications ---
    async getApplications(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/applications?${query}`);
    }
    async getApplicationById(id) { return this.request(`/applications/${id}`); }
    async createBatchApplications(data) { return this.request('/applications/batch', { method: 'POST', body: JSON.stringify(data) }); }
    async updateApplication(id, data) { return this.request(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
    async updateApplicationStatus(id, status) { return this.request(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); }
    async deleteApplication(id) { return this.request(`/applications/${id}`, { method: 'DELETE' }); }

    // --- Discrepancies ---
    async getDiscrepancies(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return this.request(`/discrepancies?${query}`);
    }
    async getDiscrepancyById(id) { return this.request(`/discrepancies/${id}`); }
    async createDiscrepancy(data) { return this.request('/discrepancies', { method: 'POST', body: JSON.stringify(data) }); }
    async updateDiscrepancy(id, data) { return this.request(`/discrepancies/${id}`, { method: 'PUT', body: JSON.stringify(data) }); }
    async updateDiscrepancyStatus(id, payload) { return this.request(`/discrepancies/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }); }
    async deleteDiscrepancy(id) { return this.request(`/discrepancies/${id}`, { method: 'DELETE' }); }
}

export const api = new TMA_API();
export default api;