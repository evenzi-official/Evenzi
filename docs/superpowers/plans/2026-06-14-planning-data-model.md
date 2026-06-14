# Planning Module Data Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. **This is a Supabase migration build, run in teaching mode** — narrate each statement before applying.

**Goal:** Build the Planning module's database layer (Checklist + Budget) on the dev Supabase project, extending the CORE slice.

**Architecture:** 6 forward-only migrations (`planning_01`–`planning_06`) applied via the Supabase MCP `apply_migration` tool, each verified by an `execute_sql` probe + `get_advisors`. Then regenerate types + sync docs (DATA-MODEL.md, FE-INTEGRATION.md, R2 guide). No local `.sql` files — migrations are recorded on the remote (same as `core_01`–`07`); the committed artifacts are the docs.

**Tech Stack:** Supabase Postgres (project `smjkbmkxweevqpvygabe`, ap-northeast-1), MCP tools `apply_migration` / `execute_sql` / `list_tables` / `get_advisors` / `generate_typescript_types`.

**Source of truth:** the design spec [`docs/superpowers/specs/2026-06-14-planning-data-model-design.md`](../specs/2026-06-14-planning-data-model-design.md). Resolved open items: expense seed = merged 10 (admin-managed); expenses keep both `title` + `vendor_name`; `bulk_set_task_status` built this pass.

**Teaching-mode rule:** before every `apply_migration`, narrate to Abhijith in plain SQL terms what the statement does and why (he has a SQL background, is new to Supabase). After each, show the verification result.

---

## File / object map

| Migration | Creates / changes |
|---|---|
| `planning_01` | `config.task_priorities`, `config.task_statuses`, `config.expense_types` (+ seeds, `updated_at` triggers, RLS select-only, grants) |
| `planning_02` | `config.event_checklists.default_priority_slug` (+backfill); extend `public.event_tasks` (+4 cols, drop `is_done`, indexes) |
| `planning_03` | `public.event_task_assignees`, `event_budgets`, `event_expense_types`, `event_expenses` (+ triggers) |
| `planning_04` | views `event_budget_summary`, `event_expense_breakdown`, `event_task_progress` (`security_invoker`) |
| `planning_05` | owner-only RLS on the 4 new live tables |
| `planning_06` | `event_task_counts`, `bulk_set_task_status` (hardened: revoke anon, slug guard) |
| `planning_07` | `create_event_with_details` (create-fresh; owner from `auth.uid()`; seeds tasks+expense_types+empty budget) |
| docs | `DATA-MODEL.md`, `FE-INTEGRATION.md`, `R2-STORAGE-GUIDE.md`, `lib/supabase/database.types.ts` |

> **Council-reviewed:** 2026-06-14 by data_modeller, backend_engineer, security_expert, tech_lead. Verdict 🟡 ADDRESS-THEN-PROCEED — all 3 critical + 5 important fixes folded in below (RLS enabled in planning_03 not _05; `user_id` set in create-event; Task 0 app grep done; RPC anon-revokes; slug guard; empty-budget seed; Task 6 split into _06/_07; `set_updated_at` doc fix).

---

### Task 0: Live-app blast-radius grep (DONE — recorded)

Ran `grep -rn` over `app/` + `lib/` for `is_done`, `event_tasks`, `create_event_with_details`, `event_checklists`. Findings:

- **`is_done` / `event_tasks`:** appear ONLY in generated `lib/supabase/database.types.ts` — no hand-written writer. Task 7 (type regen) covers them. ✅ No FE edit needed.
- **`create_event_with_details`:** one live call site — `app/api/events/route.ts:120`. The RPC does **not** exist on the DB yet, so create-event via this route is currently broken (part of the pending CORE update). `planning_07` must match its call signature exactly (below) so the route works again — **no route edit needed** if the RPC adapts to the existing param shapes.
- **Existing signature the route expects:** `create_event_with_details(p_user_id uuid, p_event_type_id uuid, p_name text, p_primary_date date, p_primary_venue text, p_guest_capacity int, p_metadata jsonb [{key,value}], p_sub_events jsonb [{sub_event_type_id,custom_name,display_order}])` → returns `{event_id, event_name, event_status, created_at}`.
- **Out-of-scope pre-existing breakage (flag, do NOT fix here):** `app/api/events/[id]/route.ts:93` queries `event_metadata` — a table dropped in `core_03` (EAV killed, D4). That's a CORE-FE-update item, not Planning. Note it for the Dheeraj/FE CORE-migration task.

