# Event Settings Data Model — Design Spec

**Date:** 2026-06-17
**Status:** Approved (post-council, fixes folded 2026-06-17)
**Module:** Event Settings (event_settings_01 – event_settings_08)
**Slice scope:** Card/settings data model only — General, Website, Guest List tabs.
**Deferred:** Registry (own child table, future slice), Website Pages / Digital Presence module, Plan & Billing limit enforcement (limits scaffolded as nullable stubs).

---

## Context

The Event Settings page (`designs/pages/event-settings/`) has six tabs:

| Tab | DB scope | Notes |
|---|---|---|
| General | `event_general_settings` | New table |
| Website | `event_website_settings` | New table |
| Admins | — | `event_collaborators` already exists |
| Guest list | `event_guest_settings` | New table |
| Registry | — | **Deferred** — own child table, future slice |
| Plan & billing | `config.plans` + `events.plan_id` | Scaffold only, limits TBC |

All prior modules are live on dev Supabase (`smjkbmkxweevqpvygabe`).
DATA-MODEL.md is at v2026-06-17.2 (D1–D39). This slice adds D40–D48.

---

## Business Rules

- **Per-event purchase model.** Each event has its own plan tier. A user pays per event to upgrade it (not a per-user subscription).
- **Free tier for all events.** Every newly created event defaults to the free plan.
- **User event limit.** The free tier limits how many events a user can create. The exact limit is TBC — stored as a nullable column in `config.plans`. A `BEFORE INSERT` trigger on `events` enforces the limit at DB level (TOCTOU-safe); even while `max_events_per_user` is `null`, the trigger scaffold must exist before the column is populated.
- **Plan limits are TBC.** All numeric limit columns in `config.plans` are `int nullable` — `null` means "unlimited / not yet decided". Feature flags (`custom_domain`, `priority_support`, `ai_features`) are set per the prototype.
- **Registry.** Will be a child table with `event_id + user_id`, supporting N external links + a cash fund. Deferred to its own slice.
- **Admins tab.** Already modelled by `event_collaborators` — no schema work needed.
- **Ticket sales.** Not applicable — Evenzi is a wedding/event planning platform; there is no ticketed entry concept.

---

## Architecture

Three 1:1 settings tables (one per domain), each with `event_id` as PK (not a surrogate `id`) and `user_id` denormalised for single-hop RLS. One catalog table (`config.plans`) and one FK addition on `events`. All share the same owner-only RLS pattern used across every existing module.

```
events
  ├── event_general_settings    (1:1, event_settings_03)
  ├── event_website_settings    (1:1, event_settings_04)
  ├── event_guest_settings      (1:1, event_settings_05)
  └── plan_id → config.plans    (FK, event_settings_02)

config.plans                    (catalog, event_settings_01)
config.plans_public             (anon-safe view, event_settings_07)
```

`create_event_with_details()` seeds all three settings rows. Adding 3 new seeds crosses the D36 threshold → extract `_seed_event_settings()` helper inside the function (event_settings_06b).

---

## Table Specifications

### `config.plans` — D40

Catalog table in the `config` schema. Read-only from the application layer (populated by migrations only). Public SELECT; no INSERT/UPDATE/DELETE via app roles.

```sql
create table config.plans (
  id                   uuid        primary key default gen_random_uuid(),
  slug                 text        not null unique,   -- free | premium | elite
  name                 text        not null,
  sort_order           int         not null default 0,
  is_active            boolean     not null default true,
  price_inr            int         not null default 0, -- rupees, whole number
  -- User-level limits (null = TBC / unlimited)
  max_events_per_user  int         null,
  -- Event-level limits (null = TBC / unlimited)
  max_guests           int         null,
  max_photos           int         null,
  max_admins           int         null,
  -- Feature flags
  custom_domain        boolean     not null default false,
  priority_support     boolean     not null default false,
  ai_features          boolean     not null default false,
  -- Catch-all for TBC features not yet columnarised
  features             jsonb       not null default '{}',
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Seed data
insert into config.plans (slug, name, sort_order, price_inr,
  custom_domain, priority_support, ai_features) values
  ('free',    'Free',    0,    0, false, false, false),
  ('premium', 'Premium', 1, 4900, true,  true,  false),
  ('elite',   'Elite',   2, 9900, true,  true,  true );
-- All limit columns remain NULL (TBC).

-- RLS: authenticated SELECT only (raw table — features jsonb is internal)
alter table config.plans enable row level security;
create policy "plans_authenticated_select" on config.plans
  for select to authenticated using (true);
-- anon role gets only the public projection view (see config.plans_public below)

-- Schema grants
grant usage on schema config to anon, authenticated;
grant select on config.plans to authenticated;  -- NOT anon
```

