function initUI() {
  initAccordion();
  initModal();
  initServicesCatalog();
}

function initAccordion() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) {
    return;
  }

  function setExpanded(item, expanded) {
    const header = item.querySelector('.faq-header');
    const panel = item.querySelector('.faq-content');

    if (!header || !panel) {
      return;
    }

    header.setAttribute('aria-expanded', String(expanded));
    panel.hidden = !expanded;
  }

  items.forEach((item) => {
    const header = item.querySelector('.faq-header');
    const panel = item.querySelector('.faq-content');

    if (!header || !panel) {
      return;
    }

    const expanded = header.getAttribute('aria-expanded') === 'true';
    panel.hidden = !expanded;

    header.addEventListener('click', () => {
      const isExpanded = header.getAttribute('aria-expanded') === 'true';

      items.forEach((currentItem) => {
        if (currentItem !== item) {
          setExpanded(currentItem, false);
        }
      });

      setExpanded(item, !isExpanded);
    });
  });
}

function initModal() {
  const body = document.body;
  let overlay = document.querySelector('.modal-overlay');

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <button type="button" class="modal-close" aria-label="Закрити">&times;</button>
        <div class="modal-content"></div>
      </div>
    `;
    body.appendChild(overlay);
  }

  const modalContent = overlay.querySelector('.modal-content');
  const closeBtn = overlay.querySelector('.modal-close');

  if (!modalContent || !closeBtn) {
    return;
  }

  function openModal(content) {
    if (typeof content === 'string') {
      modalContent.innerHTML = content;
    } else if (content instanceof Node) {
      modalContent.replaceChildren(content);
    }

    overlay.hidden = false;
    body.classList.add('no-scroll');
  }

  function closeModal() {
    overlay.hidden = true;
    body.classList.remove('no-scroll');
    modalContent.innerHTML = '';
  }

  document.querySelectorAll('[data-modal-target]').forEach((trigger) => {
    trigger.addEventListener('click', (event) => {
      event.preventDefault();

      const image = trigger.querySelector('img');
      if (!image) {
        return;
      }

      const largeImage = document.createElement('img');
      largeImage.className = 'modal-image';
      largeImage.src = trigger.getAttribute('href') || image.src;
      largeImage.alt = image.alt || 'Зображення';
      openModal(largeImage);
    });
  });

  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !overlay.hidden) {
      closeModal();
    }
  });

  window.siteModal = { open: openModal, close: closeModal };
  window.openModal = openModal;
  window.closeModal = closeModal;
}

async function initServicesCatalog() {
  const container = document.getElementById('services-container');
  if (!container) {
    return;
  }

  const filterGroup = document.querySelector('.filter-group');
  const sortSelect = document.getElementById('sort-options');

  const state = {
    items: [],
    filter: 'all',
    sort: sortSelect ? sortSelect.value : 'date-new',
    favorites: readFavoriteSet(),
  };

  if (filterGroup) {
    filterGroup.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-btn');
      if (!button) {
        return;
      }

      state.filter = button.dataset.filter || 'all';
      updateActiveFilterButton(filterGroup, state.filter);
      renderCards();
    });

    updateActiveFilterButton(filterGroup, state.filter);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      state.sort = sortSelect.value;
      renderCards();
    });
  }

  container.addEventListener('click', (event) => {
    const favButton = event.target.closest('.fav-btn');
    if (!favButton) {
      return;
    }

    const id = Number(favButton.dataset.id);
    if (!Number.isFinite(id)) {
      return;
    }

    if (state.favorites.has(id)) {
      state.favorites.delete(id);
    } else {
      state.favorites.add(id);
    }

    persistFavoriteSet(state.favorites);
    renderCards();
  });

  await loadCards();

  async function loadCards() {
    container.innerHTML = '<p class="loading-state">Завантаження даних...</p>';

    if (window.location.protocol === 'file:') {
      container.innerHTML = '<p class="error-msg">Для завантаження JSON відкрийте сайт через локальний сервер (http://), а не через file://.</p>';
      return;
    }

    try {
      const response = await fetch(getServicesDataPath(), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Network error');
      }

      const data = await response.json();
      state.items = Array.isArray(data) ? data : [];
      renderCards();
    } catch (_error) {
      container.innerHTML = '<p class="error-msg">Помилка завантаження даних. Спробуйте ще раз пізніше.</p>';
    }
  }

  function renderCards() {
    if (!state.items.length) {
      container.innerHTML = '<p class="empty-state">Дані відсутні.</p>';
      return;
    }

    const filtered = state.items.filter((item) => {
      return state.filter === 'all' || item.category === state.filter;
    });

    const sorted = [...filtered].sort((left, right) => {
      if (state.sort === 'price-asc') {
        return Number(left.price) - Number(right.price);
      }

      if (state.sort === 'price-desc') {
        return Number(right.price) - Number(left.price);
      }

      return new Date(right.date) - new Date(left.date);
    });

    if (!sorted.length) {
      container.innerHTML = '<p class="empty-state">За поточним фільтром дані не знайдено.</p>';
      return;
    }

    container.innerHTML = sorted
      .map((item) => {
        const id = Number(item.id);
        const isFavorite = state.favorites.has(id);

        return `
          <article class="card filterable-card" data-category="${escapeHtml(item.category)}" data-date="${escapeHtml(item.date)}" data-price="${escapeHtml(item.price)}">
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <p class="price">Ціна: $${escapeHtml(item.price)}</p>
            <button
              type="button"
              class="fav-btn${isFavorite ? ' is-active' : ''}"
              data-id="${id}"
              aria-pressed="${isFavorite ? 'true' : 'false'}"
              aria-label="${isFavorite ? 'Видалити з обраного' : 'Додати в обране'}"
            >
              ❤ Обране
            </button>
          </article>
        `;
      })
      .join('');
  }
}

function updateActiveFilterButton(filterGroup, activeFilter) {
  filterGroup.querySelectorAll('.filter-btn').forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle('is-active', isActive);
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function readFavoriteSet() {
  try {
    const raw = localStorage.getItem('favoritesList');
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) {
      return new Set();
    }

    return new Set(parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item)));
  } catch (_error) {
    return new Set();
  }
}

function persistFavoriteSet(favorites) {
  try {
    localStorage.setItem('favoritesList', JSON.stringify([...favorites]));
  } catch (_error) {
    // Ignore storage errors.
  }
}

function getServicesDataPath() {
  return window.location.pathname.includes('/pages/') ? '../data/services.json' : 'data/services.json';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
