# Planning — page record

**Status:** DONE (SPEC_VERSION 2026-06-06.2). Host-only. Two tabs: **Checklist (Tasks)** + **Budget**.

## What's built
- **Pill section tabs** (Checklist · Budget) — shell `.pill-tabs` (true tablist).
- **Tasks tab:** List⇄Timeline toggle (full-width); whole-event progress bar; **toolbar** (search · status chips All/To-do/Done/Overdue with state-colored counts · Sort Due/Priority/A–Z · sub-event Filter · Select); task rows = guest-style cards (due chip · sub-event chip · high-priority dot · To-do/Done/Overdue status badge · overdue red chip); **swipe rail** (Complete/Edit/Delete, semantic tokens + icons, CSS scroll-snap); **FAB add + tap-row-to-edit**; **bulk bar** (Complete/Set-date/Assign/Delete + Select-all, popovers flip up); **Complete→toast+Undo**; **Timeline** date bar (month pager + All/Today chips, filters agenda).
- **Budget tab:** Total/Spent/Remaining strip; breakdown by **Expense type** (custom via "+ Add type"); add/edit-expense modal (Amount · Expense type · Vendor · event tag + sub-event · receipt **stub** · date) — uses the **custom Evenzi calendar**, not native.
- Add-task modal: Task · Due date · Sub-event · Priority pills · Notes.

## Key decisions / data model
- `tasks[{id,label,done,due,subEvent,priority,notes}]`; `EVENT_SUBEVENTS=[{id,label}]` (matches guests, `mehendi`); `EXPENSE_TYPES=[{id,label,icon,custom}]` (canonical source = Event Settings, prototype-local); `expenses[{id,amount,type,vendor,subEvent,receipt,date,notes}]`.
- Single `TODAY='2026-06-04'` constant; **no `new Date()` in render**; ISO-string compare.
- Default List sort: overdue→today→upcoming→undated, priority tiebreak.
- `null` sub-event = "Whole event" (one meaning everywhere).
- Reviewed by design council ×2 (tasks rework + expense delta) + a build→test→review loop.

## Deferred / fast-follow
- Build receipt storage (currently UI stub); wire `EXPENSE_TYPES` to real Event Settings.
- Group budget breakdown by sub-event (data captured, not surfaced).
- Reminders/notifications; full sub-event filter axis for tasks.
- Manual: on-device crore-scale ₹ fit at 360px (founder phone).
