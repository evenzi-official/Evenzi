# Event Settings Data Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land D40–D48 of the Evenzi data model — `config.plans` catalog, `events.plan_id` FK, three 1:1 settings sidecar tables (General / Website / Guest), three SECURITY INVOKER views, `_seed_event_settings()` helper function, `config.plans_public` anon-safe view — plus regenerated TypeScript types and synced docs.

**Architecture:** Eight forward-only migrations (`event_settings_01`–`event_settings_07`, with `06a`/`06b` split) applied directly to the Supabase dev project via MCP `apply_migration`. Three 1:1 sidecar tables each use `event_id` as their PK and denormalise `user_id` for single-hop owner-only RLS (same pattern as every prior module). All three are seeded by a new `_seed_event_settings()` SECURITY DEFINER helper called from `create_event_with_details()` — the D36 threshold triggers helper extraction at the 4th+ catalog-copy seed.

**Tech Stack:** Supabase Postgres (project `smjkbmkxweevqpvygabe`, ap-northeast-1), Supabase MCP (`mcp__2b7b199a-87b8-457a-a447-a3cb163b5b0f__*`), `npx supabase gen types typescript --schema public,config`.

**Spec:** `docs/superpowers/specs/2026-06-17-event-settings-data-model-design.md` (post-council, all fixes folded).

**DB facts (verified pre-flight):**
- Trigger function names: `public.set_updated_at()` (updated_at stamps), `public.stamp_updated_by()` (audit, SECURITY DEFINER) — both confirmed live.
- Last migration applied: `20260617044742` (`hub_03_event_hub_summary_view`).
- `create_event_with_details` is SECURITY DEFINER with `set search_path to ''` — all object refs must be fully qualified.
- `events.plan_id` does NOT exist yet; `config.plans` does NOT exist yet.

---

### Task 1: event_settings_01 — `config.plans` catalog

**Teaching:** The `config` schema holds read-only reference data that migrations populate and app roles can never mutate. Creating `config.plans` here (not in `public`) signals this intent structurally. `grant usage on schema config` is a prerequisite — without it, even a table-level `GRANT SELECT` silently fails at query time. `ON CONFLICT (slug) DO NOTHING` on the seed makes the migration idempotent (safe to re-apply). All limit columns are `int null` — `null` means "TBC / unlimited", and the enforcement trigger (Task 2) skips them explicitly.

**Files:** Migration `event_settings_01` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_01`**

Apply via `mcp__2b7b199a-87b8-457a-a447-a3cb163b5b0f__apply_migration` with:
- `name`: `event_settings_01_plans_catalog`
- `query`:

```sql
-- event_settings_01: config.plans — per-event purchase tier catalog
-- Limits are nullable (TBC / unlimited). Feature flags per prototype.
-- Populated by migrations only; app roles cannot mutate.

-- config schema already exists (core_01); grants are idempotent
grant usage on schema config to anon, authenticated;

