# Evenzi — Data Model Architecture

> **The single source of truth for Evenzi's database.** Any team member can read this to understand every table, function, security rule, and decision — in plain words. The DDL here is **runnable**: this doc is also the build script for the backend.
>
> This is a **rolling document**. It grows page-by-page as we design each screen/module. Keep it current (see [Maintenance rules](#maintenance-rules)).

| | |
|---|---|
| **Version** | `2026-06-17.1` |
| **Last updated** | 2026-06-17 |
| **Scope covered so far** | Auth → "Your Events" dashboard slice (CORE) + **Planning** (Checklist/Tasks + Budget) + **Guest Management** (guest list, RSVP, function assignments, tags) + **Media & Memories** (photo/video gallery + albums, R2-backed) + **Invitations** (invitation card personalizer — card styles catalog, locked templates catalog, per-event invitation cards, hosted share URL). Enablement & entitlements + account deletion shapes recorded as **[PLANNED]**. |
| **Database** | Supabase Postgres — project `smjkbmkxweevqpvygabe` (ap-northeast-1) |
| **Live DB status** | ✅ Built 2026-06-13 on the dev project (migrations `core_01`–`core_07`): catalogs seeded, 4 logins backfilled, baseline RLS on. ✅ Planning module applied 2026-06-14 (migrations `planning_01`–`planning_07`): new catalogs seeded, `event_tasks`/`event_checklists` extended, 4 new live tables + 3 `security_invoker` views + helper RPCs, owner-only RLS on, `get_advisors` (security + performance) reviewed clean. ⚠️ Manual step pending: expose the `config` schema in *Dashboard → Project Settings → API → Exposed schemas*. The deployed app still queries the old shapes — its code must be updated. ✅ Invitations module applied 2026-06-17 (migrations `inv_01`–`inv_06`): 2 config catalogs seeded, `event_invitation_cards` table + 2 views + `create_event_with_details` extended to seed main event card. |
| **Tags** | **[NOW]** = part of the core slice we build first · **[PLANNED]** = shape locked, built when we reach that page (Admin / Billing / Settings) |

---

## Table of contents

1. [How to use this document](#how-to-use-this-document)
2. [Maintenance rules](#maintenance-rules)
3. [Supabase context (read first)](#supabase-context-read-first)
4. [Plain-words key](#plain-words-key)
5. [Conventions](#conventions)
6. [ER diagram — core slice](#er-diagram--core-slice)
7. [Decision log](#decision-log)
8. [Tables](#tables)
9. [Views (derived)](#views-derived)
10. [Functions](#functions)
11. [Triggers](#triggers)
12. [Security (row-level security)](#security-row-level-security)
13. [Auth & login setup](#auth--login-setup)
14. [File storage (images)](#file-storage-images)
15. [Account deletion](#account-deletion)
16. [Enablement & entitlements (PLANNED)](#enablement--entitlements-planned)
17. [Derived (computed, never stored)](#derived-computed-never-stored)
18. [Deferred / out of scope](#deferred--out-of-scope)
19. [Build order](#build-order)

---

## How to use this document

- **Understand the shape:** [ER diagram](#er-diagram--core-slice), then [Tables](#tables).
- **Understand *why*:** each table has a **Rationale**; cross-cutting choices are in the [Decision log](#decision-log).
- **Understand the rest of Supabase:** [Functions](#functions), [Triggers](#triggers), [Security](#security-row-level-security), [Auth](#auth--login-setup), [Storage](#file-storage-images), [Account deletion](#account-deletion).
- **Build the backend:** DDL runs in [Build order](#build-order).
- **Wiring the frontend?** Use the companion [FE-INTEGRATION.md](FE-INTEGRATION.md) — supabase-js query recipes, the `config`-schema gotcha, the old→new change map, and generated types (`lib/supabase/database.types.ts`).
- **New to the terms?** Start with the [Plain-words key](#plain-words-key).

---

## Maintenance rules

The doc is only useful if it stays true. On **every** database change — a table, function, trigger, security rule, or auth/storage setting:

1. Update/add the affected section (DDL + notes + rationale).
2. Update the [ER diagram](#er-diagram--core-slice).
3. Append a dated [Decision log](#decision-log) entry with the *why*.
4. Bump **Version** + **Last updated**.
5. After a table is live, changes ship as **forward-only migrations** — never edit history silently.
6. Keep [Functions](#functions), [Triggers](#triggers), [Security](#security-row-level-security), and [Auth](#auth--login-setup) current too — not just tables.
7. **Checked rule:** a module's tables may FK only to **core** (`public.events`, `auth.users`) or to `config.*` — **never to another module's tables.** This is what keeps modules plug-and-play. Enforce it in review (and ideally a CI check over `information_schema`).
8. **Refresh the visual artifacts** — [`ERD.md`](ERD.md) (the full Mermaid ERD, module map, and functions/flows) is **derived from this doc** and MUST be updated in the same PR: add/remove the entity in both the Module Map (Section 1) and the full ERD (Section 2), update the relevant flow diagram if a function/trigger changed, and keep the entity list in sync with the live DB. Standing instruction (Abhijith, 2026-06-16) — these never go stale.

**Rule:** the database **and** this document **and** [`ERD.md`](ERD.md) change together, in the same PR.

**Accepted advisor notices (Planning module, 2026-06-14):** `get_advisors` (security) is clean. `get_advisors` (performance) raised the usual **unindexed-FK** and **unused-index** notices for the new tables — **reviewed and ACCEPTED at MVP scale**, consistent with how CORE's equivalent notices were accepted: the hot query paths (per-event progress, breakdown group-by, status/sub-event/due filters) are already covered by the **composite indexes** we added, and the "unused index" notices are an **empty-table cold-start artifact** (no rows yet, so the planner hasn't used them). Re-review once tables carry real data.

---

## Supabase context (read first)

Evenzi runs on **Supabase = PostgreSQL + managed layers**. Three things shape everything below:

- **`auth.users` is Supabase-managed.** Login, credentials (phone OTP / Google), verified email/phone, sessions, MFA — all in the `auth` schema Supabase owns. We never create or write a "users" table; we extend it 1:1 via [`public.user_profiles`](#tables).
- **Schema = table type.** `config.*` = reference/catalog lists · `public.*` = live app data · `auth.*` = Supabase. ⚠️ The auto-API serves **`public` only** by default; `config` must be **exposed** (*Dashboard → Project Settings → API → Exposed schemas* → add `config`) and granted (`grant usage` + `grant select` to `anon`, `authenticated`). Cross-schema foreign keys (`public.events.event_type_id → config.event_types`) are ordinary Postgres.
- **Three request identities** (matter once RLS lands): `anon` (logged-out), `authenticated` (logged-in — `auth.uid()` is their id), `service_role` (trusted backend, bypasses RLS).

---

## Plain-words key

A translation of the technical words, so anyone can read this doc.

| Word | In plain terms |
|---|---|
| Schema | A folder that groups tables: `config` (reference lists), `public` (live data), `auth` (login data, Supabase's). |
| Table | A list of records — like one tab in a spreadsheet. |
| Row / column | One record / one field in it. |
| Primary key (PK) | The unique id of a row. |
| Foreign key (FK) | A link from a row in one table to a row in another. |
| `ON DELETE CASCADE` | "If the parent is deleted, delete this too." |
| `ON DELETE SET NULL` | "If the parent is deleted, just blank this link." |
| `ON DELETE RESTRICT` | "Don't allow deleting the parent while this still points to it." |
| Index | A shortcut that makes look-ups fast (and can enforce "no duplicates"). |
| Trigger | An automatic rule the database runs by itself when a row is added/changed. |
| Function | A saved piece of logic inside the database. |
| RPC | A database function the app calls directly, like an API. |
| Row-Level Security (RLS) | A rule that makes each logged-in person see/change only the rows they're allowed to. |
| Seed | The starting rows we load into a reference list. |
| `auth.uid()` | A built-in that returns "who is asking" (the logged-in person's id). |
| **module** | A navigable section / group of tables (Guests, Media, Budget…). |
| **feature** | An unlockable capability, optionally part of a module (e.g. "custom domain"). |

---

## Conventions

| Area | Rule |
|---|---|
| **Schema = type** | `config.*` reference · `public.*` live · `auth.*` Supabase. |
| **Module = prefix** | live tables are tagged by a module prefix in `public` (`event_*`, `user_*`, later `guest_*`, `media_*`, `vendor_*`); their reference lists sit in `config` with the same prefix. |
| **Names** | plural, `snake_case`, singular concept per table. Catalog names drop "template/master" words (`config.event_checklists`, not `…_templates`). |
| **Primary key** | `id uuid primary key default gen_random_uuid()` — except 1:1 extension tables, where the FK *is* the PK. |
| **Timestamps** | `created_at` / `updated_at timestamptz not null default now()`, `updated_at` maintained by `public.set_updated_at()` — never in app code. |
| **Status / enums** | `text + CHECK (… in (…))`, not native Postgres enum. |
| **Soft delete** | `deleted_at timestamptz` only where recovery is real (core slice: `public.events`). |
| **FK on delete** | deliberate — `CASCADE` down ownership chains, `RESTRICT` on catalog refs, `SET NULL` where an instance outlives its template (or where it must not block account deletion). |
| **module vs feature** | a *module* is a section/table-group; a *feature* is an unlockable capability (a feature may roll up to a module). Don't conflate them. |

```sql
-- shared updated_at trigger function — defined once in public, reused by config.* and public.*
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;
-- attach: create trigger trg_<table>_updated before update on <schema>.<table>
--           for each row execute function public.set_updated_at();
```

---

## ER diagram — core slice

`CONFIG_*` = `config` schema · others = `public` · `AUTH_USERS` = Supabase. (Planned enablement/entitlement tables not shown — see [that section](#enablement--entitlements-planned).)

```mermaid
erDiagram
    AUTH_USERS ||--|| USER_PROFILES : "1:1 (id)"
    AUTH_USERS ||--|| USER_PREFERENCES : "1:1"
    AUTH_USERS ||--o{ EVENTS : "owns (user_id)"
    AUTH_USERS ||--o{ EVENTS : "created (created_by)"
    AUTH_USERS |o--o{ EVENT_COLLABORATORS : "member (user_id, nullable)"
    AUTH_USERS ||--o{ EVENT_TASK_ASSIGNEES : "assigned (user_id)"

    CONFIG_USER_TYPES ||--o{ USER_PROFILES : "role_slug"
    CONFIG_EVENT_TYPES ||--o{ CONFIG_EVENT_SUB_TYPES : "defines"
    CONFIG_EVENT_TYPES ||--o{ CONFIG_EVENT_CHECKLISTS : "defines"
    CONFIG_EVENT_TYPES ||--o{ EVENTS : "categorizes"
    CONFIG_TASK_PRIORITIES |o--o{ CONFIG_EVENT_CHECKLISTS : "default_priority_slug"
    CONFIG_TASK_PRIORITIES ||--o{ EVENT_TASKS : "priority_id"
    CONFIG_TASK_STATUSES ||--o{ EVENT_TASKS : "status_id"

    EVENTS ||--o{ EVENT_SUB_EVENTS : "has"
    EVENTS ||--o{ EVENT_COLLABORATORS : "has"
    EVENTS ||--o{ EVENT_TASKS : "has"
    EVENTS ||--|| EVENT_BUDGETS : "1:1 budget"
    EVENTS ||--o{ EVENT_EXPENSE_TYPES : "has"
    EVENTS ||--o{ EVENT_EXPENSES : "has"
    EVENTS ||--o{ EVENT_TASK_ASSIGNEES : "has (guarded event_id)"

    CONFIG_EVENT_SUB_TYPES |o--o{ EVENT_SUB_EVENTS : "seeds (set null)"
    CONFIG_EVENT_CHECKLISTS |o--o{ EVENT_TASKS : "seeds (set null)"
    EVENT_SUB_EVENTS |o--o{ EVENT_TASKS : "sub_event_id (set null)"
    EVENT_SUB_EVENTS |o--o{ EVENT_EXPENSES : "sub_event_id (set null)"
    EVENT_TASKS ||--o{ EVENT_TASK_ASSIGNEES : "has"
    EVENT_EXPENSE_TYPES ||--o{ EVENT_EXPENSES : "expense_type_id (restrict)"

    EVENTS {
        uuid id PK
        uuid user_id FK "owner, transferable"
        uuid created_by FK "creator, set null on delete"
        uuid event_type_id FK
        jsonb event_details
        text status
        timestamptz deleted_at
    }
    EVENT_COLLABORATORS {
        uuid id PK
        uuid event_id FK
        uuid user_id FK "nullable until accepted"
        text invited_email
        text role
        text status
    }
    USER_PROFILES {
        uuid id PK_FK
        text role_slug FK
        text email "verified mirror"
        text phone "verified mirror"
    }
```

**Legend:** `||--o{` one-to-many · `||--||` one-to-one · `|o--o{` optional (nullable FK) one-to-many.

---

## Decision log

Newest first. Per-table rationale lives in each table's section.

| # | Decision | Why |
|---|---|---|
| D38 | **Invitations card personalizer (`inv_01`–`inv_06`).** Two config catalogs (`config.invitation_card_styles` — 5 style filter chips; `config.invitation_templates` — 7 locked designs) + `public.event_invitation_cards` (per-event/sub-event, dual-mode: `template_id` OR `card_upload_key`, enforced by check constraint). Two partial unique indexes for `is_default` per group (two required — NULL ≠ NULL in B-tree). `share_token` generated by DEFINER trigger. Two views: `event_invitation_card_summary` (host, security_invoker) + `invitation_card_guest_view` (public share, service_role, private R2 keys absent, `WHERE share_enabled` filters revoked links). `create_event_with_details` extended: one main event card seeded (sub-event cards via UI CRUD — I5). `/invite/[token]` added to middleware public paths. | Invitation card personalizer scope: host picks locked template, personalizes text slots, gets hosted share URL + WhatsApp text+link. WhatsApp send + read tracking deferred to Guest Management. Render pipeline (Satori/Puppeteer → R2) is a future slice. `style_id uuid FK` (not slug) per I2. `WITH CHECK` on owner RLS per I3. `stamp_updated_by` (D37 shared) reused for created_by + updated_by. |
| D37 | **Media tagging + audit (`media_06`).** Media is taggable beyond albums/sub-events via `public.event_media_tags` (per-event entities — **pure per-event, no `config` catalog / no `is_custom`**: media tags have no universal defaults to seed) + `event_media_tag_links` (M:N, trigger-guarded `event_id`). Added `updated_by` (last-editor audit, stamped on UPDATE via `stamp_updated_by`) to `event_media` + `event_albums` + `event_media_tags`. | Founder ask: tag media + track last-editor. Unlike guest tags (which had seedable defaults), media tags are entirely host-created → no catalog/`is_custom` machinery needed. `updated_by` complements `created_by` for full provenance. |
| D36 | **`create_event_with_details` stays monolithic** (append-a-block) through `media_05` (3rd extension: tasks/budget → guest-tags → album-presets). Extract a `_seed_event_catalog(...)` helper when a **4th** catalog-copy seed lands. | Don't restructure the app's hottest RPC on a feature PR; but the album/guest-tag/expense-type seed blocks are near-identical — record the extraction trigger once. |
| D35 | **Media files in R2; the DB stores object keys** (`storage_key`, `thumbnail_key`) + metadata. Private bucket + signed URLs gated on event access. `published` is the single-entity website-gallery selector; **anon-read deferred** with the public site — and the safe future pattern is **signed URLs via a public-site route**, never `anon SELECT using(published)` on this mixed table. | Files aren't rows. An anon-read RLS policy on a table holding private photos is one bug from leaking the private subset. |
| D34 | **Media storage usage derived** (`sum(event_media.byte_size)` via `event_media_storage`); **limit/tier deferred to [PLANNED] entitlements** (app hardcodes free = 5 GB). No `event_storage` table. `byte_size` is **advisory** (server-stamp from R2 HEAD; quota reconciles against real object size). | Storing a derivable aggregate drifts (D7); limit/tier belong to entitlements; the meter input is untrusted. |
| D33 | **Album presets = `config.album_presets` catalog → per-event copy** (6 defaults seed `event_albums` at creation, `is_custom=false`; client INSERT requires `is_custom=true`, DEFINER seed writes the presets). | Consistent with `expense_types`/`guest_tags` (D25/D29); presets render as inert chips from day one; admin-tunable. |
| D32 | **Media↔album M:N** (`event_media_albums`); **delete-album cascades only the links**, never the media. Trigger-guarded `event_id` (D27) + rejects a cross-event album. | The prototype models `albumIds[]`; link tables not arrays (D7/D27); the delete-album copy promises photos survive in All Photos. |
| D31 | **One `event_media` table + a `kind` discriminator** (`text CHECK ('photo','video')`); video-only `duration_sec` (CHECK: null unless video). Photos + videos share grid/album-links/filters/sort. | The prototype merges them in one grid; two tables double the link tables/views/RLS + force UNIONs. `kind` is a true binary → CHECK, not a catalog. |
| D30 | **Guest provenance = `is_custom` + `created_by`.** Catalog-seeded `event_guest_tags` get `is_custom=false` + `created_by=NULL` ("we made it"); host-added get `is_custom=true` + `created_by=auth.uid()` ("user made it"). The `event_guest_tags` **INSERT** policy requires `is_custom=true`, so a client can't forge a system-seeded tag (the DEFINER seed bypasses RLS to write the `false` defaults). `created_by` stamped server-side. | Founder wants to distinguish/audit system-seeded vs user-created rows. `is_custom` is the fast filter; `created_by` is the "who"; the INSERT-policy guard keeps the distinction unforgeable. |
| D29 | **Guest tags = catalog → per-event copy** (like expense types, D25). `config.guest_tags` (admin defaults) seeds `public.event_guest_tags` per event; `event_guest_tag_links` is the guest↔tag M:N. `source_slug` is text provenance (not an FK). | The tag manager (rename/delete) needs tags as per-event entities, not strings; seeding gives starters; a global catalog would force all hosts to share one list. |
| D28 | **RSVP is guest-level, single-valued** (`event_guests.rsvp_status_id` → `config.rsvp_statuses`), with a `category` column (`pending`/`attending`/`declined`/`tentative`) driving derived headcount. **`category` vocabulary is intentionally independent of `task_statuses`** (`open`/`done`/`dropped`) — RSVP ≠ task lifecycle. Per-function RSVP deferred. | Matches the built prototype (one status per guest); `category` keeps headcount off hardcoded slugs (D21 lesson). A name-only insert defaults to `pending` via the `default_guest_rsvp` trigger (CSV-import ergonomics). |
| D27 | **Guest M:N relationships are link tables, never columns/arrays.** Functions = `event_guest_sub_events`; tags = `event_guest_tag_links`. Both carry a trigger-guarded `event_id` for single-hop RLS (like `event_task_assignees`, D23); the guard also rejects a `sub_event_id`/`tag_id` from another event (RLS alone wouldn't catch that). | Columns/arrays fight the tag manager + filtering and are the drift D7 forbids. The cross-event integrity check closes a hole RLS can't (own guest + foreign function). |
| D26 | **Planning ships owner-only *inlined* RLS** in its creating migrations — the same `EXISTS(events.user_id = (select auth.uid()))` predicate the 4 live CORE child tables use — **not** `can_access_event()`. All event-children (old + new) convert to `can_access_event()` together in the later collaborator pass. | `can_access_event()` is still `[PLANNED]`/not live; referencing it fails or forks the access model into two predicates for one job (the `.nav-tabs`/`.pill-tab` defect class). Verified against live `pg_policies`. |
| D25 | **Expense types = catalog → per-event copy.** `config.expense_types` (admin-CRUD, **deletable** — nothing hard-FKs it) seeds `public.event_expense_types` per event (`is_custom` flag, `source_slug` text provenance, **not** an FK); `public.event_expenses.expense_type_id` single-FKs the per-event table. | Template→instance (D5) avoids a polymorphic FK and lets the breakdown be one clean `group by`. Per-event editing is owned by Event Settings; admin manages the catalog defaults. A hard FK on `source_slug` would block admins retiring a catalog type. |
| D24 | **Budget = `event_budgets` 1:1 (`event_id` PK), `total_amount` only.** Spent / Remaining / Over are **derived** via `security_invoker` views, never stored. | Storing aggregates drifts and needs a recompute trigger on every expense write (D5/D7). 1:1 via FK-as-PK matches `user_preferences` (D8). |
| D23 | **Per-task assignees = `event_task_assignees`** join to `auth.users` (assignee must be **owner or active collaborator**), **no** denormalized contact, carries a trigger-guarded `event_id` for single-hop RLS. | Reuse existing identity (D3); modularity rule 7 forbids FK to another module's `event_collaborators`, and the owner isn't a collaborator row (D16). `event_id` keeps RLS consistent + fast across all event-children. |
| D22 | **Task priority = `config.task_priorities`** catalog (low/med/high); `event_tasks.priority_id` NOT NULL, resolved **by slug** at write. `config.event_checklists` gains `default_priority_slug` as the copy source. | Founder wants priority with icon/label/admin control; templates need a priority to seed; slug-resolution (like `role_slug`, D3) survives a catalog re-seed. |
| D21 | **Task lifecycle = `config.task_statuses`** 4-state catalog (pending/in_progress/completed/cancelled) **replacing `event_tasks.is_done`**. A `category` column (`open`/`done`/`dropped`) drives derived progress (`done`) and overdue (`open` only). | Richer lifecycle (founder); a catalog gives icon/order/admin-tuning; `category` distinguishes **cancelled** from done so Overdue excludes both — an instance `is_done` boolean would be the exact drift D7 forbids. |
| D20 | **Built on the dev database** (2026-06-13, migrations `core_01`–`core_07`): fresh rebuild — dropped the 6 legacy tables (backed up to `_backups/`), created `config` + `public`, seeded catalogs, backfilled the 4 logins, enabled baseline owner-only RLS, revoked RPC access on trigger functions. | Move from paper to a working dev backend; no Pro branch available, dev data disposable. |
| D19 | **`role_slug` is nullable.** A person signs up *before* picking a role (role-select is a separate step), so the profile is created with `role_slug` null and set later; immutable once set. | The signup trigger creates the profile at signup; NOT NULL would break it. |
| D18 | **Account deletion** is a secure admin-key action that deletes `auth.users`, letting `ON DELETE CASCADE` wipe the whole tree. `events.created_by` changed from `NOT NULL/RESTRICT` to **nullable + `ON DELETE SET NULL`** so deletion is never blocked. Storage files are purged separately. | A delete button must always work; RESTRICT would block any user who created an event. The DB can't delete storage files (they're not rows). |
| D17 | **Enablement vs entitlement = two data layers**, ANDed: a type *supports* a module (`config.event_type_modules`) and a plan *unlocks* a feature (`config.plan_features` + per-event override). Tier lives per-event. Modules organized by **prefix-in-`public`**, not schema-per-module; "module FKs only to core" is a checked rule. | Toggling is data, not structure — so no per-module schemas needed. Two layers cleanly separate "has the section" from "paid for it." |
| D16 | **Vendor-on-behalf:** split owner from creator — `events.user_id` (current owner, transferable by one UPDATE) vs `events.created_by` (immutable origin). Collaborator auto-link matches **Supabase-verified** email/phone only; owner may never also be a collaborator row; invite email match is case-insensitive. | An event-management company creates events for clients; ownership can transfer without losing "who set it up", and access can't be claimed by spoofing an email. |
| D15 | **Plural, snake_case table names**, module-prefixed. | Reads correctly as auto-API endpoints (`GET /events`); matches `user_profiles`. |
| D14 | **This doc is the one-and-all Supabase reference** — covers functions, triggers, the RLS plan, auth/login, storage, and account deletion, in plain terms, with a plain-words key. | A team member should understand the whole backend from one place, no prior Supabase knowledge. |
| D13 | **Schema = table type:** catalogs in `config`, live data in `public`, `auth.*` is Supabase's. | Namespacing makes a table's type obvious; lets `config` be read-only to clients. |
| D12 | snake_case, status as `text + CHECK`, one shared `public.set_updated_at()`. | Consistency for every module that copies this spine. |
| D11 | **RLS parked** for now; model kept access-ready. | Settle shape first; wire policies + `can_access_event()` in a dedicated pass. |
| D10 | **Soft-delete (`deleted_at`) on `public.events` only.** | Events are the one user-recoverable artifact; children CASCADE; profiles follow auth lifecycle; catalogs use `enabled`. |
| D9 | Catalogs are `config` tables, admin-seeded. | Add/toggle values without a migration. |
| D8 | `public.user_preferences` is a separate table; 2FA removed (it's Supabase MFA). | Prefs churn and grow; keep the profile row stable. |
| D7 | Dropped denormalized `has_*` booleans on events. | Derivable via `EXISTS`; storing them invites drift. |
| D6 | Owner = `events.user_id`; `event_collaborators` holds added people; role not on the event row; nullable `user_id` + `invited_email/phone` for pending. | Role is per-(person,event); pending invitees may have no account; the access seam. |
| D5 | Checklist = config template → per-event instance; progress is **derived** (COUNT). Dropped a `planning_status` table. | Same template→instance pattern; storing a % goes stale. |
| D4 | Per-type variable fields → `events.event_details jsonb` + `config.event_types.field_schema`. Killed EAV `event_metadata`. | JSONB is queryable/atomic; EAV is untyped and needs pivoting. |
| D3 | Mirror verified `email`/`phone` into `user_profiles` (read-only, partial-unique). | Queried constantly; reaching into `auth` schema is awkward; trigger-written → bounded drift. |
| D2 | Dropped `password`, `*_confirmed_at`, `last_sign_in_at` from the profile. | They live in `auth.users`. |
| D1 | No app `users` table; extend `auth.users` 1:1 via `user_profiles` (`id` = PK + FK). | Supabase owns identity. |

---

## Tables

Per-table: **Purpose → DDL → Notes (keys / relationships / rationale).** Schema tags: `config.*` reference · `public.*` live · `auth.*` Supabase.

### `config.user_types`  `[NOW]`
**Purpose:** catalog of user roles (Host / Vendor / Admin). Referenced by `public.user_profiles.role_slug`.
```sql
create table config.user_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                 -- host | vendor | admin
  name text not null, description text,
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
**Notes:** PK `id`; `UNIQUE(slug)`. Seed: `host` (enabled), `vendor` (disabled), `admin` (disabled — assigned in DB only, never self-selected). A table (vs CHECK) gives labels/ordering and lets Vendor go live by flipping `enabled`.

### `config.event_types`  `[NOW]`
**Purpose:** catalog of event types + the form definition (`field_schema`) for each type's variable fields.
```sql
create table config.event_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                 -- wedding | birthday | ...
  name text not null, description text, icon_name text, image_url text,
  field_schema jsonb not null default '[]',  -- variable-field definitions per type
  features jsonb not null default '[]',
  display_order int not null default 0,
  enabled boolean not null default false,    -- only 'wedding' = true today
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
**Notes:** PK `id`; `UNIQUE(slug)`. Parent of `config.event_sub_types`, `config.event_checklists`, `public.events`. `field_schema` example (wedding): `[{"key":"partner_1_name","label":"Partner 1","required":true},{"key":"partner_2_name","label":"Partner 2","required":true}]` — drives the wizard form; answers land in `events.event_details`. (Old `has_sub_events` boolean is replaced by `config.event_type_modules` [PLANNED]; until that ships, treat "supports sub-events" as: a `sub_events` module row enabled.)

### `config.event_sub_types`  `[NOW]`
**Purpose:** catalog of sub-events per event type (a wedding's Haldi, Mehendi…).
```sql
create table config.event_sub_types (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references config.event_types(id) on delete restrict,
  slug text not null, name text not null, icon_name text,
  display_order int not null default 0,
  is_default boolean not null default false, -- pre-checked at event creation
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_type_id, slug)
);
```
**Notes:** FK `event_type_id` `RESTRICT` (protect catalog in use). Seed (wedding): Haldi, Mehendi, Sangeet, Wedding Ceremony\*, Reception\*, Cocktail Party, Post-Wedding Brunch (\* = default).

### `config.event_checklists`  `[NOW]`
**Purpose:** default planning tasks per event type — the rows copied into each new event (the "18" in "12 of 18"). *Name finalized (Planning module): kept as-is, no rename (D21/D22).*
```sql
create table config.event_checklists (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid not null references config.event_types(id) on delete restrict,
  title text not null, description text,
  default_priority_slug text references config.task_priorities(slug) on update cascade,  -- seed source for the task's priority
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- backfill: the 12 existing rows default to 'med' (templates carried no priority before)
update config.event_checklists set default_priority_slug = 'med' where default_priority_slug is null;
```
**Notes:** template→instance pattern; titles are copied into `public.event_tasks` at creation so later edits don't rewrite a host's tasks. `default_priority_slug` → `config.task_priorities(slug)` is the copy source for each seeded task's priority (resolved by slug, like `role_slug`, survives a catalog re-seed — D22). Long-term owned by the Planning module; here because the dashboard aggregates it.
**Rationale:** the Planning module needs a per-template priority to seed instances; slug-resolution (not an id FK) keeps it re-seedable.

### `config.task_priorities`  `[NOW]`
**Purpose:** task priority catalog (Low / Medium / High) — the priority a host sets on a task; seeds via `event_checklists.default_priority_slug` and resolved by slug at write.
```sql
create table config.task_priorities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                       -- low | med | high
  name text not null, description text, icon_name text,
  display_order int not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
**Notes:** PK `id`; `UNIQUE(slug)`. Seed: `low` (Low), `med` (Medium), `high` (High). `public.event_tasks.priority_id` FKs the `id` (NOT NULL); the slug is the stable handle used when seeding/writing.
**Rationale (D22):** a catalog (vs CHECK) gives icon/label/admin-ordering and lets priorities be tuned without a migration; slug-resolution survives a re-seed.

### `config.task_statuses`  `[NOW]`
**Purpose:** the 4-state task lifecycle catalog (Pending / In Progress / Completed / Cancelled) — replaces the old `event_tasks.is_done` boolean. The `category` column drives all derived progress/overdue maths.
```sql
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
```
**Notes:** PK `id`; `UNIQUE(slug)`. Seed: `pending`→`open`, `in_progress`→`open`, `completed`→`done`, `cancelled`→`dropped`. `public.event_tasks.status_id` FKs the `id` (NOT NULL). **Progress** counts `category = 'done'`; **Overdue** counts `category = 'open'` only (so a cancelled task is never overdue).
**Rationale (D21):** a richer lifecycle than a boolean; `category` lets us distinguish **cancelled** from **done** so Overdue/progress exclude dropped tasks — an instance `is_done` boolean would be the exact drift D7 forbids.

### `config.expense_types`  `[NOW]`
**Purpose:** admin-managed catalog of expense categories (Venue, Food/Catering, …) that **seeds** each event's `public.event_expense_types`. Admin-CRUD incl. delete — nothing hard-FKs it.
```sql
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
**Notes:** PK `id`; `UNIQUE(slug)`. Seed (10 rows): `venue` (Venue), `food` (Food / Catering), `decoration` (Decoration), `photography` (Photography), `videography` (Videography), `attire` (Attire), `music` (Music / DJ), `entertainment` (Entertainment), `invitations` (Invitations), `other` (Other). These are **reference data**, not a priority list — Admin can add / edit / disable / delete. Copied into `public.event_expense_types` per event inside `create_event_with_details`; the per-event row records provenance via `source_slug` text (**not** an FK), so an admin can retire a catalog type without breaking events.
**Rationale (D25):** template→instance (D5) avoids a polymorphic FK and keeps the budget breakdown a clean `group by`; admin owns the defaults, Event Settings owns the per-event copy.

---

### `auth.users`  `[Supabase-managed]`
**Purpose:** identity & credentials — **owned by Supabase, never created/written by us.** Holds `id`, `email` + `email_confirmed_at`, `phone` + `phone_confirmed_at`, password/OTP/OAuth, `last_sign_in_at`, MFA, `raw_user_meta_data` (Google name/avatar), `raw_app_meta_data` (provider). 1:1 with `user_profiles` and `user_preferences`; owner + creator of `events`; nullable member link from `event_collaborators`. Signup trigger seeds the profile + preferences ([Functions](#functions)).

### `public.user_profiles`  `[NOW]`
**Purpose:** the app profile — a 1:1 extension of `auth.users`. Auto-created at signup.
```sql
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role_slug text references config.user_types(slug) on update cascade on delete restrict,  -- nullable: set at role-select after signup
  display_name text, avatar_url text,
  email text, phone text,                    -- read-only verified mirror of auth.users
  auth_provider text not null check (auth_provider in ('phone','google','email')),
  location text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index uq_user_profiles_email on public.user_profiles(lower(email)) where email is not null;
create unique index uq_user_profiles_phone on public.user_profiles(phone) where phone is not null;
```
**Notes:** `id` = PK + FK → strict 1:1; CASCADE (delete the auth user → profile gone). `role_slug` → `config.user_types(slug)` (readable role, FK-valid). `email`/`phone` are denormalized verified copies (written by the signup trigger, never the user) with partial-unique = "unique when present."

### `public.user_preferences`  `[NOW]`
**Purpose:** per-user notification toggles, 1:1 with the user.
```sql
create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_alerts boolean not null default true,
  push_notifications boolean not null default true,
  sms_alerts boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```
**Notes:** PK = FK `user_id` CASCADE. 2FA is **not** here — it's Supabase Auth MFA.

### `public.events`  `[NOW]`
**Purpose:** a host's event — the row the "Your Events" dashboard lists.
```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,       -- current OWNER (transferable)
  created_by uuid references auth.users(id) on delete set null,            -- original creator/onboarder (immutable; blanked if creator deleted)
  event_type_id uuid not null references config.event_types(id) on delete restrict,
  name text not null, primary_date date, primary_venue text, guest_capacity int,
  cover_image_url text, description text,
  event_details jsonb not null default '{}', -- variable per-type answers
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  -- plan_id uuid references config.plans(id) on delete restrict,          -- [PLANNED] per-event tier
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz                     -- soft delete (trash / restore)
);
create index idx_events_user on public.events(user_id, created_at desc);
create index idx_events_type on public.events(event_type_id);
```
**Notes:** owner `user_id` CASCADE; creator `created_by` SET NULL (so deleting a creator never blocks deletion — D18; for a self-made event `created_by = user_id` at insert). `event_type_id` RESTRICT. `event_details` example `{"partner_1_name":"Aarav","partner_2_name":"Ishani"}`, validated against `field_schema`. Ownership transfer = one `UPDATE user_id` (vendor-on-behalf, D16). If vendor billing must survive a deleted creator, snapshot a `created_by_name text` or use a billing/audit record — not a hard FK.

### `public.event_sub_events`  `[NOW]`
**Purpose:** the actual functions of an event (this wedding's Haldi, Sangeet…).
```sql
create table public.event_sub_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_sub_type_id uuid references config.event_sub_types(id) on delete set null,  -- null = custom
  custom_name text, event_date date, start_time time, end_time time, venue text, guest_count int,
  status text not null default 'tbc' check (status in ('tbc','confirmed','cancelled')),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (event_sub_type_id is not null or custom_name is not null)
);
create index idx_sub_events_event on public.event_sub_events(event_id, display_order);
```
**Notes:** child of `events` CASCADE; catalog FK SET NULL (a custom or de-catalogued function survives via `custom_name`); the CHECK guarantees every row is identifiable. `end_time` after `start_time` validated in app.

### `public.event_collaborators`  `[NOW]`
**Purpose:** people *added* to an event with a role (the owner is **not** here — that's `events.user_id`). The seam a future `can_access_event()` reads.
```sql
create table public.event_collaborators (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,   -- null until accepted; linked by VERIFIED email/phone
  invited_email text, invited_phone text,
  role text not null default 'co-host',                       -- open-ended
  status text not null default 'pending' check (status in ('pending','active')),
  invited_at timestamptz not null default now(), accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or invited_email is not null or invited_phone is not null)
);
create unique index uq_collab_user  on public.event_collaborators(event_id, user_id) where user_id is not null;
create unique index uq_collab_email on public.event_collaborators(event_id, lower(invited_email)) where invited_email is not null;
```
**Notes (D16):** child of `events` CASCADE; member `user_id` CASCADE; case-insensitive email uniqueness; presence CHECK. Pending invite stores contact with `user_id` NULL → linked to a **Supabase-verified** identity on first login ([`link_pending_collaborators`](#functions)). A guard trigger ([`prevent_owner_as_collaborator`](#triggers)) blocks the owner from also being a collaborator row.

### `public.event_tasks`  `[NOW]`
**Purpose:** per-event planning tasks. The dashboard derives "12 of 18 / 68%" by counting these. *Name finalized (Planning module): kept as-is, no rename (D21/D22).*
```sql
create table public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  template_id uuid references config.event_checklists(id) on delete set null,  -- null = host-added
  sub_event_id uuid references public.event_sub_events(id) on delete set null, -- null = "Whole event"
  title text not null, description text,
  priority_id uuid not null references config.task_priorities(id) on delete restrict, -- resolved by slug at write
  status_id   uuid not null references config.task_statuses(id)   on delete restrict, -- replaces is_done
  due_date date,                             -- null = undated
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_event_tasks_status   on public.event_tasks(event_id, status_id);
create index idx_event_tasks_subevent on public.event_tasks(event_id, sub_event_id);
create index idx_event_tasks_due_open on public.event_tasks(event_id, due_date) where due_date is not null;
-- bare (event_id) index dropped — it's a prefix of the composites above.
```
**Progress query** (counts `status.category = 'done'`, not the old `is_done`):
```sql
select count(*) filter (where s.category = 'done') as done, count(*) as total,
       round(100.0 * count(*) filter (where s.category = 'done') / nullif(count(*),0)) as percent
from public.event_tasks t
join config.task_statuses s on s.id = t.status_id
where t.event_id = :event_id;   -- 12, 18, 68
```
**Notes:** child of `events` CASCADE; template FK SET NULL (host-added tasks have `template_id` NULL); `sub_event_id` SET NULL (null = whole event). `priority_id`/`status_id` are NOT NULL `config` FKs (RESTRICT — a catalog row in use can't be deleted), seeded by slug. `is_done` was **dropped** — completion is now `status.category = 'done'`. **Overdue** = `due_date < current_date AND status.category = 'open'` (derived, never stored). Titles copied at creation.
**Rationale (D21/D22):** richer 4-state lifecycle + priority via catalogs; `category` separates cancelled from done so Overdue/progress stay correct.

### `public.event_task_assignees`  `[NOW]`
**Purpose:** who is assigned to a task (co-host / collaborator). A pure join to `auth.users` — names/avatars come from a restricted same-event source, never copied here.
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
**Notes:** children CASCADE on event/task/user. `event_id` is **trigger-derived** from the task (the `event_task_assignee_before` guard, [Triggers](#triggers)) so RLS is single-hop and a forged `event_id` can't desync access; the same guard rejects a `user_id` that isn't the event **owner or an active collaborator**, and stamps `assigned_by = auth.uid()` on insert. No `updated_at` (rows are insert/delete only). Name / avatar / role come from a **join** (`event_collaborators` → `user_profiles`) or a restricted RPC — email/phone are never exposed in assignee payloads.
**Rationale (D23):** reuse existing identity (D3); modularity rule 7 forbids an FK to another module's `event_collaborators`, and the owner isn't a collaborator row (D16); the carried `event_id` keeps RLS fast + consistent with every other event-child.

### `public.event_budgets`  `[NOW]`
**Purpose:** one budget per event — just the total. Spent / Remaining / Over are **derived** (see [`event_budget_summary`](#views-derived)), never stored.
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
**Notes:** PK = FK `event_id` CASCADE → strict 1:1 (matches `user_preferences`, D8). First "Set budget" is an **upsert** (`on conflict (event_id)`) — the row may not pre-exist (an empty row is also seeded by `create_event_with_details`). `modified_by` is stamped server-side by the `stamp_budget_modified_by` trigger. Spent/Remaining/Over live in the `event_budget_summary` view, not columns.
**Rationale (D24):** storing aggregates drifts and would need a recompute trigger on every expense write (D5/D7); derive them instead.

### `public.event_expense_types`  `[NOW]`
**Purpose:** the per-event copy of expense categories (seeded from `config.expense_types`, plus host-added customs). What `event_expenses` groups under.
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
  updated_at timestamptz not null default now()
);
create unique index uq_event_expense_types_name on public.event_expense_types(event_id, lower(name));  -- no dup type names per event (idempotent seed)
create index idx_event_expense_types_event on public.event_expense_types(event_id);
```
**Notes:** child of `events` CASCADE. Seeded from `config.expense_types` **inside `create_event_with_details`** (atomic, no lazy-seed race). Host "+ Add type" → `is_custom = true`, `source_slug` null. `source_slug` is provenance **text, not an FK**, so an admin can retire a catalog type without breaking events. Per-event no-duplicate-name is a **unique index** `uq_event_expense_types_name on (event_id, lower(name))` (case-insensitive), which also makes the seed idempotent.
**Rationale (D25):** template→instance copy keeps the breakdown one clean `group by` and lets per-event editing live in Event Settings.

### `public.event_expenses`  `[NOW]`
**Purpose:** budget line-items — each spend, grouped by per-event expense type, optionally tagged to a sub-event.
```sql
create table public.event_expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,        -- also reaches the 1:1 budget
  sub_event_id uuid references public.event_sub_events(id) on delete set null,  -- null = whole event
  expense_type_id uuid not null references public.event_expense_types(id) on delete restrict,
  title text, description text,
  vendor_name text,                                                            -- free-text payee (real vendor_id is post-MVP)
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
**Notes:** child of `events` CASCADE; `expense_type_id` RESTRICT (a per-event type in use can't be deleted); `sub_event_id` SET NULL (null = whole event). `amount >= 0` enforced. `receipt_key` holds the **R2 object key** (not a public URL) — the object lives in the **private** bucket and is served via short-lived signed URLs minted by an auth-checking server route (see `docs/R2-STORAGE-GUIDE.md`); the expense-receipt key prefix is purged in `delete_user_account`. `created_by` is stamped server-side by `stamp_created_by`.
**Rationale (D24/D25):** line-items are the source of truth; Total/Spent/Remaining derive from them via the summary/breakdown views.

---

### Guest Management module  `[NOW]` (built `guests_01`–`guests_05`)

Host-side guest list + RSVP + function assignments + tags. Catalogs `config.rsvp_statuses` (pending/confirmed/declined/maybe, `category` pending/attending/declined/tentative) and `config.guest_tags` (6 default suggestions) follow the standard catalog shape (admin-seeded, public-read).

```sql
-- the guest list (one row per guest per event)
create table public.event_guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null, email text, phone text,
  rsvp_status_id uuid not null references config.rsvp_statuses(id) on delete restrict,  -- defaults to 'pending' via trigger
  invited boolean not null default false,
  party_size int not null default 1 check (party_size >= 1),                            -- total incl. primary
  notes text,
  created_by uuid references auth.users(id) on delete set null,                         -- who added (stamped server-side)
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index idx_event_guests_event      on public.event_guests(event_id, display_order);
create index idx_event_guests_event_rsvp on public.event_guests(event_id, rsvp_status_id);
create index idx_event_guests_event_name on public.event_guests(event_id, lower(name));

-- which functions a guest is invited to (M:N)
create table public.event_guest_sub_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,                -- guard-derived; rejects cross-event
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  sub_event_id uuid not null references public.event_sub_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, sub_event_id)
);

-- per-event tag entities (catalog-seeded; tag manager edits these)
create table public.event_guest_tags (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false, source_slug text,                            -- false+null = system seed
  created_by uuid references auth.users(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_guest_tags_name on public.event_guest_tags(event_id, lower(name));

-- guest ↔ tag (M:N)
create table public.event_guest_tag_links (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,                -- guard-derived; rejects cross-event
  guest_id uuid not null references public.event_guests(id) on delete cascade,
  tag_id uuid not null references public.event_guest_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (guest_id, tag_id)
);
```
**Notes:** all children CASCADE from `events`; `rsvp_status_id` RESTRICT (a status in use can't be deleted); the two join tables carry a trigger-guarded `event_id` (single-hop RLS) and reject a function/tag from another event. `email`/`phone` are intentionally un-unique/un-indexed (free-text, per-event client-side search). **Rationale:** D27 (link tables), D28 (guest-level RSVP + category), D29 (tag catalog→copy), D30 (provenance).

---

### Media & Memories module  `[NOW]` (built `media_01`–`media_05`)

Host-side photo/video gallery + albums, **R2-backed** (DB stores object keys, never bytes). Catalog `config.album_presets` (6 defaults: Ceremony, Reception, Mehendi, Sangeet, Candids, Pre-Wedding) seeds each event's albums.

```sql
-- one table for photos + videos (kind discriminator)
create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  storage_key text not null,                  -- R2 object key (original); CHECK pins it under events/{id}/
  thumbnail_key text,                         -- R2 thumb / video poster
  name text, original_filename text, content_type text,
  byte_size bigint not null default 0 check (byte_size >= 0),  -- ADVISORY (server-stamped from R2 HEAD)
  width int, height int,
  duration_sec int check (duration_sec is null or kind = 'video'),
  sub_event_id uuid references public.event_sub_events(id) on delete set null,
  taken_at timestamptz,                       -- EXIF; drives date filter (null excluded from range)
  published boolean not null default false,   -- single-entity website-gallery selector
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (storage_key like 'events/' || event_id::text || '/%')
);
create index idx_event_media_event_new on public.event_media(event_id, created_at desc, id desc);  -- Newest + keyset (created_at,id)
create index idx_event_media_event_kind on public.event_media(event_id, kind);
create index idx_event_media_event_subevent on public.event_media(event_id, sub_event_id);
create index idx_event_media_event_taken on public.event_media(event_id, taken_at);
create index idx_event_media_published on public.event_media(event_id) where published;

create table public.event_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false, source_slug text,         -- false+null = seeded preset
  cover_media_id uuid references public.event_media(id) on delete set null,  -- host-selectable cover (same-event, guarded)
  display_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_albums_name on public.event_albums(event_id, lower(name));

-- M:N (a photo in many albums); delete-album drops links only, media survives
create table public.event_media_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,  -- guard-derived; rejects cross-event
  media_id uuid not null references public.event_media(id) on delete cascade,
  album_id uuid not null references public.event_albums(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (media_id, album_id)
);
```
**Notes:** `event_media` created **before** `event_albums` (cover FK). `cover_media_id` SET NULL (delete a cover photo → album survives, cover blanks). Keys point at the **private** R2 bucket — served via signed URLs from an event-access-checked route; the `storage_key` CHECK keeps a row's key under its own event prefix. **Rationale:** D31 (single table+kind), D32 (M:N, links-only delete), D33 (preset catalog→copy), D34 (derived storage), D35 (R2 keys + published).

**Media tagging + audit (`media_06`, D37):** `event_media` + `event_albums` gained `updated_by uuid → auth.users(id) on delete set null` (last-editor, stamped on UPDATE by `stamp_updated_by`). Plus a media-tag pair — **no `config` catalog, no `is_custom`** (pure host-created):
```sql
create table public.event_media_tags (          -- per-event media tag entities
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  display_order int not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_media_tags_name on public.event_media_tags(event_id, lower(name));
create table public.event_media_tag_links (      -- media <-> tag (M:N), guard-derived event_id
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  media_id uuid not null references public.event_media(id) on delete cascade,
  tag_id uuid not null references public.event_media_tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (media_id, tag_id)
);
```

---

### Invitations module  `[NOW]` — `inv_01`–`inv_06`

#### `config.invitation_card_styles`

Filter chips in the template gallery: All · Minimal · Royal · Floral · Modern · Photo.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `slug` | text | UNIQUE NOT NULL | minimal, royal, floral, modern, photo |
| `name` | text | NOT NULL | display label in filter pill |
| `display_order` | int | NOT NULL DEFAULT 0 | |
| `enabled` | bool | NOT NULL DEFAULT true | |
| `created_at` / `updated_at` | timestamptz | NOT NULL DEFAULT now() | `updated_at` via `set_updated_at()` |

**5 seed rows:** minimal(1), royal(2), floral(3), modern(4), photo(5).
**RLS:** public read (`SELECT using(true)` for anon + authenticated); no write policy — admin via service_role.

---

#### `config.invitation_templates`

One row per locked design. The host picks one; cannot edit template rows.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `slug` | text | UNIQUE NOT NULL | eternal, saffron, eucalyptus, noir, rosewater, bloom, moments |
| `name` | text | NOT NULL | display name in picker |
| `style_id` | uuid | NOT NULL FK → config.invitation_card_styles(id) ON DELETE RESTRICT | drives gallery filter |
| `layout` | text | NOT NULL CHECK (IN ('classic','photo')) | classic = text-only; photo = BG photo slot |
| `preview_key` | text | | R2 public key — full A5 card preview |
| `thumbnail_key` | text | | R2 public key — tile thumbnail |
| `default_photo_key` | text | | R2 public key — default BG photo (photo-layout only) |
| `display_order` | int | NOT NULL DEFAULT 0 | |
| `enabled` | bool | NOT NULL DEFAULT true | |
| `created_at` / `updated_at` | timestamptz | NOT NULL DEFAULT now() | `updated_at` via `set_updated_at()` |

**7 seed rows:** eternal(minimal/classic), saffron(royal/classic), eucalyptus(floral/classic), noir(modern/classic), rosewater(floral/classic), bloom(photo/photo), moments(photo/photo). `preview_key`/`thumbnail_key`/`default_photo_key` populated when R2 assets uploaded.
**RLS:** public read; no write policy.

---

#### `public.event_invitation_cards`

One row per invitation card. Dual-mode: template-based (`template_id` set, `card_upload_key` null) or uploaded (`template_id` null, `card_upload_key` set). Check constraint enforces exactly one mode.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `event_id` | uuid | NOT NULL FK → events(id) CASCADE | |
| `sub_event_id` | uuid | FK → event_sub_events(id) SET NULL | NULL = main event card |
| `is_default` | bool | NOT NULL DEFAULT false | one default per (event, sub-event) group |
| `template_id` | uuid | FK → config.invitation_templates(id) RESTRICT | NULL = upload mode |
| `is_custom` | bool | NOT NULL DEFAULT false | true once host edits any slot |
| `slot_eyebrow` | text | | e.g. "Join us for the wedding of" |
| `slot_couple` | text | | couple names |
| `slot_invite` | text | | invitation line |
| `slot_date` | text | | pre-filled from event/sub-event |
| `slot_time` | text | | pre-filled from sub-event; NULL for main event card |
| `slot_venue` | text | | pre-filled from event/sub-event venue |
| `slot_message` | text | | closing message |
| `card_upload_key` | text | | R2 private key — full uploaded card (upload mode only) |
| `photo_bg_key` | text | | R2 private key — host-uploaded BG photo (photo-layout only) |
| `share_token` | text | UNIQUE NOT NULL | 24-char hex, generated by DEFINER trigger on INSERT |
| `share_enabled` | bool | NOT NULL DEFAULT true | false = public link disabled (natural 404 via view) |
| `rendered_card_key` | text | | R2 public key — server-rendered PNG (render pipeline, future slice) |
| `rendered_pdf_key` | text | | R2 private key — server-rendered PDF (schema-planned, post-v1) |
| `render_status` | text | NOT NULL DEFAULT 'draft' CHECK (IN ('draft','rendering','ready','failed')) | |
| `created_by` / `updated_by` | uuid | FK → auth.users(id) SET NULL | server-stamped via shared DEFINER triggers |
| `created_at` / `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Check constraint:**
```sql
constraint invitation_card_mode_check check (
  (template_id is not null and card_upload_key is null)
  or (template_id is null and card_upload_key is not null)
)
```

**Partial unique indexes (two — NULL ≠ NULL in B-tree):**
```sql
create unique index invitation_cards_default_sub_event_idx
  on public.event_invitation_cards (event_id, sub_event_id)
  where is_default = true and sub_event_id is not null;

create unique index invitation_cards_default_main_event_idx
  on public.event_invitation_cards (event_id)
  where is_default = true and sub_event_id is null;
```

**Seeding:** `create_event_with_details` seeds one main event card (`sub_event_id = null`, `is_default = true`, template = `eternal`, `render_status = 'draft'`). Sub-event cards created via UI CRUD.
**RLS:** owner-only `FOR ALL to authenticated` using + with_check on `events.user_id = (select auth.uid())`.

---

## Views (derived)

The Planning module reads its derived numbers (budget Spent/Remaining, the expense breakdown, task progress) from three views — so aggregates are never stored (D24/D5/D7).

> ⚠️ **Footgun:** a plain `public` view runs **as its owner** and **bypasses RLS** — anyone could read every event's numbers. Every view below sets `security_invoker = on`, so the underlying-table RLS applies to the **caller** (the logged-in user only sees their own events' rows).

```sql
-- Total / Spent / Remaining per event
create view public.event_budget_summary as
select b.event_id, b.total_amount,
       coalesce(sum(e.amount),0)                  as spent,
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

-- Guest stats cards: counts by RSVP category + attending headcount + zero-assigned
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

-- Sidebar per-function guest counts
create view public.event_sub_event_guest_counts as
select event_id, sub_event_id, count(*) as guest_count
from public.event_guest_sub_events group by event_id, sub_event_id;
alter view public.event_sub_event_guest_counts set (security_invoker = on);

-- Media storage meter usage + counts (limit/tier come from entitlements LATER)
create view public.event_media_storage as
select event_id, coalesce(sum(byte_size),0) as used_bytes,
       count(*) filter (where kind='photo') as photo_count,
       count(*) filter (where kind='video') as video_count
from public.event_media group by event_id;
alter view public.event_media_storage set (security_invoker = on);

-- Album media counts (card shows when count >= 1; preset chips at 0)
create view public.event_album_counts as
select event_id, album_id, count(*) as media_count
from public.event_media_albums group by event_id, album_id;
alter view public.event_album_counts set (security_invoker = on);
```

> The guest views are additionally **`grant select to authenticated`** only (`revoke from anon`) — even aggregate headcounts are owner-private. `event_guest_stats` returns **no row** for a zero-guest event; the FE coalesces a missing row to all-zeros.

| View | Returns | Used by |
|---|---|---|
| `public.event_budget_summary` | `event_id, total_amount, spent, remaining, currency` | Budget header (Total / Spent / Remaining / Over). |
| `public.event_expense_breakdown` | `event_id, expense_type_id, name, icon_name, spent, item_count` | Budget breakdown rows per expense type. |
| `public.event_task_progress` | `event_id, done, total, percent` | Checklist progress "12 of 18 / 68%". |
| `public.event_guest_stats` | `event_id, total, attending, pending, declined, maybe, attending_headcount, zero_assigned` | Guest stats cards. |
| `public.event_sub_event_guest_counts` | `event_id, sub_event_id, guest_count` | Per-function sidebar counts. |
| `public.event_media_storage` | `event_id, used_bytes, photo_count, video_count` | Storage meter (limit/tier from entitlements later). |
| `public.event_album_counts` | `event_id, album_id, media_count` | Album cards (card ≥1, chip at 0). |

### Invitations views  `[NOW]`

| View | Security | Purpose |
|------|----------|---------|
| `public.event_invitation_card_summary` | security_invoker | Host-facing card list. Columns: id, event_id, sub_event_id, sub_event_label (coalesced from custom_name / sub_type name / 'Main Event'), template_name, template_style_id, template_layout, is_default, is_custom, render_status, share_token, share_enabled, is_uploaded_card, created_at, updated_at. Joins event_sub_events + config.event_sub_types + config.invitation_templates. |
| `public.invitation_card_guest_view` | no RLS — service_role access only | Public share path. Guest-safe columns only (no card_upload_key, photo_bg_key, rendered_pdf_key). `WHERE share_enabled = true` provides natural 404 when host disables link. The `/invite/[token]` API route reads ONLY this view via service_role client, never the base table. |

---

## Functions

| Function | Status | In plain terms |
|---|---|---|
| `public.set_updated_at()` | **[NOW]** | Stamps `updated_at` automatically on every row edit (attached to every table as a `before update` trigger). |
| `public.handle_new_user()` | [PLANNED] | Fires when someone signs up (`auth.users` insert) → creates their `user_profiles` + `user_preferences`, copying name/photo/email/phone from the login, then runs `link_pending_collaborators`. Must be `SECURITY DEFINER` with a pinned `search_path` (security). |
| `public.link_pending_collaborators(p_user_id uuid)` | [PLANNED] | On first verified login, matches the person's **Supabase-verified** email/phone to pending collaborator invites → fills `user_id`, status `active`. Idempotent (`where user_id is null`), verified-source only (no spoofing). |
| `public.can_access_event(p_event_id uuid)` | [PLANNED] | The single access check every security rule calls: is this person the **owner**, an **active collaborator**, or an **admin**? One place to evolve access logic. `SECURITY DEFINER`, `STABLE`, pinned `search_path`. |
| `public.create_event_with_details(...)` | **[NOW]** (built `planning_07`) | Creates an event + sub-events + seeded tasks + seeded expense types + an empty budget row in **one transaction**. Takes the owner from the login (`auth.uid()`) — **ignores the passed-in `p_user_id`**. `SECURITY DEFINER`, pinned `search_path`, `EXECUTE` revoked from `anon`. See below. |
| `public.event_task_counts(p_event_id uuid)` | **[NOW]** (built `planning_06`) | One grouped scan → `(total, todo, done, overdue)` for the toolbar chips (Overdue is derived, not a status). `security invoker`, `revoke from anon`, `grant authenticated`. |
| `public.bulk_set_task_status(p_task_ids uuid[], p_status_slug text)` | **[NOW]** (built `planning_06`) | Bulk-complete/reopen from the bulk bar: resolves the slug, **raises on an unknown slug**, updates all given tasks in the caller's events (RLS still applies). `plpgsql`, `security invoker`, `revoke from anon`, `grant authenticated`. |
| `public.delete_user_account(p_user_id uuid)` | [PLANNED] | Account deletion — see [Account deletion](#account-deletion). Storage purge must include the expense-receipt key prefix. |

```sql
-- [NOW] the shared updated_at stamper (live version pins search_path)
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end; $$;
```
> All `SECURITY DEFINER` functions must set `search_path` (e.g. `set search_path = ''` + fully-qualified names) and restrict `EXECUTE` to the right role — a security requirement, not optional.

**`public.event_task_counts(p_event_id uuid)`** — toolbar chips in one scan (Overdue is derived from `category='open' AND due_date < today`):
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
revoke execute on function public.event_task_counts(uuid) from anon;
grant  execute on function public.event_task_counts(uuid) to authenticated;
```

**`public.bulk_set_task_status(p_task_ids uuid[], p_status_slug text)`** — bulk-complete/reopen; resolves the slug and **raises** on an unknown one (RLS still scopes the update to the caller's tasks). `plpgsql`, `security invoker`, `revoke from anon`, `grant authenticated`.

**`public.create_event_with_details(p_user_id, p_event_type_id, p_name, p_primary_date, p_primary_venue, p_guest_capacity, p_metadata jsonb, p_sub_events jsonb)`** — built fresh (`SECURITY DEFINER`, pinned `search_path`, `EXECUTE` revoked from `anon`). In one transaction it:
- sets `events.user_id` **and** `events.created_by` from `auth.uid()` — **ignores `p_user_id`** (never trusts a passed-in id);
- builds `events.event_details` jsonb from the `p_metadata` `[{key,value}]` array;
- seeds the chosen sub-events from `p_sub_events`;
- seeds the checklist → `event_tasks` (status `pending`, priority from `event_checklists.default_priority_slug`, both resolved by slug);
- seeds `event_expense_types` from `config.expense_types`;
- inserts an empty `event_budgets` row;
- seeds `event_guest_tags` from `config.guest_tags` (`is_custom=false`, `created_by=null`, `on conflict do nothing`) — added in `guests_05`;
- seeds `event_albums` from `config.album_presets` (`is_custom=false`, `created_by=null`, `cover_media_id=null`, `on conflict do nothing`) — added in `media_05`.

> The `guests_05`/`media_05` re-extensions keep the same 8-param signature + `RpcResult` shape, so the live caller `app/api/events/route.ts:120` is unaffected. **D36:** the function stays monolithic until a 4th catalog-copy seed, then extract a `_seed_event_catalog` helper.

---

## Triggers

| Trigger | On | When | Does (plain) | Status |
|---|---|---|---|---|
| `trg_<table>_updated` (one per table) | every table | before update | stamps `updated_at` via `set_updated_at()` | **[NOW]** |
| signup hook | `auth.users` | on insert (signup) | creates profile + preferences (`handle_new_user`) | [PLANNED] |
| `prevent_role_change` | `public.user_profiles` | before update | blocks `role_slug` changing once set | [PLANNED] |
| `prevent_owner_as_collaborator` | `public.event_collaborators` | before insert/update | rejects a collaborator whose `user_id` = the event's owner (no double-count) | [PLANNED] |
| `event_task_assignee_before` | `public.event_task_assignees` | before insert/update | one consolidated guard: derives `event_id` from the task (rejects a mismatch — a forged `event_id` can't desync RLS), rejects unless `user_id` is the event **owner or an active collaborator**, and stamps `assigned_by = auth.uid()` on insert. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `stamp_created_by` | `public.event_expenses` | before insert | stamps `created_by = auth.uid()` server-side (never trust the client) | **[NOW]** |
| `stamp_budget_modified_by` | `public.event_budgets` | before insert/update | stamps `modified_by = auth.uid()` server-side | **[NOW]** |
| `default_guest_rsvp` | `public.event_guests` | before insert | sets `rsvp_status_id` to `pending` (by slug) when omitted — name-only/CSV inserts work | **[NOW]** |
| `stamp_guest_created_by` | `public.event_guests` | before insert | stamps `created_by = auth.uid()` (every guest is user-added) | **[NOW]** |
| `stamp_guest_tag_created_by` | `public.event_guest_tags` | before insert | stamps `created_by = auth.uid()` **only when `is_custom = true`** (seeds stay null) | **[NOW]** |
| `guest_sub_event_before` | `public.event_guest_sub_events` | before insert/update | derives `event_id` from the guest; rejects a `sub_event_id` from another event. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `guest_tag_link_before` | `public.event_guest_tag_links` | before insert/update | derives `event_id` from the guest; rejects a `tag_id` from another event. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `stamp_media_created_by` | `public.event_media` | before insert | stamps `created_by = auth.uid()` (every upload is user) | **[NOW]** |
| `stamp_album_created_by` | `public.event_albums` | before insert | stamps `created_by = auth.uid()` **only when `is_custom=true`** (seeded presets stay null — D33) | **[NOW]** |
| `album_cover_before` | `public.event_albums` | before insert/update | when `cover_media_id` set, rejects a cover media from another event. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `media_album_before` | `public.event_media_albums` | before insert/update | derives `event_id` from the media (RAISE if missing); rejects an `album_id` from another event. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `stamp_updated_by` | `event_media` / `event_albums` / `event_media_tags` | before update | stamps `updated_by = auth.uid()` (last-editor) — separate from `set_updated_at` (D37) | **[NOW]** |
| `stamp_media_tag_created_by` | `public.event_media_tags` | before insert | stamps `created_by = auth.uid()` | **[NOW]** |
| `media_tag_link_before` | `public.event_media_tag_links` | before insert/update | derives `event_id` from the media (RAISE if missing); rejects a `tag_id` from another event. `SECURITY DEFINER`, pinned `search_path`. | **[NOW]** |
| `trg_invitation_card_styles_updated` | `config.invitation_card_styles` | before update | stamps `updated_at` via `set_updated_at()` | **[NOW]** |
| `trg_invitation_templates_updated` | `config.invitation_templates` | before update | stamps `updated_at` via `set_updated_at()` | **[NOW]** |
| `trg_invitation_cards_updated` | `public.event_invitation_cards` | before update | stamps `updated_at` via `set_updated_at()` | **[NOW]** |
| `trg_invitation_cards_updated_by` | `public.event_invitation_cards` | before update | stamps `updated_by = auth.uid()` — reuses shared `stamp_updated_by` (D37) | **[NOW]** |
| `trg_invitation_cards_created_by` | `public.event_invitation_cards` | before insert | stamps `created_by = auth.uid()` — reuses shared `stamp_created_by` | **[NOW]** |
| `trg_invitation_cards_share_token` | `public.event_invitation_cards` | before insert | generates `share_token = encode(gen_random_bytes(12),'hex')` if blank. SECURITY DEFINER, pinned search_path. | **[NOW]** |

> All the Guest guard/default/stamp trigger functions are `SECURITY DEFINER`, `search_path=''`, schema-qualified, `EXECUTE` revoked from `public`/`anon`/`authenticated`, and **BEFORE-only** (mutate `NEW`/`RAISE`, never write) so the row still passes the caller's RLS `with_check`.

---

## Security (row-level security)

Because Supabase lets the app talk to the database directly over the internet, we don't trust app code to keep people out — **the database itself enforces who can see/change each row.** Those rules are RLS.

**Status: BASELINE APPLIED (owner-only).** RLS is ON for every table (migration `core_06`): catalogs are public-read; each person sees/edits only their own profile, preferences, events, and an event's children (`(select auth.uid())` wrapped for performance, policies target `authenticated`). The **collaborator-aware layer is still pending** — when built, the event-child policies will call `can_access_event()` (owner OR active collaborator OR admin) so access logic lives in one place.

**Intended access (planned):**

| Table | Who can read | Who can change |
|---|---|---|
| `config.*` (all catalogs) | everyone (public reference data) | only admins (back-office) |
| `public.user_profiles` / `user_preferences` | the person themselves | the person themselves |
| `public.events` | owner, active collaborators, admin (`can_access_event`) | owner (later: collaborators by role) |
| `public.event_sub_events` / `event_tasks` | same as their event | same as their event |
| `public.event_collaborators` | the event's people | the event's owner |
| `public.event_guests` + guest children | same as their event | same as their event |

Notes: policies will target `authenticated` (not `public`); `auth.uid()` wrapped as `(select auth.uid())` for performance; every event-child policy calls `can_access_event(event_id)`.

### Planning module RLS  `[NOW]`

RLS was **enabled in the table-creation migration** (`planning_03`); the policies were added in `planning_05`. All 4 new `public.*` tables (`event_task_assignees`, `event_budgets`, `event_expense_types`, `event_expenses`) get **one `FOR ALL` owner-only policy** using the same inlined predicate the live CORE child tables use — **not** `can_access_event()` (it's still `[PLANNED]`; D26). All event-children (old + new) convert to `can_access_event()` together in the later collaborator pass.

```sql
-- event-child pattern (event_budgets shown; expense_types / expenses / task_assignees identical on their own event_id)
create policy event_budgets_owner on public.event_budgets for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_budgets.event_id and e.user_id = (select auth.uid())));
```

`event_task_assignees` uses its **own** `event_id` column (single-hop, thanks to the `event_task_assignee_before` guard trigger that keeps it == the task's `event_id`).

**Catalogs** (`config.task_priorities`, `config.task_statuses`, `config.expense_types`) mirror the live `config.*` pattern exactly: RLS on, one `SELECT` policy `using (true)` for `{anon, authenticated}`, **no** write policy (admin writes via `service_role`), plus `grant usage`/`grant select` — and `config` must stay in *Exposed schemas*.

**Views** are `security_invoker = on` so the caller's RLS on the underlying tables applies ([Views](#views-derived)).

**PII / financial notes:**
- Assignee names/avatars come via a **restricted same-event view or `security definer` RPC** returning `display_name`/`avatar_url` only — never widen `user_profiles` RLS, never return email/phone.
- `receipt_key` → R2 object is **private**, served via short-lived signed URLs minted by a server route that first checks event access; the expense-receipt prefix is purged by `delete_user_account` (see `docs/R2-STORAGE-GUIDE.md`).

### Guest Management module RLS  `[NOW]`

RLS **enabled in the table-creation migration** (`guests_02`); policies added in `guests_04`. `event_guests`, `event_guest_sub_events`, `event_guest_tag_links` each get **one `FOR ALL` owner-only policy** on their `event_id` (the join tables' `event_id` is guard-trigger-populated → single-hop). `event_guest_tags` is **split**: SELECT/UPDATE/DELETE are owner-only (so the tag manager can rename/delete seeded tags), but **INSERT additionally requires `is_custom = true`** — a client can't forge a system-seeded tag; the `create_event_with_details` DEFINER seed bypasses RLS to write the `is_custom=false` defaults (D30).

**Catalogs** (`config.rsvp_statuses`, `config.guest_tags`) mirror the standard `config.*` pattern (RLS on, `SELECT using(true)`, no write policy, `grant select`). **PII:** `event_guests` holds guest contact (name/email/phone) — owner-only `authenticated`, no anon path; the guest views are `authenticated`-only grants.

### Media & Memories module RLS  `[NOW]`

RLS **enabled in the creating migration** (`media_02`); policies in `media_04`. `event_media` + `event_media_albums` get one `FOR ALL` owner-only policy on their `event_id`. `event_albums` is **split** (like `event_guest_tags`, D30): SELECT/UPDATE/DELETE owner-only (rename/delete seeded albums OK), **INSERT requires `is_custom=true`** (clients can't forge a preset; the DEFINER seed bypasses RLS). Catalog `config.album_presets`: `SELECT using(true)`, DML revoked from `anon`/`authenticated`, admin via `service_role`.

**Storage (the crux):** media keys point at the **private** R2 bucket. RLS protects the rows; the **objects** are served only via short-lived signed URLs from a route that re-derives the event from the key and runs the same owner check as RLS (never trusts a client `event_id`). The `storage_key` CHECK keeps a row's key under its own `events/{event_id}/…` prefix. `published=true` media stay private for now (anon-read deferred — D35; safe future pattern = signed URLs via a public-site route, never `anon SELECT using(published)`). `byte_size` is advisory (server-stamp from R2 HEAD). Single-photo delete must purge both `storage_key`+`thumbnail_key` via a server route (raw client `.delete()` orphans the objects). The `delete_user_account` prefix purge covers media keys.

The media-tag tables (`event_media_tags`, `event_media_tag_links`, D37) get one `FOR ALL` owner-only policy each (RLS enabled in `media_06`); no `is_custom` split (pure host-created, nothing to forge); the link's `event_id` is guard-derived from the media.

### Invitations module RLS  `[NOW]`

RLS enabled in `inv_03`. `event_invitation_cards` gets one `FOR ALL` owner-only policy for `authenticated` with matching `USING` and `WITH CHECK` predicates:

```sql
create policy invitation_cards_owner
  on public.event_invitation_cards
  for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_invitation_cards.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_invitation_cards.event_id and e.user_id = (select auth.uid())));
```

Catalogs (`config.invitation_card_styles`, `config.invitation_templates`) follow the standard `config.*` pattern: `SELECT using(true)`, no write policy, `grant select` to `anon/authenticated`.

**Public share URL** `/invite/{share_token}`: the Next.js API route uses `service_role` client to query `invitation_card_guest_view` (bypasses RLS) — guest-safe columns only, `WHERE share_enabled = true` handles revocation. `/invite/*` added to `lib/supabase/middleware.ts` public paths.

---

## Auth & login setup

How people get in (documented here because login is Supabase):

- **Ways to log in:** phone number with a one-time SMS code (India +91), or Google sign-in. **No passwords.**
- **First login:** Supabase creates the `auth.users` record → the signup hook creates the profile + preferences → the person picks a role (Host / Vendor) once.
- **Admins:** log in the same way; the admin role is set by us directly in the database, never self-chosen.
- **Two-step verification (2FA):** available later via Supabase's built-in MFA — not a column we store.

---

## File storage (images)

- Profile photos and event cover images are **files**, not database rows. They live in file storage (Cloudflare R2 for this project); the database stores only the **link** (`user_profiles.avatar_url`, `events.cover_image_url`).
- **Deleting a row does not delete the file** — anything that removes user/event data must also purge the storage objects (by prefix). See [Account deletion](#account-deletion).
- Upload/serve details live in `docs/R2-STORAGE-GUIDE.md`; this doc only notes which columns hold the links.

---

## Account deletion

A "delete my account" button (User Settings) removes everything the person owns and detaches them from everything else.

**How it works:**
1. The button calls a **secure server action** (Edge Function / API route) using the `service_role` key — a normal logged-in user can't delete their own `auth.users` row.
2. The action (`delete_user_account`): (a) confirms it's the person themselves (or an admin); (b) **purges their storage files** (avatar + their events' media — files aren't rows, so the DB won't); (c) deletes the `auth.users` row.
3. Deleting `auth.users` fires the `ON DELETE CASCADE` chain automatically:

```
delete auth.users(id)
 ├─ user_profiles            (cascade)
 ├─ user_preferences         (cascade)
 ├─ events where user_id = them   (cascade) → event_sub_events, event_tasks, event_task_assignees,
 │                                             event_budgets, event_expense_types, event_expenses,
 │                                             event_guests, event_guest_sub_events, event_guest_tags,
 │                                             event_guest_tag_links, event_media, event_albums,
 │                                             event_media_albums, event_media_tags, event_media_tag_links,
 │                                             event_collaborators, event_feature_overrides
 ├─ event_task_assignees where user_id = them (cascade — unassigns them from others' tasks; those tasks stay)
 └─ event_collaborators where user_id = them  (cascade — removes them from others' events; those events stay)
events.created_by / event_expenses.created_by / event_budgets.modified_by / event_task_assignees.assigned_by
  / event_guests.created_by / event_guest_tags.created_by / event_media.created_by / event_albums.created_by
  / *.updated_by (event_media/event_albums/event_media_tags) / event_media_tags.created_by = them → SET NULL
  (event_albums.cover_media_id → SET NULL on media delete, not user delete — moot here since the whole event cascades)
```
> **Storage:** the DB cascade does **not** delete R2 objects. The purge step must also remove each event's prefix — `events/{eventId}/…` — which covers media, invitations, **and expense receipts** (`event_expenses.receipt_key`). See `docs/R2-STORAGE-GUIDE.md`.

**Why `created_by` is `SET NULL`** (D18): with `RESTRICT` the database would refuse to delete any user who ever created an event — the delete button could never work. `SET NULL` lets deletion proceed; a deleted vendor's client events keep going with `created_by = NULL` (snapshot the name elsewhere if billing needs it).

**Product choice:** immediate hard delete with a strong "type DELETE to confirm" prompt (MVP), or mark-for-deletion + purge after ~30 days (grace period, nicer for accidental clicks / DPDP). Default: immediate + confirmation.

---

## Enablement & entitlements (PLANNED)

How modules and paid features get turned on. **Two layers, ANDed** (D17):

- **Availability** — does this event *type* even have this module? (`config.event_type_modules`)
- **Entitlement** — has this event's *plan* unlocked this feature, or is it overridden? (`config.plan_features` + `public.event_feature_overrides`)

**Effective state:**
```
is_on(event, feature) =
   event_type supports feature's module
   AND ( per-event override present ? override.enabled
         : feature.is_free OR plan unlocks it )
```
A type that lacks a module can never have it unlocked; a free feature is always on; a per-event override (one-time purchase / comp / beta) wins.

```sql
create table config.modules (                 -- master list of app sections
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- sub_events|guests|budget|website|media|invitations
  name text not null, description text, icon_name text,
  is_core boolean not null default false,     -- core modules can't be gated off
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.event_type_modules (      -- which modules a TYPE supports
  event_type_id uuid not null references config.event_types(id) on delete cascade,
  module_id uuid not null references config.modules(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (event_type_id, module_id)
);
create table config.features (                 -- unlockable capabilities
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- media_unlimited|website_custom_domain|...
  name text not null, module_id uuid references config.modules(id) on delete set null,
  is_free boolean not null default true,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.plans (                    -- one-time tiers
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                  -- free|premium|elite
  name text not null, display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table config.plan_features (            -- plan → feature unlock map
  plan_id uuid not null references config.plans(id) on delete cascade,
  feature_id uuid not null references config.features(id) on delete cascade,
  enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (plan_id, feature_id)
);
create table public.event_feature_overrides (  -- typed per-event override (NOT jsonb)
  event_id uuid not null references public.events(id) on delete cascade,
  feature_id uuid not null references config.features(id) on delete restrict,
  enabled boolean not null, reason text,       -- one_time_purchase|comp|beta
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  primary key (event_id, feature_id)
);
-- + public.events.plan_id uuid references config.plans(id)  (per-event tier)
```
Built when we reach the Admin (catalog management) and Billing/Settings pages.

---

## Derived (computed, never stored)

| Value | Source |
|---|---|
| Progress "12 of 18" / "68%" | `count(*) filter (where s.category = 'done')` / `count(*)` over `public.event_tasks` joined to `config.task_statuses` (the `public.event_task_progress` view) |
| Task **Overdue** count | `count(*) filter (where s.category = 'open' and t.due_date < current_date)` (via `event_task_counts` RPC) |
| Budget **Spent** / **Remaining** / Over | `sum(event_expenses.amount)` and `total_amount − spent` via `public.event_budget_summary` (never stored on `event_budgets`) |
| Budget **breakdown** (per expense type) | `sum(amount)` + `count(*)` grouped by `expense_type_id` via `public.event_expense_breakdown` |
| Guest **stats** (total / by RSVP category) + **attending headcount** + **zero-assigned** | counts + `sum(party_size) filter (category='attending')` over `event_guests` via `public.event_guest_stats` |
| **Per-function guest count** | `count(*)` grouped by `sub_event_id` via `public.event_sub_event_guest_counts` |
| Media **storage used** + photo/video counts | `sum(byte_size)` + filtered counts over `event_media` via `public.event_media_storage` (limit/tier from entitlements later) |
| Album **media count** (card-vs-chip) | `count(*)` grouped by `album_id` via `public.event_album_counts` (no row = 0 = chip) |
| "has sub-events" / "has collaborators" badges | `EXISTS` over `event_sub_events` / `event_collaborators` (status `active`) |
| Guest roll-up | `sum(guest_count)` over `event_sub_events` |
| Days-to-event | `events.primary_date - current_date` |
| Feature on/off | the `is_on()` resolution above (availability AND entitlement) |

---

## Deferred / out of scope

- **RLS + `can_access_event()`** — policies + the access helper + signup-trigger hardening.
- **Planning follow-ups** — the Planning module is **built** (Checklist/Tasks + Budget; names finalized, no rename). Still deferred within it: task **status-history** (`event_task_status_events` — latest-only now), **assignee FE wiring** (table built, no UI this pass), **receipt upload** (R2 signed-URL serving), **sub-event budget breakdown** (data captured, not surfaced), and a **real `vendor_id` FK** (free-text `vendor_name` for MVP).
- **Vendor side** — `config.user_types` has the slug; vendor profiles/services/bookings (`vendor_*`) are a separate scope.
- **Feature modules** — Guests/RSVP, Media, Invitations, Website, Event Settings, Admin, Chatbot — each FKs to `public.events` / `auth.users`.
- **Collaborator role → permissions matrix**, ownership-transfer history, invite tokens/expiry, billing payment records.

---

## Build order

```sql
-- 1. config schema + expose it to the auto-API
create schema if not exists config;
grant usage on schema config to anon, authenticated;
-- then: Dashboard → Project Settings → API → Exposed schemas → add 'config'

-- 2. shared trigger function: public.set_updated_at()  (see Conventions)
```
3. **Catalogs** (`config`): `user_types`, `event_types`, `event_sub_types`, `event_checklists`.
4. `grant select on all tables in schema config to anon, authenticated;`
5. **Identity** (`public`): `user_profiles`, `user_preferences`.
6. **Event data** (`public`): `events`, then `event_sub_events`, `event_collaborators`, `event_tasks`.
7. **Seed** the catalogs.
8. **Planning module** (live, migrations `planning_01`–`planning_07`): `planning_01` Planning catalogs (`task_priorities`, `task_statuses`, `expense_types`) + seeds + RLS (select-only) + grants; `planning_02` extend `event_checklists` (`default_priority_slug` +backfill) and `event_tasks` (+4 cols NOT NULL, **drop `is_done`**, indexes); `planning_03` the 4 new live tables (RLS **enabled here**) + `updated_at`/guard/attribution triggers; `planning_04` the 3 `security_invoker` views; `planning_05` owner-only RLS policies; `planning_06` `event_task_counts` + `bulk_set_task_status`; `planning_07` (re)build `create_event_with_details`. Then `npx supabase gen types` → refresh `lib/supabase/database.types.ts`; `get_advisors` (security + performance) reviewed clean/accepted.
9. **Invitations module** (live, migrations `inv_01`–`inv_06`): `inv_01` `config.invitation_card_styles` + 5 seeds + RLS; `inv_02` `config.invitation_templates` + 7 seeds + RLS; `inv_03` `event_invitation_cards` + check constraint + 2 partial unique indexes + 4 triggers + owner RLS (WITH CHECK); `inv_04` `event_invitation_card_summary` + `invitation_card_guest_view`; `inv_05` extend `create_event_with_details` (main event card seed, idempotency guard); `inv_06` DATA-MODEL.md + ERD.md doc update. Then `npx supabase gen types` → refresh `lib/supabase/database.types.ts`.
10. **(Later passes)** signup trigger + `link_pending_collaborators`; RLS + `can_access_event()` (cuts over all event-children, old + new); `delete_user_account`; the [enablement & entitlements](#enablement--entitlements-planned) tables.
