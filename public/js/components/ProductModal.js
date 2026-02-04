import { BaseModal } from './BaseModal.js';

export class ProductModal extends BaseModal {
    constructor() {
        super('product-modal', 'product-form');
    }

    show({ mode, productData = null, lots = [], inspectors = [], onSave }) {
        super.show({ onSave });
        const title = this.modalElement.querySelector('.modal-title');
        title.textContent = mode === 'edit' ? 'Редактировать изделие' : 'Создать изделие';

        this.populateSelect(this.form.elements.lot_id, lots, { placeholder: 'Выберите участок' });
        this.populateSelect(this.form.elements.default_inspector_id, inspectors, { textField: 'first_name', placeholder: 'Не назначен' });

        if (mode === 'edit' && productData) {
            Object.keys(productData).forEach(key => {
                if (this.form.elements[key]) {
                    if (key === 'checklist' && Array.isArray(productData[key])) {
                        this.form.elements[key].value = productData[key].join('\n');
                    } else {
                        this.form.elements[key].value = productData[key] || '';
                    }
                }
            });
        }
    }
}