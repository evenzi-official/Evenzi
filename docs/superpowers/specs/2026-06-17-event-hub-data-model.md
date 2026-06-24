# Design Spec — Event Hub: Our Journey + Dashboard Data Model
**Date:** 2026-06-17  
**Slice:** Event Management Hub — sub-event website toggle + icon catalog fix + hub summary view  
**Status:** Approved — ready for implementation plan

---

## Scope

The Event Management Hub consists of two prototype screens:
- `event-control.html` — dashboard aggregating existing feature stats (guests, tasks, budget) + journey timeline preview
- `our-journey.html` — sub-events CRUD (add/edit/remove wedding functions + "show on website" toggle)

The **dashboard** is pure aggregation of existing tables/views — zero new schema needed there. The **Our Journey** screen introduces one missing column. This spec also fixes a pre-existing icon name mismatch in `config.event_sub_types`.

**Explicitly excluded from this slice:**
- Sub-event auto-seeding at event creation (host adds manually via Our Journey — same I5 pattern as invitations; `create_event_with_details` already accepts `p_sub_events: Json` for wizard-driven creation)
- Co-planner messaging (the `qa-composer` in the prototype is a UI placeholder; `event_collaborators` already exists as the collaborator model)
- Digital Presence / Event Website (separate slice — `designs/pages/website/`)

**Prototype:** `designs/pages/event-control/` (`event-control.html`, `our-journey.html`) is the canonical build target.

---

## Dashboard data sources (all existing — no new schema)

| Dashboard stat | Source |
|---|---|
| Guest count | `event_guest_stats.total` |
| Task % | `event_task_progress.percent` |
| Budget used % | `event_budget_summary.spent / total_amount` |
| Sub-event count ("6 functions") | `COUNT(event_sub_events WHERE status != 'cancelled')` |
| Journey timeline dots | `event_sub_events` ordered by `display_order` |

---

## Changes

### Change 1 — `event_sub_events`: ADD COLUMN + indexes

**a) New column:**
```sql
ALTER TABLE event_sub_events
  ADD COLUMN show_on_website bool NOT NULL DEFAULT true;
```

Default `true`: new sub-events appear on the event website by default; host opts out explicitly. Consistent with prototype toggle defaulting on.

No new trigger — `set_updated_at` already fires on UPDATE. No new RLS — `event_sub_events` inherits owner-only policy via the existing `events` FK check.

**b) Indexes (add if absent):**
```sql
-- general FK index for joins and aggregations (covers hub_03 COUNT subquery)
CREATE INDEX IF NOT EXISTS idx_ese_event_id
  ON event_sub_events(event_id);

-- partial index for future website-visible sub-event queries
CREATE INDEX IF NOT EXISTS idx_ese_show_on_website
  ON event_sub_events(event_id)
  WHERE show_on_website = true;
```

---

### Change 2 — `config.event_sub_types` reconciliation (upsert, not migration)

> **Important (I2/I3):** This change is DML on config/catalog data. It belongs in a seed/upsert block — NOT a standalone numbered migration. Use `INSERT … ON CONFLICT (slug) DO UPDATE` so it is idempotent on any DB state (fresh branch, re-run, rollback). Wrap in a DO block with an existence ASSERT for `event_type_id`.

**Migration pattern:**
```sql
DO $$
DECLARE _wid uuid;
BEGIN
  SELECT id INTO _wid FROM config.event_types WHERE slug = 'wedding';
  ASSERT _wid IS NOT NULL, 'wedding event_type not found — seed config.event_types first';

  INSERT INTO config.event_sub_types
    (slug, name, icon_name, display_order, is_default, enabled, event_type_id)
  VALUES
    -- existing rows: upsert to fix icon_name (Lucide → Material Symbols)
    ('haldi',               'Haldi',               'spa',           1, false, true, _wid),
    ('mehendi',             'Mehendi',             'back_hand',     2, false, true, _wid),
    ('sangeet',             'Sangeet',             'music_note',    3, false, true, _wid),
    ('wedding-ceremony',    'Wedding Ceremony',    'favorite',      4, true,  true, _wid),
    ('reception',           'Reception',           'celebration',   5, true,  true, _wid),
    ('cocktail-party',      'Cocktail Party',      'local_bar',     6, false, true, _wid),
    ('post-wedding-brunch', 'Post-Wedding Brunch', 'brunch_dining', 7, false, true, _wid),
    -- new rows
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

`enabled = true` for all rows. The existing `public read` RLS on `config.event_sub_types` already covers all rows — no new policy needed.

**Icon mapping (old → new):**

| slug | old icon_name (Lucide) | new icon_name (Material Symbols) |
|------|----------------------|----------------------------------|
| haldi | sparkles | spa |
| mehendi | palette | back_hand |
| sangeet | music | music_note |
| wedding-ceremony | heart | favorite |
| reception | utensils | celebration |
| cocktail-party | wine | local_bar |
| post-wedding-brunch | coffee | brunch_dining |
| engagement | (new) | diamond |
| pre-wedding-shoot | (new) | photo_camera |

---

### Change 3 — `event_hub_summary` view

> **Important (I4):** `event_hub_summary` uses `security_invoker = on`. It joins `event_guest_stats`, `event_task_progress`, and `event_budget_summary`. Before applying hub_03, verify these views are SECURITY INVOKER (Postgres 15 default) — add `WITH (security_invoker = on)` to those view definitions if not already present. If any is SECURITY DEFINER, the cross-tenant RLS isolation breaks.

```sql
-- hub_03 pre-flight: assert dependent views are SECURITY INVOKER
-- (Postgres 15+ creates views as SECURITY INVOKER by default; verify:)
-- SELECT viewname, security_type FROM information_schema.views
--   WHERE table_name IN ('event_guest_stats','event_task_progress','event_budget_summary');

