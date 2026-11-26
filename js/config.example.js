/* =====================================================
   LEGAL CHORDS — Supabase Configuration (EXAMPLE)

   js/config.js is the real (committed) config. It carries
   the public publishable key, which is safe to ship to the
   browser — RLS policies protect all writes.

   To point at a different project, edit js/config.js:
     url:              'https://YOUR_PROJECT_ID.supabase.co'
     publishableKey:   'sb_publishable_...'
     adminLoginFunctionUrl:
       'https://YOUR_PROJECT_ID.supabase.co/functions/v1/admin-login'

   Keys come from Supabase Dashboard > Settings > API Keys.
   NEVER put a secret key (sb_secret_...) or password here.
   ===================================================== */

(function () {
  'use strict';

  window.SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    publishableKey: 'sb_publishable_...',
    adminLoginFunctionUrl: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/admin-login'
  };

  document.dispatchEvent(new Event('config-ready'));

})();