**`config.plans_public` view** (D40a — in event_settings_07 migration):
Exposes only non-internal columns to the `anon` role. The `features` jsonb catch-all must never be visible to unauthenticated callers.

```sql
create view config.plans_public as
  select id, slug, name, sort_order, is_active, price_inr,
         custom_domain, priority_support, ai_features
  from config.plans
  where is_active = true;

grant select on config.plans_public to anon, authenticated;
```

---

### `events.plan_id` — D41

Uncomments the `[PLANNED]` column on `public.events`.

```sql
-- Add nullable first
alter table public.events
  add column plan_id uuid references config.plans(id) on delete restrict;

-- Backfill existing rows
update public.events
  set plan_id = (select id from config.plans where slug = 'free');

-- Make NOT NULL
alter table public.events alter column plan_id set not null;

-- Dynamic DEFAULT via function (PostgreSQL forbids subquery as column default)
-- Guard: RAISES if free plan seed not present (prevents silent NULL defaults)
create function config.free_plan_id()
returns uuid language plpgsql stable
set search_path = config, public, pg_temp  -- SECURITY DEFINER hardening (search_path injection guard)
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

-- Index for plan-based queries
create index idx_events_plan_id on public.events (plan_id);

-- Plan limit enforcement trigger (scaffold — limit is null/TBC, but the pattern must exist)
-- Guards against TOCTOU race: two concurrent inserts both passing app-layer check.
create or replace function public.enforce_plan_event_limit()
returns trigger language plpgsql security definer
set search_path = public, config, pg_temp
as $$
declare
  v_limit int;
  v_count int;
begin
  -- Get the max_events_per_user for the plan being assigned to the new event
  select p.max_events_per_user into v_limit
  from config.plans p
  where p.id = new.plan_id;

  -- null limit = unlimited (TBC) — skip check
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

**Constraint choice:** `on delete restrict` — a plan row in use by events must not be deleted.

---

### `event_general_settings` — D42

Covers the **General tab**: event display preferences and visibility controls.

```sql
create table public.event_general_settings (
  event_id          uuid        primary key references public.events(id) on delete cascade,
  user_id           uuid        not null references auth.users(id) on delete cascade,

  -- Tagline: short vanity line shown under event title on public website and invites.
  -- Lives here (display preference), not on events (identity).
  -- NULL = no tagline shown. Empty string rejected by check.
  tagline           text        check (
                      tagline is null
                      or (char_length(trim(tagline)) >= 1 and char_length(tagline) <= 80)
                    ),

  -- Show this event in the host's dashboard listing.
  -- Default true: opt-out model (host hides while planning; new events visible immediately).
  show_on_dashboard boolean     not null default true,

  -- Discovery: appear in future event search/discovery. Stub — out of MVP scope.
  -- Default false: explicit opt-in required when feature ships.
  discoverable      boolean     not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid        references auth.users(id) on delete set null
);

create index idx_event_general_settings_user on public.event_general_settings(user_id);
-- NOT YET QUERIED: discovery feature deferred. When shipped, gate SELECT on
-- auth.uid() IS NOT NULL or explicit host consent before making discoverable events public.
create index idx_event_general_settings_discoverable
  on public.event_general_settings(event_id) where discoverable = true;

