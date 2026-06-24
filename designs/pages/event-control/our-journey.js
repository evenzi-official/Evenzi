/* Our Journey — sub-events add / edit / remove with modals.
   shell.js provides: window.evenzi.openModal/closeModal/showToast, the
   .toggle-switch (delegated), theme, breadcrumb. Rows built with explicit
   DOM nodes (no innerHTML). */
(function () {
  var list = document.getElementById('oj-list');
  var empty = document.getElementById('oj-empty');
  var countPill = document.getElementById('oj-count');

  var FORM = '#oj-form-modal';
  var DEL = '#oj-del-modal';
  var titleEl = document.getElementById('oj-form-title');
  var saveBtn = document.getElementById('oj-form-save');
  var fName = document.getElementById('oj-f-name');
  var fType = document.getElementById('oj-f-type');
  var fDate = document.getElementById('oj-f-date');
  var fTime = document.getElementById('oj-f-time');
  var fVenue = document.getElementById('oj-f-venue');
  var fWeb = document.getElementById('oj-f-web');
  var nameErr = document.getElementById('oj-f-name-err');
  var delText = document.getElementById('oj-del-text');
  var delConfirm = document.getElementById('oj-del-confirm');

  var ICONS = {
    'Pre-wedding shoot': 'photo_camera', 'Engagement': 'diamond', 'Mehendi': 'back_hand',
    'Haldi': 'spa', 'Sangeet': 'music_note', 'Wedding ceremony': 'favorite',
    'Reception': 'celebration', 'Other': 'event'
  };

  var editingRow = null;   // null = add mode
  var pendingDelete = null;

  function toast(m) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(m); }
  function open(id) { if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal(id); }
  function close(id) { if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal(id); }

  function el(t, c, txt) { var n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; }
  function mi(name, fill) { var s = el('span', 'material-symbols-outlined' + (fill ? ' icon-fill' : ''), name); s.setAttribute('aria-hidden', 'true'); return s; }
  function iconBtn(c, g, attr, label) { var b = el('button', c); b.type = 'button'; b.setAttribute(attr, ''); b.setAttribute('aria-label', label); b.appendChild(mi(g)); return b; }

  function updateState() {
    if (!list) return;
    var n = list.querySelectorAll('.oj-row').length;
    if (countPill) countPill.textContent = n + (n === 1 ? ' FUNCTION' : ' FUNCTIONS');
    if (empty) empty.classList.toggle('hidden', n > 0);
    list.classList.toggle('hidden', n === 0);
  }

  function buildRow(d) {
    var li = el('li', 'oj-row clay-card');
    var iconWrap = el('span', 'oj-row-icon'); iconWrap.setAttribute('aria-hidden', 'true'); iconWrap.appendChild(mi(ICONS[d.type] || 'event', true));
    var main = el('div', 'oj-row-main');
    var head = el('div', 'oj-row-head'); head.appendChild(el('h2', 'oj-row-title', d.name));
    main.appendChild(head);
    main.appendChild(el('p', 'oj-row-meta', d.meta || 'Set a date · Set a venue'));
    var actions = el('div', 'oj-row-actions');
    var label = el('label', 'oj-vis'); label.appendChild(el('span', 'oj-vis-label', 'Website'));
    var toggle = el('button', 'toggle-switch'); toggle.type = 'button'; toggle.setAttribute('role', 'switch'); toggle.setAttribute('aria-checked', d.web ? 'true' : 'false'); toggle.setAttribute('aria-label', 'Show ' + d.name + ' on website');
    label.appendChild(toggle); actions.appendChild(label);
    actions.appendChild(iconBtn('fn-icon-btn', 'edit', 'data-oj-edit', 'Edit ' + d.name));
    actions.appendChild(iconBtn('fn-icon-btn oj-del', 'delete', 'data-oj-remove', 'Remove ' + d.name));
    li.appendChild(iconWrap); li.appendChild(main); li.appendChild(actions);
    return li;
  }

  function setToggle(btn, on) { if (btn) btn.setAttribute('aria-checked', on ? 'true' : 'false'); }
  function clearNameErr() { if (nameErr) nameErr.hidden = true; fName.removeAttribute('aria-invalid'); }

  function fillForm(d) {
    fName.value = d.name || '';
    fType.value = ICONS[d.type] ? d.type : 'Other';
    fDate.value = d.date || ''; fTime.value = d.time || ''; fVenue.value = d.venue || '';
    setToggle(fWeb, d.web !== false);
    clearNameErr();
  }

  function readForm() {
    var date = fDate.value.trim(), time = fTime.value.trim(), venue = fVenue.value.trim();
    return {
      name: fName.value.trim(),
      type: fType.value,
      meta: [date, time, venue].filter(Boolean).join(' · '),
      web: fWeb.getAttribute('aria-checked') === 'true'
    };
  }

  function rowToData(row) {
    var name = (row.querySelector('.oj-row-title') || {}).textContent || '';
    var parts = ((row.querySelector('.oj-row-meta') || {}).textContent || '').split(' · ');
    var type = 'Other', keys = Object.keys(ICONS);
    for (var i = 0; i < keys.length; i++) { if (name.toLowerCase() === keys[i].toLowerCase()) { type = keys[i]; break; } }
    var web = row.querySelector('.toggle-switch');
    return { name: name, type: type, date: parts[0] || '', time: parts[1] || '', venue: parts[2] || '', web: web ? web.getAttribute('aria-checked') === 'true' : true };
  }

  function applyToRow(row, d) {
    var t = row.querySelector('.oj-row-title'); if (t) t.textContent = d.name;
    var m = row.querySelector('.oj-row-meta'); if (m) m.textContent = d.meta || 'Set a date · Set a venue';
    var ic = row.querySelector('.oj-row-icon .material-symbols-outlined'); if (ic) ic.textContent = ICONS[d.type] || 'event';
    setToggle(row.querySelector('.toggle-switch'), d.web);
  }

  function openAdd() {
    editingRow = null;
    titleEl.textContent = 'Add sub-event';
    saveBtn.textContent = 'Add sub-event';
    fillForm({ type: 'Mehendi', web: true });
    open(FORM);
    setTimeout(function () { fName.focus(); }, 90);
  }
  function openEdit(row) {
    editingRow = row;
    titleEl.textContent = 'Edit sub-event';
    saveBtn.textContent = 'Save changes';
    fillForm(rowToData(row));
    open(FORM);
    setTimeout(function () { fName.focus(); }, 90);
  }
  function save() {
    var d = readForm();
    if (!d.name) { if (nameErr) nameErr.hidden = false; fName.setAttribute('aria-invalid', 'true'); fName.focus(); return; }
    if (editingRow) { applyToRow(editingRow, d); toast(d.name.toUpperCase() + ' UPDATED'); }
    else { var row = buildRow(d); list.appendChild(row); updateState(); row.scrollIntoView({ behavior: 'smooth', block: 'center' }); toast('SUB-EVENT ADDED'); }
    close(FORM);
    updateState();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-oj-add]')) { openAdd(); return; }
    var ed = e.target.closest('[data-oj-edit]'); if (ed) { var r = ed.closest('.oj-row'); if (r) openEdit(r); return; }
    var rm = e.target.closest('[data-oj-remove]');
    if (rm) {
      var rr = rm.closest('.oj-row');
      if (rr) {
        pendingDelete = rr;
        var nm = (rr.querySelector('.oj-row-title') || {}).textContent || 'this function';
        if (delText) delText.textContent = '“' + nm + '” will be removed from your journey, the Event Control roadmap and your website schedule. This can’t be undone.';
        open(DEL);
      }
      return;
    }
  });

  if (saveBtn) saveBtn.addEventListener('click', save);
  if (delConfirm) delConfirm.addEventListener('click', function () {
    if (pendingDelete) {
      var nm = (pendingDelete.querySelector('.oj-row-title') || {}).textContent || 'Sub-event';
      pendingDelete.remove(); pendingDelete = null;
      toast(nm.toUpperCase() + ' REMOVED');
      updateState();
    }
    close(DEL);
  });
  if (fName) fName.addEventListener('input', clearNameErr);

  updateState();
})();
