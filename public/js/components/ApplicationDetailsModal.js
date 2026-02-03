/**
 * Modal for viewing application details and taking actions
 * Refactored to separate View (Templates) from Logic
 */
import api from '../api.js'; 
import authManager from '../auth.js'; 
import { UI } from './UIComponents.js';

/**
 * Templates for Application Modal UI elements
 */
const ApplicationTemplates = {
    statusMap: {
        new: 'Новая',
        assigned: 'Назначена',
        in_progress: 'В работе',
        accepted: 'Принято',
        rejected: 'Отклонено'
    },

    statusBadge: (status) => {
        const text = ApplicationTemplates.statusMap[status] || status.toUpperCase();
        return `<span class="status-badge bg-status-${status}">${text}</span>`;
    },

    detailRow: (label, value) => `
        <div class="detail-row" style="display: flex; margin-bottom: 4px; font-size: 13px;">
            <span style="flex: 0 0 100px; color: #666; font-style: italic;">${label}:</span>
            <span style="font-weight: 800; color: #111;">${value || '—'}</span>
        </div>
    `,

    mainDetails: (app) => {
        const T = ApplicationTemplates;
        return `
            <div style="margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                ${T.detailRow('Номер', app.application_number)}
            </div>
            ${T.detailRow('Заказ', app.production_order_number)}
            ${T.detailRow('Изделие', app.product_name)}
            ${T.detailRow('Чертеж', app.drawing_number)}
            ${T.detailRow('Сер. номер', app.serial_number)}
            ${T.detailRow('Мастер', app.master_name)}
            ${T.detailRow('Участок', app.lot_name)}
            ${app.btx_appl_id ? T.detailRow('Bitrix ID', app.btx_appl_id) : ''}
            <div style="display: flex; align-items: center; margin-top: 8px;">
                <span style="flex: 0 0 100px; color: #666; font-style: italic;">Статус:</span>
                ${T.statusBadge(app.status)}
            </div>
        `;
    },

    checklistItem: (itemText, index, isInspector, isLocked) => {
        if (isInspector) {
            return `
                <div class="checklist-item" style="display: flex; gap: 10px; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding: 4px 0;">
                    <input type="checkbox" id="check-${index}" style="margin-top: 3px;" ${isLocked ? 'disabled checked' : ''}>
                    <label for="check-${index}" style="font-size: 13px; line-height: 1.4; color: #333;">${itemText}</label>
                </div>
            `;
        }
        return `
            <div class="checklist-item" style="display: flex; gap: 10px; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding: 4px 0;">
                <span style="color: #667eea; margin-top: 2px;">🔹</span>
                <span style="font-size: 13px; line-height: 1.4; color: #333;">${itemText}</span>
            </div>
        `;
    }
};

export class ApplicationDetailsModal {
    constructor() {
        this.modal = document.getElementById('application-details-modal');
        if (!this.modal) return;
        
        this.closeButton = this.modal.querySelector('.close');
        this.actionsContainer = document.getElementById('view-app-actions');
        this.detailsSection = this.modal.querySelector('.details-section');
        
        this.mkiSection = document.getElementById('view-app-mki-section');
        this.mkiImg = document.getElementById('view-app-mki-img');
        this.discList = document.getElementById('view-app-discrepancies-list');
        
        this.checklistSection = document.getElementById('view-app-checklist-section');
        this.checklistItems = document.getElementById('view-app-checklist-items');
        
        this.currentApp = null;
        this.attachEventListeners();
    }

    attachEventListeners() {
        // Привязываем события один раз
        this.closeButton.onclick = () => this.hide();
        window.addEventListener('click', (event) => {
            if (event.target === this.modal) this.hide();
        });
    }

    async show(applicationId) {
        try {
            const response = await api.getApplicationById(applicationId);
            if (!response.success) throw new Error(response.message);
            
            const app = response.data;
            this.currentApp = app;
            
            // Рендерим детали
            this.detailsSection.innerHTML = ApplicationTemplates.mainDetails(app);
            
            // Рендерим чек-лист
            this.renderChecklist(app);

            // Фото МКИ
            if (app.mki_photo_url) {
                this.mkiImg.src = app.mki_photo_url;
                this.mkiSection.style.display = 'block';
            } else {
                this.mkiSection.style.display = 'none';
            }
            
            await this.refreshDiscrepancies(applicationId);
            this.renderActions(app);
            
            this.modal.style.display = 'block';
        } catch (e) {
            console.error('Application modal error:', e);
            alert(`Ошибка при загрузке: ${e.message}`);
        }
    }