alter table public.event_general_settings enable row level security;
create policy "owner_all" on public.event_general_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- updated_by audit trigger: auto-stamps auth.uid() on every UPDATE.
-- Prevents clients from writing arbitrary UUIDs into the audit column.
create trigger trg_event_general_settings_updated_by
  before update on public.event_general_settings
  for each row execute function public.stamp_updated_by();
```

**View** (`event_general_settings_view`, security_invoker): joins `events` to surface `event_name`, `event_date`, `event_details` (partner names live there) so the General tab data loader needs one query, not two.

**Decisions:**
- `tagline` on this table, not `events` — it is a display preference, not structural identity. The `events` row stays lean (name, date, venue, status).
- `show_on_dashboard` default `true` — friendlier at onboarding; host explicitly hides events they're not ready to show.
- `allow_ticket_sales` — **excluded**. Weddings have no ticket entry; this concept does not apply.
- `discoverable` — stub with default `false` (opt-in). Partial index added so search queries need no migration when the feature ships.

---

### `event_website_settings` — D43

Covers the **Website tab** controls (not the page editor — that belongs to the Digital Presence module).

```sql
create table public.event_website_settings (
  event_id                    uuid        primary key references public.events(id) on delete cascade,
  user_id                     uuid        not null references auth.users(id) on delete cascade,

  -- Privacy & access
  website_password_enabled    boolean     not null default false,
  -- Stored as bcrypt hash (NOT plaintext). Raw value is returned once at save time
  -- from the request body — never fetched from DB. Guest unlock validated server-side
  -- with bcrypt.compare() (constant-time). Rate-limit unlock endpoint: 5 attempts/15 min.
  website_password_hash       text,
  -- Hash must be present when protection is enabled
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

  -- Take website offline (admin-only mode)
  site_offline                boolean     not null default false,

  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  updated_by   uuid           references auth.users(id) on delete set null
);

create index idx_event_website_settings_user on public.event_website_settings(user_id);
create index idx_event_website_settings_pw_on
  on public.event_website_settings(event_id) where website_password_enabled = true;
create index idx_event_website_settings_offline
  on public.event_website_settings(event_id) where site_offline = true;

alter table public.event_website_settings enable row level security;
create policy "owner_all" on public.event_website_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- updated_by audit trigger
create trigger trg_event_website_settings_updated_by
  before update on public.event_website_settings
  for each row execute function public.stamp_updated_by();
```

**View** (`event_website_settings_view`, security_invoker): adds computed columns:
- `website_expires_at` — `(events.primary_date + interval '60 days')::timestamptz`, `null` when date not set
- `website_days_remaining` — `(events.primary_date + interval '60 days') - current_date` (interval)
- `website_expired` — boolean

**Decisions:**
- `website_expires_at` **computed in view, not stored** — pure function of `events.primary_date`. Storing a copy would create drift risk (date changes in wizard, expiry silently disagrees). When Plan & Billing adds an "extend expiry" override, add `website_extended_until timestamptz` to this table and update the view to `GREATEST(base_expiry, override)`.
- `website_password_hash` — **bcrypt hash, not plaintext**. The raw password is returned once from the service layer at save time (from the request body) — never fetched from DB. Guest unlock endpoint must use `bcrypt.compare()` (constant-time) and be rate-limited (5 attempts / 15 min per IP) before the comparison runs. The column stores only the hash.
- Website Pages (Home/RSVP/Registry/Story published/draft states) — **deferred to Digital Presence module**. That data is per-page content, not site-level settings.
- **Public website read path** — must NOT use `service_role` (bypasses all RLS; a future view change silently exposes cross-tenant data). Use the `anon` role with a tightly scoped RLS `SELECT` policy on `event_website_settings` exposing only `{site_offline, website_password_enabled}`, OR a `SECURITY DEFINER` function that accepts `p_event_id uuid` and returns only those fields (never `website_password_hash`). Interface stub: `GET /api/events/[id]/website-access → { status: 'public' | 'password-protected' | 'offline' }`. Defined as a named blocker for the Digital Presence module.

---

### `event_guest_settings` — D44

Covers the **Guest List tab**: RSVP and plus-one preferences applied globally to all guests for this event.

```sql
create table public.event_guest_settings (
  event_id                    uuid        primary key references public.events(id) on delete cascade,
  user_id                     uuid        not null references auth.users(id) on delete cascade,

  -- RSVP controls
  rsvp_enabled                boolean     not null default true,
  rsvp_deadline               timestamptz null,   -- null = no deadline enforced

  -- Plus-one controls
  allow_plus_ones             boolean     not null default true,
  max_plus_ones_per_invite    smallint    not null default 2
                              constraint chk_max_plus_ones_range
                              check (max_plus_ones_per_invite >= 0
                                 and max_plus_ones_per_invite <= 10),

  -- RSVP data collection
  collect_dietary_notes       boolean     not null default true,

  -- Default message shown to guests on their invite/RSVP page
  default_guest_message       text        null
                              constraint chk_default_guest_message_length
                              check (default_guest_message is null
                                  or char_length(default_guest_message) <= 400),

  created_at   timestamptz    not null default now(),
  updated_at   timestamptz    not null default now(),
  updated_by   uuid           references auth.users(id) on delete set null
);

