/* =====================================================
   LEGAL CHORDS — Content Loader
   Fetches edited site content from Supabase and applies
   it to the DOM so admin changes appear live on the site.
   ===================================================== */

(function () {
  'use strict';

  function applyText(el, value) {
    if (!el || value == null || value === '') return;
    const dot = el.querySelector('.dot');
    if (dot) {
      // Keep the dot, replace the trailing text node
      const textNode = Array.from(el.childNodes).find(n => n.nodeType === 3);
      if (textNode) textNode.textContent = String(value);
      else el.appendChild(document.createTextNode(' ' + String(value)));
    } else if (el.innerHTML.includes('<')) {
      el.innerHTML = String(value);
    } else {
      el.textContent = String(value);
    }
  }

  function applyContent(sectionKey, content) {
    if (!content || typeof content !== 'object') return;

    // Featured event section
    if (sectionKey === 'events') {
      const img = document.getElementById('eventPosterImg');
      const poster = document.querySelector('.event-poster');

      if (content.posterImage && img) {
        img.src = content.posterImage;
        img.hidden = false;
        if (poster) poster.classList.add('has-image');
      }

      document.querySelectorAll('[data-event]').forEach(el => {
        const key = el.dataset.event;
        applyText(el, content[key]);
      });
    }

    // Hero section
    if (sectionKey === 'hero') {
      const badge = document.querySelector('.hero-badge, [class*="hero"] [class*="badge"]');
      const headline = document.querySelector('.hero-headline, [class*="hero"] h1');
      const subtitle = document.querySelector('.hero-sub, [class*="hero-sub"]');

      if (badge && content.badge) badge.textContent = content.badge;
      if (headline && content.headline) headline.innerHTML = content.headline;
      if (subtitle && content.subtitle) subtitle.textContent = content.subtitle;
    }

    // About section
    if (sectionKey === 'about') {
      const heading = document.querySelector('#about .section-title, #about h2');
      if (heading && content.heading) heading.innerHTML = content.heading;

      const paragraphs = document.querySelectorAll('#about .about-body p, #about .section-lede');
      if (content.paragraphs) {
        paragraphs.forEach((p, i) => {
          if (content.paragraphs[i]) p.textContent = content.paragraphs[i];
        });
      }
    }
  }

  async function init() {
    if (!window.db) {
      // Retry briefly in case client is still initializing
      let tries = 0;
      const retry = setInterval(() => {
        tries++;
        if (window.db || tries > 30) {
          clearInterval(retry);
          if (window.db) loadAll();
        }
      }, 100);
      return;
    }
    loadAll();
  }

  async function loadAll() {
    try {
      const { data } = await window.db.from('site_content').select('section_key, content');
      if (!data) return;
      data.forEach(row => applyContent(row.section_key, row.content));
    } catch (err) {
      console.warn('[Legal Chords] Content loader could not fetch content:', err.message);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();