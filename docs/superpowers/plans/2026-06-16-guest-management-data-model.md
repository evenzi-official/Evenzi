# Guest Management Data Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (or subagent-driven-development). Checkbox steps. **Supabase migration build, teaching mode** — narrate each statement before applying.

**Goal:** Build the Guest Management module's database layer (guest list + RSVP + functions + tags) on the dev Supabase project, extending CORE/Planning.

**Architecture:** 5 forward-only migrations (`guests_01`–`guests_05`) via the Supabase MCP `apply_migration`, each verified by `execute_sql` + `get_advisors`. Then regenerate types + sync docs. Migrations recorded on the remote (like `core_*`/`planning_*`); committed artifacts are the docs.

**Tech Stack:** Supabase Postgres (project `smjkbmkxweevqpvygabe`), MCP `apply_migration`/`execute_sql`/`get_advisors`/`generate_typescript_types`.

**Source of truth:** [`docs/superpowers/specs/2026-06-16-guest-management-data-model-design.md`](../specs/2026-06-16-guest-management-data-model-design.md) (council-reviewed, all fixes folded in). Resolved: guest-level RSVP · tag entities (catalog→per-event copy) · `invited` bool only · `party_size` · `created_by` provenance · address deferred.

**Teaching-mode rule:** before every `apply_migration`, narrate in plain SQL terms (Abhijith has SQL background, new to Supabase). After each, show the verification result.

> **Council-reviewed:** 2026-06-16 (data_modeller/backend/security/tech_lead), verdict 🟡 ADDRESS-THEN-PROCEED — all fixes already folded into the spec this plan builds.

---

## Object map

| Migration | Creates / changes |
|---|---|
| `guests_01` | `config.rsvp_statuses`, `config.guest_tags` (+ seeds, `updated_at` triggers, RLS select-only, grants) |
| `guests_02` | 5 `public.*` tables + indexes + `updated_at`/guard/attribution/`default_guest_rsvp` triggers + **RLS enabled** |
| `guests_03` | views `event_guest_stats`, `event_sub_event_guest_counts` (`security_invoker`, authenticated-only grant) |
| `guests_04` | RLS policies (owner-only; `event_guest_tags` split — INSERT requires `is_custom=true`) |
| `guests_05` | extend `create_event_with_details` (+ guest-tag seed block) |
| docs | `DATA-MODEL.md`, `FE-INTEGRATION.md`, `lib/supabase/database.types.ts` |

---

### Task 1: `guests_01` — catalogs + seeds + RLS + grants

- [ ] **Step 1: Narrate** — two `config` catalogs. `rsvp_statuses.category` (pending/attending/declined/tentative) drives headcount math, deliberately a *different* vocabulary from `task_statuses` (open/done/dropped) — RSVP ≠ task lifecycle. `guest_tags` is a small default list that seeds each event's own tags. RLS: select-only for everyone logged-in, writes only via `service_role` — same as the other catalogs.

- [ ] **Step 2: Apply** `apply_migration` name `guests_01_catalogs`:

```sql
create table config.rsvp_statuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text, icon_name text,
  category text not null check (category in ('pending','attending','declined','tentative')),
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.guest_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create trigger trg_rsvp_statuses_updated before update on config.rsvp_statuses
  for each row execute function public.set_updated_at();
create trigger trg_guest_tags_updated before update on config.guest_tags
  for each row execute function public.set_updated_at();

insert into config.rsvp_statuses (slug, name, category, icon_name, display_order) values
  ('pending','Pending','pending','schedule',1),
  ('confirmed','Confirmed','attending','check_circle',2),
  ('declined','Declined','declined','cancel',3),
  ('maybe','Maybe','tentative','help',4);
insert into config.guest_tags (slug, name, display_order) values
  ('family','Family',1), ('friends','Friends',2), ('brides-side','Bride''s side',3),
  ('grooms-side','Groom''s side',4), ('out-of-town','Out-of-town',5), ('colleagues','Colleagues',6);

alter table config.rsvp_statuses enable row level security;
alter table config.guest_tags    enable row level security;
create policy rsvp_statuses_read on config.rsvp_statuses for select to anon, authenticated using (true);
create policy guest_tags_read    on config.guest_tags    for select to anon, authenticated using (true);
grant select on config.rsvp_statuses, config.guest_tags to anon, authenticated;
```

