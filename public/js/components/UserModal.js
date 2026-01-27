// public/js/components/UserModal.js

class UserModal {
    constructor() {
        this.modalElement = document.getElementById('user-modal');
        this.form = document.getElementById('user-form');
        this.onSave = null;

        if (!this.modalElement || !this.form) {
            console.error('UserModal HTML elements not found in the DOM.');
            return;
        }

        // Назначаем обработчики событий
        this.modalElement.querySelector('.close').addEventListener('click', () => this.hide());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.hide();
        });
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // Преобразуем числовые поля
        if (data.bitrix_id) data.bitrix_id = parseInt(data.bitrix_id, 10);
        if (data.telegram_id) data.telegram_id = data.telegram_id.toString();

        // Удаляем пустой ID при создании нового пользователя
        if (!data.id) {
            delete data.id;
        } else {
            data.id = parseInt(data.id, 10);
        }

        if (this.onSave) {
            const submitButton = this.form.querySelector('button[type="submit"]');
            try {
                submitButton.disabled = true;
                submitButton.textContent = 'Сохранение...';
                await this.onSave(data);
            } catch (error) {
                alert(`Не удалось сохранить: ${error.message}`);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Сохранить';
            }
        }
    }

    show({ mode, userData = null, onSave }) {
        if (!this.modalElement) {
            console.error('UserModal cannot be shown because its HTML elements were not found.');
            return;
        }

        this.onSave = onSave;
        this.form.reset();

        const title = this.modalElement.querySelector('.modal-title');
        const passwordGroup = document.getElementById('user-password-group');
        
        if (mode === 'edit') {
            title.textContent = 'Редактировать пользователя';
            this.form.elements.id.value = userData.id || '';
            this.form.elements.first_name.value = userData.first_name || '';
            this.form.elements.last_name.value = userData.last_name || '';
            this.form.elements.role.value = userData.role || 'worker';
            this.form.elements.telegram_id.value = userData.telegram_id || '';
            this.form.elements.bitrix_id.value = userData.bitrix_id || '';
            passwordGroup.style.display = 'none';
        } else {
            title.textContent = 'Создать нового пользователя';
            this.form.elements.id.value = '';
            passwordGroup.style.display = 'block';
        }

        this.modalElement.style.display = 'block';
    }

    hide() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'none';
        this.onSave = null;
    }
}