create table if not exists config.plans (
  id                   uuid        primary key default gen_random_uuid(),
  slug                 text        not null unique,      -- 'free' | 'premium' | 'elite'
  name                 text        not null,
  sort_order           int         not null default 0,
  is_active            boolean     not null default true,
  price_inr            int         not null default 0,   -- whole rupees
  -- User-level limits (null = TBC / unlimited)
  max_events_per_user  int         null,
  -- Event-level limits (null = TBC / unlimited)
  max_guests           int         null,
  max_photos           int         null,
  max_admins           int         null,
  -- Feature flags (set per prototype; limits TBC)
  custom_domain        boolean     not null default false,
  priority_support     boolean     not null default false,
  ai_features          boolean     not null default false,
  -- Catch-all for TBC features not yet columnarised
  features             jsonb       not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- updated_at trigger (same set_updated_at() used across all tables)
create trigger trg_config_plans_updated_at
  before update on config.plans
  for each row execute function public.set_updated_at();

-- Seed: free (0₹) / premium (4900₹) / elite (9900₹)
-- All limit columns remain NULL until limits are decided.
insert into config.plans
  (slug, name, sort_order, price_inr, custom_domain, priority_support, ai_features)
values
  ('free',    'Free',    0,    0, false, false, false),
  ('premium', 'Premium', 1, 4900, true,  true,  false),
  ('elite',   'Elite',   2, 9900, true,  true,  true )
on conflict (slug) do nothing;

-- RLS: authenticated SELECT only (raw table — features jsonb is internal)
-- anon gets config.plans_public view (event_settings_07) — no direct access here
alter table config.plans enable row level security;

create policy "plans_authenticated_select" on config.plans
  for select to authenticated using (true);

grant select on config.plans to authenticated;
```

- [ ] **Step 2: smoke test**

```sql
-- 3 seed rows with correct feature flags
select slug, price_inr, custom_domain, priority_support, ai_features
from config.plans order by sort_order;
-- Expected:
-- free    |    0 | f | f | f
-- premium | 4900 | t | t | f
-- elite   | 9900 | t | t | t

-- RLS enabled
select relrowsecurity from pg_class
where relname = 'plans'
  and relnamespace = (select oid from pg_namespace where nspname = 'config');
-- Expected: t
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_01 — config.plans catalog + free/premium/elite seed (D40)"
```

---

### Task 2: event_settings_02 — `events.plan_id` FK + limit trigger

**Teaching:** PostgreSQL columns cannot use a subquery as their DEFAULT expression — only functions, literals, or simple expressions. `config.free_plan_id()` is a `STABLE` function that wraps the subquery; the RAISE guard makes it fail loudly if the seed (Task 1) is missing rather than silently defaulting to NULL. `ON DELETE RESTRICT` on the FK prevents deleting a plan tier that events are currently on — a pricing change must update rows first. The `enforce_plan_event_limit` BEFORE INSERT trigger is scaffolded now even while all limits are NULL; a null limit skips the check with an early `return new`. When limits are decided, one `UPDATE config.plans SET max_events_per_user = N` activates enforcement with zero schema migration. This BEFORE INSERT approach is TOCTOU-safe: two concurrent event creates by the same user both pass a count-check at different times, but both hit the trigger inside the same transaction serialisation point.

**Files:** Migration `event_settings_02` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_02`**

Apply via `apply_migration` with:
- `name`: `event_settings_02_events_plan_fk`
- `query`:

```sql
-- event_settings_02: events.plan_id FK + free_plan_id() default + plan limit trigger

-- 1. Add nullable first (allows backfill before NOT NULL constraint)
alter table public.events
  add column if not exists plan_id uuid
    references config.plans(id) on delete restrict;
-- on delete restrict: cannot delete a plan tier while events reference it

-- 2. Backfill all existing events to free plan
update public.events
  set plan_id = (select id from config.plans where slug = 'free')
where plan_id is null;

-- 3. Make NOT NULL now that all rows are populated
alter table public.events alter column plan_id set not null;

-- 4. config.free_plan_id() — used as DEFAULT expression
--    PostgreSQL forbids subqueries as column defaults; a STABLE function is the workaround.
--    RAISE guard: fails loudly if event_settings_01 seed was skipped.
create or replace function config.free_plan_id()
returns uuid language plpgsql stable
set search_path = config, public, pg_temp   -- search_path hardened (SECURITY DEFINER best practice)
as $$
declare
  v_id uuid;
begin
  select id into v_id from config.plans where slug = 'free';
  if v_id is null then
    raise exception 'free plan not seeded — run event_settings_01 migration first';
  end if;
  return v_id;
end;
$$;

alter table public.events
  alter column plan_id set default config.free_plan_id();

-- 5. Index for plan-based queries
create index if not exists idx_events_plan_id on public.events (plan_id);

-- 6. Plan event-limit enforcement trigger (TOCTOU-safe scaffold)
--    SECURITY DEFINER: reads config.plans (caller role has no SELECT on raw table).
--    While max_events_per_user is NULL, trigger is a no-op (returns new immediately).
--    Populate config.plans.max_events_per_user to activate — no schema change needed.
create or replace function public.enforce_plan_event_limit()
returns trigger language plpgsql security definer
set search_path = public, config, pg_temp
as $$
declare
  v_limit int;
  v_count int;
begin
  select p.max_events_per_user into v_limit
  from config.plans p
  where p.id = new.plan_id;

  -- null = TBC / unlimited — skip enforcement
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.events
  where user_id = new.user_id
    and deleted_at is null
    and plan_id = new.plan_id;

  if v_count >= v_limit then
    raise exception 'plan_event_limit_exceeded: this plan allows at most % events', v_limit;
  end if;

  return new;
end;
$$;

create trigger trg_enforce_plan_event_limit
  before insert on public.events
  for each row execute function public.enforce_plan_event_limit();
```

- [ ] **Step 2: smoke test**

```sql
-- All events have plan_id (zero nulls)
select count(*) as total, count(plan_id) as with_plan from public.events;
-- Expected: total = with_plan

-- DEFAULT function returns the free plan UUID
select config.free_plan_id() = (select id from config.plans where slug = 'free') as ok;
-- Expected: t

-- Trigger is live on events table
select tgname from pg_trigger
where tgrelid = 'public.events'::regclass
  and tgname = 'trg_enforce_plan_event_limit';
-- Expected: 1 row
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_02 — events.plan_id FK + free_plan_id() + limit trigger scaffold (D41)"
```

---

### Task 3: event_settings_03 — `event_general_settings`

**Teaching:** `event_id` is the PRIMARY KEY — this is a 1:1 sidecar table; there is never a separate surrogate `id`. `user_id` is denormalised (even though it's derivable via `events.user_id`) so the RLS policy `user_id = auth.uid()` resolves in a single table scan with no JOIN — this is the project-wide pattern. The `discoverable` partial index exists now (NOT YET QUERIED) so the discovery feature ships without a schema migration. The `stamp_updated_by()` BEFORE UPDATE trigger auto-stamps `auth.uid()` on every UPDATE, preventing a client from writing an arbitrary UUID into the audit column.

**Files:** Migration `event_settings_03` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_03`**

Apply via `apply_migration` with:
- `name`: `event_settings_03_general_settings`
- `query`:

```sql
-- event_settings_03: event_general_settings + indexes + RLS + audit triggers

create table if not exists public.event_general_settings (
  event_id          uuid        primary key references public.events(id) on delete cascade,
  user_id           uuid        not null references auth.users(id) on delete cascade,

  -- Tagline: short vanity line under event title on website + invites.
  -- NULL = no tagline shown. Blank-after-trim rejected by check.
  -- tagline lives here (display pref), not on events (structural identity).
  tagline           text        check (
                      tagline is null
                      or (char_length(trim(tagline)) >= 1 and char_length(tagline) <= 80)
                    ),

  -- Default true (opt-out): new events are visible in the host's dashboard immediately.
  show_on_dashboard boolean     not null default true,

  -- Discovery stub. Default false = explicit opt-in when the feature ships.
  -- allow_ticket_sales excluded: weddings have no ticket entry concept.
  discoverable      boolean     not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid        references auth.users(id) on delete set null
);

-- Single-hop RLS filter
create index if not exists idx_event_general_settings_user
  on public.event_general_settings(user_id);

-- NOT YET QUERIED: partial index for future discovery feature.
-- Present now so the feature ships without a schema migration.
create index if not exists idx_event_general_settings_discoverable
  on public.event_general_settings(event_id) where discoverable = true;

-- updated_at stamp
create trigger trg_event_general_settings_updated_at
  before update on public.event_general_settings
  for each row execute function public.set_updated_at();

-- updated_by audit stamp (SECURITY DEFINER — auto-stamps auth.uid(), client cannot forge)
create trigger trg_event_general_settings_updated_by
  before update on public.event_general_settings
  for each row execute function public.stamp_updated_by();

-- RLS: owner-only (same pattern as every other settings table in the project)
alter table public.event_general_settings enable row level security;

create policy "owner_all" on public.event_general_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 2: smoke test**

```sql
-- Table and columns
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'event_general_settings'
order by ordinal_position;
-- Expected: event_id(uuid), user_id(uuid), tagline(text,null), show_on_dashboard(bool,true),
--           discoverable(bool,false), created_at, updated_at, updated_by

-- RLS enabled
select relrowsecurity from pg_class
where relname = 'event_general_settings' and relnamespace = 'public'::regnamespace;
-- Expected: t

-- Both triggers present
select tgname from pg_trigger
where tgrelid = 'public.event_general_settings'::regclass
order by tgname;
-- Expected: trg_event_general_settings_updated_at, trg_event_general_settings_updated_by
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_03 — event_general_settings + RLS + audit triggers (D42)"
```

---

### Task 4: event_settings_04 — `event_website_settings`

**Teaching:** `website_password_hash` stores a bcrypt hash — never plaintext. The `ck_website_password_required` constraint ensures the DB never holds a "password-enabled = true, hash = null" row — an inconsistent state the app layer could otherwise create by saving the toggle without hashing. The banner text constraint pair works the same way: `ck_announcement_text_required` ensures the DB is never left with an "enabled" banner that has no text. Partial indexes on `website_password_enabled` and `site_offline` cost nothing now and make future "find all password-protected events" queries fast without a migration.

**Files:** Migration `event_settings_04` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_04`**

Apply via `apply_migration` with:
- `name`: `event_settings_04_website_settings`
- `query`:

```sql
-- event_settings_04: event_website_settings + indexes + RLS + audit triggers

create table if not exists public.event_website_settings (
  event_id                    uuid        primary key references public.events(id) on delete cascade,
  user_id                     uuid        not null references auth.users(id) on delete cascade,

  -- Password protection.
  -- website_password_hash = bcrypt hash ONLY. Raw value returned once from request body
  -- at save time — never fetched from DB. Guest unlock via server-side bcrypt.compare()
  -- only, rate-limited 5 attempts / 15 min per IP.
  website_password_enabled    boolean     not null default false,
  website_password_hash       text,
  constraint ck_website_password_required check (
    not website_password_enabled
    or website_password_hash is not null
  ),

  -- Search engine indexing (default OFF — private wedding, not a public page)
  search_indexing_enabled     boolean     not null default false,

  -- Announcement banner
  announcement_banner_enabled boolean     not null default false,
  announcement_banner_text    text        check (char_length(announcement_banner_text) <= 160),
  constraint ck_announcement_text_required check (
    not announcement_banner_enabled
    or (announcement_banner_text is not null and trim(announcement_banner_text) <> '')
  ),

  -- Take website offline (guests see "offline" page; admin still has access)
  site_offline                boolean     not null default false,

  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  updated_by   uuid           references auth.users(id) on delete set null
);

create index if not exists idx_event_website_settings_user
  on public.event_website_settings(user_id);

-- Fast lookup for future "find all password-protected events" query
create index if not exists idx_event_website_settings_pw_on
  on public.event_website_settings(event_id) where website_password_enabled = true;

-- Fast lookup for future "site health / offline events" query
create index if not exists idx_event_website_settings_offline
  on public.event_website_settings(event_id) where site_offline = true;

create trigger trg_event_website_settings_updated_at
  before update on public.event_website_settings
  for each row execute function public.set_updated_at();

create trigger trg_event_website_settings_updated_by
  before update on public.event_website_settings
  for each row execute function public.stamp_updated_by();

alter table public.event_website_settings enable row level security;

create policy "owner_all" on public.event_website_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 2: smoke test**

```sql
-- Check constraints present
select constraint_name from information_schema.table_constraints
where table_schema = 'public' and table_name = 'event_website_settings'
  and constraint_type = 'CHECK';
-- Expected: ck_website_password_required, ck_announcement_text_required
--           (plus column-level check on announcement_banner_text length)

-- Verify the hash-required constraint fires
do $$
begin
  begin
    insert into public.event_website_settings (event_id, user_id, website_password_enabled)
    values ('00000000-0000-0000-0000-000000000099'::uuid,
            '00000000-0000-0000-0000-000000000099'::uuid, true);
    raise exception 'constraint should have fired — test failed';
  exception when check_violation then
    raise notice 'OK: ck_website_password_required fired as expected';
  end;
end $$;

-- Triggers present
select tgname from pg_trigger
where tgrelid = 'public.event_website_settings'::regclass
order by tgname;
-- Expected: trg_event_website_settings_updated_at, trg_event_website_settings_updated_by
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_04 — event_website_settings + bcrypt constraint + RLS (D43)"
```

---

### Task 5: event_settings_05 — `event_guest_settings`

**Teaching:** `max_plus_ones_per_invite` is `smallint` (2-byte int, -32768 to 32767) — it only ever stores 0–10, so a 4-byte `int` wastes space. The DB check enforces `0–10` independently of app validation. The `allow_plus_ones` toggle and `max_plus_ones_per_invite` cap are intentionally uncoupled at the DB level — if they were coupled (cap auto-zeroes when toggle is off), a host toggling the feature off and back on would lose their configured cap. The view in Task 6 computes `effective_max_plus_ones = null` when the toggle is off, giving the RSVP flow a single column to read. `default_guest_message = null` means "no message"; the service layer must coerce `""` → `null` before writes (empty string stored means the RSVP page shows a blank message box).

**Files:** Migration `event_settings_05` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_05`**

Apply via `apply_migration` with:
- `name`: `event_settings_05_guest_settings`
- `query`:

```sql
-- event_settings_05: event_guest_settings + index + RLS + audit triggers

create table if not exists public.event_guest_settings (
  event_id                    uuid        primary key references public.events(id) on delete cascade,
  user_id                     uuid        not null references auth.users(id) on delete cascade,

  -- RSVP controls
  rsvp_enabled                boolean     not null default true,
  rsvp_deadline               timestamptz null,   -- null = no deadline enforced

  -- Plus-one controls
  -- allow_plus_ones / max_plus_ones_per_invite are decoupled (app-layer relationship only).
  -- DB never zeros the cap when toggle is off — preserves host's configured value.
  -- RSVP flow must read effective_max_plus_ones from event_guest_settings_view.
  allow_plus_ones             boolean     not null default true,
  max_plus_ones_per_invite    smallint    not null default 2
                              constraint chk_max_plus_ones_range
                              check (max_plus_ones_per_invite >= 0
                                 and max_plus_ones_per_invite <= 10),

  -- RSVP data collection
  collect_dietary_notes       boolean     not null default true,

  -- Default message shown to guests on their invite/RSVP page.
  -- Service layer MUST coerce "" → null before write (empty string ≠ no message).
  default_guest_message       text        null
                              constraint chk_default_guest_message_length
                              check (default_guest_message is null
                                  or char_length(default_guest_message) <= 400),

  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  updated_by   uuid           references auth.users(id) on delete set null
);

create index if not exists idx_event_guest_settings_user
  on public.event_guest_settings(user_id);

create trigger trg_event_guest_settings_updated_at
  before update on public.event_guest_settings
  for each row execute function public.set_updated_at();

create trigger trg_event_guest_settings_updated_by
  before update on public.event_guest_settings
  for each row execute function public.stamp_updated_by();

alter table public.event_guest_settings enable row level security;

create policy "owner_all" on public.event_guest_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
```

- [ ] **Step 2: smoke test**

```sql
select column_name, data_type, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'event_guest_settings'
order by ordinal_position;
-- Expected: event_id, user_id, rsvp_enabled(t), rsvp_deadline(null),
--           allow_plus_ones(t), max_plus_ones_per_invite(smallint,2),
--           collect_dietary_notes(t), default_guest_message(null), ...

-- Verify range check fires
do $$
begin
  begin
    insert into public.event_guest_settings
      (event_id, user_id, max_plus_ones_per_invite)
    values
      ('00000000-0000-0000-0000-000000000099'::uuid,
       '00000000-0000-0000-0000-000000000099'::uuid, 15);
    raise exception 'constraint should have fired — test failed';
  exception when check_violation then
    raise notice 'OK: chk_max_plus_ones_range fired as expected';
  end;
end $$;
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_05 — event_guest_settings + RLS + audit triggers (D44)"
```

---

### Task 6: event_settings_06a — SECURITY INVOKER views

**Teaching:** `security_invoker = true` means the view runs with the *calling user's* credentials, not the view owner's. Without this, Supabase views default to SECURITY DEFINER (runs as `postgres`) which bypasses RLS — a critical cross-tenant leak. With `security_invoker = true`, the owner-only RLS policies on the underlying tables still apply, so a user can only see their own rows. `website_password_hash` is intentionally absent from `event_website_settings_view` — the hash must never be projected to clients; hash comparison for guest unlock happens only inside a dedicated SECURITY DEFINER API function. `effective_max_plus_ones` in the guest view means the RSVP flow reads one column instead of checking two flags every time.

**Files:** Migration `event_settings_06a` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_06a`**

Apply via `apply_migration` with:
- `name`: `event_settings_06a_views`
- `query`:

```sql
-- event_settings_06a: 3 SECURITY INVOKER views for the settings tables

-- ─────────────────────────────────────────
-- D46: event_general_settings_view
-- Joins events for event_name, event_date, event_details (partner names).
-- Single-query data loader for the General tab.
-- ─────────────────────────────────────────
create or replace view public.event_general_settings_view
  with (security_invoker = true) as
select
  gs.event_id,
  gs.user_id,
  gs.tagline,
  gs.show_on_dashboard,
  gs.discoverable,
  gs.created_at,
  gs.updated_at,
  gs.updated_by,
  e.name          as event_name,
  e.primary_date  as event_date,
  e.event_details              -- jsonb: partner_1_name, partner_2_name, etc.
from public.event_general_settings gs
join public.events e on e.id = gs.event_id;

-- ─────────────────────────────────────────
-- D47: event_website_settings_view
-- Computes expiry fields from events.primary_date (not stored — avoids drift on date edit).
-- website_password_hash EXCLUDED: hash must never leave the server.
-- ─────────────────────────────────────────
create or replace view public.event_website_settings_view
  with (security_invoker = true) as
select
  ws.event_id,
  ws.user_id,
  ws.website_password_enabled,
  -- website_password_hash intentionally NOT projected (bcrypt hash stays server-side only)
  ws.search_indexing_enabled,
  ws.announcement_banner_enabled,
  ws.announcement_banner_text,
  ws.site_offline,
  -- website_expires_at: primary_date + 60 days as timestamptz; null when date not set
  case when e.primary_date is not null
    then (e.primary_date + interval '60 days')::timestamptz
    else null end                                            as website_expires_at,
  -- website_days_remaining: interval; null when date not set
  case when e.primary_date is not null
    then (e.primary_date + interval '60 days') - current_date
    else null end                                            as website_days_remaining,
  -- website_expired: false when date not set (not-yet-expired is the safe default)
  case when e.primary_date is not null
    then current_date > (e.primary_date + interval '60 days')
    else false end                                           as website_expired,
  ws.created_at,
  ws.updated_at,
  ws.updated_by
from public.event_website_settings ws
join public.events e on e.id = ws.event_id;

-- ─────────────────────────────────────────
-- D48: event_guest_settings_view
-- effective_max_plus_ones: null when toggle off — RSVP flow reads ONE column.
-- ─────────────────────────────────────────
create or replace view public.event_guest_settings_view
  with (security_invoker = true) as
select
  gs.event_id,
  gs.user_id,
  gs.rsvp_enabled,
  gs.rsvp_deadline,
  gs.allow_plus_ones,
  gs.max_plus_ones_per_invite,
  -- null when allow_plus_ones = false so RSVP flow never double-checks both flags
  case when gs.allow_plus_ones
    then gs.max_plus_ones_per_invite
    else null end                                            as effective_max_plus_ones,
  gs.collect_dietary_notes,
  gs.default_guest_message,
  gs.created_at,
  gs.updated_at,
  gs.updated_by
from public.event_guest_settings gs;
```

- [ ] **Step 2: smoke test**

```sql
-- All 3 views exist
select table_name from information_schema.views
where table_schema = 'public'
  and table_name in (
    'event_general_settings_view',
    'event_website_settings_view',
    'event_guest_settings_view'
  );
-- Expected: 3 rows

-- security_invoker is set (reloptions must include 'security_invoker=true')
select relname, reloptions from pg_class
where relkind = 'v'
  and relnamespace = 'public'::regnamespace
  and relname in (
    'event_general_settings_view',
    'event_website_settings_view',
    'event_guest_settings_view'
  );
-- Expected: all 3 rows have reloptions containing security_invoker=true

-- website_password_hash MUST NOT appear in the website view
select count(*) from information_schema.columns
where table_schema = 'public'
  and table_name = 'event_website_settings_view'
  and column_name = 'website_password_hash';
-- Expected: 0
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_06a — 3 SECURITY INVOKER settings views (D46–D48)"
```

---

### Task 7: event_settings_06b — `_seed_event_settings()` + `create_event_with_details` re-extension

**Teaching:** Adding 3 new seed inserts to `create_event_with_details` crosses the D36 threshold (4th+ catalog-copy seed block). The project rule is to extract a named `_seed_*()` helper at that point. The underscore prefix marks it as an internal function — not a client-callable RPC. After creation, `REVOKE EXECUTE ... FROM public, anon, authenticated` removes the default execute grant that PostgreSQL auto-applies. Only `service_role` (which `create_event_with_details` runs as, being SECURITY DEFINER) can call it. `ON CONFLICT (event_id) DO NOTHING` makes every seed call idempotent — `create_event_with_details` can be called twice for the same event_id without error or double-insertion.

The `create_event_with_details` re-extension is a full `CREATE OR REPLACE` — PostgreSQL has no "alter function body" command. The only diff from the current function is the addition of step 9 (one `perform` line before the final `return`).

**Files:** Migration `event_settings_06b` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_06b`**

Apply via `apply_migration` with:
- `name`: `event_settings_06b_seed_function`
- `query`:

```sql
-- event_settings_06b: _seed_event_settings() helper + create_event_with_details() step 9

-- ─────────────────────────────────────────
-- 1. _seed_event_settings — D45 helper
--    Bundles 3 settings inserts. Called only from create_event_with_details().
-- ─────────────────────────────────────────
create or replace function public._seed_event_settings(p_event_id uuid, p_user_id uuid)
returns void language plpgsql
security definer
set search_path = public, pg_temp   -- hardened against search_path injection
as $$
begin
  -- Defaults: tagline null, show_on_dashboard true, discoverable false
  insert into public.event_general_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;

  -- Defaults: all flags false, password_hash null, site_offline false
  insert into public.event_website_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;

  -- Defaults: rsvp_enabled true, deadline null, allow_plus_ones true, cap 2, dietary true
  insert into public.event_guest_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;
end;
$$;

-- Revoke: not a client RPC — internal to create_event_with_details only
revoke execute on function public._seed_event_settings(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public._seed_event_settings(uuid, uuid) to service_role;

-- ─────────────────────────────────────────
-- 2. create_event_with_details — add step 9 (settings seed)
--    Full CREATE OR REPLACE required (no "alter function body" in PostgreSQL).
--    Diff from current: one "perform" line added before "return json_build_object".
-- ─────────────────────────────────────────
create or replace function public.create_event_with_details(
  p_user_id        uuid,
  p_event_type_id  uuid,
  p_name           text,
  p_primary_date   date,
  p_primary_venue  text,
  p_guest_capacity integer,
  p_metadata       jsonb,
  p_sub_events     jsonb
)
returns json language plpgsql
security definer
set search_path to ''   -- fully-qualified names throughout (existing convention)
as $function$
declare
  v_uid        uuid := auth.uid();
  v_event_id   uuid;
  v_created_at timestamptz;
  v_details    jsonb;
  v_pending    uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select coalesce(jsonb_object_agg(elem->>'key', elem->>'value'), '{}'::jsonb)
    into v_details
  from jsonb_array_elements(coalesce(p_metadata, '[]'::jsonb)) elem
  where elem->>'key' is not null;

  insert into public.events (user_id, created_by, event_type_id, name,
                             primary_date, primary_venue, guest_capacity, event_details, status)
  values (v_uid, v_uid, p_event_type_id, p_name,
          p_primary_date, p_primary_venue, p_guest_capacity, v_details, 'draft')
  returning id, created_at into v_event_id, v_created_at;

  -- 1) sub-events
  insert into public.event_sub_events (event_id, event_sub_type_id, custom_name, display_order)
  select v_event_id,
         nullif(elem->>'sub_event_type_id','')::uuid,
         nullif(elem->>'custom_name',''),
         coalesce((elem->>'display_order')::int, 0)
  from jsonb_array_elements(coalesce(p_sub_events, '[]'::jsonb)) elem;

  -- 2) tasks from checklist catalog
  v_pending := (select id from config.task_statuses where slug = 'pending');
  insert into public.event_tasks (event_id, template_id, title, description, display_order, priority_id, status_id)
  select v_event_id, c.id, c.title, c.description, c.display_order,
         coalesce(pr.id, (select id from config.task_priorities where slug = 'med')),
         v_pending
  from config.event_checklists c
  left join config.task_priorities pr on pr.slug = c.default_priority_slug
  where c.event_type_id = p_event_type_id and c.enabled;

  -- 3) expense types from catalog
  insert into public.event_expense_types (event_id, name, icon_name, source_slug, is_custom, display_order)
  select v_event_id, et.name, et.icon_name, et.slug, false, et.display_order
  from config.expense_types et where et.enabled;

  -- 4) budget scaffold
  insert into public.event_budgets (event_id, total_amount) values (v_event_id, 0);

  -- 5) guest-tag catalog seed
  insert into public.event_guest_tags (event_id, name, is_custom, source_slug, created_by, display_order)
  select v_event_id, gt.name, false, gt.slug, null, gt.display_order
  from config.guest_tags gt
  where gt.enabled
  order by gt.display_order
  on conflict (event_id, lower(name)) do nothing;

  -- 6) album-preset catalog seed
  insert into public.event_albums (event_id, name, is_custom, source_slug, created_by, display_order)
  select v_event_id, ap.name, false, ap.slug, null, ap.display_order
  from config.album_presets ap
  where ap.enabled
  order by ap.display_order
  on conflict (event_id, lower(name)) do nothing;

  -- 7) default invitation card (main event only — I5 decision)
  insert into public.event_invitation_cards (
    event_id, sub_event_id, is_default, template_id,
    slot_date, slot_venue, is_custom, render_status
  )
  select
    v_event_id, null, true,
    (select id from config.invitation_templates where slug = 'eternal'),
    p_primary_date::text, p_primary_venue, false, 'draft'
  where not exists (
    select 1 from public.event_invitation_cards
    where event_id = v_event_id
      and sub_event_id is null
      and is_default = true
  );

  -- 8) seed event settings: general + website + guest (D45 / D36 threshold)
  perform public._seed_event_settings(v_event_id, v_uid);

  return json_build_object(
    'event_id',     v_event_id,
    'event_name',   p_name,
    'event_status', 'draft',
    'created_at',   v_created_at
  );
