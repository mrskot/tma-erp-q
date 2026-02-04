// public/js/pages/discrepancies.js
import api from '../api.js';
import store from '../store.js';
import { UI } from '../components/UIComponents.js';

let discModal;

async function loadDataAndUpdateView() {
    try {
        const savedFilters = store.state.filters.discrepancies;
        const filters = {};
        if (savedFilters.status !== 'all') filters.status = savedFilters.status;
        if (savedFilters.severity !== 'all') filters.severity = savedFilters.severity;

        // FIX: The response from API contains an object with a 'discrepancies' array.
        const response = await api.getDiscrepancies(filters);
        render(response.discrepancies || []);
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render(discrepancies) {
    const savedFilters = store.state.filters.discrepancies;
    
    const content = `
        <div class="page-header">
            <h3>Несоответствия</h3>
            <div class="page-controls">
                <select id="disc-status-filter" class="page-filter">
                    <option value="all" ${savedFilters.status === 'all' ? 'selected' : ''}>Все статусы</option>
                    <option value="new" ${savedFilters.status === 'new' ? 'selected' : ''}>Новые</option>
                    <option value="assigned" ${savedFilters.status === 'assigned' ? 'selected' : ''}>Назначены</option>
                    <option value="in_progress" ${savedFilters.status === 'in_progress' ? 'selected' : ''}>В работе</option>
                    <option value="resolved" ${savedFilters.status === 'resolved' ? 'selected' : ''}>Устранены</option>
                    <option value="closed" ${savedFilters.status === 'closed' ? 'selected' : ''}>Закрыты</option>
                </select>
                <select id="disc-severity-filter" class="page-filter">
                    <option value="all" ${savedFilters.severity === 'all' ? 'selected' : ''}>Любая важность</option>
                    <option value="low" ${savedFilters.severity === 'low' ? 'selected' : ''}>Низкая</option>
                    <option value="medium" ${savedFilters.severity === 'medium' ? 'selected' : ''}>Средняя</option>
                    <option value="high" ${savedFilters.severity === 'high' ? 'selected' : ''}>Высокая</option>
                    <option value="critical" ${savedFilters.severity === 'critical' ? 'selected' : ''}>Критическая</option>
                </select>
            </div>
        </div>
        <div class="task-grid" id="discrepancies-grid"></div>
    `;
    
    const container = document.getElementById('page-content');
    container.innerHTML = content;

    const grid = document.getElementById('discrepancies-grid');
    if (discrepancies.length === 0) {
        grid.innerHTML = '<p class="subtitle">Несоответствий не найдено.</p>';
    } else {
        discrepancies.forEach(disc => {
            const card = UI.createDiscrepancyCard(disc, () => {
                if (window.app && window.app.openEditDiscrepancyModal) {
                    window.app.openEditDiscrepancyModal(disc.id, loadDataAndUpdateView);
                }
            });
            grid.appendChild(card);
        });
    }
}

export async function init(container, modals) {
    discModal = modals ? modals.discrepancy : null;

    container.innerHTML = `<h2>Загрузка несоответствий...</h2>`;
    
    // Делегирование событий фильтрации
    container.addEventListener('change', (e) => {
        if (e.target.id === 'disc-status-filter') {
            store.setFilters('discrepancies', { status: e.target.value });
            loadDataAndUpdateView();
        }
        if (e.target.id === 'disc-severity-filter') {
            store.setFilters('discrepancies', { severity: e.target.value });
            loadDataAndUpdateView();
        }
    });

    await loadDataAndUpdateView();
}
