import api from '../api.js';
import store from '../store.js';
import { UI } from '../components/UIComponents.js';

function renderAdminDashboard(stats) {
    const { applications = {}, discrepancies = {} } = stats;
    return `
        <div class="page-header">
            <h3>Панель управления</h3>
            <button id="refresh-dashboard" class="button button-small">🔄 Обновить</button>
        </div>
        <div class="dashboard-grid">
            <div class="dashboard-card">
                <h4>Заявки на приёмку</h4>
                <div class="stats-list">
                    <div class="stat-item"><span>Новые:</span> <strong>${applications.new || 0}</strong></div>
                    <div class="stat-item"><span>В работе:</span> <strong>${applications.in_progress || 0}</strong></div>
                    <div class="stat-item"><span>Принято:</span> <strong>${applications.accepted || 0}</strong></div>
                    <div class="stat-item"><span>Отклонено:</span> <strong>${applications.rejected || 0}</strong></div>
                </div>
            </div>
            <div class="dashboard-card">
                <h4>Несоответствия</h4>
                <div class="stats-list">
                    <div class="stat-item"><span>Новые:</span> <strong>${discrepancies.new || 0}</strong></div>
                    <div class="stat-item"><span>В работе:</span> <strong>${discrepancies.in_progress || 0}</strong></div>
                    <div class="stat-item"><span>Закрыто:</span> <strong>${discrepancies.closed || 0}</strong></div>
                </div>
            </div>
        </div>
    `;
}

async function renderRoleDashboard(container, user, modals) {
    container.innerHTML = `
        <div class="page-header">
            <h3>${user.role === 'master' ? 'Мои задачи (Мастер)' : 'Задачи контроля (Инспектор)'}</h3>
            <button id="refresh-dashboard" class="button button-small">🔄 Обновить</button>
        </div>
        <div class="dashboard-role-content">
            <section class="dashboard-section">
                <h4 id="section1-title">Загрузка...</h4>
                <div id="section1-grid" class="task-grid"></div>
            </section>
            <section class="dashboard-section" style="margin-top: 20px;">
                <h4 id="section2-title">Загрузка...</h4>
                <div id="section2-grid" class="task-grid"></div>
            </section>
        </div>
    `;

    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) refreshBtn.onclick = () => init(container, modals);

    const section1Title = document.getElementById('section1-title');
    const section1Grid = document.getElementById('section1-grid');
    const section2Title = document.getElementById('section2-title');
    const section2Grid = document.getElementById('section2-grid');

    try {
        if (user.role === 'master') {
            section1Title.textContent = '🛠 Требует внимания (Дефекты)';
            section2Title.textContent = '📋 Мои последние заявки';
            
            const [discRes, appRes] = await Promise.all([
                api.getDiscrepancies({ responsible_id: user.id, status: 'new,assigned,in_progress,rejected' }),
                api.getApplications({ master_id: user.id, limit: 5 })
            ]);
            
            renderGrid(section1Grid, discRes.discrepancies || [], 'discrepancy', modals);
            renderGrid(section2Grid, appRes.applications || [], 'application', modals);

        } else if (user.role === 'inspector') {
            section1Title.textContent = '🔍 Заявки на проверку';
            section2Title.textContent = '✅ Проверить устранение';

            const [appRes, discRes] = await Promise.all([
                api.getApplications({ status: 'new,assigned,in_progress' }),
                api.getDiscrepancies({ status: 'resolved' })
            ]);

            renderGrid(section1Grid, appRes.applications || [], 'application', modals);
            renderGrid(section2Grid, discRes.discrepancies || [], 'discrepancy', modals);
        }
    } catch (error) {
        container.innerHTML += `<p class="error-message">Ошибка загрузки данных: ${error.message}</p>`;
    }
}

function renderGrid(grid, items, type, modals) {
    grid.innerHTML = '';
    if (!items || items.length === 0) {
        grid.innerHTML = `<p class="empty-state" style="padding: 20px; text-align: center; color: #888; font-style: italic;">
            ${type === 'application' ? 'Задач по заявкам нет 🙌' : 'Активных дефектов нет 🙌'}
        </p>`;
        return;
    }

    items.forEach(item => {
        let card;
        const refreshCallback = () => {
            const currentContainer = document.getElementById('page-content');
            init(currentContainer, modals);
        };

        if (type === 'application') {
            card = UI.createApplicationCard(item, (a) => {
                if (modals && modals.applicationDetails) {
                    modals.applicationDetails.show(a.id, refreshCallback);
                }
            });
        } else {
            card = UI.createDiscrepancyCard(item, (d) => {
                if (window.app && window.app.openEditDiscrepancyModal) {
                    window.app.openEditDiscrepancyModal(d.id, refreshCallback);
                }
            });
        }
        grid.appendChild(card);
    });
}

export async function init(container, modals) {
    container.innerHTML = `<h2>Загрузка...</h2>`;
    const user = store.state.currentUser;
    if (!user) return;

    if (user.role === 'admin' || user.role === 'director') {
        try {
            const [appStats, discStats] = await Promise.all([
                api.request('/applications/statistics'),
                api.request('/discrepancies/statistics')
            ]);
            
            container.innerHTML = renderAdminDashboard({
                applications: appStats,
                discrepancies: discStats
            });
            const refreshBtn = document.getElementById('refresh-dashboard');
            if (refreshBtn) refreshBtn.onclick = () => init(container, modals);
        } catch (error) {
            container.innerHTML = `<p class="error-message">Ошибка загрузки статистики: ${error.message}</p>`;
        }
    } else {
        await renderRoleDashboard(container, user, modals);
    }
}