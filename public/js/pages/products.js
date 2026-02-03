// public/js/pages/products.js
import api from '../api.js';
import store from '../store.js';

let productModal; // Ссылка на модалку
let state = { filter: 'active' };

async function loadDataAndUpdateView() {
    try {
        const [productsRes, lotsRes] = await Promise.all([api.getProducts('all'), api.getLots('active')]);
        store.setProducts(productsRes.data);
        store.setLots(lotsRes.data);
        render();
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    const productsToRender = store.state.products.filter(p => state.filter === 'all' || !!p.is_active === (state.filter === 'active'));

    const tableRows = productsToRender.map(product => {
        const isInactive = !product.is_active;
        const actionButtons = isInactive
            ? `<button class="button-small button-success" data-product-id="${product.id}" data-action="restore">🔄️</button>`
            : `<button class="button-small button-secondary" data-product-id="${product.id}" data-action="edit">✏️</button>
               <button class="button-small button-danger" data-product-id="${product.id}" data-action="delete">🗑️</button>`;
        const lot = store.getLotById(product.lot_id);
        return `
            <tr class="${isInactive ? 'inactive-user' : ''}" data-product-id="${product.id}">
                <td>${product.id}</td><td>${product.name}</td><td>${lot?.name || '—'}</td>
                <td>${(product.checklist || []).length} п.</td><td class="actions">${actionButtons}</td>
            </tr>`;
    }).join('');

    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="page-header"><h3>Управление изделиями</h3>
            <div class="page-controls">
                <select class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button" data-action="create">✨ Создать</button>
            </div>
        </div>
        <table class="crud-table">
            <thead><tr><th>ID</th><th>Название</th><th>Участок</th><th>Чек-лист</th><th>Действия</th></tr></thead>
            <tbody>${tableRows}</tbody>
        </table>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const productId = button.closest('tr')?.dataset.productId || button.dataset.productId;

    switch (action) {
        case 'create':
            productModal.show({ mode: 'create', lots: store.state.lots, onSave: async (data) => {
                await api.createProduct(data); productModal.hide(); await loadDataAndUpdateView();
            }});
            break;
        case 'edit':
            productModal.show({ mode: 'edit', lots: store.state.lots, productData: store.getProductById(productId), onSave: async (data) => {
                await api.updateProduct(productId, data); productModal.hide(); await loadDataAndUpdateView();
            }});
            break;
        case 'delete':
            if (confirm('Деактивировать изделие?')) api.deleteProduct(productId).then(loadDataAndUpdateView);
            break;
        case 'restore':
            if (confirm('Восстановить изделие?')) api.reactivateProduct(productId).then(loadDataAndUpdateView);
            break;
    }
}

export async function init(container, modals) {
    productModal = modals.product; // Получаем экземпляр
    container.innerHTML = `<h2>Загрузка...</h2>`;
    
    container.addEventListener('click', handlePageClick);
    container.addEventListener('change', e => {
        if (e.target.classList.contains('page-filter')) {
            state.filter = e.target.value; render();
        }
    });
    
    await loadDataAndUpdateView();
}