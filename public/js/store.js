// public/js/store.js
const store = {
  state: {
    currentUser: null,
    users: [],
    lots: [],
    products: [],
    masters: [],
    inspectors: [],
    // Состояние фильтров для страниц
    filters: {
        applications: { status: 'all', lot_id: 'all' },
        lots: { status: 'active' },
        users: { status: 'active' },
        products: { status: 'active' },
        discrepancies: { status: 'all', severity: 'all' }
    }
  },

  // --- MUTATIONS ---
  setFilters(page, newFilters) {
    this.state.filters[page] = { ...this.state.filters[page], ...newFilters };
  },
  setCurrentUser(user) { this.state.currentUser = user; },
  setUsers(users) { this.state.users = users; },
  setLots(lots) { this.state.lots = lots; },
  setProducts(products) { this.state.products = products; },
  setMasters(masters) { this.state.masters = masters; },
  setInspectors(inspectors) { this.state.inspectors = inspectors; },

  clear() {
    this.state.currentUser = null;
    this.state.users = [];
    this.state.lots = [];
    this.state.products = [];
    this.state.masters = [];
    this.state.inspectors = [];
  },

  // --- GETTERS (методы для получения данных) ---
  getUserById(id) { return this.state.users.find(u => u.id == id); },
  getLotById(id) { return this.state.lots.find(l => l.id == id); },
  getProductById(id) { return this.state.products.find(p => p.id == id); },
};

export default store;