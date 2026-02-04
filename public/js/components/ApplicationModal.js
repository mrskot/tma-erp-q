import { BaseModal } from './BaseModal.js';
import authManager from '../auth.js';

export class ApplicationModal extends BaseModal {
    constructor() {
        super('application-modal', 'application-form');
        this.attachInternalListeners();
    }

    attachInternalListeners() {
        this.form.elements.quantity.oninput = () => this.renderSerialInputs();
        this.form.elements.has_serial_numbers.onchange = () => this.toggleSerialsContainer();
        this.form.elements.lot_id.onchange = () => this.handleLotChange();
    }

    async show({ mode = 'create', onSave, products = [], masters = [], lots = [] }) {
        super.show({ onSave });
        this.productsCache = products;
        this.lotsCache = lots;

        const title = this.modalElement.querySelector('.modal-title');
        title.textContent = mode === 'edit' ? 'Редактировать заявку' : 'Создать партию заявок';

        const currentUser = authManager.getUser();
        const isMaster = currentUser && currentUser.role === 'master';

        this.populateSelect(this.form.elements.lot_id, lots, { placeholder: 'Выберите участок' });
        this.populateSelect(this.form.elements.master_id, masters, { textField: 'first_name', placeholder: 'Выберите мастера' });
        this.populateSelect(this.form.elements.product_id, [], { placeholder: 'Сначала выберите участок' });

        this.form.elements.master_id.disabled = isMaster;

        if (isMaster) {
            this.form.elements.master_id.value = currentUser.id;
            const masterLots = lots.filter(lot => lot.main_master_id === currentUser.id || lot.temp_master_id === currentUser.id);
            this.populateSelect(this.form.elements.lot_id, masterLots, { placeholder: 'Выберите ваш участок' });
            if (masterLots.length === 1) {
                this.form.elements.lot_id.value = masterLots[0].id;
                this.handleLotChange();
            }
        }

        this.form.elements.has_serial_numbers.checked = true;
        this.toggleSerialsContainer();
        this.form.elements.quantity.value = 1;
        this.renderSerialInputs();
    }

    handleLotChange() {
        const lotId = parseInt(this.form.elements.lot_id.value);
        if (!lotId) {
            this.populateSelect(this.form.elements.product_id, [], { placeholder: 'Сначала выберите участок' });
            return;
        }

        const filteredProducts = this.productsCache.filter(p => p.lot_id === lotId);
        this.populateSelect(this.form.elements.product_id, filteredProducts, { 
            placeholder: filteredProducts.length > 0 ? 'Выберите изделие' : 'На этом участке нет изделий' 
        });

        const selectedLot = this.lotsCache.find(l => l.id === lotId);
        if (selectedLot && !this.form.elements.master_id.disabled) {
            this.form.elements.master_id.value = selectedLot.temp_master_id || selectedLot.main_master_id || '';
        }
    }

    toggleSerialsContainer() {
        const container = document.getElementById('app-serials-container');
        container.style.display = this.form.elements.has_serial_numbers.checked ? 'block' : 'none';
        this.renderSerialInputs();
    }

    renderSerialInputs() {
        const container = document.getElementById('app-serials-container');
        container.innerHTML = '';
        if (!this.form.elements.has_serial_numbers.checked) return;

        const quantity = parseInt(this.form.elements.quantity.value) || 0;
        for (let i = 0; i < quantity; i++) {
            const row = document.createElement('div');
            row.className = 'serial-photo-row';
            row.innerHTML = `
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Экземпляр #${i + 1}</div>
                <input type="text" name="serial_number_${i}" placeholder="Серийный номер" required>
                <input type="text" name="serial_photo_${i}" placeholder="URL фото (опционально)">
            `;
            container.appendChild(row);
        }
    }
}