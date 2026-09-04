/* =====================================================
   LEGAL CHORDS — Frontend Interactions
===================================================== */

(function () {
  'use strict';

  /* ============ THEME TOGGLE ============ */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('lc-theme', theme); } catch (e) {}
    themeToggle.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };

  // Initial sync with what the inline init script applied
  const initialTheme = root.getAttribute('data-theme') || 'dark';
  setTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // React to system preference changes (only when user hasn't manually chosen)
  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('lc-theme')) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      } catch (err) {}
    });
  }

  /* ============ NAVBAR SCROLL STATE ============ */
  const navbar = document.getElementById('navbar');
  const onScroll = () => {
    if (window.scrollY > 30) navbar.classList.add('scrolled');
    else navbar.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============ MOBILE MENU ============ */
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const toggleMenu = (open) => {
    const isOpen = open ?? !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };
  hamburger.addEventListener('click', () => toggleMenu());
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  /* ============ NAV DROPDOWNS ============ */
  const closeAllDropdowns = () => {
    document.querySelectorAll('.nav-dropdown.open').forEach(dd => {
      dd.classList.remove('open');
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };
  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dd = toggle.closest('.nav-dropdown');
      const isOpen = dd.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) closeAllDropdowns();
  });

  /* ============ ACTIVE NAV LINK ON SCROLL ============ */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-link');
  const setActiveLink = () => {
    const scrollY = window.scrollY + 120;
    let current = '';
    sections.forEach(sec => {
      if (scrollY >= sec.offsetTop && scrollY < sec.offsetTop + sec.offsetHeight) {
        current = sec.id;
      }
    });
    if (current) {
      navItems.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === '#' + current);
      });
      // Highlight dropdown toggles whose child is active
      document.querySelectorAll('.nav-dropdown').forEach(dd => {
        const hasActive = dd.querySelector('.nav-dropdown-item.active');
        const t = dd.querySelector('.nav-dropdown-toggle');
        if (t) t.classList.toggle('active', !!hasActive);
      });
    }
  };
  window.addEventListener('scroll', setActiveLink, { passive: true });

  /* ============ SCROLL REVEAL ============ */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => revealObserver.observe(el));

  /* ============ ANIMATED COUNTERS ============ */
  const counters = document.querySelectorAll('.counter');
  const animateCounter = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1800;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.floor(eased * target);
      el.textContent = value;
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    };
    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  /* ============ TESTIMONIAL CAROUSEL ============ */
  const tTrack = document.getElementById('tTrack');
  const tDots = document.getElementById('tDots');
  const tPrev = document.querySelector('.t-prev');
  const tNext = document.querySelector('.t-next');
  const tCards = tTrack ? tTrack.querySelectorAll('.t-card') : [];

  if (tTrack && tCards.length) {
    let currentIndex = 0;

    // Build dots
    tCards.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'dot-btn' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
      dot.addEventListener('click', () => scrollToIndex(i));
      tDots.appendChild(dot);
    });

    const getStep = () => {
      const card = tCards[0];
      const style = getComputedStyle(tTrack);
      const gap = parseInt(style.gap) || 20;
      return card.offsetWidth + gap;
    };

    const scrollToIndex = (i) => {
      currentIndex = Math.max(0, Math.min(i, tCards.length - 1));
      tTrack.scrollTo({ left: currentIndex * getStep(), behavior: 'smooth' });
      updateDots();
    };

    const updateDots = () => {
      tDots.querySelectorAll('.dot-btn').forEach((d, i) => {
        d.classList.toggle('active', i === currentIndex);
      });
    };

    tPrev.addEventListener('click', () => scrollToIndex(currentIndex - 1));
    tNext.addEventListener('click', () => scrollToIndex(currentIndex + 1));

    let scrollTimer;
    tTrack.addEventListener('scroll', () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const step = getStep();
        currentIndex = Math.round(tTrack.scrollLeft / step);
        updateDots();
      }, 80);
    });
  }

  /* ============ RESOURCE TABS ============ */
  const tabs = document.querySelectorAll('.resource-tabs .tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  /* ============ JOIN MODAL ============ */
  const joinModal = document.getElementById('joinModal');
  const joinForm = document.getElementById('joinForm');
  const joinSuccess = document.getElementById('joinSuccess');

  const closeJoinModal = () => {
    joinModal.classList.remove('open');
    joinModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('join-open');
  };

  const openJoinModal = () => {
    if (joinForm) joinForm.hidden = false;
    if (joinSuccess) joinSuccess.hidden = true;
    joinModal.classList.add('open');
    joinModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('join-open');
    setTimeout(() => {
      const first = joinModal.querySelector('input[id], select, textarea');
      if (first) first.focus();
    }, 250);
  };

  document.querySelectorAll('[data-join-open]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openJoinModal();
    });
  });

  document.querySelectorAll('[data-join-close]').forEach(el => {
    el.addEventListener('click', closeJoinModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && joinModal.classList.contains('open')) closeJoinModal();
  });

  joinModal.addEventListener('click', (e) => {
    if (e.target === joinModal || e.target.classList.contains('join-modal-backdrop')) {
      closeJoinModal();
    }
  });

  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!joinForm.checkValidity()) {
        joinForm.reportValidity();
        return;
      }
      const data = new FormData(joinForm);
      const payload = Object.fromEntries(data.entries());
      payload.interests = data.getAll('interests');

      const btn = joinForm.querySelector('.join-submit');
      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      try {
        if (window.db) {
          const { error } = await window.db.from('memberships').insert({
            firstname: payload.firstname,
            middlename: payload.middlename,
            lastname: payload.lastname,
            email: payload.email,
            country_code: payload.country_code || '+234',
            phone: payload.phone,
            role: payload.role,
            institution: payload.institution,
            location: payload.location,
            interests: payload.interests,
            involvement: payload.involvement,
            source: payload.source,
            message: payload.message
          });
          if (error) throw error;
          console.info('[Legal Chords] Membership saved to Supabase:', payload.email);
        } else {
          console.warn('[Legal Chords] Supabase not available, form data logged only:', payload);
        }
      } catch (err) {
        console.error('[Legal Chords] Submit error:', err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
        joinForm.hidden = true;
        joinSuccess.hidden = false;
      }
    });
  }

  /* ============ NEWSLETTER FORM ============ */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = newsletterForm.querySelector('input[type="email"]');
      const btn = newsletterForm.querySelector('button');
      const email = input.value.trim();
      if (!email) return;

      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '...';

      try {
        if (window.db) {
          const { error } = await window.db.from('newsletter_subscribers').upsert(
            { email, status: 'active' },
            { onConflict: 'email' }
          );
          if (error) throw error;
          console.info('[Legal Chords] Newsletter subscriber saved:', email);
        }
      } catch (err) {
        console.error('[Legal Chords] Newsletter error:', err.message);
      } finally {
        btn.textContent = '✓';
        input.value = '';
        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 3000);
      }
    });
  }

  /* ============ SMOOTH ANCHOR SCROLL ============ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if (this.dataset.joinOpen) return;
      const href = this.getAttribute('href');
      if (!href || href === '#') { e.preventDefault(); return; }
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const offset = 80;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============ PARALLAX HERO ORBS ============ */
  const orbs = document.querySelectorAll('.hero-orb');
  if (orbs.length && window.matchMedia('(min-width: 768px)').matches) {
    let ticking = false;
    window.addEventListener('mousemove', (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const x = (e.clientX / window.innerWidth - 0.5) * 20;
          const y = (e.clientY / window.innerHeight - 0.5) * 20;
          orbs.forEach((orb, i) => {
            const factor = (i + 1) * 0.5;
            orb.style.transform = `translate(${x * factor}px, ${y * factor}px)`;
          });
          ticking = false;
        });
        ticking = true;
      }
    });
  }

})();