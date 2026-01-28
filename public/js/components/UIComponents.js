/**
 * UI Components for Task Cards
 */
const UI = {
    /**
     * Creates a Task Card for Applications
     */
    createApplicationCard(app, onClick) {
        const card = document.createElement('div');
        const isUrgent = app.status === 'rejected' || (app.status === 'new' && new Date(app.desired_inspection_time) < new Date());
        
        card.className = `task-card card-compact ${isUrgent ? 'urgent-task' : ''}`;
        card.onclick = () => onClick(app);

        const statusClass = `bg-status-${app.status}`;
        const dateStr = new Date(app.created_at).toLocaleDateString();
        const timeStr = new Date(app.desired_inspection_time).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

        card.innerHTML = `
            <div class="card-header" style="padding: 6px 10px;">
                <div style="flex: 1; min-width: 0;">
                    <div class="title" style="font-size: 13px; font-weight: 700;">${app.product_name || 'Изделие'}</div>
                    <div class="subtitle" style="font-size: 10px;">${app.application_number} • ${dateStr}</div>
                </div>
                <span class="status-badge ${statusClass}" style="font-size: 9px; padding: 2px 6px;">${app.status.toUpperCase()}</span>
            </div>
            <div class="card-body" style="padding: 4px 10px; gap: 4px;">
                <div class="detail-item">
                    <span class="detail-label">Чертеж</span>
                    <span class="detail-value">${app.drawing_number || '—'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Участок</span>
                    <span class="detail-value">${app.lot_name || '—'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Серийник</span>
                    <span class="detail-value">${app.serial_number || '—'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Мастер</span>
                    <span class="detail-value">${app.master_name || '—'}</span>
                </div>
            </div>
            <div class="card-footer" style="padding: 4px 10px; border-top: 1px solid #f0f0f0;">
                <div class="sla-indicator ${isUrgent ? 'sla-urgent' : 'sla-normal'}" style="font-size: 10px;">
                    <span>🕒 До: ${timeStr}</span>
                </div>
                <div class="subtitle" style="font-size: 9px;">ID: ${app.id}</div>
            </div>
        `;
        return card;
    },

    /**
     * Creates a Task Card for Discrepancies
     */
    createDiscrepancyCard(disc, onClick) {
        const card = document.createElement('div');
        const isUrgent = disc.severity === 'high' || disc.severity === 'critical';
        const isDisputed = disc.is_disputed;
        
        card.className = `task-card card-compact ${isUrgent ? 'urgent-task' : ''} ${isDisputed ? 'disputed-task' : ''}`;
        card.onclick = () => onClick(disc);

        const statusClass = `bg-status-${disc.status}`;
        const severityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };

        const disputeBadge = isDisputed ? '<span class="status-badge bg-status-rejected" style="margin-left:5px; font-size: 8px;">⚖️ ОСПОРЕНО</span>' : '';

        card.innerHTML = `
            <div class="card-header" style="padding: 6px 10px;">
                <div style="flex: 1; min-width: 0;">
                    <div class="title" style="font-size: 13px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        ${severityIcons[disc.severity] || ''} ${disc.title} ${disputeBadge}
                    </div>
                    <div class="subtitle" style="font-size: 10px;">${disc.discrepancy_number} | <span style="font-weight: 600;">№: ${disc.application_number || 'Автономно'}</span></div>
                </div>
                <span class="status-badge ${statusClass}" style="font-size: 9px; padding: 2px 6px;">${disc.status.toUpperCase()}</span>
            </div>
            <div class="card-body" style="padding: 4px 10px; gap: 4px;">
                <div class="detail-item" style="grid-column: span 2;">
                    <span class="detail-label">Дефект</span>
                    <span class="detail-value" style="font-size: 11px; line-height: 1.2;">${disc.description || 'Нет описания'}</span>
                </div>
                ${isDisputed ? `
                <div class="detail-item" style="grid-column: span 2; border: 1px dashed #ff4d4f; padding: 3px; border-radius: 4px; background: #fff1f0; margin-top: 2px;">
                    <span class="detail-label" style="font-size: 9px;">Особое мнение:</span>
                    <span class="detail-value" style="font-size: 10px; font-style: italic; color: #cf1322;">${disc.special_opinion || 'Не указано'}</span>
                </div>` : ''}
                <div class="detail-item">
                    <span class="detail-label">Выявил</span>
                    <span class="detail-value">${disc.inspector_name || 'Система'}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Срок</span>
                    <span class="detail-value" style="font-weight: 600;">${disc.due_date ? new Date(disc.due_date).toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—'}</span>
                </div>
            </div>
            <div class="card-footer" style="padding: 4px 10px; border-top: 1px solid #f0f0f0;">
                <div class="sla-indicator ${isUrgent ? 'sla-urgent' : 'sla-normal'}" style="font-size: 10px;">
                    <span>⚠️ ${new Date(disc.detected_at).toLocaleDateString()}</span>
                </div>
                <div class="subtitle" style="font-size: 9px;">#${disc.id}</div>
            </div>
        `;
        return card;
    }
};

window.UI = UI;