-- TODO: if p95 query time > 200ms at 1k events, consider materializing this view.
-- Depends on: inv_01-inv_06 (event_invitation_cards), planning_01-07 (event_tasks),
--   guests_01-05 (event_guests), Events Core (events, event_sub_events, event_budgets).
CREATE VIEW public.event_hub_summary
WITH (security_invoker = on) AS
SELECT
  e.id                                                      AS event_id,
  e.name                                                    AS event_name,
  e.primary_date,
  e.primary_venue,
  COALESCE(gs.total,   0)                                   AS guest_total,
  COALESCE(tp.percent, 0)                                   AS task_percent,
  COALESCE(tp.done,    0)                                   AS task_done,
  COALESCE(tp.total,   0)                                   AS task_total,
  COALESCE(bs.total_amount, 0)                              AS budget_total,
  COALESCE(bs.spent, 0)                                     AS budget_spent,
  -- NULL-safe: returns NULL (not 0) when total_amount is NULL/0/negative
  ROUND(
    (COALESCE(bs.spent, 0) / NULLIF(COALESCE(bs.total_amount, 0), 0) * 100)::numeric,
    1
  )                                                         AS budget_percent,
  COALESCE(se.sub_event_count, 0)                           AS sub_event_count,
  ic.share_token                                            AS default_card_share_token
FROM events e
LEFT JOIN event_guest_stats      gs ON gs.event_id = e.id
LEFT JOIN event_task_progress    tp ON tp.event_id = e.id
LEFT JOIN event_budget_summary   bs ON bs.event_id = e.id
LEFT JOIN (
  SELECT event_id, COUNT(*) AS sub_event_count
  FROM event_sub_events
  WHERE status != 'cancelled'          -- active functions only
  GROUP BY event_id
) se ON se.event_id = e.id
LEFT JOIN event_invitation_cards ic
  ON ic.event_id = e.id
  AND ic.is_default = true
  AND ic.sub_event_id IS NULL;
```

**Notes:**
- `budget_percent` uses `NULLIF(COALESCE(bs.total_amount,0),0)` — returns NULL when no budget set (not 0, which would be misleading). FE should handle NULL as "no budget set".
- `sub_event_count` filters `status != 'cancelled'` — reflects active functions only.
- `default_card_share_token` — convenience for the hub's "Share" quick-action; NULL if no invitation card yet.
- No `updated_at` signal: this is a live view. FE should use SWR/re-fetch on user action; cache-bust on event update timestamp from the separate `events` table query.

---

## Migration Plan

| Migration | Objects | Notes |
|-----------|---------|-------|
| `hub_01` | ADD COLUMN `show_on_website` + 2 indexes on `event_sub_events` | No RLS change |
| `hub_02` | Upsert `config.event_sub_types` (DO block with ASSERT) | DML/seed — idempotent |
| `hub_03` | `CREATE VIEW public.event_hub_summary` | Depends on inv_01–inv_06 being live |
| `hub_04` | DATA-MODEL.md + ERD.md update (rule #8) | — |

RLS note: no new RLS in any migration. Existing policies cover all changes.

---

## ERD Additions (for ERD.md sync)

**Full ERD:** `EVENT_SUB_EVENTS` entity gains `show_on_website bool` column.  
**New view entity:** `EVENT_HUB_SUMMARY` (aggregates events + guest_stats + task_progress + budget_summary + sub_event_count + invitation_cards).  
**No new relationships** — all joins in `event_hub_summary` are to existing entities.

---

## Council Findings Checklist

Applied in spec (address before implementation):
- ✅ I1 — budget_percent: NULLIF/COALESCE pattern (not CASE)
- ✅ I2 — hub_02: upsert not numbered migration
- ✅ I3 — hub_02: DO block with ASSERT for event_type_id
- ✅ I4 — hub_03: SECURITY INVOKER dependency documented, pre-flight check noted
- ✅ I5 — indexes: idx_ese_event_id + idx_ese_show_on_website in hub_01
- ✅ Arbiter DM-6 — sub_event_count filters WHERE status != 'cancelled'
- ✅ TL-1 — public. prefix on CREATE VIEW

Non-blocking (track for implementation):
- Verify `event_invitation_cards(event_id)` index exists from inv_03
- FE: use `.maybeSingle()` not `.single()` on hub summary query
- Regenerate TypeScript types after hub_01 lands

---

**Council reviewed:** 2026-06-17 by tech_lead · data_modeller · backend_engineer. Verdict: 🟡 ADDRESS-THEN-PROCEED — 5 importants fixed in spec; 3 non-blocking tracked above.
