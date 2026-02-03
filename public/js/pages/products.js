// public/js/pages/products.js
import api from '../api.js';
import store from '../store.js';

let productModal; // Ссылка на модалку
let state = { filter: 'active' };

async function loadDataAndUpdateView() {
    try {
        // Запрашиваем ВСЕГДА ВСЕ ДАННЫЕ, чтобы избежать рассинхрона
        const [productsRes, lotsRes] = await Promise.all([api.getProducts('all'), api.getLots('active')]);
        store.setProducts(productsRes.data);
        store.setLots(lotsRes.data);
        render(); // render() сам отфильтрует данные по state.filter
    } catch (error) {
        document.getElementById('page-content').innerHTML = `<p class="error-message">Ошибка загрузки: ${error.message}</p>`;
    }
}

function render() {
    const productsToRender = store.state.products.filter(p => state.filter === 'all' || !!p.is_active === (state.filter === 'active'));

    const productCards = productsToRender.map(product => {
        const isInactive = !product.is_active;
        const actionButtons = isInactive
            ? `<button class="button-action btn-restore" data-product-id="${product.id}" data-action="restore">Восстановить</button>`
            : `<button class="button-action btn-edit" data-product-id="${product.id}" data-action="edit">✏️ Правка</button>
               <button class="button-action btn-delete" data-product-id="${product.id}" data-action="delete">🗑️ Удалить</button>`;
        const lot = store.getLotById(product.lot_id);
        
        return `
            <div class="mobile-card ${isInactive ? 'inactive' : ''}" data-product-id="${product.id}">
                <div class="card-header">
                    <span class="card-id">ID: ${product.id}</span>
                    <span class="status-badge" style="background: ${product.inspection_mode === 'hard' ? '#fff1f2' : '#f0fdf4'}; color: ${product.inspection_mode === 'hard' ? '#e11d48' : '#16a34a'}; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                        ${product.inspection_mode === 'hard' ? '🛡️ HARD' : '🚀 LITE'}
                    </span>
                </div>
                <div class="card-main-info">${product.name}</div>
                <div class="card-sub-info">${lot?.name || '—'}</div>
                <div class="card-actions">
                    ${actionButtons}
                </div>
            </div>`;
    }).join('');

    const container = document.getElementById('page-content');
    container.innerHTML = `
        <div class="page-header">
            <h3>Изделия</h3>
            <div class="page-controls">
                <select class="page-filter">
                    <option value="active" ${state.filter === 'active' ? 'selected' : ''}>Активные</option>
                    <option value="inactive" ${state.filter === 'inactive' ? 'selected' : ''}>Неактивные</option>
                    <option value="all" ${state.filter === 'all' ? 'selected' : ''}>Все</option>
                </select>
                <button class="button button-small" data-action="create">✨ Создать</button>
            </div>
        </div>
        <div class="task-grid">
            ${productCards || '<p class="empty-state">Изделия не найдены.</p>'}
        </div>`;
}

function handlePageClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const productId = button.closest('.mobile-card')?.dataset.productId || button.dataset.productId;

    switch (action) {
        case 'create':
            productModal.show({ 
                mode: 'create', 
                lots: store.state.lots, 
                onSave: async (data) => {
                    try {
                        // Обработка чек-листа перед отправкой
                        if (data.checklist) {
                            data.checklist = data.checklist.split('\n').map(item => item.trim()).filter(item => item);
                        }
                        await api.createProduct(data); 
                        productModal.hide(); 
                        await loadDataAndUpdateView();
                    } catch (error) {
                        alert(`Ошибка создания: ${error.message}`);
                    }
                }
            });
            break;
        case 'edit':
            productModal.show({ 
                mode: 'edit', 
                lots: store.state.lots, 
                productData: store.getProductById(productId), 
                onSave: async (data) => {
                    try {
                         if (data.checklist) {
                            data.checklist = data.checklist.split('\n').map(item => item.trim()).filter(item => item);
                        }
                        await api.updateProduct(productId, data); 
                        productModal.hide(); 
                        await loadDataAndUpdateView();
                    } catch (error) {
                        alert(`Ошибка обновления: ${error.message}`);
                    }
                }
            });
            break;
        case 'delete':
            if (confirm('Деактивировать изделие?')) {
                api.deleteProduct(productId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка удаления: ${error.message}`));
            }
            break;
        case 'restore':
            if (confirm('Восстановить изделие?')) {
                api.reactivateProduct(productId)
                    .then(loadDataAndUpdateView)
                    .catch(error => alert(`Ошибка восстановления: ${error.message}`));
            }
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