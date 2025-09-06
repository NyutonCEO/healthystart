
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

  const perMile = 2.50; // Out-of-town per-mile example

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
  if (note) note.textContent = 'Out-of-town estimate at $2.50/mile. Minimum fare may apply.';
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
handleFormSubmit('bookForm', 'bookSuccess');
handleFormSubmit('demoForm', 'demoSuccess');
handleFormSubmit('contactForm', 'contactSuccess');

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
