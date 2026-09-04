/* =====================================================
   LEGAL CHORDS — .env Loader
   Fetches .env from project root, parses KEY=VALUE pairs,
   and exposes them on window.ENV for other scripts to use.
   ===================================================== */

(function () {
  'use strict';

  window.ENV = window.ENV || {};

  // Resolve .env path relative to this script (works from root and subdirectories)
  var scriptSrc = document.currentScript ? document.currentScript.src : '';
  var basePath = scriptSrc.replace(/[^/]*$/, ''); // e.g. /js/
  var envPath = basePath + '../.env';

  // Try to load .env file
  fetch(envPath)
    .then(function (res) {
      if (!res.ok) {
        console.warn('[Legal Chords] .env not found at ' + envPath + ' (status ' + res.status + '), using defaults');
        document.dispatchEvent(new Event('env-ready'));
        return null;
      }
      return res.text();
    })
    .then(function (text) {
      if (!text) return; // .env not found, already dispatched env-ready
      text.split('\n').forEach(function (line) {
        line = line.trim();
        if (!line || line.startsWith('#')) return;
        var idx = line.indexOf('=');
        if (idx === -1) return;
        var key = line.slice(0, idx).trim();
        var val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        window.ENV[key] = val;
      });
      console.info('[Legal Chords] .env loaded.');
      document.dispatchEvent(new Event('env-ready'));
    })
    .catch(function (err) {
      console.error('[Legal Chords] Could not load .env:', err.message);
      console.error('Make sure a .env file exists in the project root.');
    });

})();
