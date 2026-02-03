import { BaseModal } from './BaseModal.js';

export class ProductModal extends BaseModal {
    constructor() {
        super('product-modal', 'product-form');
    }

    // handleSubmit удален, чтобы использовался стандартный из BaseModal

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