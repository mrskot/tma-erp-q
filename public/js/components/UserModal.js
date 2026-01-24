// public/js/components/UserModal.js

class UserModal {
    constructor() {
        this.modalElement = null;
        this.onSave = null; // Callback функция для сохранения данных
        this.init();
    }

    init() {
        // Создаем базовую разметку в памяти, но не добавляем в DOM
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = `
            <div class="modal-overlay hidden" id="user-modal-overlay">
                <div class="modal">
                    <div class="modal-header">
                        <h3 id="user-modal-title">Заголовок модального окна</h3>
                        <button class="modal-close-btn" id="user-modal-close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="user-form">
                            <input type="hidden" name="id" id="user-id">
                            
                            <div class="form-group">
                                <label for="user-first-name">Имя</label>
                                <input type="text" id="user-first-name" name="first_name" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="user-last-name">Фамилия</label>
                                <input type="text" id="user-last-name" name="last_name">
                            </div>

                            <div class="form-group">
                                <label for="user-role">Роль</label>
                                <select id="user-role" name="role" required>
                                    <option value="worker">Рабочий</option>
                                    <option value="master">Мастер участка</option>
                                    <option value="inspector">Контролёр ОТК</option>
                                    <option value="director">Директор</option>
                                    <option value="admin">Администратор</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="user-telegram-id">Telegram ID</label>
                                <input type="text" id="user-telegram-id" name="telegram_id" placeholder="Например, 123456789">
                            </div>

                            <div class="form-group">
                                <label for="user-bitrix-id">Bitrix ID</label>
                                <input type="number" id="user-bitrix-id" name="bitrix_id" placeholder="Например, 987">
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="button">Сохранить</button>
                                <button type="button" class="button button-secondary" id="user-modal-cancel-btn">Отмена</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalContainer);

        this.modalOverlay = document.getElementById('user-modal-overlay');
        this.modalTitle = document.getElementById('user-modal-title');
        this.form = document.getElementById('user-form');
        
        // Назначаем обработчики событий
        document.getElementById('user-modal-close-btn').addEventListener('click', () => this.hide());
        document.getElementById('user-modal-cancel-btn').addEventListener('click', () => this.hide());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.hide();
            }
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(this.form);
        const data = Object.fromEntries(formData.entries());

        // Преобразуем пустые строки в null для числовых полей
        if (data.bitrix_id === '') {
            data.bitrix_id = null;
        } else if (data.bitrix_id) {
            data.bitrix_id = parseInt(data.bitrix_id, 10);
        }

        // FIX: При создании пользователя (когда ID пуст), его не нужно отправлять.
        // Бэкенд должен сгенерировать его сам.
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
                // TODO: Показать ошибку пользователю
                console.error("Ошибка сохранения:", error);
                alert(`Не удалось сохранить: ${error.message}`);
            } finally {
                const submitButton = this.form.querySelector('button[type="submit"]');
                submitButton.disabled = false;
                submitButton.textContent = 'Сохранить';
            }
        }
    }

    /**
     * @param {object} [config] - Конфигурация модального окна
     * @param {'create' | 'edit'} config.mode - Режим работы 'create' или 'edit'
     * @param {object} [config.userData] - Данные пользователя для режима 'edit'
     * @param {(data: object) => Promise<void>} config.onSave - Callback при сохранении
     */
    show({ mode, userData = null, onSave }) {
        this.onSave = onSave;
        this.form.reset();

        if (mode === 'edit') {
            this.modalTitle.textContent = 'Редактировать пользователя';
            this.form.elements.id.value = userData.id || '';
            this.form.elements.first_name.value = userData.first_name || '';
            this.form.elements.last_name.value = userData.last_name || '';
            this.form.elements.role.value = userData.role || 'worker';
            this.form.elements.telegram_id.value = userData.telegram_id || '';
            this.form.elements.bitrix_id.value = userData.bitrix_id || '';
        } else {
            this.modalTitle.textContent = 'Создать нового пользователя';
            this.form.elements.id.value = ''; // Убедимся, что ID пуст
        }

        this.modalOverlay.classList.remove('hidden');
        this.form.elements.first_name.focus();
    }

    hide() {
        this.modalOverlay.classList.add('hidden');
        this.onSave = null;
    }
}

// Создаем глобальный экземпляр, чтобы App мог его использовать
window.UserModal = new UserModal();