end;
$function$;
```

- [ ] **Step 2: smoke test**

```sql
-- _seed_event_settings is SECURITY DEFINER
select proname, prosecdef
from pg_proc
where proname = '_seed_event_settings'
  and pronamespace = 'public'::regnamespace;
-- Expected: prosecdef = t

-- execute grant: only service_role (anon/authenticated must be absent)
select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public'
  and routine_name = '_seed_event_settings';
-- Expected: service_role | EXECUTE only (no anon, no authenticated)

-- create_event_with_details now calls _seed_event_settings
select pg_get_functiondef(oid) ilike '%_seed_event_settings%' as has_seed_call
from pg_proc
where proname = 'create_event_with_details'
  and pronamespace = 'public'::regnamespace;
-- Expected: t
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_06b — _seed_event_settings() helper + create_event_with_details step 8 (D45)"
```

---

### Task 8: event_settings_07 — `config.plans_public` anon-safe view

**Teaching:** `config.plans` is not directly accessible by the `anon` role — it contains the `features` jsonb catch-all which is internal (maps TBC flags not yet columnarised, unsuitable for public exposure). `plans_public` strips that column and adds `WHERE is_active = true` so deactivated tiers disappear from the pricing page automatically without any app code change. Both `anon` and `authenticated` get SELECT — a signed-out user on the pricing page must be able to query it.

**Files:** Migration `event_settings_07` via Supabase MCP.

- [ ] **Step 1: apply migration `event_settings_07`**

Apply via `apply_migration` with:
- `name`: `event_settings_07_plans_public_view`
- `query`:

```sql
-- event_settings_07: config.plans_public — anon-safe projection of config.plans
-- Strips features jsonb (internal catch-all). Active plans only.
create or replace view config.plans_public as
select
  id,
  slug,
  name,
  sort_order,
  is_active,
  price_inr,
  custom_domain,
  priority_support,
  ai_features
