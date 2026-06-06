/* ════════════════════════════════════════════════════════════════════
   Planning — Tasks manager + Budget Tracker (prototype rework).
   Data → render lists + stats → tabs / tasks / bulk / modals.
   Generic primitives + modal controller from shared/shell.{css,js}.
   DOM built with createElement / textContent (no innerHTML).
   ════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var toast = function (msg, opts) {
    var fn = window.evenzi && (window.evenzi.toast || window.evenzi.showToast);
    if (fn) fn(msg, opts);
  };

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

  /* ── Constants ── */
  var TODAY = '2026-06-04';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var PRIO_ORDER = { high: 0, med: 1, low: 2 };

  var EVENT_SUBEVENTS = [
    { id: 'haldi', label: 'Haldi' },
    { id: 'mehendi', label: 'Mehendi' },
    { id: 'sangeet', label: 'Sangeet' },
    { id: 'wedding', label: 'Wedding' },
    { id: 'reception', label: 'Reception' }
  ];
  function subEventLabel(id) {
    if (id == null) return 'Whole event';
    var s = EVENT_SUBEVENTS.filter(function (x) { return x.id === id; })[0];
    return s ? s.label : id;
  }
  function validSubEvent(id) {
    if (id == null) return true;
    return EVENT_SUBEVENTS.some(function (s) { return s.id === id; });
  }

  /* Canonical expense types — Event Settings will own this list in production.
     Custom types added inline use id 'custom-' + nextId. */
  var EXPENSE_TYPES = [
    { id: 'venue', label: 'Venue', icon: 'location_city', custom: false },
    { id: 'catering', label: 'Catering', icon: 'restaurant', custom: false },
    { id: 'decoration', label: 'Decoration', icon: 'local_florist', custom: false },
    { id: 'photography', label: 'Photography', icon: 'photo_camera', custom: false },
    { id: 'attire', label: 'Attire', icon: 'checkroom', custom: false },
    { id: 'music', label: 'Music / DJ', icon: 'music_note', custom: false },
    { id: 'invitations', label: 'Invitations', icon: 'mail', custom: false },
    { id: 'misc', label: 'Miscellaneous', icon: 'more_horiz', custom: false }
  ];
  function typeById(id) {
    return EXPENSE_TYPES.filter(function (t) { return t.id === id; })[0] || EXPENSE_TYPES[EXPENSE_TYPES.length - 1];
  }

  /* ISO date math (no new Date() in render path) */
  function daysInMonth(y, m) {
    if (m === 2) return (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 29 : 28;
    if (m === 4 || m === 6 || m === 9 || m === 11) return 30;
    return 31;
  }
  function parseISO(iso) {
    return { y: +iso.slice(0, 4), m: +iso.slice(5, 7), d: +iso.slice(8, 10) };
  }
  function toISO(o) {
    function pad(n) { return n < 10 ? '0' + n : String(n); }
    return o.y + '-' + pad(o.m) + '-' + pad(o.d);
  }
  function addDaysISO(iso, n) {
    var o = parseISO(iso);
    o.d += n;
    while (o.d > daysInMonth(o.y, o.m)) {
      o.d -= daysInMonth(o.y, o.m);
      o.m += 1;
      if (o.m > 12) { o.m = 1; o.y += 1; }
    }
    while (o.d < 1) {
      o.m -= 1;
      if (o.m < 1) { o.m = 12; o.y -= 1; }
      o.d += daysInMonth(o.y, o.m);
    }
    return toISO(o);
  }
  function fmtDate(iso) {
    if (!iso) return 'No date';
    var p = parseISO(iso);
    return p.d + ' ' + MONTHS[p.m - 1];
  }
  function relDay(iso, today) {
    if (!iso) return 'No date';
    if (iso === today) return 'Today';
    if (iso === addDaysISO(today, 1)) return 'Tomorrow';
    return fmtDate(iso);
  }
  function dayOfWeek(iso) {
    var o = parseISO(iso);
    var y = o.y, m = o.m, d = o.d;
    var labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var t = [0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4];
    if (m < 3) y -= 1;
    return labels[(y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) + t[m - 1] + d) % 7];
  }
  function groupHeading(iso, today) {
    if (!iso) return 'No date';
    if (iso === today) return 'Today';
    if (iso === addDaysISO(today, 1)) return 'Tomorrow';
    return dayOfWeek(iso) + ' ' + fmtDate(iso);
  }

  /* Wedding seed — deliberate due spread around TODAY */
  var WEDDING_META = [
    { label: 'Book venue', done: true, offset: -7, priority: 'high', subEvent: null },
    { label: 'Send invitations', done: true, offset: -3, priority: 'med', subEvent: null },
    { label: 'Book photographer', done: true, offset: -2, priority: 'high', subEvent: 'wedding' },
    { label: 'Book caterer', done: true, offset: -1, priority: 'high', subEvent: null },
    { label: 'Finalize menu', done: true, offset: 0, priority: 'med', subEvent: null },
    { label: 'Book DJ/band', done: true, offset: 0, priority: 'med', subEvent: 'sangeet' },
    { label: 'Arrange florist', done: true, offset: 1, priority: 'med', subEvent: null },
    { label: 'Book makeup artist', done: true, offset: 1, priority: 'med', subEvent: 'wedding' },
    { label: 'Plan honeymoon', done: true, offset: null, priority: 'low', subEvent: null },
    { label: 'Confirm guest count', done: true, offset: -1, priority: 'med', subEvent: null },
    { label: 'Book videographer', done: true, offset: 2, priority: 'med', subEvent: 'wedding' },
    { label: 'Reserve hotel blocks', done: true, offset: 3, priority: 'med', subEvent: null },
    { label: 'Choose wedding outfits', done: true, offset: 5, priority: 'med', subEvent: 'wedding' },
    { label: 'Book priest/officiant', done: true, offset: 7, priority: 'med', subEvent: 'wedding' },
    { label: 'Plan haldi ceremony', done: false, offset: -2, priority: 'med', subEvent: 'haldi' },
    { label: 'Plan mehendi ceremony', done: false, offset: -1, priority: 'med', subEvent: 'mehendi' },
    { label: 'Plan sangeet night', done: false, offset: 0, priority: 'med', subEvent: 'sangeet' },
    { label: 'Book decorator', done: false, offset: 0, priority: 'high', subEvent: null },
    { label: 'Arrange guest transportation', done: false, offset: 1, priority: 'med', subEvent: null },
    { label: 'Order wedding cake', done: false, offset: 1, priority: 'med', subEvent: 'reception' },
    { label: 'Finalize seating plan', done: false, offset: 3, priority: 'med', subEvent: 'reception' },
    { label: 'Arrange welcome gifts', done: false, offset: 5, priority: 'med', subEvent: null },
    { label: 'Confirm venue layout', done: false, offset: 7, priority: 'med', subEvent: 'wedding' },
    { label: 'Schedule rehearsal', done: false, offset: 10, priority: 'med', subEvent: 'wedding' },
    { label: 'Prepare wedding day timeline', done: false, offset: 12, priority: 'high', subEvent: 'wedding' },
    { label: 'Arrange backup indoor venue', done: false, offset: null, priority: 'med', subEvent: null },
    { label: 'Confirm vendor payments', done: false, offset: null, priority: 'med', subEvent: null },
    { label: 'Pack for honeymoon', done: false, offset: null, priority: 'low', subEvent: null },
    { label: 'Finalize music playlist', done: false, offset: 14, priority: 'med', subEvent: 'sangeet' },
    { label: 'Collect wedding outfits', done: false, offset: 2, priority: 'med', subEvent: 'wedding' }
  ];

  var TEMPLATES = {
    wedding: WEDDING_META,
    birthday: [
      'Book venue', 'Order cake', 'Send invitations',
      'Arrange entertainment', 'Plan catering', 'Buy decorations'
    ].map(function (l) { return { label: l, done: false, offset: null, priority: 'med', subEvent: null }; }),
    corporate: [
      'Book venue', 'Confirm speakers', 'Send invitations',
      'Arrange AV equipment', 'Organize catering', 'Print materials'
    ].map(function (l) { return { label: l, done: false, offset: null, priority: 'med', subEvent: null }; })
  };

  var eventType = 'wedding';
  var nextId = 1;
  function makeTask(meta) {
    var sub = meta.subEvent;
    if (sub && !validSubEvent(sub)) console.warn('Invalid subEvent seed:', sub, meta.label);
    return {
      id: nextId++,
      label: meta.label,
      done: !!meta.done,
      due: meta.offset == null ? null : addDaysISO(TODAY, meta.offset),
      subEvent: sub || null,
      priority: meta.priority || 'med',
      notes: null
    };
  }

  var tasks = TEMPLATES[eventType].map(makeTask);
  var expenses = [];
  var budget = null;

  var pendingDelete = null;
  var editingExpenseId = null;
  var editingTaskId = null;
  var receiptPreview = null;

  var activeTab = 'checklist';
  var taskView = 'list';
  var timelineMonth = parseISO(TODAY);
  var timelineDayFilter = 'all';
  var searchQuery = '';
  var statusFilter = 'all';
  var sortKey = 'due';
  var subEventFilter = null;
  var selecting = false;
  var selected = {};

  /* ── DOM refs ── */
  var tabChecklist = $('#plan-tab-checklist');
  var tabBudget = $('#plan-tab-budget');
  var panelCheck = $('#plan-panel-checklist');
  var panelBudget = $('#plan-panel-budget');
  var tasksCard = $('#plan-tasks-card');
  var progressLabel = $('#plan-progress-label');
  var progressShown = $('#plan-progress-shown');
  var progressFill = $('#plan-progress-fill');
  var alldoneEl = $('#plan-alldone');
  var taskListEl = $('#plan-task-list');
  var tasksEmptyEl = $('#plan-tasks-empty');
  var listBody = $('#plan-view-list-body');
  var timelineBody = $('#plan-view-timeline-body');
  var agendaEl = $('#plan-agenda');
  var dayEmptyEl = $('#plan-day-empty');
  var dayEmptyTitle = $('#plan-day-empty-title');
  var datebarMonth = $('#plan-datebar-month');
  var datebarChips = $('#plan-datebar-chips');
  var taskLive = $('#plan-task-live');
  var addFab = $('#plan-add-fab');
  var bulkBar = $('#plan-bulkbar');

  var budgetUnsetEl = $('#plan-budget-unset');
  var budgetBodyEl = $('#plan-budget-body');
  var statsTotal = $('#plan-stat-total');
  var statsSpent = $('#plan-stat-spent');
  var statsRemain = $('#plan-stat-remaining');
  var overBadgeEl = $('#plan-over-badge');
  var catListEl = $('#plan-cat-list');
  var expListEl = $('#plan-exp-list');
  var expEmptyEl = $('#plan-exp-empty');

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

  function isOverdue(task) {
    return !task.done && task.due && task.due < TODAY;
  }

  function taskStatus(task) {
    if (task.done) return 'done';
    if (isOverdue(task)) return 'overdue';
    return 'todo';
  }

  function statusLabel(st) {
    if (st === 'done') return 'Done';
    if (st === 'overdue') return 'Overdue';
    return 'To-do';
  }

  function statusIcon(st) {
    if (st === 'done') return 'check_circle';
    if (st === 'overdue') return 'warning';
    return 'radio_button_unchecked';
  }

  function sortTasks(arr) {
    return arr.slice().sort(function (a, b) {
      function bucket(t) {
        if (t.done) return 5;
        if (!t.due) return 4;
        if (t.due < TODAY) return 0;
        if (t.due === TODAY) return 1;
        return 2;
      }
      var ba = bucket(a), bb = bucket(b);
      if (ba !== bb) return ba - bb;
      if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1;
      var pa = PRIO_ORDER[a.priority] != null ? PRIO_ORDER[a.priority] : 1;
      var pb = PRIO_ORDER[b.priority] != null ? PRIO_ORDER[b.priority] : 1;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label);
    });
  }

  function applySort(arr) {
    if (sortKey === 'priority') {
      return arr.slice().sort(function (a, b) {
        var pa = PRIO_ORDER[a.priority] != null ? PRIO_ORDER[a.priority] : 1;
        var pb = PRIO_ORDER[b.priority] != null ? PRIO_ORDER[b.priority] : 1;
        if (pa !== pb) return pa - pb;
        return a.label.localeCompare(b.label);
      });
    }
    if (sortKey === 'label') {
      return arr.slice().sort(function (a, b) { return a.label.localeCompare(b.label); });
    }
    return sortTasks(arr);
  }

  function tasksBeforeStatusFilter() {
    var q = searchQuery.trim().toLowerCase();
    return tasks.filter(function (t) {
      if (q && t.label.toLowerCase().indexOf(q) === -1) return false;
      if (subEventFilter !== null) {
        if (subEventFilter === '') return t.subEvent == null;
        return t.subEvent === subEventFilter;
      }
      return true;
    });
  }

  function filteredTasks() {
    var out = tasksBeforeStatusFilter();
    if (statusFilter === 'all') return out;
    return out.filter(function (t) {
      var st = taskStatus(t);
      if (statusFilter === 'todo') return st === 'todo';
      if (statusFilter === 'done') return st === 'done';
      if (statusFilter === 'overdue') return st === 'overdue';
      return true;
    });
  }

  function visibleTasks() {
    return applySort(filteredTasks());
  }

  function visibleTasksForSelect() {
    var filtered = filteredTasks();
    if (taskView === 'timeline' && timelineDayFilter !== 'all') {
      filtered = filtered.filter(function (t) { return t.due === timelineDayFilter; });
    }
    return taskView === 'list' ? applySort(filtered) : filtered;
  }

  function statusCounts() {
    var base = tasksBeforeStatusFilter();
    var c = { all: base.length, todo: 0, done: 0, overdue: 0 };
    base.forEach(function (t) {
      var st = taskStatus(t);
      if (st === 'done') c.done++;
      else if (st === 'overdue') c.overdue++;
      else c.todo++;
    });
    return c;
  }

  function updateStatusChips() {
    var c = statusCounts();
    $$('[data-plan-chip]').forEach(function (el) {
      var key = el.getAttribute('data-plan-chip');
      if (key && c[key] != null) el.textContent = String(c[key]);
    });
  }

  function updateFilterBadge() {
    var badge = $('#plan-filter-count');
    var btn = $('#plan-filter-btn');
    var active = subEventFilter !== null;
    if (badge) {
      badge.textContent = active ? '1' : '0';
      badge.hidden = !active;
    }
    if (btn) btn.classList.toggle('is-active', active);
  }

  function updateSortLabel() {
    var l = $('.plan-sort-label');
    if (!l) return;
    if (sortKey === 'priority') l.textContent = 'Priority';
    else if (sortKey === 'label') l.textContent = 'A–Z';
    else l.textContent = 'Due date';
  }

  function announceFilterResult() {
    var n = filteredTasks().length;
    announce(n + ' task' + (n === 1 ? '' : 's') + ' shown');
  }

  function derive() {
    var doneCount = tasks.filter(function (t) { return t.done; }).length;
    var totalItems = tasks.length;
    var donePct = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100);
    var spent = expenses.reduce(function (sum, e) { return sum + e.amount; }, 0);
    var remaining = budget == null ? null : budget - spent;
    var overBy = budget != null && spent > budget ? spent - budget : 0;
    var typeTotals = {};
    expenses.forEach(function (e) {
      var tid = typeById(e.type).id;
      typeTotals[tid] = (typeTotals[tid] || 0) + e.amount;
    });
    return {
      doneCount: doneCount,
      totalItems: totalItems,
      donePct: donePct,
      spent: spent,
      remaining: remaining,
      overBy: overBy,
      isOver: overBy > 0,
      typeTotals: typeTotals
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

  function announce(msg) {
    if (taskLive) taskLive.textContent = msg;
  }

  function taskById(id) {
    return tasks.filter(function (t) { return t.id === id; })[0];
  }

  function selectedIds() {
    return Object.keys(selected).map(Number);
  }

  /* ════════════════ tabs ════════════════ */
  function selectTab(which) {
    if (which === 'budget' && selecting) exitSelect();
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
    if (addFab) addFab.setAttribute('aria-label', isCheck ? 'Add task' : 'Add expense');
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

  /* ════════════════ view toggle ════════════════ */
  var viewListBtn = $('#plan-view-list');
  var viewTimelineBtn = $('#plan-view-timeline');

  function setTaskView(v) {
    taskView = v;
    var isList = v === 'list';
    if (tasksCard) tasksCard.classList.toggle('is-timeline', !isList);
    viewListBtn.classList.toggle('is-active', isList);
    viewTimelineBtn.classList.toggle('is-active', !isList);
    viewListBtn.setAttribute('aria-checked', isList ? 'true' : 'false');
    viewTimelineBtn.setAttribute('aria-checked', isList ? 'false' : 'true');
    viewListBtn.tabIndex = isList ? 0 : -1;
    viewTimelineBtn.tabIndex = isList ? -1 : 0;
    listBody.hidden = !isList;
    timelineBody.hidden = isList;
    if (!isList) {
      renderDatebar();
      scrollTodayIntoView();
    }
    renderTasks();
  }

  function onViewKeydown(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.stopPropagation();
    e.preventDefault();
    setTaskView(taskView === 'list' ? 'timeline' : 'list');
    (taskView === 'list' ? viewListBtn : viewTimelineBtn).focus();
  }

  viewListBtn.addEventListener('click', function () { setTaskView('list'); });
  viewTimelineBtn.addEventListener('click', function () { setTaskView('timeline'); });
  $('#plan-view-toggle').addEventListener('keydown', onViewKeydown);

  /* ── Toolbar: search, status chips, sort, sub-event filter ── */
  var SORT_OPTS = [
    { value: 'due', label: 'Due date', icon: 'event' },
    { value: 'priority', label: 'Priority', icon: 'priority_high' },
    { value: 'label', label: 'A–Z', icon: 'sort_by_alpha' }
  ];

  function setStatusFilter(val) {
    statusFilter = val;
    $$('[data-plan-status]').forEach(function (chip) {
      var on = chip.getAttribute('data-plan-status') === val;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-checked', on ? 'true' : 'false');
      chip.tabIndex = on ? 0 : -1;
    });
    renderTasks();
    announceFilterResult();
  }

  $('#plan-search-input').addEventListener('input', function (e) {
    searchQuery = e.target.value;
    renderTasks();
    announceFilterResult();
  });

  $('#plan-status-chips').addEventListener('click', function (e) {
    var chip = e.target.closest('[data-plan-status]');
    if (chip) setStatusFilter(chip.getAttribute('data-plan-status'));
  });

  $('#plan-status-chips').addEventListener('keydown', function (e) {
    var chips = $$('[data-plan-status]', $('#plan-status-chips'));
    var idx = chips.findIndex(function (c) { return c.getAttribute('aria-checked') === 'true'; });
    if (idx < 0) idx = 0;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var n = chips.length;
      var next = e.key === 'ArrowRight' ? (idx + 1) % n : (idx - 1 + n) % n;
      setStatusFilter(chips[next].getAttribute('data-plan-status'));
      chips[next].focus();
    }
  });

  function openSubEventFilter(btn) {
    var opts = [
      { value: '__all__', label: 'All', icon: 'filter_list' },
      { value: '__whole__', label: 'Whole event', icon: 'celebration' }
    ].concat(EVENT_SUBEVENTS.map(function (s) { return { value: s.id, label: s.label, icon: 'event' }; }));
    var current = subEventFilter === null ? '__all__' : (subEventFilter === '' ? '__whole__' : subEventFilter);
    openPicker({
      anchor: btn,
      ariaLabel: 'Filter by sub-event',
      title: ['Sub-event'],
      options: opts,
      current: current,
      onPick: function (val) {
        if (val === '__all__') subEventFilter = null;
        else if (val === '__whole__') subEventFilter = '';
        else subEventFilter = val;
        updateFilterBadge();
        renderTasks();
        announceFilterResult();
      }
    });
  }

  function openSortPicker(btn) {
    openPicker({
      anchor: btn,
      ariaLabel: 'Sort tasks',
      title: ['Sort by'],
      options: SORT_OPTS,
      current: sortKey,
      onPick: function (val) {
        sortKey = val;
        updateSortLabel();
        renderTasks();
      }
    });
  }

  $('#plan-filter-btn').addEventListener('click', function () { openSubEventFilter(this); });
  $('#plan-sort-btn').addEventListener('click', function () { openSortPicker(this); });

  /* ════════════════ task row ════════════════ */
  function createTaskRow(task) {
    var st = taskStatus(task);
    var li = el('li', {
      class: 'task-row' +
        (selecting && selected[task.id] ? ' is-selected' : '') +
        (isOverdue(task) ? ' is-overdue' : ''),
      'data-id': String(task.id)
    });

    var surface = el('div', { class: 'task-row-surface', 'data-task-surface': '' });
    var cbId = 'plan-task-chk-' + task.id;
    var checkWrap = el('label', { class: 'task-row-check', for: cbId });
    var cb = el('input', { type: 'checkbox', id: cbId });
    if (task.done) cb.checked = true;
    checkWrap.appendChild(cb);
    surface.appendChild(checkWrap);

    var body = el('div', { class: 'task-row-body' });
    body.appendChild(el('span', { class: 'task-row-title', text: task.label }));
    var meta = el('div', { class: 'task-row-meta' });

    var dueChip = el('span', { class: 'task-due-chip' }, [
      icon('event'),
      relDay(task.due, TODAY)
    ]);
    meta.appendChild(dueChip);

    if (EVENT_SUBEVENTS.length) {
      meta.appendChild(el('span', {
        class: 'task-sub-chip guest-assign-chip'
      }, [icon('event'), subEventLabel(task.subEvent)]));
    }

    if (task.priority === 'high' || task.priority === 'low') {
      var prio = el('span', {
        class: 'task-prio task-prio--' + task.priority,
        'aria-label': 'Priority: ' + (task.priority === 'high' ? 'High' : 'Low')
      }, [
        el('span', { class: 'task-prio-dot', 'aria-hidden': 'true' }),
        el('span', { class: 'task-prio-label', text: task.priority === 'high' ? 'High' : 'Low' })
      ]);
      meta.appendChild(prio);
    }
    body.appendChild(meta);
    surface.appendChild(body);

    var badge = el('span', {
      class: 'task-status-badge status-badge task-status-badge--' + st,
      'aria-label': 'Status: ' + statusLabel(st)
    }, [
      icon(statusIcon(st)),
      statusLabel(st)
    ]);
    surface.appendChild(badge);

    var bulkCb = el('button', {
      type: 'button',
      class: 'task-row-bulk',
      role: 'checkbox',
      'aria-checked': selected[task.id] ? 'true' : 'false',
      'aria-label': 'Select ' + task.label
    }, icon(selected[task.id] ? 'check_box' : 'check_box_outline_blank'));
    surface.appendChild(bulkCb);

    li.appendChild(surface);

    if (!selecting) {
      li.appendChild(el('div', { class: 'task-row-rail', 'aria-hidden': 'true' }, [
        el('button', { type: 'button', class: 'tr-swipe tr-swipe-done', 'data-swipe': 'complete', tabindex: '-1' }, [icon('check_circle'), el('span', { text: 'Complete' })]),
        el('button', { type: 'button', class: 'tr-swipe tr-swipe-edit', 'data-swipe': 'edit', tabindex: '-1' }, [icon('edit'), el('span', { text: 'Edit' })]),
        el('button', { type: 'button', class: 'tr-swipe tr-swipe-delete', 'data-swipe': 'delete', tabindex: '-1' }, [icon('delete'), el('span', { text: 'Delete' })])
      ]));
    }
    return li;
  }

  function renderProgress(filteredCount) {
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

    if (filteredCount != null && filteredCount !== d.totalItems) {
      progressShown.hidden = false;
      progressShown.textContent = '· ' + filteredCount + ' shown';
    } else {
      progressShown.hidden = true;
      progressShown.textContent = '';
    }
  }

  function renderList() {
    var rows = visibleTasks();
    updateStatusChips();
    renderProgress(rows.length);
    tasksEmptyEl.hidden = tasks.length > 0;
    taskListEl.textContent = '';
    rows.forEach(function (t) { taskListEl.appendChild(createTaskRow(t)); });
  }

  function renderDatebar() {
    datebarMonth.textContent = MONTHS_FULL[timelineMonth.m - 1] + ' ' + timelineMonth.y;
    datebarChips.textContent = '';
    var allBtn = el('button', {
      type: 'button',
      class: 'task-day task-day--all' + (timelineDayFilter === 'all' ? ' is-selected' : ''),
      'aria-pressed': timelineDayFilter === 'all' ? 'true' : 'false'
    }, 'All');
    datebarChips.appendChild(allBtn);

    var todayBtn = el('button', {
      type: 'button',
      class: 'task-day task-day--all task-day--today' + (timelineDayFilter === TODAY ? ' is-selected' : ''),
      'aria-pressed': timelineDayFilter === TODAY ? 'true' : 'false',
      'aria-label': 'Today'
    }, 'Today');
    datebarChips.appendChild(todayBtn);

    var dim = daysInMonth(timelineMonth.y, timelineMonth.m);
    var pad = function (n) { return n < 10 ? '0' + n : String(n); };
    for (var d = 1; d <= dim; d++) {
      var iso = timelineMonth.y + '-' + pad(timelineMonth.m) + '-' + pad(d);
      var isToday = iso === TODAY;
      var isSel = timelineDayFilter === iso;
      var chip = el('button', {
        type: 'button',
        class: 'task-day' + (isToday ? ' is-today' : '') + (isSel ? ' is-selected' : ''),
        'data-day': iso,
        'aria-pressed': isSel ? 'true' : 'false',
        'aria-label': relDay(iso, TODAY)
      }, [
        el('span', { class: 'task-day-num', text: String(d) }),
        el('span', { text: MONTHS[timelineMonth.m - 1] })
      ]);
      datebarChips.appendChild(chip);
    }
  }

  function scrollTodayIntoView() {
    if (timelineMonth.y !== parseISO(TODAY).y || timelineMonth.m !== parseISO(TODAY).m) return;
    var todayChip = datebarChips.querySelector('[data-day="' + TODAY + '"]');
    if (todayChip) todayChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
  }

  function renderAgenda() {
    var filtered = filteredTasks();
    if (timelineDayFilter !== 'all') {
      filtered = filtered.filter(function (t) { return t.due === timelineDayFilter; });
    }
    updateStatusChips();
    renderProgress(filtered.length);
    agendaEl.textContent = '';
    dayEmptyEl.hidden = true;

    if (timelineDayFilter !== 'all' && filtered.length === 0) {
      dayEmptyEl.hidden = false;
      dayEmptyTitle.textContent = 'Nothing due on ' + fmtDate(timelineDayFilter) + '.';
      return;
    }

    var groups = {};
    var order = [];
    filtered.forEach(function (t) {
      var key = t.due || '__none__';
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(t);
    });
    order.sort(function (a, b) {
      if (a === '__none__') return 1;
      if (b === '__none__') return -1;
      return a < b ? -1 : 1;
    });

    order.forEach(function (key) {
      var heading = key === '__none__' ? 'No date' : groupHeading(key, TODAY);
      var section = el('section', { class: 'task-date-group' });
      section.appendChild(el('h3', { class: 'task-date-group-title', text: heading }));
      var ul = el('ul', { class: 'plan-agenda-group-list', role: 'list' });
      applySort(groups[key]).forEach(function (t) { ul.appendChild(createTaskRow(t)); });
      section.appendChild(ul);
      agendaEl.appendChild(section);
    });
  }

  function renderTasks() {
    if (taskView === 'list') renderList();
    else renderAgenda();
  }

  /* ════════════════ render budget ════════════════ */
  function createExpRow(exp) {
    var typ = typeById(exp.type);
    var vendor = exp.vendor || typ.label;
    var li = el('li', { class: 'exp-row', 'data-id': String(exp.id) });
    li.appendChild(el('span', { class: 'exp-row-icon' }, icon(typ.icon)));
    li.appendChild(el('div', { class: 'exp-row-body' }, [
      el('p', { class: 'exp-row-vendor', text: vendor }),
      el('p', { class: 'exp-row-cat', text: typ.label + (exp.notes ? ' · ' + exp.notes : '') })
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

    var types = EXPENSE_TYPES.map(function (t) {
      return { id: t.id, label: t.label, total: d.typeTotals[t.id] || 0 };
    }).filter(function (t) { return t.total > 0; })
      .sort(function (a, b) { return b.total - a.total; });

    catListEl.textContent = '';
    types.forEach(function (t) {
      var pct = d.spent === 0 ? 0 : Math.round((t.total / d.spent) * 100);
      catListEl.appendChild(el('li', { class: 'budget-bar-row' }, [
        el('span', { class: 'budget-bar-label', text: t.label }),
        el('div', { class: 'budget-bar-track' },
          el('span', { class: 'budget-bar-fill pf-bar', 'data-fill': String(pct) })
        ),
        el('span', { class: 'budget-bar-meta', text: fmtINR(t.total) + ' · ' + pct + '%' })
      ]));
    });

    expListEl.textContent = '';
    expenses.forEach(function (exp) { expListEl.appendChild(createExpRow(exp)); });
    expEmptyEl.hidden = expenses.length > 0;
    syncBars();
  }

  function render() {
    renderTasks();
    renderBudget();
    syncBars();
  }

  /* ════════════════ task interactions ════════════════ */
  function completeTasks(ids) {
    var snapshot = ids.map(function (id) {
      var t = taskById(id);
      return t ? { id: id, done: t.done } : null;
    }).filter(Boolean);
    ids.forEach(function (id) {
      var t = taskById(id);
      if (t) t.done = true;
    });
    renderTasks();
    var msg = ids.length === 1 ? 'Task completed' : ids.length + ' tasks completed';
    toast(msg, {
      actionLabel: 'Undo',
      onAction: function () {
        snapshot.forEach(function (s) {
          var t = taskById(s.id);
          if (t) t.done = s.done;
        });
        renderTasks();
      }
    });
  }

  function toggleTaskDone(id, done) {
    var t = taskById(id);
    if (!t) return;
    if (done && !t.done) {
      completeTasks([id]);
    } else {
      t.done = done;
      renderTasks();
    }
  }

  function handleTaskListClick(e, root) {
    if (selecting) {
      var row = e.target.closest('.task-row');
      if (row && !e.target.closest('.task-row-rail')) toggleSelect(row);
      return;
    }
    var sw = e.target.closest('[data-swipe]');
    if (sw) {
      var row2 = sw.closest('.task-row');
      var tid = +row2.getAttribute('data-id');
      var act = sw.getAttribute('data-swipe');
      if (act === 'complete') toggleTaskDone(tid, true);
      else if (act === 'edit') openTaskModal(tid);
      else if (act === 'delete') openDeleteConfirm('task', tid);
      return;
    }
    if (e.target.closest('.task-row-check') || e.target.closest('.task-status-badge') || e.target.closest('.task-row-rail')) return;
    var surface = e.target.closest('[data-task-surface]');
    if (surface) openTaskModal(+surface.closest('.task-row').getAttribute('data-id'));
  }

  taskListEl.addEventListener('click', function (e) { handleTaskListClick(e, taskListEl); });
  agendaEl.addEventListener('click', function (e) { handleTaskListClick(e, agendaEl); });

  taskListEl.addEventListener('change', function (e) {
    if (e.target.type !== 'checkbox') return;
    var li = e.target.closest('.task-row');
    if (!li) return;
    toggleTaskDone(+li.getAttribute('data-id'), e.target.checked);
  });
  agendaEl.addEventListener('change', function (e) {
    if (e.target.type !== 'checkbox') return;
    var li = e.target.closest('.task-row');
    if (!li) return;
    toggleTaskDone(+li.getAttribute('data-id'), e.target.checked);
  });

  datebarChips.addEventListener('click', function (e) {
    var chip = e.target.closest('.task-day');
    if (!chip) return;
    if (chip.classList.contains('task-day--today')) {
      timelineDayFilter = TODAY;
      var tm = parseISO(TODAY);
      if (timelineMonth.y !== tm.y || timelineMonth.m !== tm.m) {
        timelineMonth = tm;
        renderDatebar();
      } else {
        $$('.task-day', datebarChips).forEach(function (c) {
          var on = c.classList.contains('task-day--today') || c.getAttribute('data-day') === TODAY;
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
          c.classList.toggle('is-selected', on);
        });
      }
      scrollTodayIntoView();
      var nToday = tasks.filter(function (t) { return t.due === TODAY; }).length;
      announce('Showing Today — ' + nToday + ' tasks');
      renderAgenda();
      return;
    }
    if (chip.classList.contains('task-day--all')) timelineDayFilter = 'all';
    else timelineDayFilter = chip.getAttribute('data-day');
    $$('.task-day', datebarChips).forEach(function (c) {
      var on = c === chip;
      c.setAttribute('aria-pressed', on ? 'true' : 'false');
      c.classList.toggle('is-selected', on);
    });
    if (timelineDayFilter === 'all') {
      announce('Showing all dates — ' + tasks.length + ' tasks');
    } else {
      var n = tasks.filter(function (t) { return t.due === timelineDayFilter; }).length;
      announce('Showing ' + fmtDate(timelineDayFilter) + ' — ' + n + ' tasks');
    }
    renderAgenda();
  });

  $('#plan-date-prev').addEventListener('click', function () {
    timelineMonth.m -= 1;
    if (timelineMonth.m < 1) { timelineMonth.m = 12; timelineMonth.y -= 1; }
    renderDatebar();
  });
  $('#plan-date-next').addEventListener('click', function () {
    timelineMonth.m += 1;
    if (timelineMonth.m > 12) { timelineMonth.m = 1; timelineMonth.y += 1; }
    renderDatebar();
  });

  /* ════════════════ selection / bulk ════════════════ */
  function updateBulkBar() {
    var n = selectedIds().length;
    $('#plan-sel-count').textContent = String(n);
    $$('.bulk-bar-act', bulkBar).forEach(function (b) { b.disabled = n === 0; });
    var sa = $('[data-plan-select-all]');
    if (sa) {
      var vis = visibleTasksForSelect().length;
      var label = (n >= vis && vis > 0) ? 'Clear' : 'Select all';
      sa.textContent = label;
      sa.setAttribute('aria-label', label === 'Clear' ? 'Clear selection' : 'Select all visible tasks');
    }
  }

  function selectAllVisible() {
    visibleTasksForSelect().forEach(function (t) { selected[t.id] = true; });
    renderTasks();
    updateBulkBar();
  }

  function enterSelect() {
    selecting = true;
    selected = {};
    tasksCard.classList.add('is-selecting');
    bulkBar.hidden = false;
    if (addFab) addFab.hidden = true;
    renderTasks();
    updateBulkBar();
    announce('Selection mode on. Choose tasks, then pick a bulk action.');
  }

  function exitSelect() {
    selecting = false;
    selected = {};
    tasksCard.classList.remove('is-selecting');
    bulkBar.hidden = true;
    if (addFab) addFab.hidden = false;
    renderTasks();
    $('#plan-select-mode').focus();
  }

  function toggleSelect(row) {
    var id = +row.getAttribute('data-id');
    if (selected[id]) delete selected[id];
    else selected[id] = true;
    row.classList.toggle('is-selected', !!selected[id]);
    var bulkBtn = row.querySelector('.task-row-bulk');
    if (bulkBtn) {
      bulkBtn.setAttribute('aria-checked', selected[id] ? 'true' : 'false');
      bulkBtn.textContent = '';
      bulkBtn.appendChild(icon(selected[id] ? 'check_box' : 'check_box_outline_blank'));
    }
    updateBulkBar();
  }

  $('#plan-select-mode').addEventListener('click', enterSelect);
  $('#plan-bulk-cancel').addEventListener('click', exitSelect);
  $('[data-plan-select-all]').addEventListener('click', function () {
    var vis = visibleTasksForSelect().length;
    if (selectedIds().length >= vis && vis > 0) {
      selected = {};
      renderTasks();
      updateBulkBar();
    } else {
      selectAllVisible();
    }
  });

  $('#plan-bulk-complete').addEventListener('click', function () {
    var ids = selectedIds();
    if (!ids.length) return;
    completeTasks(ids);
    exitSelect();
  });

  $('#plan-bulk-delete').addEventListener('click', function () {
    if (!selectedIds().length) return;
    pendingDelete = { type: 'bulk', ids: selectedIds().slice() };
    $('#plan-delete-title').textContent = 'Delete ' + pendingDelete.ids.length + ' tasks?';
    $('#plan-delete-text').textContent = 'This cannot be undone.';
    window.evenzi.openModal('plan-delete-modal');
  });

  /* picker (bulk set date / assign) */
  var pickerEl = null, pickerScrim = null, pickerTrigger = null, pickerCfg = null;

  function openPicker(cfg) {
    teardownPicker();
    pickerTrigger = cfg.anchor;
    pickerCfg = cfg;
    cfg.anchor.setAttribute('aria-expanded', 'true');
    pickerScrim = el('div', { class: 'gm-setter-scrim' });
    pickerScrim.addEventListener('click', closePicker);
    var menuKids = cfg.options.map(function (o) {
      var on = o.value === cfg.current;
      return el('button', {
        type: 'button', class: 'gm-setter-opt', role: 'menuitemradio', 'data-val': o.value,
        'aria-checked': on ? 'true' : 'false', tabindex: on ? '0' : '-1'
      }, [o.icon ? icon(o.icon) : null, o.label, icon('check', 'gm-setter-check')].filter(Boolean));
    });
    pickerEl = el('div', {
      class: 'gm-setter', role: 'dialog', 'aria-modal': 'true', 'aria-label': cfg.ariaLabel
    }, [
      el('p', { class: 'gm-setter-title' }, cfg.title),
      el('div', { class: 'gm-setter-opts', role: 'menu', 'aria-label': cfg.ariaLabel }, menuKids)
    ]);
    document.body.appendChild(pickerScrim);
    document.body.appendChild(pickerEl);
    positionPicker();
    pickerEl.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-val]');
      if (opt) commitPick(opt.getAttribute('data-val'));
    });
    document.addEventListener('keydown', onPickerEsc, true);
  }

  function positionPicker() {
    if (!pickerEl || !pickerTrigger) return;
    if (window.innerWidth < 480) {
      pickerEl.style.top = '';
      pickerEl.style.left = '';
      pickerEl.style.bottom = '';
      return;
    }
    var margin = 8;
    var gap = 6;
    var r = pickerTrigger.getBoundingClientRect();
    var w = pickerEl.offsetWidth || 280;
    var h = pickerEl.offsetHeight || 200;
    var left = Math.min(Math.max(margin, r.right - w), window.innerWidth - w - margin);
    var top;
    if (r.bottom + h + gap > window.innerHeight - margin) {
      top = r.top - h - gap;
    } else {
      top = r.bottom + gap;
    }
    top = Math.max(margin, Math.min(top, window.innerHeight - h - margin));
    pickerEl.style.left = left + 'px';
    pickerEl.style.top = top + 'px';
    pickerEl.style.bottom = '';
  }

  function teardownPicker() {
    if (!pickerEl) return;
    document.removeEventListener('keydown', onPickerEsc, true);
    if (pickerScrim) pickerScrim.remove();
    pickerEl.remove();
    pickerEl = pickerScrim = null;
  }

  function commitPick(val) {
    var cfg = pickerCfg, trigger = pickerTrigger;
    teardownPicker();
    pickerTrigger = pickerCfg = null;
    if (cfg && cfg.onPick) cfg.onPick(val);
    if (trigger && document.contains(trigger)) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }

  function closePicker() {
    var trigger = pickerTrigger;
    teardownPicker();
    pickerTrigger = pickerCfg = null;
    if (trigger && document.contains(trigger)) {
      trigger.setAttribute('aria-expanded', 'false');
      trigger.focus();
    }
  }

  function onPickerEsc(e) {
    if (e.key === 'Escape') { e.preventDefault(); closePicker(); }
  }

  $('#plan-bulk-date').addEventListener('click', function () {
    openPicker({
      anchor: this,
      ariaLabel: 'Set due date for selected tasks',
      title: ['Set due date'],
      options: [
        { value: TODAY, label: 'Today', icon: 'today' },
        { value: addDaysISO(TODAY, 1), label: 'Tomorrow', icon: 'event' },
        { value: addDaysISO(TODAY, 7), label: 'In one week', icon: 'date_range' },
        { value: '', label: 'No date', icon: 'event_busy' }
      ],
      current: '',
      onPick: function (val) {
        selectedIds().forEach(function (id) {
          var t = taskById(id);
          if (t) t.due = val || null;
        });
        toast('DATES UPDATED');
        exitSelect();
      }
    });
  });

  $('#plan-bulk-assign').addEventListener('click', function () {
    var opts = [{ value: '', label: 'Whole event', icon: 'celebration' }]
      .concat(EVENT_SUBEVENTS.map(function (s) { return { value: s.id, label: s.label, icon: 'event' }; }));
    openPicker({
      anchor: this,
      ariaLabel: 'Assign sub-event for selected tasks',
      title: ['Assign sub-event'],
      options: opts,
      current: '',
      onPick: function (val) {
        selectedIds().forEach(function (id) {
          var t = taskById(id);
          if (t) t.subEvent = val || null;
        });
        toast('SUB-EVENTS UPDATED');
        exitSelect();
      }
    });
  });

  /* ════════════════ task modal ════════════════ */
  var taskLabel = $('#plan-task-label');
  var taskDue = $('#plan-task-due');
  var taskSub = $('#plan-task-subevent');
  var taskNotes = $('#plan-task-notes');
  var taskLabelErr = $('#plan-task-label-err');
  var taskSubWrap = $('#plan-task-subevent-wrap');
  var prioGroup = $('#plan-task-prio');

  function fillSubEventSelects() {
    var opts = [el('option', { value: '', text: 'Whole event' })];
    EVENT_SUBEVENTS.forEach(function (s) { opts.push(el('option', { value: s.id, text: s.label })); });
    taskSub.textContent = '';
    opts.forEach(function (o) { taskSub.appendChild(o); });
    var expSub = $('#plan-exp-subevent');
    expSub.textContent = '';
    opts.forEach(function (o) { expSub.appendChild(o.cloneNode(true)); });
    var hide = EVENT_SUBEVENTS.length === 0;
    taskSubWrap.hidden = hide;
    expSubWrap.hidden = hide;
  }

  function getPrio() {
    var p = prioGroup.querySelector('[aria-checked="true"]');
    return p ? p.getAttribute('data-prio') : 'med';
  }

  function setPrio(val) {
    $$('[data-prio]', prioGroup).forEach(function (b) {
      var on = b.getAttribute('data-prio') === val;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.classList.toggle('is-checked', on);
      b.tabIndex = on ? 0 : -1;
    });
  }

  prioGroup.addEventListener('click', function (e) {
    var pill = e.target.closest('[data-prio]');
    if (!pill) return;
    setPrio(pill.getAttribute('data-prio'));
  });

  function syncDateTrigger(input) {
    if (!input) return;
    var btn = input.previousElementSibling;
    if (!btn || !btn.hasAttribute('data-date-trigger')) return;
    var label = btn.querySelector('.form-input-trigger-value');
    if (!label) return;
    if (input.value) {
      input.dispatchEvent(new Event('change', { bubbles: false }));
    } else {
      label.textContent = '';
    }
  }

  function openTaskModal(id) {
    editingTaskId = id || null;
    var task = id ? taskById(id) : null;
    $('#plan-task-title').textContent = task ? 'Edit task' : 'Add task';
    $('#plan-task-save').textContent = task ? 'Save changes' : 'Save task';
    taskLabel.value = task ? task.label : '';
    taskDue.value = task && task.due ? task.due : '';
    syncDateTrigger(taskDue);
    taskSub.value = task && task.subEvent ? task.subEvent : '';
    setPrio(task ? task.priority : 'med');
    taskNotes.value = task && task.notes ? task.notes : '';
    setFormError(taskLabel, taskLabelErr, false);
    window.evenzi.openModal('plan-task-modal');
    taskLabel.focus();
  }

  $('#plan-task-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var label = taskLabel.value.trim();
    if (!label) {
      setFormError(taskLabel, taskLabelErr, true);
      return;
    }
    setFormError(taskLabel, taskLabelErr, false);
    var payload = {
      label: label,
      due: taskDue.value || null,
      subEvent: taskSub.value || null,
      priority: getPrio(),
      notes: taskNotes.value.trim() || null
    };
    if (editingTaskId) {
      var t = taskById(editingTaskId);
      if (t) {
        t.label = payload.label;
        t.due = payload.due;
        t.subEvent = payload.subEvent;
        t.priority = payload.priority;
        t.notes = payload.notes;
      }
      toast('TASK UPDATED');
    } else {
      tasks.push({
        id: nextId++,
        label: payload.label,
        done: false,
        due: payload.due,
        subEvent: payload.subEvent,
        priority: payload.priority,
        notes: payload.notes
      });
      toast('TASK ADDED');
    }
    editingTaskId = null;
    window.evenzi.closeModal('plan-task-modal');
    renderTasks();
  });

  addFab.addEventListener('click', function () {
    if (activeTab === 'checklist') openTaskModal(null);
    else openExpenseModal(null);
  });

  /* ════════════════ delete confirm ════════════════ */
  function openDeleteConfirm(type, id) {
    pendingDelete = { type: type, id: id };
    if (type === 'task') {
      var item = taskById(id);
      $('#plan-delete-title').textContent = 'Delete this task?';
      $('#plan-delete-text').textContent = item ? ('Remove "' + item.label + '" from your tasks?') : 'Remove this task?';
    } else {
      var exp = expenses.filter(function (x) { return x.id === id; })[0];
      $('#plan-delete-title').textContent = 'Delete this expense?';
      $('#plan-delete-text').textContent = exp
        ? ('Remove ' + fmtINR(exp.amount) + ' logged under ' + typeById(exp.type).label + '?')
        : 'Remove this expense entry?';
    }
    window.evenzi.openModal('plan-delete-modal');
  }

  $('#plan-delete-confirm').addEventListener('click', function () {
    if (!pendingDelete) return;
    if (pendingDelete.type === 'task') {
      tasks = tasks.filter(function (t) { return t.id !== pendingDelete.id; });
    } else if (pendingDelete.type === 'bulk') {
      var ids = pendingDelete.ids;
      tasks = tasks.filter(function (t) { return ids.indexOf(t.id) === -1; });
      exitSelect();
    } else {
      expenses = expenses.filter(function (x) { return x.id !== pendingDelete.id; });
    }
    pendingDelete = null;
    window.evenzi.closeModal('plan-delete-modal');
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
  var budgetErr = $('#plan-budget-err');

  function openBudgetModal() {
    budgetInput.value = budget != null ? String(budget) : '';
    setFormError(budgetInput, budgetErr, false);
    window.evenzi.openModal('plan-budget-modal');
    budgetInput.focus();
  }

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-plan-set-budget]')) { e.preventDefault(); openBudgetModal(); }
    if (e.target.closest('[data-plan-edit-budget]')) { e.preventDefault(); openBudgetModal(); }
    if (e.target.closest('[data-plan-add-expense]')) { e.preventDefault(); openExpenseModal(null); }
  });

  $('#plan-budget-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseAmount(budgetInput.value);
    if (amt == null) { setFormError(budgetInput, budgetErr, true); return; }
    setFormError(budgetInput, budgetErr, false);
    var btn = $('#plan-budget-save');
    btn.classList.add('is-loading');
    setTimeout(function () {
      budget = amt;
      btn.classList.remove('is-loading');
      window.evenzi.closeModal('plan-budget-modal');
      renderBudget();
      toast('BUDGET SAVED');
    }, 400);
  });

  /* ════════════════ expense modal ════════════════ */
  var expModalTitle = $('#plan-exp-title');
  var expAmount = $('#plan-exp-amount');
  var expType = $('#plan-exp-type');
  var expVendor = $('#plan-exp-vendor');
  var expSub = $('#plan-exp-subevent');
  var expSubWrap = $('#plan-exp-subevent-wrap');
  var expDate = $('#plan-exp-date');
  var expNotes = $('#plan-exp-notes');
  var expAmtErr = $('#plan-exp-amount-err');
  var typeTrigger = $('#plan-exp-type-trigger');
  var typePanel = $('#plan-exp-type-panel');
  var typeInput = $('#plan-exp-type-input');
  var typeConfirm = $('#plan-exp-type-confirm');
  var receiptFile = $('#plan-receipt-file');
  var receiptPreviewEl = $('#plan-receipt-preview');
  var receiptTrigger = $('#plan-receipt-trigger');
  var receiptImg = $('#plan-receipt-img');
  var receiptName = $('#plan-receipt-name');

  function fillTypeSelect() {
    expType.textContent = '';
    EXPENSE_TYPES.forEach(function (t) {
      expType.appendChild(el('option', { value: t.id, text: t.label }));
    });
  }

  function findTypeByLabel(label) {
    var norm = label.trim().toLowerCase();
    return EXPENSE_TYPES.filter(function (t) { return t.label.trim().toLowerCase() === norm; })[0];
  }

  function resetReceiptPreview() {
    receiptPreview = null;
    receiptFile.value = '';
    receiptPreviewEl.hidden = true;
    receiptTrigger.hidden = false;
  }

  function showReceiptPreview(dataUrl, name) {
    receiptPreview = dataUrl;
    receiptImg.src = dataUrl;
    receiptImg.alt = 'Receipt preview: ' + name;
    receiptName.textContent = name;
    receiptPreviewEl.hidden = false;
    receiptTrigger.hidden = true;
  }

  function closeTypeAdd() {
    typePanel.hidden = true;
    typeTrigger.hidden = false;
    typeInput.value = '';
    typeConfirm.disabled = true;
  }

  typeTrigger.addEventListener('click', function () {
    typeTrigger.hidden = true;
    typePanel.hidden = false;
    typeInput.focus();
  });

  typeInput.addEventListener('input', function () {
    var v = typeInput.value.trim();
    typeConfirm.disabled = !v || !!findTypeByLabel(v);
  });

  $('#plan-exp-type-cancel').addEventListener('click', function () {
    closeTypeAdd();
    typeTrigger.focus();
  });

  typeConfirm.addEventListener('click', function () {
    var label = typeInput.value.trim();
    if (!label) return;
    var existing = findTypeByLabel(label);
    if (existing) {
      expType.value = existing.id;
      closeTypeAdd();
      typeTrigger.focus();
      return;
    }
    var id = 'custom-' + nextId++;
    EXPENSE_TYPES.push({ id: id, label: label, icon: 'sell', custom: true });
    expType.appendChild(el('option', { value: id, text: label }));
    expType.value = id;
    closeTypeAdd();
    typeTrigger.focus();
    renderBudget();
  });

  receiptFile.addEventListener('change', function () {
    var file = receiptFile.files && receiptFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () { showReceiptPreview(reader.result, file.name); };
    reader.readAsDataURL(file);
  });

  $('#plan-receipt-remove').addEventListener('click', function () {
    resetReceiptPreview();
    receiptTrigger.focus();
  });

  function openExpenseModal(id) {
    editingExpenseId = id || null;
    resetReceiptPreview();
    closeTypeAdd();
    var exp = id ? expenses.filter(function (x) { return x.id === id; })[0] : null;
    expModalTitle.textContent = exp ? 'Edit expense' : 'Add expense';
    expAmount.value = exp ? String(exp.amount) : '';
    expType.value = exp ? exp.type : 'venue';
    expVendor.value = exp ? (exp.vendor || '') : '';
    if (!expSubWrap.hidden) expSub.value = exp && exp.subEvent ? exp.subEvent : '';
    expDate.value = exp && exp.date ? exp.date : TODAY;
    syncDateTrigger(expDate);
    expNotes.value = exp ? (exp.notes || '') : '';
    setFormError(expAmount, expAmtErr, false);
    window.evenzi.openModal('plan-expense-modal');
    expAmount.focus();
  }

  (function () {
    var em = $('#plan-expense-modal');
    new MutationObserver(function () {
      if (em.getAttribute('aria-hidden') === 'true') {
        editingExpenseId = null;
        resetReceiptPreview();
        closeTypeAdd();
      }
    }).observe(em, { attributes: true, attributeFilter: ['aria-hidden'] });
  })();

  $('#plan-expense-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var amt = parseAmount(expAmount.value);
    if (amt == null) { setFormError(expAmount, expAmtErr, true); return; }
    setFormError(expAmount, expAmtErr, false);
    var btn = $('#plan-exp-save');
    btn.classList.add('is-loading');
    setTimeout(function () {
      var wasEdit = !!editingExpenseId;
      var payload = {
        amount: amt,
        type: expType.value,
        vendor: expVendor.value.trim() || null,
        subEvent: expSubWrap.hidden ? null : (expSub.value || null),
        receipt: null,
        date: expDate.value || TODAY,
        notes: expNotes.value.trim() || null
      };
      if (editingExpenseId) {
        expenses = expenses.map(function (x) {
          if (x.id !== editingExpenseId) return x;
          return { id: x.id, amount: payload.amount, type: payload.type, vendor: payload.vendor, subEvent: payload.subEvent, receipt: null, date: payload.date, notes: payload.notes };
        });
      } else {
        expenses.push({ id: nextId++, amount: payload.amount, type: payload.type, vendor: payload.vendor, subEvent: payload.subEvent, receipt: null, date: payload.date, notes: payload.notes });
      }
      editingExpenseId = null;
      btn.classList.remove('is-loading');
      window.evenzi.closeModal('plan-expense-modal');
      renderBudget();
      toast(wasEdit ? 'EXPENSE UPDATED' : 'EXPENSE ADDED');
    }, 400);
  });

  /* ════════════════ init ════════════════ */
  fillTypeSelect();
  fillSubEventSelects();
  updateSortLabel();
  updateFilterBadge();
  selectTab('checklist');
  setTaskView('list');
  render();

})();
