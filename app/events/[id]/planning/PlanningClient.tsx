"use client"
import { useState, useRef, useMemo, useCallback } from 'react'

type Priority = 'high' | 'med' | 'low'
type StatusFilter = 'all' | 'todo' | 'done' | 'overdue'
type SortKey = 'due' | 'priority' | 'label'
type TabId = 'checklist' | 'budget'
type ViewMode = 'list' | 'timeline'

interface Task {
  id: number; label: string; done: boolean; due: string | null
  subEvent: string | null; priority: Priority; notes: string | null
}
interface Expense {
  id: number; amount: number; type: string; vendor: string | null
  subEvent: string | null; date: string; notes: string | null
}
interface DeleteTarget { type: 'task' | 'expense' | 'bulk'; id?: number; ids?: number[] }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const PRIO_ORDER: Record<Priority, number> = { high: 0, med: 1, low: 2 }

const EVENT_SUBEVENTS = [
  { id: 'haldi', label: 'Haldi' },
  { id: 'mehendi', label: 'Mehendi' },
  { id: 'sangeet', label: 'Sangeet' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'reception', label: 'Reception' },
]

const EXPENSE_TYPES = [
  { id: 'venue', label: 'Venue', icon: 'location_city' },
  { id: 'catering', label: 'Catering', icon: 'restaurant' },
  { id: 'decoration', label: 'Decoration', icon: 'local_florist' },
  { id: 'photography', label: 'Photography', icon: 'photo_camera' },
  { id: 'attire', label: 'Attire', icon: 'checkroom' },
  { id: 'music', label: 'Music / DJ', icon: 'music_note' },
  { id: 'invitations', label: 'Invitations', icon: 'mail' },
  { id: 'misc', label: 'Miscellaneous', icon: 'more_horiz' },
]

function getToday() { return new Date().toISOString().slice(0, 10) }
function daysInMonth(y: number, m: number) {
  if (m === 2) return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28
  return [4,6,9,11].includes(m) ? 30 : 31
}
function parseISO(iso: string) { return { y: +iso.slice(0,4), m: +iso.slice(5,7), d: +iso.slice(8,10) } }
function pad(n: number) { return n < 10 ? '0' + n : String(n) }
function toISO(o: { y: number; m: number; d: number }) { return `${o.y}-${pad(o.m)}-${pad(o.d)}` }
function addDaysISO(iso: string, n: number) {
  const o = parseISO(iso); o.d += n
  while (o.d > daysInMonth(o.y, o.m)) { o.d -= daysInMonth(o.y, o.m); o.m++; if (o.m > 12) { o.m = 1; o.y++ } }
  while (o.d < 1) { o.m--; if (o.m < 1) { o.m = 12; o.y-- }; o.d += daysInMonth(o.y, o.m) }
  return toISO(o)
}
function fmtDate(iso: string | null) {
  if (!iso) return 'No date'; const p = parseISO(iso); return `${p.d} ${MONTHS[p.m - 1]}`
}
function relDay(iso: string | null, today: string) {
  if (!iso) return 'No date'
  if (iso === today) return 'Today'
  if (iso === addDaysISO(today, 1)) return 'Tomorrow'
  return fmtDate(iso)
}
function dayOfWeek(iso: string) {
  const { y, m, d } = parseISO(iso); let yr = y, mo = m
  const t = [0,3,2,5,0,3,5,1,4,6,2,4]; if (mo < 3) yr--
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(yr + Math.floor(yr/4) - Math.floor(yr/100) + Math.floor(yr/400) + t[mo-1] + d) % 7]
}
function groupHeading(iso: string, today: string) {
  if (iso === today) return 'Today'
  if (iso === addDaysISO(today, 1)) return 'Tomorrow'
  return `${dayOfWeek(iso)} ${fmtDate(iso)}`
}
function fmtINR(n: number | null) {
  if (n == null || isNaN(n)) return '₹0'
  const neg = n < 0; const s = String(Math.abs(Math.round(n)))
  if (s.length <= 3) return (neg ? '-₹' : '₹') + s
  const last3 = s.slice(-3); let rest = s.slice(0, -3); const parts: string[] = []
  while (rest.length > 2) { parts.unshift(rest.slice(-2)); rest = rest.slice(0, -2) }
  if (rest) parts.unshift(rest)
  return (neg ? '-₹' : '₹') + parts.join(',') + ',' + last3
}
function parseAmount(raw: string) {
  const s = raw.replace(/[,₹\s]/g, '')
  return !s || isNaN(Number(s)) || Number(s) <= 0 ? null : Math.round(Number(s))
}
function typeById(id: string) { return EXPENSE_TYPES.find(t => t.id === id) || EXPENSE_TYPES[EXPENSE_TYPES.length - 1] }
function subEventLabel(id: string | null) {
  if (id == null) return 'Whole event'
  return EVENT_SUBEVENTS.find(x => x.id === id)?.label ?? id
}

