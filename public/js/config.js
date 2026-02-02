// Файл: public/js/config.js

export const ROLES_CONFIG = {
    admin: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'users', 'lots', 'products', 'applications', 'discrepancies'], name: 'Администратор' },
    director: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'lots', 'products', 'applications', 'discrepancies'], name: 'Директор' },
    inspector: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Контролёр ОТК' },
    master: { defaultPage: 'dashboard', allowedPages: ['dashboard', 'applications', 'discrepancies'], name: 'Мастер участка' },
    worker: { defaultPage: 'applications', allowedPages: ['applications'], name: 'Рабочий' }
};

export const PAGE_NAMES = {
    dashboard: 'Главная', 
    users: 'Пользователи', 
    lots: 'Участки',
    products: 'Изделия', 
    applications: 'Заявки', 
    discrepancies: 'Несоответствия'
};
