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
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.hide();
        });
    }

    async fetchDataIfNeeded() {
        try {
            if (this.usersCache.length === 0) {
                const response = await window.TMA_API.getUsers('active');
                this.usersCache = response.data || (Array.isArray(response) ? response : []);
            }
        } catch (error) {
            console.error('Failed to fetch users for discrepancy modal:', error);
            return false;
        }
        return true;
    }

    populateResponsibleSelect() {
        this.responsibleSelect.innerHTML = '<option value="" disabled selected>-- Выберите ответственного --</option>';
        // Фильтруем мастеров и рабочих для ответственности
        const staff = this.usersCache.filter(u => ['master', 'worker'].includes(u.role));
        staff.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.first_name} ${user.last_name} (${this.getRoleName(user.role)})`;
            this.responsibleSelect.appendChild(option);
        });
    }

    getRoleName(role) {
        const roles = { master: 'Мастер', worker: 'Рабочий' };
        return roles[role] || role;
    }

    async show({ mode = 'create', discrepancyData = null, applicationId = null, onSave = () => {} }) {
        this.onSave = onSave;
        this.editMode = mode === 'edit';
        this.form.reset();

        await this.fetchDataIfNeeded();
        this.populateResponsibleSelect();

        if (this.editMode && discrepancyData) {
            this.title.textContent = 'Редактировать несоответствие';
            this.form.elements.id.value = discrepancyData.id;
            this.form.elements.title.value = discrepancyData.title || '';
            this.form.elements.description.value = discrepancyData.description || '';
            this.form.elements.severity.value = discrepancyData.severity || 'medium';
            this.form.elements.responsible_id.value = discrepancyData.responsible_id || '';
            
            if (discrepancyData.due_date) {
                const date = new Date(discrepancyData.due_date);
                this.form.elements.due_date.value = date.toISOString().split('T')[0];
            }
        } else {
            this.title.textContent = 'Регистрация несоответствия';
            this.form.elements.id.value = '';
            this.form.elements.application_id.value = applicationId || '';
            
            // Ставим дату по умолчанию + 3 дня
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 3);
            this.form.elements.due_date.value = defaultDate.toISOString().split('T')[0];
        }

        this.modal.style.display = 'block';
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