    async refreshDiscrepancies(applicationId) {
        this.discList.innerHTML = '<p class="subtitle">Загрузка несоответствий...</p>';
        try {
            const response = await api.getDiscrepancies({ application_id: applicationId });
            this.discList.innerHTML = '';
            
            if (response.success && response.data.length > 0) {
                response.data.forEach(disc => {
                    const card = UI.createDiscrepancyCard(disc, (d) => {
                        window.app.openEditDiscrepancyModal(d.id, async () => {
                            await this.refreshDiscrepancies(applicationId);
                        });
                    });
                    this.discList.appendChild(card);
                });
            } else {
                this.discList.innerHTML = '<p class="subtitle">Несоответствий не обнаружено.</p>';
            }
        } catch (e) {
            this.discList.innerHTML = `<p class="error-message">Ошибка: ${e.message}</p>`;
        }
    }

    renderChecklist(app) {
        this.checklistItems.innerHTML = '';
        this.checklistSection.style.display = 'none';

        const user = authManager.getUser();
        const isInspector = user.role === 'inspector' || user.role === 'admin';
        const isLocked = ['accepted', 'rejected'].includes(app.status);

        // Безопасный парсинг
        let checklist = [];
        const raw = app.product_checklist || app.checklist;
        
        if (raw) {
            if (Array.isArray(raw)) {
                checklist = raw;
            } else if (typeof raw === 'string') {
                try {
                    checklist = JSON.parse(raw);
                } catch (e) {
                    checklist = [raw]; // Если это просто строка, а не JSON
                }
            }
        }

        if (!Array.isArray(checklist) || checklist.length === 0) return;

        this.checklistSection.style.display = 'block';
        
        const titleEl = this.checklistSection.querySelector('.subtitle');
        if (titleEl) {
            titleEl.textContent = isInspector ? '📋 Чек-лист контроля:' : '📋 Список необходимых проверок:';
        }

        const itemsHtml = checklist.map((item, idx) => {
            const text = (typeof item === 'object' && item !== null) 
                ? (item.task || item.text || JSON.stringify(item)) 
                : item;
            return ApplicationTemplates.checklistItem(text, idx, isInspector, isLocked);
        }).join('');

        this.checklistItems.innerHTML = itemsHtml;
    }

    renderActions(app) {
        this.actionsContainer.innerHTML = '';
        const user = authManager.getUser();
        const isInspector = user.role === 'inspector' || user.role === 'admin';
        
        const buttons = [];

        if (isInspector) {
            if (app.status === 'new') {
                buttons.push(this.createActionButton('🔍 Взять на проверку', 'button-primary', () => {
                    this.handleStatusChange('in_progress', user.id);
                }));
            }

            if (['assigned', 'in_progress'].includes(app.status)) {
                buttons.push(this.createActionButton('✅ Принять (Годен)', 'button-success', () => {
                    const checkboxes = this.checklistItems.querySelectorAll('input[type="checkbox"]');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    
                    if (checkboxes.length > 0 && !allChecked) {
                        alert('Для приёмки необходимо отметить все пункты чек-листа!');
                        return;
                    }
                    this.handleStatusChange('accepted');
                }));

                buttons.push(this.createActionButton('⚠️ Выявить несоответствие', 'button-danger', () => {
                    window.app.openCreateDiscrepancyModal(app.id, async () => {
                        await this.refreshDiscrepancies(app.id);
                    });
                }));
            }
        }
        
        if (user.role === 'master' && app.status === 'new') {
            buttons.push(this.createActionButton('🗑️ Отозвать заявку', 'button-secondary', () => {
                this.handleDelete(app.id);
            }));
        }

        buttons.forEach(btn => this.actionsContainer.appendChild(btn));
    }

    createActionButton(label, className, onClick) {
        const btn = document.createElement('button');
        btn.className = `button ${className}`;
        btn.textContent = label;
        btn.style.width = '100%';
        btn.style.marginBottom = '8px';
        btn.onclick = onClick;
        return btn;
    }

    async handleStatusChange(status, inspectorId = null) {
        try {
            if (inspectorId) {
                await api.updateApplication(this.currentApp.id, { 
                    inspector_id: inspectorId,
                    status: status 
                });
            } else {
                await api.updateApplicationStatus(this.currentApp.id, status);
            }
            
            this.hide();
            if (window.app && window.app.showPage) {
                window.app.showPage('dashboard');
            }
        } catch (e) {
            alert(`Ошибка обновления: ${e.message}`);
        }
    }

    async handleDelete(id) {
        if (!confirm('Вы уверены, что хотите отозвать эту заявку?')) return;
        try {
            await api.deleteApplication(id);
            this.hide();
            if (window.app && window.app.showPage) {
                window.app.showPage('dashboard');
            }
        } catch (e) {
            alert(`Ошибка при удалении: ${e.message}`);
        }
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

window.ApplicationDetailsModal = ApplicationDetailsModal;
