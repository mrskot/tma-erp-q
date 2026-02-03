// public/js/pages/lots.js
import api from '../api.js';
import store from '../store.js';

let lotModal; // Ссылка на модалку
let state = { filter: 'active' };

async function loadDataAndUpdateView() {
    try {
        const [lotsRes, usersRes] = await Promise.all([api.getLots('all'), api.getUsers('active')]);
        store.setLots(lotsRes.data);
        store.setMasters(usersRes.data.filter(u => u.role === 'master'));
        render();
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    const lotsToRender = store.state.lots.filter(l => state.filter === 'all' || !!l.is_active === (state.filter === 'active'));

    const tableRows = lotsToRender.map(lot => {
        const isInactive = !lot.is_active;
        const actionButtons = isInactive
            ? `<button class="button-small button-success" data-lot-id="${lot.id}" data-action="restore">🔄️</button>`
            : `<button class="button-small button-secondary" data-lot-id="${lot.id}" data-action="edit">✏️</button>
               <button class="button-small button-danger" data-lot-id="${lot.id}" data-action="delete">🗑️</button>`;
        return `
            <tr class="${isInactive ? 'inactive-user' : ''}" data-lot-id="${lot.id}">
                <td>${lot.id}</td><td>${lot.name}</td><td>${lot.code}</td>
                <td>${lot.main_master_name || '—'}</td><td>${lot.temp_master_name || '—'}</td>
                <td class="actions">${actionButtons}</td>
            </tr>`;
    }).join('');

    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="page-header"><h3>Управление участками</h3>
            <div class="page-controls">
                <select class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button" data-action="create">✨ Создать</button>
            </div>
        </div>
        <table class="crud-table">
            <thead><tr><th>ID</th><th>Название</th><th>Код</th><th>Осн. мастер</th><th>Врем. мастер</th><th>Действия</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const lotId = button.closest('tr')?.dataset.lotId || button.dataset.lotId;

    switch (action) {
        case 'create':
            // Используем переданную lotModal
            lotModal.show({ mode: 'create', masters: store.state.masters, onSave: async (data) => {
                await api.createLot(data); lotModal.hide(); await loadDataAndUpdateView();
            }});
            break;
        case 'edit':
            lotModal.show({ mode: 'edit', masters: store.state.masters, lotData: store.getLotById(lotId), onSave: async (data) => {
                await api.updateLot(lotId, data); lotModal.hide(); await loadDataAndUpdateView();
            }});
            break;
        case 'delete':
            if (confirm('Деактивировать участок?')) api.deleteLot(lotId).then(loadDataAndUpdateView);
            break;
        case 'restore':
            if (confirm('Восстановить участок?')) api.reactivateLot(lotId).then(loadDataAndUpdateView);
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