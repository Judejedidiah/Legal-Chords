/* =====================================================
   LEGAL CHORDS — Supabase Configuration

   Replace PASTE_PUBLISHABLE_KEY_HERE with the publishable
   key from Supabase Dashboard > Settings > API Keys.
   The publishable key (sb_publishable_...) is PUBLIC BY
   DESIGN (Supabase sends it to browsers) — every write is
   protected by RLS. Never put a secret key (sb_secret_...)
   or any password in this file.
   ===================================================== */

(function () {
  "use strict";

  window.SUPABASE_CONFIG = {
    url: "https://khceilswfwrpyhkarntf.supabase.co",
    publishableKey: "sb_publishable_yQV_tBKTOH4SUqR_FKSeRA_QbQsOSYE",
    adminLoginFunctionUrl:
      "https://khceilswfwrpyhkarntf.supabase.co/functions/v1/admin-login",
  };

  document.dispatchEvent(new Event("config-ready"));
})();
