# Invitations Card Data Model — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the database layer for the invitation card personalizer — two config catalog tables, one per-event card table, two views, an extended `create_event_with_details` RPC, plus doc sync to DATA-MODEL.md and ERD.md.

**Architecture:** 6 forward-only migrations (`inv_01`–`inv_06`) applied directly to the Supabase dev project via the MCP `apply_migration` tool. No local SQL files — Supabase is the source of truth. Each migration is self-contained and idempotent where possible. The invitations module FKs only to `public.events` / `auth.users` / `public.event_sub_events` (Events Core) and to `config.*` — never to another module's tables (rule #7).

**Tech Stack:** Supabase Postgres (project `smjkbmkxweevqpvygabe`, ap-northeast-1), Supabase MCP (`mcp__2b7b199a-87b8-457a-a447-a3cb163b5b0f__*`), Next.js 14 App Router (`lib/supabase/middleware.ts`), `npx supabase gen types typescript`.

**Spec:** `docs/superpowers/specs/2026-06-16-invitations-card-personalizer-design.md`

---

### Task 0: Pre-flight checks

Verify three things before writing any DDL. No changes — read-only queries only.

**Files:**
- Read-only queries against live Supabase DB

- [ ] **Step 1 — I7: confirm `event_sub_events` is Events Core**

Run via Supabase MCP `execute_sql`:
```sql
select table_schema, table_name
from information_schema.tables
where table_name = 'event_sub_events';
```
Expected: one row, `table_schema = 'public'`. This confirms `event_sub_events` is in Events Core (not a module table) — the FK from `event_invitation_cards.sub_event_id → event_sub_events(id)` is therefore a Core FK, compliant with rule #7.

- [ ] **Step 2 — I8: check if `stamp_created_by` is a reusable generic**

```sql
select pg_get_functiondef(oid)
from pg_proc
where proname = 'stamp_created_by'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');
```
**If the body is just `NEW.created_by = auth.uid(); return NEW;` (generic stamp):** we can reuse it in `inv_03` by attaching a new trigger — no new function needed.
**If it has expense-specific logic:** create a new `stamp_invitation_card_created_by` function in `inv_03` instead.

- [ ] **Step 3 — I8: confirm `stamp_updated_by` is the shared D37 function**

```sql
select pg_get_functiondef(oid)
from pg_proc
where proname = 'stamp_updated_by'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');
```
Expected: body is `NEW.updated_by = auth.uid(); return NEW;`. This function is already attached to `event_media`, `event_albums`, `event_media_tags`. We will reuse it for `event_invitation_cards` — no new function needed for updated_by.

- [ ] **Step 4 — fetch current `create_event_with_details` body (prep for inv_05)**

```sql
select pg_get_functiondef(oid)
from pg_proc
where proname = 'create_event_with_details'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');
```
Copy the output — you will need the full body in Task 5. Identify the final `return v_event_id;` line. The invitation seed block goes immediately before that line.

---

### Task 1: inv_01 — `config.invitation_card_styles`

Five-row filter-chip catalog. Public-read. Admin-write via service_role only.

**Files:**
- Migration: `inv_01` (applied via Supabase MCP)

- [ ] **Step 1 — apply migration `inv_01`**

Apply via `mcp__2b7b199a-87b8-457a-a447-a3cb163b5b0f__apply_migration` with name `inv_01` and SQL:

```sql
-- inv_01: config.invitation_card_styles

create table config.invitation_card_styles (
  id           uuid        primary key default gen_random_uuid(),
  slug         text        unique not null,
  name         text        not null,
  display_order int        not null default 0,
  enabled      bool        not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger trg_invitation_card_styles_updated
  before update on config.invitation_card_styles
  for each row execute function public.set_updated_at();

-- RLS
alter table config.invitation_card_styles enable row level security;

create policy "public read"
  on config.invitation_card_styles
  for select to anon, authenticated
  using (true);
-- No write policies: admin writes via service_role only.

-- Grants (config schema already granted from core; ensure table-level)
grant select on config.invitation_card_styles to anon, authenticated;

-- Seed rows
insert into config.invitation_card_styles (slug, name, display_order) values
  ('minimal', 'Minimal', 1),
  ('royal',   'Royal',   2),
  ('floral',  'Floral',  3),
  ('modern',  'Modern',  4),
  ('photo',   'Photo',   5)
on conflict (slug) do nothing;
```

