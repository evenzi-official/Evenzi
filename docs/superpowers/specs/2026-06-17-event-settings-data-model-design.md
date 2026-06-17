# Event Settings Data Model — Design Spec

**Date:** 2026-06-17
**Status:** Approved
**Module:** Event Settings (es_01 – es_06)
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
- **User event limit.** The free tier limits how many events a user can create. The exact limit is TBC — stored as a nullable column in `config.plans`. Enforcement is application-layer only.
- **Plan limits are TBC.** All numeric limit columns in `config.plans` are `int nullable` — `null` means "unlimited / not yet decided". Feature flags (`custom_domain`, `priority_support`, `ai_features`) are set per the prototype.
- **Registry.** Will be a child table with `event_id + user_id`, supporting N external links + a cash fund. Deferred to its own slice.
- **Admins tab.** Already modelled by `event_collaborators` — no schema work needed.
- **Ticket sales.** Not applicable — Evenzi is a wedding/event planning platform; there is no ticketed entry concept.

---

## Architecture

Three 1:1 settings tables (one per domain), each with `event_id` as PK (not a surrogate `id`) and `user_id` denormalised for single-hop RLS. One catalog table (`config.plans`) and one FK addition on `events`. All share the same owner-only RLS pattern used across every existing module.

```
events
  ├── event_general_settings    (1:1, es_01)
  ├── event_website_settings    (1:1, es_02)
  ├── event_guest_settings      (1:1, es_03)
  └── plan_id → config.plans    (FK, es_04)

config.plans                    (catalog, es_04)
```

`create_event_with_details()` seeds all three settings rows. Adding 3 new seeds crosses the D36 threshold → extract `_seed_event_settings()` helper inside the function (es_05).

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

-- RLS: public SELECT only
alter table config.plans enable row level security;
create policy "plans_public_select" on config.plans for select using (true);

-- Schema grants (if not already in bootstrap migration)
grant usage on schema config to anon, authenticated;
grant select on config.plans to anon, authenticated;
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
create function config.free_plan_id()
returns uuid language sql stable as
$$ select id from config.plans where slug = 'free' $$;

alter table public.events
  alter column plan_id set default config.free_plan_id();

-- Index for plan-based queries
create index idx_events_plan_id on public.events (plan_id);
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
-- Partial index for future discovery feature
create index idx_event_general_settings_discoverable
  on public.event_general_settings(event_id) where discoverable = true;

alter table public.event_general_settings enable row level security;
create policy "owner_all" on public.event_general_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
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
  website_password            text        check (char_length(website_password) <= 40),
  -- Password must be present (non-empty) when protection is enabled
  constraint ck_website_password_required check (
    not website_password_enabled
    or (website_password is not null and trim(website_password) <> '')
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
```

**View** (`event_website_settings_view`, security_invoker): adds computed columns:
- `website_expires_at` — `(events.primary_date + interval '60 days')::timestamptz`, `null` when date not set
- `website_days_remaining` — `(events.primary_date + interval '60 days') - current_date` (interval)
- `website_expired` — boolean

**Decisions:**
- `website_expires_at` **computed in view, not stored** — pure function of `events.primary_date`. Storing a copy would create drift risk (date changes in wizard, expiry silently disagrees). When Plan & Billing adds an "extend expiry" override, add `website_extended_until timestamptz` to this table and update the view to `GREATEST(base_expiry, override)`.
- `website_password` — **plaintext**. It is a guest-facing door code (semantically: share over WhatsApp, short and memorable), not a user credential. Display requirement (host reads it back in settings UI) makes hashing impractical. Owner-only RLS at DB level.
- Website Pages (Home/RSVP/Registry/Story published/draft states) — **deferred to Digital Presence module**. That data is per-page content, not site-level settings.
- Public website read path needs a `service_role` client (unauthenticated guests need `site_offline`, `website_password_enabled`, `website_password`). A thin `service_role`-accessible view is app-tier scope, added when the public website page is built.

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
```

**View** (`event_guest_settings_view`, security_invoker): adds `effective_max_plus_ones` — returns `max_plus_ones_per_invite` when `allow_plus_ones = true`, `null` otherwise. The RSVP flow should use `effective_max_plus_ones` so it never needs to check both flags.

**Decisions:**
- `max_plus_ones_per_invite` check 0–10: matches `min/max` in the prototype input. DB-enforced regardless of app validation.
- `allow_plus_ones` / `max_plus_ones_per_invite` relationship — **application-layer only**. A DB constraint that zeroes out the cap when the toggle is off would silently destroy the host's stored value. The cap retains its value while the toggle is off; the RSVP flow reads both columns together.
- `rsvp_deadline` stub included. Every future RSVP reminder / auto-close feature needs it; adding it now costs nothing (nullable, no enforcement in this slice).
- `default_guest_message` — store `null` when unset. Empty string should be coerced to `null` at the API layer before DB call.

---

## `create_event_with_details()` Extension — D45

Adding 3 new seed rows (general + website + guest settings) crosses the D36 threshold. Extract a `_seed_event_settings(p_event_id uuid, p_user_id uuid)` helper called from the main function.

```sql
-- Fragment: called at the end of create_event_with_details()
perform _seed_event_settings(v_event_id, p_user_id);
```

Seed defaults:
| table | defaults |
|---|---|
| `event_general_settings` | tagline null, show_on_dashboard true, discoverable false |
| `event_website_settings` | all flags false, password null, banner null, site_offline false |
| `event_guest_settings` | rsvp_enabled true, deadline null, allow_plus_ones true, cap 2, collect_dietary true, message null |

All three seeds are idempotent (`on conflict (event_id) do nothing`).

---

## Migration Plan

| Migration | Label | Contents |
|---|---|---|
| `es_01` | plans_catalog | `config.plans` table + seed data + grants |
| `es_02` | events_plan_fk | `events.plan_id` column + backfill + `config.free_plan_id()` function |
| `es_03` | general_settings | `event_general_settings` + indexes + RLS + triggers |
| `es_04` | website_settings | `event_website_settings` + indexes + RLS + triggers |
| `es_05` | guest_settings | `event_guest_settings` + indexes + RLS + triggers |
| `es_06` | views_and_seeds | 3 SECURITY INVOKER views + `_seed_event_settings()` helper + `create_event_with_details()` re-extension |

---

## DATA-MODEL.md Additions (D40–D48)

| Decision | Description |
|---|---|
| D40 | `config.plans` — per-event purchase catalog; limits nullable (TBC); public SELECT only |
| D41 | `events.plan_id` — FK to config.plans, default free plan via `config.free_plan_id()` function |
| D42 | `event_general_settings` — tagline + visibility prefs; tagline lives here not on events |
| D43 | `event_website_settings` — website controls; expires_at computed in view not stored; password plaintext |
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

1. **Trigger function names** — project has `stamp_updated_at()` from early migrations; `media_06` added `stamp_updated_by()`. Verify both exist before the es_03–es_05 migrations reference them.
2. **`website_extended_until`** — when Plan & Billing lands, add this column to `event_website_settings` and update the view expression to `GREATEST(base_expiry, override)`.
3. **Public website read path** — unauthenticated guests need `site_offline` + `website_password_enabled` + `website_password`. A `service_role` view exposing only those three fields is app-tier scope; add it in the Website/Digital Presence module's backend PR.
4. **`config` schema grants** — verify `grant usage on schema config to anon, authenticated` and `grant select on config.plans to anon, authenticated` are in the bootstrap migration; add if missing.
