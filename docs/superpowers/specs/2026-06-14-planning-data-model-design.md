# Evenzi — Planning Module Data Model (Design Spec)

> Design spec for the **Planning** module's database layer (Checklist + Budget). Companion to the canonical [`docs/data-model/DATA-MODEL.md`](../../data-model/DATA-MODEL.md). This spec is the agreed design; the runnable migrations + the DATA-MODEL.md update land in the build PR (same PR — "DB + doc change together").

| | |
|---|---|
| **Date** | 2026-06-14 |
| **Author** | Abhijith (+ Claude, council-reviewed) |
| **Module** | Planning (Checklist / Tasks + Budget) |
| **Status** | Design approved — pending spec review → plan → build |
| **Reviewed by** | Data-Modeller, Backend, Security, Tech-Lead agents (parallel council, 2026-06-14) |
| **Builds on** | CORE slice (migrations `core_01`–`core_07`); extends `public.event_tasks` + `config.event_checklists` |
| **Prototype** | `designs/pages/planning/` (SPEC_VERSION 2026-06-06.2, DONE) |

---

## 1. Goal

Give the Planning page a real backend. Two tabs, two concerns:

- **Checklist (Tasks):** per-event tasks with a 4-state lifecycle, priority, due date, optional sub-event, optional assignees. Progress bar ("12 of 18 / 68%") and Overdue are **derived**, never stored.
- **Budget:** one total per event; expense line-items grouped by expense type; Total / Spent / Remaining / Over derived from the line-items.

Everything follows the established CORE conventions (plural snake_case, `config`/`public`/`auth` schema split, FK only to core/config, derived-never-stored, owner-only RLS today → `can_access_event()` later).

---

## 2. What already exists (and changes)

| Object | State | Change in this spec |
|---|---|---|
| `public.event_tasks` | live, 0 rows, `[NOW · name TBD]` | **extend** (+`sub_event_id`,`priority_id`,`status_id`,`due_date`; **drop `is_done`**); finalize name → `[NOW]`, no rename |
| `config.event_checklists` | live, 12 rows, `[NOW · name TBD]` | **extend** (+`default_priority_slug` as the seed source); finalize name → `[NOW]`, no rename |
| `public.event_sub_events` | live | referenced (task/expense `sub_event_id`) — no change |
| `public.events`, `auth.users` | live | referenced — no change |
| `create_event_with_details` RPC | `[PLANNED]` | **must change** — seed tasks now require `status_id`/`priority_id`; also seed `event_expense_types` |

**Naming resolution:** keep `config.event_checklists` (templates) + `public.event_tasks` (instances). The page is literally "Checklist (Tasks)". Both `[name TBD]` tags finalize to `[NOW]`. No rename. *(Tech-Lead arbiter call.)*

---

## 3. Decision log additions (D21–D26)

To append to DATA-MODEL.md's decision log (newest first):

| # | Decision | Why |
|---|---|---|
| **D26** | **Planning ships owner-only *inlined* RLS** in its creating migrations — the same `EXISTS(events.user_id = (select auth.uid()))` predicate the 4 live CORE child tables use — **not** `can_access_event()`. All event-children (old + new) convert to `can_access_event()` together in the later collaborator pass. | `can_access_event()` is still `[PLANNED]`/not live; referencing it fails or forks the access model into two predicates for one job (the `.nav-tabs`/`.pill-tab` defect class). Verified against live `pg_policies`. |
| **D25** | **Expense types = catalog → per-event copy.** `config.expense_types` (admin-CRUD, **deletable** — nothing hard-FKs it) seeds `public.event_expense_types` per event (`is_custom` flag, `source_slug` text provenance, **not** an FK); `public.event_expenses.expense_type_id` single-FKs the per-event table. | Template→instance (D5) avoids a polymorphic FK and lets the breakdown be one clean `group by`. Per-event editing is owned by Event Settings; admin manages the catalog defaults. A hard FK on `source_slug` would block admins retiring a catalog type. |
| **D24** | **Budget = `event_budgets` 1:1 (`event_id` PK), `total_amount` only.** Spent / Remaining / Over are **derived** via `security_invoker` views, never stored. | Storing aggregates drifts and needs a recompute trigger on every expense write (D5/D7). 1:1 via FK-as-PK matches `user_preferences` (D8). |
| **D23** | **Per-task assignees = `event_task_assignees`** join to `auth.users` (assignee must be **owner or active collaborator**), **no** denormalized contact, carries a trigger-guarded `event_id` for single-hop RLS. | Reuse existing identity (D3); modularity rule 7 forbids FK to another module's `event_collaborators`, and the owner isn't a collaborator row (D16). `event_id` keeps RLS consistent + fast across all event-children. |
| **D22** | **Task priority = `config.task_priorities`** catalog (low/med/high); `event_tasks.priority_id` NOT NULL, resolved **by slug** at write. `config.event_checklists` gains `default_priority_slug` as the copy source. | Founder wants priority with icon/label/admin control; templates need a priority to seed; slug-resolution (like `role_slug`, D3) survives a catalog re-seed. |
| **D21** | **Task lifecycle = `config.task_statuses`** 4-state catalog (pending/in_progress/completed/cancelled) **replacing `event_tasks.is_done`**. A `category` column (`open`/`done`/`dropped`) drives derived progress (`done`) and overdue (`open` only). | Richer lifecycle (founder); a catalog gives icon/order/admin-tuning; `category` distinguishes **cancelled** from done so Overdue excludes both — an instance `is_done` boolean would be the exact drift D7 forbids. |