- [ ] **Step 3: Verify** `execute_sql`:

```sql
select 'rsvp' t, count(*) from config.rsvp_statuses
union all select 'tags', count(*) from config.guest_tags order by t;
```
Expected: `rsvp=4`, `tags=6`.

- [ ] **Step 4: Advisor** `get_advisors` type `security` — no new errors on the 2 catalogs.

---

### Task 2: `guests_02` — 5 live tables + triggers + RLS-enable

- [ ] **Step 1: Narrate** — the guest list + 4 related tables. Two `BEFORE INSERT` triggers on `event_guests` touch *different* columns (`default_guest_rsvp` sets `rsvp_status_id`, `stamp_guest_created_by` sets `created_by`) so order is irrelevant. The two join tables get a guard trigger that derives `event_id` from the guest **and rejects a `sub_event_id`/`tag_id` from another event** (RLS alone wouldn't catch that). All trigger functions are `SECURITY DEFINER`, `search_path=''`, schema-qualified, `revoke`d from anon, and BEFORE-only (mutate `NEW`, never write). RLS is enabled here (fail-safe); policies land in `guests_04`. Note: `lower(name)` uniqueness must be a unique **index** (an expression can't go in a UNIQUE constraint — the lesson from `planning_03`).

- [ ] **Step 2: Apply** `apply_migration` name `guests_02_live_tables`:

```sql
create table public.event_guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, email text, phone text,
  rsvp_status_id uuid not null references config.rsvp_statuses(id) on delete restrict,
  invited boolean not null default false,
  party_size int not null default 1 check (party_size >= 1),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_event_guests_event      on public.event_guests(event_id, display_order);
create index idx_event_guests_event_rsvp on public.event_guests(event_id, rsvp_status_id);
create index idx_event_guests_event_name on public.event_guests(event_id, lower(name));

create table public.event_guest_sub_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  sub_event_id uuid not null references public.event_sub_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, sub_event_id)
);
create index idx_guest_sub_events_guest    on public.event_guest_sub_events(guest_id);
create index idx_guest_sub_events_subevent on public.event_guest_sub_events(event_id, sub_event_id);

create table public.event_guest_tags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false, source_slug text,
  created_by uuid references auth.users(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_guest_tags_name on public.event_guest_tags(event_id, lower(name));
create index idx_event_guest_tags_event on public.event_guest_tags(event_id);

create table public.event_guest_tag_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  tag_id uuid not null references public.event_guest_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, tag_id)
);
create index idx_guest_tag_links_guest on public.event_guest_tag_links(guest_id);
create index idx_guest_tag_links_tag   on public.event_guest_tag_links(event_id, tag_id);

-- updated_at triggers (entity tables only; join tables are insert/delete-only)
create trigger trg_event_guests_updated     before update on public.event_guests     for each row execute function public.set_updated_at();
create trigger trg_event_guest_tags_updated  before update on public.event_guest_tags  for each row execute function public.set_updated_at();

-- default rsvp -> pending when omitted (CSV/bulk import ergonomics)
create or replace function public.default_guest_rsvp()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.rsvp_status_id is null then
    select id into new.rsvp_status_id from config.rsvp_statuses where slug = 'pending';
  end if;
  return new;
end; $$;
revoke execute on function public.default_guest_rsvp() from public, anon, authenticated;
create trigger trg_default_guest_rsvp before insert on public.event_guests
  for each row execute function public.default_guest_rsvp();

-- stamp created_by on guests (always) and tags (only host-added is_custom=true)
create or replace function public.stamp_guest_created_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin new.created_by = auth.uid(); return new; end; $$;
revoke execute on function public.stamp_guest_created_by() from public, anon, authenticated;
create trigger trg_event_guests_creator before insert on public.event_guests
  for each row execute function public.stamp_guest_created_by();

create or replace function public.stamp_guest_tag_created_by()
returns trigger language plpgsql security definer set search_path = '' as $$
begin if new.is_custom then new.created_by = auth.uid(); end if; return new; end; $$;
revoke execute on function public.stamp_guest_tag_created_by() from public, anon, authenticated;
create trigger trg_event_guest_tags_creator before insert on public.event_guest_tags
  for each row execute function public.stamp_guest_tag_created_by();

-- guard: derive event_id from the guest + reject a sub_event from another event
create or replace function public.guest_sub_event_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ev uuid; v_se_ev uuid;
begin
  select event_id into v_ev from public.event_guests where id = new.guest_id;
  if v_ev is null then raise exception 'guest % not found', new.guest_id; end if;
  select event_id into v_se_ev from public.event_sub_events where id = new.sub_event_id;
  if v_se_ev is distinct from v_ev then raise exception 'sub_event % not in guest''s event %', new.sub_event_id, v_ev; end if;
  new.event_id = v_ev; return new;
end; $$;
revoke execute on function public.guest_sub_event_before() from public, anon, authenticated;
create trigger trg_guest_sub_event_before before insert or update on public.event_guest_sub_events
  for each row execute function public.guest_sub_event_before();

-- guard: derive event_id from the guest + reject a tag from another event
create or replace function public.guest_tag_link_before()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_ev uuid; v_tag_ev uuid;
begin
  select event_id into v_ev from public.event_guests where id = new.guest_id;
  if v_ev is null then raise exception 'guest % not found', new.guest_id; end if;
  select event_id into v_tag_ev from public.event_guest_tags where id = new.tag_id;
  if v_tag_ev is distinct from v_ev then raise exception 'tag % not in guest''s event %', new.tag_id, v_ev; end if;
  new.event_id = v_ev; return new;
end; $$;
revoke execute on function public.guest_tag_link_before() from public, anon, authenticated;
create trigger trg_guest_tag_link_before before insert or update on public.event_guest_tag_links
  for each row execute function public.guest_tag_link_before();

alter table public.event_guests           enable row level security;
alter table public.event_guest_sub_events enable row level security;
alter table public.event_guest_tags       enable row level security;
alter table public.event_guest_tag_links  enable row level security;
```

