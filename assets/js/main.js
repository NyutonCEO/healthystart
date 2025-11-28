
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

// Simple form handlers with Formspree submission
function handleFormSubmit(formId, successId) {
  const form = document.getElementById(formId);
  const success = document.getElementById(successId);
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    
    if (submitBtn) {
      submitBtn.setAttribute('disabled', 'true');
      submitBtn.textContent = 'Submitting...';
    }
    
    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, { 
        method: 'POST', 
        body: fd, 
        headers: { 'Accept': 'application/json' } 
      });
      
      if (res.ok) {
        form.reset();
        if (success) {
          success.hidden = false;
          setTimeout(() => (success.hidden = true), 6000);
        }
      } else {
        const data = await res.json();
        if (data.error) {
          alert('Error: ' + data.error);
        }
      }
    } catch (err) {
      console.error('Form submission error:', err);
      alert('Network error. Please try again or call (252) 674‑1812.');
    } finally {
      if (submitBtn) {
        submitBtn.removeAttribute('disabled');
        submitBtn.textContent = submitBtn.getAttribute('data-original-text') || 'Submit';
      }
    }
  });
  
  // Store original button text
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn && !submitBtn.getAttribute('data-original-text')) {
    submitBtn.setAttribute('data-original-text', submitBtn.textContent);
  }
}
handleFormSubmit('contactForm', 'contactSuccess');
handleFormSubmit('demoForm', 'demoSuccess');

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


// Theme toggle with localStorage persistence
(function initThemeToggle() {
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  
  const key = 'hs-theme';
  const stored = localStorage.getItem(key);
  if (stored === 'dark') {
    root.setAttribute('data-theme', 'dark');
    btn.textContent = '☀️';
    btn.setAttribute('aria-pressed', 'true');
  } else {
    root.setAttribute('data-theme', 'light');
    btn.textContent = '🌙';
    btn.setAttribute('aria-pressed', 'false');
  }
  
  btn.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    btn.textContent = next === 'dark' ? '☀️' : '🌙';
    btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false');
    localStorage.setItem(key, next);
  });
})();

// Scroll-triggered animations with stagger
(function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        
        // Animate cards in grid with stagger
        const cards = entry.target.querySelectorAll('.card');
        cards.forEach((card, i) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, i * 100);
        });
        
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  
  document.querySelectorAll('.section:not(:first-of-type)').forEach(section => {
    observer.observe(section);
  });
})();

// Animated counter
function animateCounter(element, target, duration = 2000) {
  
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    
    if (element && typeof element.textContent === 'string') {
      const suffix = element.textContent.replace(/[\d,]/g, '');
      element.textContent = current.toLocaleString() + suffix;
    }
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

(function initCounters() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const strong = entry.target.querySelector('strong');
        if (strong) {
          const text = strong.textContent || '';
          const match = text.match(/[\d,]+/);
          if (match) {
            const value = parseInt(match[0].replace(/,/g, ''), 10);
            const suffix = text.replace(/[\d,]/g, '');
            strong.textContent = '0' + suffix;
            animateCounter(strong, value);
          }
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  
  document.querySelectorAll('.kpi').forEach(kpi => observer.observe(kpi));
})();

// Testimonial slider (only initialize if not already handled by Google Reviews)
(function initSlider() {
  const container = document.querySelector('.slider-container');
  const track = document.querySelector('.slider-track');
  const slides = document.querySelectorAll('.slider-slide');
  const prevBtn = document.querySelector('.slider-btn[data-direction="prev"]');
  const nextBtn = document.querySelector('.slider-btn[data-direction="next"]');
  const nav = document.querySelector('.slider-nav');

  if (!container || !track || !slides || slides.length === 0) return;
  
  // Skip if this is the testimonials section (handled by Google Reviews)
  if (container.closest('#testimonials-container')) return;
  
  let currentIndex = 0;
  let autoPlayInterval;
  
  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    
    // Fade out current slide
    if (slides[currentIndex]) {
      slides[currentIndex].style.opacity = '0';
      slides[currentIndex].style.transform = 'scale(0.95)';
    }
    
    currentIndex = index;
    
    // Animate slide transition
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Fade in new slide with delay
    setTimeout(() => {
      if (slides[currentIndex]) {
        slides[currentIndex].style.opacity = '1';
        slides[currentIndex].style.transform = 'scale(1)';
        slides[currentIndex].style.transition = 'opacity 0.5s ease, transform 0.5s ease';
      }
    }, 100);
    
    if (nav) {
      nav.querySelectorAll('button').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
        dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
      });
    }
    
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === slides.length - 1;
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  }
  
  if (nav) {
    nav.querySelectorAll('button').forEach((btn, i) => {
      btn.addEventListener('click', () => goToSlide(i));
    });
  }
  
  function startAutoPlay() {
    autoPlayInterval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
  }
  
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
  }
  
  container.addEventListener('mouseenter', stopAutoPlay);
  container.addEventListener('mouseleave', startAutoPlay);
  
  goToSlide(0);
  startAutoPlay();
})();