from config.plans
where is_active = true;

grant select on config.plans_public to anon, authenticated;
```

- [ ] **Step 2: smoke test**

```sql
-- View exists in config schema
select table_name from information_schema.views
where table_schema = 'config' and table_name = 'plans_public';
-- Expected: 1 row

-- features column absent from the view
select count(*) from information_schema.columns
where table_schema = 'config' and table_name = 'plans_public'
  and column_name = 'features';
-- Expected: 0

-- Correct rows visible
select slug, price_inr from config.plans_public order by sort_order;
-- Expected: free (0), premium (4900), elite (9900)
```

- [ ] **Step 3: commit**

```bash
git add -A
git commit -m "feat(db): event_settings_07 — config.plans_public anon view (D40a)"
```

---

### Task 9: End-to-end integration smoke test

Verify that `create_event_with_details` now seeds all 3 settings rows on event creation, and that all 3 views resolve correctly.

- [ ] **Step 1: get a real user UUID and the wedding event type UUID**

```sql
-- Pick any row from auth.users (service_role can read this)
select id from auth.users limit 1;

-- Get the wedding event type
select id from config.event_types where slug = 'wedding';
```

Note both UUIDs — substitute them in Steps 2 and 3.

- [ ] **Step 2: create a test event via the RPC**

```sql
-- Run via execute_sql (service_role context bypasses auth.uid() check in the function)
-- Substitute <user-uuid> and <event-type-uuid> from Step 1
select public.create_event_with_details(
  '<user-uuid>'::uuid,
  '<event-type-uuid>'::uuid,
  'ES Smoke Test Wedding',
  '2027-02-14'::date,
  'Smoke Test Venue',
  80,
  '[{"key":"partner_1_name","value":"Priya"},{"key":"partner_2_name","value":"Ravi"}]'::jsonb,
  '[]'::jsonb
);
-- Note the returned event_id
```

- [ ] **Step 3: verify all 3 settings rows and their defaults**

```sql
-- Substitute <event-id> from Step 2
select 'general' as t, count(*) from public.event_general_settings where event_id = '<event-id>'
union all
select 'website', count(*) from public.event_website_settings where event_id = '<event-id>'
union all
select 'guest',   count(*) from public.event_guest_settings   where event_id = '<event-id>';
-- Expected: all 3 = 1