- [ ] **Step 3: Verify** `execute_sql` — 4 tables present + RLS on:

```sql
select c.relname, c.relrowsecurity rls from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
 ('event_guests','event_guest_sub_events','event_guest_tags','event_guest_tag_links') order by 1;
```
Expected: 4 rows, `rls=true` each.

- [ ] **Step 4: Verify triggers** on `event_guests`:

```sql
select tgname from pg_trigger where tgrelid='public.event_guests'::regclass and not tgisinternal order by 1;
```
Expected: `trg_default_guest_rsvp`, `trg_event_guests_creator`, `trg_event_guests_updated` (3).

---

### Task 3: `guests_03` — derived views

- [ ] **Step 1: Narrate** — two read views computed live. `event_guest_stats` (per event: counts by RSVP category, attending headcount, zero-assigned count) and `event_sub_event_guest_counts` (sidebar "Sangeet 42"). Both `security_invoker = on` so the caller's RLS applies, and granted to `authenticated` only (revoke anon — even headcounts are owner-private). `event_guest_stats` returns NO row for a zero-guest event → the FE coalesces to all-zeros.

- [ ] **Step 2: Apply** `apply_migration` name `guests_03_views`:

```sql
create view public.event_guest_stats as
select g.event_id,
       count(*)                                          as total,
       count(*) filter (where s.category = 'attending')  as attending,
       count(*) filter (where s.category = 'pending')     as pending,
       count(*) filter (where s.category = 'declined')    as declined,
       count(*) filter (where s.category = 'tentative')   as maybe,
       coalesce(sum(g.party_size) filter (where s.category = 'attending'),0) as attending_headcount,
       count(*) filter (where not exists (
         select 1 from public.event_guest_sub_events se where se.guest_id = g.id)) as zero_assigned
from public.event_guests g
join config.rsvp_statuses s on s.id = g.rsvp_status_id
group by g.event_id;
alter view public.event_guest_stats set (security_invoker = on);
revoke all on public.event_guest_stats from anon, public;
grant select on public.event_guest_stats to authenticated;

create view public.event_sub_event_guest_counts as
select event_id, sub_event_id, count(*) as guest_count
from public.event_guest_sub_events
group by event_id, sub_event_id;
alter view public.event_sub_event_guest_counts set (security_invoker = on);
revoke all on public.event_sub_event_guest_counts from anon, public;
grant select on public.event_sub_event_guest_counts to authenticated;
```

