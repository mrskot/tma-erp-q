// public/js/components/LotModal.js
import { BaseModal } from './BaseModal.js';

export class LotModal extends BaseModal {
    constructor() {
        super('lot-modal', 'lot-form');
    }

    show({ mode, lotData = null, masters = [], onSave }) {
        super.show({ onSave });
        const title = this.modalElement.querySelector('.modal-title');

        // Заполняем селекты с мастерами
        ['main_master_id', 'temp_master_id'].forEach(selectName => {
            const select = this.form.elements[selectName];
            select.innerHTML = '<option value="">Не назначен</option>';
            masters.forEach(master => {
                select.innerHTML += `<option value="${master.id}">${master.first_name} ${master.last_name}</option>`;
            });
        });

        if (mode === 'edit' && lotData) {
            title.textContent = 'Редактировать участок';
            Object.keys(lotData).forEach(key => {
                if (this.form.elements[key]) {
                    this.form.elements[key].value = lotData[key] === null ? '' : lotData[key];
                }
            });
        } else {
            title.textContent = 'Создать участок';
        }
    }

    _collectData() {
        const data = super._collectData();

        // Преобразуем пустые строки в null для внешних ключей
        if (data.main_master_id === '') {
            data.main_master_id = null;
        }
        if (data.temp_master_id === '') {
            data.temp_master_id = null;
        }

        return data;
    }
}
