/* =====================================================
   LEGAL CHORDS — .env Loader
   Fetches .env from project root, parses KEY=VALUE pairs,
   and exposes them on window.ENV for other scripts to use.
   ===================================================== */

(function () {
  'use strict';

  window.ENV = window.ENV || {};

  // Try to load .env file
  fetch('.env')
    .then(function (res) {
      if (!res.ok) throw new Error('.env not found (' + res.status + ')');
      return res.text();
    })
    .then(function (text) {
      text.split('\n').forEach(function (line) {
        line = line.trim();
        if (!line || line.startsWith('#')) return; // skip comments and blanks
        var idx = line.indexOf('=');
        if (idx === -1) return;
        var key = line.slice(0, idx).trim();
        var val = line.slice(idx + 1).trim();
        // strip surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        window.ENV[key] = val;
      });
      console.info('[Legal Chords] .u0024.env loaded.');
      // Dispatch event so other scripts know env is ready
      document.dispatchEvent(new Event('env-ready'));
    })
    .catch(function (err) {
      console.error('[Legal Chords] Could not load .env:', err.message);
      console.error('Make sure a .env file exists in the project root.');
    });

})();