// Parallax effect
(function initParallax() {
  const heroImage = document.querySelector('.hero-image');
  if (!heroImage) return;
  
  let ticking = false;
  
  function updateParallax() {
    const scrolled = window.scrollY;
    const parallax = scrolled * 0.3;
    heroImage.style.transform = `translateY(${parallax}px)`;
    ticking = false;
  }
  
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
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

// Google Reviews Integration
(function initGoogleReviews() {
  const track = document.getElementById('testimonials-track');
  const nav = document.getElementById('testimonials-nav');
  if (!track || !nav) return;

  // Configuration - These should be set via environment variables or server-side
  // For now, using placeholder values that need to be configured
  const GOOGLE_PLACE_ID = window.GOOGLE_PLACE_ID || '';
  const GOOGLE_API_KEY = window.GOOGLE_API_KEY || '';

  // Fallback testimonials if API fails
  const fallbackTestimonials = [
    {
      rating: 5,
      text: "Healthy Start has been a lifesaver for my monthly dialysis appointments. They're always on time and the drivers are professional and caring.",
      author: "Mary Johnson",
      location: "Patient"
    },
    {
      rating: 5,
      text: "Partnering with Healthy Start has significantly reduced our patient no-show rates. Their reliable service and easy coordination make all the difference.",
      author: "Dr. Sarah Williams",
      location: "Greenville Medical Center"
    },
    {
      rating: 5,
      text: "As someone who uses a wheelchair, I appreciate their accessible vehicles and trained staff. It gives me peace of mind knowing I'll get to my appointments safely.",
      author: "Robert Martinez",
      location: "Patient"
    }
  ];

  function formatReviewName(name) {
    if (!name) return 'Anonymous';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0];
    return parts[0] + ' ' + parts[parts.length - 1].charAt(0) + '.';
  }

  function formatStars(rating) {
    const fullStars = Math.floor(rating);
    const stars = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
    return stars;
  }

  function createTestimonialSlide(review) {
    const slide = document.createElement('div');
    slide.className = 'slider-slide';
    slide.innerHTML = `
      <blockquote class="testimonial">
        <div class="testimonial-rating">
          <span class="stars">${formatStars(review.rating)}</span>
        </div>
        <p>${review.text}</p>
        <cite>— ${formatReviewName(review.author)}${review.location ? ', ' + review.location : ''}</cite>
      </blockquote>
    `;
    return slide;
  }

  function renderTestimonials(reviews) {
    // Clear existing slides (except fallbacks if no reviews)
    const existingSlides = track.querySelectorAll('.slider-slide');
    existingSlides.forEach(slide => slide.remove());

    // Add new slides
    reviews.forEach(review => {
      track.appendChild(createTestimonialSlide(review));
    });

    // Update navigation dots
    nav.innerHTML = '';
    for (let i = 0; i < reviews.length; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Testimonial ${i + 1}`);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      if (i === 0) dot.classList.add('active');
      nav.appendChild(dot);
    }

    // Reinitialize slider with new slides
    initTestimonialsSlider();
  }

  function initTestimonialsSlider() {
    const container = document.querySelector('.slider-container');
    const slides = track.querySelectorAll('.slider-slide');
    const prevBtn = document.querySelector('.slider-btn[data-direction="prev"]');
    const nextBtn = document.querySelector('.slider-btn[data-direction="next"]');
    const navButtons = nav.querySelectorAll('button');

    if (!container || !track || !slides || slides.length === 0) return;

    let currentIndex = 0;
    let autoPlayInterval;

    function goToSlide(index) {
      if (index < 0) index = slides.length - 1;
      if (index >= slides.length) index = 0;

      if (slides[currentIndex]) {
        slides[currentIndex].style.opacity = '0';
        slides[currentIndex].style.transform = 'scale(0.95)';
      }

      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      setTimeout(() => {
        if (slides[currentIndex]) {
          slides[currentIndex].style.opacity = '1';
          slides[currentIndex].style.transform = 'scale(1)';
        }
      }, 100);

      navButtons.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentIndex);
        dot.setAttribute('aria-selected', i === currentIndex ? 'true' : 'false');
      });

      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
    }

    // Remove old event listeners by cloning and replacing
    const newPrevBtn = prevBtn?.cloneNode(true);
    const newNextBtn = nextBtn?.cloneNode(true);
    if (prevBtn && newPrevBtn) {
      prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
      newPrevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    }
    if (nextBtn && newNextBtn) {
      nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
      newNextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
    }

    navButtons.forEach((btn, i) => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => goToSlide(i));
    });

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayInterval = setInterval(() => {
        goToSlide(currentIndex + 1);
      }, 5000);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    }

    if (container) {
      container.addEventListener('mouseenter', stopAutoPlay);
      container.addEventListener('mouseleave', startAutoPlay);
    }

    goToSlide(0);
    startAutoPlay();
  }

  // Fetch Google Reviews - Try multiple methods
  async function fetchGoogleReviews() {
    // Method 1: Try server-side API endpoint (recommended)
    if (GOOGLE_PLACE_ID) {
      try {
        const response = await fetch(`/api/google-reviews?place_id=${GOOGLE_PLACE_ID}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.reviews && data.reviews.length > 0) {
            const formattedReviews = data.reviews.slice(0, 10).map(review => ({
              rating: review.rating || 5,
              text: review.text || '',
              author: review.author_name || 'Anonymous',
              location: null,
              date: review.relative_time_description || ''
            }));
            renderTestimonials(formattedReviews);
            return;
          }
        }
      } catch (error) {
        console.log('Server-side API not available, trying client-side method...', error);
      }
    }

    // Method 2: Try Google Places JavaScript API (if loaded)
    if (GOOGLE_PLACE_ID && GOOGLE_API_KEY && typeof google !== 'undefined' && google.maps && google.maps.places) {
      try {
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        service.getDetails({
          placeId: GOOGLE_PLACE_ID,
          fields: ['name', 'rating', 'reviews', 'user_ratings_total']
        }, (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place && place.reviews) {
            const formattedReviews = place.reviews.slice(0, 10).map(review => ({
              rating: review.rating || 5,
              text: review.text || '',
              author: review.author_name || 'Anonymous',
              location: null,
              date: review.relative_time_description || ''
            }));
            renderTestimonials(formattedReviews);
            return;
          }
          // If this method fails, fall through to fallback
          renderTestimonials(fallbackTestimonials);
        });
        return; // Don't fall through immediately
      } catch (error) {
        console.error('Error using Google Places JavaScript API:', error);
      }
    }

    // Fallback to default testimonials
    console.log('Google Reviews: API credentials not configured or API unavailable. Using fallback testimonials.');
    renderTestimonials(fallbackTestimonials);
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchGoogleReviews);
  } else {
    fetchGoogleReviews();
  }
})();