function initContact() {
  const form = document.getElementById('contact-form');
  if (!form) {
    return;
  }

  const draftKey = 'contactDraft';

  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    subject: document.getElementById('subject'),
    message: document.getElementById('message'),
    agree: form.querySelector('input[name="agree"]'),
  };

  if (!fields.name || !fields.email || !fields.subject || !fields.message || !fields.agree) {
    return;
  }

  const charCounter = document.getElementById('char-count');
  const clearDraftButton = document.getElementById('clear-draft');
  const statusNode = document.getElementById('form-status');
  const resultNode = document.getElementById('form-result');

  const messageLimit = fields.message.maxLength > 0 ? fields.message.maxLength : 500;
  fields.message.maxLength = messageLimit;

  restoreDraft();
  updateCharCounter();

  form.addEventListener('input', () => {
    saveDraft();
    updateCharCounter();
  });

  form.addEventListener('change', () => {
    saveDraft();
  });

  if (clearDraftButton) {
    clearDraftButton.addEventListener('click', () => {
      openDraftClearDialog(() => {
        clearDraft();
        form.reset();
        clearAllErrors();
        updateCharCounter();
        setStatus('Чернетку очищено.', 'success');
        if (resultNode) {
          resultNode.innerHTML = '';
        }
      });
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    clearAllErrors();
    if (!validateForm()) {
      setStatus('Перевірте, будь ласка, поля форми.', 'error');
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    renderResult(data);

    clearDraft();
    form.reset();
    updateCharCounter();
    setStatus('Форму успішно оброблено.', 'success');
  });

  function validateForm() {
    let valid = true;

    if (fields.name.value.trim().length < 2) {
      showFieldError(fields.name, 'Ім\'я має містити мінімум 2 символи.');
      valid = false;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(fields.email.value.trim())) {
      showFieldError(fields.email, 'Введіть коректний email, наприклад me@example.com.');
      valid = false;
    }

    if (fields.message.value.trim().length === 0) {
      showFieldError(fields.message, 'Повідомлення не може бути порожнім.');
      valid = false;
    }

    if (!fields.agree.checked) {
      showFieldError(fields.agree, 'Потрібно погодитися з обробкою персональних даних.');
      valid = false;
    }

    return valid;
  }

  function updateCharCounter() {
    if (!charCounter) {
      return;
    }

    const currentLength = fields.message.value.length;
    charCounter.textContent = `Введено ${currentLength}/${messageLimit} символів`;
    charCounter.classList.toggle('is-limit', currentLength >= messageLimit);
  }

  function showFieldError(field, message) {
    const container =
      field.closest('.form-group') || field.closest('fieldset') || field.parentElement || form;
    const errorId = `${field.id || field.name}-error`;

    let errorNode = container.querySelector(`.field-error[data-for="${field.name}"]`);
    if (!errorNode) {
      errorNode = document.createElement('p');
      errorNode.className = 'field-error';
      errorNode.dataset.for = field.name;
      errorNode.id = errorId;
      errorNode.hidden = true;
      container.appendChild(errorNode);
    }

    errorNode.textContent = message;
    errorNode.hidden = false;

    field.classList.add('invalid');
    field.setAttribute('aria-invalid', 'true');

    const describedBy = new Set((field.getAttribute('aria-describedby') || '').split(' ').filter(Boolean));
    describedBy.add(errorNode.id);
    field.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
  }

  function clearAllErrors() {
    form.querySelectorAll('.field-error').forEach((errorNode) => {
      errorNode.hidden = true;
      errorNode.textContent = '';
    });

    form.querySelectorAll('[aria-invalid="true"]').forEach((field) => {
      field.removeAttribute('aria-invalid');
      field.classList.remove('invalid');
    });
  }

  function setStatus(message, type) {
    if (!statusNode) {
      return;
    }

    statusNode.textContent = message;
    statusNode.classList.remove('is-error', 'is-success');

    if (type === 'error') {
      statusNode.classList.add('is-error');
    }

    if (type === 'success') {
      statusNode.classList.add('is-success');
    }
  }

  function renderResult(formDataObject) {
    if (!resultNode) {
      return;
    }

    const successBox = document.createElement('div');
    successBox.className = 'success-box';

    const title = document.createElement('h3');
    title.textContent = `Дякуємо, ${formDataObject.name}!`;

    const intro = document.createElement('p');
    intro.textContent = 'Ваше повідомлення було успішно прийнято.';

    const summary = document.createElement('ul');
    summary.className = 'submit-summary';

    const method = formDataObject['contact-method'] || 'не вказано';
    const subject = formDataObject.subject || 'без теми';

    const summaryItems = [
      `Email: ${formDataObject.email}`,
      `Тема: ${subject}`,
      `Спосіб зв'язку: ${method}`,
      `Повідомлення: ${formDataObject.message}`,
    ];

    summaryItems.forEach((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      summary.appendChild(item);
    });

    successBox.append(title, intro, summary);
    resultNode.replaceChildren(successBox);
  }

  function collectDraftData() {
    const selectedMethod = form.querySelector('input[name="contact-method"]:checked');

    return {
      name: fields.name.value,
      email: fields.email.value,
      subject: fields.subject.value,
      message: fields.message.value,
      contactMethod: selectedMethod ? selectedMethod.value : '',
      agree: fields.agree.checked,
    };
  }

  function saveDraft() {
    const draftData = collectDraftData();

    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch (_error) {
      // Ігноруємо помилки доступу до сховища
    }
  }

  function readDraft() {
    try {
      const rawDraft = localStorage.getItem(draftKey);
      const parsed = rawDraft ? JSON.parse(rawDraft) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  function restoreDraft() {
    const draft = readDraft();

    fields.name.value = typeof draft.name === 'string' ? draft.name : '';
    fields.email.value = typeof draft.email === 'string' ? draft.email : '';
    fields.subject.value = typeof draft.subject === 'string' ? draft.subject : '';
    fields.message.value = typeof draft.message === 'string' ? draft.message : '';

    if (typeof draft.contactMethod === 'string' && draft.contactMethod) {
      const safeValue = escapeSelectorValue(draft.contactMethod);
      const draftMethodField = form.querySelector(
        `input[name="contact-method"][value="${safeValue}"]`
      );
      if (draftMethodField) {
        draftMethodField.checked = true;
      }
    }

    fields.agree.checked = Boolean(draft.agree);
  }

  function clearDraft() {
    try {
      localStorage.removeItem(draftKey);
    } catch (_error) {
      // Ігноруємо помилки доступу до сховища
    }
  }

  function escapeSelectorValue(value) {
    if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
      return CSS.escape(value);
    }

    return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"');
  }

  function openDraftClearDialog(onConfirm) {
    if (!window.siteModal || typeof window.siteModal.open !== 'function') {
      onConfirm();
      return;
    }

    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog';

    const title = document.createElement('h3');
    title.textContent = 'Очистити чернетку?';

    const text = document.createElement('p');
    text.textContent = 'Усі введені дані будуть видалені.';

    const actions = document.createElement('div');
    actions.className = 'confirm-actions';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = 'btn btn-danger';
    confirmButton.textContent = 'Очистити';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'btn';
    cancelButton.textContent = 'Скасувати';

    actions.append(confirmButton, cancelButton);
    dialog.append(title, text, actions);

    confirmButton.addEventListener('click', () => {
      onConfirm();
      window.siteModal.close();
    });

    cancelButton.addEventListener('click', () => {
      window.siteModal.close();
    });

    window.siteModal.open(dialog);
  }
}
