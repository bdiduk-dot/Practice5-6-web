import { getItems } from './api.js';

const ITEMS_PER_PAGE = 6;

document.addEventListener('DOMContentLoaded', initCatalogAndFavorites);

function initCatalogAndFavorites() {
  initCatalogPage();
  initFavoritesPage();
}

async function initCatalogPage() {
  const container = document.querySelector('[data-catalog]');
  if (!container) return;

  const searchInput = document.getElementById('search-input');
  const filterGroup = document.getElementById('catalog-filters');
  const sortSelect = document.getElementById('sort-options');
  const loadMoreBtn = document.getElementById('btn-load-more');

  // Керування станом через URL
  const urlParams = new URLSearchParams(window.location.search);
  
  let state = {
    items: [],
    currentPage: 1,
    query: urlParams.get('q') || '',
    category: urlParams.get('category') || 'all',
    sort: urlParams.get('_sort') || 'date',
    order: urlParams.get('_order') || 'desc',
    favorites: readFavorites()
  };

  // Синхронізація UI зі станом URL
  if (searchInput) searchInput.value = state.query;
  
  // Конвертація параметрів UI у запити JSON-server
  if (sortSelect) {
      if (state.sort === 'price' && state.order === 'asc') sortSelect.value = 'price-asc';
      else if (state.sort === 'price' && state.order === 'desc') sortSelect.value = 'price-desc';
      else if (state.sort === 'title' && state.order === 'asc') sortSelect.value = 'title-asc';
      else sortSelect.value = 'date-new';
  }

  if (filterGroup) {
    updateActiveFilterButton(filterGroup, state.category);
  }

  try {
    // Початковий рендер
    await fetchAndRenderCatalog();

    // Setup Listeners
    if (searchInput) {
      // Затримка введення для зменшення навантаження на сервер (Debounce)
      let timeoutId;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            state.query = e.target.value;
            state.currentPage = 1;
            updateUrlParams();
            fetchAndRenderCatalog();
        }, 300);
      });
    }

    if (filterGroup) {
      filterGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (!btn) return;
        state.category = btn.dataset.filter || 'all';
        state.currentPage = 1;
        updateActiveFilterButton(filterGroup, state.category);
        updateUrlParams();
        fetchAndRenderCatalog();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'price-asc') { state.sort = 'price'; state.order = 'asc'; }
        else if (val === 'price-desc') { state.sort = 'price'; state.order = 'desc'; }
        else if (val === 'title-asc') { state.sort = 'title'; state.order = 'asc'; }
        else { state.sort = 'date'; state.order = 'desc'; }
        
        state.currentPage = 1;
        updateUrlParams();
        fetchAndRenderCatalog();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        fetchAndRenderCatalog(true);
      });
    }

    // Делегування подій для карток
    container.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      const detailBtn = e.target.closest('.detail-btn');
      
      if (favBtn) {
        // Оптимістичний UI для обраного
        const id = Number(favBtn.dataset.id);
        toggleFavorite(id);
        const isFav = state.favorites.has(id);
        favBtn.classList.toggle('is-favorite', isFav);
        favBtn.setAttribute('aria-pressed', isFav);
        favBtn.innerText = isFav ? '♥ В обраному' : '♡ В обране';
      }

      if (detailBtn) {
        const id = Number(detailBtn.dataset.id);
        const item = state.items.find(i => i.id === id);
        if (item && window.openModal) {
          showItemModal(item);
        }
      }
    });

  } catch (error) {
     if (error.message.includes('Failed to fetch')) {
        showErrorState(container, 'Помилка з\'єднання. Переконайтесь, що json-server запущено: npm run server');
     } else {
        showErrorState(container, error.message);
     }
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category !== 'all') params.set('category', state.category);
    params.set('_sort', state.sort);
    params.set('_order', state.order);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    try {
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      console.warn('history.replaceState failed');
    }
  }

  function buildQueryString() {
      const searchParams = new URLSearchParams();
      if (state.query) searchParams.set('q', state.query);
      if (state.category && state.category !== 'all') {
          searchParams.set('category', state.category);
      }
      
      // Показувати лише опубліковані в каталозі
      searchParams.set('status', 'published');
      
      searchParams.set('_sort', state.sort);
      searchParams.set('_order', state.order);
      searchParams.set('_page', state.currentPage);
      searchParams.set('_limit', ITEMS_PER_PAGE);
      return searchParams.toString();
  }

  async function fetchAndRenderCatalog(append = false) {
      if (!append) showLoadingState(container);
      
      try {
          const qs = buildQueryString();
          // api.js повертає масив напряму
          const newItems = await getItems(qs);
          
          if (!append) {
              state.items = newItems;
          } else {
              state.items = [...state.items, ...newItems];
          }
          
          renderCatalogContent(newItems, append);
      } catch (e) {
          showErrorState(container, 'Помилка з\'єднання. Перевірте роботу json-server.', e);
      }
  }

  function renderCatalogContent(fetchedItems, append = false) {
    if (fetchedItems.length === 0 && !append) {
      container.innerHTML = `<div class="empty-state" style="text-align:center; padding: 40px; color: #64748b;">
        <h3>За вашим запитом нічого не знайдено.</h3>
        <p>Спробуйте змінити фільтри пошуку.</p>
      </div>`;
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    const html = fetchedItems.map(generateCardHtml).join('');

    if (append) {
      container.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = html;
    }

    // Кнопка "Показати ще"
    if (loadMoreBtn) {
      loadMoreBtn.hidden = fetchedItems.length < ITEMS_PER_PAGE;
    }
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }
    saveFavorites(state.favorites);
  }
}

