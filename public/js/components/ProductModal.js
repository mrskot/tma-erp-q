class ProductModal {
    constructor() {
        this.modal = document.getElementById('product-modal');
        this.form = document.getElementById('product-form');
        this.title = this.modal.querySelector('.modal-title');
        this.closeButton = this.modal.querySelector('.close');

        // Новые поля
        this.lotSelect = document.getElementById('product-lot-id');
        this.previousLotSelect = document.getElementById('product-previous-lot-id');
        this.nextLotSelect = document.getElementById('product-next-lot-id');
        this.inspectorSelect = document.getElementById('product-default-inspector-id');
        this.inspectionTimeInput = document.getElementById('product-inspection-time');
        
        // Управление чек-листом
        this.checklistContainer = document.getElementById('product-checklist-container');
        this.addChecklistItemBtn = document.getElementById('add-checklist-item-btn');

        this.onSave = null;
        this.editMode = false;
        this.productId = null;

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.closeButton.addEventListener('click', () => this.hide());
        this.addChecklistItemBtn.addEventListener('click', () => this.addChecklistItem());
    }

    // --- Методы для заполнения выпадающих списков ---
    
    populateLots(lots = []) {
        const populate = (selectElement) => {
            const currentValue = selectElement.value;
            selectElement.innerHTML = '<option value="">Не указан</option>';
            lots.forEach(lot => {
                if (lot.is_active) {
                    const option = document.createElement('option');
                    option.value = lot.id;
                    option.textContent = `${lot.name} (${lot.code})`;
                    selectElement.appendChild(option);
                }
            });
            selectElement.value = currentValue;
        };
        populate(this.lotSelect);
        populate(this.previousLotSelect);
        populate(this.nextLotSelect);
    }

    populateInspectors(inspectors = []) {
        const currentValue = this.inspectorSelect.value;
        this.inspectorSelect.innerHTML = '<option value="">Не назначен</option>';
        inspectors.forEach(inspector => {
            const option = document.createElement('option');
            option.value = inspector.id;
            option.textContent = `${inspector.first_name} ${inspector.last_name}`;
            this.inspectorSelect.appendChild(option);
        });
        this.inspectorSelect.value = currentValue;
    }

    // --- Методы для управления чек-листом ---

    renderChecklist(checklistData = []) {
        this.checklistContainer.innerHTML = '';
        let checklist = checklistData;

        // NEW: Если данные пришли в виде JSON-строки, парсим их.
        if (typeof checklist === 'string' && checklist.trim().startsWith('[')) {
            try {
                checklist = JSON.parse(checklist);
            } catch (e) {
                console.error('Ошибка парсинга JSON в чек-листе:', e);
                checklist = []; // В случае ошибки, показываем пустой список
            }
        }

        if (Array.isArray(checklist)) {
            checklist.forEach(item => {
                const taskText = typeof item === 'string' ? item : (item.task || '');
                this.addChecklistItem(taskText);
            });
        }
    }

    addChecklistItem(task = '') {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'checklist-item';

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'checklist-item-input';
        input.placeholder = 'Текст пункта...';
        input.value = task;

        const removeBtn = document.createElement('span');
        removeBtn.className = 'checklist-item-remove';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = () => itemDiv.remove();

        itemDiv.appendChild(input);
        itemDiv.appendChild(removeBtn);
        this.checklistContainer.appendChild(itemDiv);
    }
    
    getChecklistFromDOM() {
        const items = [];
        this.checklistContainer.querySelectorAll('.checklist-item-input').forEach(input => {
            const task = input.value.trim();
            if (task) {
                items.push({ task });
            }
        });
        return items;
    }

    // --- Основные методы модального окна ---

    show({ mode = 'create', productData = null, lots = [], inspectors = [], onSave = () => {} }) {
        this.onSave = onSave;
        this.editMode = mode === 'edit';
        this.form.reset();
        this.productId = productData ? productData.id : null;
        
        this.title.textContent = this.editMode ? 'Редактировать изделие' : 'Создать изделие';
        
        this.populateLots(lots);
        this.populateInspectors(inspectors);

        if (this.editMode && productData) {
            // Заполнение основных полей
            this.form.elements.name.value = productData.name || '';
            this.form.elements.type.value = productData.product_type || 'finished';
            this.lotSelect.value = productData.lot_id || '';
            
            // Заполнение новых полей
            this.previousLotSelect.value = productData.previous_lot_id || '';
            this.nextLotSelect.value = productData.next_lot_id || '';
            this.inspectorSelect.value = productData.default_inspector_id || '';
            this.inspectionTimeInput.value = productData.inspection_time_minutes || '';

            // Рендеринг чек-листа
            this.renderChecklist(productData.checklist);
        } else {
            // Очистка для нового изделия
            this.renderChecklist([]);
        }

        this.modal.style.display = 'block';
    }



    hide() {
        this.modal.style.display = 'none';
        this.form.reset();
        this.checklistContainer.innerHTML = ''; // Очистка чек-листа
    }

    async handleSubmit(event) {
        event.preventDefault();

        const finalData = {
            name: this.form.elements.name.value.trim(),
            product_type: this.form.elements.type.value,
            lot_id: this.lotSelect.value ? parseInt(this.lotSelect.value) : null,
            previous_lot_id: this.previousLotSelect.value ? parseInt(this.previousLotSelect.value) : null,
            next_lot_id: this.nextLotSelect.value ? parseInt(this.nextLotSelect.value) : null,
            default_inspector_id: this.inspectorSelect.value ? parseInt(this.inspectorSelect.value) : null,
            inspection_time_minutes: this.inspectionTimeInput.value ? parseInt(this.inspectionTimeInput.value) : null,
            checklist: this.getChecklistFromDOM()
        };
        
        if (!finalData.name) {
            alert('Название изделия не может быть пустым.');
            return;
        }

        try {
            if (this.onSave) {
                 await this.onSave(finalData);
            }
        } catch (error) {
            console.error('Ошибка при сохранении изделия:', error);
            alert(`Не удалось сохранить изделие. ${error.message}`);
        }
    }
}