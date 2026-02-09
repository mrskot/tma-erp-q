import api from '../api.js';
import store from '../store.js';
import { BaseModal } from './BaseModal.js';
import authManager from '../auth.js';

export class ApplicationModal extends BaseModal {
    constructor() {
        super('application-modal', 'application-form');
        this.attachInternalListeners();
    }

    attachInternalListeners() {
        if (!this.form) return;
        this.form.elements.quantity.oninput = () => this.renderSerialInputs();
        this.form.elements.has_serial_numbers.onchange = () => this.toggleSerialsContainer();
        this.form.elements.lot_id.onchange = () => this.handleLotChange();
    }

    async show({ mode = 'create', onSave }) {
        super.show({ onSave });
        this.modalElement.querySelector('.modal-title').textContent = 'Создать партию заявок';

        try {
            const currentUser = authManager.getUser();
            const isMaster = currentUser && currentUser.role === 'master';

            const promises = [
                api.getLotsWithMasters(),
                // Если пользователь - мастер, НЕ запрашиваем список всех мастеров.
                // Promise.resolve вернет "пустой" успешный результат, не вызывая API.
                isMaster ? Promise.resolve({ users: [] }) : api.getUsersByRole('master'),
                api.getProducts('all')
            ];

            const [lotsRes, usersRes, productsRes] = await Promise.all(promises);

            store.setLots(lotsRes.lots || []);
            store.setMasters(usersRes.users || []);
            store.setProducts(productsRes.products || []);
            
            this.populateSelect(this.form.elements.lot_id, store.state.lots, { placeholder: 'Выберите участок' });
            this.populateSelect(this.form.elements.master_id, store.state.masters, { textField: 'first_name', placeholder: 'Выберите мастера' });
            
            this.form.elements.master_id.disabled = isMaster;
            if (isMaster) {
                this.form.elements.master_id.value = currentUser.id;
                const masterLots = store.state.lots.filter(lot => lot.main_master_id === currentUser.id || lot.temp_master_id === currentUser.id);
                this.populateSelect(this.form.elements.lot_id, masterLots, { placeholder: 'Выберите ваш участок' });
                if (masterLots.length === 1) {
                    this.form.elements.lot_id.value = masterLots[0].id;
                    this.handleLotChange(); 
                }
            }
            
            this.form.elements.has_serial_numbers.checked = true;
            this.form.elements.quantity.value = 1;
            const now = new Date();
            now.setHours(now.getHours() + 4);
            this.form.elements.desired_inspection_time.value = now.toISOString().slice(0, 16);
            
            if (!isMaster) {
                this.handleLotChange();
            }
            this.renderSerialInputs();

        } catch (error) {
            alert(`Ошибка загрузки данных для модального окна: ${error.message}`);
            this.hide();
        }
    }

    handleLotChange() {
        const lotId = parseInt(this.form.elements.lot_id.value, 10);
        const productsForLot = (lotId && store.state.products)
            ? store.state.products.filter(p => p.lot_id === lotId)
            : [];
        
        this.populateSelect(this.form.elements.product_id, productsForLot, { 
            placeholder: productsForLot.length > 0 ? 'Выберите изделие' : 'Нет изделий на участке' 
        });

        const selectedLot = store.state.lots.find(l => l.id === lotId);
        if (selectedLot && !this.form.elements.master_id.disabled) {
            this.form.elements.master_id.value = selectedLot.temp_master_id || selectedLot.main_master_id || '';
        }
    }

    toggleSerialsContainer() {
        document.getElementById('app-serials-container').style.display = this.form.elements.has_serial_numbers.checked ? 'block' : 'none';
        this.renderSerialInputs();
    }

    renderSerialInputs() {
        const container = document.getElementById('app-serials-container');
        container.innerHTML = '';
        if (!this.form.elements.has_serial_numbers.checked) return;

        const quantity = parseInt(this.form.elements.quantity.value, 10) || 0;
        for (let i = 0; i < quantity; i++) {
            const row = document.createElement('div');
            row.className = 'serial-photo-row';
            row.innerHTML = `
                <div style="font-size: 12px; color: #666; margin-top: 10px;">Экземпляр #${i + 1}</div>
                <input type="text" name="serial_number_${i}" placeholder="Серийный номер" required>
                <input type="text" name="mki_photo_url_${i}" placeholder="URL фото МКИ (опционально)">
            `;
            container.appendChild(row);
        }
    }

    _collectData() {
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());
        const quantity = parseInt(data.quantity, 10);

        const payload = {
            production_order_number: data.production_order_number,
            lot_id: parseInt(data.lot_id, 10),
            master_id: parseInt(data.master_id, 10),
            product_id: parseInt(data.product_id, 10),
            drawing_number: data.drawing_number,
            desired_inspection_time: new Date(data.desired_inspection_time).toISOString(),
            quantity: quantity,
            has_serial_numbers: data.has_serial_numbers === 'on',
            notes: data.notes,
            serial_data: []
        };

        if (payload.has_serial_numbers) {
            for (let i = 0; i < quantity; i++) {
                payload.serial_data.push({
                    serial_number: formData.get(`serial_number_${i}`),
                    mki_photo_url: formData.get(`mki_photo_url_${i}`)
                });
            }
        }
        return payload;
    }
}