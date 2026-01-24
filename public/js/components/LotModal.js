// public/js/components/LotModal.js

class LotModal {
    constructor() {
        this.modalElement = null;
        this.onSave = null; // Callback
        this.masters = []; // Кэш для списка мастеров
        this.init();
    }

    init() {
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="modal-overlay hidden" id="lot-modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 id="lot-modal-title">Заголовок модального окна</h3>
                        <button class="modal-close-btn" id="lot-modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="lot-form">
                            <input type="hidden" name="id" id="lot-id">
                            
                            <div class="form-group">
                                <label for="lot-name">Название участка</label>
                                <input type="text" id="lot-name" name="name" required placeholder="Например, Сборочный цех №1">
                            </div>
                            
                            <div class="form-group">
                                <label for="lot-code">Код участка</label>
                                <input type="text" id="lot-code" name="code" required placeholder="Например, ASSEMBLY_1">
                            </div>

                            <div class="form-group">
                                <label for="lot-main-master">Основной мастер</label>
                                <select id="lot-main-master" name="main_master_id" required>
                                    <!-- Опции будут загружены динамически -->
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="lot-temp-master">Временный мастер (необязательно)</label>
                                <select id="lot-temp-master" name="temp_master_id">
                                    <!-- Опции будут загружены динамически -->
                                </select>
                            </div>

                            <div class="form-group">
                                <label for="lot-distance">Расстояние до офиса (метры)</label>
                                <input type="number" id="lot-distance" name="distance_to_office" step="0.01" min="0" placeholder="Например, 150.5">
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="button">Сохранить</button>
                                <button type="button" class="button button-secondary" id="lot-modal-cancel-btn">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);

        this.modalOverlay = document.getElementById('lot-modal-overlay');
        this.modalTitle = document.getElementById('lot-modal-title');
        this.form = document.getElementById('lot-form');
        
        document.getElementById('lot-modal-close-btn').addEventListener('click', () => this.hide());
        document.getElementById('lot-modal-cancel-btn').addEventListener('click', () => this.hide());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.hide();
            }
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    populateMastersSelect(masters) {
        this.masters = masters;
        const mainMasterSelect = this.form.elements.main_master_id;
        const tempMasterSelect = this.form.elements.temp_master_id;
        
        mainMasterSelect.innerHTML = '<option value="" disabled selected>-- Выберите мастера --</option>';
        tempMasterSelect.innerHTML = '<option value="">-- Не назначен --</option>';

        this.masters.forEach(master => {
            const option = new Option(`${master.first_name} ${master.last_name} (ID: ${master.id})`, master.id);
            mainMasterSelect.add(option.cloneNode(true));
            tempMasterSelect.add(option.cloneNode(true));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // FIX: Преобразуем ID и числа из строк в числа, пустые значения - в null
        data.main_master_id = data.main_master_id ? parseInt(data.main_master_id, 10) : null;
        data.temp_master_id = data.temp_master_id ? parseInt(data.temp_master_id, 10) : null;
        data.distance_to_office = data.distance_to_office ? parseFloat(data.distance_to_office) : null;

        if (!data.id) {
            delete data.id;
        }

        if (this.onSave) {
            try {
                const submitButton = this.form.querySelector('button[type="submit"]');
                submitButton.disabled = true;
                submitButton.textContent = 'Сохранение...';

                await this.onSave(data);
                this.hide();

            } catch (error) {
                alert(`Не удалось сохранить: ${error.message}`);
            } finally {
                const submitButton = this.form.querySelector('button[type="submit"]');
                submitButton.disabled = false;
                submitButton.textContent = 'Сохранить';
            }
        }
    }

    show({ mode, lotData = null, masters, onSave }) {
        this.onSave = onSave;
        this.populateMastersSelect(masters);
        this.form.reset();

        if (mode === 'edit' && lotData) {
            this.modalTitle.textContent = 'Редактировать участок';
            this.form.elements.id.value = lotData.id || '';
            this.form.elements.name.value = lotData.name || '';
            this.form.elements.code.value = lotData.code || '';
            this.form.elements.main_master_id.value = lotData.main_master_id || '';
            this.form.elements.temp_master_id.value = lotData.temp_master_id || '';
            this.form.elements.distance_to_office.value = lotData.distance_to_office || '';
        } else {
            this.modalTitle.textContent = 'Создать новый участок';
            this.form.elements.id.value = '';
        }

        this.modalOverlay.classList.remove('hidden');
        this.form.elements.name.focus();
    }

    hide() {
        this.modalOverlay.classList.add('hidden');
        this.onSave = null;
    }
}

window.LotModal = new LotModal();