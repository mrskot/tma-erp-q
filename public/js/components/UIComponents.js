/**
 * UI Components for Task Cards
 */
export const UI = {
    /**
     * Creates a Task Card for Applications
     */
    createApplicationCard(app, onClick) {
        const card = document.createElement('div');
        const isUrgent = app.status === 'rejected' || (app.status === 'new' && new Date(app.desired_inspection_time) < new Date());
        
        card.className = `task-card card-compact ${isUrgent ? 'urgent-task' : ''}`;
        card.style.margin = "8px 0"; // Раздвигаем края до упора
        card.onclick = () => onClick(app);

        const statusTranslations = {
            'new': 'НОВАЯ',
            'assigned': 'НАЗНАЧЕНА',
            'in_progress': 'В РАБОТЕ',
            'accepted': 'ПРИНЯТО',
            'rejected': 'ОТКЛОНЕНО'
        };

        const statusClass = `bg-status-${app.status}`;
        const createdAt = new Date(app.created_at);
        const dateStr = createdAt.toLocaleDateString('ru-RU') + ' ' + createdAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const timeStr = new Date(app.desired_inspection_time).toLocaleString('ru-RU', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });

        // Формируем счетчик несоответствий
        let discCounterHtml = '';
        const totalDisc = parseInt(app.total_discrepancies || 0);
        const closedDisc = parseInt(app.closed_discrepancies || 0);
        const activeDisc = totalDisc - closedDisc;
        
        if (totalDisc > 0) {
            const isAllClosed = totalDisc === closedDisc;
            const hasConflict = activeDisc > 0;
            
            // Если всё устранено мастером (isAllClosed), но контролер еще не принял - подсвечиваем синим
            const bgColor = isAllClosed ? '#e6f7ff' : (hasConflict ? '#fff1f0' : '#fff7e6');
            const borderColor = isAllClosed ? '#91d5ff' : (hasConflict ? '#ffa39e' : '#ffd591');
            const textColor = isAllClosed ? '#0050b3' : (hasConflict ? '#cf1322' : '#d46b08');
            const icon = isAllClosed ? '🔄' : '❗';

            discCounterHtml = `
                <div style="background: ${bgColor}; border: 1px solid ${borderColor}; padding: 2px 8px; border-radius: 4px; display: flex; align-items: center; gap: 4px; margin-top: 4px; white-space: nowrap;">
                    <span style="font-size: 12px; font-weight: 900; color: ${textColor};">${icon} ${totalDisc}/${closedDisc}</span>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="card-header" style="padding: 8px 12px; border-bottom: 1px solid #f5f5f5;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                    <div style="flex: 1; min-width: 0;">
                        <div class="title" style="font-size: 15px; font-weight: 800; color: #1a1a1a; margin-bottom: 2px;">${app.product_name || 'Изделие'}</div>
                        <div class="subtitle" style="font-size: 10px; color: #8c8c8c;">${app.application_number} • ${dateStr}</div>
                    </div>
                    ${discCounterHtml}
                </div>
            </div>
            <div class="card-body" style="padding: 10px 12px; display: flex; flex-direction: column; gap: 5px;">
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 12px; color: #777; flex: 0 0 90px;">Заказ</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 13px; color: #111; flex: 1;">${app.production_order_number || '—'}</span>
                </div>
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 12px; color: #777; flex: 0 0 90px;">Чертеж</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 13px; color: #111; flex: 1;">${app.drawing_number || '—'}</span>
                </div>
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 12px; color: #777; flex: 0 0 90px;">Сер. номер</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 13px; color: #111; flex: 1;">${app.serial_number || '—'}</span>
                </div>
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 12px; color: #777; flex: 0 0 90px;">Мастер</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 13px; color: #111; flex: 1;">${app.master_name || '—'}</span>
                </div>
            </div>
            <div class="card-footer" style="padding: 8px 12px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                <div class="sla-indicator ${isUrgent ? 'sla-urgent' : 'sla-normal'}" style="font-size: 11px; font-weight: 600;">
                    <span>🕒 До: ${timeStr}</span>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                    <span class="status-badge ${statusClass}" style="font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 4px;">${statusTranslations[app.status] || app.status.toUpperCase()}</span>
                    <div class="subtitle" style="font-size: 9px; opacity: 0.6; font-weight: 600;">ID: ${app.id} ${app.btx_appl_id ? `| BTX: ${app.btx_appl_id}` : ''}</div>
                </div>
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
        card.style.margin = "8px 0"; 
        card.onclick = () => onClick(disc);

        const statusTranslations = {
            'new': 'НОВОЕ',
            'assigned': 'НАЗНАЧЕНО',
            'in_progress': 'В РАБОТЕ',
            'resolved': 'УСТРАНЕНО',
            'closed': 'ЗАКРЫТО'
        };

        const statusClass = `bg-status-${disc.status}`;
        const severityIcons = {
            low: '🟢',
            medium: '🟡',
            high: '🟠',
            critical: '🔴'
        };

        const disputeBadge = isDisputed ? '<span class="status-badge bg-status-rejected" style="margin-left:5px; font-size: 9px; padding: 2px 4px;">⚖️ ОСПОРЕНО</span>' : '';
        const detectedAt = new Date(disc.detected_at);
        const dateStr = detectedAt.toLocaleDateString('ru-RU') + ' ' + detectedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

        card.innerHTML = `
            <div class="card-header" style="padding: 8px 12px; border-bottom: 1px solid #f5f5f5;">
                <div style="flex: 1; min-width: 0;">
                    <div class="title" style="font-size: 14px; font-weight: 800; color: #1a1a1a; margin-bottom: 2px;">
                        ${severityIcons[disc.severity] || ''} ${disc.title} ${disputeBadge}
                    </div>
                    <div class="subtitle" style="font-size: 10px; color: #8c8c8c;">${disc.discrepancy_number} • ${dateStr}</div>
                </div>
            </div>
            <div class="card-body" style="padding: 10px 12px; display: flex; flex-direction: column; gap: 5px;">
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 11px; color: #777; flex: 0 0 90px;">№ Заявки</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 12px; color: #111; flex: 1;">${disc.application_number || 'Автономно'}</span>
                </div>
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 11px; color: #777; flex: 0 0 90px;">Выявил</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 12px; color: #111; flex: 1;">${disc.inspector_name || 'Система'}</span>
                </div>
                <div class="detail-row" style="display: flex; align-items: baseline;">
                    <span class="detail-label" style="font-style: italic; font-size: 11px; color: #777; flex: 0 0 90px;">Срок</span>
                    <span class="detail-value" style="font-weight: 700; font-size: 12px; color: #111; flex: 1;">${disc.due_date ? new Date(disc.due_date).toLocaleString('ru-RU', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : '—'}</span>
                </div>
                <div class="detail-row" style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
                    <span class="detail-label" style="font-style: italic; font-size: 10px; color: #999;">Описание дефекта:</span>
                    <span class="detail-value" style="font-size: 12px; line-height: 1.3; color: #444;">${disc.description || 'Нет описания'}</span>
                </div>
                ${isDisputed ? `
                <div style="border: 1px dashed #ff4d4f; padding: 6px; border-radius: 6px; background: #fff1f0; margin-top: 4px;">
                    <div style="font-size: 10px; font-weight: 700; color: #cf1322; margin-bottom: 2px;">Особое мнение мастера:</div>
                    <div style="font-size: 11px; font-style: italic; color: #111;">${disc.special_opinion || 'Текст не указан'}</div>
                </div>` : ''}
            </div>
            <div class="card-footer" style="padding: 8px 12px; border-top: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: center;">
                <div class="subtitle" style="font-size: 9px; opacity: 0.6; font-weight: 600;">ID: ${disc.id}</div>
                <span class="status-badge ${statusClass}" style="font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 4px;">${statusTranslations[disc.status] || disc.status.toUpperCase()}</span>
            </div>
        `;
        return card;
    }
};

// window.UI = UI; // Removed for module migration
