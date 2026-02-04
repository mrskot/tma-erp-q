// public/js/components/DiscrepancyModal.js

import { BaseModal } from './BaseModal.js';
import api from '../api.js';
import authManager from '../auth.js';

/**
 * Templates for Discrepancy Modal UI
 */
const DiscrepancyTemplates = {
    statusMap: {
        new: 'Новое',
        assigned: 'В работе',
        in_progress: 'Доработка',
        resolved: 'Устранено',
        closed: 'Закрыто',
        rejected: 'Отклонено'
    },

    statusBadge: (status) => {
        const text = DiscrepancyTemplates.statusMap[status] || status.toUpperCase();
        return `<span class="status-badge bg-status-${status}">${text}</span>`;
    },

    actionButton: (label, className, onClick, id = '') => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `button ${className}`;
        btn.innerHTML = label;
        if (id) btn.id = id;
        btn.style.width = '100%';
        btn.style.marginBottom = '8px';
        btn.onclick = onClick;
        return btn;
    },

    disputeOptions: (onAction, onCancel) => {
        const div = document.createElement('div');
        div.id = 'dispute-options-container';
        div.className = 'dispute-block';
        div.style.cssText = 'display:none; flex-direction:column; gap:8px; padding:12px; background:#fff5f5; border-radius:12px; border:1px solid #feb2b2; margin-bottom:10px;';
        
        div.innerHTML = `
            <div style="font-size:12px; font-weight:bold; color:#c53030; margin-bottom:4px;">⚖️ Выберите причину оспаривания:</div>
        `;

        const btnOther = DiscrepancyTemplates.actionButton('👥 Другой ответственный', 'button-danger', () => onAction('dispute_other'));
        btnOther.style.background = '#e53e3e';
        
        const btnKR = DiscrepancyTemplates.actionButton('📜 Требуется КР (Карточка разрешения)', 'button-primary', () => onAction('dispute_kr'));
        btnKR.style.background = '#805ad5';

        const btnCancel = DiscrepancyTemplates.actionButton('Отмена', 'button-link', onCancel);
        btnCancel.style.color = '#666';

        div.appendChild(btnOther);
        div.appendChild(btnKR);
        div.appendChild(btnCancel);
        return div;
    },

    closureFields: (scenario) => {
        const labels = {
            resolution_card: '🔢 Номер карточки разрешения (КР):',
            political: '📢 Детали политического решения:',
            scrap: '🗑️ Причина списания в БРАК:'
        };
        
        if (!labels[scenario]) return '';
        
        return `
            <div class="form-group animate-fade-in">
                <label style="font-weight:600; font-size:13px; color:var(--text-main);">${labels[scenario]}</label>
                <textarea name="details" class="form-control" rows="2" placeholder="Введите информацию..." required></textarea>
            </div>
        `;
    }
};

export class DiscrepancyModal extends BaseModal {
    constructor() {
        super('discrepancy-modal', 'discrepancy-form');

        this.statusSelect = document.getElementById('disc-status');
        this.scenarioGroup = document.getElementById('closure-scenario-group');
        this.scenarioSelect = document.getElementById('disc-scenario');
        this.detailsContainer = document.getElementById('scenario-details-group');
        this.responsibleSelect = document.getElementById('disc-responsible');
        this.actionsDiv = document.getElementById('discrepancy-actions');
        this.masterFields = document.getElementById('master-action-fields');
        
        this.currentData = null;
        this.usersCache = [];

        this.attachInternalListeners();
    }

    attachInternalListeners() {
        // Сценарии
        this.statusSelect.onchange = () => this.handleStatusUI();
        this.scenarioSelect.onchange = () => this.handleScenarioUI();
    }

    handleStatusUI() {
        const isClosed = this.statusSelect.value === 'closed';
        this.scenarioGroup.style.display = isClosed ? 'block' : 'none';
        if (!isClosed) {
            this.scenarioSelect.value = '';
            this.handleScenarioUI();
        }
    }

    handleScenarioUI() {
        const scenario = this.scenarioSelect.value;
        this.detailsContainer.innerHTML = DiscrepancyTemplates.closureFields(scenario);
    }

