// public/js/pages/lots.js
import api from '../api.js';
import store from '../store.js';

let lotModal; // Ссылка на модалку
let state = { filter: 'active' };

async function loadDataAndUpdateView() {
    try {
        const [lotsRes, usersRes] = await Promise.all([
            api.getLots('all'),
            api.getUsers('active')
        ]);
        const masters = (usersRes && usersRes.users)
            ? usersRes.users.filter(u => u.role === 'master')
            : [];
        store.setLots(lotsRes.lots || []);
        store.setMasters(masters);
        render();
    } catch (error) {
        console.error("Error in loadDataAndUpdateView for lots:", error);
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    const lotsToRender = store.state.lots.filter(l => state.filter === 'all' || !!l.is_active === (state.filter === 'active'));

    const lotCards = lotsToRender.map(lot => {
        const isInactive = !lot.is_active;
        const actionButtons = isInactive
            ? `<button class="button-action btn-restore" data-lot-id="${lot.id}" data-action="restore">Восстановить</button>`
            : `<button class="button-action btn-edit" data-lot-id="${lot.id}" data-action="edit">✏️ Правка</button>
               <button class="button-action btn-delete" data-lot-id="${lot.id}" data-action="delete">🗑️ Удалить</button>`;
        return `
            <div class="mobile-card ${isInactive ? 'inactive' : ''}" data-lot-id="${lot.id}">
                <div class="card-header">
                    <span class="card-id">ID: ${lot.id}</span>
                    <span class="status-badge" style="background: #fef3c7; color: #92400e; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                        ${lot.code}
                    </span>
                </div>
                <div class="card-main-info">${lot.name}</div>
                <div class="card-sub-info">Мастер: ${lot.main_master_name || '—'}</div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </div>`;
    }).join('');

    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="page-header">
            <h3>Участки</h3>
            <div class="page-controls">
                <select class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button button-small" data-action="create">✨ Создать</button>
            </div>
        </div>
        <div class="task-grid">
            ${lotCards || '<p class="empty-state">Участки не найдены.</p>'}
        </div>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    // FIX: Updated selector from 'tr' to '.mobile-card'
    const lotId = button.closest('.mobile-card')?.dataset.lotId || button.dataset.lotId;
    // Helper for create/update actions
    const onSave = async (apiCall) => {
        try {
            await apiCall();
            lotModal.hide();
            await loadDataAndUpdateView();
        } catch (error) {
            alert(`Ошибка сохранения: ${error.message}`);
        }
    };
    switch (action) {
        case 'create':
            lotModal.show({
                mode: 'create',
                masters: store.state.masters,
                onSave: (data) => onSave(() => api.createLot(data))
            });
            break;
        case 'edit':
            lotModal.show({
                mode: 'edit',
                masters: store.state.masters,
                lotData: store.getLotById(lotId),
                onSave: (data) => onSave(() => api.updateLot(lotId, data))
            });
            break;
        case 'delete':
            if (confirm('Деактивировать участок?')) {
                api.deleteLot(lotId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка удаления: ${error.message}`));
            }
            break;
        case 'restore':
            if (confirm('Восстановить участок?')) {
                api.reactivateLot(lotId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка восстановления: ${error.message}`));
            }
            break;
    }
}

export async function init(container, modals) {
    lotModal = modals.lot; // Получаем экземпляр из app.js
    container.innerHTML = `<h2>Загрузка...</h2>`;
    
    // Просто вешаем слушатели, app.js гарантирует, что контейнер чист
    container.addEventListener('click', handlePageClick);
    container.addEventListener('change', e => {
        if (e.target.classList.contains('page-filter')) {
            state.filter = e.target.value; render();
        }
    });
    
    await loadDataAndUpdateView();
}