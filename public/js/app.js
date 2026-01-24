class App {
    constructor() {
        // Экраны
        this.loadingScreen = document.getElementById('loading-screen');
        this.loginScreen = document.getElementById('login-screen');
        this.mainApp = document.getElementById('main-app');

        // Форма входа
        this.loginForm = document.getElementById('login-form');
        this.pinInput = document.getElementById('pin-input');
        this.loginError = document.getElementById('login-error');

        // Основное приложение
        this.userInfo = document.getElementById('user-info');
        this.logoutButton = document.getElementById('logout-button');
        this.nav = document.querySelector('#main-app nav');
        this.pageContent = document.getElementById('page-content');
        
        // Кэши и фильтры
        this.usersCache = [];
        this.lotsCache = [];
        this.mastersCache = [];
        this.currentUserFilter = 'active';
        this.currentLotFilter = 'active';

        // Модальные окна - будут инициализированы после загрузки DOM
        this.userModal = null;
        this.lotModal = null;

        // --- КОНФИГУРАЦИЯ РОЛЕЙ И ДОСТУПА ---
        this.ROLES_CONFIG = {
            admin: {
                defaultPage: 'users',
                allowedPages: ['users', 'lots', 'products', 'applications', 'discrepancies'],
                name: 'Администратор'
            },
            director: {
                defaultPage: 'applications',
                allowedPages: ['lots', 'products', 'applications', 'discrepancies'],
                name: 'Директор'
            },
            inspector: {
                defaultPage: 'applications',
                allowedPages: ['applications', 'discrepancies'],
                name: 'Контролёр ОТК'
            },
            master: {
                defaultPage: 'applications',
                allowedPages: ['applications', 'discrepancies'],
                name: 'Мастер участка'
            },
            worker: {
                defaultPage: 'applications',
                allowedPages: ['applications'],
                name: 'Рабочий'
            }
        };

        this.PAGE_NAMES = {
            users: 'Пользователи',
            lots: 'Участки',
            products: 'Изделия',
            applications: 'Заявки',
            discrepancies: 'Несоответствия'
        };

        this.init();
    }

    init() {
        console.log('🚀 Инициализация TMA-ERP приложения...');
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.logoutButton.addEventListener('click', () => this.handleLogout());
        this.nav.addEventListener('click', (e) => this.handleNavClick(e));
        this.pageContent.addEventListener('click', (e) => this.handlePageContentClick(e));
        this.pageContent.addEventListener('change', (e) => this.handlePageContentChange(e));
        this.updateViewState();
    }

    updateViewState() {
        const isAuthenticated = window.AuthManager.checkAuth();
        this.loadingScreen.classList.add('hidden');

        if (isAuthenticated) {
            this.loginScreen.classList.add('hidden');
            this.mainApp.classList.remove('hidden');
            const user = window.AuthManager.getUser();
            const roleConfig = this.ROLES_CONFIG[user.role] || { defaultPage: 'applications', allowedPages: [], name: 'Неизвестная роль'};
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
        this.nav.innerHTML = '';
        const navContainer = document.createElement('div');
        navContainer.className = 'container';
        allowedPages.forEach(pageKey => {
            const pageName = this.PAGE_NAMES[pageKey] || pageKey;
            const link = document.createElement('a');
            link.href = '#';
            link.dataset.page = pageKey;
            link.textContent = pageName;
            navContainer.appendChild(link);
        });
        this.nav.appendChild(navContainer);
    }

    async handleLogin(event) {
        event.preventDefault();
        const pinCode = this.pinInput.value.trim();
        if (!pinCode || pinCode.length !== 4) {
            this.showLoginError('PIN-код должен состоять из 4 цифр.');
            return;
        }
        this.clearLoginError();
        const loginButton = this.loginForm.querySelector('button');
        loginButton.disabled = true;
        loginButton.textContent = 'Вход...';
        const result = await window.AuthManager.login(pinCode);
        if (result.success) {
            this.updateViewState();
        } else {
            this.showLoginError(result.error);
        }
        loginButton.disabled = false;
        loginButton.textContent = 'Войти';
        this.loginForm.reset();
    }

    handleLogout() {
        window.AuthManager.logout();
        this.updateViewState();
    }

    handleNavClick(event) {
        event.preventDefault();
        const pageName = event.target.dataset.page;
        if (pageName) this.showPage(pageName);
    }

    showPage(pageName) {
        const user = window.AuthManager.getUser();
        if (!user) {
            this.updateViewState();
            return;
        }
        const userRole = user.role;
        const roleConfig = this.ROLES_CONFIG[userRole];

        if (!roleConfig || !roleConfig.allowedPages.includes(pageName)) {
            console.warn(`Access Denied: Role '${userRole}' cannot access page '${pageName}'.`);
            this.pageContent.innerHTML = `<h2>Доступ запрещен</h2><p>У вашей роли нет прав для просмотра этого раздела.</p>`;
            return;
        }

        console.log(`📄 Загружаем страницу: ${pageName}`);
        this.nav.querySelectorAll('a').forEach(a => a.classList.toggle('active', a.dataset.page === pageName));
        this.pageContent.innerHTML = `<h2>Загрузка раздела "${this.PAGE_NAMES[pageName] || pageName}"...</h2>`;

        switch (pageName) {
            case 'users': this.renderUsersPage(); break;
            case 'lots': this.renderLotsPage(); break;
            case 'products': this.renderProductsPage(); break;
            case 'applications': this.renderApplicationsPage(); break;
            case 'discrepancies': this.renderDiscrepanciesPage(); break;
            default: this.pageContent.innerHTML = '<h2>Страница не найдена</h2>';
        }
    }

    // --- Методы рендеринга страниц ---

    async renderUsersPage() {
        this.pageContent.innerHTML = `<h3>Управление пользователями</h3><p>Загрузка...</p>`;
        try {
            const response = await window.TMA_API.getUsers(this.currentUserFilter);
            if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Не удалось загрузить пользователей.');
            this.usersCache = response.data;
            let tableRows = this.usersCache.map(user => {
                const isInactive = !user.is_active;
                const rowClass = isInactive ? 'class="inactive-user"' : '';
                const actionButtons = isInactive 
                    ? `<button class="button-small button-success" data-user-id="${user.id}" data-action="restore" title="Восстановить">🔄️</button>`
                    : `<button class="button-small button-secondary" data-user-id="${user.id}" data-action="edit" title="Редактировать">✏️</button>
                       <button class="button-small button-danger" data-user-id="${user.id}" data-action="delete" title="Деактивировать">🗑️</button>`;
                return `<tr data-user-id="${user.id}" ${rowClass}>
                    <td data-label="ID">${user.id}</td>
                    <td data-label="Имя">${user.first_name || ''} ${user.last_name || ''}</td>
                    <td data-label="Роль">${user.role ? (this.ROLES_CONFIG[user.role]?.name || user.role) : '-'}</td>
                    <td data-label="Telegram ID">${user.telegram_id || '-'}</td>
                    <td data-label="Bitrix ID">${user.bitrix_id || '-'}</td>
                    <td data-label="PIN">${isInactive ? 'N/A' : (user.pin_code || '-')}</td>
                    <td class="actions">${actionButtons}</td>
                </tr>`;
            }).join('');
            if (this.usersCache.length === 0) tableRows = `<tr><td colspan="7">Пользователи с данным фильтром не найдены.</td></tr>`;
            this.pageContent.innerHTML = `
                <div class="page-header">
                    <h3>Управление пользователями</h3>
                    <div class="page-controls">
                        <select id="user-status-filter">
                            <option value="active" ${this.currentUserFilter === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="inactive" ${this.currentUserFilter === 'inactive' ? 'selected' : ''}>Деактивированные</option>
                            <option value="all" ${this.currentUserFilter === 'all' ? 'selected' : ''}>Все</option>
                        </select>
                        <button id="create-user-btn" class="button">✨ Создать пользователя</button>
                    </div>
                </div>
                <table class="crud-table"><thead><tr><th>ID</th><th>Имя</th><th>Роль</th><th>Telegram ID</th><th>Bitrix ID</th><th>PIN</th><th>Действия</th></tr></thead><tbody>${tableRows}</tbody></table>`;
        } catch (error) {
            console.error('Ошибка при загрузке пользователей:', error);
            this.pageContent.innerHTML = `<h3>Управление пользователями</h3><p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }

    async renderLotsPage() {
        this.pageContent.innerHTML = `<h3>Управление участками</h3><p>Загрузка данных...</p>`;
        try {
            const [lotsResponse, mastersResponse] = await Promise.all([
                window.TMA_API.getLots(this.currentLotFilter),
                window.TMA_API.getUsersByRole('master')
            ]);
            if (!lotsResponse.success || !Array.isArray(lotsResponse.data)) throw new Error(lotsResponse.message || 'Не удалось загрузить участки.');
            if (!mastersResponse.success || !Array.isArray(mastersResponse.data)) throw new Error(mastersResponse.message || 'Не удалось загрузить мастеров.');
            this.lotsCache = lotsResponse.data;
            this.mastersCache = mastersResponse.data;
            const masterMap = new Map(this.mastersCache.map(m => [m.id, `${m.first_name} ${m.last_name}`]));
            let tableRows = this.lotsCache.map(lot => {
                const isInactive = !lot.is_active;
                const rowClass = isInactive ? 'class="inactive-user"' : '';
                const actionButtons = isInactive 
                    ? `<button class="button-small button-success" data-lot-id="${lot.id}" data-action="restore-lot" title="Восстановить">🔄️</button>`
                    : `<button class="button-small button-secondary" data-lot-id="${lot.id}" data-action="edit-lot" title="Редактировать">✏️</button>
                       <button class="button-small button-danger" data-lot-id="${lot.id}" data-action="deactivate-lot" title="Деактивировать">🗑️</button>`;
                const distance = lot.distance_to_office ? `${lot.distance_to_office} м.` : '—';
                return `<tr data-lot-id="${lot.id}" ${rowClass}>
                    <td data-label="ID">${lot.id}</td>
                    <td data-label="Название">${lot.name}</td>
                    <td data-label="Код">${lot.code}</td>
                    <td data-label="Основной мастер">${masterMap.get(lot.main_master_id) || 'Не назначен'}</td>
                    <td data-label="Временный мастер">${lot.temp_master_id ? (masterMap.get(lot.temp_master_id) || 'Не назначен') : '—'}</td>
                    <td data-label="Расстояние">${distance}</td>
                    <td class="actions">${actionButtons}</td>
                </tr>`;
            }).join('');
            if (this.lotsCache.length === 0) tableRows = `<tr><td colspan="7">Участки с данным фильтром не найдены.</td></tr>`;
            this.pageContent.innerHTML = `
                <div class="page-header">
                    <h3>Управление участками</h3>
                    <div class="page-controls">
                        <select id="lot-status-filter">
                            <option value="active" ${this.currentLotFilter === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="inactive" ${this.currentLotFilter === 'inactive' ? 'selected' : ''}>Деактивированные</option>
                            <option value="all" ${this.currentLotFilter === 'all' ? 'selected' : ''}>Все</option>
                        </select>
                        <button id="create-lot-btn" class="button">✨ Создать участок</button>
                    </div>
                </div>
                <table class="crud-table"><thead><tr><th>ID</th><th>Название</th><th>Код</th><th>Основной мастер</th><th>Временный мастер</th><th>Расстояние</th><th>Действия</th></tr></thead><tbody>${tableRows}</tbody></table>`;
        } catch (error) {
            console.error('Ошибка при загрузке участков:', error);
            this.pageContent.innerHTML = `<h3>Управление участками</h3><p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }

    async renderProductsPage() { this.pageContent.innerHTML = `<h3>Управление изделиями</h3><p>В разработке.</p>`; }
    async renderApplicationsPage() { this.pageContent.innerHTML = `<h3>Заявки</h3><p>В разработке.</p>`; }
    async renderDiscrepanciesPage() { this.pageContent.innerHTML = `<h3>Несоответствия</h3><p>В разработке.</p>`; }

    // --- Обработчики событий ---

    handlePageContentClick(event) {
        const target = event.target;
        if (target.matches('#create-user-btn')) { this.openCreateUserModal(); return; }
        if (target.matches('#create-lot-btn')) { this.openCreateLotModal(); return; }

        const actionButton = target.closest('button[data-action]');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const userId = actionButton.dataset.userId;
            const lotId = actionButton.dataset.lotId;

            if (userId) {
                if (action === 'edit') this.openEditUserModal(userId);
                if (action === 'delete') this.handleDeleteUser(userId);
                if (action === 'restore') this.handleReactivateUser(userId);
            }
            if (lotId) {
                if (action === 'edit-lot') this.openEditLotModal(lotId);
                if (action === 'deactivate-lot') this.handleDeactivateLot(lotId);
                if (action === 'restore-lot') this.handleReactivateLot(lotId);
            }
        }
    }

    handlePageContentChange(event) {
        const target = event.target;
        if (target.matches('#user-status-filter')) {
            this.currentUserFilter = target.value;
            this.renderUsersPage();
        }
        if (target.matches('#lot-status-filter')) {
            this.currentLotFilter = target.value;
            this.renderLotsPage();
        }
    }

    // --- CRUD Пользователей ---

    openCreateUserModal() {
        if (!this.userModal) return;
        this.userModal.show({
            mode: 'create',
            onSave: async (userData) => {
                await window.TMA_API.createUser(userData);
                this.userModal.hide();
                this.renderUsersPage();
            }
        });
    }
    openEditUserModal(userId) {
        if (!this.userModal) return;
        const userToEdit = this.usersCache.find(u => u.id == userId);
        if (!userToEdit) return alert('Ошибка: пользователь не найден.');
        this.userModal.show({
            mode: 'edit',
            userData: userToEdit,
            onSave: async (userData) => {
                await window.TMA_API.updateUser(userId, userData);
                this.userModal.hide();
                this.renderUsersPage();
            }
        });
    }
    async handleDeleteUser(userId) {
        const user = this.usersCache.find(u => u.id == userId);
        if (confirm(`Деактивировать пользователя "${user.first_name}"?`)) {
            try { await window.TMA_API.deactivateUser(userId); this.renderUsersPage(); } 
            catch (e) { alert(`Ошибка: ${e.message}`); }
        }
    }
    async handleReactivateUser(userId) {
        const user = this.usersCache.find(u => u.id == userId);
        if (confirm(`Восстановить пользователя "${user.first_name}"?`)) {
            try { await window.TMA_API.reactivateUser(userId); this.renderUsersPage(); }
            catch (e) { alert(`Ошибка: ${e.message}`); }
        }
    }

    // --- CRUD Участков ---

    openCreateLotModal() {
        if (!this.lotModal) return;
        this.lotModal.show({
            mode: 'create',
            masters: this.mastersCache,
            onSave: async (lotData) => {
                await window.TMA_API.createLot(lotData);
                this.lotModal.hide();
                this.renderLotsPage();
            }
        });
    }
    openEditLotModal(lotId) {
        if (!this.lotModal) return;
        const lotToEdit = this.lotsCache.find(l => l.id == lotId);
        if (!lotToEdit) return alert('Ошибка: участок не найден.');
        this.lotModal.show({
            mode: 'edit',
            lotData: lotToEdit,
            masters: this.mastersCache,
            onSave: async (lotData) => {
                await window.TMA_API.updateLot(lotId, lotData);
                this.lotModal.hide();
                this.renderLotsPage();
            }
        });
    }
    async handleDeactivateLot(lotId) {
        const lot = this.lotsCache.find(l => l.id == lotId);
        if (confirm(`Деактивировать участок "${lot.name}"?`)) {
            try { await window.TMA_API.deleteLot(lotId); this.renderLotsPage(); }
            catch (e) { alert(`Ошибка: ${e.message}`); }
        }
    }
    async handleReactivateLot(lotId) {
        const lot = this.lotsCache.find(l => l.id == lotId);
        if (confirm(`Восстановить участок "${lot.name}"?`)) {
            try { await window.TMA_API.reactivateLot(lotId); this.renderLotsPage(); }
            catch (e) { alert(`Ошибка: ${e.message}`); }
        }
    }
    
    // --- Вспомогательные функции ---
    showLoginError(message) {
        this.loginError.textContent = message;
        this.loginError.classList.remove('hidden');
    }
    clearLoginError() {
        this.loginError.textContent = '';
        this.loginError.classList.add('hidden');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Убедимся, что все классы загружены, прежде чем создавать экземпляры
    if (window.AuthManager && window.TMA_API && typeof UserModal !== 'undefined' && typeof LotModal !== 'undefined') {
        // Создаем главный экземпляр приложения
        const app = new App();
        
        // Инициализируем модальные окна и передаем их в приложение
        app.userModal = new UserModal();
        app.lotModal = new LotModal();

    } else {
        console.error('Не удалось инициализировать приложение: один или несколько ключевых компонентов отсутствуют.');
    }
});