-- Verify defaults
select show_on_dashboard, discoverable, tagline
from public.event_general_settings where event_id = '<event-id>';
-- Expected: t | f | null

select website_password_enabled, site_offline, search_indexing_enabled
from public.event_website_settings where event_id = '<event-id>';
-- Expected: f | f | f

select rsvp_enabled, allow_plus_ones, max_plus_ones_per_invite
from public.event_guest_settings where event_id = '<event-id>';
-- Expected: t | t | 2
```

- [ ] **Step 4: verify views resolve and compute correctly**

```sql
-- General view: event_name populated via JOIN
select tagline, event_name, event_date
from public.event_general_settings_view where event_id = '<event-id>';
-- Expected: null | ES Smoke Test Wedding | 2027-02-14

-- Website view: expires_at computed from primary_date + 60 days
select website_password_enabled, website_expires_at, website_expired
from public.event_website_settings_view where event_id = '<event-id>';
-- Expected: f | 2027-04-15 00:00:00+00 | f

-- Guest view: effective_max_plus_ones = 2 (allow_plus_ones = true)
select effective_max_plus_ones
from public.event_guest_settings_view where event_id = '<event-id>';
-- Expected: 2

-- Toggle off → effective cap becomes null
update public.event_guest_settings
  set allow_plus_ones = false where event_id = '<event-id>';
