export class BaseModal {
    constructor(modalId, formId) {
        this.modalElement = document.getElementById(modalId);
        this.form = document.getElementById(formId);
        if (!this.modalElement || !this.form) {
            console.error(`Modal or Form not found for ID: ${modalId}`);
            return;
        }
        this.modalElement.querySelector('.close').onclick = () => this.hide();
        
        // FIX: The core logic to handle form submission was missing.
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    populateSelect(selectEl, items, { valueField = 'id', textField = 'name', placeholder = 'Выберите...' } = {}) {
        if (!selectEl) return;
        selectEl.innerHTML = `<option value="">${placeholder}</option>`;
        (items || []).forEach(item => { // Defensive check for items
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

    hide() { 
        this.modalElement.style.display = 'none'; 
    }

    // This method collects simple form data. Child classes can override it for complex forms.
    _collectData() {
        const formData = new FormData(this.form);
        return Object.fromEntries(formData.entries());
    }

    async handleSubmit(e) {
        e.preventDefault();
        if (this.onSave) {
            const data = this._collectData();
            // The onSave callback is the API call defined on the page (e.g., users.js)
            await this.onSave(data);
        }
    }
}