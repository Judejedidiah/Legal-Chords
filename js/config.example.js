/* =====================================================
   LEGAL CHORDS — Supabase Configuration (EXAMPLE)
   
   The real file (js/config.js) is committed and works out
   of the box: it first reads window.ENV (populated from
   the .env file by js/load-env.js) and falls back to the
   hardcoded public anon key. The anon key is safe to ship
   — RLS policies protect all writes.
   
   To point at a different project, override:
   - .env  -> SUPABASE_URL / SUPABASE_ANON_KEY, or
   - js/config.js fallback values below.
   ===================================================== */

(function () {
  'use strict';

  function init() {
    window.SUPABASE_CONFIG = {
      url: 'https://YOUR_PROJECT_ID.supabase.co',
      anonKey: 'YOUR_ANON_KEY_HERE',
    };
    document.dispatchEvent(new Event('config-ready'));
  }

  if (window.ENV && window.ENV.SUPABASE_URL) {
    init();
  } else {
    document.addEventListener('env-ready', init);
    setTimeout(function () {
      if (!window.SUPABASE_CONFIG) init();
    }, 500);
  }

})();