// ===============================
// Логіка сторінки "Обране"
// ===============================

async function initFavoritesPage() {
  const favContainer = document.querySelector('[data-favorites]');
  if (!favContainer) return;

  const emptyState = document.getElementById('favorites-empty');
  const favItems = readFavorites();
  
  if (favItems.size === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
  }
  
  showLoadingState(favContainer);
  
  let state = {
      items: []
  };

  try {
      // Завантажуємо лише обрані елементи через json-server
      const idQuery = Array.from(favItems).map(id => `id=${id}`).join('&');
      state.items = await getItems(idQuery);

      function renderFavorites() {
          if (state.items.length === 0) {
              favContainer.innerHTML = '';
              if (emptyState) emptyState.hidden = false;
              return;
          }
          
          if (emptyState) emptyState.hidden = true;
          favContainer.innerHTML = state.items.map(generateCardHtml).join('');
      }

      renderFavorites();

      favContainer.addEventListener('click', (e) => {
          const favBtn = e.target.closest('.fav-btn');
          const detailBtn = e.target.closest('.detail-btn');
          
          if (favBtn) {
              const id = Number(favBtn.dataset.id);
              favItems.delete(id);
              saveFavorites(favItems);
              // Видаляємо з DOM для швидкості
              favBtn.closest('.card').remove();
              if (favItems.size === 0 && emptyState) {
                  emptyState.hidden = false;
              }
          }

          if (detailBtn) {
              const id = Number(detailBtn.dataset.id);
              const item = state.items.find(i => i.id === id);
              if (item && window.openModal) {
                  showItemModal(item);
              }
          }
      });
  } catch (error) {
      showErrorState(favContainer, 'Помилка завнтаження обраних. Переконайтесь, що сервер працює.');
  }
}

// ===============================
// Допоміжні функції
// ===============================