select effective_max_plus_ones
from public.event_guest_settings_view where event_id = '<event-id>';
-- Expected: null
-- Reset:
update public.event_guest_settings
  set allow_plus_ones = true where event_id = '<event-id>';
```

- [ ] **Step 5: clean up test event**

```sql
delete from public.events
where name = 'ES Smoke Test Wedding' and status = 'draft';
-- CASCADE propagates: all 3 settings rows deleted automatically
```

---

### Task 10: Regenerate TypeScript types

**Teaching:** `supabase gen types typescript` defaults to the `public` schema only. Adding `--schema public,config` includes `config.plans`, `config.plans_public`, and the new settings tables and views. Without this flag, any frontend type import for plan-related queries would resolve to `any` or fail to compile. The output overwrites `lib/supabase/database.types.ts` entirely — this is the expected behaviour.

**Files:** Modify `lib/supabase/database.types.ts`.

- [ ] **Step 1: generate types via Supabase MCP**

Use `mcp__2b7b199a-87b8-457a-a447-a3cb163b5b0f__generate_typescript_types` with:
- `project_id`: `smjkbmkxweevqpvygabe`
- `schemas`: `["public", "config"]`

Write the full output to `lib/supabase/database.types.ts`.

- [ ] **Step 2: verify new types are present**

```bash
grep -n "event_general_settings\|event_website_settings\|event_guest_settings\|config.*plans" lib/supabase/database.types.ts | head -30
```

Expected: type definitions for all 3 settings tables, their views, `config.plans`, and `config.plans_public`.

- [ ] **Step 3: confirm TypeScript compiles**

```bash
npm run build 2>&1 | head -30
# or: npx tsc --noEmit 2>&1 | head -20
```

Expected: zero new type errors (there may be pre-existing errors from other parts of the codebase — only flag NEW ones introduced by the type change).

- [ ] **Step 4: commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(types): regenerate database.types.ts — add config schema + event settings types (D40–D48)"
```