- [ ] **Step 3: Verify** `security_invoker` is on:

```sql
select c.relname, (select option_value from pg_options_to_table(c.reloptions) where option_name='security_invoker') si
from pg_class c where c.relname in ('event_guest_stats','event_sub_event_guest_counts');
```
Expected: 2 rows, `si=true` each.

---

### Task 4: `guests_04` — RLS policies

- [ ] **Step 1: Narrate** — owner-only inlined predicate (same as CORE/Planning), NOT `can_access_event()` (still planned). `event_guests` / `event_guest_sub_events` / `event_guest_tag_links` get one `FOR ALL` policy on their `event_id`. `event_guest_tags` is **split**: read/update/delete are owner-only (so the tag manager can rename/delete seeded tags), but INSERT additionally requires `is_custom=true` — so a client can't forge a system-seeded (`is_custom=false`) tag; the DEFINER seed bypasses RLS and writes those.

- [ ] **Step 2: Apply** `apply_migration` name `guests_04_rls`:

```sql
create policy event_guests_owner on public.event_guests for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guests.event_id and e.user_id = (select auth.uid())));

create policy guest_sub_events_owner on public.event_guest_sub_events for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guest_sub_events.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guest_sub_events.event_id and e.user_id = (select auth.uid())));

create policy guest_tag_links_owner on public.event_guest_tag_links for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guest_tag_links.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guest_tag_links.event_id and e.user_id = (select auth.uid())));

-- event_guest_tags split: rw owner-only; INSERT also requires is_custom=true (no forged system tags)
create policy event_guest_tags_select on public.event_guest_tags for select to authenticated
  using (exists (select 1 from public.events e where e.id = event_guest_tags.event_id and e.user_id = (select auth.uid())));
create policy event_guest_tags_update on public.event_guest_tags for update to authenticated
  using     (exists (select 1 from public.events e where e.id = event_guest_tags.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_guest_tags.event_id and e.user_id = (select auth.uid())));
create policy event_guest_tags_delete on public.event_guest_tags for delete to authenticated
  using (exists (select 1 from public.events e where e.id = event_guest_tags.event_id and e.user_id = (select auth.uid())));
create policy event_guest_tags_insert on public.event_guest_tags for insert to authenticated
  with check (exists (select 1 from public.events e where e.id = event_guest_tags.event_id and e.user_id = (select auth.uid())) and is_custom = true);
```

- [ ] **Step 3: Verify** policy counts:

```sql
select tablename, count(*) from pg_policies where schemaname='public' and tablename in
 ('event_guests','event_guest_sub_events','event_guest_tags','event_guest_tag_links')
group by tablename order by 1;
```
Expected: `event_guest_sub_events=1`, `event_guest_tag_links=1`, `event_guest_tags=4`, `event_guests=1`.

- [ ] **Step 4: Advisor** `get_advisors` type `security` — no RLS-disabled / security-definer-view errors on the new objects.

---

### Task 5: `guests_05` — extend `create_event_with_details` (guest-tag seed)

- [ ] **Step 1: Inspect** the current function (built in `planning_07`) so the rewrite preserves the signature + the task/expense/budget seeds and only ADDS the guest-tag block:

```sql
select pg_get_functiondef(oid) from pg_proc
where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```

- [ ] **Step 2: Narrate** — add a 4th seed block (after tasks + expense-types + budget) copying `config.guest_tags` (enabled) into the new event's `event_guest_tags` as `is_custom=false`, `created_by=null` (system provenance). The DEFINER function bypasses RLS so it can write the `is_custom=false` rows the client INSERT policy forbids. Same signature (8 params, same return) → the live caller `app/api/events/route.ts:120` is unaffected.

- [ ] **Step 3: Apply** `apply_migration` name `guests_05_create_event_tags` — `create or replace function public.create_event_with_details(...)` preserving the planning_07 body and inserting this block before the `return`:

