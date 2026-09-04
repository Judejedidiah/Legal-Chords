/* =====================================================
   LEGAL CHORDS — Admin Dashboard Controller
   ===================================================== */

window.AdminDashboard = (() => {
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;
    setupNav();
    setupModal();
    await loadAll();
  }

  /* ---------- NAVIGATION ---------- */
  function setupNav() {
    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tab) {
    document.querySelectorAll('.admin-nav-item').forEach(b => b.classList.remove('active'));
    document.querySelector(`.admin-nav-item[data-tab="${tab}"]`)?.classList.add('active');
    document.querySelectorAll('.admin-tab').forEach(el => { el.style.display = 'none'; el.classList.remove('visible'); });
    const target = document.getElementById(`tab-${tab}`);
    if (target) { target.style.display = ''; target.classList.add('visible'); }
    if (tab === 'memberships') loadMemberships();
    if (tab === 'newsletter') loadNewsletter();
    if (tab === 'content') loadContent();
  }

  /* ---------- LOAD ALL (OVERVIEW) ---------- */
  async function loadAll() {
    const [memRes, nlRes, scRes] = await Promise.all([
      window.db.from('memberships').select('id, status, created_at').order('created_at', { ascending: false }),
      window.db.from('newsletter_subscribers').select('id, status').eq('status', 'active'),
      window.db.from('site_content').select('id')
    ]);

    const memAll = memRes.data || [];
    const total = memAll.length;
    const pending = memAll.filter(m => m.status === 'pending').length;

    document.getElementById('statMembers').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statSubscribers').textContent = nlRes.data?.length || 0;
    document.getElementById('statSections').textContent = scRes.data?.length || 0;

    const { data: recent } = await window.db.from('memberships')
      .select('firstname, middlename, lastname, email, role, created_at, status')
      .order('created_at', { ascending: false })
      .limit(5);

    renderOverviewTable(recent || []);
  }

  function renderOverviewTable(rows) {
    const tbody = document.getElementById('overviewTable');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">No applications yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `<tr>
      <td style="font-weight:600;color:var(--text)">${esc(r.firstname)} ${esc(r.lastname)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.role)}</td>
      <td>${formatDate(r.created_at)}</td>
      <td><span class="status-badge status-${r.status}">${r.status}</span></td>
    </tr>`).join('');
  }

  /* ---------- MEMBERSHIPS ---------- */
  async function loadMemberships() {
    const { data } = await window.db.from('memberships')
      .select('*')
      .order('created_at', { ascending: false });

    renderMemberships(data || []);
    setupMembershipSearch(data || []);
  }

  function renderMemberships(rows) {
    const tbody = document.getElementById('memTable');
    const all = rows;
    document.getElementById('memTotal').textContent = all.length;
    document.getElementById('memPending').textContent = all.filter(r => r.status === 'pending').length;
    document.getElementById('memApproved').textContent = all.filter(r => r.status === 'approved').length;
    document.getElementById('memRejected').textContent = all.filter(r => r.status === 'rejected').length;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="admin-empty">No applications yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `<tr>
      <td style="font-weight:600;color:var(--text)">${esc(r.firstname)} ${esc(r.middlename || '')} ${esc(r.lastname)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.country_code || '+234')} ${esc(r.phone)}</td>
      <td>${esc(r.role)}</td>
      <td>${esc(r.location)}</td>
      <td>${formatDate(r.created_at)}</td>
      <td><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td>
        <button class="btn-sm" onclick="AdminDashboard.viewMember('${r.id}')">View</button>
        ${r.status === 'pending' ? `
          <button class="btn-sm success" onclick="AdminDashboard.updateStatus('${r.id}','approved')">Approve</button>
          <button class="btn-sm danger" onclick="AdminDashboard.updateStatus('${r.id}','rejected')">Reject</button>
        ` : ''}
      </td>
    </tr>`).join('');
  }

  function setupMembershipSearch(data) {
    const input = document.getElementById('memSearch');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      const filtered = data.filter(r =>
        `${r.firstname} ${r.middlename} ${r.lastname} ${r.email} ${r.role} ${r.location}`.toLowerCase().includes(q)
      );
      renderMemberships(filtered);
    });
  }

  async function viewMember(id) {
    const { data: r } = await window.db.from('memberships').select('*').eq('id', id).single();
    if (!r) return;
    document.getElementById('modalTitle').textContent = `${r.firstname} ${r.middlename || ''} ${r.lastname}`;
    document.getElementById('modalBody').innerHTML = `
      ${detailRow('Email', r.email)}
      ${detailRow('Phone', `${r.country_code || '+234'} ${r.phone}`)}
      ${detailRow('Role', r.role)}
      ${detailRow('Institution', r.institution)}
      ${detailRow('Location', r.location)}
      ${detailRow('Interests', (r.interests || []).join(', '))}
      ${detailRow('Involvement', r.involvement)}
      ${detailRow('Source', r.source)}
      ${detailRow('Message', r.message)}
      ${detailRow('Status', `<span class="status-badge status-${r.status}">${r.status}</span>`)}
      ${detailRow('Applied', formatDate(r.created_at))}
    `;
    openModal();
  }

  async function updateStatus(id, status) {
    await window.db.from('memberships').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    toast(`Application ${status}.`, 'success');
    loadMemberships();
    loadAll();
  }

  /* ---------- NEWSLETTER ---------- */
  async function loadNewsletter() {
    const { data } = await window.db.from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    renderNewsletter(data || []);
    setupNewsletterSearch(data || []);
  }

  function renderNewsletter(rows) {
    const all = rows;
    document.getElementById('nlActive').textContent = all.filter(r => r.status === 'active').length;
    document.getElementById('nlUnsub').textContent = all.filter(r => r.status === 'unsubscribed').length;
    document.getElementById('nlTotal').textContent = all.length;

    const tbody = document.getElementById('nlTable');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="admin-empty">No subscribers yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `<tr>
      <td style="font-weight:500;color:var(--text)">${esc(r.email)}</td>
      <td><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td>${formatDate(r.created_at)}</td>
      <td>
        <button class="btn-sm danger" onclick="AdminDashboard.removeSubscriber('${r.id}')">Remove</button>
      </td>
    </tr>`).join('');
  }

  function setupNewsletterSearch(data) {
    const input = document.getElementById('nlSearch');
    input.addEventListener('input', () => {
      const q = input.value.toLowerCase();
      renderNewsletter(data.filter(r => r.email.toLowerCase().includes(q)));
    });
  }

  async function removeSubscriber(id) {
    await window.db.from('newsletter_subscribers').update({ status: 'unsubscribed' }).eq('id', id);
    toast('Subscriber removed.', 'success');
    loadNewsletter();
  }

  /* ---------- CONTENT EDITOR ---------- */
  async function loadContent() {
    const { data: sections } = await window.db.from('site_content')
      .select('*')
      .order('section_key');

    const container = document.getElementById('editorContainer');
    if (!sections?.length) {
      container.innerHTML = '<div class="admin-empty">No content sections found. Run the migration SQL first.</div>';
      return;
    }

    container.innerHTML = sections.map(s => {
      const content = s.content;
      let fields = '';

      if (typeof content === 'object') {
        Object.entries(content).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            val.forEach((item, i) => {
              fields += `<div class="editor-field">
                <label>${labelize(key)} ${i + 1}</label>
                <textarea data-section="${s.section_key}" data-key="${key}" data-index="${i}">${esc(String(item))}</textarea>
              </div>`;
            });
          } else if (typeof val === 'string') {
            fields += `<div class="editor-field">
              <label>${labelize(key)}</label>
              <input type="text" data-section="${s.section_key}" data-key="${key}" value="${esc(val)}">
            </div>`;
          }
        });
      }

      return `<div class="editor-section" data-section-id="${s.id}">
        <div class="editor-header" onclick="AdminDashboard.toggleEditor(this)">
          <h3>${esc(s.section_label)}</h3>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="editor-body">
          ${fields}
          <div class="editor-actions">
            <button class="editor-save-btn" onclick="AdminDashboard.saveSection('${s.id}', '${s.section_key}')">Save Changes</button>
          </div>
        </div>
      </div>`;
    }).join('');
  }

  function toggleEditor(header) {
    header.closest('.editor-section').classList.toggle('open');
  }

  async function saveSection(id, sectionKey) {
    const inputs = document.querySelectorAll(`[data-section="${sectionKey}"]`);
    const content = {};

    inputs.forEach(el => {
      const key = el.dataset.key;
      const idx = el.dataset.index;

      if (idx !== undefined) {
        if (!content[key]) content[key] = [];
        content[key][parseInt(idx)] = el.value;
      } else {
        content[key] = el.value;
      }
    });

    await window.db.from('site_content')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', id);

    toast('Content saved successfully.', 'success');
  }

  /* ---------- MODAL ---------- */
  function setupModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('detailModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });
  }

  function openModal() { document.getElementById('detailModal').classList.add('open'); }
  function closeModal() { document.getElementById('detailModal').classList.remove('open'); }

  /* ---------- UTILS ---------- */
  function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function detailRow(label, value) {
    return `<div class="detail-row"><div class="detail-label">${label}</div><div class="detail-value">${value || '—'}</div></div>`;
  }

  function labelize(key) {
    return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/\b\w/g, c => c.toUpperCase());
  }

  function toast(msg, type = 'success') {
    const el = document.getElementById('adminToast');
    el.textContent = msg;
    el.className = `admin-toast ${type} visible`;
    setTimeout(() => el.classList.remove('visible'), 3000);
  }

  return { init, viewMember, updateStatus, removeSubscriber, toggleEditor, saveSection };
})();
