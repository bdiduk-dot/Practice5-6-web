document.addEventListener('DOMContentLoaded', init);

function init() {
  initActiveNav();
  initMenuToggle();
  initThemeToggle();
  initBackToTop();
  initFooterYear();

  if (typeof initUI === 'function') {
    initUI();
  }

  if (typeof initContact === 'function') {
    initContact();
  }
}

function normalizePath(pathname) {
  const trimmed = pathname.replace(/\/+$/, '');

  if (trimmed === '') {
    return '/index.html';
  }

  if (!trimmed.includes('.')) {
    return `${trimmed}/index.html`;
  }

  return trimmed;
}

function initActiveNav() {
  const navLinks = document.querySelectorAll('.nav-list a[href]');
  if (!navLinks.length) {
    return;
  }

  const currentUrl = new URL(window.location.href);

  navLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) {
      return;
    }

    const linkUrl = new URL(href, currentUrl);
    const isActive = normalizePath(linkUrl.pathname) === normalizePath(currentUrl.pathname);

    link.classList.toggle('is-active', isActive);
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function initMenuToggle() {
  const headerContainer = document.querySelector('.site-header .container');
  const navList = document.querySelector('.nav-list');

  if (!headerContainer || !navList) {
    return;
  }

  if (!navList.id) {
    navList.id = 'site-nav';
  }

  let toggleBtn = headerContainer.querySelector('.mobile-menu-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'mobile-menu-btn';
    toggleBtn.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <line x1="3" y1="6" x2="21" y2="6"></line>
        <line x1="3" y1="12" x2="21" y2="12"></line>
        <line x1="3" y1="18" x2="21" y2="18"></line>
      </svg>
    `;

    const navElement = headerContainer.querySelector('nav');
    if (navElement) {
      headerContainer.insertBefore(toggleBtn, navElement);
    } else {
      headerContainer.prepend(toggleBtn);
    }
  }

  toggleBtn.setAttribute('aria-controls', navList.id);

  function setMenuState(isOpen) {
    navList.classList.toggle('nav-open', isOpen);
    toggleBtn.setAttribute('aria-expanded', String(isOpen));
    toggleBtn.setAttribute('aria-label', isOpen ? 'Закрити меню' : 'Відкрити меню');
  }

  setMenuState(false);

  toggleBtn.addEventListener('click', () => {
    const isOpen = navList.classList.contains('nav-open');
    setMenuState(!isOpen);
  });

  navList.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.site-header')) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      setMenuState(false);
    }
  });
}

function initThemeToggle() {
  const storageKey = 'siteTheme';
  const headerContainer = document.querySelector('.site-header .container');

  if (!headerContainer) {
    return;
  }

  let toggleBtn = headerContainer.querySelector('.theme-toggle-btn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.className = 'theme-toggle-btn';
    headerContainer.appendChild(toggleBtn);
  }

  function iconMoon() {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"></path>
      </svg>
    `;
  }

  function iconSun() {
    return `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;
  }

  function applyTheme(theme) {
    const isDark = theme === 'dark';
    document.body.classList.toggle('theme-dark', isDark);
    toggleBtn.innerHTML = isDark ? iconSun() : iconMoon();
    toggleBtn.setAttribute('aria-pressed', String(isDark));
    toggleBtn.setAttribute('aria-label', isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему');
    toggleBtn.setAttribute('title', isDark ? 'Світла тема' : 'Темна тема');
  }

  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem(storageKey) || 'light';
  } catch (_error) {
    savedTheme = 'light';
  }

  applyTheme(savedTheme);

  toggleBtn.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
    applyTheme(nextTheme);

    try {
      localStorage.setItem(storageKey, nextTheme);
    } catch (_error) {
      // localStorage may be unavailable in private mode or restricted environments.
    }
  });
}

function initBackToTop() {
  let button = document.querySelector('.back-to-top');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'back-to-top';
    button.textContent = '↑';
    button.setAttribute('aria-label', 'Повернутися вгору');
    document.body.appendChild(button);
  }

  function updateVisibility() {
    button.hidden = window.scrollY < 320;
  }

  updateVisibility();

  window.addEventListener(
    'scroll',
    () => {
      updateVisibility();
    },
    { passive: true }
  );

  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function initFooterYear() {
  const yearTargets = document.querySelectorAll('.js-current-year');
  if (!yearTargets.length) {
    return;
  }

  const currentYear = String(new Date().getFullYear());
  yearTargets.forEach((target) => {
    target.textContent = currentYear;
  });
}
