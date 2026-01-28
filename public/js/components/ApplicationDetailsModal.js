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
            this.fields.product.textContent = app.product_name;
            this.fields.drawing.textContent = app.drawing_number || '—';
            this.fields.serial.textContent = app.serial_number || '—';
            this.fields.master.textContent = app.master_name;
            this.fields.lot.textContent = app.lot_name;
            this.fields.status.textContent = app.status.toUpperCase();
            this.fields.status.className = `status-badge bg-status-${app.status}`;
            
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

    renderActions(app) {
        this.actionsContainer.innerHTML = '';
        const user = window.AuthManager.getUser();
        
        // 1. Действия для КОНТРОЛЁРА
        if (user.role === 'inspector' || user.role === 'admin') {
            if (app.status === 'assigned' || app.status === 'in_progress') {
                // Кнопка Принять
                const acceptBtn = document.createElement('button');
                acceptBtn.className = 'button button-success';
                acceptBtn.textContent = '✅ Принять (Годен)';
                acceptBtn.onclick = () => this.handleStatusChange('accepted');
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

    async handleStatusChange(status) {
        try {
            const result = await window.TMA_API.updateApplicationStatus(this.currentApp.id, status);
            if (result.success) {
                this.hide();
                window.app.showPage('dashboard'); // Обновляем дашборд
            }
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
