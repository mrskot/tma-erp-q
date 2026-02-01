/**
 * Modal for viewing application details and taking actions
 */
class ApplicationDetailsModal {
    constructor() {
        this.modal = document.getElementById('application-details-modal');
        if (!this.modal) return;
        
        this.closeButton = this.modal.querySelector('.close');
        this.actionsContainer = document.getElementById('view-app-actions');
        
        // Поля данных
        this.fields = {
            number: document.getElementById('view-app-number'),
            order: document.getElementById('view-app-order'),
            product: document.getElementById('view-app-product'),
            drawing: document.getElementById('view-app-drawing'),
            serial: document.getElementById('view-app-serial'),
            master: document.getElementById('view-app-master'),
            lot: document.getElementById('view-app-lot'),
            status: document.getElementById('view-app-status')
        };
        
        this.mkiSection = document.getElementById('view-app-mki-section');
        this.mkiImg = document.getElementById('view-app-mki-img');
        this.discList = document.getElementById('view-app-discrepancies-list');
        
        this.checklistSection = document.getElementById('view-app-checklist-section');
        this.checklistItems = document.getElementById('view-app-checklist-items');
        
        this.currentApp = null;
        this.attachEventListeners();
    }

    attachEventListeners() {
        this.closeButton.onclick = () => this.hide();
        window.onclick = (event) => {
            if (event.target === this.modal) this.hide();
        };
    }

    async show(applicationId) {
        try {
            const response = await window.TMA_API.getApplicationById(applicationId);
            if (!response.success) throw new Error(response.message);
            
            const app = response.data;
            this.currentApp = app;
            
            // Заполняем поля
            this.fields.number.textContent = app.application_number;
            this.fields.order.textContent = app.production_order_number || '—';
            this.fields.product.textContent = app.product_name;
            this.fields.drawing.textContent = app.drawing_number || '—';
            this.fields.serial.textContent = app.serial_number || '—';
            this.fields.master.textContent = app.master_name;
            this.fields.lot.textContent = app.lot_name;

            const statusTranslations = {
                new: 'Новая',
                assigned: 'Назначена',
                in_progress: 'В работе',
                accepted: 'Принято',
                rejected: 'Отклонено'
            };
            
            this.fields.status.textContent = statusTranslations[app.status] || app.status.toUpperCase();
            this.fields.status.className = `status-badge bg-status-${app.status}`;
            
            // Рендерим Чек-лист
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
            alert(`Ошибка при загрузке деталей: ${e.message}`);
        }
    }

