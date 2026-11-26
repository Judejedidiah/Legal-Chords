/* =====================================================
   LEGAL CHORDS — Admin Authentication
   Single fixed admin account + auto-login session timeout.

   Credentials are submitted to the server-side `admin-login`
   Edge Function, which enforces the account allowlist and
   IP/email rate limiting. No password is stored in this file.
   Supabase Auth + app_metadata.role = 'admin' RLS scoping
   (migration 006) remain the final authorization boundary.
   Create this account in Supabase Auth (or via the dashboard)
   with app_metadata {"role":"admin"}.
   ===================================================== */

window.AdminAuth = (() => {
  'use strict';

  // The ONLY account allowed to use the dashboard.
  const ALLOWED_ADMIN_EMAIL = 'legalchords@gmail.com';

  // Session timeout for the auto-login (stored Supabase session).
  // After this many ms of inactivity the admin is auto-logged-out
  // and must sign in again. Applies on every page load too.
  const SESSION_TIMEOUT_MS = 15 * 60 * 1000;        // 15 minutes idle
  const SESSION_MAX_LIFETIME_MS = 12 * 60 * 60 * 1000; // 12 hours hard cap

  let currentUser = null;
  let idleTimer = null;
  let sessionStart = 0;
  let lastActivityAt = 0;

  /* ---------- STRICT ACCOUNT CHECK ---------- */
  function isAllowedUser(user) {
    return !!user && String(user.email || '').toLowerCase() === ALLOWED_ADMIN_EMAIL;
  }

  /* ---------- SESSION TIMEOUT TIMERS ---------- */
  function clearTimers() {
    if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    lastActivityAt = 0;
  }

  function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(onSessionTimeout, SESSION_TIMEOUT_MS);
  }

  function armSessionTimers() {
    sessionStart = Date.now();
    resetIdleTimer();
  }

  function onActivity() {
    if (!currentUser) return;
    // Hard cap: end the session even with constant activity.
    if (Date.now() - sessionStart > SESSION_MAX_LIFETIME_MS) {
      onSessionTimeout();
      return;
    }
    // Throttle idle resets to at most once per 30s.
    if (Date.now() - lastActivityAt < 30000) return;
    lastActivityAt = Date.now();
    resetIdleTimer();
  }

  async function onSessionTimeout() {
    currentUser = null;
    clearTimers();
    try { if (window.db) await window.db.auth.signOut(); } catch (e) {}
    showLogin();
    const errEl = document.getElementById('loginError');
    if (errEl) {
      errEl.textContent = 'Session timed out. Please sign in again.';
      errEl.classList.add('visible');
    }
  }

  /* ---------- AUTH STATE ---------- */
  function applyAuth(user) {
    if (!user) {
      currentUser = null;
      clearTimers();
      showLogin();
      return;
    }
    if (!isAllowedUser(user)) {
      // Any other signed-in account is rejected outright.
      currentUser = null;
      clearTimers();
      if (window.db) window.db.auth.signOut();
      showLogin();
      return;
    }
    currentUser = user;
    armSessionTimers();
    showDashboard();
  }

  function init() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!loginForm) {
      console.error('[Legal Chords] Login form not found.');
      return;
    }
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    // Any user activity resets the idle timer.
    ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach(evt => {
      window.addEventListener(evt, onActivity, { passive: true });
    });

    checkSession();
  }

  async function checkSession() {
    await waitForDb();

    if (!window.db) {
      const errEl = document.getElementById('loginError');
      if (errEl) {
        errEl.textContent = 'Could not connect to database. Check supabase.js in console.';
        errEl.classList.add('visible');
      }
      return;
    }

    // Register auth state change listener now that window.db exists.
    window.db.auth.onAuthStateChange((_event, session) => {
      applyAuth(session ? session.user : null);
    });

    // Auto-login: restore a previously stored session (if any) and start
    // the timeout clock immediately so the dashboard never stays open forever.
    const { data: { session } } = await window.db.auth.getSession();
    applyAuth(session ? session.user : null);
  }

  function waitForDb() {
    return new Promise((resolve) => {
      if (window.db) return resolve();
      const check = setInterval(() => {
        if (window.db) { clearInterval(check); resolve(); }
      }, 100);
      setTimeout(() => { clearInterval(check); resolve(); }, 5000);
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errEl.classList.remove('visible');

    if (!window.db) {
      errEl.textContent = 'Database not connected yet. Please refresh the page.';
      errEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Sign In';
      return;
    }

    const config = window.SUPABASE_CONFIG;
    if (!config || !config.adminLoginFunctionUrl || !config.publishableKey) {
      errEl.textContent = 'Supabase is not configured. Check js/config.js and redeploy.';
      errEl.classList.add('visible');
      btn.disabled = false;
      btn.textContent = 'Sign In';
      return;
    }

    try {
      // New-format API keys go on apikey only. They are not JWTs, so they
      // must not be sent as a Bearer token (the function gates on this key).
      const res = await fetch(config.adminLoginFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.publishableKey
        },
        body: JSON.stringify({ email, password })
      });

      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        errEl.textContent = retryAfter
          ? `Too many attempts. Try again in ${retryAfter} seconds.`
          : 'Too many attempts. Please try again later.';
        errEl.classList.add('visible');
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        errEl.textContent = data.error || 'Invalid credentials. Please try again.';
        errEl.classList.add('visible');
        return;
      }

      const data = await res.json();
      if (data.session) {
        await window.db.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
        applyAuth(data.user || (data.session.user));
      } else {
        errEl.textContent = 'Invalid credentials. Please try again.';
        errEl.classList.add('visible');
      }
    } catch (err) {
      errEl.textContent = err.message || 'Invalid credentials. Please try again.';
      errEl.classList.add('visible');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleLogout() {
    currentUser = null;
    clearTimers();
    try { await window.db.auth.signOut(); } catch (e) {}
    showLogin();
  }

  function showDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('adminDashboard').classList.add('visible');
    document.getElementById('adminEmail').textContent = currentUser?.email || '';
    if (window.AdminDashboard) window.AdminDashboard.init();
  }

  function showLogin() {
    document.getElementById('loginPage').style.display = '';
    document.getElementById('adminDashboard').classList.remove('visible');
  }

  function getUser() { return currentUser; }

  return { init, getUser };
})();

document.addEventListener('DOMContentLoaded', () => AdminAuth.init());