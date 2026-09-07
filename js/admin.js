/* =====================================================
   LEGAL CHORDS — Admin Dashboard Controller
   ===================================================== */

window.AdminDashboard = (() => {
  let initialized = false;

  async function init() {
    if (initialized) return;
    initialized = true;
    setupMobileSidebar();
    setupNav();
    setupModal();
    await loadAll();
  }

  /* ---------- MOBILE SIDEBAR ---------- */
  function setupMobileSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('adminMenuToggle');
    const backdrop = document.getElementById('adminBackdrop');
    if (!sidebar || !toggle) return;

    const setOpen = (open) => {
      sidebar.classList.toggle('open', open);
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (backdrop) backdrop.classList.toggle('visible', open);
      document.body.style.overflow = open ? 'hidden' : '';
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!sidebar.classList.contains('open'));
    });

    if (backdrop) backdrop.addEventListener('click', () => setOpen(false));

    // Close after navigating to a tab
    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', () => setOpen(false));
    });
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
    if (tab === 'dictionary') loadDictionary();
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
      <td data-label="Name" style="font-weight:600;color:var(--text)">${esc(r.firstname)} ${esc(r.lastname)}</td>
      <td data-label="Email">${esc(r.email)}</td>
      <td data-label="Role">${esc(r.role)}</td>
      <td data-label="Date">${formatDate(r.created_at)}</td>
      <td data-label="Status"><span class="status-badge status-${r.status}">${r.status}</span></td>
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
      <td data-label="Name" style="font-weight:600;color:var(--text)">${esc(r.firstname)} ${esc(r.middlename || '')} ${esc(r.lastname)}</td>
      <td data-label="Email">${esc(r.email)}</td>
      <td data-label="Phone">${esc(r.country_code || '+234')} ${esc(r.phone)}</td>
      <td data-label="Role">${esc(r.role)}</td>
      <td data-label="Location">${esc(r.location)}</td>
      <td data-label="Date">${formatDate(r.created_at)}</td>
      <td data-label="Status"><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td data-label="Actions" data-full>
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
    if (input.dataset.wired) return;
    input.dataset.wired = '1';
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
      <td data-label="Email" style="font-weight:500;color:var(--text)">${esc(r.email)}</td>
      <td data-label="Status"><span class="status-badge status-${r.status}">${r.status}</span></td>
      <td data-label="Joined">${formatDate(r.created_at)}</td>
      <td data-label="Actions" data-full>
        <button class="btn-sm danger" onclick="AdminDashboard.removeSubscriber('${r.id}')">Remove</button>
      </td>
    </tr>`).join('');
  }

  function setupNewsletterSearch(data) {
    const input = document.getElementById('nlSearch');
    if (input.dataset.wired) return;
    input.dataset.wired = '1';
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

  /* ---------- CONTENT EDITOR (SCHEMA-FREE) ---------- */
  let sectionsCache = [];
  let sectionsDraft = {};

  function cloneDeep(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPath(obj, segments) {
    let cur = obj;
    for (let i = 0; i < segments.length; i++) {
      if (cur == null) return undefined;
      cur = cur[segments[i]];
    }
    return cur;
  }

  function setPath(obj, segments, value) {
    let cur = obj;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const next = segments[i + 1];
      if (cur[seg] == null || typeof cur[seg] !== 'object') {
        cur[seg] = /^\d+$/.test(next) ? [] : {};
      }
      cur = cur[seg];
    }
    cur[segments[segments.length - 1]] = value;
  }

  function removePath(obj, segments) {
    const parent = getPath(obj, segments.slice(0, -1));
    if (parent == null) return;
    const last = segments[segments.length - 1];
    if (Array.isArray(parent)) parent.splice(Number(last), 1);
    else delete parent[last];
  }

  function onEdit(el, sectionKey) {
    const path = el.dataset.path;
    if (!path || !sectionsDraft[sectionKey]) return;
    const segments = path.split('.').slice(1);
    let value;
    if (el.type === 'checkbox') value = el.checked;
    else if (el.type === 'number') value = el.value === '' ? null : Number(el.value);
    else value = el.value;
    setPath(sectionsDraft[sectionKey], segments, value);
  }

  function syncFromDOM(sectionKey) {
    const section = document.querySelector(`.editor-section[data-section-key="${sectionKey}"]`);
    if (!section) return;
    section.querySelectorAll('[data-path]').forEach(el => onEdit(el, sectionKey));
  }

  async function loadContent() {
    const { data: sections } = await window.db.from('site_content')
      .select('*')
      .order('section_key');

    const container = document.getElementById('editorContainer');
    if (!sections?.length) {
      container.innerHTML = '<div class="admin-empty">No content sections found. Run the migration SQL first.</div>';
      return;
    }

    sectionsCache = sections;
    sectionsDraft = {};
    sections.forEach(s => { sectionsDraft[s.section_key] = cloneDeep(s.content || {}); });
    renderContentEditor();
  }

  function sectionHtml(s) {
    return `<div class="editor-section" data-section-id="${s.id}" data-section-key="${s.section_key}">
        <div class="editor-header" onclick="AdminDashboard.toggleEditor(this)">
          <h3>${esc(s.section_label)}</h3>
          <span class="editor-key">${esc(s.section_key)}</span>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="editor-body">
          ${renderFields(s.section_key, sectionsDraft[s.section_key])}
          <div class="editor-actions">
            <button class="editor-save-btn" onclick="AdminDashboard.saveSection('${s.section_key}')">Save Changes</button>
          </div>
        </div>
      </div>`;
  }

  function renderContentEditor() {
    const container = document.getElementById('editorContainer');
    container.innerHTML = sectionsCache.map(sectionHtml).join('');
  }

  function renderSection(sectionKey) {
    const section = sectionsCache.find(s => s.section_key === sectionKey);
    if (!section) return;
    const wrapper = document.querySelector(`.editor-section[data-section-key="${sectionKey}"]`);
    if (wrapper) wrapper.outerHTML = sectionHtml(section);
    else renderContentEditor();
  }

  function toggleEditor(header) {
    header.closest('.editor-section').classList.toggle('open');
  }

  function renderFields(sectionKey, obj, basePath) {
    let out = '';
    Object.keys(obj).forEach(key => {
      const val = obj[key];
      const path = basePath ? `${basePath}.${key}` : `${sectionKey}.${key}`;
      out += renderField(sectionKey, key, val, path);
    });
    return out;
  }

  function renderField(sectionKey, key, val, path) {
    if (typeof val === 'string' && /Image$/i.test(key)) {
      return imageUploaderHtml(path, val);
    }

    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return `<div class="editor-group">
        <div class="editor-group-head"><span>${esc(labelize(key))}</span></div>
        <div class="editor-group-body">${renderFields(sectionKey, val, path)}</div>
      </div>`;
    }

    if (Array.isArray(val)) {
      const hasObjects = val.some(v => v && typeof v === 'object');
      if (hasObjects) {
        let inner = '';
        val.forEach((item, i) => {
          if (item && typeof item === 'object') {
            inner += `<div class="editor-group">
              <div class="editor-group-head">
                <span>${esc(labelize(key))} ${i + 1}</span>
                <button type="button" class="editor-remove" onclick="AdminDashboard.removeItem('${sectionKey}','${path}.${i}')" title="Remove">×</button>
              </div>
              <div class="editor-group-body">${renderFields(sectionKey, item, `${path}.${i}`)}</div>
            </div>`;
          }
        });
        inner += `<button type="button" class="editor-add" onclick="AdminDashboard.addItem('${sectionKey}','${path}')">+ Add ${esc(labelize(key))}</button>`;
        return inner;
      }

      let rows = '';
      val.forEach((item, i) => {
        rows += `<div class="editor-list-row">
          <span class="editor-list-idx">${i + 1}</span>
          <input type="text" data-path="${path}.${i}" value="${esc(String(item))}" oninput="AdminDashboard.onEdit(this,'${sectionKey}')">
          <button type="button" class="editor-remove" onclick="AdminDashboard.removeItem('${sectionKey}','${path}.${i}')" title="Remove">×</button>
        </div>`;
      });
      rows += `<button type="button" class="editor-add" onclick="AdminDashboard.addItem('${sectionKey}','${path}')">+ Add ${esc(labelize(key))}</button>`;
      return rows;
    }

    if (typeof val === 'boolean') {
      return `<div class="editor-field">
        <label>${esc(labelize(key))}</label>
        <div class="editor-toggle-wrap">
          <input type="checkbox" data-path="${path}" ${val ? 'checked' : ''} onchange="AdminDashboard.onEdit(this,'${sectionKey}')">
        </div>
      </div>`;
    }

    if (typeof val === 'number') {
      return `<div class="editor-field">
        <label>${esc(labelize(key))}</label>
        <input type="number" data-path="${path}" value="${esc(String(val))}" oninput="AdminDashboard.onEdit(this,'${sectionKey}')">
      </div>`;
    }

    const multiline = String(val || '').length > 140;
    return `<div class="editor-field">
      <label>${esc(labelize(key))}</label>
      ${multiline
        ? `<textarea data-path="${path}" rows="3" oninput="AdminDashboard.onEdit(this,'${sectionKey}')">${esc(val)}</textarea>`
        : `<input type="text" data-path="${path}" value="${esc(val)}" oninput="AdminDashboard.onEdit(this,'${sectionKey}')">`}
    </div>`;
  }

  function imageUploaderHtml(path, url) {
    const uid = path.replace(/[^a-zA-Z0-9]/g, '_');
    return `<div class="editor-field">
      <label>${esc(labelize(path.split('.').pop()))}</label>
      <div class="event-image-upload">
        <img id="imgPreview_${uid}" class="event-image-preview" src="${esc(url)}" alt="Image preview" ${url ? '' : 'hidden'}>
        <div class="event-image-controls">
          <input type="file" id="imgFile_${uid}" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
          <button type="button" class="btn-sm" onclick="AdminDashboard.chooseImage('${path}')">Choose Image</button>
          <button type="button" class="btn-sm success" onclick="AdminDashboard.uploadImage('${path}')">Upload</button>
          ${url ? `<a class="btn-sm" href="${esc(url)}" target="_blank" rel="noopener">View Image</a>` : ''}
        </div>
        <input type="text" class="event-image-url" id="imgUrl_${uid}" data-path="${path}" value="${esc(url)}" placeholder="Image URL (auto-filled on upload)" oninput="AdminDashboard.onEdit(this,'${path.split('.')[0]}')">
      </div>
    </div>`;
  }

  function addItem(sectionKey, path) {
    syncFromDOM(sectionKey);
    const segments = path.split('.').slice(1);
    const parent = getPath(sectionsDraft[sectionKey], segments);
    if (!Array.isArray(parent)) return;

    const first = parent[0];
    let item;
    if (first && typeof first === 'object' && !Array.isArray(first)) {
      item = {};
      Object.keys(first).forEach(k => { item[k] = typeof first[k] === 'boolean' ? false : ''; });
    } else if (first && typeof first === 'number') {
      item = 0;
    } else {
      item = '';
    }
    parent.push(item);
    renderSection(sectionKey);
  }

  function removeItem(sectionKey, path) {
    syncFromDOM(sectionKey);
    removePath(sectionsDraft[sectionKey], path.split('.').slice(1));
    renderSection(sectionKey);
  }

  async function saveSection(sectionKey) {
    const section = sectionsCache.find(s => s.section_key === sectionKey);
    if (!section) return;
    syncFromDOM(sectionKey);

    const content = sectionsDraft[sectionKey];

    try {
      const { error } = await window.db.from('site_content')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', section.id);
      if (error) throw error;

      section.content = cloneDeep(content);
      toast(`"${section.section_label}" saved successfully.`, 'success');
    } catch (err) {
      console.error('[Legal Chords] Content save error:', err.message);
      toast('Save failed: ' + err.message, 'error');
    }
  }

  /* ---------- IMAGE UPLOAD (generic) ---------- */
  function chooseImage(path) {
    const uid = path.replace(/[^a-zA-Z0-9]/g, '_');
    const input = document.getElementById('imgFile_' + uid);
    if (input) input.click();
  }

  async function uploadImage(path) {
    const sectionKey = path.split('.')[0];
    const uid = path.replace(/[^a-zA-Z0-9]/g, '_');
    const fileInput = document.getElementById('imgFile_' + uid);
    const file = fileInput && fileInput.files && fileInput.files[0];
    if (!file) {
      toast('Please choose an image first.', 'error');
      return;
    }

    const preview = document.getElementById('imgPreview_' + uid);
    const urlInput = document.getElementById('imgUrl_' + uid);
    const btn = fileInput.parentElement.querySelector('.btn-sm.success');

    if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = 'content/' + sectionKey + '/' + Date.now() + '-' + safeName;

      const { error } = await window.db.storage
        .from('event-images')
        .upload(storagePath, file, { contentType: file.type, upsert: true });

      if (error) throw error;

      const { data: pub } = window.db.storage.from('event-images').getPublicUrl(storagePath);
      const url = pub.publicUrl;

      if (preview) { preview.src = url; preview.hidden = false; }
      if (urlInput) { urlInput.value = url; onEdit(urlInput, sectionKey); }

      toast('Image uploaded.', 'success');
    } catch (err) {
      console.error('[Legal Chords] Image upload error:', err.message);
      toast('Upload failed: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Upload'; }
      fileInput.value = '';
    }
  }

  /* ---------- DICTIONARY ---------- */
  let dictAll = [];
  let dictSearchWired = false;

  async function loadDictionary() {
    const { data, error } = await window.db.from('legal_terms').select('*').order('term');
    if (error) {
      toast('Failed to load terms: ' + error.message, 'error');
      return;
    }
    dictAll = data || [];
    renderDictionary(dictAll);
    populateCategoryList();
    if (!dictSearchWired) {
      dictSearchWired = true;
      document.getElementById('dictSearch').addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = dictAll.filter(r =>
          r.term.toLowerCase().includes(q) ||
          (r.keywords || []).some(k => k.toLowerCase().includes(q)) ||
          r.category.toLowerCase().includes(q)
        );
        renderDictionary(filtered);
      });
    }
  }

  function renderDictionary(rows) {
    const seen = new Set(rows.map(r => r.category));
    document.getElementById('dictTotal').textContent = rows.length;
    document.getElementById('dictCategories').textContent = seen.size;
    document.getElementById('dictKeywords').textContent = rows.filter(r => (r.keywords || []).length).length;

    const tbody = document.getElementById('dictTable');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">No terms found.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(r => {
      const kws = (r.keywords || []).slice(0, 3);
      const extra = (r.keywords || []).length - kws.length;
      const chips = kws.map(k => `<span class="kw-chip">${esc(k)}</span>`).join('') +
        (extra > 0 ? `<span class="kw-chip kw-chip-more">+${extra}</span>` : '');
      return `<tr>
        <td data-label="Term" style="font-weight:600;color:var(--text)">${esc(r.term)}
          <div class="term-slug">${esc(r.slug)}</div>
        </td>
        <td data-label="Category"><span class="category-tag">${esc(r.category)}</span></td>
        <td data-label="Keywords">${chips || '<span class="text-faint">—</span>'}</td>
        <td data-label="Last Reviewed">${formatDate(r.last_reviewed)}</td>
        <td data-label="Actions" data-full>
          <button class="btn-sm" onclick="AdminDashboard.openTermEditor('${r.slug}')">Edit</button>
          <button class="btn-sm danger" onclick="AdminDashboard.deleteTerm('${r.slug}')">Delete</button>
        </td>
      </tr>`;
    }).join('');
  }

  function populateCategoryList() {
    const cats = [...new Set(dictAll.map(r => r.category))].sort();
    const dl = document.getElementById('dictCategoryList');
    if (dl.dataset.filled === cats.join('|')) return;
    dl.dataset.filled = cats.join('|');
    dl.innerHTML = cats.map(c => `<option value="${esc(c)}"></option>`).join('');
  }

  function sortableLists(payload) {
    Object.keys(payload).forEach(k => {
      if (Array.isArray(payload[k])) {
        payload[k] = [...new Set(payload[k])].sort().filter(Boolean);
      }
    });
    return payload;
  }

  function slugifyTerm(s) {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function openTermEditor(slug) {
    const modal = document.getElementById('termModal');
    document.getElementById('termForm').reset();
    document.getElementById('termModalTitle').textContent = 'Add Legal Term';
    document.getElementById('termSaveBtn').textContent = 'Save Term';

    if (slug) {
      const r = dictAll.find(x => x.slug === slug);
      if (r) {
        document.getElementById('termModalTitle').textContent = 'Edit Legal Term';
        document.getElementById('termSaveBtn').textContent = 'Save Changes';
        document.getElementById('termInput').value = r.term;
        document.getElementById('termCategoryInput').value = r.category;
        document.getElementById('termDefInput').value = r.definition;
        document.getElementById('termSummaryInput').value = r.plain_language_summary;
        document.getElementById('termKeywordsInput').value = (r.keywords || []).join(', ');
        document.getElementById('termRelatedInput').value = (r.related_terms || []).join(', ');
        document.getElementById('termCitationsInput').value = (r.citations || []).join(', ');
        document.getElementById('termReviewedInput').value = r.last_reviewed || '';
      }
    }

    modal.classList.add('open');
  }

  function closeTermEditor() {
    document.getElementById('termModal').classList.remove('open');
    document.getElementById('termForm').reset();
  }

  async function saveTerm(e) {
    e.preventDefault();
    const term = document.getElementById('termInput').value.trim();
    const category = document.getElementById('termCategoryInput').value.trim();
    const definition = document.getElementById('termDefInput').value.trim();
    const summary = document.getElementById('termSummaryInput').value.trim();

    if (!term || !category || !definition || !summary) {
      toast('Term name, category, definition and summary are required.', 'error');
      return;
    }

    const splitCsv = (v, n) => v.split(',').map(s => s.trim()).filter(Boolean).slice(0, n);

    const payload = sortableLists({
      term,
      slug: slugifyTerm(term),
      definition,
      plain_language_summary: summary,
      category,
      keywords: splitCsv(document.getElementById('termKeywordsInput').value, 30),
      related_terms: splitCsv(document.getElementById('termRelatedInput').value, 30),
      citations: splitCsv(document.getElementById('termCitationsInput').value, 30),
      last_reviewed: document.getElementById('termReviewedInput').value || null,
      updated_at: new Date().toISOString()
    });

    const btn = document.getElementById('termSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const { error } = await window.db.from('legal_terms').upsert(payload, { onConflict: 'slug' });
      if (error) throw error;
      toast('Term saved.', 'success');
      closeTermEditor();
      loadDictionary();
    } catch (err) {
      console.error('[Legal Chords] Term save error:', err.message);
      toast('Save failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = document.getElementById('termModalTitle').textContent === 'Add Legal Term' ? 'Save Term' : 'Save Changes';
    }
  }

  async function deleteTerm(slug) {
    if (!confirm('Delete this term? This cannot be undone.')) return;
    const { error } = await window.db.from('legal_terms').delete().eq('slug', slug);
    if (error) {
      toast('Delete failed: ' + error.message, 'error');
      return;
    }
    toast('Term deleted.', 'success');
    loadDictionary();
  }

  async function syncBundledTerms() {
    const btn = document.getElementById('dictSyncBtn');
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = 'Syncing...';

    try {
      const res = await fetch('../data/legal-terms.json');
      if (!res.ok) throw new Error('Could not load bundled terms (status ' + res.status + ')');
      const bundled = await res.json();

      const rows = bundled.map(t => sortableLists({
        term: t.term,
        slug: t.slug,
        definition: t.definition,
        plain_language_summary: t.plainLanguageSummary,
        category: t.category,
        keywords: t.keywords || [],
        related_terms: t.relatedTerms || [],
        citations: t.citations || [],
        last_reviewed: t.lastReviewed || null,
        updated_at: new Date().toISOString()
      }));

      const { error } = await window.db.from('legal_terms').upsert(rows, { onConflict: 'slug' });
      if (error) throw error;
      toast(`Synced ${rows.length} terms from bundled data.`, 'success');
      loadDictionary();
    } catch (err) {
      console.error('[Legal Chords] Bundle sync error:', err.message);
      toast('Sync failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Sync from bundled';
    }
  }

  /* ---------- MODAL ---------- */
  function setupModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('detailModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeModal();
    });

    document.getElementById('termModalClose').addEventListener('click', closeTermEditor);
    document.getElementById('termModal').addEventListener('click', e => {
      if (e.target === e.currentTarget) closeTermEditor();
    });
    document.getElementById('termForm').addEventListener('submit', saveTerm);
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

  return {
    init, viewMember, updateStatus, removeSubscriber,
    toggleEditor, saveSection, chooseImage, uploadImage, addItem, removeItem, onEdit,
    openTermEditor, closeTermEditor, deleteTerm, syncBundledTerms
  };
})();
