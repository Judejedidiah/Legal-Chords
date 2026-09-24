/* =====================================================
   LEGAL CHORDS — Frontend Interactions
===================================================== */

(function () {
  'use strict';

  // Theme toggle, navbar scroll state, mobile menu and nav dropdowns
  // live in js/site-nav.js (shared across all public pages).

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
    if (!Number.isFinite(target)) return;
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

  if (tTrack && tCards.length && tPrev && tNext && tDots) {
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

  /* ============ RESOURCE TABS (filter cards) ============ */
  const tabs = document.querySelectorAll('.resource-tabs .tab');
  const resourceCards = document.querySelectorAll('.resource-grid .resource-card');
  const normalizeLabel = (s) => (s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = normalizeLabel(tab.textContent);
      resourceCards.forEach(card => {
        const catEl = card.querySelector('.rc-cat');
        const matches = filter === 'ALL' || (catEl && normalizeLabel(catEl.textContent) === filter);
        card.style.display = matches ? '' : 'none';
      });
    });
  });

  /* ============ RESOURCE ARTICLE MODAL ============ */
  const resourceModal = document.getElementById('resourceModal');
  if (resourceModal) {
    const rTitle = document.getElementById('resourceModalTitle');
    const rCat = document.getElementById('resourceModalCat');
    const rDate = document.getElementById('resourceModalDate');
    const rText = document.getElementById('resourceModalText');
    const rImage = document.getElementById('resourceModalImage');
    const rFigure = document.getElementById('resourceModalFigure');
    const rLink = document.getElementById('resourceModalLink');
    let rLastFocused = null;

    const closeResourceModal = () => {
      resourceModal.classList.remove('open');
      resourceModal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('resource-open');
      if (rLastFocused && typeof rLastFocused.focus === 'function') rLastFocused.focus();
    };

    const openResourceModal = (card, index) => {
      const sections = window.LegalChordsContent || {};
      const articles = (sections.resources && sections.resources.articles) || [];
      const data = (index != null && articles[Number(index)]) || {};

      const cat = data.cat || (card.querySelector('.rc-cat') && card.querySelector('.rc-cat').textContent) || '';
      const title = data.title || (card.querySelector('h4') && card.querySelector('h4').textContent) || '';
      const date = data.date || (card.querySelector('.resource-meta > span') && card.querySelector('.resource-meta > span').textContent) || '';
      const summary = data.text || (card.querySelector('.resource-body p') && card.querySelector('.resource-body p').textContent) || '';
      const body = data.body || summary;
      const bodyImg = card.querySelector('.resource-thumb-img');
      const imgSrc = data.image || (bodyImg && bodyImg.getAttribute('src')) || '';
      const href = data.linkHref;

      rCat.textContent = cat;
      rCat.hidden = !cat;
      rTitle.textContent = title;
      rDate.textContent = date;

      rText.innerHTML = '';
      String(body).split(/\n{2,}/).forEach(para => {
        const clean = para.trim();
        if (!clean) return;
        const p = document.createElement('p');
        p.textContent = clean;
        rText.appendChild(p);
      });

      if (imgSrc) {
        rImage.src = imgSrc;
        rImage.alt = title;
        rFigure.hidden = false;
      } else {
        rImage.removeAttribute('src');
        rFigure.hidden = true;
      }

      if (href && /^(https?:|mailto:|tel:|\/|\.|#)/i.test(href)) {
        rLink.href = href;
        rLink.hidden = false;
      } else {
        rLink.removeAttribute('href');
        rLink.hidden = true;
      }

      rLastFocused = card.querySelector('.rc-link') || card;
      resourceModal.classList.add('open');
      resourceModal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('resource-open');
      setTimeout(() => {
        const dialog = resourceModal.querySelector('.resource-modal-dialog');
        if (dialog) dialog.focus();
      }, 50);
    };

    document.querySelectorAll('[data-resource-index]').forEach(btn => {
      btn.addEventListener('click', () => openResourceModal(btn.closest('.resource-card'), btn.dataset.resourceIndex));
    });

    document.querySelectorAll('[data-resource-close]').forEach(el => {
      el.addEventListener('click', closeResourceModal);
    });

    resourceModal.addEventListener('click', (e) => {
      if (e.target === resourceModal) closeResourceModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && resourceModal.classList.contains('open')) closeResourceModal();
    });
  }

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
      if (window.closeMobileMenu) window.closeMobileMenu();
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
      const interestBoxes = joinForm.querySelectorAll('input[name="interests"]');
      if (interestBoxes.length) {
        const anyChecked = Array.from(interestBoxes).some(box => box.checked);
        if (anyChecked) {
          interestBoxes.forEach(box => { box.required = false; box.setCustomValidity(''); });
        } else {
          interestBoxes.forEach(box => box.setAttribute('required', ''));
          interestBoxes[0].setCustomValidity('Please select at least one area of interest.');
        }
      }
      if (!joinForm.checkValidity()) {
        joinForm.reportValidity();
        return;
      }
      const data = new FormData(joinForm);
      const payload = Object.fromEntries(data.entries());
      payload.interests = data.getAll('interests');

      const btn = joinForm.querySelector('.join-submit');
      const origText = btn.textContent;
      const errBox = document.getElementById('joinError');
      if (errBox) errBox.hidden = true;
      btn.disabled = true;
      btn.textContent = 'Submitting...';

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, v]) => {
          if (Array.isArray(v)) return true;
          return v !== '';
        })
      );
      cleanPayload.country_code = cleanPayload.country_code || '+234';

      let submitted = false;
      try {
        if (window.db) {
          const { error } = await window.db.from('memberships').insert(cleanPayload);
          if (error) throw error;
          submitted = true;
        } else {
          console.warn('[Legal Chords] Supabase not available — membership not saved.');
          submitted = true;
        }
      } catch (err) {
        console.error('[Legal Chords] Submit error:', err.message);
        if (errBox) {
          errBox.textContent = 'We couldn\u2019t save your application. Please try again.';
          errBox.hidden = false;
        }
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
        if (submitted) {
          joinForm.hidden = true;
          joinSuccess.hidden = false;
        }
      }
    });
  }

  /* ============ NEWSLETTER FORM ============ */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    const newsletterError = newsletterForm.nextElementSibling;
    const input = newsletterForm.querySelector('input[type="email"]');
    const btn = newsletterForm.querySelector('button');

    const clearNewsletterError = () => {
      if (newsletterError) newsletterError.hidden = true;
    };
    input.addEventListener('input', clearNewsletterError);

    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!email || !input.checkValidity()) {
        if (newsletterError) newsletterError.hidden = false;
        input.focus();
        return;
      }
      clearNewsletterError();

      const origText = btn.textContent;
      btn.disabled = true;
      btn.textContent = '...';

      let subscribed = false;
      try {
        if (window.db) {
          const rpcRes = await window.db.rpc('subscribe_to_newsletter', { p_email: email });
          if (rpcRes.error) {
            // Before migration 006 the RPC doesn't exist yet — fall back
            // to the legacy anon upsert so subscribing keeps working.
            if (rpcRes.error.code === 'PGRST202') {
              const legacyRes = await window.db.from('newsletter_subscribers').upsert(
                { email, status: 'active' },
                { onConflict: 'email' }
              );
              if (legacyRes.error) throw legacyRes.error;
            } else {
              throw rpcRes.error;
            }
          }
        }
        subscribed = true;
      } catch (err) {
        console.error('[Legal Chords] Newsletter error:', err.message);
        if (newsletterError) {
          newsletterError.textContent = 'We couldn\u2019t save your email. Please try again.';
          newsletterError.hidden = false;
        }
        input.focus();
      } finally {
        btn.disabled = false;
        btn.textContent = origText;
        if (subscribed) {
          btn.textContent = '✓';
          input.value = '';
          setTimeout(() => { btn.textContent = origText; }, 3000);
        }
      }
    });
  }

  /* ============ SMOOTH ANCHOR SCROLL ============ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      if (this.dataset.joinOpen) return;
      const href = this.getAttribute('href');
      if (!href || href === '#') { e.preventDefault(); return; }
      try {
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const offset = 80;
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      } catch (selErr) {
        // Ignore malformed selectors (e.g. CMS-controlled hrefs).
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