---

### Task 11: Sync DATA-MODEL.md (D40–D48)

**Files:** Modify `docs/data-model/DATA-MODEL.md`.

- [ ] **Step 1: read current DATA-MODEL.md to find insertion point**

Read `docs/data-model/DATA-MODEL.md`. Locate the last decision entry (D39 — from media_06). Insert the new block immediately after it.

- [ ] **Step 2: append D40–D48**

Add the following section after D39:

```markdown
### Event Settings Module (D40–D48)

| Decision | Description |
|---|---|
| D40 | `config.plans` — per-event purchase tier catalog; `max_*` limits nullable (TBC = unlimited); feature flags (custom_domain, priority_support, ai_features) fixed per prototype; `features` jsonb catch-all for TBC flags not yet columnarised; authenticated SELECT only (raw table has internal `features` column) |
| D40a | `config.plans_public` view — strips `features` jsonb; active plans only (WHERE is_active = true); anon + authenticated SELECT; pricing pages use this, not the base table |
| D41 | `events.plan_id` — UUID FK to config.plans, ON DELETE RESTRICT; default via `config.free_plan_id()` STABLE function (PG forbids subquery as column default); RAISE guard if free plan not seeded; `enforce_plan_event_limit` BEFORE INSERT trigger scaffolded TOCTOU-safe (no-op while limits are null, auto-activates when populated) |
| D42 | `event_general_settings` — tagline + visibility prefs; event_id as PK (1:1 sidecar); tagline lives here (display pref), not on events (structural identity); `allow_ticket_sales` excluded (weddings have no ticket entry); `discoverable` stub false by default; partial index pre-created for future discovery query |
| D43 | `event_website_settings` — website controls; `website_password_hash` stores bcrypt hash (never plaintext); `website_expires_at` computed in view from events.primary_date (not stored — prevents drift); `ck_website_password_required` constraint; public read path must use anon RLS or SECURITY DEFINER function only (never service_role); website pages/content deferred to Digital Presence module |
| D44 | `event_guest_settings` — RSVP + plus-one prefs; allow_plus_ones/cap decoupled at DB level (cap preserved when toggle off); service layer must coerce "" → null for default_guest_message; RSVP flow must read effective_max_plus_ones from view (not base table) |
| D45 | `_seed_event_settings(p_event_id, p_user_id)` SECURITY DEFINER helper — bundles 3 settings inserts; extracted from create_event_with_details() per D36 (4th+ catalog-copy seed → extract); REVOKE from public/anon/authenticated; GRANT to service_role only; ON CONFLICT DO NOTHING (idempotent) |
| D46 | `event_general_settings_view` — SECURITY INVOKER; joins events for event_name, event_date, event_details (partner names); one-query data loader for General tab |
| D47 | `event_website_settings_view` — SECURITY INVOKER; computes website_expires_at/days_remaining/expired from events.primary_date; website_password_hash excluded from view (never projected to clients) |
| D48 | `event_guest_settings_view` — SECURITY INVOKER; computes effective_max_plus_ones (null when allow_plus_ones = false) so RSVP flow reads one column instead of checking two flags |
```

