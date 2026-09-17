/* =====================================================
   LEGAL CHORDS — Content Loader
   Fetches edited site content from Supabase and applies
   it to the DOM via data-edit attributes so admin
   changes appear live on the site.

   Attribute conventions:
     data-edit="section.path"      -> path to content value
     data-edit-html                -> value is applied as innerHTML
     data-edit-attr="name"         -> value applied to attribute (src/href/placeholder)
     data-edit-href="section.path" -> alternative path for the attribute value
     data-edit-meta="section.path" -> value is an array rebuilt as <span> items
     data-edit-meta-sep="•"        -> separator used between array items
     data-edit-compose="type"      -> structured value rebuilt as styled HTML:
        "heading" -> { text, accent, suffix? }  -> text <span class="accent">accent</span> suffix
        "hero"    -> { line1, line2, line3, accentLine } -> lines joined with <br />, accent on line N
        "cta"     -> { text, accent } -> text<br /><span class="cta-accent">accent</span>
        "link"    -> { text, linkText, linkHref } -> text <a href="linkHref">linkText</a>
   All compose values are escaped before insertion.
   ===================================================== */

(function () {
  'use strict';

  function getPath(obj, segments) {
    let cur = obj;
    for (let i = 0; i < segments.length; i++) {
      if (cur == null) return undefined;
      cur = cur[segments[i]];
    }
    return cur;
  }

  function isValue(value) {
    return value != null && value !== '';
  }

  function esc(value) {
    const d = document.createElement('div');
    d.textContent = value == null ? '' : String(value);
    return d.innerHTML;
  }

  function applyCompose(el, value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const type = el.dataset.editCompose;
    let html = '';

    if (type === 'heading') {
      html = `${esc(value.text)} <span class="accent">${esc(value.accent)}</span>`;
      if (value.suffix) html += ' ' + esc(value.suffix);
    } else if (type === 'hero') {
      const line2 = esc(value.line2);
      const accent = Number(value.accentLine) === 2
        ? `<span class="hero-headline-accent">${line2}</span>`
        : line2;
      html = `${esc(value.line1)}<br />${accent}<br />${esc(value.line3)}`;
    } else if (type === 'cta') {
      html = `${esc(value.text)}<br /><span class="cta-accent">${esc(value.accent)}</span>`;
    } else if (type === 'link') {
      html = `${esc(value.text)} <a href="${esc(value.linkHref)}" style="color:var(--brand-blue-bright)">${esc(value.linkText)}</a>`;
    } else {
      return;
    }

    el.innerHTML = html;
  }

  function applyText(el, value) {
    if (!isValue(value)) return;
    if (Array.isArray(value) || typeof value === 'object') return;

    const hasChildren = Array.from(el.childNodes).some(n => n.nodeType === 1);

    if (hasChildren) {
      const trailing = Array.from(el.childNodes).filter(n => n.nodeType === 3);
      const lastText = trailing[trailing.length - 1];
      if (lastText) lastText.textContent = String(value);
      else el.append(' ' + String(value));
    } else {
      el.textContent = String(value);
    }

    if (el.classList && el.classList.contains('counter')) {
      el.dataset.target = String(value);
    }
  }

  function applyHtml(el, value) {
    if (!isValue(value)) return;
    el.innerHTML = String(value);
  }

  function applyAttr(el, attrName, value) {
    if (!isValue(value)) return;
    el.setAttribute(attrName, String(value));

    if (attrName === 'src') {
      if (el.tagName === 'IMG') {
        el.hidden = false;
        const poster = el.closest('.event-poster');
        if (poster) poster.classList.add('has-image');
      }
    }
  }

  function applyMeta(el, value, separator) {
    if (!Array.isArray(value)) return;
    separator = separator || '•';
    el.innerHTML = '';
    value.forEach((item, i) => {
      if (i > 0) {
        const sep = document.createElement('span');
        sep.textContent = separator;
        el.appendChild(sep);
      }
      const span = document.createElement('span');
      span.textContent = String(item);
      el.appendChild(span);
    });
  }

  function applyElement(el, sections) {
    const path = el.dataset.edit;
    const attrPath = el.dataset.editHref;
    const metaPath = el.dataset.editMeta;
    const anyPath = metaPath || attrPath || path;
    if (!anyPath) return;

    const sectionKey = anyPath.split('.')[0];
    const sectionContent = sections[sectionKey];
    if (!sectionContent) return;

    if (metaPath) {
      const metaValue = getPath(sectionContent, metaPath.split('.').slice(1));
      applyMeta(el, metaValue, el.dataset.editMetaSep);
      return;
    }

    if (el.dataset.editAttr) {
      const attrValue = getPath(sectionContent, (attrPath || path).split('.').slice(1));
      applyAttr(el, el.dataset.editAttr, attrValue);
    }

    if (!path) return;

    const value = getPath(sectionContent, path.split('.').slice(1));

    if (el.dataset.editCompose) {
      applyCompose(el, value);
      return;
    }

    if (el.hasAttribute('data-edit-html')) {
      applyHtml(el, value);
      return;
    }

    const tag = el.tagName;
    if (tag === 'IMG' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    applyText(el, value);
  }

  async function loadAll() {
    try {
      const { data } = await window.db.from('site_content').select('section_key, content');
      if (!data) return;

      const sections = {};
      data.forEach(row => {
        sections[row.section_key] = row.content;
      });

      document.querySelectorAll('[data-edit], [data-edit-href], [data-edit-meta]').forEach(el => {
        try {
          applyElement(el, sections);
        } catch (err) {
          console.warn('[Legal Chords] Could not apply content to element:', el, err.message);
        }
      });
    } catch (err) {
      console.warn('[Legal Chords] Content loader could not fetch content:', err.message);
    }
  }

  function init() {
    if (!window.db) {
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

  document.addEventListener('DOMContentLoaded', init);
})();