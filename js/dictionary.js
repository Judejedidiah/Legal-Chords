/* =====================================================
   LEGAL CHORDS — Dictionary / Glossary Interactions
   ===================================================== */

(function () {
  'use strict';

  // Theme toggle, navbar scroll state, mobile menu and nav dropdowns
  // live in js/site-nav.js (shared across all public pages).

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

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function firstLetter(term) {
    const t = (term || '').trim();
    return (t.charAt(0) || '?').toUpperCase();
  }

  function mapDbTerm(row) {
    return {
      term: row.term || '',
      slug: row.slug || '',
      definition: row.definition || '',
      plainLanguageSummary: row.plain_language_summary || '',
      category: row.category || '',
      relatedTerms: row.related_terms || [],
      citations: row.citations || [],
      keywords: row.keywords || [],
      lastReviewed: row.last_reviewed || null
    };
  }

  function loadBundledTerms() {
    return fetch('data/legal-terms.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load bundled terms');
        return res.json();
      });
  }

  function loadTerms() {
    const loadFromDb = (window.db && window.db.from)
      ? window.db.from('legal_terms').select('*').order('term')
      : Promise.reject(new Error('Supabase client unavailable'));

    loadFromDb
      .then(({ data, error }) => {
        if (error) throw error;
        if (!data || !data.length) throw new Error('No terms in Supabase');
        return data.map(mapDbTerm);
      })
      .catch(() => loadBundledTerms())
      .then(terms => {
        allTerms = terms.sort((a, b) => a.term.localeCompare(b.term));
        buildAZIndex();
        buildCategoryFilters();
        renderTerms(allTerms);
        handleHashNavigation();
      })
      .catch(err => {
        if (!grid.children.length) {
          grid.innerHTML = '<div class="dict-empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><h3>Could not load dictionary</h3><p>Please try refreshing the page.</p></div>';
        }
        console.error('[Legal Chords] Dictionary load error:', err);
      });
  }

  /* ============ A-Z INDEX ============ */
  function buildAZIndex() {
    const azContainer = document.getElementById('dictAZ');
    const availableLetters = new Set(allTerms.map(t => firstLetter(t.term)));
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
    const categories = [...new Set(allTerms.map(t => t.category).filter(Boolean))].sort();

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
    renderSuggestions();
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!suggestBox.hidden) {
        hideSuggestions();
        return;
      }
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
    const allFilter = document.querySelector('.dict-filter');
    if (allFilter) allFilter.classList.add('active');
    filterAndRender();
    searchInput.focus();
  });

  /* ============ SUGGEST-AS-YOU-TYPE ============ */
  const suggestBox = document.getElementById('dictSuggest');
  let suggestItems = [];
  let suggestIndex = -1;

  function norm(s) { return s.toLowerCase().trim(); }

  function suggestMatches(query) {
    const q = norm(query);
    if (!q || !allTerms.length) return [];
    const scored = [];
    for (const t of allTerms) {
      const name = norm(t.term);
      const kw = (t.keywords || []).map(norm);
      const inName = name.includes(q);
      const startsName = name.startsWith(q);
      const inKw = kw.some(k => k.includes(q));
      if (inName || inKw) {
        scored.push({ t, score: (startsName ? 0 : inName ? 1 : 2) });
      }
    }
    return scored.sort((a, b) => a.score - b.score || a.t.term.localeCompare(b.t.term)).slice(0, 8);
  }

  function renderSuggestions() {
    const matches = suggestMatches(searchInput.value);
    if (!matches.length) {
      hideSuggestions();
      return;
    }
    suggestItems = matches;
    suggestIndex = -1;
    suggestBox.innerHTML = matches.map(({ t }, i) => `
      <button type="button" class="dict-suggest-item" role="option"
              data-index="${i}" data-slug="${esc(t.slug)}">
        <span class="dict-suggest-term">${esc(t.term)}</span>
        <span class="dict-suggest-meta">${esc(t.category)}</span>
      </button>
    `).join('');
    suggestBox.hidden = false;
    suggestBox.setAttribute('aria-hidden', 'false');
  }

  function hideSuggestions() {
    suggestBox.hidden = true;
    suggestBox.setAttribute('aria-hidden', 'true');
    suggestItems = [];
    suggestIndex = -1;
  }

  function pickSuggestion(slug) {
    const hit = allTerms.find(t => t.slug === slug);
    if (!hit) return;
    searchInput.value = hit.term;
    filterAndRender();
    hideSuggestions();
    openTerm(slug);
  }

  // Delegated click for suggestion items (no inline handlers, no
  // global function lookups — XSS-hardened).
  suggestBox.addEventListener('click', (e) => {
    const item = e.target.closest('.dict-suggest-item');
    if (item) pickSuggestion(item.dataset.slug);
  });

  searchInput.addEventListener('keydown', (e) => {
    if (suggestBox.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const items = suggestBox.querySelectorAll('.dict-suggest-item');
      suggestIndex += (e.key === 'ArrowDown' ? 1 : -1);
      if (suggestIndex >= items.length) suggestIndex = 0;
      if (suggestIndex < 0) suggestIndex = items.length - 1;
      items.forEach((el, i) => el.classList.toggle('highlight', i === suggestIndex));
      items[suggestIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && suggestIndex >= 0) {
      e.preventDefault();
      const slug = suggestItems[suggestIndex].t.slug;
      pickSuggestion(slug);
    } else if (e.key === 'Enter') {
      const first = suggestItems[0];
      if (first) pickSuggestion(first.t.slug);
    }
  });

  document.addEventListener('click', (e) => {
    if (!suggestBox.hidden && !e.target.closest('.dict-search-wrap')) {
      hideSuggestions();
    }
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
        t.category.toLowerCase().includes(query) ||
        (t.keywords || []).some(k => k.toLowerCase().includes(query))
      );
    }

    if (activeLetter) {
      filtered = filtered.filter(t => firstLetter(t.term) === activeLetter);
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

    grid.innerHTML = terms.map(term => {
      const slug = esc(term.slug);
      const name = esc(term.term);
      const category = esc(term.category);
      const definition = esc(term.definition);
      const plain = esc(term.plainLanguageSummary);
      const letter = esc(firstLetter(term.term));
      return `
      <div class="dict-card" tabindex="0" role="button"
           aria-label="View definition of ${name}"
           data-slug="${slug}">
        <div class="dict-card-letter">${letter}</div>
        <span class="dict-card-category">${category}</span>
        <h3>${name}</h3>
        <p class="dict-card-def">${definition}</p>
        <div class="dict-card-plain">
          <strong>In plain language</strong>
          ${plain}
        </div>
      </div>
    `;
    }).join('');
  }

  // Delegated interactions for term cards (no inline handlers).
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.dict-card');
    if (card) openTerm(card.dataset.slug);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.dict-card');
    if (card) {
      e.preventDefault();
      openTerm(card.dataset.slug);
    }
  });

  /* ============ TERM DETAIL PANEL ============ */
  function openTerm(slug) {
    const term = allTerms.find(t => t.slug === slug);
    if (!term) return;

    const relatedHTML = (term.relatedTerms || []).length
      ? `<h4>Related Terms</h4>
         <div class="dict-panel-related">
           ${(term.relatedTerms || []).map(r => {
             const rel = allTerms.find(t => t.slug === r);
             const label = rel ? rel.term : String(r).replace(/-/g, ' ');
             return `<a href="#" data-rel="${esc(r)}">${esc(label)}</a>`;
           }).join('')}
         </div>`
      : '';

    const citationsHTML = (term.citations || []).length
      ? `<h4>Citations</h4>
         <ul class="dict-panel-citations">
           ${(term.citations || []).map(c => `<li>${esc(c)}</li>`).join('')}
         </ul>`
      : '';

    const reviewedLabel = term.lastReviewed
      ? `Last reviewed: ${new Date(term.lastReviewed).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`
      : 'Last reviewed: not recorded';

    panel.innerHTML = `
      <button class="dict-panel-close" type="button" data-dict-close aria-label="Close term detail">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
      <div class="dict-panel-letter">${esc(firstLetter(term.term))}</div>
      <span class="dict-panel-category">${esc(term.category)}</span>
      <h2>${esc(term.term)}</h2>
      <h4>Definition</h4>
      <p>${esc(term.definition)}</p>
      <h4>In Plain Language</h4>
      <div class="dict-panel-plain"><p>${esc(term.plainLanguageSummary)}</p></div>
      ${citationsHTML}
      ${relatedHTML}
      <p class="dict-panel-date">${esc(reviewedLabel)}</p>
    `;

    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Update URL hash
    if (window.location.hash !== '#' + slug) {
      history.pushState(null, '', '#' + slug);
    }

    // Focus the panel
    setTimeout(() => panel.focus(), 100);
  }

  function closeTerm() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (window.location.hash) {
      history.pushState(null, '', window.location.pathname);
    }
  }

  // Delegated panel interactions: close button + related-term links.
  panel.addEventListener('click', (e) => {
    if (e.target.closest('[data-dict-close]')) {
      closeTerm();
      return;
    }
    const rel = e.target.closest('[data-rel]');
    if (rel) {
      e.preventDefault();
      openTerm(rel.dataset.rel);
    }
  });

  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeTerm();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      closeTerm();
    }
  });

  /* ============ HASH NAVIGATION ============ */
  function handleHashNavigation() {
    const hash = window.location.hash.slice(1);
    if (hash && allTerms.find(t => t.slug === hash)) {
      setTimeout(() => openTerm(hash), 100);
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash && allTerms.find(t => t.slug === hash)) {
      openTerm(hash);
    } else if (!hash) {
      closeTerm();
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