- [ ] **Step 3: commit**

```bash
git add docs/data-model/DATA-MODEL.md
git commit -m "docs(data-model): add D40-D48 Event Settings module decisions"
```

---

### Task 12: Sync ERD.md + evenzi-erd.drawio

**Files:** Modify `docs/data-model/ERD.md` and `docs/data-model/evenzi-erd.drawio`.

- [ ] **Step 1: read current ERD.md**

Read `docs/data-model/ERD.md`. Locate the Mermaid `erDiagram` block and the Event section.

- [ ] **Step 2: add 4 new entity blocks to ERD.md Mermaid diagram**

In the `erDiagram` block, add:

```
config_plans {
  uuid id PK
  text slug UK
  text name
  int sort_order
  boolean is_active
  int price_inr
  int max_events_per_user "nullable"
  int max_guests "nullable"
  int max_photos "nullable"
  int max_admins "nullable"
  boolean custom_domain
  boolean priority_support
  boolean ai_features
  jsonb features
  timestamptz created_at
  timestamptz updated_at
}

event_general_settings {
  uuid event_id PK-FK
  uuid user_id FK
  text tagline "nullable"
  boolean show_on_dashboard
  boolean discoverable
  timestamptz created_at
  timestamptz updated_at
  uuid updated_by "nullable,FK"
}

event_website_settings {
  uuid event_id PK-FK
  uuid user_id FK
  boolean website_password_enabled
  text website_password_hash "bcrypt,nullable"
  boolean search_indexing_enabled
  boolean announcement_banner_enabled
  text announcement_banner_text "nullable"
  boolean site_offline
  timestamptz created_at
  timestamptz updated_at
  uuid updated_by "nullable,FK"
}

event_guest_settings {
  uuid event_id PK-FK
  uuid user_id FK
  boolean rsvp_enabled
  timestamptz rsvp_deadline "nullable"
  boolean allow_plus_ones
  smallint max_plus_ones_per_invite
  boolean collect_dietary_notes
  text default_guest_message "nullable"
  timestamptz created_at
  timestamptz updated_at
  uuid updated_by "nullable,FK"
}
```

Add these relationships (in the relationships section):

```
events ||--o| event_general_settings : "has general settings"
events ||--o| event_website_settings : "has website settings"
events ||--o| event_guest_settings : "has guest settings"
events }o--|| config_plans : "on plan"
```

- [ ] **Step 3: update evenzi-erd.drawio**

Open `docs/data-model/evenzi-erd.drawio` in a text editor (it is XML). Add 4 new table blocks following the existing table visual pattern. Place `config.plans` in the `config` schema zone (if one exists) and the 3 settings tables adjacent to the `events` table block. Add FK connector arrows for all 4 new relationships. Match the existing visual style (colours, font, connector routing).

- [ ] **Step 4: commit**

```bash
git add docs/data-model/ERD.md docs/data-model/evenzi-erd.drawio
git commit -m "docs(data-model): add Event Settings tables to ERD (D40-D48)"
```

---

### Task 13: Update NEXT-SESSION.md

**Files:** Modify `docs/NEXT-SESSION.md`.

- [ ] **Step 1: read current NEXT-SESSION.md and update**

Replace the Invitations note with a completed status and add the next slice.

The file should reflect:
- **Event Settings data model (D40–D48):** DONE — `config.plans`, `events.plan_id`, `event_general_settings`, `event_website_settings`, `event_guest_settings`, 3 SECURITY INVOKER views, `_seed_event_settings()`, `config.plans_public`. All migrations on dev Supabase. Types regenerated. Docs synced.
- **Next:** Event Settings FE integration — read `designs/pages/event-settings/` and wire the 3 settings tables to the UI. See `docs/data-model/FE-INTEGRATION.md` for RLS constraints + service-layer contracts (D43 bcrypt note, D44 empty-string coercion note).

- [ ] **Step 2: commit**

```bash
git add docs/NEXT-SESSION.md
git commit -m "docs: NEXT-SESSION — event settings data model done; FE integration next"
```

---

## Self-Review Against Spec

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `config.plans` catalog + seed + RLS | Task 1 |
| `events.plan_id` FK + `free_plan_id()` + limit trigger | Task 2 |
| `event_general_settings` + indexes + RLS + triggers | Task 3 |
| `event_website_settings` + constraints + indexes + RLS + triggers | Task 4 |
| `event_guest_settings` + constraints + index + RLS + triggers | Task 5 |
| 3 SECURITY INVOKER views (D46–D48) | Task 6 |
| `_seed_event_settings()` SECURITY DEFINER + REVOKE | Task 7 |
| `create_event_with_details` step 9 re-extension | Task 7 |
| `config.plans_public` anon-safe view | Task 8 |
| TypeScript types `--schema public,config` | Task 10 |
| DATA-MODEL.md D40–D48 | Task 11 |
| ERD.md + evenzi-erd.drawio sync (rule #8) | Task 12 |

**Placeholder scan:** None — all steps contain complete SQL.

**Type consistency:** `_seed_event_settings(p_event_id uuid, p_user_id uuid)` defined in Task 7 step 1 and called as `perform public._seed_event_settings(v_event_id, v_uid)` in the same task (same step). The `v_uid` variable in `create_event_with_details` is `uuid := auth.uid()` — correct argument type. All view columns reference base table column names exactly as defined in Tasks 3–5.

**Teaching note coverage:** Every migration task includes a teaching note explaining the design decision behind the SQL. This honours the project's `feedback_supabase_teaching_mode` memory: narrate the SQL before running DDL.
