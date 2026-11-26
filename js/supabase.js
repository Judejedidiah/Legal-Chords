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

    const config = window.SUPABASE_CONFIG;
    if (!config || !config.url || !config.publishableKey) {
      return false;
    }

    if (!/^sb_publishable_/.test(config.publishableKey)) {
      console.error(
        '[Legal Chords] SUPABASE_CONFIG.publishableKey is missing or is not a publishable key. ' +
        'Paste the sb_publishable_... value from Supabase Dashboard > Settings > API Keys into js/config.js.'
      );
      return false;
    }

    window.db = window.supabase.createClient(config.url, config.publishableKey);
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
