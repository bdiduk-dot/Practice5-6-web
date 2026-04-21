const ITEMS_PER_PAGE = 6;
const CATEGORY_LABELS = {
  development: 'Development',
  design: 'Design',
  marketing: 'Marketing'
};

document.addEventListener('DOMContentLoaded', initCatalogAndFavorites);

function initCatalogAndFavorites() {
  initCatalogPage();
  initFavoritesPage();
}

async function loadItems() {
  const isGithubPages = window.location.hostname.includes('github.io');
  const basePath = isGithubPages ? window.location.pathname.substring(0, window.location.pathname.indexOf('/pages')) : '..';
  const dataPath = basePath ? `${basePath}/data/items.json` : '../data/items.json';

  if (window.location.protocol === 'file:') {
    throw new Error('Для завантаження JSON відкрийте сайт через локальний сервер (Live Server), а не через file://');
  }

  const response = await fetch(dataPath);
  if (!response.ok) throw new Error('Не вдалося завантажити дані');
  return response.json();
}

async function initCatalogPage() {
  const container = document.querySelector('[data-catalog]');
  if (!container) return;

  const searchInput = document.getElementById('search-input');
  const filterGroup = document.getElementById('catalog-filters');
  const sortSelect = document.getElementById('sort-options');
  const loadMoreBtn = document.getElementById('btn-load-more');

  // URL State handling
  const urlParams = new URLSearchParams(window.location.search);
  
  let state = {
    items: [],
    displayedItems: [],
    currentPage: 1,
    query: urlParams.get('q') || '',
    category: urlParams.get('category') || 'all',
    sort: urlParams.get('sort') || 'date-new',
    favorites: readFavorites()
  };

  // Sync UI with URL state
  if (searchInput) searchInput.value = state.query;
  if (sortSelect) sortSelect.value = state.sort;
  if (filterGroup) {
    updateActiveFilterButton(filterGroup, state.category);
  }

  try {
    showLoadingState(container);
    state.items = await loadItems();
    
    // Initial Render
    applyFiltersAndSort();

    // Setup Listeners
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        state.query = e.target.value;
        state.currentPage = 1;
        updateUrlParams();
        applyFiltersAndSort();
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
        applyFiltersAndSort();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        state.sort = e.target.value;
        state.currentPage = 1;
        updateUrlParams();
        applyFiltersAndSort();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        renderCatalog(true);
      });
    }

    // Modal click listener
    container.addEventListener('click', (e) => {
      // Handle favorite click
      const favBtn = e.target.closest('.fav-btn');
      const detailBtn = e.target.closest('.detail-btn');
      
      if (favBtn) {
        const id = Number(favBtn.dataset.id);
        toggleFavorite(id);
        
        // Re-render only the button state
        const isFav = state.favorites.has(id);
        favBtn.classList.toggle('is-favorite', isFav);
        favBtn.classList.toggle('is-active', isFav);
        favBtn.setAttribute('aria-pressed', isFav);
        favBtn.innerText = isFav ? '♥ В обраному' : '♡ В обране';
      }

      // Handle Details Modal
      if (detailBtn) {
        const id = Number(detailBtn.dataset.id);
        const item = state.items.find(i => i.id === id);
        if (item && window.openModal) {
          showItemModal(item);
        }
      }
    });

  } catch (error) {
    showErrorState(container, error.message);
  }

  function updateUrlParams() {
    const params = new URLSearchParams();
    if (state.query) params.set('q', state.query);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.sort !== 'date-new') params.set('sort', state.sort);
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    try {
      window.history.replaceState({}, '', newUrl);
    } catch (e) {
      console.warn('history.replaceState not supported on file:// protocol', e);
    }
  }

  function applyFiltersAndSort() {
    let filtered = state.items.filter(item => {
      const matchQuery = item.title.toLowerCase().includes(state.query.toLowerCase()) || 
                         item.description.toLowerCase().includes(state.query.toLowerCase());
      const matchCategory = state.category === 'all' || item.category === state.category;
      return matchQuery && matchCategory;
    });

    filtered.sort((a, b) => {
      if (state.sort === 'price-asc') return a.price - b.price;
      if (state.sort === 'price-desc') return b.price - a.price;
      if (state.sort === 'title-asc') return a.title.localeCompare(b.title);
      // default: date-new
      return new Date(b.date) - new Date(a.date);
    });

    state.displayedItems = filtered;
    renderCatalog(false);
  }

  function renderCatalog(append = false) {
    if (state.displayedItems.length === 0) {
      container.innerHTML = `<div class="empty-state">За вашим запитом нічого не знайдено.</div>`;
      if (loadMoreBtn) loadMoreBtn.hidden = true;
      return;
    }

    const startIndex = append ? (state.currentPage - 1) * ITEMS_PER_PAGE : 0;
    const endIndex = state.currentPage * ITEMS_PER_PAGE;
    const itemsToShow = state.displayedItems.slice(startIndex, endIndex);

    const html = itemsToShow.map(generateCardHtml).join('');

    if (append) {
      // Append requires creating a temporary container or using insertAdjacentHTML
      container.insertAdjacentHTML('beforeend', html);
    } else {
      container.innerHTML = html;
    }

    // Toggle Load More button
    if (loadMoreBtn) {
      loadMoreBtn.hidden = endIndex >= state.displayedItems.length;
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
// Favorites Page Logic
// ===============================

async function initFavoritesPage() {
  const favContainer = document.querySelector('[data-favorites]');
  if (!favContainer) return;

  const emptyState = document.getElementById('favorites-empty');
  
  let state = {
    items: [],
    favorites: readFavorites()
  };

  try {
    showLoadingState(favContainer);
    state.items = await loadItems();

    function renderFavorites() {
      const favItems = state.items.filter(item => state.favorites.has(item.id));
      
      if (favItems.length === 0) {
        favContainer.innerHTML = '';
        if (emptyState) emptyState.hidden = false;
        return;
      }
      
      if (emptyState) emptyState.hidden = true;
      favContainer.innerHTML = favItems.map(generateCardHtml).join('');
    }

    renderFavorites();

    // Delegate events
    favContainer.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      const detailBtn = e.target.closest('.detail-btn');
      
      if (favBtn) {
        const id = Number(favBtn.dataset.id);
        state.favorites.delete(id);
        saveFavorites(state.favorites);
        renderFavorites(); // re-render layout to remove card
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
    showErrorState(favContainer, error.message);
  }
}

// ===============================
// Shared Helpers
// ===============================

function generateCardHtml(item) {
  const isFavorite = readFavorites().has(item.id);
  const favText = isFavorite ? '♥ В обраному' : '♡ В обране';
  const favClass = isFavorite ? ' is-favorite is-active' : '';
  const category = escapeHtml(item.category);
  const categoryLabel = escapeHtml(getCategoryLabel(item.category));
  const priceFormatted = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(item.price);
  
  return `
    <article class="card filterable-card catalog-card" data-id="${item.id}">
      <div class="catalog-card__media">
        <img class="catalog-card__image" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      </div>
      <span class="category-badge" data-category="${category}">${categoryLabel}</span>
      <h3 class="catalog-card__title">${escapeHtml(item.title)}</h3>
      <p class="catalog-card__desc">${escapeHtml(item.description)}</p>
      <div class="catalog-card__meta">
        <span class="price">${priceFormatted}</span>
      </div>
      <div class="catalog-card__actions">
        <button type="button" class="btn detail-btn" data-id="${item.id}">Деталі</button>
        <button type="button" class="btn fav-btn${favClass}" data-id="${item.id}" aria-pressed="${isFavorite}">
          ${favText}
        </button>
      </div>
    </article>
  `;
}

function showItemModal(item) {
  const category = escapeHtml(item.category);
  const categoryLabel = escapeHtml(getCategoryLabel(item.category));
  const priceFormatted = new Intl.NumberFormat('uk-UA', { style: 'currency', currency: 'USD' }).format(item.price);
  const dateFormatted = new Date(item.date).toLocaleDateString('uk-UA');
  
  const content = `
    <div class="catalog-modal-content">
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%; max-height:320px; object-fit:cover; border-radius:8px; margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; gap:10px;">
        <h2 style="margin:0;">${escapeHtml(item.title)}</h2>
        <span class="category-badge" data-category="${category}">${categoryLabel}</span>
      </div>
      <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">${escapeHtml(item.description)}</p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; background:var(--nav-bg); border:1px solid var(--border-color); padding:15px; border-radius:8px; margin-bottom:20px;">
        <div>
          <span style="color:var(--muted-color); font-size:12px; display:block;">Вартість послуги</span>
          <strong style="font-size:18px;">${priceFormatted}</strong>
        </div>
        <div>
          <span style="color:var(--muted-color); font-size:12px; display:block;">Дата додавання</span>
          <strong style="font-size:18px;">${dateFormatted}</strong>
        </div>
      </div>
    </div>
  `;
  window.openModal(content);
}

const FAVORITES_KEY = 'catalogFavorites_v2';

function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item)));
  } catch (e) {
    return new Set();
  }
}

function saveFavorites(favoritesSet) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favoritesSet]));
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

function showErrorState(container, message) {
  container.innerHTML = `
    <div class="error-msg" style="text-align:center; padding:32px;">
      <h3>Помилка завантаження</h3>
      <p>${escapeHtml(message)}</p>
      <p>Спробуйте запустити проєкт через локальний сервер (Live Server).</p>
    </div>
  `;
}

function getCategoryLabel(category) {
  return CATEGORY_LABELS[category] || category;
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
