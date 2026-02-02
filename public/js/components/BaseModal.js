// public/js/components/BaseModal.js
export class BaseModal {
    constructor(modalId, formId) {
        this.modalElement = document.getElementById(modalId);
        if (!this.modalElement) {
            console.error(`HTML для модального окна с ID "${modalId}" не найден`);
            return;
        }
        this.form = document.getElementById(formId);
        this.onSave = null;

        this.modalElement.querySelector('.close').addEventListener('click', () => this.hide());
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Сохранение...';

        try {
            if (this.onSave) {
                await this.onSave(data);
            }
        } catch (error) {
            console.error("Ошибка во время сохранения из модального окна:", error);
            // Ошибку покажет вызывающая функция
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Сохранить';
        }
    }

    show(options) {
        this.onSave = options.onSave;
        this.form.reset();
        this.modalElement.style.display = 'block';
    }

    hide() {
        if (this.modalElement) this.modalElement.style.display = 'none';
    }
}