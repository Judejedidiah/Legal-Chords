/* =====================================================
   LEGAL CHORDS — Admin Authentication
   ===================================================== */

window.AdminAuth = (() => {
  let currentUser = null;

  function init() {
    const loginForm = document.getElementById('loginForm');
    const logoutBtn = document.getElementById('logoutBtn');

    loginForm.addEventListener('submit', handleLogin);
    logoutBtn.addEventListener('click', handleLogout);

    window.db?.auth?.onAuthStateChange((_event, session) => {
      if (session?.user) {
        currentUser = session.user;
        showDashboard();
      } else {
        showLogin();
      }
    });

    checkSession();
  }

  async function checkSession() {
    if (!window.db) {
      await waitForDb();
    }
    const { data: { session } } = await window.db.auth.getSession();
    if (session?.user) {
      currentUser = session.user;
      showDashboard();
    }
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
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errEl = document.getElementById('loginError');

    btn.disabled = true;
    btn.textContent = 'Signing in...';
    errEl.classList.remove('visible');

    try {
      const { data, error } = await window.db.auth.signInWithPassword({ email, password });
      if (error) throw error;
      currentUser = data.user;
      showDashboard();
    } catch (err) {
      errEl.textContent = err.message || 'Invalid credentials. Please try again.';
      errEl.classList.add('visible');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  }

  async function handleLogout() {
    await window.db.auth.signOut();
    currentUser = null;
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
