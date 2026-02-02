// Файл: public/js/router.js
const routes = new Map();

export function addRoute(name, handler) {
    routes.set(name, handler);
}

export function initRouter() {
    // В будущем здесь можно добавить обработку hashchange для полноценного роутинга
    console.log('Router initialized');
}

export function navigate(pageName) {
    const handler = routes.get(pageName);
    if (handler) {
        handler();
    } else {
        console.error(`Route "${pageName}" not found`);
    }
}