    async show({ mode = 'create', discrepancyData = null, applicationId = null, onSave = null, users = [] }) {
        super.show({ onSave });
        this.editMode = mode === 'edit';
        this.currentData = discrepancyData;
        
        this.actionsDiv.innerHTML = '';
        this.detailsContainer.innerHTML = '';
        
        this.populateSelect(this.responsibleSelect, users, { 
            textField: 'first_name', 
            placeholder: '-- Выберите исполнителя --' 
        });

        if (this.editMode && discrepancyData) {
            this._setupEditMode(discrepancyData);
        } else {
            this._setupCreateMode(applicationId);
        }
    }

    _setupCreateMode(appId) {
        this.title.textContent = '🆕 Новый дефект';
        this.form.elements.id.value = '';
        this.form.elements.application_id.value = appId || '';
        this.statusSelect.closest('.form-grid').style.display = 'none';
        this.masterFields.style.display = 'none';
        
        // Срок по умолчанию +2 дня
        const d = new Date();
        d.setDate(d.getDate() + 2);
        this.form.elements.due_date.value = d.toISOString().slice(0, 16);

        // Авто-мастер
        if (appId) {
            api.getApplicationById(appId).then(res => {
                if (res.success && res.data.master_id) {
                    this.responsibleSelect.value = res.data.master_id;
                }
            });
        }

        this.form.querySelector('button[type="submit"]').style.display = 'block';
        this._toggleInputs(false);
    }

    _setupEditMode(data) {
        this.title.textContent = `⚠️ Дефект ${data.discrepancy_number}`;
        const user = authManager.getUser();
        const isInspector = user.role === 'inspector' || user.role === 'admin' || user.role === 'director';

        // Заполнение полей
        this.form.elements.id.value = data.id;
        this.form.elements.title.value = data.title || '';
        this.form.elements.description.value = data.description || '';
        this.form.elements.severity.value = data.severity || 'medium';
        this.responsibleSelect.value = data.responsible_id || '';
        this.statusSelect.value = data.status || 'new';
        this.form.elements.fix_photo_url.value = data.fix_photo_url || '';
        this.form.elements.special_opinion.value = data.special_opinion || '';

        if (data.due_date) {
            this.form.elements.due_date.value = new Date(data.due_date).toISOString().slice(0, 16);
        }

        // Настройка видимости
        this.statusSelect.closest('.form-grid').style.display = isInspector ? 'grid' : 'none';
        this.masterFields.style.display = 'block';
        this.form.querySelector('button[type="submit"]').style.display = isInspector ? 'block' : 'none';

        if (user.role === 'master' && !isInspector) {
            this._toggleInputs(true, ['fix_photo_url', 'special_opinion']);
            this.renderMasterButtons(data);
        } else if (isInspector) {
            this._toggleInputs(false);
            this.renderInspectorButtons(data);
        }

        this.handleStatusUI();
    }

    renderMasterButtons(data) {
        const isLite = data.inspection_mode === 'lite';
        
        if (data.status !== 'resolved' && data.status !== 'closed') {
            const btnLabel = isLite ? '✅ Исправлено (Закрыть)' : '🛠️ Устранено (На проверку)';
            const btnResolved = DiscrepancyTemplates.actionButton(btnLabel, 'button-success', () => this.handleMasterAction('resolved'));
            this.actionsDiv.appendChild(btnResolved);
        }

        const btnDispute = DiscrepancyTemplates.actionButton('⚖️ Оспорить решение', 'button-danger', () => this.showDisputeUI(), 'main-dispute-btn');
        this.actionsDiv.appendChild(btnDispute);

        const disputeBlock = DiscrepancyTemplates.disputeOptions(
            (type) => this.handleMasterAction(type),
            () => this.hideDisputeUI()
        );
        this.actionsDiv.appendChild(disputeBlock);
    }

    renderInspectorButtons(data) {
        if (data.status === 'closed') return;

        const container = document.createElement('div');
        container.style.marginTop = '15px';
        container.style.borderTop = '2px solid var(--border)';
        container.style.paddingTop = '15px';

        const btnClose = DiscrepancyTemplates.actionButton('✅ Принять и Закрыть', 'button-success', () => this.handleInspectorResolution('closed'));
        const btnReturn = DiscrepancyTemplates.actionButton('🔄 Вернуть на доработку', 'button-danger', () => this.handleInspectorResolution('in_progress'));

        container.appendChild(btnClose);
        if (data.status === 'resolved' || data.is_disputed) {
            container.appendChild(btnReturn);
        }
        this.actionsDiv.appendChild(container);
    }

