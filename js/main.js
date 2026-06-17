const header = document.querySelector('[data-header]');
const nav = document.querySelector('[data-nav]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const leadForm = document.querySelector('[data-lead-form]');
const statusNode = document.querySelector('[data-form-status]');
const sourceInput = document.querySelector('#source');
const isStaticHosting = window.location.hostname.endsWith('github.io')
  || window.location.protocol === 'file:'
  || leadForm?.getAttribute('action') === '#request';

const canAnimate = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 721px)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setHeaderState() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 8);
}

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
    document.body.classList.toggle('menu-open', !isOpen);
  });

  nav.addEventListener('click', (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    }
  });
}

if (canAnimate) {
  document.querySelectorAll('.glass-panel, .glass-card, .glass-chip').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty('--mx', `${x}%`);
      element.style.setProperty('--my', `${y}%`);
    });
  });

  document.querySelectorAll('[data-glass-tilt]').forEach((element) => {
    element.addEventListener('pointermove', (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateY = ((x / rect.width) - 0.5) * 5;
      const rotateX = ((0.5 - (y / rect.height)) * 5);
      element.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
    });

    element.addEventListener('pointerleave', () => {
      element.style.transform = '';
    });
  });

  const revealItems = document.querySelectorAll('.section-heading, .glass-card, .glass-panel, .media-frame, .gallery-grid img');
  revealItems.forEach((item) => item.classList.add('reveal-on-scroll'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

function showStatus(message, type) {
  if (!statusNode) return;
  statusNode.textContent = message;
  statusNode.classList.remove('is-success', 'is-error');
  if (type) statusNode.classList.add(`is-${type}`);
}

function markInvalidFields(form) {
  form.querySelectorAll('.form-row').forEach((row) => row.classList.remove('has-error'));
  form.querySelectorAll('input, select, textarea').forEach((field) => {
    const isFormControl = field instanceof HTMLInputElement
      || field instanceof HTMLSelectElement
      || field instanceof HTMLTextAreaElement;

    if (isFormControl && !field.checkValidity()) {
      field.closest('.form-row')?.classList.add('has-error');
    }
  });
}

if (leadForm) {
  leadForm.addEventListener('input', () => {
    leadForm.querySelectorAll('.form-row').forEach((row) => row.classList.remove('has-error'));
    showStatus('', '');
  });

  leadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!leadForm.checkValidity()) {
      markInvalidFields(leadForm);
      showStatus('Заполните обязательные поля и согласие на обработку данных.', 'error');
      return;
    }

    const submitButton = leadForm.querySelector('button[type="submit"]');
    submitButton?.setAttribute('disabled', 'disabled');
    showStatus('Отправляем заявку...', '');

    if (isStaticHosting) {
      window.setTimeout(() => {
        leadForm.reset();
        if (sourceInput) sourceInput.value = 'Форма заявки на сайте';
        showStatus('Демо-заявка подготовлена. Для реальной записи позвоните в сервис.', 'success');
        submitButton?.removeAttribute('disabled');
      }, 450);
      return;
    }

    try {
      const response = await fetch(leadForm.action, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: new FormData(leadForm)
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Не удалось отправить заявку.');
      }

      leadForm.reset();
      if (sourceInput) sourceInput.value = 'Форма заявки на сайте';
      showStatus(result.message || 'Заявка отправлена. Сервис свяжется с вами.', 'success');
    } catch (error) {
      showStatus(error.message || 'Ошибка отправки. Попробуйте позвонить в сервис.', 'error');
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });
}
