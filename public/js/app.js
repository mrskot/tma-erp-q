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
        this.productsCache = [];
        this.mastersCache = [];
        this.inspectorsCache = [];
        this.currentUserFilter = 'active';
        this.currentLotFilter = 'active';
        this.currentProductFilter = 'active';

        // Модальные окна - будут инициализированы после загрузки DOM
        this.userModal = null;
        this.lotModal = null;
        this.productModal = null;
        this.applicationModal = null;
        this.applicationDetailsModal = null; // Новое окно деталей
        this.discrepancyModal = null;

        // --- КОНФИГУРАЦИЯ РОЛЕЙ И ДОСТУПА ---
        this.ROLES_CONFIG = {
            admin: {
                defaultPage: 'dashboard',
                allowedPages: ['dashboard', 'users', 'lots', 'products', 'applications', 'discrepancies'],
                name: 'Администратор'
            },
            director: {
                defaultPage: 'dashboard',
                allowedPages: ['dashboard', 'lots', 'products', 'applications', 'discrepancies'],
                name: 'Директор'
            },
            inspector: {
                defaultPage: 'dashboard',
                allowedPages: ['dashboard', 'applications', 'discrepancies'],
                name: 'Контролёр ОТК'
            },
            master: {
                defaultPage: 'dashboard',
                allowedPages: ['dashboard', 'applications', 'discrepancies'],
                name: 'Мастер участка'
            },
            worker: {
                defaultPage: 'applications',
                allowedPages: ['applications'],
                name: 'Рабочий'
            }
        };

        this.PAGE_NAMES = {
            dashboard: 'Главная',
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
        
        // Поиск
        this.searchInput = document.getElementById('global-search-input');
        this.searchResults = document.getElementById('search-results');
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
            document.addEventListener('click', (e) => {
                if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                    this.searchResults.classList.add('hidden');
                }
            });
        }

        this.currentApplicationFilter = 'all'; 
        this.currentAppLotFilter = 'all';
        this.currentDiscStatusFilter = 'all';
        this.currentDiscSeverityFilter = 'all';
        this.updateViewState();
    }

    async handleSearch(event) {
        const query = event.target.value.trim();
        if (query.length < 2) {
            this.searchResults.classList.add('hidden');
            return;
        }

        try {
            const response = await window.TMA_API.request(`/search?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            
            if (result.success) {
                this.renderSearchResults(result.data);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    renderSearchResults(data) {
        this.searchResults.innerHTML = '';
        let hasResults = false;

        if (data.applications && data.applications.length > 0) {
            hasResults = true;
            const group = document.createElement('div');
            group.className = 'search-result-group';
            group.innerHTML = '<div class="search-result-header">Заявки</div>';
            data.applications.forEach(app => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <span class="badge status-${app.status}">${app.status}</span>
                    <span class="title">${app.application_number}</span>
                    <span class="subtitle">${app.drawing_number || ''} ${app.serial_number || ''}</span>
                `;
                item.onclick = () => {
                    this.viewApplication(app.id);
                    this.searchResults.classList.add('hidden');
                    this.searchInput.value = '';
                };
                group.appendChild(item);
            });
            this.searchResults.appendChild(group);
        }

        if (data.discrepancies && data.discrepancies.length > 0) {
            hasResults = true;
            const group = document.createElement('div');
            group.className = 'search-result-group';
            group.innerHTML = '<div class="search-result-header">Несоответствия</div>';
            data.discrepancies.forEach(disc => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <span class="badge severity-${disc.severity}">${disc.severity}</span>
                    <span class="title">${disc.title}</span>
                    <span class="subtitle">${disc.discrepancy_number}</span>
                `;
                item.onclick = () => {
                    this.openEditDiscrepancyModal(disc.id);
                    this.searchResults.classList.add('hidden');
                    this.searchInput.value = '';
                };
                group.appendChild(item);
            });
            this.searchResults.appendChild(group);
        }

        if (hasResults) {
            this.searchResults.classList.remove('hidden');
        } else {
            this.searchResults.innerHTML = '<div style="padding:10px; font-size:12px; color:#999;">Ничего не найдено</div>';
            this.searchResults.classList.remove('hidden');
        }
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
            case 'dashboard': this.renderDashboard(); break;
            case 'users': this.renderUsersPage(); break;
            case 'lots': this.renderLotsPage(); break;
            case 'products': this.renderProductsPage(); break;
            case 'applications': this.renderApplicationsPage(); break;
            case 'discrepancies': this.renderDiscrepanciesPage(); break;
            default: this.pageContent.innerHTML = '<h2>Страница не найдена</h2>';
        }
    }

    // --- Методы рендеринга страниц ---

    async renderDashboard() {
        const user = window.AuthManager.getUser();
        this.pageContent.innerHTML = `<h3>Панель управления</h3><p>Загрузка статистики...</p>`;
        
        try {
            if (['admin', 'director'].includes(user.role)) {
                const [appStatsRes, discStatsRes] = await Promise.all([
                    window.TMA_API.getApplicationStatistics(),
                    window.TMA_API.getDiscrepancyStatistics()
                ]);

                const appStats = appStatsRes.data;
                const discStats = discStatsRes.data;

                this.pageContent.innerHTML = `
                    <div class="dashboard-grid">
                        <div class="dashboard-card">
                            <h4>Заявки на приёмку</h4>
                            <div class="stats-list">
                                <div class="stat-item"><span>Новые:</span> <strong>${appStats.new || 0}</strong></div>
                                <div class="stat-item"><span>В работе:</span> <strong>${appStats.in_progress || 0}</strong></div>
                                <div class="stat-item"><span>Ожидают назначения:</span> <strong>${appStats.assigned || 0}</strong></div>
                                <div class="stat-item text-success"><span>Принято:</span> <strong>${appStats.accepted || 0}</strong></div>
                                <div class="stat-item text-danger"><span>Отклонено:</span> <strong>${appStats.rejected || 0}</strong></div>
                            </div>
                        </div>
                        <div class="dashboard-card">
                            <h4>Несоответствия</h4>
                            <div class="stats-list">
                                <div class="stat-item"><span>Новые:</span> <strong>${discStats.new || 0}</strong></div>
                                <div class="stat-item"><span>В работе:</span> <strong>${discStats.in_progress || 0}</strong></div>
                                <div class="stat-item text-success"><span>Закрыто:</span> <strong>${discStats.closed || 0}</strong></div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (user.role === 'master') {
                const appsRes = await window.TMA_API.getApplications({ master_id: user.id, status: 'new,assigned,in_progress' });

                this.pageContent.innerHTML = `
                    <div class="dashboard-grid">
                        <div class="dashboard-card full-width">
                            <h4>📑 Мои активные заявки</h4>
                            <div class="task-grid" id="master-apps-grid"></div>
                            ${appsRes.data.length > 6 ? '<button class="button-link" onclick="app.showPage(\'applications\')">Смотреть все заявки</button>' : ''}
                        </div>
                    </div>
                `;

                const appsGrid = document.getElementById('master-apps-grid');
                if (appsRes.data.length > 0) {
                    appsRes.data.slice(0, 6).forEach(app => {
                        appsGrid.appendChild(window.UI.createApplicationCard(app, (a) => this.viewApplication(a.id)));
                    });
                } else {
                    appsGrid.innerHTML = '<p class="subtitle">Активных заявок нет.</p>';
                }

            } else if (user.role === 'inspector') {
                // Запрашиваем свои заявки (в работе) и все новые (свободные)
                const [myAppsRes, newAppsRes] = await Promise.all([
                    window.TMA_API.getApplications({ inspector_id: user.id, status: 'assigned,in_progress' }),
                    window.TMA_API.getApplications({ status: 'new' }) // Для статуса NEW не передаем inspector_id
                ]);

                this.pageContent.innerHTML = `
                    <div class="dashboard-grid">
                        <div class="dashboard-card full-width">
                            <h4>🆕 Свободные заявки (${newAppsRes.data.length})</h4>
                            <div class="task-grid" id="inspector-new-apps-grid"></div>
                        </div>
                        <div class="dashboard-card full-width">
                            <h4>📋 В моей работе (${myAppsRes.data.length})</h4>
                            <div class="task-grid" id="inspector-apps-grid"></div>
                        </div>
                    </div>
                `;

                const newAppsGrid = document.getElementById('inspector-new-apps-grid');
                if (newAppsRes.data && newAppsRes.data.length > 0) {
                    newAppsRes.data.forEach(app => {
                        newAppsGrid.appendChild(window.UI.createApplicationCard(app, (a) => this.viewApplication(a.id)));
                    });
                } else {
                    newAppsGrid.innerHTML = '<p class="subtitle">Новых заявок пока нет.</p>';
                }

                const appsGrid = document.getElementById('inspector-apps-grid');
                if (myAppsRes.data && myAppsRes.data.length > 0) {
                    myAppsRes.data.forEach(app => {
                        appsGrid.appendChild(window.UI.createApplicationCard(app, (a) => this.viewApplication(a.id)));
                    });
                } else {
                    appsGrid.innerHTML = '<p class="subtitle">Вы еще не взяли ни одной заявки в работу.</p>';
                }
            }
        } catch (error) {
            console.error('Ошибка Dashboard:', error);
            this.pageContent.innerHTML = `<p class="error-message">Ошибка загрузки статистики: ${error.message}</p>`;
        }
    }

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

        async renderProductsPage() {
        this.pageContent.innerHTML = `<h3>Управление изделиями</h3><p>Загрузка...</p>`;
        try {
            const [productsResponse, lotsResponse, inspectorsResponse] = await Promise.all([
                window.TMA_API.getProducts(this.currentProductFilter),
                window.TMA_API.getLots('all'), // Загружаем все участки для селектора
                window.TMA_API.getUsersByRole('inspector') // Загружаем контролёров
            ]);

            if (!productsResponse.success || !Array.isArray(productsResponse.data)) {
                throw new Error(productsResponse.message || 'Не удалось загрузить изделия.');
            }
             if (!lotsResponse.success || !Array.isArray(lotsResponse.data)) {
                throw new Error(lotsResponse.message || 'Не удалось загрузить участки для фильтра.');
            }
            if (!inspectorsResponse.success || !Array.isArray(inspectorsResponse.data)) {
                throw new Error(inspectorsResponse.message || 'Не удалось загрузить контролёров.');
            }

            this.productsCache = productsResponse.data;
            this.lotsCache = lotsResponse.data;
            this.inspectorsCache = inspectorsResponse.data;

            const lotMap = new Map(this.lotsCache.map(l => [l.id, l.name]));
            
            const productTypes = {
                finished: 'Готовое изделие',
                semi_finished: 'Полуфабрикат',
                assembly: 'Сборочная единица',
                part: 'Деталь'
            };

            let tableRows = this.productsCache.map(product => {
                const isInactive = !product.is_active;
                const rowClass = isInactive ? 'class="inactive-user"' : '';
                const actionButtons = isInactive 
                    ? `<button class="button-small button-success" data-product-id="${product.id}" data-action="restore-product" title="Восстановить">🔄️</button>`
                    : `<button class="button-small button-secondary" data-product-id="${product.id}" data-action="edit-product" title="Редактировать">✏️</button>
                       <button class="button-small button-danger" data-product-id="${product.id}" data-action="deactivate-product" title="Деактивировать">🗑️</button>`;
                
                return `<tr data-product-id="${product.id}" ${rowClass}>
                    <td data-label="ID">${product.id}</td>
                    <td data-label="Название">${product.name}</td>
                    <td data-label="Тип">${productTypes[product.product_type] || product.product_type}</td>
                    <td data-label="Участок">${lotMap.get(product.lot_id) || 'Не привязан'}</td>
                    <td data-label="Чек-лист">${product.checklist && product.checklist.length > 0 ? `✅ (${product.checklist.length} п.)` : '—'}</td>
                    <td class="actions">${actionButtons}</td>
                </tr>`;
            }).join('');

            if (this.productsCache.length === 0) {
                tableRows = `<tr><td colspan="6">Изделия с данным фильтром не найдены.</td></tr>`;
            }

            this.pageContent.innerHTML = `
                <div class="page-header">
                    <h3>Управление изделиями</h3>
                    <div class="page-controls">
                        <select id="product-status-filter">
                            <option value="active" ${this.currentProductFilter === 'active' ? 'selected' : ''}>Активные</option>
                            <option value="inactive" ${this.currentProductFilter === 'inactive' ? 'selected' : ''}>Деактивированные</option>
                            <option value="all" ${this.currentProductFilter === 'all' ? 'selected' : ''}>Все</option>
                        </select>
                        <button id="create-product-btn" class="button">✨ Создать изделие</button>
                    </div>
                </div>
                <table class="crud-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Название</th>
                            <th>Тип</th>
                            <th>Участок</th>
                            <th>Чек-лист</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>`;
        } catch (error) {
            console.error('Ошибка при загрузке изделий:', error);
            this.pageContent.innerHTML = `<h3>Управление изделиями</h3><p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }
        async renderApplicationsPage() {
        this.pageContent.innerHTML = `<h3>Заявки</h3><p>Загрузка...</p>`;
        try {
            const filters = {};
            if (this.currentApplicationFilter && this.currentApplicationFilter !== 'all') {
                filters.status = this.currentApplicationFilter;
            }
            if (this.currentAppLotFilter && this.currentAppLotFilter !== 'all') {
                filters.lot_id = this.currentAppLotFilter;
            }

            const [response, lotsResponse] = await Promise.all([
                window.TMA_API.getApplications(filters),
                window.TMA_API.getLots('active')
            ]);

            if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Не удалось загрузить заявки.');
            
            const applications = response.data;
            const lots = lotsResponse.data || [];
            
            this.pageContent.innerHTML = `
                <div class="page-header">
                    <h3>Заявки</h3>
                    <div class="page-controls">
                        <select id="app-lot-filter">
                            <option value="all">Все участки</option>
                            ${lots.map(l => `<option value="${l.id}" ${this.currentAppLotFilter == l.id ? 'selected' : ''}>${l.name}</option>`).join('')}
                        </select>
                        <select id="application-status-filter">
                            <option value="all" ${this.currentApplicationFilter === 'all' ? 'selected' : ''}>Все статусы</option>
                            <option value="new" ${this.currentApplicationFilter === 'new' ? 'selected' : ''}>Новые</option>
                            <option value="assigned" ${this.currentApplicationFilter === 'assigned' ? 'selected' : ''}>Назначенные</option>
                            <option value="in_progress" ${this.currentApplicationFilter === 'in_progress' ? 'selected' : ''}>В работе</option>
                            <option value="accepted" ${this.currentApplicationFilter === 'accepted' ? 'selected' : ''}>Принятые</option>
                            <option value="rejected" ${this.currentApplicationFilter === 'rejected' ? 'selected' : ''}>Отклоненные</option>
                        </select>
                    </div>
                </div>
                <div class="task-grid" id="applications-grid"></div>
                ${!window.AuthManager.hasRole('worker') ? `
                <div class="sticky-footer-action">
                    <button id="create-application-btn" class="button">✨ Создать партию заявок</button>
                </div>` : ''}`;
            
            const grid = document.getElementById('applications-grid');
            if (applications.length === 0) {
                grid.innerHTML = '<p class="subtitle">Заявки не найдены.</p>';
            } else {
                applications.forEach(app => {
                    grid.appendChild(window.UI.createApplicationCard(app, (a) => this.viewApplication(a.id)));
                });
                // Добавляем распорку в конец списка
                const spacer = document.createElement('div');
                spacer.className = 'spacer-footer';
                grid.appendChild(spacer);
            }
        } catch (error) {
            console.error('Ошибка при загрузке заявок:', error);
            this.pageContent.innerHTML = `<h3>Заявки</h3><p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }

    async renderDiscrepanciesPage() {
        this.pageContent.innerHTML = `<h3>Несоответствия</h3><p>Загрузка...</p>`;
        try {
            const user = window.AuthManager.getUser();
            const filters = {};
            if (this.currentDiscStatusFilter && this.currentDiscStatusFilter !== 'all') {
                filters.status = this.currentDiscStatusFilter;
            }
            if (this.currentDiscSeverityFilter && this.currentDiscSeverityFilter !== 'all') {
                filters.severity = this.currentDiscSeverityFilter;
            }
            // Мастер видит только свои участки или те где он ответственный (опционально, пока оставим все для админа/мастера)
            
            const response = await window.TMA_API.getDiscrepancies(filters);
            if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Не удалось загрузить несоответствия.');
            
            const discrepancies = response.data;

            this.pageContent.innerHTML = `
                <div class="page-header">
                    <h3>Несоответствия</h3>
                    <div class="page-controls">
                        <select id="disc-status-filter">
                            <option value="all">Все статусы</option>
                            <option value="new" ${this.currentDiscStatusFilter === 'new' ? 'selected' : ''}>Новые</option>
                            <option value="assigned" ${this.currentDiscStatusFilter === 'assigned' ? 'selected' : ''}>Назначенные</option>
                            <option value="in_progress" ${this.currentDiscStatusFilter === 'in_progress' ? 'selected' : ''}>В работе</option>
                            <option value="resolved" ${this.currentDiscStatusFilter === 'resolved' ? 'selected' : ''}>Исправлено</option>
                            <option value="closed" ${this.currentDiscStatusFilter === 'closed' ? 'selected' : ''}>Закрыто</option>
                        </select>
                        <select id="disc-severity-filter">
                            <option value="all">Любая серьезность</option>
                            <option value="low" ${this.currentDiscSeverityFilter === 'low' ? 'selected' : ''}>Низкая</option>
                            <option value="medium" ${this.currentDiscSeverityFilter === 'medium' ? 'selected' : ''}>Средняя</option>
                            <option value="high" ${this.currentDiscSeverityFilter === 'high' ? 'selected' : ''}>Высокая</option>
                            <option value="critical" ${this.currentDiscSeverityFilter === 'critical' ? 'selected' : ''}>Критическая</option>
                        </select>
                    </div>
                </div>
                <div class="task-grid" id="discrepancies-grid"></div>
                ${(window.AuthManager.isInspector() || window.AuthManager.hasRole('master')) ? `
                <div class="sticky-footer-action">
                    <button id="create-discrepancy-btn" class="button">✨ Зафиксировать несоответствие</button>
                </div>` : ''}`;

            const grid = document.getElementById('discrepancies-grid');
            if (discrepancies.length === 0) {
                grid.innerHTML = '<p class="subtitle">Несоответствия не найдены.</p>';
            } else {
                discrepancies.forEach(disc => {
                    grid.appendChild(window.UI.createDiscrepancyCard(disc, (d) => this.openEditDiscrepancyModal(d.id)));
                });
                // Добавляем распорку в конец списка
                const spacer = document.createElement('div');
                spacer.className = 'spacer-footer';
                grid.appendChild(spacer);
            }
        } catch (error) {
            console.error('Ошибка при загрузке несоответствий:', error);
            this.pageContent.innerHTML = `<h3>Несоответствия</h3><p class="error-message">Ошибка: ${error.message}</p>`;
        }
    }

    // --- Обработчики событий ---

    handlePageContentClick(event) {
        const target = event.target;
        if (target.matches('#create-user-btn')) { this.openCreateUserModal(); return; }
        if (target.matches('#create-lot-btn')) { this.openCreateLotModal(); return; }
        if (target.matches('#create-product-btn')) { this.openCreateProductModal(); return; }
        if (target.matches('#create-application-btn')) { this.openCreateApplicationModal(); return; }
        if (target.matches('#create-discrepancy-btn')) { this.openCreateDiscrepancyModal(); return; }

        const actionButton = target.closest('button[data-action]');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const userId = actionButton.dataset.userId;
            const lotId = actionButton.dataset.lotId;
            const productId = actionButton.dataset.productId;
            const applicationId = actionButton.dataset.applicationId;
            const discrepancyId = actionButton.dataset.discrepancyId;

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
            if (productId) {
                if (action === 'edit-product') this.openEditProductModal(productId);
                if (action === 'deactivate-product') this.handleDeactivateProduct(productId);
                if (action === 'restore-product') this.handleReactivateProduct(productId);
            }
            if (applicationId) {
                if (action === 'view-application') this.viewApplication(applicationId);
                if (action === 'delete-application') this.handleDeleteApplication(applicationId);
            }
            if (discrepancyId) {
                if (action === 'edit-discrepancy') this.openEditDiscrepancyModal(discrepancyId);
                if (action === 'delete-discrepancy') this.handleDeleteDiscrepancy(discrepancyId);
            }
        }
    }

    handlePageContentChange(event) {
        const target = event.target;
        console.log('Filter changed:', target.id, target.value); // Отладка
        if (target.matches('#user-status-filter')) {
            this.currentUserFilter = target.value;
            this.renderUsersPage();
        }
        if (target.matches('#lot-status-filter')) {
            this.currentLotFilter = target.value;
            this.renderLotsPage();
        }
        if (target.matches('#product-status-filter')) {
            this.currentProductFilter = target.value;
            this.renderProductsPage();
        }
        if (target.matches('#application-status-filter')) {
            this.currentApplicationFilter = target.value;
            this.renderApplicationsPage();
        }
        if (target.matches('#app-lot-filter')) {
            this.currentAppLotFilter = target.value;
            console.log('App lot filter set to:', this.currentAppLotFilter);
            this.renderApplicationsPage();
        }
        if (target.matches('#disc-status-filter')) {
            this.currentDiscStatusFilter = target.value;
            this.renderDiscrepanciesPage();
        }
        if (target.matches('#disc-severity-filter')) {
            this.currentDiscSeverityFilter = target.value;
            this.renderDiscrepanciesPage();
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

    // --- CRUD Изделий ---

    openCreateProductModal() {
        if (!this.productModal) return;
        this.productModal.show({
            mode: 'create',
            lots: this.lotsCache,
            inspectors: this.inspectorsCache,
            onSave: async (productData) => {
                await window.TMA_API.createProduct(productData);
                this.productModal.hide();
                this.renderProductsPage();
            }
        });
    }

    openEditProductModal(productId) {
        if (!this.productModal) return;
        const productToEdit = this.productsCache.find(p => p.id == productId);
        if (!productToEdit) return alert('Ошибка: изделие не найдено.');
        this.productModal.show({
            mode: 'edit',
            productData: productToEdit,
            lots: this.lotsCache,
            inspectors: this.inspectorsCache,
            onSave: async (productData) => {
                await window.TMA_API.updateProduct(productId, productData);
                this.productModal.hide();
                this.renderProductsPage();
            }
        });
    }

    async handleDeactivateProduct(productId) {
        const product = this.productsCache.find(p => p.id == productId);
        if (confirm(`Деактивировать изделие "${product.name}"?`)) {
            try {
                await window.TMA_API.deleteProduct(productId);
                this.renderProductsPage();
            } catch (e) {
                alert(`Ошибка: ${e.message}`);
            }
        }
    }

    async handleReactivateProduct(productId) {
        const product = this.productsCache.find(p => p.id == productId);
        if (confirm(`Восстановить изделие "${product.name}"?`)) {
            try {
                await window.TMA_API.reactivateProduct(productId);
                this.renderProductsPage();
            } catch (e) {
                alert(`Ошибка: ${e.message}`);
            }
        }
    }
    
    // --- CRUD Заявок ---

    openCreateApplicationModal() {
        if (!this.applicationModal) return;
        this.applicationModal.show({
            mode: 'create',
            onSave: async (batchData) => {
                await window.TMA_API.createBatchApplications(batchData);
                this.applicationModal.hide();
                this.renderApplicationsPage();
            }
        });
    }

    async handleDeleteApplication(applicationId) {
        if (confirm(`Вы уверены, что хотите удалить заявку #${applicationId}?`)) {
            try {
                await window.TMA_API.deleteApplication(applicationId);
                this.renderApplicationsPage();
            } catch (e) {
                alert(`Ошибка при удалении: ${e.message}`);
            }
        }
    }

    viewApplication(applicationId) {
        if (this.applicationDetailsModal) {
            this.applicationDetailsModal.show(applicationId);
        } else {
            alert(`Просмотр заявки #${applicationId}`);
        }
    }
    
    // --- CRUD Несоответствий ---

    async openCreateDiscrepancyModal(applicationId = null, onSaveCallback = null) {
        if (!this.discrepancyModal) return;
        this.discrepancyModal.show({
            mode: 'create',
            applicationId,
            onSave: async (data) => {
                await window.TMA_API.createDiscrepancy(data);
                this.discrepancyModal.hide();
                if (onSaveCallback) {
                    await onSaveCallback();
                } else {
                    this.renderDiscrepanciesPage();
                }
            }
        });
    }

    async openEditDiscrepancyModal(id) {
        if (!this.discrepancyModal) return;
        try {
            const response = await window.TMA_API.getDiscrepancyById(id);
            if (!response.success) throw new Error(response.message);
            
            this.discrepancyModal.show({
                mode: 'edit',
                discrepancyData: response.data,
                onSave: async (data) => {
                    await window.TMA_API.updateDiscrepancy(id, data);
                    this.discrepancyModal.hide();
                    this.renderDiscrepanciesPage();
                }
            });
        } catch (e) {
            alert(`Ошибка: ${e.message}`);
        }
    }

    async handleDeleteDiscrepancy(id) {
        if (confirm(`Вы уверены, что хотите удалить несоответствие #${id}?`)) {
            try {
                await window.TMA_API.deleteDiscrepancy(id);
                this.renderDiscrepanciesPage();
            } catch (e) {
                alert(`Ошибка при удалении: ${e.message}`);
            }
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
    if (window.AuthManager && window.TMA_API && typeof UserModal !== 'undefined' && typeof LotModal !== 'undefined' && typeof ProductModal !== 'undefined' && typeof ApplicationModal !== 'undefined' && typeof DiscrepancyModal !== 'undefined') {
        // Создаем главный экземпляр приложения и делаем его глобальным
        window.app = new App();
        
        // Инициализируем модальные окна и передаем их в приложение
        app.userModal = new UserModal();
        app.lotModal = new LotModal();
        app.productModal = new ProductModal();
        app.applicationModal = new ApplicationModal();
        app.applicationDetailsModal = new ApplicationDetailsModal(); // Инициализация
        app.discrepancyModal = new DiscrepancyModal();


    } else {
        console.error('Не удалось инициализировать приложение: один или несколько ключевых компонентов отсутствуют.');
    }
});