/* ════════════════════════════════════════════════════════════════════
   Planning — Checklist + Budget Tracker (prototype).
   Data → render lists + stats → tabs / check / add / delete / modals.
   Generic primitives + modal controller from shared/shell.{css,js}.
   DOM built with createElement / textContent (no innerHTML).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toast = function (t) { if (window.evenzi && window.evenzi.showToast) window.evenzi.showToast(t); };

  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    });
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(function (c) {
      if (c == null) return;
      n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return n;
  }
  function icon(name, extra) {
    return el('span', { class: 'material-symbols-outlined' + (extra ? ' ' + extra : ''), 'aria-hidden': 'true', text: name });
  }

  /* ── Stable category enum (8 keys) ── */
  var CATEGORIES = [
    { key: 'venue',        label: 'Venue',         icon: 'location_city' },
    { key: 'catering',     label: 'Catering',      icon: 'restaurant' },
    { key: 'decoration',   label: 'Decoration',    icon: 'local_florist' },
    { key: 'photography',  label: 'Photography',   icon: 'photo_camera' },
    { key: 'attire',       label: 'Attire',        icon: 'checkroom' },
    { key: 'music',        label: 'Music / DJ',    icon: 'music_note' },
    { key: 'invitations',  label: 'Invitations',   icon: 'mail' },
    { key: 'misc',         label: 'Miscellaneous', icon: 'more_horiz' }
  ];

  function catByKey(key) {
    return CATEGORIES.filter(function (c) { return c.key === key; })[0] || CATEGORIES[CATEGORIES.length - 1];
  }

  /* ── Event-type checklist templates ── */
  var TEMPLATES = {
    wedding: [
      'Book venue', 'Send invitations', 'Book photographer', 'Book caterer',
      'Finalize menu', 'Book DJ/band', 'Arrange florist', 'Book makeup artist',
      'Plan honeymoon', 'Confirm guest count', 'Book videographer', 'Reserve hotel blocks',
      'Choose wedding outfits', 'Book priest/officiant', 'Plan haldi ceremony',
      'Plan mehendi ceremony', 'Plan sangeet night', 'Book decorator',
      'Arrange guest transportation', 'Order wedding cake', 'Finalize seating plan',
      'Arrange welcome gifts', 'Confirm venue layout', 'Schedule rehearsal',
      'Prepare wedding day timeline', 'Arrange backup indoor venue',
      'Confirm vendor payments', 'Pack for honeymoon', 'Finalize music playlist',
      'Collect wedding outfits'
    ],
    birthday: [
      'Book venue', 'Order cake', 'Send invitations',
      'Arrange entertainment', 'Plan catering', 'Buy decorations'
    ],
    corporate: [
      'Book venue', 'Confirm speakers', 'Send invitations',
      'Arrange AV equipment', 'Organize catering', 'Print materials'
    ]
  };

  var eventType = 'wedding';
  var nextId = 1;
  function makeItem(label, done) {
    return { id: nextId++, label: label, done: !!done };
  }

  var checklist = TEMPLATES[eventType].map(function (label, i) {
    return makeItem(label, i < 14);
  });

  var expenses = [];
  var budget = null;

  var pendingDelete = null;
  var editingExpenseId = null;

  /* ── DOM refs ── */
  var tabChecklist = $('#plan-tab-checklist');
  var tabBudget    = $('#plan-tab-budget');
  var panelCheck   = $('#plan-panel-checklist');
  var panelBudget  = $('#plan-panel-budget');

  var progressLabel = $('#plan-progress-label');
  var progressFill  = $('#plan-progress-fill');
  var checklistList = $('#plan-checklist-list');
  var alldoneEl     = $('#plan-alldone');
  var addInput      = $('#plan-add-input');

  var budgetUnsetEl = $('#plan-budget-unset');
  var budgetBodyEl  = $('#plan-budget-body');
  var statsTotal    = $('#plan-stat-total');
  var statsSpent    = $('#plan-stat-spent');
  var statsRemain   = $('#plan-stat-remaining');
  var overBadgeEl   = $('#plan-over-badge');
  var catListEl     = $('#plan-cat-list');
  var expListEl     = $('#plan-exp-list');
  var expEmptyEl    = $('#plan-exp-empty');

  /* ════════════════ helpers ════════════════ */
  function fmtINR(n) {
    if (n == null || isNaN(n)) return '₹0';
    var neg = n < 0;
    var abs = Math.abs(Math.round(n));
    var s = String(abs);
    if (s.length <= 3) return (neg ? '-₹' : '₹') + s;
    var last3 = s.slice(-3);
    var rest = s.slice(0, -3);
    var parts = [];
    while (rest.length > 2) {
      parts.unshift(rest.slice(-2));
      rest = rest.slice(0, -2);
    }
    if (rest) parts.unshift(rest);
    return (neg ? '-₹' : '₹') + parts.join(',') + ',' + last3;
  }

  function parseAmount(raw) {
    var s = String(raw || '').replace(/[,₹\s]/g, '');
    if (!s || isNaN(Number(s)) || Number(s) <= 0) return null;
    return Math.round(Number(s));
  }

  function derive() {
    var doneCount = checklist.filter(function (c) { return c.done; }).length;
    var totalItems = checklist.length;
    var donePct = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);
    var spent = expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
    var remaining = budget == null ? null : budget - spent;
    var overBy = budget != null && spent > budget ? spent - budget : 0;
    var catTotals = {};
    expenses.forEach(function (e) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    });
    return {
      doneCount: doneCount,
      totalItems: totalItems,
      donePct: donePct,
      spent: spent,
      remaining: remaining,
      overBy: overBy,
      isOver: overBy > 0,
      catTotals: catTotals
    };
  }

  function syncBars() {
    $$('.pf-bar[data-fill]').forEach(function (b) {
      b.style.width = (parseFloat(b.dataset.fill || '0')) + '%';
    });
  }

  function setFormError(input, errEl, show) {
    if (input) {
      input.setAttribute('aria-invalid', show ? 'true' : 'false');
      var grp = input.closest('.form-input-group');
      if (grp) grp.setAttribute('aria-invalid', show ? 'true' : 'false');
    }
    if (errEl) errEl.hidden = !show;
  }

  /* ════════════════ tabs ════════════════ */
  var activeTab = 'checklist';

  function selectTab(which) {
    activeTab = which;
    var isCheck = which === 'checklist';
    tabChecklist.setAttribute('aria-selected', isCheck ? 'true' : 'false');
    tabBudget.setAttribute('aria-selected', isCheck ? 'false' : 'true');
    tabChecklist.classList.toggle('is-active', isCheck);
    tabBudget.classList.toggle('is-active', !isCheck);
    tabChecklist.tabIndex = isCheck ? 0 : -1;
    tabBudget.tabIndex = isCheck ? -1 : 0;
    panelCheck.hidden = !isCheck;
    panelBudget.hidden = isCheck;
  }

  function onTabKeydown(e, tab) {
    var tabs = [tabChecklist, tabBudget];
    var n = tabs.length;
    var i = tabs.indexOf(tab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var next = e.key === 'ArrowRight' ? (i + 1) % n : (i - 1 + n) % n;
      selectTab(next === 0 ? 'checklist' : 'budget');
      tabs[next].focus();
    }
  }

  tabChecklist.addEventListener('click', function () { selectTab('checklist'); });
  tabBudget.addEventListener('click', function () { selectTab('budget'); });
  tabChecklist.addEventListener('keydown', function (e) { onTabKeydown(e, tabChecklist); });
  tabBudget.addEventListener('keydown', function (e) { onTabKeydown(e, tabBudget); });

  /* ════════════════ render checklist ════════════════ */
  function createCheckItem(item) {
    var li = el('li', { class: 'plan-check-item', 'data-id': String(item.id) });
    var rowId = 'plan-chk-' + item.id;
    var cb = el('input', { type: 'checkbox', id: rowId });
    if (item.done) cb.checked = true;
    var label = el('label', { class: 'checklist-row checklist-row--simple' }, [
      cb,
      el('span', { class: 'checklist-check' }, icon('check')),
      el('span', { class: 'checklist-body' }, el('span', { class: 'checklist-title', text: item.label }))
    ]);
    var del = el('button', {
      type: 'button',
      class: 'plan-icon-btn',
      'data-plan-delete': 'checklist',
      'data-id': String(item.id),
      'aria-label': 'Delete ' + item.label
    }, icon('delete'));
    li.appendChild(label);
    li.appendChild(del);
    return li;
  }

  function renderChecklist() {
    var d = derive();
    var allDone = d.totalItems > 0 && d.doneCount === d.totalItems;

    if (allDone) {
      progressLabel.textContent = 'All done — every task complete 🎉';
    } else if (d.totalItems === 0) {
      progressLabel.textContent = '0 of 0 done · 0%';
    } else {
      progressLabel.textContent = d.doneCount + ' of ' + d.totalItems + ' done · ' + d.donePct + '%';
    }

    progressFill.dataset.fill = String(d.donePct);
    progressFill.style.width = d.donePct + '%';

    alldoneEl.hidden = !allDone;

    checklistList.textContent = '';
    checklist.forEach(function (item) {
      checklistList.appendChild(createCheckItem(item));
    });
  }

  /* ════════════════ render budget ════════════════ */
  function createExpRow(exp) {
    var cat = catByKey(exp.category);
    var vendor = exp.vendor || cat.label;
    var li = el('li', { class: 'exp-row', 'data-id': String(exp.id) });
    li.appendChild(el('span', { class: 'exp-row-icon' }, icon(cat.icon)));
    li.appendChild(el('div', { class: 'exp-row-body' }, [
      el('p', { class: 'exp-row-vendor', text: vendor }),
      el('p', { class: 'exp-row-cat', text: cat.label + (exp.notes ? ' · ' + exp.notes : '') })
    ]));
    li.appendChild(el('span', { class: 'exp-row-amt', text: fmtINR(exp.amount) }));
    li.appendChild(el('div', { class: 'exp-row-actions' }, [
      el('button', {
        type: 'button', class: 'plan-icon-btn', 'data-plan-edit-exp': '',
        'data-id': String(exp.id), 'aria-label': 'Edit ' + vendor
      }, icon('edit')),
      el('button', {
        type: 'button', class: 'plan-icon-btn', 'data-plan-delete': 'expense',
        'data-id': String(exp.id), 'aria-label': 'Delete ' + vendor
      }, icon('delete'))
    ]));
    return li;
  }

  function renderBudget() {
    var d = derive();
    var hasBudget = budget != null;

    budgetUnsetEl.hidden = hasBudget;
    budgetBodyEl.hidden = !hasBudget;

    if (!hasBudget) {
      catListEl.textContent = '';
      expListEl.textContent = '';
      expEmptyEl.hidden = true;
      return;
    }

    statsTotal.textContent = fmtINR(budget);
    statsSpent.textContent = fmtINR(d.spent);
    statsRemain.textContent = fmtINR(d.remaining);
    statsRemain.classList.toggle('is-negative', d.remaining < 0);

    if (d.isOver) {
      overBadgeEl.hidden = false;
      overBadgeEl.textContent = '';
      overBadgeEl.appendChild(icon('warning'));
      overBadgeEl.appendChild(document.createTextNode('Over budget by ' + fmtINR(d.overBy)));
    } else {
      overBadgeEl.hidden = true;
    }

    /* category bars — sorted desc by spend */
    var cats = CATEGORIES.map(function (c) {
      return { key: c.key, label: c.label, total: d.catTotals[c.key] || 0 };
    }).filter(function (c) { return c.total > 0; })
      .sort(function (a, b) { return b.total - a.total; });

    catListEl.textContent = '';
    cats.forEach(function (c) {
      var pct = d.spent === 0 ? 0 : Math.round((c.total / d.spent) * 100);
      var li = el('li', { class: 'budget-bar-row' }, [
        el('span', { class: 'budget-bar-label', text: c.label }),
        el('div', { class: 'budget-bar-track' },
          el('span', { class: 'budget-bar-fill pf-bar', 'data-fill': String(pct) })
        ),
        el('span', { class: 'budget-bar-meta', text: fmtINR(c.total) + ' · ' + pct + '%' })
      ]);
      catListEl.appendChild(li);
    });

    expListEl.textContent = '';
    expenses.forEach(function (exp) {
      expListEl.appendChild(createExpRow(exp));
    });
    expEmptyEl.hidden = expenses.length > 0;

    syncBars();
  }

  function render() {
    renderChecklist();
    renderBudget();
    syncBars();
  }

  /* ════════════════ checklist interactions ════════════════ */
  checklistList.addEventListener('change', function (e) {
    var cb = e.target;
    if (cb.type !== 'checkbox') return;
    var li = cb.closest('.plan-check-item');
    if (!li) return;
    var id = +li.getAttribute('data-id');
    var item = checklist.filter(function (c) { return c.id === id; })[0];
    if (item) { item.done = cb.checked; renderChecklist(); }
  });

  $('#plan-add-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var label = addInput.value.trim();
    if (!label) return;
    checklist.push(makeItem(label, false));
    addInput.value = '';
    renderChecklist();
    toast('ITEM ADDED');
  });

  /* ════════════════ delete confirm ════════════════ */
  var deleteTitle = $('#plan-delete-title');
  var deleteText  = $('#plan-delete-text');

  function openDeleteConfirm(type, id) {
    pendingDelete = { type: type, id: id };
    if (type === 'checklist') {
      var item = checklist.filter(function (c) { return c.id === id; })[0];
      deleteTitle.textContent = 'Delete this item?';
      deleteText.textContent = item ? ('Remove "' + item.label + '" from your checklist?') : 'Remove this item from your checklist?';
    } else {
      var exp = expenses.filter(function (x) { return x.id === id; })[0];
      deleteTitle.textContent = 'Delete this expense?';
      deleteText.textContent = exp ? ('Remove ' + fmtINR(exp.amount) + ' logged under ' + catByKey(exp.category).label + '?') : 'Remove this expense entry?';
    }
    if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal('plan-delete-modal');
  }

  $('#plan-delete-confirm').addEventListener('click', function () {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'checklist') {
      checklist = checklist.filter(function (c) { return c.id !== pendingDelete.id; });
    } else {
      expenses = expenses.filter(function (x) { return x.id !== pendingDelete.id; });
    }
    pendingDelete = null;
    if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal('plan-delete-modal');
    render();
    toast('DELETED');
  });

  document.addEventListener('click', function (e) {
    var del = e.target.closest('[data-plan-delete]');
    if (del) {
      e.preventDefault();
      openDeleteConfirm(del.getAttribute('data-plan-delete'), +del.getAttribute('data-id'));
      return;
    }
    var edit = e.target.closest('[data-plan-edit-exp]');
    if (edit) openExpenseModal(+edit.getAttribute('data-id'));
  });

  /* ════════════════ budget modal ════════════════ */
  var budgetInput = $('#plan-budget-input');
  var budgetErr   = $('#plan-budget-err');

  function openBudgetModal() {
    budgetInput.value = budget != null ? String(budget) : '';
    setFormError(budgetInput, budgetErr, false);
    if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal('plan-budget-modal');
    budgetInput.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-plan-set-budget]')) {
      e.preventDefault();
      openBudgetModal();
    }
    if (e.target.closest('[data-plan-edit-budget]')) {
      e.preventDefault();
      openBudgetModal();
    }
  });

  $('#plan-budget-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseAmount(budgetInput.value);
    if (amt == null) {
      setFormError(budgetInput, budgetErr, true);
      return;
    }
    setFormError(budgetInput, budgetErr, false);
    var btn = $('#plan-budget-save');
    btn.classList.add('is-loading');
    setTimeout(function () {
      budget = amt;
      btn.classList.remove('is-loading');
      if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal('plan-budget-modal');
      renderBudget();
      toast('BUDGET SAVED');
    }, 400);
  });

  /* ════════════════ expense modal ════════════════ */
  var expModalTitle = $('#plan-exp-title');
  var expAmount     = $('#plan-exp-amount');
  var expCategory   = $('#plan-exp-category');
  var expVendor     = $('#plan-exp-vendor');
  var expNotes      = $('#plan-exp-notes');
  var expAmtErr     = $('#plan-exp-amount-err');

  function fillCategorySelect() {
    expCategory.textContent = '';
    CATEGORIES.forEach(function (c) {
      expCategory.appendChild(el('option', { value: c.key, text: c.label }));
    });
  }

  function openExpenseModal(id) {
    editingExpenseId = id || null;
    var exp = id ? expenses.filter(function (x) { return x.id === id; })[0] : null;
    expModalTitle.textContent = exp ? 'Edit expense' : 'Add expense';
    expAmount.value = exp ? String(exp.amount) : '';
    expCategory.value = exp ? exp.category : 'venue';
    expVendor.value = exp ? (exp.vendor || '') : '';
    expNotes.value = exp ? (exp.notes || '') : '';
    setFormError(expAmount, expAmtErr, false);
    if (window.evenzi && window.evenzi.openModal) window.evenzi.openModal('plan-expense-modal');
    expAmount.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-plan-add-expense]')) {
      e.preventDefault();
      openExpenseModal(null);
    }
  });

  $('#plan-expense-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseAmount(expAmount.value);
    if (amt == null) {
      setFormError(expAmount, expAmtErr, true);
      return;
    }
    setFormError(expAmount, expAmtErr, false);
    var btn = $('#plan-exp-save');
    btn.classList.add('is-loading');
    setTimeout(function () {
      var wasEdit = !!editingExpenseId;
      var payload = {
        amount: amt,
        category: expCategory.value,
        vendor: expVendor.value.trim() || null,
        notes: expNotes.value.trim() || null
      };
      if (editingExpenseId) {
        expenses = expenses.map(function (x) {
          if (x.id !== editingExpenseId) return x;
          return { id: x.id, amount: payload.amount, category: payload.category, vendor: payload.vendor, notes: payload.notes };
        });
      } else {
        expenses.push({ id: nextId++, amount: payload.amount, category: payload.category, vendor: payload.vendor, notes: payload.notes });
      }
      editingExpenseId = null;
      btn.classList.remove('is-loading');
      if (window.evenzi && window.evenzi.closeModal) window.evenzi.closeModal('plan-expense-modal');
      renderBudget();
      toast(wasEdit ? 'EXPENSE UPDATED' : 'EXPENSE ADDED');
    }, 400);
  });

  /* ════════════════ init ════════════════ */
  fillCategorySelect();
  selectTab('checklist');
  render();

})();
