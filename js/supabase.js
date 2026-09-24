/* =====================================================
   LEGAL CHORDS — Supabase Client Initializer
   Order-independent: creates window.db whenever both the
   Supabase library and SUPABASE_CONFIG are available,
   regardless of script load order. Idempotent.
   ===================================================== */

(function () {
  'use strict';

  function init() {
    if (window.db) return;

    if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
      return false;
    }

    if (typeof SUPABASE_CONFIG === 'undefined' || !SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
      return false;
    }

    window.db = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    return true;
  }

  // Try immediately, then retry on config-ready and window load so the
  // order of config.js / supabase.js / CDN tags never matters.
  if (!init()) {
    document.addEventListener('config-ready', function () {
      if (!init()) {
        // Give a late-binding CDN one more chance.
        window.addEventListener('load', init);
      }
    }, { once: true });
    window.addEventListener('load', init, { once: true });
  }

})();