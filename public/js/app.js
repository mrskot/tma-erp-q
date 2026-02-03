// public/js/app.js
import authManager from './auth.js';
import store from './store.js';
import api from './api.js';

import { UserModal } from './components/UserModal.js';
import { LotModal } from './components/LotModal.js';
import { ProductModal } from './components/ProductModal.js';
import { ApplicationModal } from './components/ApplicationModal.js';
import { ApplicationDetailsModal } from './components/ApplicationDetailsModal.js';
import { DiscrepancyModal } from './components/DiscrepancyModal.js';

import * as dashboardPage from './pages/dashboard.js';
import * as usersPage from './pages/users.js';
import * as lotsPage from './pages/lots.js';
import * as productsPage from './pages/products.js';
import * as applicationsPage from './pages/applications.js';

const ROLES_CONFIG = {
    admin: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'users', 'lots', 'products', 'applications', 'discrepancies'], name: 'Администратор' },
    director: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Директор' },
    inspector: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Контролёр ОТК' },
    master: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Мастер' },
    worker: { defaultPage: 'applications', allowedPages: ['applications'], name: 'Рабочий' },
};

const PAGE_NAMES = {
    dashboard: 'Главная', users: 'Пользователи', lots: 'Участки',
    products: 'Изделия', applications: 'Заявки', discrepancies: 'Несоответствия',
};

class App {
    constructor() {
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
        
        // Создаем модалки один раз
        this.modals = {
            user: new UserModal(),
            lot: new LotModal(),
            product: new ProductModal(),
            application: new ApplicationModal(),
            applicationDetails: new ApplicationDetailsModal(),
            discrepancy: new DiscrepancyModal(),
        };

        this.pages = {
            dashboard: dashboardPage,
            users: usersPage,
            lots: lotsPage,
            products: productsPage,
            applications: applicationsPage,
        };
        this.init();
    }

    async init() {
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutButton.addEventListener('click', () => this.handleLogout());
        this.nav.addEventListener('click', (e) => this.handleNavClick(e));
        await this.updateViewState();
    }

    // Методы для управления модалками дефектов
    openCreateDiscrepancyModal(applicationId, onSaveCallback) {
        this.modals.discrepancy.show({
            mode: 'create',
            applicationId,
            onSave: async (payload) => {
                const res = await api.createDiscrepancy(payload);
                if (res.success) {
                    this.modals.discrepancy.hide();
                    if (onSaveCallback) await onSaveCallback(res.data);
                } else {
                    alert('Ошибка при создании: ' + res.message);
                }
            }
        });
    }

    async openEditDiscrepancyModal(discrepancyId, onSaveCallback) {
        const res = await api.getDiscrepancyById(discrepancyId);
        if (res.success) {
            this.modals.discrepancy.show({
                mode: 'edit',
                discrepancyData: res.data,
                onSave: async (payload) => {
                    // Обработка сохранения изменений (например, срока или описания)
                    const updateRes = await api.updateDiscrepancy(discrepancyId, payload);
                    if (updateRes.success) {
                        this.modals.discrepancy.hide();
                        if (onSaveCallback) await onSaveCallback(updateRes.data);
                    } else {
                        alert('Ошибка при обновлении: ' + updateRes.message);
                    }
                }
            });
        }
    }

    async updateViewState() {
        this.loadingScreen.classList.remove('hidden');
        const isAuth = await authManager.loadProfileOnRefresh();
        this.loadingScreen.classList.add('hidden');

        if (isAuth) {
            this.loginScreen.classList.add('hidden');
            this.mainApp.classList.remove('hidden');

            const user = store.state.currentUser;
            const roleConfig = ROLES_CONFIG[user.role] || { defaultPage: 'dashboard', allowedPages: [], name: 'Неизвестная роль' };

            this.userInfo.textContent = `${user.first_name} (${roleConfig.name})`;
            this.renderNavigation(roleConfig.allowedPages);
            
            const currentHash = location.hash.slice(1);
            if (roleConfig.allowedPages.includes(currentHash)) {
                this.showPage(currentHash);
            } else {
                this.showPage(roleConfig.defaultPage);
            }
        } else {
            this.mainApp.classList.add('hidden');
            this.loginScreen.classList.remove('hidden');
            this.pinInput.focus();
        }
    }

    renderNavigation(allowedPages) {
        const links = allowedPages.map(pageKey => {
            const pageName = PAGE_NAMES[pageKey] || pageKey;
            return `<a href="#${pageKey}" data-page="${pageKey}">${pageName}</a>`;
        }).join('');
        this.nav.innerHTML = `<div class="container">${links}</div>`;
    }
    
    async handleLogin(e) {
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
        
        if (pageModule && pageModule.init) {
            history.pushState(null, '', `#${pageName}`);
            
            // === МАГИЯ ЗДЕСЬ ===
            // Клонируем контейнер без дочерних элементов (false), чтобы убить всех слушателей событий
            const newContent = this.pageContent.cloneNode(false);
            this.pageContent.parentNode.replaceChild(newContent, this.pageContent);
            this.pageContent = newContent; // Обновляем ссылку на актуальный элемент
            // ===================

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