const API_URL = 'http://localhost:3005/items';

async function fetchWrapper(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

export async function getItems(params = '') {
    const url = params ? `${API_URL}?${params}` : API_URL;
    return fetchWrapper(url);
}

export async function getItemById(id) {
    return fetchWrapper(`${API_URL}/${id}`);
}

export async function createItem(data) {
    return fetchWrapper(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function updateItem(id, data) {
    return fetchWrapper(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

export async function deleteItem(id) {
    return fetchWrapper(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
}

// Експортуємо в глобальну область видимості (якщо потрібно)
window.apiPlugin = {
    getItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem
};