create index idx_event_guest_settings_user on public.event_guest_settings(user_id);

alter table public.event_guest_settings enable row level security;
create policy "owner_all" on public.event_guest_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- updated_by audit trigger
create trigger trg_event_guest_settings_updated_by
  before update on public.event_guest_settings
  for each row execute function public.stamp_updated_by();
```

**View** (`event_guest_settings_view`, security_invoker): adds `effective_max_plus_ones` — returns `max_plus_ones_per_invite` when `allow_plus_ones = true`, `null` otherwise. The RSVP flow should use `effective_max_plus_ones` so it never needs to check both flags.

**Decisions:**
- `max_plus_ones_per_invite` check 0–10: matches `min/max` in the prototype input. DB-enforced regardless of app validation.
- `allow_plus_ones` / `max_plus_ones_per_invite` relationship — **application-layer only**. A DB constraint that zeroes out the cap when the toggle is off would silently destroy the host's stored value. The cap retains its value while the toggle is off; the RSVP flow reads both columns together.
- `rsvp_deadline` stub included. Every future RSVP reminder / auto-close feature needs it; adding it now costs nothing (nullable, no enforcement in this slice). Stored as `timestamptz` (UTC). All deadline comparisons in app code must normalise to UTC explicitly. Pre-handoff: verify `public.events` has a timezone column; if it does, `event_guest_settings_view` should expose `rsvp_deadline AT TIME ZONE events.timezone AS rsvp_deadline_local` when enforcement is added.
- `default_guest_message` — store `null` when unset. The service function (`updateGuestSettings`) must coerce `""` → `null` before any DB write. This is a named requirement, not a comment — failure to do so creates a non-null empty message stored in the DB that the UI must handle specially.
- **Service-layer contract**: the RSVP flow must ALWAYS read from `event_guest_settings_view` (not the base table) to get `effective_max_plus_ones`. Direct base-table reads bypass the `allow_plus_ones` toggle silently.

---

## `create_event_with_details()` Extension — D45

Adding 3 new seed rows (general + website + guest settings) crosses the D36 threshold. Extract `_seed_event_settings(p_event_id uuid, p_user_id uuid)` as a `SECURITY DEFINER` helper called from `create_event_with_details()`.

```sql
-- Function spec
create function public._seed_event_settings(p_event_id uuid, p_user_id uuid)
returns void language plpgsql
security definer                            -- runs as function owner, not caller
set search_path = public, pg_temp           -- SECURITY DEFINER search_path hardening
as $$
begin
  insert into public.event_general_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;        -- idempotent re-run guard

  insert into public.event_website_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;

  insert into public.event_guest_settings (event_id, user_id)
  values (p_event_id, p_user_id)
  on conflict (event_id) do nothing;
end;
$$;