function generateCardHtml(item) {
  const isFavorite = readFavorites().has(item.id);
  const favText = isFavorite ? '♥ В обраному' : '♡ В обране';
  const favClass = isFavorite ? ' is-favorite' : '';
  const priceFormatted = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(item.price || 0);
  
  return `
    <article class="card filterable-card" data-id="${item.id}">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" style="width:100%; height:200px; object-fit:cover; border-radius:4px; margin-bottom:15px;">
      <span class="category-badge" style="background:#eee; padding:4px 8px; border-radius:12px; font-size:12px; display:inline-block; margin-bottom:10px;">${escapeHtml(item.category)}</span>
      <h3 style="margin: 0 0 10px 0; font-size: 1.25rem;">${escapeHtml(item.title)}</h3>
      <p style="color: #666; font-size: 14px; margin-bottom: 15px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${escapeHtml(item.description)}</p>
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 15px;">
        <span style="font-weight:bold; font-size: 1.1rem; color: var(--primary-color);">${priceFormatted}</span>
      </div>
      <div style="display:flex; gap:10px;">
        <button type="button" class="btn detail-btn" data-id="${item.id}" style="flex:1; padding:8px; background:var(--primary-color, #007bff); color:white; border:none; border-radius:4px; cursor:pointer; transition: opacity 0.2s;">Деталі</button>
        <button type="button" class="btn fav-btn${favClass}" data-id="${item.id}" aria-pressed="${isFavorite}" style="flex:1; padding:8px; border-radius:4px; cursor:pointer; min-width: 120px; transition: color 0.2s, background-color 0.2s, border-color 0.2s;">
          ${favText}
        </button>
      </div>
    </article>
  `;
}

function showItemModal(item) {
  const isFavorite = readFavorites().has(item.id);
  const dateFormatted = new Date(item.date).toLocaleDateString('uk-UA');
  
  const content = `
    <div style="padding: 20px;">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%; max-height:300px; object-fit:cover; border-radius:8px; margin-bottom:20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
        <h2 style="margin:0;">${escapeHtml(item.title)}</h2>
        <span style="background:#eee; padding:5px 10px; border-radius:12px; font-size:14px; color: #475569; font-weight: 500;">${escapeHtml(item.category)}</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${escapeHtml(item.description)}</p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; background:#f8fafc; border: 1px solid #e2e8f0; padding:15px; border-radius:8px; margin-bottom:20px;">
        <div>
          <span style="color:#64748b; font-size:12px; display:block; text-transform: uppercase; letter-spacing: 0.5px;">Вартість послуги</span>
          <strong style="font-size:24px; color: var(--primary-color);">$${escapeHtml(item.price)}</strong>
        </div>
        <div>
          <span style="color:#64748b; font-size:12px; display:block; text-transform: uppercase; letter-spacing: 0.5px;">Дата додавання</span>
          <strong style="font-size:18px; line-height: 32px;">${dateFormatted}</strong>
        </div>
      </div>
    </div>
  `;
  window.openModal(content);
}

const FAVORITES_KEY = 'catalogFavorites_v3';

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    return new Set();
  }
}

function saveFavorites(favoritesSet) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoritesSet]));
    if (window.updateFavBadge) window.updateFavBadge();
  } catch (e) {}
}

function showLoadingState(container) {
  container.innerHTML = Array(6).fill(`
    <article class="card skeleton-card">
      <div class="skeleton" style="height:150px; margin-bottom:15px; border-radius:4px;"></div>
      <div class="skeleton" style="height:20px; width:40%; margin-bottom:10px;"></div>
      <div class="skeleton" style="height:24px; width:80%; margin-bottom:15px;"></div>
      <div class="skeleton" style="height:16px; width:100%; margin-bottom:10px;"></div>
      <div class="skeleton" style="height:16px; width:60%; margin-bottom:20px;"></div>
      <div style="display:flex; gap:10px;">
        <div class="skeleton" style="height:36px; flex:1; border-radius:4px;"></div>
        <div class="skeleton" style="height:36px; flex:1; border-radius:4px;"></div>
      </div>
    </article>
  `).join('');
}

function showErrorState(container, message, originalError = null) {
  container.innerHTML = `
    <div class="error-msg" style="text-align:center; padding:40px; background:#fef2f2; border: 1px solid #fecaca; color:#ef4444; border-radius:12px; margin-top:20px;">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 15px; opacity: 0.8;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <h3 style="margin: 0 0 10px 0; font-size: 1.25rem;">Помилка завантаження</h3>
      <p style="margin: 0;">${escapeHtml(message)}</p>
      ${originalError ? `<div style="margin-top: 15px; font-size:0.8rem; opacity:0.7;"><code>${escapeHtml(originalError.message)}</code></div>` : ''}
    </div>
  `;
}

function updateActiveFilterButton(filterGroup, activeFilter) {
  filterGroup.querySelectorAll('.filter-btn').forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle('is-active', isActive);
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