---

## 4. Tables (DDL)

### 4.1 New catalogs (`config.*`) — admin-seeded, public-read

```sql
-- Task priority catalog
create table config.task_priorities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                       -- low | med | high
  name text not null, description text, icon_name text,
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Task status catalog (4-state lifecycle)
create table config.task_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                        -- pending | in_progress | completed | cancelled
  name text not null, description text, icon_name text,
  category text not null check (category in ('open','done','dropped')),  -- drives derived progress/overdue
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Expense type catalog (admin CRUD incl. delete; seeds per-event copies)
create table config.expense_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null, description text, icon_name text,
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### 4.2 Extend `public.event_tasks` + `config.event_checklists`

```sql
-- Seed source for task priority
alter table config.event_checklists
  add column default_priority_slug text references config.task_priorities(slug) on update cascade;
-- backfill the 12 existing rows to 'med' (templates carry no priority today)
update config.event_checklists set default_priority_slug = 'med' where default_priority_slug is null;

-- Extend instances. Table is empty (0 rows) → NOT NULL adds are safe; the seed RPC must supply both.
alter table public.event_tasks
  add column sub_event_id uuid references public.event_sub_events(id) on delete set null,  -- null = "Whole event"
  add column priority_id  uuid references config.task_priorities(id)  on delete restrict,
  add column status_id    uuid references config.task_statuses(id)    on delete restrict,
  add column due_date     date;                                                            -- null = undated
-- (If the table ever held data: add nullable → backfill defaults by slug → set NOT NULL.)
alter table public.event_tasks
  alter column priority_id set not null,
  alter column status_id   set not null;
alter table public.event_tasks drop column is_done;     -- replaced by status.category = 'done'