-- Revoke public execute: helper is internal, not a client-callable RPC
revoke execute on function public._seed_event_settings(uuid, uuid) from public, anon, authenticated;
grant execute on function public._seed_event_settings(uuid, uuid) to service_role;

-- Called from create_event_with_details() (which is SECURITY DEFINER itself):
perform public._seed_event_settings(v_event_id, p_user_id);
```

Seed defaults:
| table | defaults |
|---|---|
| `event_general_settings` | tagline null, show_on_dashboard true, discoverable false |
| `event_website_settings` | all flags false, password_hash null, banner null, site_offline false |
| `event_guest_settings` | rsvp_enabled true, deadline null, allow_plus_ones true, cap 2, collect_dietary true, message null |

All three seeds use `ON CONFLICT (event_id) DO NOTHING` — safe for re-runs.

---

## View DDL — D46, D47, D48

### `event_general_settings_view` — D46
```sql
create or replace view public.event_general_settings_view
  with (security_invoker = true) as
select
  gs.event_id, gs.user_id,
  gs.tagline, gs.show_on_dashboard, gs.discoverable,
  gs.created_at, gs.updated_at, gs.updated_by,
  e.name          as event_name,
  e.primary_date  as event_date,
  e.event_details                  -- contains partner_1_name, partner_2_name
from public.event_general_settings gs
join public.events e on e.id = gs.event_id;
```

### `event_website_settings_view` — D47
```sql
create or replace view public.event_website_settings_view
  with (security_invoker = true) as
select
  ws.event_id, ws.user_id,
  ws.website_password_enabled,
  -- website_password_hash intentionally excluded from view (hash must never be projected to clients)
  ws.search_indexing_enabled,
  ws.announcement_banner_enabled, ws.announcement_banner_text,
  ws.site_offline,
  -- computed expiry (not stored)
  case when e.primary_date is not null
    then (e.primary_date + interval '60 days')::timestamptz
    else null end                                       as website_expires_at,
  case when e.primary_date is not null
    then (e.primary_date + interval '60 days') - current_date
    else null end                                       as website_days_remaining,
  case when e.primary_date is not null
    then current_date > (e.primary_date + interval '60 days')
    else false end                                      as website_expired,
  ws.created_at, ws.updated_at, ws.updated_by
from public.event_website_settings ws
join public.events e on e.id = ws.event_id;
```

Note: `website_password_hash` is **excluded from the view**. Hash comparison for guest unlock happens only inside a dedicated `SECURITY DEFINER` API function (`/api/events/[id]/website-access`), never via a projected column.

### `event_guest_settings_view` — D48
```sql
create or replace view public.event_guest_settings_view
  with (security_invoker = true) as
select
  gs.event_id, gs.user_id,
  gs.rsvp_enabled, gs.rsvp_deadline,
  gs.allow_plus_ones,
  gs.max_plus_ones_per_invite,
  -- effective_max_plus_ones: null when toggle is off so RSVP flow never double-checks both flags
  case when gs.allow_plus_ones then gs.max_plus_ones_per_invite else null end
                                                        as effective_max_plus_ones,
  gs.collect_dietary_notes,
  gs.default_guest_message,
  gs.created_at, gs.updated_at, gs.updated_by
