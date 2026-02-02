// public/js/components/ProductModal.js
import { BaseModal } from './BaseModal.js';

export class ProductModal extends BaseModal {
    constructor() {
        super('product-modal', 'product-form');
    }

    // Переопределяем handleSubmit для обработки checklist
    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // Преобразуем textarea в массив строк
        data.checklist = data.checklist.split('\n').map(item => item.trim()).filter(item => item);
        
        const submitButton = this.form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        try {
            if (this.onSave) await this.onSave(data);
        } finally {
            submitButton.disabled = false;
        }
    }

    show({ mode, productData = null, lots = [], onSave }) {
        super.show({ onSave });
        const title = this.modalElement.querySelector('.modal-title');

        const lotSelect = this.form.elements.lot_id;
        lotSelect.innerHTML = '<option value="">Выберите участок</option>';
        lots.forEach(lot => {
            lotSelect.innerHTML += `<option value="${lot.id}">${lot.name}</option>`;
        });

        if (mode === 'edit' && productData) {
            title.textContent = 'Редактировать изделие';
            Object.keys(productData).forEach(key => {
                if (key === 'checklist' && Array.isArray(productData[key])) {
                    this.form.elements[key].value = productData[key].join('\n');
                } else if (this.form.elements[key]) {
                    this.form.elements[key].value = productData[key] === null ? '' : productData[key];
                }
            });
        } else {
            title.textContent = 'Создать изделие';
        }
    }
}