- [ ] **Step 2 — smoke test**

```sql
select slug, name, display_order from config.invitation_card_styles order by display_order;
```
Expected: 5 rows in order: minimal, royal, floral, modern, photo.

```sql
-- verify RLS: anon can read
set role anon;
select count(*) from config.invitation_card_styles;
reset role;
```
Expected: 5.

---

### Task 2: inv_02 — `config.invitation_templates`

Seven locked template rows. `style_id` is a UUID FK to `config.invitation_card_styles(id)` (not slug — I2 fix). Public-read.

**Files:**
- Migration: `inv_02` (applied via Supabase MCP)

- [ ] **Step 1 — apply migration `inv_02`**

```sql
-- inv_02: config.invitation_templates

create table config.invitation_templates (
  id                uuid        primary key default gen_random_uuid(),
  slug              text        unique not null,
  name              text        not null,
  style_id          uuid        not null
                                  references config.invitation_card_styles(id)
                                  on delete restrict,
  layout            text        not null
                                  check (layout in ('classic', 'photo')),
  preview_key       text,
  thumbnail_key     text,
  default_photo_key text,
  display_order     int         not null default 0,
  enabled           bool        not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger trg_invitation_templates_updated
  before update on config.invitation_templates
  for each row execute function public.set_updated_at();

-- RLS
alter table config.invitation_templates enable row level security;

create policy "public read"
  on config.invitation_templates
  for select to anon, authenticated
  using (true);

grant select on config.invitation_templates to anon, authenticated;

-- Seed rows: look up style_id by slug (avoids hardcoded UUIDs)
insert into config.invitation_templates (slug, name, style_id, layout) values
  ('eternal',    'Eternal',    (select id from config.invitation_card_styles where slug = 'minimal'), 'classic'),
  ('saffron',    'Saffron',    (select id from config.invitation_card_styles where slug = 'royal'),   'classic'),
  ('eucalyptus', 'Eucalyptus', (select id from config.invitation_card_styles where slug = 'floral'),  'classic'),
  ('noir',       'Noir',       (select id from config.invitation_card_styles where slug = 'modern'),  'classic'),
  ('rosewater',  'Rosewater',  (select id from config.invitation_card_styles where slug = 'floral'),  'classic'),
  ('bloom',      'Bloom',      (select id from config.invitation_card_styles where slug = 'photo'),   'photo'),
  ('moments',    'Moments',    (select id from config.invitation_card_styles where slug = 'photo'),   'photo')
on conflict (slug) do nothing;
```

- [ ] **Step 2 — smoke test**

```sql
select t.slug, t.name, s.slug as style, t.layout
from config.invitation_templates t
join config.invitation_card_styles s on s.id = t.style_id
order by t.display_order;
```
Expected: 7 rows. `bloom` and `moments` have `style = 'photo'` and `layout = 'photo'`. All others are `layout = 'classic'`.

---

### Task 3: inv_03 — `public.event_invitation_cards`

Main table. Includes check constraint, two partial unique indexes, three BEFORE triggers, and owner-only RLS with `WITH CHECK`.

**Files:**
- Migration: `inv_03` (applied via Supabase MCP)

- [ ] **Step 1 — determine trigger function strategy (from Task 0 results)**

Based on Task 0 Step 2 outcome:

**Path A (stamp_created_by IS generic):** no new created_by function needed — attach it as a trigger.

**Path B (stamp_created_by is NOT generic):** create this function first (shown in Step 2).

- [ ] **Step 2 — apply migration `inv_03`**

