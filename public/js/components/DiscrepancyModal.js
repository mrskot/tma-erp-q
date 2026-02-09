// public/js/components/DiscrepancyModal.js

import { BaseModal } from './BaseModal.js';
import api from '../api.js';
import authManager from '../auth.js';

/**
 * Templates for Discrepancy Modal UI
 */
const TPL = {
    statusMap: { new: 'Новое', assigned: 'В работе', in_progress: 'Доработка', resolved: 'Устранено', closed: 'Закрыто', rejected: 'Отклонено' },
    statusBadge: (status) => `<span class="status-badge bg-status-${status}">${TPL.statusMap[status] || status.toUpperCase()}</span>`,
    actionButton: (label, className, id = '') => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `button ${className}`;
        btn.innerHTML = label;
        if (id) btn.id = id;
        btn.style.width = '100%';
        btn.style.marginBottom = '8px';
        return btn;
    },
    closureFields: (scenario) => {
        const labels = {
            resolution_card: '🔢 Номер карточки разрешения (КР):',
            political: '📢 Детали политического решения:',
            scrap: '🗑️ Причина списания в БРАК:'
        };
        if (!labels[scenario]) return '';
        return `<div class="form-group animate-fade-in"><label>${labels[scenario]}</label><textarea name="details" rows="2" required></textarea></div>`;
    }
};

export class DiscrepancyModal extends BaseModal {
    constructor() {
        super('discrepancy-modal', 'discrepancy-form');
        this.title = this.modalElement.querySelector('.modal-title');
        this.actionsDiv = document.getElementById('discrepancy-actions');
        this.masterFields = document.getElementById('master-action-fields');
        this.statusSelect = this.form.elements.status;
        this.scenarioGroup = document.getElementById('closure-scenario-group');
        this.scenarioSelect = this.form.elements.closure_scenario;
        this.detailsContainer = document.getElementById('scenario-details-group');
        this.currentData = null;
        this.attachInternalListeners();
    }

    attachInternalListeners() {
        this.statusSelect.onchange = () => this.handleStatusUI();
        this.scenarioSelect.onchange = () => this.handleScenarioUI();
    }
    
    handleStatusUI() {
        const isClosed = this.statusSelect.value === 'closed';
        this.scenarioGroup.style.display = isClosed ? 'block' : 'none';
        if (!isClosed) { this.scenarioSelect.value = 'fixed'; this.handleScenarioUI(); }
    }

    handleScenarioUI() {
        this.detailsContainer.innerHTML = TPL.closureFields(this.scenarioSelect.value);
    }

    async show({ mode = 'create', discrepancyData = null, applicationId = null, onSave, users = [] }) {
        super.show({ onSave });
        this.currentData = discrepancyData;
        this.actionsDiv.innerHTML = '';
        this.detailsContainer.innerHTML = '';
        this.populateSelect(this.form.elements.responsible_id, users, { textField: 'first_name', placeholder: 'Выберите ответственного' });
        
        mode === 'edit' ? this._setupEditMode(discrepancyData) : this._setupCreateMode(applicationId, discrepancyData?.application_number);
    }
    
    _setupCreateMode(appId, appNumber) {
        this.title.textContent = '🆕 Новый дефект';
        this.form.elements.application_id.value = appId || '';
        document.getElementById('disc-app-number-val').textContent = appNumber || 'Автономно';
        this.form.elements.status.closest('.form-group').style.display = 'none';
        this.masterFields.style.display = 'none';
        const d = new Date(); d.setDate(d.getDate() + 2);
        this.form.elements.due_date.value = d.toISOString().slice(0, 16);
        this.form.querySelector('button[type="submit"]').style.display = 'block';
        this._toggleInputs(false);
    }

