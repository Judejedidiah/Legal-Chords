/* =====================================================
   LEGAL CHORDS — Shared Site Navigation Behaviors
   Theme toggle, navbar scroll state, mobile drawer and
   nav dropdowns. Loaded on every public page BEFORE the
   page-specific script so one implementation serves all.
   ===================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');
  const navbar = document.getElementById('navbar');

  /* ============ THEME TOGGLE ============ */
  // These helpers never persist on their own — localStorage is only
  // written when the user explicitly toggles, so the
  // prefers-color-scheme listener below stays alive.
  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (themeToggle) {
      themeToggle.setAttribute('aria-label',
        theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  };
  const applyThemeChoice = (theme) => {
    setTheme(theme);
    try { localStorage.setItem('lc-theme', theme); } catch (e) {}
  };

  // Sync with the inline FOUC-prevention script without persisting.
  let savedTheme = null;
  try { savedTheme = localStorage.getItem('lc-theme'); } catch (e) {}
  setTheme(savedTheme || root.getAttribute('data-theme') || 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      applyThemeChoice(current === 'dark' ? 'light' : 'dark');
    });
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (e) => {
      try {
        if (!localStorage.getItem('lc-theme')) {
          setTheme(e.matches ? 'light' : 'dark');
        }
      } catch (err) {}
    };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ============ NAVBAR SCROLL STATE ============ */
  if (navbar) {
    const onScroll = () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ============ MOBILE MENU ============ */
  const toggleMenu = (open) => {
    if (!hamburger || !navLinks) return;
    const isOpen = open !== undefined ? open : !navLinks.classList.contains('open');
    navLinks.classList.toggle('open', isOpen);
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    document.body.style.overflow = isOpen ? 'hidden' : '';
  };

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => toggleMenu());
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  // Exposed so page scripts (e.g. CTA buttons inside the drawer)
  // can close the menu programmatically.
  window.closeMobileMenu = () => toggleMenu(false);

  /* ============ NAV DROPDOWNS ============ */
  const closeAllDropdowns = () => {
    document.querySelectorAll('.nav-dropdown.open').forEach((dd) => {
      dd.classList.remove('open');
      const t = dd.querySelector('.nav-dropdown-toggle');
      if (t) t.setAttribute('aria-expanded', 'false');
    });
  };

  document.querySelectorAll('.nav-dropdown-toggle').forEach((toggle) => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const dd = toggle.closest('.nav-dropdown');
      if (!dd) return;
      const isOpen = dd.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-dropdown')) closeAllDropdowns();
  });

})();