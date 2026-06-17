# Event Hub Data Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply hub_01–hub_04 migrations to dev Supabase, update docs, regenerate TypeScript types, and commit.

**Architecture:** 4-migration slice. No new tables or RLS. Hub_01 adds a column + 2 indexes to `event_sub_events`. Hub_02 upserts `config.event_sub_types` icon names and adds 2 new types. Hub_03 creates the `event_hub_summary` aggregation view. Hub_04 updates DATA-MODEL.md + ERD.md (rule #8).

**Tech Stack:** Supabase MCP (`mcp__2b7b199a...__apply_migration`, `execute_sql`), git, DATA-MODEL.md, ERD.md

**Spec:** `docs/superpowers/specs/2026-06-17-event-hub-data-model.md`

---

### Task 0: Pre-flight checks

**Files:** none (read-only DB checks)

- [ ] **Step 1: Verify event_invitation_cards(event_id) index exists**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'event_invitation_cards'
  AND indexdef ILIKE '%event_id%';
```
Expected: at least one index on event_id. If missing, create it in this task before hub_03.

- [ ] **Step 2: Verify dependent views are SECURITY INVOKER**

```sql
SELECT table_name, is_insertable_into,
       pg_get_viewdef(table_name::text, true) AS def
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('event_guest_stats','event_task_progress','event_budget_summary');
```
Then check:
```sql
SELECT c.relname, c.relkind,
       CASE WHEN c.relkind = 'v' THEN 'view' END,
       pg_get_viewdef(c.oid, true)
FROM pg_class c
WHERE c.relname IN ('event_guest_stats','event_task_progress','event_budget_summary');
```
Check `security_barrier` and whether `WITH (security_invoker = on)` is present. Postgres 15 defaults to INVOKER, but confirm.

- [ ] **Step 3: Check current event_sub_events indexes**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'event_sub_events'
ORDER BY indexname;
```
Note whether `idx_ese_event_id` already exists (FK indexes are often auto-created).

- [ ] **Step 4: Confirm event_sub_events.status values in use**

```sql
SELECT DISTINCT status FROM event_sub_events LIMIT 20;
```
Confirm 'cancelled' is the right token to exclude (or adjust hub_03 filter accordingly).

---

### Task 1: hub_01 — ADD COLUMN show_on_website + indexes

**Files:** Supabase migration (applied via MCP)

- [ ] **Step 1: Apply hub_01 via Supabase MCP**

Migration name: `hub_01_show_on_website`

```sql
-- hub_01: Add show_on_website to event_sub_events + indexes

ALTER TABLE event_sub_events
  ADD COLUMN show_on_website bool NOT NULL DEFAULT true;

-- FK/join index (covers hub_03 COUNT subquery)
CREATE INDEX IF NOT EXISTS idx_ese_event_id
  ON event_sub_events(event_id);

-- Partial index for website-visible sub-event queries
CREATE INDEX IF NOT EXISTS idx_ese_show_on_website
  ON event_sub_events(event_id)
  WHERE show_on_website = true;
```

- [ ] **Step 2: Smoke test**

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'event_sub_events'
  AND column_name = 'show_on_website';
```
Expected: `bool`, DEFAULT `true`, NOT NULL.

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'event_sub_events'
  AND indexname IN ('idx_ese_event_id','idx_ese_show_on_website');
```
Expected: both rows returned.

- [ ] **Step 3: Commit** (no files changed — migration applied to DB only; note in session log)

---

### Task 2: hub_02 — Upsert config.event_sub_types

**Files:** Supabase migration (applied via MCP)

- [ ] **Step 1: Apply hub_02 via Supabase MCP**

Migration name: `hub_02_event_sub_types_upsert`

```sql
-- hub_02: Reconcile config.event_sub_types — icon names (Lucide → Material Symbols)
--         + add Engagement and Pre-Wedding Shoot types
-- Uses upsert (idempotent) with DO block ASSERT for event_type_id safety.

DO $$
DECLARE _wid uuid;
BEGIN
  SELECT id INTO _wid FROM config.event_types WHERE slug = 'wedding';
  ASSERT _wid IS NOT NULL, 'wedding event_type not found — seed config.event_types first';

  INSERT INTO config.event_sub_types
    (slug, name, icon_name, display_order, is_default, enabled, event_type_id)
  VALUES
    ('haldi',               'Haldi',               'spa',           1, false, true, _wid),
    ('mehendi',             'Mehendi',             'back_hand',     2, false, true, _wid),
    ('sangeet',             'Sangeet',             'music_note',    3, false, true, _wid),
    ('wedding-ceremony',    'Wedding Ceremony',    'favorite',      4, true,  true, _wid),
    ('reception',           'Reception',           'celebration',   5, true,  true, _wid),
    ('cocktail-party',      'Cocktail Party',      'local_bar',     6, false, true, _wid),
    ('post-wedding-brunch', 'Post-Wedding Brunch', 'brunch_dining', 7, false, true, _wid),
    ('engagement',          'Engagement',          'diamond',       0, false, true, _wid),
    ('pre-wedding-shoot',   'Pre-Wedding Shoot',   'photo_camera',  8, false, true, _wid)
  ON CONFLICT (slug) DO UPDATE SET
    icon_name     = EXCLUDED.icon_name,
    display_order = EXCLUDED.display_order,
    is_default    = EXCLUDED.is_default,
    enabled       = EXCLUDED.enabled,
    updated_at    = now();
END $$;
```

- [ ] **Step 2: Smoke test**

```sql
SELECT slug, name, icon_name, display_order, is_default
FROM config.event_sub_types
ORDER BY display_order;
```
Expected: 9 rows. `wedding-ceremony` has `icon_name = 'favorite'`. `engagement` and `pre-wedding-shoot` both present with correct Material Symbol names.

---

### Task 3: hub_03 — event_hub_summary view

**Files:** Supabase migration (applied via MCP)

- [ ] **Step 1: Run pre-flight security_invoker check (from Task 0 findings)**

If any of `event_guest_stats`, `event_task_progress`, `event_budget_summary` lack `security_invoker`, recreate them with `WITH (security_invoker = on)` before proceeding. (If Postgres 15 default applies, they are already INVOKER — just confirm.)

- [ ] **Step 2: Apply hub_03 via Supabase MCP**

Migration name: `hub_03_event_hub_summary_view`

```sql
-- hub_03: event_hub_summary view
-- Aggregates dashboard stats for the Event Control hub page.
-- Depends on: inv_01-inv_06 (event_invitation_cards), events core, guests/planning/media modules.
-- TODO: materialize if p95 query time > 200ms at 1k events.
CREATE VIEW public.event_hub_summary
WITH (security_invoker = on) AS
SELECT
  e.id                                                           AS event_id,
  e.name                                                         AS event_name,
  e.primary_date,
  e.primary_venue,
  COALESCE(gs.total,   0)                                        AS guest_total,
  COALESCE(tp.percent, 0)                                        AS task_percent,
  COALESCE(tp.done,    0)                                        AS task_done,
  COALESCE(tp.total,   0)                                        AS task_total,
  COALESCE(bs.total_amount, 0)                                   AS budget_total,
  COALESCE(bs.spent, 0)                                          AS budget_spent,
  ROUND(
    (COALESCE(bs.spent, 0) / NULLIF(COALESCE(bs.total_amount, 0), 0) * 100)::numeric,
    1
  )                                                              AS budget_percent,
  COALESCE(se.sub_event_count, 0)                                AS sub_event_count,
  ic.share_token                                                 AS default_card_share_token
FROM events e
LEFT JOIN event_guest_stats      gs ON gs.event_id = e.id
LEFT JOIN event_task_progress    tp ON tp.event_id = e.id
LEFT JOIN event_budget_summary   bs ON bs.event_id = e.id
LEFT JOIN (
  SELECT event_id, COUNT(*) AS sub_event_count
  FROM event_sub_events
  WHERE status != 'cancelled'
  GROUP BY event_id
) se ON se.event_id = e.id
LEFT JOIN event_invitation_cards ic
  ON ic.event_id = e.id
  AND ic.is_default = true
  AND ic.sub_event_id IS NULL;
```

- [ ] **Step 3: Smoke test**

```sql
SELECT viewname, definition
FROM pg_views
WHERE schemaname = 'public' AND viewname = 'event_hub_summary';
```
Expected: view exists.

```sql
-- Test with a real event_id if available, or just confirm the view is queryable
SELECT * FROM event_hub_summary LIMIT 1;
```
Expected: no error. Columns: event_id, event_name, primary_date, primary_venue, guest_total, task_percent, task_done, task_total, budget_total, budget_spent, budget_percent, sub_event_count, default_card_share_token.

---

### Task 4: hub_04 — DATA-MODEL.md + ERD.md update (rule #8)

**Files:**
- Modify: `docs/data-model/DATA-MODEL.md`
- Modify: `docs/data-model/ERD.md`

- [ ] **Step 1: Update DATA-MODEL.md**

Bump version header to `2026-06-17.2` (or next increment if already bumped today).

Update scope line to include Event Hub module.

Add D39 decision log entry:
```
**D39 (2026-06-17):** `event_sub_events.show_on_website` — host controls per-function visibility on event website. Default true (opt-out model). `config.event_sub_types` icon_names updated to Material Symbols; 2 new types added (engagement, pre-wedding-shoot). `event_hub_summary` aggregation view provides single-query dashboard stats for the Event Control hub page.
```

Add to Event Hub section (create if it doesn't exist; place after Invitations, before a "Planned" section):
```
## Event Management Hub

Aggregates existing feature data for the Event Control dashboard. No new tables.

### event_sub_events (modified)
Added `show_on_website bool NOT NULL DEFAULT true` — controls whether a sub-event appears on the host's public event website. Indexed: `idx_ese_event_id` (event_id), `idx_ese_show_on_website` (event_id WHERE show_on_website = true).

### config.event_sub_types (modified)
icon_name column updated to Material Symbols names (was Lucide). Two new types added: engagement (diamond), pre-wedding-shoot (photo_camera). Total: 9 types.

### Views

#### event_hub_summary (security_invoker)
Single-query aggregate for the Event Control dashboard. Columns: event_id, event_name, primary_date, primary_venue, guest_total, task_percent, task_done, task_total, budget_total, budget_spent, budget_percent (NULLIF-safe), sub_event_count (active only, status != 'cancelled'), default_card_share_token.
```

Update build order — add step: Event Hub (hub_01–hub_03) after step 9 (Invitations).

- [ ] **Step 2: Update ERD.md**

**Module Map:** Add `HUB` node to the existing flowchart with `event_hub_summary` view, connected to CORE, GUESTS, PLANNING, MEDIA, INV subgraphs with aggregation arrows (dashed). No new entities — just the view.

**Full ERD:** Add `show_on_website bool` to the `EVENT_SUB_EVENTS` entity block.

Add `EVENT_HUB_SUMMARY` view entity (read-only, aggregation):
```
EVENT_HUB_SUMMARY {
  uuid event_id PK
  text event_name
  date primary_date
  text primary_venue
  int guest_total
  numeric task_percent
  int task_done
  int task_total
  numeric budget_total
  numeric budget_spent
  numeric budget_percent
  int sub_event_count
  text default_card_share_token
}
```

Add relationships:
```
EVENTS ||--|| EVENT_HUB_SUMMARY : "aggregated by"
```
(Note: view also aggregates from event_guest_stats, event_task_progress, event_budget_summary, event_sub_events, event_invitation_cards — document as a comment rather than drawing all arrows to keep ERD readable.)

- [ ] **Step 3: Commit all changes**

```bash
git add docs/data-model/DATA-MODEL.md docs/data-model/ERD.md
git commit -m "feat(db): event hub data model (hub_01–hub_03)

Migrations applied to dev Supabase (smjkbmkxweevqpvygabe):
- hub_01: event_sub_events.show_on_website bool NOT NULL DEFAULT true
  + idx_ese_event_id + idx_ese_show_on_website partial index
- hub_02: config.event_sub_types upsert — 7 icon names updated to Material
  Symbols, 2 new types added (engagement, pre-wedding-shoot)
- hub_03: event_hub_summary view (security_invoker) — aggregates guests,
  tasks, budget, sub-event count, default invitation share token

DATA-MODEL.md + ERD.md updated (rule #8 — DB + doc change together).
TypeScript types to be regenerated separately after migration lands.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Regenerate TypeScript types

**Files:**
- Modify: `lib/supabase/database.types.ts`

- [ ] **Step 1: Generate types via Supabase MCP**

Use `mcp__2b7b199a...__generate_typescript_types` with project_id `smjkbmkxweevqpvygabe`.

- [ ] **Step 2: Write output to database.types.ts**

Overwrite `lib/supabase/database.types.ts` with the generated content.

- [ ] **Step 3: Verify new types present**

Check that `event_hub_summary` appears in the Views section with all expected columns (event_id, event_name, guest_total, task_percent, budget_percent, sub_event_count, default_card_share_token).

Check that `event_sub_events` Row includes `show_on_website: boolean`.

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/database.types.ts
git commit -m "chore(types): regenerate after hub_01-03 migrations

Adds event_hub_summary view type + show_on_website column on
event_sub_events.

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```