export function PlanningClient({ eventName }: { eventName: string }) {
  const TODAY = useMemo(getToday, [])
  const todayParsed = useMemo(() => parseISO(TODAY), [TODAY])

  const [activeTab, setActiveTab] = useState<TabId>('checklist')
  const [taskView, setTaskView] = useState<ViewMode>('list')
  const [tasks, setTasks] = useState<Task[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budget, setBudget] = useState<number | null>(null)
  const nextId = useRef(1)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('due')
  const [subEventFilter, setSubEventFilter] = useState<string | null>(null)

  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState<Record<number, boolean>>({})

  const [timelineMonth, setTimelineMonth] = useState(todayParsed)
  const [timelineDayFilter, setTimelineDayFilter] = useState<string>('all')

  const [budgetModalOpen, setBudgetModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [expenseModalOpen, setExpenseModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null)
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null)

  const [pickerOpen, setPickerOpen] = useState<'sort' | 'filter' | null>(null)

  const [taskForm, setTaskForm] = useState({ label: '', due: '', subEvent: '', priority: 'med' as Priority, notes: '' })
  const [taskLabelErr, setTaskLabelErr] = useState(false)
  const [budgetForm, setBudgetForm] = useState('')
  const [budgetErr, setBudgetErr] = useState(false)
  const [expForm, setExpForm] = useState({ amount: '', type: 'venue', vendor: '', subEvent: '', date: TODAY, notes: '' })
  const [expAmtErr, setExpAmtErr] = useState(false)

  const isOverdue = useCallback((t: Task) => !t.done && t.due != null && t.due < TODAY, [TODAY])
  const taskStatus = useCallback((t: Task): 'done' | 'overdue' | 'todo' => {
    if (t.done) return 'done'; if (isOverdue(t)) return 'overdue'; return 'todo'
  }, [isOverdue])

  const { visibleTasks, statusCounts, derive } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    const base = tasks.filter(t => {
      if (q && !t.label.toLowerCase().includes(q)) return false
      if (subEventFilter !== null) { return subEventFilter === '' ? t.subEvent == null : t.subEvent === subEventFilter }
      return true
    })
    const sc = { all: base.length, todo: 0, done: 0, overdue: 0 }
    base.forEach(t => { const s = taskStatus(t); if (s === 'done') sc.done++; else if (s === 'overdue') sc.overdue++; else sc.todo++ })

    const filtered = statusFilter === 'all' ? base : base.filter(t => taskStatus(t) === statusFilter)
    const sort = (arr: Task[]) => {
      if (sortKey === 'priority') return [...arr].sort((a, b) => { const pa = PRIO_ORDER[a.priority] ?? 1, pb = PRIO_ORDER[b.priority] ?? 1; return pa !== pb ? pa - pb : a.label.localeCompare(b.label) })
      if (sortKey === 'label') return [...arr].sort((a, b) => a.label.localeCompare(b.label))
      return [...arr].sort((a, b) => {
        const bk = (t: Task) => t.done ? 5 : !t.due ? 4 : t.due < TODAY ? 0 : t.due === TODAY ? 1 : 2
        const ba = bk(a), bb = bk(b); if (ba !== bb) return ba - bb
        if (a.due && b.due && a.due !== b.due) return a.due < b.due ? -1 : 1
        const pa = PRIO_ORDER[a.priority] ?? 1, pb = PRIO_ORDER[b.priority] ?? 1
        return pa !== pb ? pa - pb : a.label.localeCompare(b.label)
      })
    }

    const doneCount = tasks.filter(t => t.done).length
    const totalItems = tasks.length
    const donePct = totalItems === 0 ? 0 : Math.round((doneCount / totalItems) * 100)
    const spent = expenses.reduce((s, e) => s + e.amount, 0)
    const remaining = budget == null ? null : budget - spent
    const overBy = budget != null && spent > budget ? spent - budget : 0
    const typeTotals: Record<string, number> = {}
    expenses.forEach(e => { const id = typeById(e.type).id; typeTotals[id] = (typeTotals[id] || 0) + e.amount })

    return { visibleTasks: sort(filtered), statusCounts: sc, derive: { doneCount, totalItems, donePct, spent, remaining, overBy, isOver: overBy > 0, typeTotals } }
  }, [tasks, expenses, budget, statusFilter, searchQuery, sortKey, subEventFilter, taskStatus, TODAY])

  const selectedIds = Object.keys(selected).map(Number)
  const allDone = derive.totalItems > 0 && derive.doneCount === derive.totalItems

  // Task actions
  function openTaskModal(id: number | null) {
    setEditingTaskId(id)
    if (id) { const t = tasks.find(x => x.id === id); if (t) setTaskForm({ label: t.label, due: t.due || '', subEvent: t.subEvent || '', priority: t.priority, notes: t.notes || '' }) }
    else setTaskForm({ label: '', due: '', subEvent: '', priority: 'med', notes: '' })
    setTaskLabelErr(false); setTaskModalOpen(true)
  }
  function handleTaskSubmit(e: React.FormEvent) {
    e.preventDefault(); const label = taskForm.label.trim()
    if (!label) { setTaskLabelErr(true); return }
    setTaskLabelErr(false)
    if (editingTaskId) { setTasks(p => p.map(t => t.id === editingTaskId ? { ...t, label, due: taskForm.due || null, subEvent: taskForm.subEvent || null, priority: taskForm.priority, notes: taskForm.notes || null } : t)) }
    else { const id = nextId.current++; setTasks(p => [...p, { id, label, done: false, due: taskForm.due || null, subEvent: taskForm.subEvent || null, priority: taskForm.priority, notes: taskForm.notes || null }]) }
    setTaskModalOpen(false); setEditingTaskId(null)
  }
  function toggleTaskDone(id: number, done: boolean) { setTasks(p => p.map(t => t.id === id ? { ...t, done } : t)) }
  function completeTasks(ids: number[]) { setTasks(p => p.map(t => ids.includes(t.id) ? { ...t, done: true } : t)) }

  // Selection
  function enterSelect() { setSelecting(true); setSelected({}) }
  function exitSelect() { setSelecting(false); setSelected({}) }
  function toggleSelect(id: number) { setSelected(p => { const n = { ...p }; if (n[id]) delete n[id]; else n[id] = true; return n }) }

  // Budget
  function openBudgetModal() { setBudgetForm(budget != null ? String(budget) : ''); setBudgetErr(false); setBudgetModalOpen(true) }
  function handleBudgetSubmit(e: React.FormEvent) {
    e.preventDefault(); const amt = parseAmount(budgetForm)
    if (amt == null) { setBudgetErr(true); return }
    setBudgetErr(false); setBudget(amt); setBudgetModalOpen(false)
  }

  // Expense
  function openExpenseModal(id: number | null) {
    setEditingExpenseId(id)
    if (id) { const x = expenses.find(e => e.id === id); if (x) setExpForm({ amount: String(x.amount), type: x.type, vendor: x.vendor || '', subEvent: x.subEvent || '', date: x.date, notes: x.notes || '' }) }
    else setExpForm({ amount: '', type: 'venue', vendor: '', subEvent: '', date: TODAY, notes: '' })
    setExpAmtErr(false); setExpenseModalOpen(true)
  }
  function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault(); const amt = parseAmount(expForm.amount)
    if (amt == null) { setExpAmtErr(true); return }
    setExpAmtErr(false)
    if (editingExpenseId) { setExpenses(p => p.map(x => x.id === editingExpenseId ? { ...x, amount: amt, type: expForm.type, vendor: expForm.vendor || null, subEvent: expForm.subEvent || null, date: expForm.date || TODAY, notes: expForm.notes || null } : x)) }
    else { const id = nextId.current++; setExpenses(p => [...p, { id, amount: amt, type: expForm.type, vendor: expForm.vendor || null, subEvent: expForm.subEvent || null, date: expForm.date || TODAY, notes: expForm.notes || null }]) }
    setExpenseModalOpen(false); setEditingExpenseId(null)
  }

  // Delete
  function openDeleteConfirm(type: 'task' | 'expense' | 'bulk', id?: number, ids?: number[]) {
    setPendingDelete(type === 'bulk' ? { type, ids: ids || [] } : { type, id }); setDeleteModalOpen(true)
  }
  function handleDeleteConfirm() {
    if (!pendingDelete) return
    if (pendingDelete.type === 'task' && pendingDelete.id) setTasks(p => p.filter(t => t.id !== pendingDelete.id))
    else if (pendingDelete.type === 'bulk' && pendingDelete.ids) { const ids = pendingDelete.ids; setTasks(p => p.filter(t => !ids.includes(t.id))); exitSelect() }
    else if (pendingDelete.type === 'expense' && pendingDelete.id) setExpenses(p => p.filter(e => e.id !== pendingDelete.id))
    setPendingDelete(null); setDeleteModalOpen(false)
  }

  function getDeleteText() {
    if (!pendingDelete) return { title: 'Delete?', text: 'This cannot be undone.' }
    if (pendingDelete.type === 'task') { const item = tasks.find(t => t.id === pendingDelete.id); return { title: 'Delete this task?', text: item ? `Remove "${item.label}" from your tasks?` : 'Remove this task?' } }
    if (pendingDelete.type === 'bulk') return { title: `Delete ${pendingDelete.ids?.length} tasks?`, text: 'This cannot be undone.' }
    const exp = expenses.find(e => e.id === pendingDelete.id)
    return { title: 'Delete this expense?', text: exp ? `Remove ${fmtINR(exp.amount)} logged under ${typeById(exp.type).label}?` : 'Remove this expense entry?' }
  }

  // Timeline
  function getTimelineTasks() {
    const q = searchQuery.trim().toLowerCase()
    let filtered = tasks.filter(t => {
      if (q && !t.label.toLowerCase().includes(q)) return false
      if (subEventFilter !== null) return subEventFilter === '' ? t.subEvent == null : t.subEvent === subEventFilter
      return statusFilter === 'all' || taskStatus(t) === statusFilter
    })
    if (timelineDayFilter !== 'all') filtered = filtered.filter(t => t.due === timelineDayFilter)
    return filtered
  }

  function renderDatebarChips() {
    const dim = daysInMonth(timelineMonth.y, timelineMonth.m)
    const chips: React.ReactNode[] = []
    chips.push(<button key="all" type="button" className={`task-day task-day--all${timelineDayFilter === 'all' ? ' is-selected' : ''}`} aria-pressed={timelineDayFilter === 'all'} onClick={() => setTimelineDayFilter('all')}>All</button>)
    chips.push(<button key="today" type="button" className={`task-day task-day--all task-day--today${timelineDayFilter === TODAY ? ' is-selected' : ''}`} aria-pressed={timelineDayFilter === TODAY} aria-label="Today" onClick={() => { setTimelineDayFilter(TODAY); setTimelineMonth(parseISO(TODAY)) }}>Today</button>)
    for (let d = 1; d <= dim; d++) {
      const iso = `${timelineMonth.y}-${pad(timelineMonth.m)}-${pad(d)}`
      chips.push(
        <button key={iso} type="button" className={`task-day${iso === TODAY ? ' is-today' : ''}${timelineDayFilter === iso ? ' is-selected' : ''}`} data-day={iso} aria-pressed={timelineDayFilter === iso} aria-label={relDay(iso, TODAY)} onClick={() => setTimelineDayFilter(iso)}>
          <span className="task-day-num">{d}</span>
          <span>{MONTHS[timelineMonth.m - 1]}</span>
        </button>
      )
    }
    return chips
  }

  function renderAgenda() {
    const filtered = getTimelineTasks()
    if (timelineDayFilter !== 'all' && filtered.length === 0) {
      return <div className="plan-empty"><p className="plan-empty-title">Nothing due on {fmtDate(timelineDayFilter)}.</p></div>
    }
    const groups: Record<string, Task[]> = {}; const order: string[] = []
    filtered.forEach(t => { const k = t.due || '__none__'; if (!groups[k]) { groups[k] = []; order.push(k) } groups[k].push(t) })
    order.sort((a, b) => a === '__none__' ? 1 : b === '__none__' ? -1 : a < b ? -1 : 1)
    return order.map(k => (
      <section key={k} className="task-date-group">
        <h3 className="task-date-group-title">{k === '__none__' ? 'No date' : groupHeading(k, TODAY)}</h3>
        <ul className="plan-agenda-group-list" role="list">
          {groups[k].map(t => <TaskRow key={t.id} task={t} taskStatus={taskStatus} isOverdue={isOverdue} selecting={selecting} selected={selected} TODAY={TODAY} toggleTaskDone={toggleTaskDone} toggleSelect={toggleSelect} openTaskModal={openTaskModal} openDeleteConfirm={openDeleteConfirm} />)}
        </ul>
      </section>
    ))
  }

  const deleteText = getDeleteText()

  return (
    <>
      <header className="section-head reveal">
        <p className="section-head-eyebrow">Section</p>
        <div className="section-head-titlerow">
          <h1 className="section-head-title">Planning</h1>
        </div>
        <p className="section-head-sub">Checklists, budget tracking, and event timeline.</p>
      </header>

      {/* Tab bar */}
      <div className="plan-tabs-wrap seg-wrap reveal">
        <div className="seg seg--fill" role="tablist" aria-label="Planning views">
          <button type="button" role="tab" id="plan-tab-checklist" className={`seg-item${activeTab === 'checklist' ? ' is-active' : ''}`} aria-selected={activeTab === 'checklist'} aria-controls="plan-panel-checklist" tabIndex={activeTab === 'checklist' ? 0 : -1} onClick={() => setActiveTab('checklist')}>
            <span aria-hidden="true" className={`material-symbols-outlined${activeTab === 'checklist' ? ' icon-fill' : ''}`}>checklist</span>
            Checklist
          </button>
          <button type="button" role="tab" id="plan-tab-budget" className={`seg-item${activeTab === 'budget' ? ' is-active' : ''}`} aria-selected={activeTab === 'budget'} aria-controls="plan-panel-budget" tabIndex={activeTab === 'budget' ? 0 : -1} onClick={() => setActiveTab('budget')}>
            <span aria-hidden="true" className={`material-symbols-outlined${activeTab === 'budget' ? ' icon-fill' : ''}`}>account_balance_wallet</span>
            Budget
          </button>
        </div>
      </div>

      {/* ── Checklist panel ── */}
      <section id="plan-panel-checklist" role="tabpanel" aria-labelledby="plan-tab-checklist" className="plan-panel reveal" hidden={activeTab !== 'checklist'}>
        <header className="section-head section-head--compact">
          <p className="section-head-eyebrow">Checklist</p>
          <div className="section-head-titlerow">
            <h2 className="section-head-title">Tasks</h2>
          </div>
        </header>

        <div className={`clay-card plan-tasks-card${taskView === 'timeline' ? ' is-timeline' : ''}${selecting ? ' is-selecting' : ''}`} id="plan-tasks-card">
          {/* Progress */}
          <div className="plan-progress-row">
            <p className="plan-progress-label" id="plan-progress-label">
              {allDone ? 'All done — every task complete 🎉' : derive.totalItems === 0 ? '0 of 0 done · 0%' : `${derive.doneCount} of ${derive.totalItems} done · ${derive.donePct}%`}
            </p>
            <div className="plan-progress-track" aria-hidden="true">
              <span className="plan-progress-fill" id="plan-progress-fill" style={{ width: `${derive.donePct}%` }} />
            </div>
          </div>

          {/* Toolbar */}
          <div className="plan-toolbar">
            <div className="form-input-search plan-search">
              <span className="material-symbols-outlined" aria-hidden="true">search</span>
              <input className="form-input" type="search" id="plan-search-input" placeholder="Search tasks…" aria-label="Search tasks" autoComplete="off" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="form-input-search-clear" type="button" aria-label="Clear search" onClick={() => setSearchQuery('')}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>}
            </div>
            <div className="plan-toolbar-actions">
              <div style={{ position: 'relative' }}>
                <button type="button" className={`btn-pill btn-pill-secondary gm-icon-btn plan-filter-btn${subEventFilter !== null ? ' is-active' : ''}`} id="plan-filter-btn" aria-haspopup="true" aria-expanded={pickerOpen === 'filter'} aria-label="Filter by sub-event" onClick={() => setPickerOpen(p => p === 'filter' ? null : 'filter')}>
                  <span className="material-symbols-outlined" aria-hidden="true">filter_list</span>
                  <span className="gm-btn-label">Filter</span>
                  {subEventFilter !== null && <span className="gm-filter-count" id="plan-filter-count">1</span>}
                </button>
                {pickerOpen === 'filter' && (
                  <>
                    <div className="gm-setter-scrim" onClick={() => setPickerOpen(null)} />
                    <div className="gm-setter" role="dialog" aria-modal="true" aria-label="Filter by sub-event">
                      <p className="gm-setter-title">Sub-event</p>
                      <div className="gm-setter-opts" role="menu">
                        {[{ value: '__all__', label: 'All', icon: 'filter_list' }, { value: '__whole__', label: 'Whole event', icon: 'celebration' }, ...EVENT_SUBEVENTS.map(s => ({ value: s.id, label: s.label, icon: 'event' }))].map(o => {
                          const cur = subEventFilter === null ? '__all__' : subEventFilter === '' ? '__whole__' : subEventFilter
                          return (
                            <button key={o.value} type="button" className="gm-setter-opt" role="menuitemradio" aria-checked={cur === o.value} onClick={() => { if (o.value === '__all__') setSubEventFilter(null); else if (o.value === '__whole__') setSubEventFilter(''); else setSubEventFilter(o.value); setPickerOpen(null) }}>
                              <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>{o.label}
                              <span className="material-symbols-outlined gm-setter-check" aria-hidden="true">check</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn plan-sort-btn" id="plan-sort-btn" aria-haspopup="true" aria-expanded={pickerOpen === 'sort'} aria-label="Sort tasks" onClick={() => setPickerOpen(p => p === 'sort' ? null : 'sort')}>
                  <span className="material-symbols-outlined" aria-hidden="true">swap_vert</span>
                  <span className="gm-btn-label plan-sort-label">{sortKey === 'priority' ? 'Priority' : sortKey === 'label' ? 'A–Z' : 'Due date'}</span>
                </button>
                {pickerOpen === 'sort' && (
                  <>
                    <div className="gm-setter-scrim" onClick={() => setPickerOpen(null)} />
                    <div className="gm-setter" role="dialog" aria-modal="true" aria-label="Sort tasks">
                      <p className="gm-setter-title">Sort by</p>
                      <div className="gm-setter-opts" role="menu">
                        {[{ value: 'due', label: 'Due date', icon: 'event' }, { value: 'priority', label: 'Priority', icon: 'priority_high' }, { value: 'label', label: 'A–Z', icon: 'sort_by_alpha' }].map(o => (
                          <button key={o.value} type="button" className="gm-setter-opt" role="menuitemradio" aria-checked={sortKey === o.value} onClick={() => { setSortKey(o.value as SortKey); setPickerOpen(null) }}>
                            <span className="material-symbols-outlined" aria-hidden="true">{o.icon}</span>{o.label}
                            <span className="material-symbols-outlined gm-setter-check" aria-hidden="true">check</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              <button type="button" className="btn-pill btn-pill-secondary gm-icon-btn" id="plan-select-mode" aria-label="Select tasks" onClick={() => selecting ? exitSelect() : enterSelect()}>
                <span className="material-symbols-outlined" aria-hidden="true">checklist</span>
                <span className="gm-btn-label">Select</span>
              </button>
            </div>
          </div>

          {/* Status chips */}
          <div className="dp-filter-chips plan-status-chips" role="radiogroup" aria-label="Filter by status" id="plan-status-chips">
            {(['all', 'todo', 'done', 'overdue'] as StatusFilter[]).map(s => (
              <button key={s} type="button" className={`dp-filter-chip${statusFilter === s ? ' is-active' : ''}`} role="radio" aria-checked={statusFilter === s} tabIndex={statusFilter === s ? 0 : -1} data-plan-status={s} onClick={() => setStatusFilter(s)}>
                {s === 'all' ? 'All' : s === 'todo' ? 'To-do' : s === 'done' ? 'Done' : 'Overdue'} <span data-plan-chip={s}>{statusCounts[s]}</span>
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div className="seg seg--sm seg--fill plan-view-toggle" role="radiogroup" aria-label="Task view" id="plan-view-toggle">
            <button type="button" role="radio" className={`seg-item${taskView === 'list' ? ' is-active' : ''}`} id="plan-view-list" aria-checked={taskView === 'list'} tabIndex={taskView === 'list' ? 0 : -1} onClick={() => setTaskView('list')}>List</button>
            <button type="button" role="radio" className={`seg-item${taskView === 'timeline' ? ' is-active' : ''}`} id="plan-view-timeline" aria-checked={taskView === 'timeline'} tabIndex={taskView === 'timeline' ? 0 : -1} onClick={() => setTaskView('timeline')}>Timeline</button>
          </div>

          {allDone && (
            <div className="plan-alldone" id="plan-alldone" role="status">
              <span className="material-symbols-outlined" aria-hidden="true">celebration</span>
              <span>All done — every task complete 🎉</span>
            </div>
          )}

          {/* List view */}
          <div className="plan-view-body" id="plan-view-list-body" hidden={taskView !== 'list'}>
            {tasks.length === 0 && <div className="plan-empty" id="plan-tasks-empty"><p className="plan-empty-title">No tasks yet</p><p className="plan-empty-sub">Tap the + button to add your first task.</p></div>}
            {tasks.length > 0 && visibleTasks.length === 0 && <div className="plan-empty" id="plan-filter-empty"><p className="plan-empty-title">No tasks match</p><p className="plan-empty-sub">Try a different search or filter.</p></div>}
            <ul className="plan-task-list" id="plan-task-list" role="list" aria-label="Task list">
              {visibleTasks.map(t => <TaskRow key={t.id} task={t} taskStatus={taskStatus} isOverdue={isOverdue} selecting={selecting} selected={selected} TODAY={TODAY} toggleTaskDone={toggleTaskDone} toggleSelect={toggleSelect} openTaskModal={openTaskModal} openDeleteConfirm={openDeleteConfirm} />)}
            </ul>
          </div>

          {/* Timeline view */}
          <div className="plan-view-body" id="plan-view-timeline-body" hidden={taskView !== 'timeline'}>
            <div className="task-datebar" id="plan-datebar" aria-label="Filter by date">
              <div className="task-datebar-head">
                <button type="button" className="task-datebar-nav" id="plan-date-prev" aria-label="Previous month" onClick={() => setTimelineMonth(p => { let { y, m } = p; m--; if (m < 1) { m = 12; y-- } return { y, m, d: 1 } })}>
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_left</span>
                </button>
                <span className="task-datebar-month" id="plan-datebar-month">{MONTHS_FULL[timelineMonth.m - 1]} {timelineMonth.y}</span>
                <button type="button" className="task-datebar-nav" id="plan-date-next" aria-label="Next month" onClick={() => setTimelineMonth(p => { let { y, m } = p; m++; if (m > 12) { m = 1; y++ } return { y, m, d: 1 } })}>
                  <span className="material-symbols-outlined" aria-hidden="true">chevron_right</span>
                </button>
              </div>
              <div className="task-datebar-chips" id="plan-datebar-chips" role="group" aria-label="Days">
                {renderDatebarChips()}
              </div>
            </div>
            <div className="plan-agenda" id="plan-agenda">{renderAgenda()}</div>
          </div>

          <p className="sr-only" id="plan-task-live" aria-live="polite" />
        </div>
      </section>

      {/* ── Budget panel ── */}
      <section id="plan-panel-budget" role="tabpanel" aria-labelledby="plan-tab-budget" className="plan-panel reveal" hidden={activeTab !== 'budget'}>
        <header className="section-head section-head--compact">
          <p className="section-head-eyebrow">Budget</p>
          <div className="section-head-titlerow">
            <h2 className="section-head-title">Spending tracker</h2>
          </div>
        </header>

        {budget == null ? (
          <div className="empty-cta-card plan-budget-empty" id="plan-budget-unset">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">savings</span></span>
            <p className="empty-cta-title">Set your total budget</p>
            <p className="empty-cta-sub">Set your total budget to start tracking.</p>
            <button type="button" className="btn-pill btn-pill-primary" onClick={openBudgetModal}>
              <span className="material-symbols-outlined" aria-hidden="true">edit</span>
              Set budget
            </button>
          </div>
        ) : (
          <div id="plan-budget-body">
            <div className="plan-stats" role="group" aria-label="Budget summary">
              <div className="stats-strip-card plan-stat-card">
                <span className="stat-icon"><span className="material-symbols-outlined icon-fill">account_balance</span></span>
                <div style={{ minWidth: 0 }}>
                  <p className="plan-stat-label">Total budget</p>
                  <p className="plan-stat-value" id="plan-stat-total">{fmtINR(budget)}</p>
                </div>
                <button type="button" className="plan-icon-btn plan-stat-edit" data-plan-edit-budget aria-label="Edit total budget" onClick={openBudgetModal}>
                  <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                </button>
              </div>
              <div className="stats-strip-card plan-stat-card">
                <span className="stat-icon"><span className="material-symbols-outlined icon-fill">payments</span></span>
                <div style={{ minWidth: 0 }}>
                  <p className="plan-stat-label">Amount spent</p>
                  <p className="plan-stat-value" id="plan-stat-spent">{fmtINR(derive.spent)}</p>
                </div>
              </div>
              <div className="stats-strip-card plan-stat-card">
                <span className="stat-icon"><span className="material-symbols-outlined icon-fill">savings</span></span>
                <div style={{ minWidth: 0 }}>
                  <p className="plan-stat-label">Remaining</p>
                  <p className={`plan-stat-value${derive.remaining != null && derive.remaining < 0 ? ' is-negative' : ''}`} id="plan-stat-remaining">{fmtINR(derive.remaining)}</p>
                </div>
              </div>
            </div>

            {derive.isOver && (
              <div className="plan-over-wrap">
                <span className="status-badge status-badge--over" id="plan-over-badge" role="status">
                  <span className="material-symbols-outlined" aria-hidden="true">warning</span>
                  Over budget by {fmtINR(derive.overBy)}
                </span>
              </div>
            )}

            <div className="clay-card plan-budget-card">
              <div className="plan-cat-section">
                <p className="plan-cat-heading">Spending by type</p>
                <ul className="plan-cat-list" id="plan-cat-list" role="list" aria-label="Spending by category">
                  {EXPENSE_TYPES.filter(t => (derive.typeTotals[t.id] || 0) > 0).sort((a, b) => (derive.typeTotals[b.id] || 0) - (derive.typeTotals[a.id] || 0)).map(t => {
                    const pct = derive.spent === 0 ? 0 : Math.round(((derive.typeTotals[t.id] || 0) / derive.spent) * 100)
                    return (
                      <li key={t.id} className="budget-bar-row">
                        <span className="budget-bar-label">{t.label}</span>
                        <div className="budget-bar-track"><span className="budget-bar-fill" style={{ width: `${pct}%` }} /></div>
                        <span className="budget-bar-meta">{fmtINR(derive.typeTotals[t.id] || 0)} · {pct}%</span>
                      </li>
                    )
                  })}
                </ul>
              </div>
              <div className="plan-exp-section">
                <div className="plan-exp-heading">
                  <h3>Expenses</h3>
                  <button type="button" className="btn-pill btn-pill-secondary" onClick={() => openExpenseModal(null)}>
                    <span className="material-symbols-outlined" aria-hidden="true">add</span>
                    Add expense
                  </button>
                </div>
                <ul className="plan-exp-list" id="plan-exp-list" role="list" aria-label="Expense entries">
                  {expenses.map(exp => {
                    const typ = typeById(exp.type); const vendor = exp.vendor || typ.label
                    return (
                      <li key={exp.id} className="exp-row">
                        <span className="exp-row-icon"><span className="material-symbols-outlined" aria-hidden="true">{typ.icon}</span></span>
                        <div className="exp-row-body"><p className="exp-row-vendor">{vendor}</p><p className="exp-row-cat">{typ.label}{exp.notes ? ` · ${exp.notes}` : ''}</p></div>
                        <span className="exp-row-amt">{fmtINR(exp.amount)}</span>
                        <div className="exp-row-actions">
                          <button type="button" className="plan-icon-btn" aria-label={`Edit ${vendor}`} onClick={() => openExpenseModal(exp.id)}><span className="material-symbols-outlined" aria-hidden="true">edit</span></button>
                          <button type="button" className="plan-icon-btn" aria-label={`Delete ${vendor}`} onClick={() => openDeleteConfirm('expense', exp.id)}><span className="material-symbols-outlined" aria-hidden="true">delete</span></button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
                {expenses.length === 0 && (
                  <div className="empty-cta-card plan-exp-empty" id="plan-exp-empty">
                    <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">receipt_long</span></span>
                    <p className="empty-cta-title">No expenses yet</p>
                    <p className="empty-cta-sub">Log your first vendor payment to see spending by category.</p>
                    <button type="button" className="btn-pill btn-pill-primary" onClick={() => openExpenseModal(null)}>
                      <span className="material-symbols-outlined" aria-hidden="true">add</span>
                      Add expense
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Modals ── */}

      {/* Budget modal */}
      <div className={`modal-scrim${budgetModalOpen ? ' is-open' : ''}`} id="plan-budget-modal" aria-hidden={!budgetModalOpen}>
        <div className="modal-card lg-glass-card" role="dialog" aria-modal="true" aria-labelledby="plan-budget-h">
          <header className="modal-head">
            <div className="modal-head-lead"><h2 className="modal-title" id="plan-budget-h">Set total budget</h2></div>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setBudgetModalOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
          </header>
          <form id="plan-budget-form" noValidate onSubmit={handleBudgetSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-budget-input">Total event budget <span aria-hidden="true" className="text-brand">*</span></label>
              <div className="form-input form-input-group" aria-invalid={budgetErr}>
                <span className="form-input-prefix" aria-hidden="true">₹</span>
                <input id="plan-budget-input" name="budget" type="text" className="form-input-field" inputMode="numeric" autoComplete="off" placeholder="8,00,000" required value={budgetForm} onChange={e => setBudgetForm(e.target.value)} />
              </div>
              {budgetErr && <p className="form-error" id="plan-budget-err" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span> Enter a valid amount greater than zero.</p>}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setBudgetModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-pill btn-pill-primary" id="plan-budget-save">Save budget<span className="btn-pill-spinner" aria-hidden="true" /></button>
            </div>
          </form>
        </div>
      </div>

      {/* Task modal */}
      <div className={`modal-scrim${taskModalOpen ? ' is-open' : ''}`} id="plan-task-modal" aria-hidden={!taskModalOpen}>
        <div className="modal-card lg-glass-card plan-task-modal-card" role="dialog" aria-modal="true" aria-labelledby="plan-task-title">
          <header className="modal-head">
            <div className="modal-head-lead"><h2 className="modal-title" id="plan-task-title">{editingTaskId ? 'Edit task' : 'Add task'}</h2></div>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setTaskModalOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
          </header>
          <form id="plan-task-form" noValidate onSubmit={handleTaskSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-task-label">Task <span aria-hidden="true" className="text-brand">*</span></label>
              <input id="plan-task-label" name="label" type="text" className="form-input" autoComplete="off" placeholder="e.g. Confirm florist" required value={taskForm.label} onChange={e => setTaskForm(f => ({ ...f, label: e.target.value }))} />
              {taskLabelErr && <p className="form-error" id="plan-task-label-err" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span> Enter a task name.</p>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-task-due">Due date <span className="form-label-opt">(optional)</span></label>
              <input id="plan-task-due" name="due" type="date" className="form-input" value={taskForm.due} onChange={e => setTaskForm(f => ({ ...f, due: e.target.value }))} />
            </div>
            <div className="form-group" id="plan-task-subevent-wrap">
              <label className="form-label" htmlFor="plan-task-subevent">Sub-event</label>
              <div className="form-select">
                <select id="plan-task-subevent" name="subEvent" className="form-input" value={taskForm.subEvent} onChange={e => setTaskForm(f => ({ ...f, subEvent: e.target.value }))}>
                  <option value="">Whole event</option>
                  {EVENT_SUBEVENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <span className="form-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
              </div>
            </div>
            <div className="form-group">
              <span className="form-label" id="plan-task-prio-label">Priority</span>
              <div className="task-prio-pills radio-pill-group" role="radiogroup" aria-labelledby="plan-task-prio-label" id="plan-task-prio">
                {(['low', 'med', 'high'] as Priority[]).map(p => (
                  <button key={p} type="button" role="radio" className={`radio-pill${taskForm.priority === p ? ' is-checked' : ''}`} data-prio={p} aria-checked={taskForm.priority === p} tabIndex={taskForm.priority === p ? 0 : -1} onClick={() => setTaskForm(f => ({ ...f, priority: p }))}>
                    {p === 'low' ? 'Low' : p === 'med' ? 'Medium' : 'High'}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="plan-task-notes">Notes <span className="form-label-opt">(optional)</span></label>
              <input id="plan-task-notes" name="notes" type="text" className="form-input" placeholder="Any extra detail…" value={taskForm.notes} onChange={e => setTaskForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setTaskModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-pill btn-pill-primary" id="plan-task-save">{editingTaskId ? 'Save changes' : 'Save task'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* Expense modal */}
      <div className={`modal-scrim plan-expense-scrim${expenseModalOpen ? ' is-open' : ''}`} id="plan-expense-modal" aria-hidden={!expenseModalOpen}>
        <div className="modal-card lg-glass-card plan-expense-modal-card" role="dialog" aria-modal="true" aria-labelledby="plan-exp-title">
          <header className="modal-head">
            <div className="modal-head-lead"><h2 className="modal-title" id="plan-exp-title">{editingExpenseId ? 'Edit expense' : 'Add expense'}</h2></div>
            <button className="modal-close" type="button" aria-label="Close" onClick={() => setExpenseModalOpen(false)}><span className="material-symbols-outlined" aria-hidden="true">close</span></button>
          </header>
          <form id="plan-expense-form" className="plan-expense-form" noValidate onSubmit={handleExpenseSubmit}>
            <div className="plan-modal-block">
              <p className="plan-modal-block-title">Expense</p>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-amount">Amount <span aria-hidden="true" className="text-brand">*</span></label>
                <div className="form-input form-input-group" aria-invalid={expAmtErr}>
                  <span className="form-input-prefix" aria-hidden="true">₹</span>
                  <input id="plan-exp-amount" name="amount" type="text" className="form-input-field" inputMode="numeric" autoComplete="off" placeholder="45,000" required value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                {expAmtErr && <p className="form-error" id="plan-exp-amount-err" role="alert"><span className="material-symbols-outlined" aria-hidden="true">error</span> Enter a valid amount greater than zero.</p>}
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-type">Expense type</label>
                <div className="form-select">
                  <select id="plan-exp-type" name="type" className="form-input" value={expForm.type} onChange={e => setExpForm(f => ({ ...f, type: e.target.value }))}>
                    {EXPENSE_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <span className="form-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-vendor">Vendor name <span className="form-label-opt">(optional)</span></label>
                <input id="plan-exp-vendor" name="vendor" type="text" className="form-input" autoComplete="organization" placeholder="e.g. Tadka Heritage" value={expForm.vendor} onChange={e => setExpForm(f => ({ ...f, vendor: e.target.value }))} />
              </div>
            </div>
            <div className="plan-modal-divider" aria-hidden="true" />
            <div className="plan-modal-block">
              <p className="plan-modal-block-title">Details</p>
              <div className="form-group">
                <span className="form-label">Event</span>
                <span className="expense-event-chip"><span className="material-symbols-outlined" aria-hidden="true">lock</span>{eventName}</span>
              </div>
              <div className="form-group" id="plan-exp-subevent-wrap">
                <label className="form-label" htmlFor="plan-exp-subevent">Sub-event <span className="form-label-opt">(optional)</span></label>
                <div className="form-select">
                  <select id="plan-exp-subevent" name="subEvent" className="form-input" value={expForm.subEvent} onChange={e => setExpForm(f => ({ ...f, subEvent: e.target.value }))}>
                    <option value="">Whole event</option>
                    {EVENT_SUBEVENTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <span className="form-select-chevron material-symbols-outlined" aria-hidden="true">expand_more</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-date">Date</label>
                <input id="plan-exp-date" name="date" type="date" className="form-input" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="plan-exp-notes">Notes <span className="form-label-opt">(optional)</span></label>
                <input id="plan-exp-notes" name="notes" type="text" className="form-input" placeholder="Advance payment, etc." value={expForm.notes} onChange={e => setExpForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <div className="modal-actions plan-expense-footer">
              <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setExpenseModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn-pill btn-pill-primary" id="plan-exp-save">Save expense<span className="btn-pill-spinner" aria-hidden="true" /></button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete confirm */}
      <div className={`modal-scrim${deleteModalOpen ? ' is-open' : ''}`} id="plan-delete-modal" aria-hidden={!deleteModalOpen}>
        <div className="modal-confirm-cautionary modal-card" role="alertdialog" aria-modal="true" aria-labelledby="plan-delete-title">
          <div className="modal-confirm-icon is-cautionary"><span className="material-symbols-outlined" aria-hidden="true">delete</span></div>
          <h3 className="modal-confirm-title" id="plan-delete-title">{deleteText.title}</h3>
          <p className="modal-confirm-text" id="plan-delete-text">{deleteText.text}</p>
          <div className="modal-actions">
            <button type="button" className="btn-pill btn-pill-secondary" onClick={() => setDeleteModalOpen(false)}>Cancel</button>
            <button type="button" className="btn-pill btn-pill-danger" id="plan-delete-confirm" onClick={handleDeleteConfirm}>Delete</button>
          </div>
        </div>
      </div>

      {/* Bulk bar */}
      {selecting && (
        <div className="bulk-bar" id="plan-bulkbar" role="toolbar" aria-label="Bulk task actions">
          <span className="bulk-bar-count"><span id="plan-sel-count">{selectedIds.length}</span> selected</span>
          <button type="button" className="bulk-bar-selectall" data-plan-select-all onClick={() => {
            const vis = visibleTasks.length
            if (selectedIds.length >= vis && vis > 0) { setSelected({}) }
            else { const n: Record<number, boolean> = {}; visibleTasks.forEach(t => { n[t.id] = true }); setSelected(n) }
          }}>{selectedIds.length >= visibleTasks.length && visibleTasks.length > 0 ? 'Clear' : 'Select all'}</button>
          <span className="bulk-bar-div" aria-hidden="true" />
          <button type="button" className="bulk-bar-act" id="plan-bulk-complete" disabled={selectedIds.length === 0} onClick={() => { completeTasks(selectedIds); exitSelect() }}>
            <span className="material-symbols-outlined" aria-hidden="true">check_circle</span><span className="bulk-bar-act-label">Complete</span>
          </button>
          <button type="button" className="bulk-bar-act" id="plan-bulk-delete" disabled={selectedIds.length === 0} onClick={() => openDeleteConfirm('bulk', undefined, selectedIds)}>
            <span className="material-symbols-outlined" aria-hidden="true">delete</span><span className="bulk-bar-act-label">Delete</span>
          </button>
          <button type="button" className="bulk-bar-cancel" id="plan-bulk-cancel" aria-label="Cancel selection" onClick={exitSelect}>
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      {/* Add FAB */}
      {!selecting && (
        <button type="button" className="add-fab" id="plan-add-fab" aria-label={activeTab === 'checklist' ? 'Add task' : 'Add expense'} onClick={() => activeTab === 'checklist' ? openTaskModal(null) : openExpenseModal(null)}>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
        </button>
      )}
    </>
  )
}

// ── TaskRow ──────────────────────────────────────────────────────────────────
interface TaskRowProps {
  task: Task
  taskStatus: (t: Task) => 'done' | 'overdue' | 'todo'
  isOverdue: (t: Task) => boolean
  selecting: boolean
  selected: Record<number, boolean>
  TODAY: string
  toggleTaskDone: (id: number, done: boolean) => void
  toggleSelect: (id: number) => void
  openTaskModal: (id: number | null) => void
  openDeleteConfirm: (type: 'task' | 'expense' | 'bulk', id?: number, ids?: number[]) => void
}

function TaskRow({ task, taskStatus, isOverdue, selecting, selected, TODAY, toggleTaskDone, toggleSelect, openTaskModal, openDeleteConfirm }: TaskRowProps) {
  const st = taskStatus(task)
  const stLabel = st === 'done' ? 'Done' : st === 'overdue' ? 'Overdue' : 'To-do'
  const stIcon = st === 'done' ? 'check_circle' : st === 'overdue' ? 'warning' : 'radio_button_unchecked'

  function handleSurfaceClick(e: React.MouseEvent) {
    if (selecting) { toggleSelect(task.id); return }
    const target = e.target as Element
    if (target.closest('.task-row-check') || target.closest('.task-status-badge') || target.closest('.task-row-rail')) return
    openTaskModal(task.id)
  }

  return (
    <li className={`task-row${selecting && selected[task.id] ? ' is-selected' : ''}${isOverdue(task) ? ' is-overdue' : ''}`} data-id={String(task.id)}>
      <div className="task-row-surface" onClick={handleSurfaceClick}>
        {!selecting && (
          <label className="task-row-check" htmlFor={`plan-task-chk-${task.id}`} onClick={e => e.stopPropagation()}>
            <input type="checkbox" id={`plan-task-chk-${task.id}`} checked={task.done} onChange={e => toggleTaskDone(task.id, e.target.checked)} />
          </label>
        )}
        <div className="task-row-body">
          <span className="task-row-title" style={task.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined}>{task.label}</span>
          <div className="task-row-meta">
            <span className="task-due-chip">
              <span className="material-symbols-outlined" aria-hidden="true">event</span>
              {relDay(task.due, TODAY)}
            </span>
            <span className="task-sub-chip" aria-label={`Sub-event: ${subEventLabel(task.subEvent)}`}>
              <span className="material-symbols-outlined" aria-hidden="true">celebration</span>
              {subEventLabel(task.subEvent)}
            </span>
            {(task.priority === 'high' || task.priority === 'low') && (
              <span className={`task-prio task-prio--${task.priority}`} aria-label={`Priority: ${task.priority === 'high' ? 'High' : 'Low'}`}>
                <span className="task-prio-dot" aria-hidden="true" />
                <span className="task-prio-label">{task.priority === 'high' ? 'High' : 'Low'}</span>
              </span>
            )}
          </div>
        </div>
        {!selecting ? (
          <span className={`task-status-badge status-badge task-status-badge--${st}`} aria-label={`Status: ${stLabel}`}>
            <span className="material-symbols-outlined" aria-hidden="true">{stIcon}</span>
            {stLabel}
          </span>
        ) : (
          <button type="button" className="task-row-bulk" role="checkbox" aria-checked={!!selected[task.id]} aria-label={`Select ${task.label}`} onClick={e => { e.stopPropagation(); toggleSelect(task.id) }}>
            <span className="material-symbols-outlined" aria-hidden="true">{selected[task.id] ? 'check_box' : 'check_box_outline_blank'}</span>
          </button>
        )}
      </div>
      {!selecting && (
        <div className="task-row-rail" aria-hidden="true">
          <button type="button" className="tr-swipe tr-swipe-done" tabIndex={-1} onClick={e => { e.stopPropagation(); toggleTaskDone(task.id, true) }}>
            <span className="material-symbols-outlined">check_circle</span><span>Complete</span>
          </button>
          <button type="button" className="tr-swipe tr-swipe-edit" tabIndex={-1} onClick={e => { e.stopPropagation(); openTaskModal(task.id) }}>
            <span className="material-symbols-outlined">edit</span><span>Edit</span>
          </button>
          <button type="button" className="tr-swipe tr-swipe-delete" tabIndex={-1} onClick={e => { e.stopPropagation(); openDeleteConfirm('task', task.id) }}>
            <span className="material-symbols-outlined">delete</span><span>Delete</span>
          </button>
        </div>
      )}
    </li>
  )
}
