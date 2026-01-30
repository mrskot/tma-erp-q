// public/js/components/ApplicationModal.js

class ApplicationModal {
    constructor() {
        this.modal = document.getElementById('application-modal');
        if (!this.modal) {
            console.error('ApplicationModal HTML not found');
            return;
        }
        this.form = document.getElementById('application-form');
        this.title = this.modal.querySelector('.modal-title');
        this.closeButton = this.modal.querySelector('.close');
        
        // --- Элементы формы ---
        this.productIdSelect = document.getElementById('app-product-id');
        this.drawingNumberInput = document.getElementById('app-drawing-number');
        this.desiredTimeInput = document.getElementById('app-desired-time');
        this.quantityInput = document.getElementById('app-quantity');
        this.mkiPhotoInput = document.getElementById('app-mki-photo');
        this.hasSerialsCheckbox = document.getElementById('app-has-serials');
        this.serialsContainer = document.getElementById('app-serials-container');
        this.masterIdSelect = document.getElementById('app-master-id');
        this.lotIdSelect = document.getElementById('app-lot-id');
        this.notesTextarea = document.getElementById('app-notes');
        
        this.onSave = null;
        this.editMode = false;
        this.lotsCache = []; // Кэш для логики выбора мастера
        this.mastersCache = []; // Кэш для мастеров
        this.productsCache = []; // Кэш для изделий

        this.attachEventListeners();
    }

    attachEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.closeButton.addEventListener('click', () => this.hide());
        this.quantityInput.addEventListener('input', () => this.renderSerialInputs());
        this.hasSerialsCheckbox.addEventListener('change', () => this.toggleSerialsContainer());
        // Реагируем на изменение участка, чтобы подставить мастера
        this.lotIdSelect.addEventListener('change', () => this.handleLotChange());
    }

    // --- Логика авто-заполнения ---
    handleLotChange() {
        if (this.masterIdSelect.disabled) {
            console.log('Master select is disabled (current user is master)');
            return; // Не меняем мастера, если поле заблокировано (т.е. заявку создает сам мастер)
        }
        
        const lotId = parseInt(this.lotIdSelect.value);
        console.log('handleLotChange - lotId:', lotId);
        console.log('handleLotChange - lotsCache:', this.lotsCache);
        
        if (!lotId || !this.lotsCache) {
            console.log('No lotId or lotsCache is empty');
            this.masterIdSelect.value = ''; // Сбрасываем, если участок не выбран
            return;
        }

        const selectedLot = this.lotsCache.find(l => l.id === lotId);
        
        console.log('selectedLot:', selectedLot);
        
        // --- ИСПРАВЛЕНИЕ: Проверяем, что участок найден и используем правильные поля ---
        if (selectedLot) {
            // Приоритет у временного мастера (temp_master_id), затем у основного (main_master_id)
            const masterId = selectedLot.temp_master_id || selectedLot.main_master_id;
            console.log('Setting master_id to:', masterId);
            this.masterIdSelect.value = masterId || '';
        } else {
            console.warn('Lot not found in cache for id:', lotId);
            this.masterIdSelect.value = '';
        }
    }
    
    // --- Логика рендеринга динамических полей ---
    
    toggleSerialsContainer() {
        const show = this.hasSerialsCheckbox.checked;
        this.serialsContainer.style.display = show ? 'block' : 'none';
        this.renderSerialInputs();
    }

    renderSerialInputs() {
        this.serialsContainer.innerHTML = '';
        if (!this.hasSerialsCheckbox.checked) return;

        const quantity = parseInt(this.quantityInput.value) || 0;
        if (quantity < 1) return;

        const fragment = document.createDocumentFragment();
        for (let i = 0; i < quantity; i++) {
            const row = document.createElement('div');
            row.className = 'serial-photo-row';
            row.style.marginBottom = '10px';
            row.style.borderBottom = '1px solid #eee';
            row.style.paddingBottom = '10px';
            
            row.innerHTML = `
                <div style="font-size: 12px; color: #666; margin-bottom: 5px;">Экземпляр #${i + 1}</div>
                <input type="text" class="serial-number-input" placeholder="Серийный номер" required style="margin-bottom: 5px;">
                <input type="text" class="serial-photo-input" placeholder="URL фото МКИ для этого серийника" style="font-size: 12px;">
            `;
            fragment.appendChild(row);
        }
        this.serialsContainer.appendChild(fragment);
    }

    // --- Заполнение Select'ов ---

    populateSelect(selectElement, items, { valueField, textField, nameField, placeholder }) {
        selectElement.innerHTML = `<option value="">${placeholder}</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = nameField ? `${item[textField]} ${item[nameField]}` : item[textField];
            selectElement.appendChild(option);
        });
    }

    async fetchDataIfNeeded() {
        try {
            // Загружаем данные только если кэш пуст
            if (this.productsCache.length === 0) {
                const response = await window.TMA_API.getProducts();
                // Handle both direct array and wrapped response
                this.productsCache = response.data || (Array.isArray(response) ? response : []);
                console.log('Products loaded:', this.productsCache);
            }
            if (this.mastersCache.length === 0) {
                const response = await window.TMA_API.getUsersByRole('master');
                // Handle both direct array and wrapped response
                this.mastersCache = response.data || (Array.isArray(response) ? response : []);
                console.log('Masters loaded:', this.mastersCache);
            }
            if (this.lotsCache.length === 0) {
                const response = await window.TMA_API.getLotsWithMasters('active');
                console.log('Raw lots data:', response);
                // Handle both direct array and wrapped response
                this.lotsCache = response.data || (Array.isArray(response) ? response : []);
                console.log('Lots loaded and cached:', this.lotsCache);
            }
        } catch (error) {
            console.error('Failed to fetch data for application modal:', error);
            alert('Не удалось загрузить данные для создания заявки. Пожалуйста, обновите страницу.');
            return false;
        }
        return true;
    }

    // --- Основные методы модального окна ---

    async show({ mode = 'create', onSave = () => {} }) {
        this.onSave = onSave;
        this.editMode = mode === 'edit';
        this.form.reset();

        const dataLoaded = await this.fetchDataIfNeeded();
        if (!dataLoaded) return;
        
        this.title.textContent = 'Создать партию заявок';
        
        const currentUser = window.AuthManager.getUser();
        const isMaster = currentUser && currentUser.role === 'master';

        // 1. Заполняем селекты с изделиями и мастерами
        const activeProducts = this.productsCache.filter(p => p.is_active);
        const activeMasters = this.mastersCache.filter(m => m.is_active);
        const activeLots = this.lotsCache.filter(l => l.is_active);

        this.populateSelect(this.productIdSelect, activeProducts, { valueField: 'id', textField: 'name', placeholder: 'Выберите изделие' });
        this.populateSelect(this.masterIdSelect, activeMasters, { valueField: 'id', textField: 'first_name', nameField: 'last_name', placeholder: 'Выберите мастера' });

        // 2. Настраиваем поля в зависимости от роли
        this.masterIdSelect.disabled = isMaster;

        if (isMaster) {
            // СЦЕНАРИЙ 1: Пользователь - Мастер
            this.masterIdSelect.value = currentUser.id; 

            const masterLots = activeLots.filter(lot =>
                lot.main_master_id === currentUser.id || lot.temp_master_id === currentUser.id
            );
            this.populateSelect(this.lotIdSelect, masterLots, { valueField: 'id', textField: 'name', placeholder: 'Выберите ваш участок' });
        } else {
            // СЦЕНАРИЙ 2: Пользователь - Админ или другая роль
            this.populateSelect(this.lotIdSelect, activeLots, { valueField: 'id', textField: 'name', placeholder: 'Сначала выберите участок' });
            this.masterIdSelect.value = ''; // Мастер подставится после выбора участка
        }
        
        // 3. Сбрасываем значения и отрисовываем динамические поля
        this.lotIdSelect.value = '';
        this.handleLotChange(); // Вызываем, чтобы сбросить мастера
        this.hasSerialsCheckbox.checked = true;
        this.toggleSerialsContainer();
        this.quantityInput.value = 1;
        this.renderSerialInputs();
        
        this.modal.style.display = 'block';
    }

    hide() {
        this.modal.style.display = 'none';
        this.form.reset();
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        const quantity = parseInt(this.quantityInput.value);
        const has_serial_numbers = this.hasSerialsCheckbox.checked;
        const serial_data = [];

        if (has_serial_numbers) {
            this.serialsContainer.querySelectorAll('.serial-photo-row').forEach(row => {
                serial_data.push({
                    serial_number: row.querySelector('.serial-number-input').value.trim(),
                    mki_photo_url: row.querySelector('.serial-photo-input').value.trim()
                });
            });
            if (serial_data.some(d => !d.serial_number)) {
                alert('Все поля серийных номеров должны быть заполнены.');
                return;
            }
        }

        const batchData = {
            product_id: parseInt(this.productIdSelect.value),
            lot_id: parseInt(this.lotIdSelect.value),
            master_id: parseInt(this.masterIdSelect.value),
            drawing_number: this.drawingNumberInput.value.trim(),
            desired_inspection_time: new Date(this.desiredTimeInput.value).toISOString(),
            quantity: quantity,
            mki_photo_url: this.mkiPhotoInput ? this.mkiPhotoInput.value.trim() : null,
            has_serial_numbers: has_serial_numbers,
            serial_data: serial_data,
            notes: this.notesTextarea.value.trim()
        };
        
        // Простая валидация
        if (!batchData.product_id || !batchData.lot_id || !batchData.master_id || !batchData.desired_inspection_time || !batchData.quantity) {
            alert('Все поля, кроме заметок, номера чертежа и серийных номеров, обязательны.');
            return;
        }

        const submitButton = this.form.querySelector('button[type="submit"]');
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Сохранение...';
            if (this.onSave) {
                 await this.onSave(batchData);
            }
        } catch (error) {
            console.error('Ошибка при сохранении партии заявок:', error);
            alert(`Не удалось сохранить: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Сохранить';
        }
    }
}