import { getItems, createItem, updateItem, deleteItem, getItemById } from './api.js';

document.addEventListener('DOMContentLoaded', initAdmin);

const form = document.getElementById('item-form');
const tbody = document.getElementById('items-tbody');
const table = document.getElementById('items-table');
const loading = document.getElementById('table-loading');
const errorMsg = document.getElementById('table-error');
const formTitle = document.getElementById('form-title');
const btnCancel = document.getElementById('btn-cancel');
const btnSubmit = document.getElementById('btn-submit');
const deleteModal = document.getElementById('delete-modal');
const formModal = document.getElementById('form-modal');
const btnCreateNew = document.getElementById('btn-create-new');

let currentItems = [];
let deleteIdTarget = null;

async function initAdmin() {
    await fetchAndRenderItems();
    initForm();
    initDeleteModal();

    if (btnCreateNew) {
        btnCreateNew.addEventListener('click', () => {
            resetForm();
            formModal.classList.add('is-open');
        });
    }
}

async function fetchAndRenderItems() {
    loading.hidden = false;
    table.hidden = true;
    errorMsg.hidden = true;

    try {
        currentItems = await getItems('_sort=id&_order=desc');
        renderTable(currentItems);
        loading.hidden = true;
        table.hidden = false;
    } catch (err) {
        loading.hidden = true;
        errorMsg.hidden = false;
    }
}

function renderTable(items) {
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#64748b;">Немає записів</td></tr>';
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <img src="${escapeHtml(item.image)}" alt="Thumbnail" class="item-thumbnail" onerror="this.src='https://via.placeholder.com/48?text=N/A'">
                    <div>
                        <strong style="color: #0f172a; font-size: 0.95rem;">${escapeHtml(item.title)}</strong>
                        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">ID: ${item.id}</div>
                    </div>
                </div>
            </td>
            <td>
                <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; color: #475569; font-weight: 500;">
                    ${escapeHtml(item.category)}
                </span>
            </td>
            <td style="font-weight: 600; color: #0f172a;">$${item.price}</td>
            <td>
                <span class="status-badge ${item.status === 'draft' ? 'draft' : ''}">
                    ${item.status === 'draft' ? 'Чернетка' : 'Опубліковано'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" data-id="${item.id}" title="Редагувати">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                    <button class="btn-delete" data-id="${item.id}" title="Видалити" style="color: #ef4444;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Прив'язуємо події до кнопок у рядках
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => prepareEdit(btn.dataset.id));
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => promptDelete(btn.dataset.id));
    });
}

function initForm() {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.price = Number(data.price);
        
        // Додаємо дату для нових записів
        if (!data.id) {
            data.date = new Date().toISOString().split('T')[0];
        }

        const id = data.id;
        delete data.id; // JSON server автоматично створює ID для POST

        btnSubmit.disabled = true;
        const originalText = btnSubmit.textContent;
        btnSubmit.textContent = 'Збереження...';

        try {
            if (id) {
                await updateItem(id, data);
                showToast('Запис успішно оновлено!');
            } else {
                await createItem(data);
                showToast('Новий запис створено!');
            }
            
            resetForm();
            await fetchAndRenderItems();
        } catch (err) {
            alert('Помилка при збереженні: ' + err.message);
        } finally {
            btnSubmit.disabled = false;
            btnSubmit.textContent = originalText;
        }
    });

    btnCancel.addEventListener('click', () => {
        resetForm();
        formModal.classList.remove('is-open');
    });
}

async function prepareEdit(id) {
    try {
        const item = await getItemById(id);
        if (!item) return;

        form.elements['id'].value = item.id;
        form.elements['title'].value = item.title;
        form.elements['category'].value = item.category;
        form.elements['price'].value = item.price;
        form.elements['status'].value = item.status || 'published';
        form.elements['image'].value = item.image;
        form.elements['description'].value = item.description;

        formTitle.textContent = 'Редагувати запис #' + item.id;
        btnSubmit.textContent = 'Оновити запис';
        btnSubmit.classList.replace('btn-primary', 'btn-secondary');
        btnCancel.hidden = false;
        
        // Відкриваємо модальне вікно форми
        formModal.classList.add('is-open');
    } catch (err) {
        alert('Не вдалося завантажити дані для редагування.');
    }
}

function resetForm() {
    form.reset();
    form.elements['id'].value = '';
    formTitle.textContent = 'Нова послуга';
    btnSubmit.textContent = 'Зберегти';
    btnSubmit.classList.replace('btn-secondary', 'btn-primary');
    btnSubmit.classList.replace('btn-secondary', 'btn-primary');
    formModal.classList.remove('is-open');
}

function initDeleteModal() {
    const btnCancelModal = document.getElementById('btn-cancel-delete');
    const btnConfirmModal = document.getElementById('btn-confirm-delete');

    btnCancelModal.addEventListener('click', () => {
        deleteModal.classList.remove('is-open');
        deleteIdTarget = null;
    });

    btnConfirmModal.addEventListener('click', async () => {
        if (!deleteIdTarget) return;

        btnConfirmModal.disabled = true;
        btnConfirmModal.textContent = 'Видалення...';

        try {
            await deleteItem(deleteIdTarget);
            deleteModal.classList.remove('is-open');
            showToast('Запис успішно видалено', '#ef4444');
            await fetchAndRenderItems();
        } catch (err) {
            alert('Не вдалося видалити запис: ' + err.message);
        } finally {
            btnConfirmModal.disabled = false;
            btnConfirmModal.textContent = 'Видалити';
        }
    });
}

function promptDelete(id) {
    deleteIdTarget = id;
    deleteModal.classList.add('is-open');
}

function showToast(message, bgColor = '#10b981') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background = bgColor;
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.transform = 'translateY(150%)';
    }, 3000);
}

function escapeHtml(value) {
    return String(value || '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}
