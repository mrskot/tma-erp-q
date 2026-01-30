// public/js/components/LotModal.js

class LotModal {
    constructor() {
        this.modalElement = document.getElementById('lot-modal');
        this.form = document.getElementById('lot-form');
        this.onSave = null;

        if (!this.modalElement || !this.form) {
            console.error('LotModal HTML elements not found in the DOM.');
            return;
        }

        // Назначаем обработчики событий
        this.modalElement.querySelector('.close').addEventListener('click', () => this.hide());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.hide();
        });
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    populateMastersSelect(masters) {
        if (!this.form) return;
        const mainMasterSelect = this.form.elements.main_master_id;
        const tempMasterSelect = this.form.elements.temp_master_id;
        
        const placeholder = '<option value="" selected>-- Не назначен --</option>';
        mainMasterSelect.innerHTML = placeholder;
        tempMasterSelect.innerHTML = placeholder;

        masters.forEach(master => {
            const option = new Option(`${master.first_name} ${master.last_name}`, master.id);
            mainMasterSelect.add(option.cloneNode(true));
            tempMasterSelect.add(option);
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        console.log('Lot data before processing:', data);

        // Преобразуем числовые поля
        data.main_master_id = data.main_master_id ? parseInt(data.main_master_id, 10) : null;
        data.temp_master_id = data.temp_master_id ? parseInt(data.temp_master_id, 10) : null;
        data.distance_to_office = (data.distance_to_office && data.distance_to_office !== '') ? parseFloat(data.distance_to_office) : null;
        data.priority = data.priority ? parseInt(data.priority, 10) : 5; // Значение по умолчанию

        // Удаляем пустой ID при создании
        if (!data.id || data.id === '') {
            delete data.id;
        } else {
            data.id = parseInt(data.id, 10);
        }

        console.log('Lot data after processing (sending):', data);

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

    show({ mode, lotData = null, masters, onSave }) {
        if (!this.modalElement) {
            console.error('LotModal cannot be shown because its HTML elements were not found.');
            return;
        }

        this.onSave = onSave;
        this.populateMastersSelect(masters);
        this.form.reset();

        const title = this.modalElement.querySelector('.modal-title');
        
        if (mode === 'edit' && lotData) {
            title.textContent = 'Редактировать участок';
            this.form.elements.id.value = lotData.id || '';
            this.form.elements.name.value = lotData.name || '';
            this.form.elements.code.value = lotData.code || '';
            this.form.elements.main_master_id.value = lotData.main_master_id || '';
            this.form.elements.temp_master_id.value = lotData.temp_master_id || '';
            this.form.elements.distance_to_office.value = lotData.distance_to_office || '';
        } else {
            title.textContent = 'Создать новый участок';
            this.form.elements.id.value = '';
        }

        this.modalElement.style.display = 'block';
    }

    hide() {
        if (!this.modalElement) return;
        this.modalElement.style.display = 'none';
        this.onSave = null;
    }
}

