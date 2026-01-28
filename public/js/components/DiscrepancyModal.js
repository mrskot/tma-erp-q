// public/js/components/DiscrepancyModal.js

class DiscrepancyModal {
    constructor() {
        this.modal = document.getElementById('discrepancy-modal');
        if (!this.modal) {
            console.error('DiscrepancyModal HTML not found');
            return;
        }
        this.form = document.getElementById('discrepancy-form');
        this.title = this.modal.querySelector('.modal-title');
        this.closeButton = this.modal.querySelector('.close');
        this.photoInput = document.getElementById('disc-photo');
        this.statusSelect = document.getElementById('disc-status');
        this.scenarioGroup = document.getElementById('closure-scenario-group');
        this.scenarioSelect = document.getElementById('disc-scenario');
        this.detailsGroup = document.getElementById('scenario-details-group');
        
        // --- Элементы формы ---
        this.responsibleSelect = document.getElementById('disc-responsible');
        
        this.onSave = null;
        this.editMode = false;
        this.usersCache = [];

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.closeButton.addEventListener('click', () => this.hide());
        this.statusSelect.addEventListener('change', () => this.handleStatusChange());
        this.scenarioSelect.addEventListener('change', () => this.handleScenarioChange());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    async fetchDataIfNeeded() {
        try {
            // Загружаем всех пользователей, чтобы были и мастера, и рабочие
            const response = await window.TMA_API.getUsers('active');
            this.usersCache = response.data || (Array.isArray(response) ? response : []);
            return true;
        } catch (error) {
            console.error('Failed to fetch users for discrepancy modal:', error);
            return false;
        }
    }

    populateResponsibleSelect() {
        this.responsibleSelect.innerHTML = '<option value="" disabled selected>-- Выберите исполнителя --</option>';
        // Фильтруем мастеров и рабочих
        const staff = this.usersCache.filter(u => ['master', 'worker', 'inspector'].includes(u.role));
        staff.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.first_name} ${user.last_name} (${this.getRoleName(user.role)})`;
            this.responsibleSelect.appendChild(option);
        });
    }

    getRoleName(role) {
        const roles = { master: 'Мастер', worker: 'Рабочий', inspector: 'Контролер' };
        return roles[role] || role;
    }

    handleStatusChange() {
        const isClosed = this.statusSelect.value === 'closed';
        this.scenarioGroup.style.display = isClosed ? 'block' : 'none';
        if (!isClosed) {
            this.scenarioSelect.value = '';
            this.handleScenarioChange();
        }
    }

    handleScenarioChange() {
        const scenario = this.scenarioSelect.value;
        const needsDetails = ['resolution_card', 'political', 'scrap'].includes(scenario);
        this.detailsGroup.style.display = needsDetails ? 'block' : 'none';
        
        const label = this.detailsGroup.querySelector('label');
        if (scenario === 'resolution_card') label.textContent = 'Номер карточки разрешения (КР):';
        if (scenario === 'political') label.textContent = 'Детали политического решения:';
        if (scenario === 'scrap') label.textContent = 'Причина списания в БРАК:';
    }

    async show({ mode = 'create', discrepancyData = null, applicationId = null, onSave = null }) {
        this.onSave = onSave;
        this.editMode = mode === 'edit';
        this.form.reset();

        await this.fetchDataIfNeeded();
        this.populateResponsibleSelect();

        const user = window.AuthManager.getUser();
        const masterFields = document.getElementById('master-action-fields');
        const submitButton = this.form.querySelector('button[type="submit"]');
        const actionsDiv = document.getElementById('discrepancy-actions');
        const appInfoDiv = document.getElementById('disc-app-info');
        const appNumberSpan = document.getElementById('disc-app-number-val');
        
        // Поля ввода (для блокировки)
        const inputs = this.form.querySelectorAll('input:not([type="hidden"]), select, textarea');

        // Сброс видимости доп. секций
        document.getElementById('special-opinion-group').style.display = 'block';
        if (appInfoDiv) appInfoDiv.style.display = 'none';

        if (this.editMode && discrepancyData) {
            this.title.textContent = `Несоответствие ${discrepancyData.discrepancy_number}`;
            this.title.style.fontSize = user.role === 'master' ? '16px' : '18px'; // Уменьшаем для мастера

            // Показываем инфо о заявке
            if (appInfoDiv && appNumberSpan) {
                appInfoDiv.style.display = 'block';
                appNumberSpan.textContent = discrepancyData.application_number || discrepancyData.application_id || '---';
            }

            this.form.elements.id.value = discrepancyData.id;
            this.form.elements.title.value = discrepancyData.title || '';
            this.form.elements.description.value = discrepancyData.description || '';
            this.form.elements.severity.value = discrepancyData.severity || 'medium';
            this.form.elements.responsible_id.value = discrepancyData.responsible_id || '';
            this.form.elements.status.value = discrepancyData.status || 'new';
            this.form.elements.closure_scenario.value = discrepancyData.closure_scenario || '';
            
            // Если мастер или админ - показываем его поля и кнопки
            if (user.role === 'master' || user.role === 'admin') {
                masterFields.style.display = 'block';
                this.form.elements.fix_photo_url.value = discrepancyData.fix_photo_url || '';
                this.form.elements.special_opinion.value = discrepancyData.special_opinion || '';
                
                // МАСТЕР НЕ МОЖЕТ МЕНЯТЬ ПОЛЯ КОНТРОЛЕРА, но может Срок
                if (user.role === 'master' && !window.AuthManager.isAdmin()) {
                    inputs.forEach(input => {
                        if (!['fix_photo_url', 'special_opinion', 'due_date'].includes(input.name)) {
                            input.disabled = true;
                        } else {
                            input.disabled = false;
                        }
                    });
                    submitButton.style.display = 'none'; 
                    // Скрываем поле ответственного для мастера, как просили
                    const respGroup = this.responsibleSelect.closest('.form-group');
                    if (respGroup) respGroup.style.display = 'none';
                } else {
                    inputs.forEach(input => input.disabled = false);
                    submitButton.style.display = 'block';
                    const respGroup = this.responsibleSelect.closest('.form-group');
                    if (respGroup) respGroup.style.display = 'block';
                }

                if (actionsDiv) {
                    actionsDiv.innerHTML = '';
                    console.log('Rendering master actions for status:', discrepancyData.status);
                    
                    // Кнопки для Мастера/Админа в активных статусах
                    if (['new', 'assigned', 'in_progress', 'resolved'].includes(discrepancyData.status)) {
                        const btnContainer = document.createElement('div');
                        btnContainer.className = 'master-actions-container';
                        btnContainer.style.display = 'flex';
                        btnContainer.style.flexDirection = 'column';
                        btnContainer.style.gap = '10px';

                        // Основная кнопка "Устранено" (если еще не устранено)
                        if (discrepancyData.status !== 'resolved') {
                            const resolvedBtn = document.createElement('button');
                            resolvedBtn.type = 'button';
                            resolvedBtn.className = 'button button-success';
                            resolvedBtn.textContent = '🛠️ Устранено';
                            resolvedBtn.onclick = () => this.handleMasterAction('resolved');
                            btnContainer.appendChild(resolvedBtn);
                        }

                        // Кнопка "Оспорить" - теперь открывает выбор вариантов
                        const disputeBtn = document.createElement('button');
                        disputeBtn.type = 'button';
                        disputeBtn.className = 'button button-danger';
                        disputeBtn.id = 'main-dispute-btn';
                        disputeBtn.textContent = '⚖️ Оспорить';
                        disputeBtn.onclick = () => this.showDisputeOptions();
                        btnContainer.appendChild(disputeBtn);

                        // Контейнер для вариантов оспаривания (скрыт по умолчанию)
                        const disputeOptions = document.createElement('div');
                        disputeOptions.id = 'dispute-options-container';
                        disputeOptions.style.display = 'none';
                        disputeOptions.style.flexDirection = 'column';
                        disputeOptions.style.gap = '8px';
                        disputeOptions.style.padding = '10px';
                        disputeOptions.style.background = '#fff5f5';
                        disputeOptions.style.borderRadius = '8px';
                        disputeOptions.style.border = '1px solid #feb2b2';

                        const optTitle = document.createElement('div');
                        optTitle.textContent = 'Выберите причину спора:';
                        optTitle.style.fontSize = '12px';
                        optTitle.style.fontWeight = 'bold';
                        optTitle.style.color = '#c53030';
                        disputeOptions.appendChild(optTitle);

                        const otherRespBtn = document.createElement('button');
                        otherRespBtn.type = 'button';
                        otherRespBtn.className = 'button button-small';
                        otherRespBtn.style.background = '#e53e3e';
                        otherRespBtn.textContent = '👥 Ответственен другой';
                        otherRespBtn.onclick = () => this.handleMasterAction('dispute_other');
                        disputeOptions.appendChild(otherRespBtn);

                        const krRequiredBtn = document.createElement('button');
                        krRequiredBtn.type = 'button';
                        krRequiredBtn.className = 'button button-small';
                        krRequiredBtn.style.background = '#805ad5';
                        krRequiredBtn.textContent = '📜 Требуется КР';
                        krRequiredBtn.onclick = () => this.handleMasterAction('dispute_kr');
                        disputeOptions.appendChild(krRequiredBtn);

                        const cancelDisputeBtn = document.createElement('button');
                        cancelDisputeBtn.type = 'button';
                        cancelDisputeBtn.className = 'button button-link';
                        cancelDisputeBtn.textContent = 'Отмена';
                        cancelDisputeBtn.onclick = () => this.hideDisputeOptions();
                        disputeOptions.appendChild(cancelDisputeBtn);

                        btnContainer.appendChild(disputeOptions);
                        
                        const saveChangesBtn = document.createElement('button');
                        saveChangesBtn.type = 'button';
                        saveChangesBtn.className = 'button button-secondary';
                        saveChangesBtn.textContent = '💾 Сохранить (Срок)';
                        saveChangesBtn.onclick = () => this.handleSubmit(new Event('submit'));
                        btnContainer.appendChild(saveChangesBtn);

                        actionsDiv.appendChild(btnContainer);
                    }
                }
            }
// ... rest of code ...

            this.handleStatusChange();
            this.handleScenarioChange();

            if (discrepancyData.due_date) {
                const date = new Date(discrepancyData.due_date);
                // Формат для datetime-local: YYYY-MM-DDTHH:mm
                const tzOffset = date.getTimezoneOffset() * 60000;
                const localISOTime = (new Date(date - tzOffset)).toISOString().slice(0, 16);
                this.form.elements.due_date.value = localISOTime;
            }
        } else {
            this.title.textContent = 'Регистрация несоответствия';
            this.form.elements.id.value = '';
            this.form.elements.application_id.value = applicationId || '';
            this.statusSelect.value = 'new';
            masterFields.style.display = 'none';
            if (actionsDiv) actionsDiv.innerHTML = '';
            
            // При создании всё должно быть доступно
            inputs.forEach(input => input.disabled = false);
            submitButton.style.display = 'block';

            this.handleStatusChange();
            
            const defaultDate = new Date();
            defaultDate.setHours(defaultDate.getHours() + 24); // + 1 день
            const tzOffset = defaultDate.getTimezoneOffset() * 60000;
            const localISOTime = (new Date(defaultDate - tzOffset)).toISOString().slice(0, 16);
            this.form.elements.due_date.value = localISOTime;
        }

        this.modal.style.display = 'block';
    }

    showDisputeOptions() {
        document.getElementById('main-dispute-btn').style.display = 'none';
        document.getElementById('dispute-options-container').style.display = 'flex';
        // Прокручиваем к вариантам
        document.getElementById('dispute-options-container').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    hideDisputeOptions() {
        document.getElementById('main-dispute-btn').style.display = 'block';
        document.getElementById('dispute-options-container').style.display = 'none';
    }

    async handleMasterAction(action) {
        const id = this.form.elements.id.value;
        const fixPhoto = this.form.elements.fix_photo_url.value;
        const opinion = this.form.elements.special_opinion.value;

        if (action === 'resolved' && !fixPhoto) {
            alert('Пожалуйста, приложите фото устранения (URL).');
            return;
        }

        if (action.startsWith('dispute') && !opinion) {
            alert('Пожалуйста, напишите причину спора в поле "Особое мнение / Причина спора".');
            // Переводим фокус на поле
            document.getElementById('disc-special-opinion').focus();
            return;
        }

        let prefix = '';
        if (action === 'dispute_other') prefix = '[ДРУГОЙ ОТВЕТСТВЕННЫЙ] ';
        if (action === 'dispute_kr') prefix = '[ТРЕБУЕТСЯ КР] ';

        const payload = {
            id: parseInt(id),
            status: action === 'resolved' ? 'resolved' : 'in_progress',
            fix_photo_url: fixPhoto || null,
            special_opinion: prefix + (opinion || ''),
            is_disputed: action.startsWith('dispute')
        };

        try {
            const response = await window.TMA_API.updateDiscrepancyStatus(id, payload);
            if (response.success) {
                this.hide();
                if (this.onSave) await this.onSave(response.data);
            }
        } catch (error) {
            alert(error.message);
        }
    }

    hide() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // Преобразование типов
        const payload = {
            title: data.title.trim(),
            description: data.description.trim(),
            severity: data.severity,
            status: data.status,
            closure_scenario: data.closure_scenario || null,
            metadata: data.details ? JSON.stringify({ details: data.details }) : null,
            defect_photo_url: data.defect_photo_url || null,
            responsible_id: data.responsible_id ? parseInt(data.responsible_id) : null,
            due_date: new Date(data.due_date).toISOString(),
            detected_at: new Date().toISOString(), // Добавляем обязательное поле detected_at
            application_id: data.application_id ? parseInt(data.application_id) : null
        };

        if (this.editMode && data.id) {
            payload.id = parseInt(data.id);
        }

        try {
            const submitButton = this.form.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Сохранение...';
            
            if (this.onSave) {
                await this.onSave(payload);
            }
        } catch (error) {
            alert(`Ошибка: ${error.message}`);
        } finally {
            const submitButton = this.form.querySelector('button[type="submit"]');
            submitButton.disabled = false;
            submitButton.textContent = this.editMode ? 'Обновить' : 'Зафиксировать дефект';
        }
    }
}