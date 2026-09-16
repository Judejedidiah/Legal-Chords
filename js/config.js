/* =====================================================
   LEGAL CHORDS — Supabase Configuration
   The anon key below is PUBLIC BY DESIGN (Supabase sends
   it to browsers) — every write is protected by RLS.
   Do NOT put service-role keys or secrets here.
   ===================================================== */

(function () {
  'use strict';

  window.SUPABASE_CONFIG = {
    url: 'https://khceilswfwrpyhkarntf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtoY2VpbHN3ZndycHloa2FybnRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjk3OTgsImV4cCI6MjEwMzg0NTc5OH0.QxBRsvco6jVs2LTkxCjKcAPotdKEC1EGmulqH4RktUQ'
  };

  document.dispatchEvent(new Event('config-ready'));

})();