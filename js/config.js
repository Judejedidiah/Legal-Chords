/* =====================================================
   LEGAL CHORDS — Supabase Configuration
   ===================================================== */

(function () {
  'use strict';

  function init() {
    // Try .env first, fall back to hardcoded values
    var url = (window.ENV && window.ENV.SUPABASE_URL) || 'https://khceilswfwrpyhkarntf.supabase.co';
    var key = (window.ENV && window.ENV.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoY2VpbHN3ZndycHloa2FybnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjk3OTgsImV4cCI6MjEwMzg0NTc5OH0.QxBRsvco6jVs2LTkxCjKcAPotdKEC1EGmulqH4RktUQ';

    window.SUPABASE_CONFIG = { url: url, anonKey: key };
    document.dispatchEvent(new Event('config-ready'));
  }

  if (window.ENV && window.ENV.SUPABASE_URL) {
    init();
  } else {
    document.addEventListener('env-ready', init);
    // Also init immediately if .env fetch already failed
    setTimeout(function () {
      if (!window.SUPABASE_CONFIG) init();
    }, 500);
  }

})();
