import api from '../api.js';
import authManager from '../auth.js';
import { UI } from './UIComponents.js';

const TPL = {
    statusMap: { new: 'Новая', assigned: 'Назначена', in_progress: 'В работе', accepted: 'Принято', rejected: 'Отклонено' },
    statusBadge: (status) => `<span class="status-badge bg-status-${status}">${TPL.statusMap[status] || status}</span>`,
    detailRow: (label, value) => `<div class="detail-row"><span class="detail-label">${label}:</span><span class="detail-value">${value || '—'}</span></div>`,
    mainDetails: (app) => `
        <div class="details-grid">
            ${TPL.detailRow('Номер', app.application_number)}
            ${TPL.detailRow('Заказ', app.production_order_number)}
            ${TPL.detailRow('Изделие', app.product_name)}
            ${TPL.detailRow('Мастер', app.master_name)}
            ${app.inspector_name ? TPL.detailRow('Контролёр', app.inspector_name) : ''}
            <div class="detail-row status-row"><span class="detail-label">Статус:</span>${TPL.statusBadge(app.status)}</div>
        </div>`,
    checklistItem: (itemText, index, isInspector, isLocked) => `<div class="checklist-item"><input type="checkbox" id="check-${index}" ${isInspector && !isLocked ? '' : 'disabled'} ${isLocked ? 'checked' : ''}><label for="check-${index}">${itemText}</label></div>`
};

export class ApplicationDetailsModal {
    constructor() {
        this.modal = document.getElementById('application-details-modal');
        if (!this.modal) return;
        this.closeButton = this.modal.querySelector('.close');
        this.actionsContainer = this.modal.querySelector('#view-app-actions');
        this.detailsSection = this.modal.querySelector('.details-section');
        this.mkiImg = this.modal.querySelector('#view-app-mki-img');
        this.discList = this.modal.querySelector('#view-app-discrepancies-list');
        this.checklistItems = this.modal.querySelector('#view-app-checklist-items');
        this.checklistSection = this.modal.querySelector('#view-app-checklist-section');
        this.currentApp = null;
        this.onCloseCallback = null;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.closeButton.onclick = () => this.hide();
        window.addEventListener('click', (event) => { if (event.target === this.modal) this.hide(); });
    }

    async show(applicationId, onClose) {
        this.onCloseCallback = onClose;
        this.modal.style.display = 'block';
        this.detailsSection.innerHTML = '<p>Загрузка деталей...</p>';
        
        try {
            const app = await api.getApplicationById(applicationId);
            if (!app) throw new Error("Заявка не найдена после запроса к API.");
            
            this.currentApp = app;
            this.detailsSection.innerHTML = TPL.mainDetails(app);
            this.renderChecklist(app);

            const mkiSection = this.mkiImg.parentElement;
            if (app.mki_photo_url) {
                this.mkiImg.src = app.mki_photo_url;
                mkiSection.style.display = 'block';
            } else {
                mkiSection.style.display = 'none';
            }
            
            await this.refreshDiscrepancies(applicationId);
            this.renderActions(app);
            
        } catch (e) {
            console.error('Application modal show() error:', e.stack || e);
            this.detailsSection.innerHTML = `<p class="error-message">Ошибка при загрузке заявки: ${e.message}</p>`;
        }
    }

    async refreshDiscrepancies(applicationId) {
        this.discList.innerHTML = '<p>Загрузка несоответствий...</p>';
        try {
            const response = await api.getDiscrepancies({ application_id: applicationId });
            const discrepancies = response.discrepancies || [];
            
            this.discList.innerHTML = '';
            if (discrepancies.length > 0) {
                discrepancies.forEach(disc => {
                    const card = UI.createDiscrepancyCard(disc, (d) => {
                        window.app.openEditDiscrepancyModal(d.id, () => this.refreshDiscrepancies(applicationId));
                    });
                    this.discList.appendChild(card);
                });
            } else {
                this.discList.innerHTML = '<p class="subtitle">Несоответствий не обнаружено.</p>';
            }
        } catch (e) {
            this.discList.innerHTML = `<p class="error-message">Ошибка загрузки дефектов: ${e.message}</p>`;
        }
    }

    renderChecklist(app) {
        const user = authManager.getUser();
        if (!user) return; 

        this.checklistItems.innerHTML = '';
        const isInspector = user.role === 'inspector' || user.role === 'admin';
        const isLocked = ['accepted', 'rejected'].includes(app.status);

        let checklist = [];
        try {
            const rawChecklist = app.product_checklist || '[]';
            checklist = (typeof rawChecklist === 'string') ? JSON.parse(rawChecklist) : rawChecklist;
        } catch (e) { console.error("Checklist parse error:", e); }
        
        if (!Array.isArray(checklist) || checklist.length === 0) {
            this.checklistSection.style.display = 'none';
            return;
        }

        this.checklistSection.style.display = 'block';
        const itemsHtml = checklist.map((item, idx) => TPL.checklistItem(item.task || item, idx, isInspector, isLocked)).join('');
        this.checklistItems.innerHTML = itemsHtml;
    }

    renderActions(app) {
        const user = authManager.getUser();
        if (!user) {
            this.actionsContainer.innerHTML = '';
            return;
        }

        this.actionsContainer.innerHTML = '';
        const isInspector = user.role === 'inspector' || user.role === 'admin';
        const isMaster = user.role === 'master' || user.role === 'admin';
        
        const buttons = [];

        if (isInspector && app.status === 'new') {
            buttons.push(this.createActionButton('🔍 Взять на проверку', 'button-primary', () => this.handleStatusChange('in_progress')));
        }

        if (isInspector && ['assigned', 'in_progress'].includes(app.status)) {
            buttons.push(this.createActionButton('✅ Принять (Годен)', 'button-success', () => this.handleAccept()));
            buttons.push(this.createActionButton('⚠️ Выявить несоответствие', 'button-danger', () => this.handleCreateDiscrepancy()));
        }
        
        if (isMaster && app.master_id === user.id && app.status === 'new') {
            buttons.push(this.createActionButton('🗑️ Отозвать заявку', 'button-secondary', () => this.handleDelete()));
        }

        buttons.forEach(btn => this.actionsContainer.appendChild(btn));
    }

    createActionButton(label, className, onClick) {
        const btn = document.createElement('button');
        btn.className = `button ${className}`;
        btn.textContent = label;
        btn.onclick = onClick;
        return btn;
    }

    handleAccept() {
        const allChecked = Array.from(this.checklistItems.querySelectorAll('input[type="checkbox"]:not(:disabled)'))
                                .every(cb => cb.checked);
        if (!allChecked && this.checklistItems.children.length > 0) {
            return alert('Для приёмки необходимо отметить все пункты чек-листа!');
        }
        this.handleStatusChange('accepted');
    }

    handleCreateDiscrepancy() {
        this.hide(false);
        window.app.openCreateDiscrepancyModal(this.currentApp.id, this.onCloseCallback);
    }

    async handleStatusChange(status) {
        try {
            await api.updateApplicationStatus(this.currentApp.id, status);
            this.hide();
        } catch (e) {
            alert(`Ошибка обновления статуса: ${e.message}`);
        }
    }

    async handleDelete() {
        if (!confirm('Вы уверены, что хотите отозвать эту заявку?')) return;
        try {
            await api.deleteApplication(this.currentApp.id);
            this.hide();
        } catch (e) {
            alert(`Ошибка при удалении: ${e.message}`);
        }
    }

    hide(triggerCallback = true) {
        this.modal.style.display = 'none';
        if (triggerCallback && this.onCloseCallback) {
            this.onCloseCallback();
        }
    }
}