from public.event_guest_settings gs;
```

---

## Migration Plan

| Migration | Label | Contents |
|---|---|---|
| `event_settings_01` | plans_catalog | `config.plans` table + seed data (IF NOT EXISTS guards) + authenticated grant |
| `event_settings_02` | events_plan_fk | `events.plan_id` FK + backfill + `config.free_plan_id()` (with RAISE guard) + plan limit trigger |
| `event_settings_03` | general_settings | `event_general_settings` + indexes + RLS + `stamp_updated_by` trigger |
| `event_settings_04` | website_settings | `event_website_settings` + indexes + RLS + `stamp_updated_by` trigger |
| `event_settings_05` | guest_settings | `event_guest_settings` + indexes + RLS + `stamp_updated_by` trigger |
| `event_settings_06a` | views | 3 SECURITY INVOKER views (D46–D48) |
| `event_settings_06b` | seed_function | `_seed_event_settings()` (SECURITY DEFINER + REVOKE) + `create_event_with_details()` re-extension |
| `event_settings_07` | plans_public_view | `config.plans_public` view + anon SELECT grant |
| `event_settings_08` | typescript_types_note | No DDL — reminder to update `supabase gen types` to `--schema public,config` |

**Migration order enforced:** 01 must precede 02 (seed before FK default function). Each migration must use `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` guards for idempotency.

**TypeScript types:** After applying all migrations, run:
```bash
supabase gen types typescript --schema public,config > lib/supabase/database.types.ts
```
The `config` schema must be explicitly included; the default command covers `public` only.

---

## DATA-MODEL.md Additions (D40–D48)

| Decision | Description |
|---|---|
| D40 | `config.plans` — per-event purchase catalog; limits nullable (TBC); public SELECT only |
| D41 | `events.plan_id` — FK to config.plans, default free plan via `config.free_plan_id()` function |
| D42 | `event_general_settings` — tagline + visibility prefs; tagline lives here not on events |
| D43 | `event_website_settings` — website controls; expires_at computed in view; `website_password_hash` (bcrypt, not plaintext); public read via anon RLS or SECURITY DEFINER function only |
| D44 | `event_guest_settings` — RSVP + plus-one prefs; cap relationship enforced app-layer only |
| D45 | `_seed_event_settings()` helper extracted from `create_event_with_details()` per D36 |
| D46 | `event_general_settings_view` — SECURITY INVOKER; joins events for partner names |
| D47 | `event_website_settings_view` — SECURITY INVOKER; computes expires_at/days_remaining/expired |
| D48 | `event_guest_settings_view` — SECURITY INVOKER; computes effective_max_plus_ones |

---

## Out of Scope

- **Registry** — `event_registries` child table, own future slice. Will have `event_id + user_id`, support N external links + a cash fund.
- **Plan & Billing limit enforcement** — triggers/policies blocking event creation at plan limit. TBC when limits are decided.
- **Website Pages** (`event_website_pages`) — Home/RSVP/Registry/Story page editor content and published states. Digital Presence module.
- **Admins tab** — `event_collaborators` already live (guests_01). No new table.
- **Plan upgrade/purchase flow** — Stripe integration, entirely separate feature.

---

## Open Items

1. **Trigger function names** — project has `stamp_updated_at()` from early migrations; `media_06` added `stamp_updated_by()`. Verify both exist before `event_settings_03–05` migrations reference them.
2. **`website_extended_until`** — when Plan & Billing lands, add this column to `event_website_settings` and update the view expression to `GREATEST(base_expiry, override)`.
3. **Public website read path** (named blocker for Digital Presence module) — unauthenticated guests need `site_offline` and `website_password_enabled` (status check only — never the hash). Do NOT use `service_role` (bypasses RLS). Use `anon` role with a scoped RLS `SELECT` policy on these two columns only, OR a `SECURITY DEFINER` function `public.get_event_website_access(p_event_id uuid)` returning `{ status: 'public' | 'password-protected' | 'offline' }`. Hash comparison for guest unlock: SECURITY DEFINER function only, never a projected column.
4. **`config` schema grants** — `event_settings_01` adds `grant usage on schema config to anon, authenticated`. Verify bootstrap migration doesn't re-grant or conflict.
5. **`events` timezone column** — verify `public.events` has a `timezone` (IANA string) column before adding RSVP deadline enforcement. If missing, all `rsvp_deadline` app comparisons must normalise to UTC explicitly.
6. **Plan limit trigger activation** — the `enforce_plan_event_limit` trigger is live from `event_settings_02` but all `max_events_per_user` values are `null` (TBC). When limits are decided, populate the column with a migration — the trigger activates automatically for non-null values.

---

**Council reviewed:** 2026-06-17 by Tech Lead · Data Modeller · Backend Engineer · Security Expert. Verdict: ADDRESS-THEN-PROCEED. All 3 criticals and 9 importants folded into spec in this revision.
