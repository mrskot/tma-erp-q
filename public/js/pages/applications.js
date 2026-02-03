import api from '../api.js';
import store from '../store.js';
import { UI } from '../components/UIComponents.js';
import { ApplicationModal } from '../components/ApplicationModal.js';
import { ApplicationDetailsModal } from '../components/ApplicationDetailsModal.js';

// Инициализируем модалки локально, если они не переданы
// В идеале они должны приходить из app.js, но для надежности добавим фоллбек
let appModal;
let detailsModal;

let state = { filter: 'all', lotFilter: 'all' };

async function loadDataAndUpdateView() {
    try {
        const savedFilters = store.state.filters.applications;
        const filters = {};
        if (savedFilters.status !== 'all') filters.status = savedFilters.status;
        if (savedFilters.lot_id !== 'all') filters.lot_id = savedFilters.lot_id;

        const [appsRes, lotsRes] = await Promise.all([
            api.getApplications(filters),
            api.getLots('active')
        ]);
        
        store.setLots(lotsRes.data);
        render(appsRes.data, lotsRes.data);
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render(applications, lots) {
    const savedFilters = store.state.filters.applications;
    const lotOptions = lots.map(l => `<option value="${l.id}" ${savedFilters.lot_id == l.id ? 'selected' : ''}>${l.name}</option>`).join('');
    
    const content = `
        <div class="page-header">
            <h3>Заявки</h3>
            <div class="page-controls">
                <select id="app-lot-filter" class="page-filter">
                    <option value="all">Все участки</option>
                    ${lotOptions}
                </select>
                <select id="application-status-filter" class="page-filter">
                    <option value="all" ${savedFilters.status === 'all' ? 'selected' : ''}>Все статусы</option>
                    <option value="new" ${savedFilters.status === 'new' ? 'selected' : ''}>Новые</option>
                    <option value="assigned" ${savedFilters.status === 'assigned' ? 'selected' : ''}>Назначенные</option>
                    <option value="in_progress" ${savedFilters.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                    <option value="accepted" ${savedFilters.status === 'accepted' ? 'selected' : ''}>Принятые</option>
                    <option value="rejected" ${savedFilters.status === 'rejected' ? 'selected' : ''}>Отклоненные</option>
                </select>
            </div>
        </div>
        <div class="task-grid" id="applications-grid"></div>
        <div class="sticky-footer-action">
            <button id="create-application-btn" class="button">✨ Создать партию заявок</button>
        </div>
    `;
    
    const container = document.getElementById('page-content');
    container.innerHTML = content;

    const grid = document.getElementById('applications-grid');
    if (applications.length === 0) {
        grid.innerHTML = '<p class="subtitle">Заявки не найдены.</p>';
    } else {
        applications.forEach(app => {
            const card = UI.createApplicationCard(app, () => {
                if (detailsModal) detailsModal.show(app.id);
            });
            grid.appendChild(card);
        });
        // Распорка для футера
        const spacer = document.createElement('div');
        spacer.className = 'spacer-footer';
        grid.appendChild(spacer);
    }

    // Привязка событий
    document.getElementById('create-application-btn').onclick = () => {
        if (appModal) appModal.show({ mode: 'create', onSave: async (data) => {
            await api.createBatchApplications(data);
            appModal.hide();
            await loadDataAndUpdateView();
        }});
    };
}

export async function init(container, modals) {
    // Получаем модалки из app.js или создаем новые
    if (modals) {
        appModal = modals.application || new ApplicationModal();
        detailsModal = modals.applicationDetails || new ApplicationDetailsModal();
    } else {
        appModal = new ApplicationModal();
        detailsModal = new ApplicationDetailsModal();
    }

    container.innerHTML = `<h2>Загрузка заявок...</h2>`;
    
    // Обработчик фильтров (делегирование)
    container.addEventListener('change', (e) => {
        if (e.target.id === 'application-status-filter') {
            store.setFilters('applications', { status: e.target.value });
            loadDataAndUpdateView();
        }
        if (e.target.id === 'app-lot-filter') {
            store.setFilters('applications', { lot_id: e.target.value });
            loadDataAndUpdateView();
        }
    });

    await loadDataAndUpdateView();
}