    async handleMasterAction(action) {
        const id = this.form.elements.id.value;
        const fixPhoto = this.form.elements.fix_photo_url.value.trim();
        const opinion = this.form.elements.special_opinion.value.trim();
        const isLite = this.currentData.inspection_mode === 'lite';

        // Валидация HARD режима
        if (action === 'resolved' && !isLite && !fixPhoto) {
            alert('❌ В строгом режиме контроля (HARD) необходимо приложить фото устранения!');
            this.form.elements.fix_photo_url.focus();
            return;
        }

        // Валидация Оспаривания
        if (action.startsWith('dispute') && !opinion) {
            alert('❌ Пожалуйста, укажите причину оспаривания в поле "Особое мнение"');
            this.form.elements.special_opinion.focus();
            return;
        }

        const payload = {
            id: parseInt(id),
            status: action === 'resolved' ? (isLite ? 'closed' : 'resolved') : 'in_progress',
            fix_photo_url: fixPhoto || null,
            special_opinion: action.startsWith('dispute') ? `[${action.toUpperCase()}] ${opinion}` : opinion,
            is_disputed: action.startsWith('dispute')
        };

        try {
            const response = await api.updateDiscrepancyStatus(id, payload);
            if (response.success) {
                this.hide();
                if (this.onSave) await this.onSave(response.data);
            }
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    }

    async handleInspectorResolution(newStatus) {
        const id = this.form.elements.id.value;
        const scenario = this.scenarioSelect.value;
        const descriptionField = this.detailsContainer.querySelector('textarea');
        const description = descriptionField ? descriptionField.value.trim() : '';

        if (newStatus === 'closed' && !scenario) {
            alert('❌ Пожалуйста, выберите сценарий закрытия!');
            this.statusSelect.value = 'closed';
            this.handleStatusUI();
            return;
        }

        if (newStatus === 'closed' && ['resolution_card', 'political', 'scrap'].includes(scenario) && !description) {
            alert('❌ Пожалуйста, заполните детали сценария (номер КР или причину)!');
            if (descriptionField) descriptionField.focus();
            return;
        }

        const payload = {
            id: parseInt(id),
            status: newStatus,
            closure_scenario: scenario || null,
            description: description || null,
            is_disputed: newStatus === 'in_progress' ? false : undefined 
        };

        try {
            const response = await api.updateDiscrepancyStatus(id, payload);
            if (response.success) {
                this.hide();
                if (this.onSave) await this.onSave(response.data);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    _toggleInputs(disabled, except = []) {
        const inputs = this.form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (except.includes(input.name)) {
                input.disabled = false;
            } else {
                input.disabled = disabled;
            }
        });
    }

    showDisputeUI() {
        const btn = document.getElementById('main-dispute-btn');
        const options = document.getElementById('dispute-options-container');
        if (btn) btn.style.display = 'none';
        if (options) {
            options.style.display = 'flex';
            options.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    hideDisputeUI() {
        const btn = document.getElementById('main-dispute-btn');
        const options = document.getElementById('dispute-options-container');
        if (btn) btn.style.display = 'block';
        if (options) options.style.display = 'none';
    }

    async handleSubmit(e) {
        if (e) e.preventDefault();
        
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        const payload = {
            title: data.title.trim(),
            description: data.description.trim(),
            severity: data.severity,
            responsible_id: data.responsible_id ? parseInt(data.responsible_id) : null,
            due_date: new Date(data.due_date).toISOString(),
            application_id: data.application_id ? parseInt(data.application_id) : null,
            status: data.status || 'new',
            detected_at: new Date().toISOString()
        };

        if (this.editMode && data.id) {
            payload.id = parseInt(data.id);
        }

        try {
            if (this.onSave) {
                await this.onSave(payload);
                this.hide();
            }
        } catch (error) {
            alert(`Ошибка сохранения: ${error.message}`);
        }
    }

    hide() {
        this.modal.style.display = 'none';
        this.form.reset();
        this.actionsDiv.innerHTML = '';
    }
}

// Глобальный экспорт для обратной совместимости
window.DiscrepancyModal = DiscrepancyModal;