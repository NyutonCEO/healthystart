
// Mobile nav
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    if (!isOpen) {
      // Close any open submenus when main menu closes
      document.querySelectorAll('.has-submenu').forEach(li => {
        li.classList.remove('open');
        li.querySelector('.submenu-toggle')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
}

// Submenu toggles (supports mobile)
document.querySelectorAll('.submenu-toggle').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const li = btn.closest('.has-submenu');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    li?.classList.toggle('open', !expanded);
  });
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const li = btn.closest('.has-submenu');
      li?.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      btn.focus();
    }
  });
});

// Click outside to close any open submenu
document.addEventListener('click', (e) => {
  document.querySelectorAll('.has-submenu.open').forEach(li => {
    if (!li.contains(e.target)) {
      li.classList.remove('open');
      li.querySelector('.submenu-toggle')?.setAttribute('aria-expanded', 'false');
    }
  });
});

// Quote estimator
function calculateQuote() {
  const tripLocal = document.getElementById('tripLocal');
  const milesInput = document.getElementById('miles');
  const milesRow = document.getElementById('milesRow');
  const res = document.getElementById('quoteResult');
  const note = document.getElementById('quoteNote');

  const perMile = 4.15; // Out-of-town per-mile example

  if (tripLocal && tripLocal.checked) {
    if (milesRow) milesRow.hidden = true;
    if (res) res.textContent = `$${(20).toFixed(2)}`; // Local Wilson roundtrip
    if (note) note.textContent = 'Local Wilson roundtrip. Pricing subject to change.';
    return;
  }

  // Out-of-town
  if (milesRow) milesRow.hidden = false;
  const miles = parseFloat(milesInput?.value || '0');
  const total = Math.max(0, miles * perMile);
  if (res) res.textContent = `$${total.toFixed(2)}`;
  if (note) note.textContent = 'Out-of-town estimate at $4.15/mile. Minimum fare may apply.';
}

// Simple form handlers (demo only)
function handleFormSubmit(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form || !success) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    // In production, send to your backend or a secure form endpoint
    console.log(`Submitting ${formId}`, Object.fromEntries(data.entries()));
    form.reset();
    success.hidden = false;
    setTimeout(() => (success.hidden = true), 6000);
  });
}
handleFormSubmit('contactForm', 'contactSuccess');

// Patients: Book form with 24h validation and Formspree submission
(function initBookForm() {
  const form = document.getElementById('bookForm');
  if (!form) return;
  const success = document.getElementById('bookSuccess');
  const errorBox = document.getElementById('bookError');
  const dateEl = form.querySelector('input[name="date"]');
  const timeEl = form.querySelector('input[name="time"]');
  const submitBtn = form.querySelector('button[type="submit"]');

  function showError(msg) {
    if (errorBox) { errorBox.textContent = msg; errorBox.hidden = false; }
    if (success) success.hidden = true;
  }
  function clearError() { if (errorBox) errorBox.hidden = true; }
  function showSuccess() { if (success) success.hidden = false; }

  function parseLocalDateTime(dateStr, timeStr) {
    // dateStr: YYYY-MM-DD, timeStr: HH:MM (optional :SS)
    const [y, m, d] = (dateStr || '').split('-').map(n => parseInt(n, 10));
    if (!y || !m || !d) return null;
    const [hh, mm, ss] = (timeStr || '').split(':').map(n => parseInt(n, 10));
    if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
    return new Date(y, (m - 1), d, hh || 0, mm || 0, ss || 0, 0);
  }

  function isValidLeadTime() {
    const dateVal = dateEl?.value;
    const timeVal = timeEl?.value;
    if (!dateVal || !timeVal) return false;
    const requested = parseLocalDateTime(dateVal, timeVal);
    if (!requested) return false;
    const now = new Date();
    const diffMs = requested.getTime() - now.getTime();
    const minLead = 24 * 60 * 60 * 1000; // 24 hours
    return diffMs >= minLead;
  }

  // Set min date/time constraints based on 24h lead time
  function pad(n) { return String(n).padStart(2, '0'); }
  function setMinConstraints() {
    const now = new Date();
    const min = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    if (dateEl) dateEl.min = `${min.getFullYear()}-${pad(min.getMonth() + 1)}-${pad(min.getDate())}`;
    // If the selected date equals min date, constrain time as well; otherwise clear time min
    if (dateEl && timeEl) {
      const selected = dateEl.value;
      const minDateStr = dateEl.min;
      if (selected && selected === minDateStr) {
        timeEl.min = `${pad(min.getHours())}:${pad(min.getMinutes())}`;
      } else {
        timeEl.removeAttribute('min');
      }
    }
  }
  setMinConstraints();
  dateEl?.addEventListener('change', () => { clearError(); setMinConstraints(); });
  timeEl?.addEventListener('change', () => { clearError(); });

  form.addEventListener('submit', async (e) => {
    clearError();
    if (!isValidLeadTime()) {
      e.preventDefault();
      showError('Please choose a pickup at least 24 hours from now.');
      return;
    }
    // Submit via fetch to keep user on the page
    e.preventDefault();
    try {
      submitBtn?.setAttribute('disabled', 'true');
      const fd = new FormData(form);
      const res = await fetch(form.action, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } });
      if (res.ok) {
        form.reset();
        showSuccess();
        setMinConstraints();
      } else {
        // Try to extract Formspree error details
        try {
          const data = await res.json();
          const msg = data?.errors?.map(e => e.message).join(' ') || data?.error || null;
          if (msg) showError(msg);
        } catch (_) {
          // ignore JSON parse error
        }
        // Fallback: submit normally to Formspree (page redirect)
        if (!errorBox || errorBox.hidden) {
          // If we didn't show a specific error, fall back to native submit
          form.submit();
          return;
        }
      }
    } catch (err) {
      showError('Network error. Please try again, or call (252) 674‑1812.');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
})();

// Smooth scroll for in-page anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href').substring(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
