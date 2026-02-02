// public/js/pages/dashboard.js
import api from '../api.js';
import store from '../store.js';

function renderAdminDashboard(stats) {
    const { applications = {}, discrepancies = {} } = stats;
    return `
        <div class="page-header"><h3>Панель управления</h3></div>
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

function renderMasterDashboard() {
    // Логика для дашборда Мастера
    return `<div class="page-header"><h3>Мои задачи</h3></div><p>Здесь будут задачи мастера...</p>`;
}

export async function init(container) {
    container.innerHTML = `<h2>Загрузка статистики...</h2>`;
    const user = store.state.currentUser;

    if (user.role === 'admin' || user.role === 'director') {
        try {
            const [appStatsRes, discStatsRes] = await Promise.all([
                api.request('/applications/statistics'),
                api.request('/discrepancies/statistics')
            ]);
            container.innerHTML = renderAdminDashboard({
                applications: appStatsRes.data,
                discrepancies: discStatsRes.data,
            });
        } catch (error) {
            container.innerHTML = `<p class="error-message">Ошибка загрузки статистики: ${error.message}</p>`;
        }
    } else {
        // Для других ролей пока заглушка
        container.innerHTML = renderMasterDashboard();
    }
}