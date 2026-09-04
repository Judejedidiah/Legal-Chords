/* =====================================================
   LEGAL CHORDS — Supabase Client Initializer
   Loads config from js/config.js and creates a global
   `supabase` client instance.
   ===================================================== */

(function () {
  'use strict';

  /* ============ LOAD CONFIG ============ */
  if (typeof SUPABASE_CONFIG === 'undefined') {
    console.error(
      '[Legal Chords] Missing Supabase config.\n' +
      'Copy js/config.example.js to js/config.js and fill in your credentials.\n' +
      'See setup instructions below.'
    );
    return;
  }

  var SUPABASE_URL = SUPABASE_CONFIG.url;
  var SUPABASE_ANON_KEY = SUPABASE_CONFIG.anonKey;

  if (!SUPABASE_URL || SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
    console.error('[Legal Chords] Supabase URL not configured. Edit js/config.js');
    return;
  }
  if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')) {
    console.error('[Legal Chords] Supabase anon key not configured. Edit js/config.js');
    return;
  }

  /* ============ CREATE CLIENT ============ */
  // Using the Supabase JS v2 CDN global: window.supabase
  if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    window.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.info('[Legal Chords] Supabase client ready.');
  } else {
    console.error(
      '[Legal Chords] Supabase JS library not loaded.\n' +
      'Make sure the Supabase CDN script is included before js/supabase.js'
    );
  }

})();