---

### Task 1: `planning_01` — catalogs + seeds + RLS + grants

**Object:** 3 `config.*` catalogs.

- [ ] **Step 1: Narrate** — three reference tables (priority, status, expense type). `task_statuses.category` (open/done/dropped) is what the progress bar and overdue logic read, so a status can be renamed without breaking those. RLS select-only = anyone logged-in can read, only `service_role` (admin) writes — same as the existing `config` catalogs.

- [ ] **Step 2: Apply** `apply_migration` name `planning_01_catalogs` with:

```sql
create table config.task_priorities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text, icon_name text,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.task_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text, icon_name text,
  category text not null check (category in ('open','done','dropped')),
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.expense_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text, icon_name text,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- updated_at triggers
create trigger trg_task_priorities_updated before update on config.task_priorities
  for each row execute function public.set_updated_at();
create trigger trg_task_statuses_updated before update on config.task_statuses
  for each row execute function public.set_updated_at();
create trigger trg_expense_types_updated before update on config.expense_types
  for each row execute function public.set_updated_at();

-- seeds
insert into config.task_priorities (slug, name, icon_name, display_order) values
  ('low','Low','keyboard_arrow_down',1), ('med','Medium','drag_handle',2), ('high','High','priority_high',3);
insert into config.task_statuses (slug, name, category, icon_name, display_order) values
  ('pending','Pending','open','radio_button_unchecked',1),
  ('in_progress','In Progress','open','pending',2),
  ('completed','Completed','done','check_circle',3),
  ('cancelled','Cancelled','dropped','cancel',4);
insert into config.expense_types (slug, name, icon_name, display_order) values
  ('venue','Venue','location_city',1), ('food','Food / Catering','restaurant',2),
  ('decoration','Decoration','local_florist',3), ('photography','Photography','photo_camera',4),
  ('videography','Videography','videocam',5), ('attire','Attire','checkroom',6),
  ('music','Music / DJ','music_note',7), ('entertainment','Entertainment','celebration',8),
  ('invitations','Invitations','mail',9), ('other','Other','more_horiz',10);

-- RLS: public-read, no write policy (admin via service_role)
alter table config.task_priorities enable row level security;
alter table config.task_statuses  enable row level security;
alter table config.expense_types  enable row level security;
create policy task_priorities_read on config.task_priorities for select to anon, authenticated using (true);
create policy task_statuses_read  on config.task_statuses  for select to anon, authenticated using (true);
create policy expense_types_read  on config.expense_types  for select to anon, authenticated using (true);

-- grants (config schema already exposed + usage-granted from core_01)
grant select on config.task_priorities, config.task_statuses, config.expense_types to anon, authenticated;
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select 'task_priorities' t, count(*) from config.task_priorities
union all select 'task_statuses', count(*) from config.task_statuses
union all select 'expense_types', count(*) from config.expense_types;
```
Expected: `3, 4, 10`.

- [ ] **Step 4: Advisor check** `get_advisors` type `security`. Expected: no new errors on the 3 catalogs (RLS enabled).

---

### Task 2: `planning_02` — extend `event_checklists` + `event_tasks`

**Object:** add the priority seed source; extend the task instance table; drop `is_done`.

