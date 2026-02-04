// public/js/pages/users.js
import api from '../api.js';
import store from '../store.js';

let state = { filter: 'active' };
let userModal; // Будет инициализировано извне

// ... (функция getRoleName без изменений)
function getRoleName(role) {
    const rolesMap = { admin: 'Администратор', director: 'Директор', inspector: 'Контролёр ОТК', master: 'Мастер', worker: 'Рабочий' };
    return rolesMap[role] || role;
}

async function loadDataAndUpdateView() {
    try {
        const response = await api.getUsers('all');
        // FINAL FIX: The API client returns the 'data' object which contains 'users'.
        store.setUsers(response.users || []);
        render();
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    const usersToRender = store.state.users.filter(user => {
        if (state.filter === 'all') return true;
        return !!user.is_active === (state.filter === 'active');
    });

    const userCards = usersToRender.map(user => {
        const isInactive = !user.is_active;
        const actionButtons = isInactive
            ? `<button class="button-action btn-restore" data-user-id="${user.id}" data-action="restore">Восстановить</button>`
            : `<button class="button-action btn-edit" data-user-id="${user.id}" data-action="edit">✏️ Правка</button>
               <button class="button-action btn-delete" data-user-id="${user.id}" data-action="delete">🗑️ Удалить</button>`;
        
        return `
            <div class="mobile-card ${isInactive ? 'inactive' : ''}" data-user-id="${user.id}">
                <div class="card-header">
                    <span class="card-id">ID: ${user.id}</span>
                    <span class="status-badge" style="background: ${isInactive ? '#eee' : '#e0f2fe'}; color: ${isInactive ? '#999' : '#0369a1'}; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                        ${getRoleName(user.role).toUpperCase()}
                    </span>
                </div>
                <div class="card-main-info">${user.first_name || ''} ${user.last_name || ''}</div>
                <div class="card-sub-info">
                    ${user.telegram_id ? `<div>TG: ${user.telegram_id}</div>` : ''}
                    ${user.bitrix_id ? `<div>Bitrix: ${user.bitrix_id}</div>` : ''}
                </div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </div>`;
    }).join('');

    document.getElementById('page-content').innerHTML = `
        <div class="page-header">
            <h3>Пользователи</h3>
            <div class="page-controls">
                <select id="user-status-filter" class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button button-small" data-action="create">✨ Создать</button>
            </div>
        </div>
        <div class="task-grid">
            ${userCards || '<p class="empty-state">Пользователи не найдены.</p>'}
        </div>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    // FIX: Updated selector from 'tr' to '.mobile-card' to match the new UI.
    const userId = button.closest('.mobile-card')?.dataset.userId || button.dataset.userId;
    // Helper function for DRY code in create/update actions
    const onSave = async (apiCall) => {
        try {
            await apiCall();
            userModal.hide();
            await loadDataAndUpdateView();
        } catch (error) {
            // Now we can show backend validation errors to the user
            alert(`Ошибка сохранения: ${error.message}`);
        }
    };
    switch (action) {
        case 'create':
            userModal.show({
                mode: 'create',
                onSave: (data) => onSave(() => api.createUser(data))
            });
            break;
        case 'edit':
            userModal.show({
                mode: 'edit',
                userData: store.getUserById(userId),
                onSave: (data) => onSave(() => api.updateUser(userId, data))
            });
            break;
        case 'delete':
            if (confirm('Деактивировать пользователя?')) {
                api.deactivateUser(userId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка удаления: ${error.message}`));
            }
            break;
        case 'restore':
            if (confirm('Восстановить пользователя?')) {
                api.reactivateUser(userId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка восстановления: ${error.message}`));
            }
            break;
    }
}

        let clickHandler = null;
        let changeHandler = null;

        export async function init(container, modals) {
            userModal = modals.user; // Получаем экземпляр модального окна
            container.innerHTML = `<h2>Загрузка...</h2>`;
            
            // Удаляем старые обработчики, если они были привязаны к этому контейнеру ранее
            // Примечание: Это работает только если container - тот же самый DOM элемент
            if (clickHandler) container.removeEventListener('click', clickHandler);
            if (changeHandler) container.removeEventListener('change', changeHandler);

            // Создаем новые обработчики
            clickHandler = handlePageClick;
            changeHandler = (e) => {
                if (e.target.classList.contains('page-filter')) {
                    state.filter = e.target.value;
                    render();
                }
            };

            // Привязываем
            container.addEventListener('click', clickHandler);
            container.addEventListener('change', changeHandler);
    
    await loadDataAndUpdateView();
}