Use the appropriate trigger block based on Task 0 Step 2. The migration below shows Path A (reuse `stamp_created_by` and `stamp_updated_by`). If on Path B, replace the trigger attachment for `stamp_invitation_card_created_by` with the new function definition shown after the main SQL.

```sql
-- inv_03: public.event_invitation_cards

create table public.event_invitation_cards (
  id               uuid        primary key default gen_random_uuid(),
  event_id         uuid        not null
                                 references public.events(id) on delete cascade,
  sub_event_id     uuid
                                 references public.event_sub_events(id) on delete set null,
  is_default       bool        not null default false,
  template_id      uuid
                                 references config.invitation_templates(id) on delete restrict,
  is_custom        bool        not null default false,
  slot_eyebrow     text,
  slot_couple      text,
  slot_invite      text,
  slot_date        text,
  slot_time        text,
  slot_venue       text,
  slot_message     text,
  card_upload_key  text,
  photo_bg_key     text,
  share_token      text        unique not null default '',
  share_enabled    bool        not null default true,
  rendered_card_key text,
  rendered_pdf_key text,
  render_status    text        not null default 'draft'
                                 check (render_status in ('draft','rendering','ready','failed')),
  created_by       uuid
                                 references auth.users(id) on delete set null,
  updated_by       uuid
                                 references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint invitation_card_mode_check check (
    (template_id is not null and card_upload_key is null)
    or
    (template_id is null and card_upload_key is not null)
  )
);

-- Partial unique indexes (two needed: NULL ≠ NULL in B-tree)
create unique index invitation_cards_default_sub_event_idx
  on public.event_invitation_cards (event_id, sub_event_id)
  where is_default = true and sub_event_id is not null;

create unique index invitation_cards_default_main_event_idx
  on public.event_invitation_cards (event_id)
  where is_default = true and sub_event_id is null;

-- Performance index: host card list queries
create index invitation_cards_event_id_idx
  on public.event_invitation_cards (event_id);

-- updated_at trigger (shared set_updated_at)
create trigger trg_invitation_cards_updated
  before update on public.event_invitation_cards
  for each row execute function public.set_updated_at();

-- updated_by trigger (reuse shared stamp_updated_by from D37 — I8)
-- I4: auth.uid() in a SECURITY DEFINER trigger reads request.jwt.claims (session setting),
--     NOT the definer's identity — it correctly returns the calling user's ID.
create trigger trg_invitation_cards_updated_by
  before update on public.event_invitation_cards
  for each row execute function public.stamp_updated_by();

-- created_by trigger (reuse stamp_created_by if generic — I8)
create trigger trg_invitation_cards_created_by
  before insert on public.event_invitation_cards
  for each row execute function public.stamp_created_by();

-- share_token trigger: generate on INSERT if not already set
create or replace function public.generate_invitation_share_token()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.share_token is null or new.share_token = '' then
    new.share_token := encode(gen_random_bytes(12), 'hex');
  end if;
  return new;
end;
$$;
revoke execute on function public.generate_invitation_share_token() from public, anon, authenticated;

create trigger trg_invitation_cards_share_token
  before insert on public.event_invitation_cards
  for each row execute function public.generate_invitation_share_token();

-- RLS (owner-only; WITH CHECK added — I3; (select auth.uid()) wrap for performance)
alter table public.event_invitation_cards enable row level security;

create policy invitation_cards_owner
  on public.event_invitation_cards
  for all to authenticated
  using (
    exists (
      select 1 from public.events e
      where e.id = event_invitation_cards.event_id
        and e.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.events e
      where e.id = event_invitation_cards.event_id
        and e.user_id = (select auth.uid())
    )
  );
```

**Path B only — if `stamp_created_by` is NOT generic, replace the trigger attachment with this function + trigger:**
```sql
-- (Path B) new per-table created_by stamper
create or replace function public.stamp_invitation_card_created_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- I4: auth.uid() reads request.jwt.claims (session context), not definer identity.
  --     Always returns the calling authenticated user's ID.
  new.created_by := auth.uid();
  return new;
end;
$$;
revoke execute on function public.stamp_invitation_card_created_by() from public, anon, authenticated;

create trigger trg_invitation_cards_created_by
  before insert on public.event_invitation_cards
  for each row execute function public.stamp_invitation_card_created_by();
```

