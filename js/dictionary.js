/* =====================================================
   LEGAL CHORDS — Dictionary / Glossary Interactions
   ===================================================== */

(function () {
  'use strict';

  /* ============ THEME TOGGLE (shared) ============ */
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  const setTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('lc-theme', theme); } catch (e) {}
    themeToggle.setAttribute('aria-label',
      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  };

  const initialTheme = root.getAttribute('data-theme') || 'dark';
  setTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

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

  /* ============ LOAD TERMS ============ */
  const grid = document.getElementById('dictGrid');
  const searchInput = document.getElementById('dictSearch');
  const resultsCount = document.getElementById('dictResultsCount');
  const clearBtn = document.getElementById('dictClearBtn');
  const overlay = document.getElementById('dictOverlay');
  const panel = document.getElementById('dictPanel');
  const backTop = document.getElementById('dictBackTop');
  let allTerms = [];
  let activeLetter = null;
  let activeCategory = null;

  function loadTerms() {
    fetch('data/legal-terms.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load terms');
        return res.json();
      })
      .then(terms => {
        allTerms = terms.sort((a, b) => a.term.localeCompare(b.term));
        buildAZIndex();
        buildCategoryFilters();
        renderTerms(allTerms);
        handleHashNavigation();
      })
      .catch(err => {
        grid.innerHTML = '<div class="dict-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><h3>Could not load dictionary</h3><p>Please try refreshing the page.</p></div>';
        console.error('[Legal Chords] Dictionary load error:', err);
      });
  }

  /* ============ A-Z INDEX ============ */
  function buildAZIndex() {
    const azContainer = document.getElementById('dictAZ');
    const availableLetters = new Set(allTerms.map(t => t.term[0].toUpperCase()));
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    alphabet.forEach(letter => {
      const btn = document.createElement('button');
      btn.className = 'dict-az-btn' + (availableLetters.has(letter) ? '' : ' disabled');
      btn.textContent = letter;
      btn.setAttribute('aria-label', 'Filter by letter ' + letter);
      if (availableLetters.has(letter)) {
        btn.addEventListener('click', () => toggleLetter(letter, btn));
      }
      azContainer.appendChild(btn);
    });
  }

  function toggleLetter(letter, btn) {
    if (activeLetter === letter) {
      activeLetter = null;
      btn.classList.remove('active');
    } else {
      document.querySelectorAll('.dict-az-btn').forEach(b => b.classList.remove('active'));
      activeLetter = letter;
      btn.classList.add('active');
    }
    filterAndRender();
  }

  /* ============ CATEGORY FILTERS ============ */
  function buildCategoryFilters() {
    const container = document.getElementById('dictFilters');
    const categories = [...new Set(allTerms.map(t => t.category))].sort();

    const allBtn = document.createElement('button');
    allBtn.className = 'dict-filter active';
    allBtn.textContent = 'All';
    allBtn.addEventListener('click', () => {
      activeCategory = null;
      container.querySelectorAll('.dict-filter').forEach(b => b.classList.remove('active'));
      allBtn.classList.add('active');
      filterAndRender();
    });
    container.appendChild(allBtn);

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'dict-filter';
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        activeCategory = cat;
        container.querySelectorAll('.dict-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterAndRender();
      });
      container.appendChild(btn);
    });
  }

  /* ============ SEARCH ============ */
  let debounceTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(filterAndRender, 200);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterAndRender();
      searchInput.blur();
    }
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    activeLetter = null;
    activeCategory = null;
    document.querySelectorAll('.dict-az-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dict-filter').forEach(b => b.classList.remove('active'));
    document.querySelector('.dict-filter').classList.add('active');
    filterAndRender();
    searchInput.focus();
  });

  /* ============ FILTER + RENDER ============ */
  function filterAndRender() {
    const query = searchInput.value.toLowerCase().trim();
    let filtered = allTerms;

    if (query) {
      filtered = filtered.filter(t =>
        t.term.toLowerCase().includes(query) ||
        t.definition.toLowerCase().includes(query) ||
        t.plainLanguageSummary.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    if (activeLetter) {
      filtered = filtered.filter(t => t.term[0].toUpperCase() === activeLetter);
    }

    if (activeCategory) {
      filtered = filtered.filter(t => t.category === activeCategory);
    }

    const hasFilters = query || activeLetter || activeCategory;
    clearBtn.classList.toggle('visible', hasFilters);

    renderTerms(filtered);
  }

  function renderTerms(terms) {
    if (!terms.length) {
      grid.innerHTML = `
        <div class="dict-empty">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <h3>No terms found</h3>
          <p>Try a different search or clear your filters.</p>
        </div>`;
      resultsCount.innerHTML = 'Showing <strong>0</strong> terms';
      return;
    }

    resultsCount.innerHTML = `Showing <strong>${terms.length}</strong> term${terms.length !== 1 ? 's' : ''}`;

    grid.innerHTML = terms.map(term => `
      <div class="dict-card" tabindex="0" role="button"
           aria-label="View definition of ${term.term}"
           data-slug="${term.slug}"
           onclick="window.openTerm('${term.slug}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window.openTerm('${term.slug}')}">
        <div class="dict-card-letter">${term.term[0]}</div>
        <span class="dict-card-category">${term.category}</span>
        <h3>${term.term}</h3>
        <p class="dict-card-def">${term.definition}</p>
        <div class="dict-card-plain">
          <strong>In plain language</strong>
          ${term.plainLanguageSummary}
        </div>
      </div>
    `).join('');
  }

  /* ============ TERM DETAIL PANEL ============ */
  window.openTerm = function (slug) {
    const term = allTerms.find(t => t.slug === slug);
    if (!term) return;

    const relatedHTML = term.relatedTerms.length
      ? `<h4>Related Terms</h4>
         <div class="dict-panel-related">
           ${term.relatedTerms.map(r => {
             const rel = allTerms.find(t => t.slug === r);
             const label = rel ? rel.term : r.replace(/-/g, ' ');
             return `<a href="#" onclick="event.preventDefault();window.openTerm('${r}')">${label}</a>`;
           }).join('')}
         </div>`
      : '';

    const citationsHTML = term.citations.length
      ? `<h4>Citations</h4>
         <ul class="dict-panel-citations">
           ${term.citations.map(c => `<li>${c}</li>`).join('')}
         </ul>`
      : '';

    panel.innerHTML = `
      <button class="dict-panel-close" aria-label="Close term detail" onclick="window.closeTerm()">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="dict-panel-letter">${term.term[0]}</div>
      <span class="dict-panel-category">${term.category}</span>
      <h2>${term.term}</h2>
      <h4>Definition</h4>
      <p>${term.definition}</p>
      <h4>In Plain Language</h4>
      <div class="dict-panel-plain"><p>${term.plainLanguageSummary}</p></div>
      ${citationsHTML}
      ${relatedHTML}
      <p class="dict-panel-date">Last reviewed: ${new Date(term.lastReviewed).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
    `;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Update URL hash
    history.pushState(null, '', '#' + slug);

    // Focus the panel
    setTimeout(() => panel.focus(), 100);
  };

  window.closeTerm = function () {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    history.pushState(null, '', window.location.pathname);
  };

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) window.closeTerm();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      window.closeTerm();
    }
  });

  /* ============ HASH NAVIGATION ============ */
  function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash && allTerms.find(t => t.slug === hash)) {
      setTimeout(() => window.openTerm(hash), 100);
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && allTerms.find(t => t.slug === hash)) {
      window.openTerm(hash);
    } else if (!hash) {
      window.closeTerm();
    }
  });

  /* ============ BACK TO TOP ============ */
  window.addEventListener('scroll', () => {
    backTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });

  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ============ KEYBOARD SHORTCUTS ============ */
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  /* ============ INIT ============ */
  loadTerms();

})();