    async refreshDiscrepancies(applicationId) {
        this.discList.innerHTML = '<p class="subtitle">Загрузка несоответствий...</p>';
        try {
            const response = await window.TMA_API.getDiscrepancies({ application_id: applicationId });
            this.discList.innerHTML = '';
            
            if (response.success && response.data.length > 0) {
                response.data.forEach(disc => {
                    const card = window.UI.createDiscrepancyCard(disc, (d) => {
                        window.app.openEditDiscrepancyModal(d.id);
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

        const user = window.AuthManager.getUser();
        const isInspector = user.role === 'inspector' || user.role === 'admin';

        // Используем чек-лист из изделия, который теперь приходит вместе с заявкой
        const rawChecklist = app.product_checklist || app.checklist;
        if (!rawChecklist) return;

        let checklist = [];
        try {
            checklist = typeof rawChecklist === 'string' ? JSON.parse(rawChecklist) : rawChecklist;
        } catch (e) {
            console.error('Checklist parse error:', e);
            return;
        }

        if (!Array.isArray(checklist) || checklist.length === 0) return;

        this.checklistSection.style.display = 'block';
        
        // Меняем заголовок в зависимости от роли
        const titleEl = this.checklistSection.querySelector('div');
        if (titleEl) {
            titleEl.textContent = isInspector ? '📋 Чек-лист контроля:' : '📋 Список необходимых проверок:';
        }

        checklist.forEach((item, index) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.alignItems = 'flex-start';
            div.style.gap = '10px';
            div.style.marginBottom = '8px';
            div.style.padding = '4px 0';
            div.style.borderBottom = '1px dashed #eee';
            
            // НОРМАЛИЗАЦИЯ ТЕКСТА: обрабатываем и строки, и объекты {"task": "..."}
            let itemText = item;
            if (typeof item === 'object' && item !== null) {
                itemText = item.task || item.text || item.title || JSON.stringify(item);
            }
            
            // Если заявка принята или отклонена, чекбоксы заблокированы
            const isDisabled = ['accepted', 'rejected'].includes(app.status);
            
            if (isInspector) {
                // Для ИНСПЕКТОРА - интерактивные чекбоксы
                div.innerHTML = `
                    <input type="checkbox" id="check-${index}" style="margin-top: 3px;" ${isDisabled ? 'disabled checked' : ''}>
                    <label for="check-${index}" style="font-size: 13px; line-height: 1.4; color: #333;">${itemText}</label>
                `;
            } else {
                // Для МАСТЕРА - просто список с маркером (без галочек)
                div.innerHTML = `
                    <span style="color: #667eea; margin-top: 2px;">🔹</span>
                    <span style="font-size: 13px; line-height: 1.4; color: #333;">${itemText}</span>
                `;
            }
            this.checklistItems.appendChild(div);
        });
    }

    renderActions(app) {
        this.actionsContainer.innerHTML = '';
        const user = window.AuthManager.getUser();
        
        // 1. Действия для КОНТРОЛЁРА
        if (user.role === 'inspector' || user.role === 'admin') {
            // Если заявка новая - контролер может её "взять в работу"
            if (app.status === 'new') {
                const takeBtn = document.createElement('button');
                takeBtn.className = 'button button-primary';
                takeBtn.textContent = '🔍 Взять на проверку';
                takeBtn.onclick = () => this.handleStatusChange('in_progress', user.id);
                this.actionsContainer.appendChild(takeBtn);
            }

            if (app.status === 'assigned' || app.status === 'in_progress') {
                // Кнопка Принять
                const acceptBtn = document.createElement('button');
                acceptBtn.className = 'button button-success';
                acceptBtn.textContent = '✅ Принять (Годен)';
                acceptBtn.onclick = () => {
                    // ВАЛИДАЦИЯ: Проверяем, что все пункты чек-листа отмечены
                    const checkboxes = this.checklistItems.querySelectorAll('input[type="checkbox"]');
                    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
                    
                    if (checkboxes.length > 0 && !allChecked) {
                        alert('Для приёмки необходимо отметить все пункты чек-листа!');
                        return;
                    }
                    this.handleStatusChange('accepted');
                };
                this.actionsContainer.appendChild(acceptBtn);
                
                // Кнопка Добавить несоответствие
                const discBtn = document.createElement('button');
                discBtn.className = 'button button-danger';
                discBtn.textContent = '⚠️ Выявить несоответствие';
                discBtn.onclick = () => {
                    window.app.openCreateDiscrepancyModal(app.id, async () => {
                        // По завершении создания несоответствия не закрываем это окно, а обновляем список
                        await this.refreshDiscrepancies(app.id);
                    });
                };
                this.actionsContainer.appendChild(discBtn);
            }
        }
        
        // 2. Действия для МАСТЕРА (если нужно отклонить свою новую заявку)
        if (user.role === 'master' && app.status === 'new') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'button button-secondary';
            cancelBtn.textContent = '🗑️ Отозвать заявку';
            cancelBtn.onclick = () => this.handleDelete(app.id);
            this.actionsContainer.appendChild(cancelBtn);
        }
    }

    async handleStatusChange(status, inspectorId = null) {
        try {
            const payload = { status };
            if (inspectorId) {
                // Если мы берем в работу, нужно обновить и инспектора
                await window.TMA_API.updateApplication(this.currentApp.id, { 
                    inspector_id: inspectorId,
                    status: status 
                });
            } else {
                await window.TMA_API.updateApplicationStatus(this.currentApp.id, status);
            }
            
            this.hide();
            window.app.showPage('dashboard'); // Обновляем дашборд
        } catch (e) {
            alert(e.message);
        }
    }

    async handleDelete(id) {
        if (confirm('Вы уверены, что хотите отозвать эту заявку?')) {
            try {
                await window.TMA_API.deleteApplication(id);
                this.hide();
                window.app.showPage('dashboard');
            } catch (e) {
                alert(e.message);
            }
        }
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

window.ApplicationDetailsModal = ApplicationDetailsModal;

