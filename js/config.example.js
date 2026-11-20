/* =====================================================
   LEGAL CHORDS — Supabase Configuration (EXAMPLE)

   js/config.js is the real (committed) config and works
   out of the box with the public anon key. The anon key is
   safe to ship in the browser — RLS policies protect all
   writes.

   To point at a different project, edit js/config.js:
     url:                   'https://YOUR_PROJECT_ID.supabase.co'
     anonKey:               'YOUR_ANON_KEY_HERE'
     adminLoginFunctionUrl: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/admin-login'

   NEVER put a service-role key or password in this repo.
   ===================================================== */

(function () {
  'use strict';

  window.SUPABASE_CONFIG = {
    url: 'https://YOUR_PROJECT_ID.supabase.co',
    anonKey: 'YOUR_ANON_KEY_HERE',
    adminLoginFunctionUrl: 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/admin-login'
  };

  document.dispatchEvent(new Event('config-ready'));

})();