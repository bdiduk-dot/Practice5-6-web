document.addEventListener('DOMContentLoaded', init);

function init() {
  initActiveNav();
  initMenuToggle();
  initThemeToggle();
  initBackToTop();
  initAccordion();
  initFilters();
  initModal();
  initContactForm();
  initFooterYear();
}

// Підсвічування активної сторінки
function initActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-list a');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    const linkPath = new URL(link.href).pathname;
    if (currentPath === linkPath || currentPath.endsWith(linkPath)) {
      link.classList.add('active');
    }
  });
}

// Мобільне меню
function initMenuToggle() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  
  const nav = header.querySelector('nav');
  if (!nav) return;
  
  const menuBtn = document.createElement('button');
  menuBtn.className = 'menu-toggle';
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.innerHTML = '<span></span><span></span><span></span>';
  
  header.querySelector('.container').insertBefore(menuBtn, nav);
  
  menuBtn.addEventListener('click', () => {
    const isExpanded = menuBtn.getAttribute('aria-expanded') === 'true';
    menuBtn.setAttribute('aria-expanded', !isExpanded);
    nav.classList.toggle('is-open');
  });
  
  document.querySelectorAll('.nav-list a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
}

// Перемикач теми зі збереженням у localStorage
function initThemeToggle() {
  const themeBtn = document.createElement('button');
  themeBtn.className = 'theme-toggle';
  themeBtn.setAttribute('aria-label', 'Перемкнути тему');
  
  const moonIcon = '<img src="https://img.icons8.com/ios-filled/50/ffffff/moon-symbol.png" alt="Темна тема" width="20" height="20">';
  const sunIcon = '<img src="https://img.icons8.com/ios-filled/50/ffffff/sun.png" alt="Світла тема" width="20" height="20">';
  
  themeBtn.innerHTML = moonIcon;
  
  const header = document.querySelector('.site-header .container');
  if (header) {
    header.appendChild(themeBtn);
  }
  
  // Відновлення збереженої теми
  const savedTheme = localStorage.getItem('siteTheme');
  if (savedTheme === 'dark') {
    document.body.classList.add('theme-dark');
    themeBtn.innerHTML = sunIcon;
  }
  
  themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
    const isDark = document.body.classList.contains('theme-dark');
    themeBtn.innerHTML = isDark ? sunIcon : moonIcon;
    localStorage.setItem('siteTheme', isDark ? 'dark' : 'light');
  });
}

// Кнопка "Вгору" з'являється після прокручування
function initBackToTop() {
  const btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.setAttribute('aria-label', 'Повернутися вгору');
  btn.innerHTML = '↑';
  document.body.appendChild(btn);
  
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 300);
  });
  
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Автоматичний рік у footer
function initFooterYear() {
  const footer = document.querySelector('.site-footer p');
  if (footer) {
    footer.textContent = footer.textContent.replace(/\d{4}/, new Date().getFullYear());
  }
}

// Акордеон - тільки один елемент активний
function initAccordion() {
  const accordion = document.querySelector('.accordion');
  if (!accordion) return;
  
  const items = accordion.querySelectorAll('.accordion-item');
  
  items.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      
      items.forEach(i => i.classList.remove('active'));
      
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

// Фільтрація за data-атрибутами
function initFilters() {
  const filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length === 0) return;
  
  const items = document.querySelectorAll('[data-category]');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        item.hidden = !match;
      });
    });
  });
}

// Модальне вікно з закриттям по Escape
function initModal() {
  const modalTriggers = document.querySelectorAll('[data-modal]');
  if (modalTriggers.length === 0) return;
  
  modalTriggers.forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      const modalId = trigger.dataset.modal;
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });
  
  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal.active').forEach(modal => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  });
}

// Форма з валідацією, лічильником та чернеткою
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;
  
  const nameInput = form.querySelector('#name');
  const emailInput = form.querySelector('#email');
  const messageInput = form.querySelector('#message');
  
  // Лічильник символів
  if (messageInput) {
    const counter = document.createElement('div');
    counter.className = 'char-counter';
    const maxChars = 500;
    messageInput.setAttribute('maxlength', maxChars);
    messageInput.parentElement.appendChild(counter);
    
    const updateCounter = () => {
      const count = messageInput.value.length;
      counter.textContent = `${count}/${maxChars}`;
      counter.style.color = count > maxChars * 0.9 ? '#ec4899' : '#737373';
    };
    
    messageInput.addEventListener('input', updateCounter);
    updateCounter();
  }
  
  // Відновлення чернетки з localStorage
  const draftKey = 'contactDraft';
  const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
  if (draft.name) nameInput.value = draft.name;
  if (draft.email) emailInput.value = draft.email;
  if (draft.message) messageInput.value = draft.message;
  
  // Автозбереження чернетки
  const saveDraft = () => {
    const data = {
      name: nameInput.value,
      email: emailInput.value,
      message: messageInput.value
    };
    localStorage.setItem(draftKey, JSON.stringify(data));
  };
  
  [nameInput, emailInput, messageInput].forEach(input => {
    input?.addEventListener('input', saveDraft);
  });
  
  const showError = (input, message) => {
    let error = input.parentElement.querySelector('.error-message');
    if (!error) {
      error = document.createElement('div');
      error.className = 'error-message';
      input.parentElement.appendChild(error);
    }
    error.textContent = message;
    input.classList.add('error');
  };
  
  const clearError = (input) => {
    const error = input.parentElement.querySelector('.error-message');
    if (error) error.remove();
    input.classList.remove('error');
  };
  
  const validateName = () => {
    if (nameInput.value.trim().length < 2) {
      showError(nameInput, 'Ім\'я має містити мінімум 2 символи');
      return false;
    }
    clearError(nameInput);
    return true;
  };
  
  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value)) {
      showError(emailInput, 'Введіть коректний email');
      return false;
    }
    clearError(emailInput);
    return true;
  };
  
  const validateMessage = () => {
    if (messageInput.value.trim().length === 0) {
      showError(messageInput, 'Повідомлення не може бути пустим');
      return false;
    }
    clearError(messageInput);
    return true;
  };
  
  nameInput?.addEventListener('blur', validateName);
  emailInput?.addEventListener('blur', validateEmail);
  messageInput?.addEventListener('blur', validateMessage);
  
  // Обробка submit через FormData
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const isValid = validateName() && validateEmail() && validateMessage();
    if (!isValid) return;
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    const result = document.createElement('div');
    result.className = 'form-success';
    result.innerHTML = `
      <h3>✓ Дякуємо за повідомлення!</h3>
      <p><strong>Ім'я:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Тема:</strong> ${data.subject || 'Не вказано'}</p>
      <p><strong>Повідомлення:</strong> ${data.message}</p>
      <button class="btn-primary" onclick="location.reload()">Надіслати ще</button>
    `;
    
    form.replaceWith(result);
    localStorage.removeItem(draftKey);
  });
}