    _setupEditMode(data) {
        this.title.textContent = `⚠️ Дефект ${data.discrepancy_number}`;
        const user = authManager.getUser();
        
        Object.keys(data).forEach(key => {
            if (this.form.elements[key]) {
                 if (key === 'due_date' && data[key]) {
                    this.form.elements[key].value = new Date(data[key]).toISOString().slice(0, 16);
                 } else {
                    this.form.elements[key].value = data[key] || '';
                 }
            }
        });
        document.getElementById('disc-app-number-val').textContent = data.application_number || 'Автономно';

        const isInspector = ['admin', 'director', 'inspector'].includes(user.role);
        this.form.elements.status.closest('.form-group').style.display = isInspector ? 'block' : 'none';
        this.masterFields.style.display = 'block';
        this.form.querySelector('button[type="submit"]').style.display = 'none'; // All actions via buttons

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
        if (data.status !== 'resolved' && data.status !== 'closed') {
            const btnLabel = data.inspection_mode === 'lite' ? '✅ Исправлено (Закрыть)' : '🛠️ Устранено (На проверку)';
            const btn = TPL.actionButton(btnLabel, 'button-success');
            btn.onclick = () => this.handleMasterAction('resolved');
            this.actionsDiv.appendChild(btn);
        }
        if (data.status !== 'closed') {
            const btn = TPL.actionButton('⚖️ Оспорить решение', 'button-danger');
            btn.onclick = () => this.handleMasterAction('dispute');
            this.actionsDiv.appendChild(btn);
        }
    }
    
    renderInspectorButtons(data) {
        if (data.status === 'closed') return;
        if (data.status === 'resolved' || data.is_disputed) {
            const btnClose = TPL.actionButton('✅ Принять и Закрыть', 'button-success');
            btnClose.onclick = () => this.handleInspectorResolution('closed');
            const btnReturn = TPL.actionButton('🔄 Вернуть на доработку', 'button-danger');
            btnReturn.onclick = () => this.handleInspectorResolution('in_progress');
            this.actionsDiv.appendChild(btnClose);
            this.actionsDiv.appendChild(btnReturn);
        }
    }

    async handleMasterAction(action) {
        const id = this.currentData.id;
        const fixPhoto = this.form.elements.fix_photo_url.value.trim();
        const opinion = this.form.elements.special_opinion.value.trim();

        if (action === 'resolved' && this.currentData.inspection_mode === 'hard' && !fixPhoto) {
            return alert('В строгом режиме контроля (HARD) необходимо приложить фото устранения!');
        }
        if (action === 'dispute' && !opinion) {
            return alert('Пожалуйста, укажите причину оспаривания в поле "Особое мнение"');
        }

        const payload = {
            status: 'resolved',
            fix_photo_url: fixPhoto || null,
            special_opinion: opinion || null,
            is_disputed: action === 'dispute'
        };

        try {
            await api.updateDiscrepancyStatus(id, payload);
            this.hide();
            if (this.onSave) this.onSave();
        } catch (error) { alert(`Ошибка: ${error.message}`); }
    }
    
    async handleInspectorResolution(newStatus) {
        const id = this.currentData.id;
        const scenario = this.scenarioSelect.value;
        const details = this.detailsContainer.querySelector('textarea')?.value.trim() || '';

        if (newStatus === 'closed') {
            if (!scenario) return alert('Пожалуйста, выберите сценарий закрытия!');
            if (['resolution_card', 'scrap', 'political'].includes(scenario) && !details) {
                return alert('Пожалуйста, заполните детали для выбранного сценария!');
            }
        }
        
        const payload = {
            status: newStatus,
            closure_scenario: newStatus === 'closed' ? scenario : null,
            resolution_card_details: scenario === 'resolution_card' ? details : null,
            scrap_reason: scenario === 'scrap' ? details : null,
            political_decision_details: scenario === 'political' ? details : null,
            is_disputed: false // Inspector's action removes dispute flag
        };
        
        try {
            await api.updateDiscrepancyStatus(id, payload);
            this.hide();
            if (this.onSave) this.onSave();
        } catch (error) { alert(`Ошибка: ${error.message}`); }
    }

    _toggleInputs(disabled, except = []) {
        this.form.querySelectorAll('input, select, textarea').forEach(input => {
            input.disabled = except.includes(input.name) ? false : disabled;
        });
    }

    async handleSubmit(e) {
        e.preventDefault(); // Called by BaseModal
        if (this.onSave) {
            const data = this._collectData();
            data.id = this.currentData?.id; // Ensure ID is passed for updates
            await this.onSave(data);
        }
    }
}