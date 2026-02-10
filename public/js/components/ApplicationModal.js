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
        // Новый основной обработчик
        this.form.elements.product_id.onchange = () => this.handleProductChange();
    }

    async show({ mode = 'create', onSave }) {
        super.show({ onSave });
        this.modalElement.querySelector('.modal-title').textContent = 'Создать партию заявок';

        this.form.elements.lot_id.disabled = true;
        this.form.elements.master_id.disabled = true;

        try {
            const currentUser = authManager.getUser();
            const isMaster = currentUser && currentUser.role === 'master';

            // Загружаем базовые данные для всех
            const [lotsRes, productsRes] = await Promise.all([
                api.getLotsWithMasters(),
                api.getProducts('all')
            ]);
            
            const allLots = lotsRes.lots || [];
            const allProducts = productsRes.products || [];
            
            store.setLots(allLots);
            store.setProducts(allProducts);

            let productsToShow = allProducts;
            let mastersToShow = [];

            if (isMaster) {
                // --- Логика для Мастера ---
                const currentUserId = parseInt(currentUser.id, 10); // Приводим ID к числу
                const masterLots = allLots
                    .filter(lot => {
                        const mainMasterId = parseInt(lot.main_master_id, 10);
                        const tempMasterId = parseInt(lot.temp_master_id, 10);
                        return mainMasterId === currentUserId || tempMasterId === currentUserId;
                    })
                    .map(lot => lot.id);

                productsToShow = allProducts.filter(p => masterLots.includes(p.lot_id));
                mastersToShow = [currentUser];

                // --- DEBUG LOGGING START ---
                console.log('--- ОТЛАДКА ДЛЯ МАСТЕРА ---');
                console.log('Текущий ID пользователя:', currentUserId);
                console.log('Все участки, полученные с бэкенда:', JSON.parse(JSON.stringify(allLots)));
                console.log('ID участков, найденные для этого мастера:', masterLots);
                console.log('Все изделия, полученные с бэкенда:', JSON.parse(JSON.stringify(allProducts)));
                console.log('Изделия, отфильтрованные для показа:', JSON.parse(JSON.stringify(productsToShow)));
                console.log('--- КОНЕЦ ОТЛАДКИ ---');
                // --- DEBUG LOGGING END ---
            } else {
                // --- Логика для Админа/Директора ---
                const mastersRes = await api.getUsersByRole('master');
                mastersToShow = mastersRes.users || [];
            }
            
            store.setMasters(mastersToShow);
            
            this.populateSelect(this.form.elements.product_id, productsToShow, { placeholder: 'Сначала выберите изделие...' });
            this.populateSelect(this.form.elements.lot_id, allLots, { placeholder: '---' });
            this.populateSelect(this.form.elements.master_id, store.state.masters, { 
                valueField: 'id',
                textField: (user) => `${user.first_name} ${user.last_name || ''}`.trim(), 
                placeholder: '---' 
            });
            
            this.form.elements.has_serial_numbers.checked = true;
            this.form.elements.quantity.value = 1;
            const now = new Date();
            now.setHours(now.getHours() + 4);
            this.form.elements.desired_inspection_time.value = now.toISOString().slice(0, 16);
            
            this.renderSerialInputs();

        } catch (error) {
            alert(`Ошибка загрузки данных для модального окна: ${error.message}`);
            this.hide();
        }
    }

    handleProductChange() {
        const productId = parseInt(this.form.elements.product_id.value, 10);
        const lotSelect = this.form.elements.lot_id;
        const masterSelect = this.form.elements.master_id;

        if (!productId) {
            lotSelect.value = '';
            masterSelect.value = '';
            return;
        }

        const product = store.state.products.find(p => p.id === productId);
        if (!product) return;

        const lot = store.state.lots.find(l => l.id === product.lot_id);
        if (lot) {
            lotSelect.value = lot.id;
            // Приоритет временному мастеру, затем основному.
            masterSelect.value = lot.temp_master_id || lot.main_master_id || '';
        } else {
            lotSelect.value = '';
            masterSelect.value = '';
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

        // Включаем значения из заблокированных полей и проверяем их
        const lotId = parseInt(this.form.elements.lot_id.value, 10);
        const masterId = parseInt(this.form.elements.master_id.value, 10);
        const productId = parseInt(data.product_id, 10);

        // --- ДОБАВЛЕНА ПРОВЕРКА ---
        if (isNaN(productId) || isNaN(lotId) || isNaN(masterId)) {
            // Выбрасываем ошибку прямо здесь, чтобы не отправлять неверный запрос
            throw new Error('Не все обязательные поля (Изделие, Участок, Мастер) заполнены.');
        }

        const payload = {
            production_order_number: data.production_order_number,
            lot_id: lotId,
            master_id: masterId,
            product_id: productId,
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