export class BaseModal {
    constructor(modalId, formId) {
        this.modalElement = document.getElementById(modalId);
        this.form = document.getElementById(formId);
        if (!this.modalElement || !this.form) return;
        this.modalElement.querySelector('.close').onclick = () => this.hide();
    }

    populateSelect(selectEl, items, { valueField = 'id', textField = 'name', placeholder = 'Выберите...' } = {}) {
        if (!selectEl) return;
        selectEl.innerHTML = `<option value="">${placeholder}</option>`;
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            selectEl.appendChild(option);
        });
    }

    show(options = {}) {
        this.onSave = options.onSave;
        this.form.reset();
        this.modalElement.style.display = 'block';
    }

    hide() { this.modalElement.style.display = 'none'; }
}