```sql
insert into public.event_guest_tags (event_id, name, is_custom, source_slug, created_by, display_order)
select v_event_id, gt.name, false, gt.slug, null, gt.display_order
from config.guest_tags gt
where gt.enabled
order by gt.display_order
on conflict (event_id, lower(name)) do nothing;
```
Keep `security definer`, `set search_path=''`, schema-qualified refs, and re-assert `revoke execute on function public.create_event_with_details(uuid,uuid,text,date,text,int,jsonb,jsonb) from public, anon; grant execute to authenticated;`.

- [ ] **Step 4: Verify** the seed block is present + hardening intact:

```sql
select prosecdef, proconfig, position('event_guest_tags' in pg_get_functiondef(oid))>0 as has_tag_seed
from pg_proc where proname='create_event_with_details' and pronamespace='public'::regnamespace;
```
Expected: `prosecdef=true`, `search_path=` in `proconfig`, `has_tag_seed=true`.

- [ ] **Step 5: Smoke test (RLS-on, as owner)** — create a throwaway event for a backfilled user, then read back as that user:

```sql
-- after rpc returns v_event_id, as the owner:
select (select count(*) from public.event_guest_tags where event_id=:v) tags,    -- expect 6 (seeded)
       (select count(*) from public.event_guests where event_id=:v) guests;        -- expect 0 (none added yet)
-- add one guest with no rsvp_status_id -> trigger defaults pending; assign a function; confirm stats:
```
Expected: `tags=6`, `guests=0`; an inserted name-only guest gets `rsvp_status_id=pending`; `event_guest_stats` coalesces correctly. Delete the throwaway event (CASCADE cleans children). Document the result.

---

### Task 6: types + advisor sweep

- [ ] **Step 1** `generate_typescript_types` → overwrite `lib/supabase/database.types.ts`.
- [ ] **Step 2** `get_advisors` `security` then `performance`. Record + address any unindexed-FK notice.
- [ ] **Step 3: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(db): regenerate Supabase types after guests_01-05"
```

---

### Task 7: update `DATA-MODEL.md` + `FE-INTEGRATION.md`

- [ ] **Step 1** Apply the spec §13 checklist: 2 catalogs + 5 tables (DDL + Notes + Rationale, `[NOW]`); contrast `rsvp_statuses.category` vs `task_statuses` in the Notes; the 2 views; the `create_event_with_details` guest-tag extension; the guard/default/attribution triggers; the Guest Management RLS subsection (incl. the `event_guest_tags` split); ER diagram; decision log **D27–D30**; derived rows (guest stats, headcount, zero-assigned); account-deletion cascade tree (5 tables cascade from events, `created_by` SET NULL); bump Version + Last updated + scope.
- [ ] **Step 2** FE-INTEGRATION.md: cache the 2 catalogs; name-only guest insert (trigger defaults pending); bulk-assign via `.upsert(..., {ignoreDuplicates:true})`; client tag insert is always `is_custom=true`; stats via `event_guest_stats` (coalesce no-row→zeros) + `event_sub_event_guest_counts`.
- [ ] **Step 3: Commit**

```bash
git add docs/data-model/DATA-MODEL.md docs/data-model/FE-INTEGRATION.md
git commit -m "docs(data-model): add Guest Management module (tables, views, RLS, D27-D30)"
```

---

## Self-review

**Spec coverage:** every spec object maps to a task — catalogs (T1), 5 tables + all triggers + RLS-enable (T2), 2 views (T3), policies incl. tags-split (T4), create_event guest-tag seed (T5), types (T6), docs incl. D27–D30 + FE (T7). ✔
**Placeholder scan:** the only deferred body is `create_event_with_details` (T5) — intentionally rewritten after inspecting the planning_07 definition (T5 Step 1), with the exact seed block given. No vague steps. ✔
**Type consistency:** names match the spec and across tasks (`category`, `rsvp_status_id`, `is_custom`, `event_guest_stats`, `guest_sub_event_before`, `default_guest_rsvp`, `uq_event_guest_tags_name`). The `lower(name)` uniqueness is a unique INDEX (not a constraint) — the planning_03 lesson. ✔