- [ ] **Step 3 — smoke test**

```sql
-- Table exists with correct columns
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'event_invitation_cards'
order by ordinal_position;
```

```sql
-- Check constraint and partial indexes exist
select indexname, indexdef
from pg_indexes
where tablename = 'event_invitation_cards';
```
Expected: 3 indexes — `invitation_cards_default_sub_event_idx`, `invitation_cards_default_main_event_idx`, `invitation_cards_event_id_idx`.

```sql
-- RLS is on
select relname, relrowsecurity
from pg_class
where relname = 'event_invitation_cards';
```
Expected: `relrowsecurity = true`.

```sql
-- All 4 triggers attached
select trigger_name, event_manipulation, action_timing
from information_schema.triggers
where event_object_table = 'event_invitation_cards'
order by trigger_name;
```
Expected: `trg_invitation_cards_created_by` (INSERT), `trg_invitation_cards_share_token` (INSERT), `trg_invitation_cards_updated` (UPDATE), `trg_invitation_cards_updated_by` (UPDATE).

---

### Task 4: inv_04 — Views

Two views: host-facing summary (security_invoker) and public share path (guest-safe only).

**Files:**
- Migration: `inv_04` (applied via Supabase MCP)

- [ ] **Step 1 — apply migration `inv_04`**

```sql
-- inv_04: event_invitation_card_summary + invitation_card_guest_view

-- Host-facing summary view (security_invoker — RLS on base tables enforces access)
create view public.event_invitation_card_summary
with (security_invoker = on) as
select
  c.id,
  c.event_id,
  c.sub_event_id,
  coalesce(ese.custom_name, cest.name, 'Main Event') as sub_event_label,
  t.name                              as template_name,
  t.style_id                          as template_style_id,
  t.layout                            as template_layout,
  c.is_default,
  c.is_custom,
  c.render_status,
  c.share_token,
  c.share_enabled,
  (c.card_upload_key is not null)     as is_uploaded_card,
  c.created_at,
  c.updated_at
from public.event_invitation_cards c
left join public.event_sub_events ese on ese.id = c.sub_event_id
left join config.event_sub_types cest on cest.id = ese.event_sub_type_id
left join config.invitation_templates t on t.id = c.template_id;

-- Grant to authenticated (not anon — host only)
grant select on public.event_invitation_card_summary to authenticated;

-- Public share path view (service_role reads this; WHERE share_enabled = true = natural 404)
-- Private R2 keys (card_upload_key, photo_bg_key, rendered_pdf_key) are absent.
create view public.invitation_card_guest_view as
select
  c.id,
  c.event_id,
  c.sub_event_id,
  c.template_id,
  c.slot_eyebrow,
  c.slot_couple,
  c.slot_invite,
  c.slot_date,
  c.slot_time,
  c.slot_venue,
  c.slot_message,
  c.rendered_card_key,
  c.render_status,
  c.share_token,
  c.share_enabled,
  t.name              as template_name,
  t.style_id          as style_id,
  t.layout,
  t.default_photo_key
from public.event_invitation_cards c
left join config.invitation_templates t on t.id = c.template_id
where c.share_enabled = true;

-- No RLS on views; service_role bypasses RLS when reading invitation_card_guest_view.
-- anon/authenticated should NOT query this view directly — API route uses service_role.
-- Do NOT grant select to anon/authenticated — leave default (deny).
```

- [ ] **Step 2 — smoke test**

```sql
-- Both views exist
select table_name, table_type
from information_schema.tables
where table_schema = 'public'
  and table_name in ('event_invitation_card_summary', 'invitation_card_guest_view');
```
Expected: 2 rows, `table_type = 'VIEW'` for both.