create index idx_event_tasks_status   on public.event_tasks(event_id, status_id);
create index idx_event_tasks_subevent on public.event_tasks(event_id, sub_event_id);
create index idx_event_tasks_due_open on public.event_tasks(event_id, due_date) where due_date is not null;
-- bare (event_id) dropped — it's a prefix of the composites above.
```

> **Derived, never stored:** Overdue = `due_date < current_date AND s.category = 'open'`; Progress "12/18" = `count(*) filter (where s.category = 'done')`.

### 4.3 `public.event_task_assignees` (new — pure join)

```sql
create table public.event_task_assignees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,        -- trigger-guarded == task's event_id (single-hop RLS)
  task_id  uuid not null references public.event_tasks(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,           -- owner OR active collaborator (trigger-checked)
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),                                -- = assigned-at; no updated_at (insert/delete only)
  unique (task_id, user_id)
);
create index idx_task_assignees_task on public.event_task_assignees(task_id);
create index idx_task_assignees_user on public.event_task_assignees(user_id);
```

Name / avatar / role come from a **join** (`event_collaborators` → `user_profiles`), never copied here. Email/phone are never exposed in assignee payloads.

### 4.4 `public.event_budgets` (new — 1:1, total only)

```sql
create table public.event_budgets (
  event_id uuid primary key references public.events(id) on delete cascade,     -- 1:1
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'INR' check (currency in ('INR')),
  modified_by uuid references auth.users(id) on delete set null,                -- last editor (audit)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

First "Set budget" is an **upsert** (`on conflict (event_id)`); the row may not pre-exist. Spent/Remaining/Over are derived (view §6).

### 4.5 `public.event_expense_types` (new — per-event, catalog-seeded)

```sql
create table public.event_expense_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, icon_name text,
  is_custom boolean not null default false,                                     -- default-vs-custom, no 2nd table
  source_slug text,                                                             -- provenance → config.expense_types.slug; NOT an FK; null for custom
  enabled boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, lower(name))                                               -- no dup type names per event (idempotent seed)
);
create index idx_event_expense_types_event on public.event_expense_types(event_id);
```

Seeded from `config.expense_types` **inside `create_event_with_details`** (atomic, no lazy-seed race). Host "+ Add type" → `is_custom = true`.

### 4.6 `public.event_expenses` (new — line items)

```sql
create table public.event_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,        -- also reaches the 1:1 budget
  sub_event_id uuid references public.event_sub_events(id) on delete set null,  -- null = whole event
  expense_type_id uuid not null references public.event_expense_types(id) on delete restrict,
  title text, description text,
  vendor_name text,                                                            -- prototype captures Vendor (free text; real vendor_id is post-MVP)
  amount numeric(14,2) not null check (amount >= 0),
  receipt_key text,                                                            -- R2 OBJECT KEY (not a public URL); private bucket + signed URL
  expense_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_expenses_event_type on public.event_expenses(event_id, expense_type_id);  -- breakdown group-by
create index idx_event_expenses_subevent    on public.event_expenses(event_id, sub_event_id);     -- deferred sub-event breakdown
```

---

## 5. Seeds

```sql
-- config.task_priorities
insert into config.task_priorities (slug, name, icon_name, display_order) values
  ('low','Low','keyboard_arrow_down',1), ('med','Medium','drag_handle',2), ('high','High','priority_high',3);

-- config.task_statuses  (category drives derived progress/overdue)
insert into config.task_statuses (slug, name, category, icon_name, display_order) values
  ('pending','Pending','open','radio_button_unchecked',1),
  ('in_progress','In Progress','open','pending',2),
  ('completed','Completed','done','check_circle',3),
  ('cancelled','Cancelled','dropped','cancel',4);

-- config.expense_types  (merged superset starter; admin manages/adds/deletes via Admin panel)
insert into config.expense_types (slug, name, icon_name, display_order) values
  ('venue','Venue','location_city',1),
  ('food','Food / Catering','restaurant',2),
  ('decoration','Decoration','local_florist',3),
  ('photography','Photography','photo_camera',4),
  ('videography','Videography','videocam',5),
  ('attire','Attire','checkroom',6),
  ('music','Music / DJ','music_note',7),
  ('entertainment','Entertainment','celebration',8),
  ('invitations','Invitations','mail',9),
  ('other','Other','more_horiz',10);
```

> Expense types are **not a priority list** — they are admin-managed reference data (Admin panel: add / edit / disable / delete). The seed is just a sensible starting set.

---

## 6. Derived read views (all `security_invoker = on`)

> ⚠️ **Footgun:** a plain `public` view runs as its owner and **bypasses RLS**. Every view below MUST set `security_invoker = on` so the underlying-table RLS applies to the caller.

```sql
-- Total / Spent / Remaining per event
create view public.event_budget_summary as
select b.event_id, b.total_amount,
       coalesce(sum(e.amount),0)                 as spent,
       b.total_amount - coalesce(sum(e.amount),0) as remaining,
       b.currency
from public.event_budgets b
left join public.event_expenses e on e.event_id = b.event_id
group by b.event_id, b.total_amount, b.currency;
alter view public.event_budget_summary set (security_invoker = on);

-- Spent + item count per expense type per event (the Budget breakdown)
create view public.event_expense_breakdown as
select e.event_id, e.expense_type_id, t.name, t.icon_name,
       sum(e.amount) as spent, count(*) as item_count
from public.event_expenses e
join public.event_expense_types t on t.id = e.expense_type_id
group by e.event_id, e.expense_type_id, t.name, t.icon_name;
alter view public.event_expense_breakdown set (security_invoker = on);

-- Task progress "done / total / percent" (replaces the old is_done count)
create view public.event_task_progress as
select t.event_id,
       count(*) filter (where s.category = 'done') as done,
       count(*)                                    as total,
       round(100.0 * count(*) filter (where s.category = 'done') / nullif(count(*),0)) as percent
from public.event_tasks t
join config.task_statuses s on s.id = t.status_id
group by t.event_id;
alter view public.event_task_progress set (security_invoker = on);
```

---

## 7. Functions / RPCs

| Function | Status | Purpose |
|---|---|---|
| `public.set_updated_at()` | live | attach to all new tables w/ `updated_at` (catalogs, `event_budgets`, `event_expense_types`, `event_expenses`). **Not** on `event_task_assignees` (no `updated_at`). |
| `public.event_task_counts(p_event_id uuid)` | **this pass** | one grouped scan → `total / todo / done / overdue` for the toolbar chips (Overdue is derived, not a status). `security invoker`. |
| `public.create_event_with_details(...)` | **change** (was `[PLANNED]`) | now seeds `event_tasks` with `status_id`(pending)+`priority_id`(from `default_priority_slug`) resolved **by slug**, and seeds `event_expense_types` from `config.expense_types` — same transaction. |
| `public.bulk_set_task_status(p_task_ids uuid[], p_status_slug text)` | optional this pass | bulk-complete/reopen from the bulk bar. `security invoker`. |
| status-history log | `[PLANNED]` | `event_task_status_events` — built when an activity feed lands (latest-only for now). |

```sql
create or replace function public.event_task_counts(p_event_id uuid)
returns table(total int, todo int, done int, overdue int)
language sql stable security invoker set search_path = '' as $$
  select count(*)::int,
         count(*) filter (where s.category = 'open')::int,
         count(*) filter (where s.category = 'done')::int,
         count(*) filter (where s.category = 'open' and t.due_date < current_date)::int
  from public.event_tasks t
  join config.task_statuses s on s.id = t.status_id
  where t.event_id = p_event_id;
$$;
```

> Any `security definer` planning RPC built later MUST `set search_path = ''`, fully-qualify names, `revoke execute from public/anon`, and **re-check `can_access_event(p_event_id)` internally** (definer rights bypass RLS).

---

## 8. Triggers

| Trigger | On | When | Does |
|---|---|---|---|
| `trg_<table>_updated` | each new table w/ `updated_at` | before update | `set_updated_at()` |
| `trg_task_assignee_event_guard` | `event_task_assignees` | before insert/update | set/verify `event_id` = the task's `event_id` (reject mismatch — prevents a forged `event_id` desyncing RLS) |
| `trg_task_assignee_access_guard` | `event_task_assignees` | before insert/update | reject unless `user_id` is the event **owner** or an **active collaborator** (the invariant the FK can't express) |
| attribution defaults | `event_expenses` / `event_budgets` / `event_task_assignees` | before insert | set `created_by` / `modified_by` / `assigned_by` = `auth.uid()` server-side (never trust the client) |

---

## 9. Security (RLS) — owner-only, inlined (D26)

Enable RLS on **all** new `public.*` tables in their creating migration. Use the live inlined predicate; convert to `can_access_event()` with the other event-children later.

```sql
-- event-child pattern (event_budgets shown; expense_types / expenses identical on their event_id)
alter table public.event_budgets enable row level security;
create policy event_budgets_owner on public.event_budgets for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())));

-- event_task_assignees uses its OWN event_id column (single-hop, thanks to the guard trigger)
alter table public.event_task_assignees enable row level security;
create policy event_task_assignees_owner on public.event_task_assignees for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_task_assignees.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_task_assignees.event_id and e.user_id = (select auth.uid())));
```

**Catalogs** (`config.task_priorities`, `config.task_statuses`, `config.expense_types`) — mirror the live `config.*` pattern **exactly**: RLS on, one `SELECT` policy `using (true)` for `{anon, authenticated}`, **no** write policy (admin writes via `service_role`). Plus `grant usage`/`grant select` and keep `config` in *Exposed Schemas*.

**PII / financial notes:**
- Assignee names/avatars for co-hosts come via a **restricted same-event view or `security definer` RPC** that returns `display_name`/`avatar_url` only — never widen `user_profiles` RLS, never return email/phone.
- `receipt_key` → R2 object is **private**; serve via short-lived signed URLs minted by a server route that first checks event access. Add the expense-receipt prefix to `delete_user_account`'s storage purge. (Document in `docs/R2-STORAGE-GUIDE.md`.)

---

## 10. Migration order (build PR)

| # | Migration | Contents |
|---|---|---|
| `planning_01` | catalogs + seeds | `config.task_priorities`, `config.task_statuses`, `config.expense_types` + seeds + `set_updated_at` triggers + RLS (select-only) + grants |
| `planning_02` | extend instances | `config.event_checklists.default_priority_slug` (+backfill); extend `event_tasks` (+4 cols, NOT NULL, **drop `is_done`**, indexes) |
| `planning_03` | new live tables | `event_task_assignees`, `event_budgets`, `event_expense_types`, `event_expenses` + `updated_at` triggers + guard/attribution triggers |
| `planning_04` | views | 3 `security_invoker` views |
| `planning_05` | RLS | owner-only inlined policies on the 4 new live tables |
| `planning_06` | functions | `event_task_counts`; **update `create_event_with_details`** (seed status/priority + expense types); optional `bulk_set_task_status` |

After build: `npx supabase gen types` → refresh `lib/supabase/database.types.ts`; run `get_advisors` (security + performance) clean.

---

## 11. FE-INTEGRATION.md impact (old → new)

- **Task progress** no longer counts `is_done`; query `public.event_task_progress` (or `count filter (where status.category='done')`). Old recipe row updated.
- **Task insert** now requires `status_id` + `priority_id` (resolve by slug; cache the 3 catalogs client-side, map by id — same pattern as other `config.*`).
- **Budget set** = `upsert` on `event_budgets` (`onConflict: 'event_id'`).
- **Toolbar counts** = `rpc('event_task_counts', { p_event_id })`, not 4 round-trips.
- **Catalogs** (`task_priorities`, `task_statuses`, `expense_types`) cached like `event_types` — and `config` must stay in Exposed Schemas.

---

## 12. Deferred / out of scope

- **Status transition history** (`event_task_status_events`) — latest-only now; add with an activity feed.
- **Assignee FE wiring** — table built now (avoids a future live-table migration); no UI this pass ("wired but no FE" is intentional — Tech-Lead call).
- **`can_access_event()` cutover** — all event-children (old + new) convert together in the collaborator-RLS pass.
- **Receipt upload** — `receipt_key` column exists; R2 upload/signed-URL serving is a backend follow-up (currently a UI stub).
- **Sub-event budget breakdown** — data captured (`event_expenses.sub_event_id`); not surfaced yet.
- **Real `vendor_id` FK** — `vendor_name` free text for MVP; the vendor role is a separate scope.
- **CI check for modularity rule 7** (cross-module FK guard) — flagged by Tech-Lead; nice-to-have fast-follow.

---

## 13. DATA-MODEL.md update checklist (same PR as the migrations)

1. Add the 6 new/changed tables (DDL + Notes + Rationale); finalize both `[name TBD]` → `[NOW]`.
2. Add Functions (`event_task_counts`, updated `create_event_with_details`) + Triggers (assignee guards, attribution).
3. Add the 3 views to a new "Views (derived)" subsection; note the `security_invoker` footgun.
4. Extend the Security section with the Planning RLS subsection (owner-only today → `can_access_event()` later).
5. Update the ER diagram (new tables + relationships).
6. Append decision log **D21–D26**.
7. Add the derived rows (Spent/Remaining, task progress via status category) to the Derived table.
8. Bump **Version** + **Last updated**; update "Scope covered so far".
9. Mirror the FE changes into `FE-INTEGRATION.md`; add the expense-receipt note to `R2-STORAGE-GUIDE.md`.

---

## 14. Open items for spec review

1. **Expense seed list** — merged 10 confirmed as admin-managed starter data (Abhijith). OK?
2. **`vendor_name` vs `title`** on expenses — both kept (title = optional label, vendor_name = the payee). Confirm both are wanted, or collapse to vendor only.
3. **`bulk_set_task_status`** — build this pass or defer to the FE-wiring pass? (Bulk bar exists in the prototype.)