- [ ] **Step 1: Narrate** — `event_tasks` is empty (0 rows), so adding NOT-NULL FK columns is safe (no backfill). We give `event_checklists` a `default_priority_slug` because the seed copies templates into tasks and tasks now require a priority. We drop `is_done`; "done" is now `status.category = 'done'`. (Note for the record: if the table had data we'd add nullable → backfill → set NOT NULL.)

- [ ] **Step 2: Apply** `apply_migration` name `planning_02_extend_tasks`:

```sql
alter table config.event_checklists
  add column default_priority_slug text references config.task_priorities(slug) on update cascade;
update config.event_checklists set default_priority_slug = 'med' where default_priority_slug is null;

alter table public.event_tasks
  add column sub_event_id uuid references public.event_sub_events(id) on delete set null,
  add column priority_id  uuid references config.task_priorities(id)  on delete restrict,
  add column status_id    uuid references config.task_statuses(id)    on delete restrict,
  add column due_date     date;
alter table public.event_tasks
  alter column priority_id set not null,
  alter column status_id   set not null;
alter table public.event_tasks drop column is_done;

create index idx_event_tasks_status   on public.event_tasks(event_id, status_id);
create index idx_event_tasks_subevent on public.event_tasks(event_id, sub_event_id);
create index idx_event_tasks_due_open on public.event_tasks(event_id, due_date) where due_date is not null;
drop index if exists idx_event_tasks_event;   -- bare (event_id) now redundant
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select column_name, is_nullable, data_type
from information_schema.columns
where table_schema='public' and table_name='event_tasks'
  and column_name in ('sub_event_id','priority_id','status_id','due_date','is_done')
order by column_name;
```
Expected: 4 rows (`due_date` nullable; `priority_id`/`status_id` NOT NULL; `sub_event_id` nullable); **no `is_done`**.

- [ ] **Step 4** confirm `event_checklists` backfill: `select count(*) from config.event_checklists where default_priority_slug='med';` Expected: `12`.

---

### Task 3: `planning_03` — 4 new live tables + triggers

**Object:** assignees, budgets, expense types, expenses.

- [ ] **Step 1: Narrate** — `event_task_assignees` carries its own `event_id` (guard trigger keeps it equal to the task's event) so RLS is a single-hop check like every other event-child. `event_budgets` is 1:1 (event_id is the PK). Attribution columns are stamped server-side by a trigger using `auth.uid()` — never trusted from the client. `set_updated_at` on every table except the insert/delete-only assignee join.

- [ ] **Step 2: Apply** `apply_migration` name `planning_03_live_tables`:

```sql
-- assignees (pure join; event_id guarded)
create table public.event_task_assignees (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  task_id  uuid not null references public.event_tasks(id) on delete cascade,
  user_id  uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id, user_id)
);
create index idx_task_assignees_task on public.event_task_assignees(task_id);
create index idx_task_assignees_user on public.event_task_assignees(user_id);

create table public.event_budgets (
  event_id uuid primary key references public.events(id) on delete cascade,
  total_amount numeric(14,2) not null default 0,
  currency text not null default 'INR' check (currency in ('INR')),
  modified_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.event_expense_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, icon_name text,
  is_custom boolean not null default false, source_slug text,
  enabled boolean not null default true, display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- case-insensitive uniqueness needs a unique INDEX (a UNIQUE constraint can't take an expression)
create unique index uq_event_expense_types_name on public.event_expense_types(event_id, lower(name));
create index idx_event_expense_types_event on public.event_expense_types(event_id);

create table public.event_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  sub_event_id uuid references public.event_sub_events(id) on delete set null,
  expense_type_id uuid not null references public.event_expense_types(id) on delete restrict,
  title text, description text, vendor_name text,
  amount numeric(14,2) not null check (amount >= 0),
  receipt_key text, expense_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_event_expenses_event_type on public.event_expenses(event_id, expense_type_id);
create index idx_event_expenses_subevent    on public.event_expenses(event_id, sub_event_id);

-- updated_at triggers (not on the assignee join)
create trigger trg_event_budgets_updated       before update on public.event_budgets       for each row execute function public.set_updated_at();
create trigger trg_event_expense_types_updated  before update on public.event_expense_types  for each row execute function public.set_updated_at();
create trigger trg_event_expenses_updated       before update on public.event_expenses       for each row execute function public.set_updated_at();

-- assignee guard (ONE trigger — avoids BEFORE-trigger alphabetical-ordering fragility):
--   (1) derive event_id from the task, (2) check owner/active-collaborator, (3) stamp assigned_by on insert.
create or replace function public.event_task_assignee_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare ok boolean;
begin
  select t.event_id into new.event_id from public.event_tasks t where t.id = new.task_id;
  if new.event_id is null then raise exception 'task % not found', new.task_id; end if;
  select exists(
    select 1 from public.events e where e.id = new.event_id and e.user_id = new.user_id
    union all
    select 1 from public.event_collaborators c
      where c.event_id = new.event_id and c.user_id = new.user_id and c.status = 'active'
  ) into ok;
  if not ok then raise exception 'assignee % is not owner/active-collaborator of event %', new.user_id, new.event_id; end if;
  if tg_op = 'INSERT' then new.assigned_by = auth.uid(); end if;
  return new;
end; $$;
revoke execute on function public.event_task_assignee_before() from public, anon, authenticated;
create trigger trg_event_task_assignee_before before insert or update on public.event_task_assignees
  for each row execute function public.event_task_assignee_before();

-- attribution defaults on the financial tables: stamp creator/modifier from auth.uid() (ignore client-sent values)
create or replace function public.stamp_created_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.created_by = auth.uid(); return new; end; $$;
create or replace function public.stamp_budget_modified_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.modified_by = auth.uid(); return new; end; $$;
revoke execute on function public.stamp_created_by(), public.stamp_budget_modified_by() from public, anon, authenticated;
create trigger trg_event_expenses_creator before insert on public.event_expenses for each row execute function public.stamp_created_by();
create trigger trg_event_budgets_modifier before insert or update on public.event_budgets for each row execute function public.stamp_budget_modified_by();

-- COUNCIL-CRITICAL: enable RLS in the SAME migration as creation. New public.* tables inherit
-- default DML grants to anon/authenticated; RLS-off across a migration boundary = anon REST write hole.
-- RLS-on with zero policies = fail-safe deny; the policies themselves land in planning_05.
alter table public.event_task_assignees enable row level security;
alter table public.event_budgets        enable row level security;
alter table public.event_expense_types  enable row level security;
alter table public.event_expenses       enable row level security;
```

- [ ] **Step 3: Verify** `list_tables` schemas `["public"]` — expect the 4 new tables present with `rls_enabled=true` (enabled here; policies added in Task 5). Then `execute_sql`:

```sql
select tgname from pg_trigger where tgrelid = 'public.event_task_assignees'::regclass and not tgisinternal;
```
Expected: `trg_event_task_assignee_before` (single consolidated guard).

---

### Task 4: `planning_04` — derived views (`security_invoker`)

- [ ] **Step 1: Narrate** — these compute Spent/Remaining/Progress live (never stored, so they can't drift). `security_invoker = on` is critical: without it a `public` view runs as its owner and would let any caller read every event's totals, bypassing RLS.

- [ ] **Step 2: Apply** `apply_migration` name `planning_04_views`:

```sql
create view public.event_budget_summary as
select b.event_id, b.total_amount,
       coalesce(sum(e.amount),0) as spent,
       b.total_amount - coalesce(sum(e.amount),0) as remaining, b.currency
from public.event_budgets b
left join public.event_expenses e on e.event_id = b.event_id
group by b.event_id, b.total_amount, b.currency;
alter view public.event_budget_summary set (security_invoker = on);

create view public.event_expense_breakdown as
select e.event_id, e.expense_type_id, t.name, t.icon_name,
       sum(e.amount) as spent, count(*) as item_count
from public.event_expenses e
join public.event_expense_types t on t.id = e.expense_type_id
group by e.event_id, e.expense_type_id, t.name, t.icon_name;
alter view public.event_expense_breakdown set (security_invoker = on);

create view public.event_task_progress as
select t.event_id,
       count(*) filter (where s.category = 'done') as done,
       count(*) as total,
       round(100.0 * count(*) filter (where s.category = 'done') / nullif(count(*),0)) as percent
from public.event_tasks t
join config.task_statuses s on s.id = t.status_id
group by t.event_id;
alter view public.event_task_progress set (security_invoker = on);
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select c.relname, (select option_value from pg_options_to_table(c.reloptions)
                   where option_name='security_invoker') as security_invoker
from pg_class c where c.relname in ('event_budget_summary','event_expense_breakdown','event_task_progress');
```
Expected: 3 rows, each `security_invoker = true`.

---

### Task 5: `planning_05` — owner-only RLS on the 4 new live tables

- [ ] **Step 1: Narrate** — RLS is already ENABLED on these 4 tables (planning_03); this migration adds the **policies**. Same inlined owner-only predicate the live CORE child tables use (`EXISTS events.user_id = auth.uid()`), NOT `can_access_event()` (still planned). Assignees use their own guard-populated `event_id`; the others use their `event_id` directly. One `FOR ALL` policy per table (read+write share the predicate), matching the live pattern.

- [ ] **Step 2: Apply** `apply_migration` name `planning_05_rls`:

```sql
-- RLS already enabled in planning_03 (fail-safe). Policies only here.
create policy event_task_assignees_owner on public.event_task_assignees for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_task_assignees.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_task_assignees.event_id and e.user_id = (select auth.uid())));
create policy event_budgets_owner on public.event_budgets for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())));
create policy event_expense_types_owner on public.event_expense_types for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_expense_types.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_expense_types.event_id and e.user_id = (select auth.uid())));
create policy event_expenses_owner on public.event_expenses for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_expenses.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_expenses.event_id and e.user_id = (select auth.uid())));
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select tablename, count(*) policies from pg_policies
where schemaname='public' and tablename in
  ('event_task_assignees','event_budgets','event_expense_types','event_expenses')
group by tablename order by tablename;
```
Expected: 4 rows, each `policies = 1`.

- [ ] **Step 4: Advisor** `get_advisors` type `security`. Expected: no "RLS disabled in public" or "security definer view" errors for the new objects.

---

### Task 6: `planning_06` — read/helper functions (hardened)

- [ ] **Step 1: Narrate** — `event_task_counts` returns the four toolbar numbers in one scan (Overdue is `category='open' AND due<today`, not a status). `bulk_set_task_status` flips many tasks at once and now **raises on an unknown slug** (else it would set NULL → opaque NOT-NULL error). Both are `security invoker` (RLS scopes them) and we **explicitly revoke from anon** (the default ACL grants EXECUTE to anon on new public functions).

- [ ] **Step 2: Apply** `apply_migration` name `planning_06_helpers`:

```sql
create or replace function public.event_task_counts(p_event_id uuid)
returns table(total int, todo int, done int, overdue int)
language sql stable security invoker set search_path = '' as $$
  select count(*)::int,
         count(*) filter (where s.category='open')::int,
         count(*) filter (where s.category='done')::int,
         count(*) filter (where s.category='open' and t.due_date < current_date)::int
  from public.event_tasks t join config.task_statuses s on s.id = t.status_id
  where t.event_id = p_event_id;
$$;

create or replace function public.bulk_set_task_status(p_task_ids uuid[], p_status_slug text)
returns int language plpgsql security invoker set search_path = '' as $$
declare v_status uuid; v_count int;
begin
  select id into v_status from config.task_statuses where slug = p_status_slug;
  if v_status is null then raise exception 'unknown status slug %', p_status_slug; end if;
  update public.event_tasks set status_id = v_status where id = any(p_task_ids);
  get diagnostics v_count = row_count;          -- reflects RLS-visible rows only
  return v_count;
end; $$;

-- COUNCIL: harden EXECUTE — default ACL grants anon; pin it to authenticated.
revoke execute on function public.event_task_counts(uuid), public.bulk_set_task_status(uuid[], text) from public, anon;
grant  execute on function public.event_task_counts(uuid), public.bulk_set_task_status(uuid[], text) to authenticated;
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select proname, prosecdef from pg_proc
where proname in ('event_task_counts','bulk_set_task_status') and pronamespace='public'::regnamespace;
```
Expected: 2 rows, both `prosecdef=false` (security invoker). Optionally confirm anon lacks EXECUTE via `has_function_privilege('anon','public.bulk_set_task_status(uuid[],text)','execute')` → `false`.

---

### Task 7: `planning_07` — `create_event_with_details` (create-fresh)

> Matches the **existing route signature** (`app/api/events/route.ts:120`) so create-event works again with no route edit. Owner comes from `auth.uid()` — `p_user_id` is accepted (signature compat) but **ignored/asserted**, never trusted.

- [ ] **Step 1: Inspect** — confirm it's absent (Task 0 says so) and re-check before create:

```sql
select proname from pg_proc where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```
Expected: 0 rows (create-fresh).

- [ ] **Step 2: Narrate** — one transaction: insert the event (owner = `auth.uid()`), its sub-events, seed checklist→tasks (status `pending`, priority from `default_priority_slug`), copy the expense-type catalog into the event, and create an **empty `event_budgets` row** (so the budget view always returns a row). All catalog ids resolved by slug. `security definer` + pinned `search_path` + revoke/grant.

- [ ] **Step 3: Apply** `apply_migration` name `planning_07_create_event` — body satisfying this contract (signature is fixed by the route; finalize the exact SQL at apply time):

  - **Signature:** `create_event_with_details(p_user_id uuid, p_event_type_id uuid, p_name text, p_primary_date date, p_primary_venue text, p_guest_capacity int, p_metadata jsonb, p_sub_events jsonb)` → returns `json {event_id, event_name, event_status, created_at}`. **No new owner parameter.**
  - **Owner (COUNCIL-CRITICAL):** `v_uid := auth.uid()`; if `v_uid is null` raise; set **both** `events.user_id = v_uid` AND `events.created_by = v_uid` (RLS keys on `user_id` — setting only `created_by` would lock the creator out of their own rows). Ignore `p_user_id` (or assert `p_user_id = v_uid`).
  - **event_details:** build the jsonb object from `p_metadata` (`[{key,value}]` → `jsonb_object_agg`), store in `events.event_details` (EAV is dead — D4).
  - **Sub-events:** insert each `p_sub_events` row (`event_sub_type_id` or `custom_name`, `display_order`).
  - **Tasks seed:** `insert … select` from `config.event_checklists where event_type_id = p_event_type_id and enabled`, `status_id` = (pending), `priority_id` = resolve(`c.default_priority_slug`).
  - **Expense-types seed:** `insert … select` from `config.expense_types where enabled` → `name`, `icon_name`, `source_slug = slug`, `is_custom = false`.
  - **Budget seed:** `insert into public.event_budgets(event_id, total_amount) values (v_event_id, 0)` (the `stamp_budget_modified_by` trigger stamps `modified_by`).
  - **Hardening:** `security definer`, `set search_path=''`, fully-qualified names, `revoke execute from public, anon`, `grant execute to authenticated`.

- [ ] **Step 4: Verify** `execute_sql`:

```sql
select proname, prosecdef, proconfig, pg_get_function_identity_arguments(oid) args
from pg_proc where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```
Expected: 1 row; `prosecdef=true`; `search_path=` in `proconfig`; args match the route signature; **no owner-id-only param beyond `p_user_id`**.

- [ ] **Step 5: Smoke test (RLS-on, as owner)** — call the RPC for a real backfilled user, then **read back as that same user** (RLS active) to prove the owner can see their seeded rows:

```sql
-- after an rpc call returning v_event_id, as the owner:
select (select count(*) from public.event_tasks where event_id = :v) tasks,
       (select count(*) from public.event_expense_types where event_id = :v) etypes,
       (select total_amount from public.event_budgets where event_id = :v) budget,
       (select to_jsonb(c) from public.event_task_counts(:v) c) counts;
```
Expected: `tasks=12`, `etypes=10`, `budget=0`, sane `counts`. Use a throwaway event then delete it (CASCADE cleans children), or a `begin … rollback`. Document the result.

---

### Task 8: types + advisor sweep

- [ ] **Step 1** `generate_typescript_types` → overwrite `lib/supabase/database.types.ts`.
- [ ] **Step 2** `get_advisors` type `security` then type `performance`. Expected: clean (no new errors). Record any unindexed-FK notices and add indexes if flagged.
- [ ] **Step 3: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(db): regenerate Supabase types after planning_01-06"
```

---

### Task 9: update `DATA-MODEL.md` (DB + doc change together)

- [ ] **Step 1** Apply the §13 checklist from the spec: add the 6 tables (DDL + Notes + Rationale), finalize both `[name TBD]` → `[NOW]`, add Functions/Triggers, a new "Views (derived)" subsection (note the `security_invoker` footgun), the Planning RLS subsection, update the ER diagram, append decision log **D21–D26**, add the derived rows, bump Version + Last updated + "Scope covered so far". **Also fix the stale `set_updated_at()` code block (lines ~120-125) to show the pinned `set search_path = ''`** (the live function already has it; the doc is drifted — council/backend finding).
- [ ] **Step 2: Commit**

```bash
git add docs/data-model/DATA-MODEL.md
git commit -m "docs(data-model): add Planning module (tables, views, RLS, D21-D26)"
```

---

### Task 10: update `FE-INTEGRATION.md` + `R2-STORAGE-GUIDE.md`

- [ ] **Step 1** FE-INTEGRATION.md: task-progress now via `event_task_progress` / `status.category='done'`; task insert needs `status_id`+`priority_id` (cache the 3 catalogs, map by id); budget set = `upsert` on `event_budgets`; toolbar = `rpc('event_task_counts')`; add the old→new map rows.
- [ ] **Step 2** R2-STORAGE-GUIDE.md: add the expense-receipt note — `receipt_key` stores the object key, private bucket, signed URL gated on event access; add the receipt prefix to the `delete_user_account` purge step.
- [ ] **Step 3: Commit**

```bash
git add docs/data-model/FE-INTEGRATION.md docs/R2-STORAGE-GUIDE.md
git commit -m "docs: Planning FE-integration recipes + R2 receipt note"
```

---

## Self-review

**Spec coverage:** every spec §4–§13 object maps to a task — app-grep (T0), catalogs (T1), event_tasks/event_checklists extend (T2), 4 live tables + triggers + RLS-enable (T3), views (T4), RLS policies (T5), helper fns (T6), create-event RPC (T7), types (T8), docs incl. D21–D26 + FE + R2 (T9/T10). ✔
**Placeholder scan:** the only deferred body is `create_event_with_details` (T7 Step 3) — signature is fixed by the live route; the contract enumerates every statement (owner, event_details, sub-events, task seed, expense-type seed, budget seed, hardening). No vague "add validation" steps. ✔
**Type consistency:** column/trigger/function/policy names match the spec and across tasks (`category`, `status_id`, `event_task_counts`, `event_budget_summary`, `trg_event_task_assignee_before`). ✔

---

**Council reviewed:** 2026-06-14 by data_modeller, backend_engineer, security_expert, tech_lead. Verdict: 🟡 ADDRESS-THEN-PROCEED → all 3 critical + 5 important fixes folded in (RLS in planning_03; `user_id` in create-event; Task 0 grep; RPC anon-revokes; bulk slug guard; empty-budget seed; Task 6→06/07 split; `set_updated_at` doc fix). Approved by Abhijith to proceed.
