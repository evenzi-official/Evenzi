# Planning Tools — Backend-Wiring Design

> Design spec for wiring the already-built Planning Tools frontend to its already-live data model. Companion to [`docs/superpowers/specs/2026-06-14-planning-data-model-design.md`](2026-06-14-planning-data-model-design.md) (the approved data-model spec — tables/catalogs/views/RPCs/RLS, all live) and [`docs/data-model/FE-INTEGRATION.md`](../../data-model/FE-INTEGRATION.md) §4 (query/upsert recipes). This spec does not change the schema — it defines how the existing frontend and existing backend meet.

| | |
|---|---|
| **Date** | 2026-07-30 |
| **Author** | Abhijith (+ Claude) |
| **Status** | Design — pending user review before plan |
| **Prototype/FE** | `app/events/[id]/planning/PlanningClient.tsx` (833 lines, built, currently zero persistence) |
| **Backend** | 100% live — verified directly against Supabase `smjkbmkxweevqpvygabe` 2026-07-30 (204 seeded tasks, 17 budgets, 170 expense-type rows, all 3 views, all 3 RPCs, RLS enabled) |

---

## 1. Why this is a wiring pass, not a build

A repo audit on 2026-07-30 found `PlanningClient.tsx` is a complete, well-built UI (checklist + budget tabs, timeline view, bulk actions, modals) that holds all data in React state only — zero `fetch`/Supabase calls anywhere in the file. Meanwhile the data-model spec from 2026-06-14 was fully implemented: all tables, catalogs (with seed data), derived views, and RPCs are live. The gap is purely the connective layer: API routes + swapping client state for real persistence.

## 2. Field-mapping gap

The FE was built against the design prototype's naming, which differs from the finalized DB schema in two ways: field names, and how "categorical" fields are represented.

| FE (`Task`) | DB (`event_tasks`) | Note |
|---|---|---|
| `id: number` | `id: uuid` | FE currently client-generates sequential numeric ids via a `useRef` counter — must become UUIDs from the DB |
| `label` | `title` | rename on read/write |
| `done: boolean` | `status_id` (FK) | derived: `true` iff the resolved `task_statuses.category === 'done'`. Never stored as a boolean. |
| `subEvent: 'haldi'` (hardcoded slug from a static 5-item array) | `sub_event_id: uuid` | must resolve to the event's **real** `event_sub_events` rows, not a fixed list — sub-events vary per event (set during the creation wizard) |
| `priority: 'high'\|'med'\|'low'` | `priority_id: uuid` | resolve via the cached `config.task_priorities` catalog (3 rows: low/med/high — slugs match, so FE keeps using the slug for radio-button state, just resolves slug→id at write and id→slug at read) |
| `notes` | `description` | rename on read/write |

| FE (`Expense`) | DB (`event_expenses`) | Note |
|---|---|---|
| `id: number` | `id: uuid` | same as tasks |
| `amount` | `amount` | unchanged |
| `type: 'venue'\|'catering'\|...` (hardcoded 8-item array) | `expense_type_id: uuid` | **must resolve against the per-event `event_expense_types` table** (170 rows live, 10 per event, seeded from `config.expense_types` at event creation) — not the raw `config.expense_types` catalog, which is what expenses actually FK to. Live catalog has 10 types (adds `videography`/`entertainment`, renames `catering`→`food`, `misc`→`other`) vs FE's stale hardcoded 8. |
| `vendor` | `vendor_name` | rename |
| `subEvent` | `sub_event_id: uuid` | same real-data fix as tasks |
| `date` | `expense_date` | rename |
| `notes` | `description` | rename (DB also has a separate `title` column — left unused/null; FE has no separate title field, `vendor_name` + `description` cover the current UI) |

## 3. Read path (server component, no GET API route)

Same convention as `app/events/[id]/guests/page.tsx` — one `Promise.all` in the server component, typed props into the client, no client-side initial fetch:

- `event_tasks` — all columns, ordered by `created_at`
- `event_budget_summary` view — may return 0 rows if the host hasn't set a budget yet (budget stays `null` in FE, same empty-state UI as today)
- `event_expenses` — all columns, ordered by `expense_date desc`
- `event_expense_breakdown` view — feeds the "spending by type" bars (replaces FE's client-computed `typeTotals`, though keeping the client computation as a fallback/cross-check is fine)
- `config.task_priorities`, `config.task_statuses` — cached catalogs, mapped by id
- `event_expense_types` (per-event, not `config.expense_types`) — dropdown source for the expense modal
- `event_sub_events` + name resolution via `config.event_sub_types` — same two-step join pattern guests already uses (cross-schema embeds aren't available, so type names are resolved in a second query and merged in JS)

## 4. Write path — new API routes

Following the Guest Management precedent exactly (`app/api/events/[id]/guests/*`): auth check → `uuidSchema.safeParse` on the event id → zod body validation → server Supabase client → typed JSON response, errors as `{ error, details? }` with appropriate status codes.

New files under `app/api/events/[id]/planning/`:

| Route | Method | Purpose |
|---|---|---|
| `tasks/route.ts` | `POST` | create task |
| `tasks/[taskId]/route.ts` | `PATCH` / `DELETE` | update (incl. done-toggle) / delete a task |
| `tasks/bulk/route.ts` | `POST` | bulk complete (calls the existing `bulk_set_task_status` RPC) or bulk delete |
| `budget/route.ts` | `PUT` | upsert `event_budgets` (`onConflict: 'event_id'`) |
| `expenses/route.ts` | `POST` | create expense |
| `expenses/[expenseId]/route.ts` | `PATCH` / `DELETE` | update / delete an expense |

New `lib/validations/planning.ts` — zod schemas mirroring `lib/validations/guests.ts`'s shape (`createTaskSchema`, `updateTaskSchema`, `bulkTaskActionSchema` as a discriminated union, `upsertBudgetSchema`, `createExpenseSchema`, `updateExpenseSchema`).

## 5. FE integration pattern

Matches `GuestManagementClient.tsx` exactly: `useState(initialTasks)` / `useState(initialExpenses)` / `useState(initialBudget)` seeded from server props. Every mutation calls its API route, then on success patches local state from the response (no `router.refresh()`, no re-fetch, no polling) — same as every other wired feature in this app.

The static `EXPENSE_TYPES` and `EVENT_SUBEVENTS` arrays in `PlanningClient.tsx` are replaced by props-driven data (`event_expense_types`, resolved `event_sub_events`). Icon lookup for custom/unrecognized types falls back to a small default icon, same pattern as the `ICON_MAP` fallback already used in `app/events/[id]/page.tsx`.

Toolbar counts (`all`/`todo`/`done`/`overdue`) can stay client-computed from the loaded task list (current behavior) — the `event_task_counts` RPC exists but re-deriving from an already-loaded list is equally correct and avoids an extra round-trip on every filter change. Not using the RPC here is a deliberate simplification, not a gap.

## 6. Explicitly out of scope (inherited from the approved data-model spec, not new deferrals)

- **Assignee UI** — `event_task_assignees` table is live but intentionally has no FE this pass (Tech-Lead call in the original spec, §12).
- **Receipt upload** — `receipt_key` column exists on `event_expenses`; R2 upload/signed-URL serving is a separate backend follow-up (same status as Media & Memories' upload gap).
- **Sub-event budget breakdown** — `event_expenses.sub_event_id` is captured but not surfaced in the UI; not part of this pass.

## 7. Testing

Live browser test at the standard breakpoint set (360/390/414/768/1024/1440) after the build, per the pattern that caught real defects on Guest Mgmt and User Settings that clean type-checks missed. Specific things to verify beyond "does it save": budget upsert on first-ever set (no pre-existing row), bulk-complete via the RPC path, expense-type dropdown showing all 10 live types (not the stale 8), sub-event dropdown showing the actual event's sub-events (not a fixed list).
