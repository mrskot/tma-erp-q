// Telegram Mini App специфичная логика для TMA-ERP

class TelegramApp {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.isTelegram = !!this.tg;
        this.init();
    }

    init() {
        if (!this.isTelegram) {
            console.log('Running in non-Telegram environment');
            return;
        }

        console.log('Telegram Mini App initialized');
        
        // Инициализация Telegram WebApp
        this.tg.ready();
        this.tg.expand();
        
        // Настройка темы
        this.setupTheme();
        
        // Настройка кнопки "Назад"
        this.setupBackButton();
        
        // Настройка главной кнопки
        this.setupMainButton();
        
        // Обработка изменений темы
        this.setupThemeChangeHandler();
    }

    setupTheme() {
        if (!this.isTelegram) return;

        const themeParams = this.tg.themeParams;
        
        // Применяем тему к документу
        document.documentElement.style.setProperty('--tg-bg-color', themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-text-color', themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-hint-color', themeParams.hint_color || '#999999');
        document.documentElement.style.setProperty('--tg-link-color', themeParams.link_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-button-color', themeParams.button_color || '#2481cc');
        document.documentElement.style.setProperty('--tg-button-text-color', themeParams.button_text_color || '#ffffff');
        
        // Устанавливаем цвет заголовка
        this.tg.setHeaderColor(themeParams.bg_color || '#ffffff');
        
        // Устанавливаем цвет фона
        this.tg.setBackgroundColor(themeParams.bg_color || '#ffffff');
    }

    setupBackButton() {
        if (!this.isTelegram) return;

        // Показываем кнопку "Назад" когда нужно
        const showBackButton = () => {
            const currentHash = window.location.hash.substring(1);
            const noBackRoutes = ['login', 'admin-dashboard', 'director-dashboard', 'applications', 'lots', 'tasks'];
            
            if (!noBackRoutes.includes(currentHash)) {
                this.tg.BackButton.show();
            } else {
                this.tg.BackButton.hide();
            }
        };

        // Обработчик нажатия кнопки "Назад"
        this.tg.BackButton.onClick(() => {
            window.history.back();
        });

        // Следим за изменениями hash
        window.addEventListener('hashchange', showBackButton);
        
        // Инициализируем при загрузке
        showBackButton();
    }

    setupMainButton() {
        if (!this.isTelegram) return;

        this.mainButton = this.tg.MainButton;
        this.mainButton.hide();
        
        // Конфигурация кнопки по умолчанию
        this.mainButton.setParams({
            text: 'Продолжить',
            color: this.tg.themeParams.button_color || '#2481cc',
            text_color: this.tg.themeParams.button_text_color || '#ffffff'
        });
    }

    setupThemeChangeHandler() {
        if (!this.isTelegram) return;

        // Обработка изменения темы
        // Telegram WebApp API не имеет встроенного обработчика для themeChanged
        // Можно использовать Telegram.WebApp.onEvent если доступно
        if (this.tg.onEvent && typeof this.tg.onEvent === 'function') {
            try {
                this.tg.onEvent('themeChanged', () => {
                    this.setupTheme();
                });
            } catch (e) {
                console.log('Theme change handler not available');
            }
        }
    }

    // Методы для управления главной кнопкой
    showMainButton(text, onClick) {
        if (!this.isTelegram) {
            // В не-Telegram среде создаём фейковую кнопку
            this.showFakeMainButton(text, onClick);
            return;
        }

        if (text) {
            this.mainButton.setText(text);
        }
        
        if (onClick) {
            this.mainButton.onClick(onClick);
        }
        
        this.mainButton.show();
        this.mainButton.enable();
    }

    hideMainButton() {
        if (!this.isTelegram) {
            this.hideFakeMainButton();
            return;
        }
        
        this.mainButton.hide();
        this.mainButton.offClick();
    }

    enableMainButton() {
        if (!this.isTelegram) return;
        this.mainButton.enable();
    }

    disableMainButton() {
        if (!this.isTelegram) return;
        this.mainButton.disable();
    }

    showMainButtonProgress() {
        if (!this.isTelegram) return;
        this.mainButton.showProgress();
    }

    hideMainButtonProgress() {
        if (!this.isTelegram) return;
        this.mainButton.hideProgress();
    }

    // Методы для фейковой кнопки в не-Telegram среде
    showFakeMainButton(text, onClick) {
        // Удаляем существующую кнопку
        this.hideFakeMainButton();
        
        const button = document.createElement('button');
        button.className = 'fake-main-button';
        button.textContent = text || 'Продолжить';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: var(--tg-button-color, #2481cc);
            color: var(--tg-button-text-color, #ffffff);
            border: none;
            border-radius: 10px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            cursor: pointer;
            min-width: 200px;
            text-align: center;
        `;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (onClick) onClick();
        });
        
        document.body.appendChild(button);
        this.fakeMainButton = button;
    }

    hideFakeMainButton() {
        if (this.fakeMainButton) {
            this.fakeMainButton.remove();
            this.fakeMainButton = null;
        }
    }

    // Методы для всплывающих окон
    showAlert(message, callback) {
        if (this.isTelegram) {
            this.tg.showAlert(message, callback);
        } else {
            alert(message);
            if (callback) callback();
        }
    }

    showConfirm(message, callback) {
        if (this.isTelegram) {
            this.tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            if (callback) callback(result);
        }
    }

    showPopup(params, callback) {
        if (this.isTelegram) {
            this.tg.showPopup(params, callback);
        } else {
            // Простая реализация для не-Telegram среды
            const message = params.message || '';
            const title = params.title || '';
            const buttons = params.buttons || [{ type: 'ok', text: 'OK' }];
            
            let result = '';
            buttons.forEach(btn => {
                if (btn.type === 'ok' || btn.id === 'ok') {
                    result = btn.id || 'ok';
                }
            });
            
            alert(title + (title && message ? '\n' : '') + message);
            if (callback) callback(result);
        }
    }

    // Получение данных пользователя из Telegram
    getUserData() {
        if (!this.isTelegram) {
            return this.getFakeUserData();
        }
        
        return this.tg.initDataUnsafe?.user || null;
    }

    getFakeUserData() {
        // Для разработки: получаем данные из fake-telegram.js
        if (window.Telegram?.WebApp?.initDataUnsafe?.user) {
            return window.Telegram.WebApp.initDataUnsafe.user;
        }
        
        // Или создаём фейковые данные
        return {
            id: 123456789,
            first_name: 'Тестовый',
            last_name: 'Пользователь',
            username: 'test_user',
            language_code: 'ru'
        };
    }

    // Проверка, запущено ли в Telegram
    isInTelegram() {
        return this.isTelegram;
    }

    // Закрытие приложения
    closeApp() {
        if (this.isTelegram) {
            this.tg.close();
        } else {
            console.log('App would close in Telegram environment');
        }
    }

    // Включение подтверждения закрытия
    enableClosingConfirmation() {
        if (this.isTelegram) {
            this.tg.enableClosingConfirmation();
        }
    }

    // Выключение подтверждения закрытия
    disableClosingConfirmation() {
        if (this.isTelegram) {
            this.tg.disableClosingConfirmation();
        }
    }
}

// Создаём глобальный экземпляр TelegramApp
window.TelegramApp = new TelegramApp();

// Экспортируем для использования в других файлах
window.TelegramAppClass = TelegramApp;