```sql
-- Guest view columns (verify no private keys present)
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'invitation_card_guest_view'
order by ordinal_position;
```
Verify `card_upload_key`, `photo_bg_key`, `rendered_pdf_key` are NOT in the column list.

---

### Task 5: inv_05 — Extend `create_event_with_details`

Add the invitation card seed block (main event card only — I5 decision). Rebuilds the full function with `create or replace`.

**Files:**
- Migration: `inv_05` (applied via Supabase MCP)

- [ ] **Step 1 — fetch current function body**

```sql
select pg_get_functiondef(oid)
from pg_proc
where proname = 'create_event_with_details'
  and pronamespace = (select oid from pg_namespace where nspname = 'public');
```
Copy the entire output. You need the full body for Step 2.

- [ ] **Step 2 — locate the insertion point**

In the copied function body, find the last block before the final `return v_event_id;`. The current last seed block is the album presets seed (`insert into public.event_albums ... from config.album_presets ...`). Insert the invitation block **after** the album presets block and **before** `return v_event_id;`.

- [ ] **Step 3 — apply migration `inv_05`**

Apply with `name = 'inv_05'`. The SQL is the full `create or replace function` with this block added before `return v_event_id;`:

```sql
-- Invitation card seed block (added inv_05)
-- Seeds one main event card (sub_event_id = null, is_default = true).
-- Sub-event cards are created via UI CRUD (I5 decision).
-- WHERE NOT EXISTS is the idempotency guard (I6) — safe to re-run.
insert into public.event_invitation_cards (
  event_id,
  sub_event_id,
  is_default,
  template_id,
  slot_date,
  slot_venue,
  is_custom,
  render_status
)
select
  v_event_id,
  null,
  true,
  (select id from config.invitation_templates where slug = 'eternal'),
  p_primary_date::text,
  p_primary_venue,
  false,
  'draft'
where not exists (
  select 1 from public.event_invitation_cards
  where event_id = v_event_id
    and sub_event_id is null
    and is_default = true
);
```

⚠️ The full migration SQL must be the **complete** `create or replace function public.create_event_with_details(...)` body, not just this block. Copy the existing body from Step 1, add this block, wrap in `create or replace function`.

- [ ] **Step 4 — smoke test (end-to-end)**

Use an existing event in the dev DB to test the seed re-run (idempotency):
```sql
-- Pick any event_id from dev DB
select id, primary_date, primary_venue from public.events limit 1;

-- Call the function with that event's details to simulate re-creation
-- (or test with a fresh function call via the app)

-- Verify a main event card exists for a known event
select id, sub_event_id, is_default, template_id, slot_date, render_status
from public.event_invitation_cards
where event_id = '<paste an event_id here>'
  and sub_event_id is null
  and is_default = true;
```

Create a **new** test event through the app (or via direct RPC call) and verify the card is auto-seeded:
```sql
-- After creating a new event through the API:
select eic.id, eic.is_default, eic.render_status, eic.share_token,
       t.slug as template_slug, t.layout
from public.event_invitation_cards eic
join config.invitation_templates t on t.id = eic.template_id
where eic.event_id = '<new_event_id>'
order by eic.created_at;
```
Expected: 1 row, `is_default = true`, `render_status = 'draft'`, `share_token` is a 24-char hex string, `template_slug = 'eternal'`.

---

### Task 6: Middleware — add `/invite/[token]` to public paths (I9)

The guest share URL must be reachable without auth. Without this, unauthenticated guests hit the middleware auth redirect.

**Files:**
- Modify: `lib/supabase/middleware.ts`

- [ ] **Step 1 — add the public path**

In [lib/supabase/middleware.ts](lib/supabase/middleware.ts), find the `isPublicPath` block (around line 50):

```typescript
// Current:
const isPublicPath =
  pathname === '/' ||
  pathname === '/auth' ||
  pathname.startsWith('/auth/callback') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') ||
  isDevPlayground
```

