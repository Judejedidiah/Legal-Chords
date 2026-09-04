/* =====================================================
   LEGAL CHORDS — Supabase Client Initializer
   Waits for config-ready, then creates window.db client.
   ===================================================== */

(function () {
  'use strict';

  function init() {
    if (typeof SUPABASE_CONFIG === 'undefined') {
      console.error('[Legal Chords] Missing SUPABASE_CONFIG. Check js/config.js');
      return;
    }

    var url = SUPABASE_CONFIG.url;
    var key = SUPABASE_CONFIG.anonKey;

    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      window.db = window.supabase.createClient(url, key);
      console.info('[Legal Chords] Supabase client ready. Access via window.db');
    } else {
      console.error('[Legal Chords] Supabase JS library not loaded. Check CDN script tag.');
    }
  }

  // If config is already set, init now; otherwise wait
  if (window.SUPABASE_CONFIG) {
    init();
  } else {
    document.addEventListener('config-ready', init);
  }

})();
