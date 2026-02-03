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
        store.setUsers(response.data);
        render();
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    // ... (вся функция render без изменений)
    const usersToRender = store.state.users.filter(user => {
        if (state.filter === 'all') return true;
        return !!user.is_active === (state.filter === 'active');
    });

    const tableRows = usersToRender.map(user => {
        const isInactive = !user.is_active;
        const rowClass = isInactive ? 'class="inactive-user"' : '';
        const actionButtons = isInactive
            ? `<button class="button-small button-success" data-user-id="${user.id}" data-action="restore" title="Восстановить">🔄️</button>`
            : `<button class="button-small button-secondary" data-user-id="${user.id}" data-action="edit" title="Редактировать">✏️</button>
               <button class="button-small button-danger" data-user-id="${user.id}" data-action="delete" title="Деактивировать">🗑️</button>`;
        return `
            <tr data-user-id="${user.id}" ${rowClass}>
                <td data-label="ID">${user.id}</td><td data-label="Имя">${user.first_name || ''} ${user.last_name || ''}</td>
                <td data-label="Роль">${getRoleName(user.role)}</td><td data-label="Telegram ID">${user.telegram_id || '-'}</td>
                <td data-label="PIN">${isInactive ? 'N/A' : '****'}</td><td class="actions">${actionButtons}</td>
            </tr>`;
    }).join('');

    document.getElementById('page-content').innerHTML = `
        <div class="page-header"><h3>Управление пользователями</h3>
            <div class="page-controls">
                <select id="user-status-filter" class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button" data-action="create">✨ Создать</button>
            </div>
        </div>
        <table class="crud-table">
            <thead><tr><th>ID</th><th>Имя</th><th>Роль</th><th>Telegram ID</th><th>PIN</th><th>Действия</th></tr></thead>
            <tbody>${tableRows || `<tr><td colspan="6">Пользователи не найдены.</td></tr>`}</tbody>
        </table>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const userId = button.closest('tr')?.dataset.userId || button.dataset.userId;

    const onSaveSuccess = async (apiCall) => {
        try {
            await apiCall();
            userModal.hide();
            await loadDataAndUpdateView();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    };

    switch (action) {
        case 'create':
            userModal.show({ mode: 'create', onSave: (data) => onSaveSuccess(() => api.createUser(data)) });
            break;
        case 'edit':
            userModal.show({ mode: 'edit', userData: store.getUserById(userId), onSave: (data) => onSaveSuccess(() => api.updateUser(userId, data)) });
            break;
        case 'delete':
            if (confirm('Деактивировать пользователя?')) api.deactivateUser(userId).then(loadDataAndUpdateView);
            break;
        case 'restore':
            if (confirm('Восстановить пользователя?')) api.reactivateUser(userId).then(loadDataAndUpdateView);
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