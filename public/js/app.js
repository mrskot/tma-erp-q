// public/js/app.js
import authManager from './auth.js';
import store from './store.js';
import api from './api.js';

// Импортируем классы модальных окон
import { UserModal } from './components/UserModal.js';
import { LotModal } from './components/LotModal.js';
import { ProductModal } from './components/ProductModal.js';
// ... импорты других модалок

// Импортируем модули страниц
import * as dashboardPage from './pages/dashboard.js';
import * as usersPage from './pages/users.js';
import * as lotsPage from './pages/lots.js';
import * as productsPage from './pages/products.js';

// ... (константы ROLES_CONFIG и PAGE_NAMES без изменений)
const ROLES_CONFIG = {
    admin: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'users', 'lots', 'products'], name: 'Администратор' },
    director: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Директор' },
    inspector: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications'], name: 'Контролёр ОТК' },
    master: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications'], name: 'Мастер' },
    worker: { defaultPage: 'dashboard', allowedPages: ['dashboard'], name: 'Рабочий' },
};
const PAGE_NAMES = {
    dashboard: 'Главная', users: 'Пользователи', lots: 'Участки',
    products: 'Изделия', applications: 'Заявки', discrepancies: 'Несоответствия',
};


class App {
    constructor() {
        // ... (все DOM элементы без изменений)
        this.loadingScreen = document.getElementById('loading-screen');
        this.loginScreen = document.getElementById('login-screen');
        this.mainApp = document.getElementById('main-app');
        this.loginForm = document.getElementById('login-form');
        this.pinInput = document.getElementById('pin-input');
        this.loginError = document.getElementById('login-error');
        this.userInfo = document.getElementById('user-info');
        this.logoutButton = document.getElementById('logout-button');
        this.nav = document.querySelector('#main-app nav');
        this.pageContent = document.getElementById('page-content');
        
        // **КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Создаем все модалки ОДИН РАЗ ЗДЕСЬ**
        this.modals = {
            user: new UserModal(),
            lot: new LotModal(),
            product: new ProductModal(),
            // ... здесь будут другие
        };

        this.pages = {
            dashboard: dashboardPage,
            users: usersPage,
            lots: lotsPage,
            products: productsPage,
        };
        this.init();
    }

    async init() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutButton.addEventListener('click', () => this.handleLogout());
        this.nav.addEventListener('click', (e) => this.handleNavClick(e));
        await this.updateViewState();
    }

    async updateViewState() {
        // ... (функция без изменений, она уже правильная)
        this.loadingScreen.classList.remove('hidden');
        const isAuth = await authManager.loadProfileOnRefresh();
        this.loadingScreen.classList.add('hidden');

        if (isAuth) {
            this.loginScreen.classList.add('hidden');
            this.mainApp.classList.remove('hidden');

            const user = store.state.currentUser;
            const roleConfig = ROLES_CONFIG[user.role] || { defaultPage: 'dashboard', allowedPages: ['dashboard'], name: 'Неизвестная роль' };

            this.userInfo.textContent = `${user.first_name} (${roleConfig.name})`;
            this.renderNavigation(roleConfig.allowedPages);
            this.showPage(roleConfig.defaultPage);
        } else {
            this.mainApp.classList.add('hidden');
            this.loginScreen.classList.remove('hidden');
            this.pinInput.focus();
        }
    }

    renderNavigation(allowedPages) {
        // ... (функция без изменений)
        const links = allowedPages.map(pageKey => {
            const pageName = PAGE_NAMES[pageKey] || pageKey;
            return `<a href="#${pageKey}" data-page="${pageKey}">${pageName}</a>`;
        }).join('');
        this.nav.innerHTML = `<div class="container">${links}</div>`;
    }
    
    async handleLogin(e) {
        // ... (функция без изменений)
        e.preventDefault();
        this.loginError.classList.add('hidden');
        const result = await authManager.login(this.pinInput.value);
        if (result.success) {
            await this.updateViewState();
        } else {
            this.loginError.textContent = result.error;
            this.loginError.classList.remove('hidden');
        }
        this.loginForm.reset();
    }

    handleLogout() { authManager.logout(); }

    handleNavClick(e) {
        e.preventDefault();
        const pageName = e.target.dataset.page;
        if (pageName) this.showPage(pageName);
    }

    showPage(pageName) {
        this.nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.page === pageName));
        const pageModule = this.pages[pageName];
        if (pageModule?.init) {
            history.pushState(null, '', `#${pageName}`);
            // **КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Передаем все модалки в страницу**
            pageModule.init(this.pageContent, this.modals);
        } else {
            this.pageContent.innerHTML = `<h2>Страница "${PAGE_NAMES[pageName] || pageName}" в разработке.</h2>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (!window.Telegram?.WebApp?.initData) {
        window.Telegram = { WebApp: { initDataUnsafe: {} } };
    }
    window.app = new App();
});