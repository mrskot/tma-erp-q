// public/js/components/UserModal.js
import { BaseModal } from './BaseModal.js';

export class UserModal extends BaseModal {
    constructor() {
        super('user-modal', 'user-form');
    }

    show({ mode, userData = null, onSave }) {
        super.show({ onSave });
        const title = this.modalElement.querySelector('.modal-title');
        const pinGroup = document.getElementById('user-pin-code-group');
        
        if (mode === 'edit' && userData) {
            title.textContent = 'Редактировать пользователя';
            pinGroup.style.display = 'none';
            Object.keys(userData).forEach(key => {
                if (this.form.elements[key]) {
                    this.form.elements[key].value = userData[key] === null ? '' : userData[key];
                }
            });
        } else {
            title.textContent = 'Создать пользователя';
            pinGroup.style.display = 'block';
        }
    }
}