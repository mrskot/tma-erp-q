// Фейковый Telegram WebApp SDK для разработки
// Используется когда нет реального Telegram WebApp

(function() {
    console.log('Loading Fake Telegram WebApp SDK for development...');

    // Если уже есть настоящий Telegram SDK, не переопределяем
    if (window.Telegram && window.Telegram.WebApp) {
        console.log('Real Telegram WebApp SDK detected, skipping fake SDK');
        return;
    }

    // Создаём фейковый объект Telegram
    window.Telegram = {
        WebApp: {
            // Основные свойства
            initData: '',
            initDataUnsafe: {},
            version: '6.7',
            platform: 'web',
            colorScheme: 'light',
            themeParams: {
                bg_color: '#ffffff',
                text_color: '#000000',
                hint_color: '#999999',
                link_color: '#2481cc',
                button_color: '#2481cc',
                button_text_color: '#ffffff'
            },
            viewportHeight: 600,
            viewportStableHeight: 600,
            isExpanded: true,
            headerColor: '#2481cc',
            backgroundColor: '#ffffff',
            
            // Методы
            ready: function() {
                console.log('Fake Telegram WebApp: ready() called');
            },
            
            expand: function() {
                console.log('Fake Telegram WebApp: expand() called');
                this.isExpanded = true;
            },
            
            close: function() {
                console.log('Fake Telegram WebApp: close() called');
                alert('В реальном Telegram приложение закрылось бы');
            },
            
            showAlert: function(message, callback) {
                alert('Telegram Alert: ' + message);
                if (callback) callback();
            },
            
            showConfirm: function(message, callback) {
                const result = confirm('Telegram Confirm: ' + message);
                if (callback) callback(result);
            },
            
            showPopup: function(params, callback) {
                console.log('Fake Telegram WebApp: showPopup', params);
                if (callback) callback(params.button_id || 'ok');
            },
            
            setHeaderColor: function(color) {
                console.log('Fake Telegram WebApp: setHeaderColor', color);
                this.headerColor = color;
            },
            
            setBackgroundColor: function(color) {
                console.log('Fake Telegram WebApp: setBackgroundColor', color);
                this.backgroundColor = color;
            },
            
            enableClosingConfirmation: function() {
                console.log('Fake Telegram WebApp: enableClosingConfirmation');
            },
            
            disableClosingConfirmation: function() {
                console.log('Fake Telegram WebApp: disableClosingConfirmation');
            },
            
            // Кнопка "Назад"
            BackButton: {
                isVisible: false,
                show: function() {
                    console.log('Fake Telegram WebApp: BackButton.show()');
                    this.isVisible = true;
                },
                hide: function() {
                    console.log('Fake Telegram WebApp: BackButton.hide()');
                    this.isVisible = false;
                },
                onClick: function(callback) {
                    console.log('Fake Telegram WebApp: BackButton.onClick handler set');
                    // В фейковом режиме обрабатываем нажатие кнопки браузера "Назад"
                    window.addEventListener('popstate', function() {
                        if (window.Telegram.WebApp.BackButton.isVisible) {
                            callback();
                        }
                    });
                },
                offClick: function(callback) {
                    console.log('Fake Telegram WebApp: BackButton.offClick');
                }
            },
            
            // Главная кнопка
            MainButton: {
                text: 'CONTINUE',
                color: '#2481cc',
                textColor: '#ffffff',
                isVisible: false,
                isActive: true,
                isProgressVisible: false,
                
                setText: function(text) {
                    console.log('Fake Telegram WebApp: MainButton.setText', text);
                    this.text = text;
                },
                
                show: function() {
                    console.log('Fake Telegram WebApp: MainButton.show()');
                    this.isVisible = true;
                    this.updateFakeButton();
                },
                
                hide: function() {
                    console.log('Fake Telegram WebApp: MainButton.hide()');
                    this.isVisible = false;
                    this.removeFakeButton();
                },
                
                enable: function() {
                    console.log('Fake Telegram WebApp: MainButton.enable()');
                    this.isActive = true;
                    this.updateFakeButton();
                },
                
                disable: function() {
                    console.log('Fake Telegram WebApp: MainButton.disable()');
                    this.isActive = false;
                    this.updateFakeButton();
                },
                
                showProgress: function(leaveActive) {
                    console.log('Fake Telegram WebApp: MainButton.showProgress', leaveActive);
                    this.isProgressVisible = true;
                    this.updateFakeButton();
                },
                
                hideProgress: function() {
                    console.log('Fake Telegram WebApp: MainButton.hideProgress');
                    this.isProgressVisible = false;
                    this.updateFakeButton();
                },
                
                setParams: function(params) {
                    console.log('Fake Telegram WebApp: MainButton.setParams', params);
                    if (params.text) this.text = params.text;
                    if (params.color) this.color = params.color;
                    if (params.text_color) this.textColor = params.text_color;
                    this.updateFakeButton();
                },
                
                onClick: function(callback) {
                    console.log('Fake Telegram WebApp: MainButton.onClick handler set');
                    this.onClickCallback = callback;
                    this.updateFakeButton();
                },
                
                offClick: function(callback) {
                    console.log('Fake Telegram WebApp: MainButton.offClick');
                    this.onClickCallback = null;
                },
                
                // Вспомогательные методы для фейковой кнопки
                updateFakeButton: function() {
                    this.removeFakeButton();
                    
                    if (this.isVisible) {
                        const button = document.createElement('button');
                        button.id = 'fake-telegram-main-button';
                        button.className = 'fake-telegram-main-button';
                        button.textContent = this.text;
                        button.style.cssText = `
                            position: fixed;
                            bottom: 20px;
                            left: 50%;
                            transform: translateX(-50%);
                            background-color: ${this.color};
                            color: ${this.textColor};
                            border: none;
                            border-radius: 10px;
                            padding: 12px 24px;
                            font-size: 16px;
                            font-weight: 500;
                            z-index: 10000;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                            opacity: ${this.isActive ? '1' : '0.5'};
                            cursor: ${this.isActive ? 'pointer' : 'not-allowed'};
                            min-width: 200px;
                            text-align: center;
                        `;
                        
                        if (this.isProgressVisible) {
                            button.innerHTML = `
                                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <div class="spinner" style="
                                        width: 16px;
                                        height: 16px;
                                        border: 2px solid rgba(255,255,255,0.3);
                                        border-radius: 50%;
                                        border-top-color: #fff;
                                        animation: spin 1s linear infinite;
                                    "></div>
                                    ${this.text}
                                </div>
                            `;
                            
                            // Добавляем анимацию
                            const style = document.createElement('style');
                            style.textContent = `
                                @keyframes spin {
                                    0% { transform: rotate(0deg); }
                                    100% { transform: rotate(360deg); }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        if (this.isActive && this.onClickCallback) {
                            button.addEventListener('click', (e) => {
                                e.preventDefault();
                                this.onClickCallback();
                            });
                        }
                        
                        document.body.appendChild(button);
                    }
                },
                
                removeFakeButton: function() {
                    const existingButton = document.getElementById('fake-telegram-main-button');
                    if (existingButton) {
                        existingButton.remove();
                    }
                }
            },
            
            // Всплывающее окно
            showPopup: function(params, callback) {
                console.log('Fake Telegram WebApp: showPopup', params);
                
                const popup = document.createElement('div');
                popup.className = 'fake-telegram-popup';
                popup.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                `;
                
                const popupContent = document.createElement('div');
                popupContent.style.cssText = `
                    background: white;
                    border-radius: 12px;
                    padding: 20px;
                    max-width: 300px;
                    width: 90%;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
                `;
                
                if (params.title) {
                    const title = document.createElement('h3');
                    title.textContent = params.title;
                    title.style.marginTop = '0';
                    popupContent.appendChild(title);
                }
                
                if (params.message) {
                    const message = document.createElement('p');
                    message.textContent = params.message;
                    popupContent.appendChild(message);
                }
                
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.cssText = `
                    display: flex;
                    justify-content: flex-end;
                    gap: 10px;
                    margin-top: 20px;
                `;
                
                const buttons = params.buttons || [{ type: 'ok', text: 'OK' }];
                
                buttons.forEach(btn => {
                    const button = document.createElement('button');
                    button.textContent = btn.text;
                    button.style.cssText = `
                        padding: 8px 16px;
                        border: none;
                        border-radius: 6px;
                        background: ${btn.type === 'destructive' ? '#ff3b30' : '#2481cc'};
                        color: white;
                        cursor: pointer;
                    `;
                    
                    button.addEventListener('click', () => {
                        popup.remove();
                        if (callback) callback(btn.id || 'ok');
                    });
                    
                    buttonsContainer.appendChild(button);
                });
                
                popupContent.appendChild(buttonsContainer);
                popup.appendChild(popupContent);
                document.body.appendChild(popup);
                
                // Закрытие по клику на фон
                popup.addEventListener('click', (e) => {
                    if (e.target === popup) {
                        popup.remove();
                        if (callback) callback('cancel');
                    }
                });
            },
            
            // Инициализация фейковых данных пользователя
            initFakeUserData: function() {
                // Получаем роль из симулятора или localStorage
                const simulatorRole = localStorage.getItem('telegram_simulator_role') || 'inspector';
                const urlParams = new URLSearchParams(window.location.search);
                const simulateParam = urlParams.get('simulate');
                const role = simulateParam || simulatorRole;
                
                const fakeUsers = {
                    admin: {
                        id: 'admin_123', // Соответствует dev.sqlite3
                        first_name: 'Алексей',
                        last_name: 'Администраторов',
                        username: 'tma_admin',
                        language_code: 'ru'
                    },
                    director: {
                        id: 'director_456', // Соответствует dev.sqlite3
                        first_name: 'Иван',
                        last_name: 'Директоров',
                        username: 'tma_director',
                        language_code: 'ru'
                    },
                    inspector: {
                        id: 'inspector_789', // Соответствует dev.sqlite3
                        first_name: 'Мария',
                        last_name: 'Инспекторова',
                        username: 'tma_inspector',
                        language_code: 'ru'
                    },
                    master: {
                        id: 'master_111', // Соответствует dev.sqlite3
                        first_name: 'Петр',
                        last_name: 'Мастеров',
                        username: 'tma_master',
                        language_code: 'ru'
                    },
                    worker: {
                        id: 'worker_444', // Соответствует dev.sqlite3
                        first_name: 'Сергей',
                        last_name: 'Рабочий',
                        username: 'tma_worker',
                        language_code: 'ru'
                    }
                };
                
                const user = fakeUsers[role] || fakeUsers.inspector;
                
                this.initDataUnsafe = {
                    user: user,
                    chat: null,
                    chat_type: 'private',
                    chat_instance: '',
                    start_param: '',
                    auth_date: Math.floor(Date.now() / 1000),
                    hash: 'fake_hash_for_development'
                };
                
                this.initData = `user=${JSON.stringify(user)}&auth_date=${this.initDataUnsafe.auth_date}&hash=${this.initDataUnsafe.hash}`;
                
                console.log('Fake Telegram WebApp: Initialized with user role:', role, user);
            }
        }
    };

    // Инициализируем фейковые данные пользователя
    setTimeout(() => {
        window.Telegram.WebApp.initFakeUserData();
        
        // Симулируем событие ready
        window.Telegram.WebApp.ready();
        
        console.log('Fake Telegram WebApp SDK loaded successfully');
        
        // Диспатчим событие загрузки Telegram SDK
        window.dispatchEvent(new Event('telegram-sdk-loaded'));
    }, 100);

})();

// Стили для фейковой кнопки Telegram
const fakeTelegramStyles = document.createElement('style');
fakeTelegramStyles.textContent = `
    .fake-telegram-main-button {
        transition: all 0.2s ease;
    }
    
    .fake-telegram-main-button:hover {
        transform: translateX(-50%) scale(1.02);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    
    .fake-telegram-main-button:active {
        transform: translateX(-50%) scale(0.98);
    }
    
    .fake-telegram-popup {
        animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(fakeTelegramStyles);