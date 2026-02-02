// public/js/api.js
class TMA_API {
    constructor() {
        this.baseURL = window.location.origin + '/api/v1';
        this.token = localStorage.getItem('jwt_token');
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
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Ошибка API');
            }
            return data;
        } catch (error) {
            console.error(`API Error on ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Users ---
    async getProfile() { return this.request('/users/profile'); }
    async getUsers(status = 'all') { return this.request(`/users?status=${status}`); }
    async createUser(userData) { return this.request('/users', { method: 'POST', body: JSON.stringify(userData) }); }
    async updateUser(userId, userData) { return this.request(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(userData) }); }
    async deactivateUser(userId) { return this.request(`/users/${userId}`, { method: 'DELETE' }); }
    async reactivateUser(userId) { return this.request(`/users/${userId}/restore`, { method: 'POST' }); }
    
    // --- Lots ---
    async getLots(status = 'all') { return this.request(`/lots?status=${status}&with_masters=true`); }
    async createLot(lotData) { return this.request('/lots', { method: 'POST', body: JSON.stringify(lotData) }); }
    async updateLot(lotId, lotData) { return this.request(`/lots/${lotId}`, { method: 'PUT', body: JSON.stringify(lotData) }); }
    async deleteLot(lotId) { return this.request(`/lots/${lotId}`, { method: 'DELETE' }); }
    async reactivateLot(lotId) { return this.request(`/lots/${lotId}/restore`, { method: 'POST' }); }

    // --- Products ---
    async getProducts(status = 'all') { return this.request(`/products?status=${status}`); }
    async createProduct(productData) { return this.request('/products', { method: 'POST', body: JSON.stringify(productData) }); }
    async updateProduct(productId, productData) { return this.request(`/products/${productId}`, { method: 'PUT', body: JSON.stringify(productData) }); }
    async deleteProduct(productId) { return this.request(`/products/${productId}`, { method: 'DELETE' }); }
    async reactivateProduct(productId) { return this.request(`/products/${productId}/restore`, { method: 'POST' }); }
}

const api = new TMA_API();
export default api;