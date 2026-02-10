import api from '../api.js';
import store from '../store.js';
import authManager from '../auth.js';
import { BaseModal } from './BaseModal.js';

export class DiscrepancyModal extends BaseModal {
    constructor() {
        super('discrepancy-modal', 'discrepancy-form');
        this.actionsContainer = document.getElementById('discrepancy-actions');
        this.currentDiscrepancy = null;
        this.masterActionFields = document.getElementById('master-action-fields');
        this.closureScenarioGroup = document.getElementById('closure-scenario-group');
        this.scenarioDetailsGroup = document.getElementById('scenario-details-group');
        
        const statusSelect = this.form.elements.status;
        if (statusSelect) {
            statusSelect.addEventListener('change', () => this.toggleClosureScenario());
        }
    }

    show({ mode, discrepancyData = null, applicationData = null, users = [], onSave }) {
        super.show({ onSave });
        this.currentMode = mode;
        this.currentDiscrepancy = discrepancyData;
        this.currentUser = authManager.getUser();
        const title = this.modalElement.querySelector('.modal-title');

        this.populateSelect(this.form.elements.responsible_id, users, { 
            textField: user => `${user.first_name} ${user.last_name || ''}`.trim(),
            placeholder: 'Выберите ответственного' 
        });

        // Скрываем все специфичные блоки по умолчанию
        this.masterActionFields.style.display = 'none';
        this.closureScenarioGroup.style.display = 'none';
        this.scenarioDetailsGroup.style.display = 'none';

        // --- НОВЫЙ КОД ---
        const statusGroup = this.form.elements.status.closest('.form-group');
        const dueDateGroup = this.form.elements.due_date.closest('.form-group');

        if (mode === 'edit' && discrepancyData) {
            title.textContent = `Редактировать дефект #${discrepancyData.discrepancy_number}`;
            this.fillForm(discrepancyData);
            this.form.elements.application_id.value = discrepancyData.application_id;
            
            if (statusGroup) statusGroup.style.display = 'block';
            if (dueDateGroup) dueDateGroup.style.display = 'block';
        } else {
            title.textContent = 'Создать несоответствие';
            // Скрываем ненужные поля при создании
            if (statusGroup) statusGroup.style.display = 'none';
            if (dueDateGroup) dueDateGroup.style.display = 'none';

            if (applicationData) {
                this.form.elements.application_id.value = applicationData.id;
                // Автоматически выбираем мастера заявки как ответственного
                this.form.elements.responsible_id.value = applicationData.master_id;
                // Отображаем информацию о заявке
                const appInfo = this.modalElement.querySelector('#disc-app-info');
                appInfo.querySelector('#disc-app-number-val').textContent = applicationData.application_number;
                appInfo.style.display = 'block';
            }
        }

        const isInspector = this.currentUser.role === 'inspector' || this.currentUser.role === 'admin';
        const isMaster = this.currentUser.role === 'master' || this.currentUser.role === 'admin';

        this.form.elements.title.disabled = !isInspector && mode === 'edit';
        this.form.elements.description.disabled = !isInspector && mode === 'edit';
        this.form.elements.severity.disabled = !isInspector && mode === 'edit';
        
        // Переопределяем отображение статуса на основе прав и режима
        if (statusGroup) {
            statusGroup.style.display = (isInspector && mode === 'edit') ? 'block' : 'none';
        }

        this.renderActions(isMaster, isInspector, discrepancyData ? discrepancyData.status : 'new');
    }

    fillForm(data) {
        Object.keys(data).forEach(key => {
            if (this.form.elements[key]) {
                this.form.elements[key].value = data[key] || '';
            }
        });
        this.toggleClosureScenario();
    }
    
    renderActions(isMaster, isInspector, status) {
        this.actionsContainer.innerHTML = '';
        this.form.querySelector('button[type="submit"]').style.display = 'block';

        if (isMaster && ['assigned', 'in_progress', 'new'].includes(status)) {
            const btnResolved = this.createActionButton('🛠️ Устранено', 'button-success', () => this.handleMasterAction('resolved'));
            const btnDispute = this.createActionButton('⚖️ Оспорить', 'button-secondary', () => this.handleMasterAction('disputed'));
            this.actionsContainer.append(btnResolved, btnDispute);
            document.getElementById('master-action-fields').style.display = 'block';
            this.form.querySelector('button[type="submit"]').style.display = 'none';
        } else {
            document.getElementById('master-action-fields').style.display = 'none';
        }
        
        if (isInspector && status === 'resolved') {
            const btnClose = this.createActionButton('✅ Закрыть (дефект устранен)', 'button-success', () => this.handleInspectorAction('closed'));
            const btnReopen = this.createActionButton('❌ Вернуть в работу', 'button-danger', () => this.handleInspectorAction('reopen'));
            this.actionsContainer.append(btnClose, btnReopen);
            this.form.querySelector('button[type="submit"]').style.display = 'none';
        }
    }
    
    createActionButton(text, className, onClick) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = text;
        button.className = `button ${className}`;
        button.style.width = '100%';
        button.style.marginBottom = '10px';
        button.onclick = onClick;
        return button;
    }

    async handleMasterAction(action) {
        const payload = {
            fix_photo_url: this.form.elements.fix_photo_url.value,
            special_opinion: this.form.elements.special_opinion.value,
        };

        if (action === 'resolved') {
            payload.status = 'resolved';
            if (!this.currentDiscrepancy.is_disputed) payload.is_disputed = false;
        } else if (action === 'disputed') {
            if (!payload.special_opinion) {
                alert('Пожалуйста, укажите причину в поле "Особое мнение".');
                return;
            }
            payload.is_disputed = true;
        }

        try {
            await api.updateDiscrepancyStatus(this.currentDiscrepancy.id, payload);
            this.hide();
            if (this.onSave) await this.onSave();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    }

    async handleInspectorAction(action) {
        const payload = {};
        if (action === 'closed') {
            payload.status = 'closed';
            payload.closure_scenario = 'fixed';
        } else if (action === 'reopen') {
            payload.status = 'in_progress';
        }

        try {
            await api.updateDiscrepancyStatus(this.currentDiscrepancy.id, payload);
            this.hide();
            if (this.onSave) await this.onSave();
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        }
    }
    
    _collectData() {
        const data = super._collectData();

        // Очищаем пустые ID, чтобы бэкенд не ругался
        if (data.application_id === '') data.application_id = null;
        if (data.responsible_id === '') data.responsible_id = null;

        // --- НОВОЕ ИСПРАВЛЕНИЕ ---
        // Если ID пустой (при создании), его нужно полностью удалить из объекта
        if (data.id === '' || data.id === null || data.id === undefined) {
            delete data.id;
        }

        // При создании несоответствия мы не должны отправлять данные о сценариях закрытия
        if (this.currentMode === 'create') {
            delete data.closure_scenario;
            delete data.resolution_card_details;
        }

        return data;
    }
}