Replace with:
```typescript
const isPublicPath =
  pathname === '/' ||
  pathname === '/auth' ||
  pathname.startsWith('/auth/callback') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/api') ||
  pathname.startsWith('/invite') ||   // guest invitation share URLs — no auth required
  isDevPlayground
```

- [ ] **Step 2 — verify no TypeScript errors**

```bash
npm run lint
```
Expected: no errors on `lib/supabase/middleware.ts`.

---

### Task 7: inv_06 — DATA-MODEL.md + ERD.md update (rule #8)

The rule: the database **and** DATA-MODEL.md **and** ERD.md change together in the same PR. This task updates both docs to reflect the new Invitations module.

**Files:**
- Modify: `docs/data-model/DATA-MODEL.md`
- Modify: `docs/data-model/ERD.md`

#### 7a — DATA-MODEL.md updates

- [ ] **Step 1 — bump version + scope**

Update the header table:
- `Version`: `2026-06-17.1`
- `Last updated`: `2026-06-17`
- `Scope covered so far`: append `+ **Invitations** (invitation card personalizer — card styles catalog, locked templates catalog, per-event invitation cards, hosted share URL)`
- `Live DB status`: append `✅ Invitations module applied 2026-06-17 (migrations inv_01–inv_06): 2 config catalogs + event_invitation_cards table + 2 views + create_event_with_details extended.`

- [ ] **Step 2 — add D38 decision log entry**

Append to the Decision Log table (after D37):

```markdown
| D38 | **Invitations card personalizer (`inv_01`–`inv_06`).** Two config catalogs (`config.invitation_card_styles` — 5 style filter chips; `config.invitation_templates` — 7 locked designs) + `public.event_invitation_cards` (per-event/sub-event, dual-mode: template_id OR card_upload_key, enforced by check constraint). Partial unique indexes for `is_default` per group (two needed — NULL ≠ NULL in B-tree). share_token generated by DEFINER trigger. Two views: `event_invitation_card_summary` (host, security_invoker) + `invitation_card_guest_view` (public share, service_role, private R2 keys absent, WHERE share_enabled filters revoked links). `create_event_with_details` extended: one main event card seeded (sub-event cards via UI CRUD — I5). `/invite/[token]` added to middleware public paths. | Invitation card personalizer scope: host picks locked template, personalizes text slots, gets hosted share URL + WhatsApp text+link. WhatsApp send + read tracking deferred to Guest Management (`event_guest_invites`). Render pipeline (Satori/Puppeteer → R2) is a future slice. `style_id uuid FK` (not style_slug) per I2. `WITH CHECK` on owner RLS per I3. `stamp_updated_by` (D37 shared) reused. |
```

- [ ] **Step 3 — add Invitations tables section**

In the **Tables** section (after the Media & Memories subsection), add:

```markdown
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

One row per invitation card. Dual-mode: template-based (template_id set, card_upload_key null) or uploaded (template_id null, card_upload_key set). Check constraint enforces exactly one mode.

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
| `created_by` / `updated_by` | uuid | FK → auth.users(id) SET NULL | server-stamped via DEFINER triggers |
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
**RLS:** owner-only `FOR ALL` using + with_check on `events.user_id = auth.uid()`.
```

- [ ] **Step 4 — add Invitations section to Views, Triggers, RLS, Build Order**

**Views section** — add after Media views:

```markdown
### Invitations views

| View | Type | Purpose |
|------|------|---------|
| `public.event_invitation_card_summary` | security_invoker | Host-facing: card list with sub-event label, template info, render status, share status. Joins `event_sub_events`, `config.event_sub_types`, `config.invitation_templates`. |
| `public.invitation_card_guest_view` | no RLS (service_role access only) | Guest share path. Projects guest-safe columns only — no private R2 keys. `WHERE share_enabled = true` provides natural 404. Public share route reads ONLY this view, never the base table. |
```

**Triggers section** — append rows to the trigger table:

```
| `trg_invitation_card_styles_updated` | `config.invitation_card_styles` | before update | stamps `updated_at` | [NOW] |
| `trg_invitation_templates_updated` | `config.invitation_templates` | before update | stamps `updated_at` | [NOW] |
| `trg_invitation_cards_updated` | `public.event_invitation_cards` | before update | stamps `updated_at` | [NOW] |
| `trg_invitation_cards_updated_by` | `public.event_invitation_cards` | before update | stamps `updated_by = auth.uid()` (reuses D37 shared `stamp_updated_by`) | [NOW] |
| `trg_invitation_cards_created_by` | `public.event_invitation_cards` | before insert | stamps `created_by = auth.uid()` (reuses `stamp_created_by` if generic, else `stamp_invitation_card_created_by`) | [NOW] |
| `generate_invitation_share_token` | `public.event_invitation_cards` | before insert | generates `share_token = encode(gen_random_bytes(12),'hex')` if blank. SECURITY DEFINER, pinned search_path. | [NOW] |
```

**RLS section** — add after Media RLS:

```markdown
### Invitations module RLS  `[NOW]`

RLS enabled in `inv_03`. `event_invitation_cards` gets one `FOR ALL` owner-only policy for `authenticated` with matching `USING` and `WITH CHECK` predicates (single-hop via `events.user_id`). Catalogs (`config.invitation_card_styles`, `config.invitation_templates`) follow the standard `config.*` pattern: `SELECT using(true)`, no write policy, `grant select` to `anon/authenticated`.

Public share URL `/invite/{share_token}`: the Next.js API route uses `service_role` client to query `invitation_card_guest_view` (not the base table) — bypasses RLS, projects guest-safe columns only, `WHERE share_enabled = true` handles revocation. `/invite/*` added to `lib/supabase/middleware.ts` public paths (I9).
```

**Build Order section** — append after Media module entry:

```
9. **Invitations module** (live, migrations `inv_01`–`inv_06`): `inv_01` `config.invitation_card_styles` + 5 seeds + RLS; `inv_02` `config.invitation_templates` + 7 seeds + RLS; `inv_03` `event_invitation_cards` + check constraint + 2 partial unique indexes + 4 triggers + owner RLS; `inv_04` `event_invitation_card_summary` + `invitation_card_guest_view`; `inv_05` extend `create_event_with_details` (main event card seed); `inv_06` DATA-MODEL.md + ERD.md doc update. Then `npx supabase gen types` → refresh `lib/supabase/database.types.ts`.
```

#### 7b — ERD.md updates

- [ ] **Step 5 — add INVITATIONS subgraph to Module Map (Section 1)**

In [docs/data-model/ERD.md](docs/data-model/ERD.md), find the `flowchart TB` module map. After the `MED` subgraph and before the `classDef` lines, add:

```
  subgraph INV["💌 Invitations  (public + config schemas)"]
    CIS[config_invitation_card_styles]
    CIT[config_invitation_templates]
    EIC[event_invitation_cards]
  end
```

Add the module arrows after the existing ones:
```
  CFG -. "seeds" .-> INV
  CORE -- "parent FK" --> INV
```

Add to the `classDef` block:
```
  classDef inv fill:#fff3e0,stroke:#e65100,color:#000;
  class CIS,CIT,EIC inv;
```

- [ ] **Step 6 — add 3 entities + relationships to Full ERD (Section 2)**

In the `erDiagram` block, add the three new entities and four relationships:

```
  CONFIG_INVITATION_CARD_STYLES {
    uuid id PK
    text slug UK
    text name
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }

  CONFIG_INVITATION_TEMPLATES {
    uuid id PK
    text slug UK
    text name
    uuid style_id FK
    text layout
    text preview_key
    text thumbnail_key
    text default_photo_key
    int display_order
    bool enabled
    timestamptz created_at
    timestamptz updated_at
  }

  EVENT_INVITATION_CARDS {
    uuid id PK
    uuid event_id FK
    uuid sub_event_id FK
    bool is_default
    uuid template_id FK
    bool is_custom
    text slot_eyebrow
    text slot_couple
    text slot_invite
    text slot_date
    text slot_time
    text slot_venue
    text slot_message
    text card_upload_key
    text photo_bg_key
    text share_token UK
    bool share_enabled
    text rendered_card_key
    text rendered_pdf_key
    text render_status
    uuid created_by FK
    uuid updated_by FK
    timestamptz created_at
    timestamptz updated_at
  }
```

Add to the relationships block:
```
  CONFIG_INVITATION_CARD_STYLES ||--o{ CONFIG_INVITATION_TEMPLATES : "style_id"
  CONFIG_INVITATION_TEMPLATES |o--o{ EVENT_INVITATION_CARDS : "template (set null)"
  EVENTS ||--o{ EVENT_INVITATION_CARDS : "has"
  EVENT_SUB_EVENTS |o--o{ EVENT_INVITATION_CARDS : "tagged (set null)"
```

---

### Task 8: Regenerate TypeScript types

Adds the new tables and views to `lib/supabase/database.types.ts`.

**Files:**
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1 — run type generation**

```bash
npx supabase gen types typescript \
  --project-id smjkbmkxweevqpvygabe \
  --schema public,config \
  > lib/supabase/database.types.ts
```

- [ ] **Step 2 — verify new types present**

```bash
grep -E "invitation_card_styles|invitation_templates|event_invitation_cards|invitation_card_guest_view|event_invitation_card_summary" lib/supabase/database.types.ts
```
Expected: lines for all 5 names in both the `public` and `config` schema sections.

- [ ] **Step 3 — verify TypeScript compiles**

```bash
npm run build 2>&1 | head -30
```
Expected: no TS errors relating to `database.types.ts`.

---

### Task 9: Commit

- [ ] **Step 1 — run lint + type check**

```bash
npm run lint && npm run build 2>&1 | grep -E "error|Error" | head -20
```
Expected: zero errors.

- [ ] **Step 2 — commit**

```bash
git add \
  lib/supabase/middleware.ts \
  lib/supabase/database.types.ts \
  docs/data-model/DATA-MODEL.md \
  docs/data-model/ERD.md

git commit -m "feat(db): invitations card data model (inv_01–inv_06)

- config.invitation_card_styles — 5 style filter chips (minimal/royal/floral/modern/photo)
- config.invitation_templates — 7 locked designs; style_id UUID FK (not slug)
- event_invitation_cards — dual-mode (template|upload), check constraint, 2 partial unique
  indexes, render_status incl 'failed', share_token trigger, share_enabled revocation
- Views: event_invitation_card_summary (host, security_invoker) + invitation_card_guest_view
  (public share, service_role, no private R2 keys)
- create_event_with_details extended: seeds main event card only (I5 decision)
- /invite/* added to middleware public paths (I9)
- DATA-MODEL.md + ERD.md synced (rule #8, D38)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review checklist

- [x] **Spec coverage:** inv_01 ✅, inv_02 ✅, inv_03 ✅ (table + check constraint + 2 partial indexes + 4 triggers + RLS with WITH CHECK), inv_04 ✅ (both views), inv_05 ✅ (main event card only, idempotency guard), inv_06 ✅ (DATA-MODEL.md + ERD.md), middleware I9 ✅
- [x] **No placeholders:** all SQL is complete and runnable
- [x] **I1–I5 resolved:** render_status includes 'failed'; style_id UUID FK; WITH CHECK on RLS; I4 documented inline; I5 decision recorded
- [x] **I6:** WHERE NOT EXISTS idempotency guard in inv_05 seed block
- [x] **I7:** event_sub_events confirmed Events Core in build order (step 6); FK is valid
- [x] **I8:** stamp_updated_by reused; stamp_created_by check step in Task 0; Path B fallback provided
- [x] **I9:** middleware.ts public path update in Task 6
- [x] **Type consistency:** `style_id` used in all places (not `style_slug`)
- [x] **Task 0 pre-flight:** validates live DB before any DDL — prevents silent mismatches
