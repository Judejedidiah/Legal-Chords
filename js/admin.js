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
          if (key === 'posterImage') return; // handled by image uploader
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

      // Add image uploader for featured events
      let uploaderField = '';
      if (s.section_key === 'events') {
        const imgUrl = (content && content.posterImage) || '';
        uploaderField = `<div class="editor-field">
          <label>Event Poster Image</label>
          <div class="event-image-upload">
            <img id="eventImgPreview-events" class="event-image-preview" src="${esc(imgUrl)}" alt="Event poster preview" ${imgUrl ? '' : 'hidden'}>
            <div class="event-image-controls">
              <input type="file" id="eventImgFile-events" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
              <button type="button" class="btn-sm" onclick="AdminDashboard.chooseEventImage()">Choose Image</button>
              <button type="button" class="btn-sm success" onclick="AdminDashboard.uploadEventImage()">Upload</button>
              ${imgUrl ? `<a class="btn-sm" href="${esc(imgUrl)}" target="_blank" rel="noopener">View Image</a>` : ''}
            </div>
            <input type="text" class="event-image-url" data-section="events" data-key="posterImage" value="${esc(imgUrl)}" placeholder="Image URL (auto-filled on upload)">
          </div>
        </div>`;
      }

      return `<div class="editor-section" data-section-id="${s.id}">
        <div class="editor-header" onclick="AdminDashboard.toggleEditor(this)">
          <h3>${esc(s.section_label)}</h3>
          <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
        </div>
        <div class="editor-body">
          ${uploaderField}
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

  /* ---------- EVENT IMAGE UPLOAD ---------- */
  function chooseEventImage() {
    document.getElementById('eventImgFile-events').click();
  }

  async function uploadEventImage() {
    const fileInput = document.getElementById('eventImgFile-events');
    const file = fileInput.files && fileInput.files[0];
    if (!file) {
      toast('Please choose an image first.', 'error');
      return;
    }

    const preview = document.getElementById('eventImgPreview-events');
    const urlInput = document.querySelector('input[data-section="events"][data-key="posterImage"]');
    const btn = document.querySelector('#tab-content .event-image-controls .btn-sm.success');

    if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }

    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = 'events/' + Date.now() + '-' + safeName;

      const { error } = await window.db.storage
        .from('event-images')
        .upload(path, file, { contentType: file.type, upsert: true });

      if (error) throw error;

      const { data: pub } = window.db.storage.from('event-images').getPublicUrl(path);
      const url = pub.publicUrl;

      if (preview) { preview.src = url; preview.hidden = false; }
      if (urlInput) urlInput.value = url;

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
    toggleEditor, saveSection, chooseEventImage, uploadEventImage,
    openTermEditor, closeTermEditor, deleteTerm, syncBundledTerms
  };
})();
