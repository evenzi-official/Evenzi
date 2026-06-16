# Design Spec — Invitations: Card Personalizer Data Model
**Date:** 2026-06-16  
**Slice:** Invitation card designer + personalizer (DB + RLS + views + seeding only)  
**Status:** Approved — ready for implementation plan

---

## Scope

Model the invitation **card personalizer** only. The host picks a locked template (or uploads their own card), personalizes it (inline text + optional photo), and gets a hosted card URL + WhatsApp share text.

**Explicitly excluded from this slice:**
- WhatsApp send log (`event_guest_invites` — future Guest Management subtask)
- Delivery / read tracking
- Render pipeline (Satori/Puppeteer → R2) — schema-planned here, built in a separate slice
- PDF render — schema-planned here (`rendered_pdf_key`), built post-v1

**Prototype:** `designs/pages/invitations/` (`_spec.md`, `_page.md`, `invitations.js`) is the canonical build target. This data model backs that prototype.

---

## Tables

### `config.invitation_card_styles` (catalog, admin-seeded, public-read)

Drives the gallery filter chips: All · Minimal · Royal · Floral · Modern · Photo.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `slug` | text | UK NOT NULL | minimal, royal, floral, modern, photo |
| `name` | text | NOT NULL | display label in filter pill |
| `display_order` | int | NOT NULL DEFAULT 0 | |
| `enabled` | bool | NOT NULL DEFAULT true | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Seed rows (5):**

| slug | name | display_order |
|------|------|---------------|
| minimal | Minimal | 1 |
| royal | Royal | 2 |
| floral | Floral | 3 |
| modern | Modern | 4 |
| photo | Photo | 5 |

---

### `config.invitation_templates` (catalog, admin-seeded, public-read)

One row per locked design. The host cannot edit these; they pick one as a base.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `slug` | text | UK NOT NULL | eternal, saffron, eucalyptus, noir, rosewater, bloom, moments |
| `name` | text | NOT NULL | display name in picker |
| `style_slug` | text | NOT NULL FK → config.invitation_card_styles(slug) RESTRICT | drives gallery filter |
| `layout` | text | NOT NULL CHECK (layout IN ('classic','photo')) | classic = text-only · photo = has background photo slot |
| `preview_key` | text | | R2 public key — full A5 card preview shown in picker |
| `thumbnail_key` | text | | R2 public key — smaller thumbnail for tile grid |
| `default_photo_key` | text | | R2 public key — default BG photo for photo-layout templates; NULL for classic |
| `display_order` | int | NOT NULL DEFAULT 0 | |
| `enabled` | bool | NOT NULL DEFAULT true | |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Seed rows (7):**

| slug | name | style_slug | layout | default_photo_key |
|------|------|-----------|--------|-------------------|
| eternal | Eternal | minimal | classic | NULL |
| saffron | Saffron | royal | classic | NULL |
| eucalyptus | Eucalyptus | floral | classic | NULL |
| noir | Noir | modern | classic | NULL |
| rosewater | Rosewater | floral | classic | NULL |
| bloom | Bloom | photo | photo | (set when R2 assets uploaded) |
| moments | Moments | photo | photo | (set when R2 assets uploaded) |

---

### `public.event_invitation_cards`

One row per invitation card. A card is either template-based (host picks a template and edits text slots) or uploaded (host uploads their own complete card image — no text editing).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK DEFAULT gen_random_uuid() | |
| `event_id` | uuid | NOT NULL FK → events(id) ON DELETE CASCADE | |
| `sub_event_id` | uuid | FK → event_sub_events(id) ON DELETE SET NULL | NULL = main event card |
| `is_default` | bool | NOT NULL DEFAULT false | one default per (event, sub-event) group — see indexes below |
| `template_id` | uuid | FK → config.invitation_templates(id) ON DELETE RESTRICT | NULL = uploaded card (card_upload_key must then be set) |
| `is_custom` | bool | NOT NULL DEFAULT false | flipped to true on any host edit after seeding |
| `slot_eyebrow` | text | | e.g. "Join us for the wedding of" |
| `slot_couple` | text | | couple names |
| `slot_invite` | text | | invitation line |
| `slot_date` | text | | pre-filled from event/sub-event; host can override |
| `slot_time` | text | | pre-filled from sub-event start_time; NULL for main event card |
| `slot_venue` | text | | pre-filled from event/sub-event venue |
| `slot_message` | text | | closing message |
| `card_upload_key` | text | | R2 private key — host's full card image (upload mode only; NULL in template mode) |
| `photo_bg_key` | text | | R2 private key — host-uploaded background photo (photo-layout templates only; NULL otherwise) |
| `share_token` | text | UK NOT NULL | server-generated on INSERT via trigger: encode(gen_random_bytes(12),'hex') |
| `share_enabled` | bool | NOT NULL DEFAULT true | host can disable the public link without deleting the card; public endpoint returns 404 when false |
| `rendered_card_key` | text | | R2 public key — server-rendered card PNG (set by render pipeline) |
| `rendered_pdf_key` | text | | R2 private key — server-rendered PDF (schema-planned; render built post-v1) |
| `render_status` | text | NOT NULL DEFAULT 'draft' CHECK (render_status IN ('draft','rendering','ready')) | |
| `created_by` | uuid | FK → auth.users(id) ON DELETE SET NULL | server-stamped, never client-trusted |
| `updated_by` | uuid | FK → auth.users(id) ON DELETE SET NULL | server-stamped on update |
| `created_at` | timestamptz | NOT NULL DEFAULT now() | |
| `updated_at` | timestamptz | NOT NULL DEFAULT now() | |

**Check constraint — exactly one of template or upload:**
```sql
CONSTRAINT invitation_card_mode_check CHECK (
  (template_id IS NOT NULL AND card_upload_key IS NULL)
  OR
  (template_id IS NULL AND card_upload_key IS NOT NULL)
)
```

**Partial unique indexes — one default per group (two needed because NULL ≠ NULL in B-tree):**
```sql
-- sub-event cards
CREATE UNIQUE INDEX invitation_cards_default_sub_event_idx
  ON event_invitation_cards (event_id, sub_event_id)
  WHERE is_default = true AND sub_event_id IS NOT NULL;

-- main event card
CREATE UNIQUE INDEX invitation_cards_default_main_event_idx
  ON event_invitation_cards (event_id)
  WHERE is_default = true AND sub_event_id IS NULL;
```

---

## Triggers & Functions

| Object | Kind | Security | Purpose |
|--------|------|----------|---------|
| `set_updated_at` | trigger (existing) | — | stamp updated_at on every UPDATE |
| `stamp_invitation_card_updated_by` | BEFORE UPDATE trigger fn | DEFINER | server-stamp updated_by; never trust client |
| `stamp_invitation_card_created_by` | BEFORE INSERT trigger fn | DEFINER | server-stamp created_by; never trust client |
| `generate_invitation_share_token` | BEFORE INSERT trigger fn | DEFINER | set share_token = encode(gen_random_bytes(12),'hex') if null |

---

## Seeding (inside `create_event_with_details`)

Auto-seed invitation cards when an event is created. This is its own block — **not** a catalog-copy pattern, so D36's `_seed_event_catalog()` helper does not apply here. The invitation seed:

1. Picks the default template: `SELECT id FROM config.invitation_templates WHERE slug = 'eternal'` (stable slug reference, not positional, so admin reordering cannot break it)
2. INSERTs one main event card: `sub_event_id = NULL`, `is_default = true`, `slot_date = events.primary_date`, `slot_venue = events.primary_venue`, share_token generated by trigger
3. For each sub-event passed in `p_sub_events`: INSERTs one card per sub-event — `sub_event_id = new sub-event id`, `is_default = true`, `slot_date = ese.event_date`, `slot_time = ese.start_time`, `slot_venue = ese.venue`

All seeded cards start with `is_custom = false`, `render_status = 'draft'`.

---

## RLS

**Owner-only (consistent with all event-child tables):**

```sql
ALTER TABLE event_invitation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner CRUD"
  ON event_invitation_cards
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_invitation_cards.event_id
      AND events.user_id = auth.uid()
    )
  );
```

**Public share URL** (`/invite/{share_token}`): the hosted card page reads the card via a Next.js API route using `service_role` client (bypasses RLS), querying **`invitation_card_guest_view`** (not the base table). Returns 404 when `share_enabled = false` or the token is not found. Private R2 keys (`card_upload_key`, `photo_bg_key`, `rendered_pdf_key`) are never exposed — they are absent from the guest view.

**Token revocation:** the host can set `share_enabled = false` to disable a link instantly without deleting the card. Token rotation (generate a new `share_token` + flip `share_enabled = true`) is a future UI feature; the column and RPC hook are schema-planned here.

**Route exclusion:** `/invite/[token]` must be added to the public-paths list in `middleware.ts` (CLAUDE.md shows middleware protects all non-`/api/*`, non-`/auth/*` paths by default — unauthenticated guests will be 401-redirected without this).

**Catalog tables:**
```sql
CREATE POLICY "public read"
  ON config.invitation_card_styles FOR SELECT USING (true);

CREATE POLICY "public read"
  ON config.invitation_templates FOR SELECT USING (true);
```

---

## Views

### `event_invitation_card_summary` (host-facing, security_invoker)

```sql
CREATE VIEW event_invitation_card_summary
WITH (security_invoker = on) AS
SELECT
  c.id,
  c.event_id,
  c.sub_event_id,
  COALESCE(ese.custom_name, cest.name, 'Main Event') AS sub_event_label,
  t.name                              AS template_name,
  t.style_slug                        AS template_style,
  t.layout                            AS template_layout,
  c.is_default,
  c.is_custom,
  c.render_status,
  c.share_token,
  c.share_enabled,
  (c.card_upload_key IS NOT NULL)     AS is_uploaded_card,
  c.created_at,
  c.updated_at
FROM event_invitation_cards c
LEFT JOIN event_sub_events ese ON ese.id = c.sub_event_id
LEFT JOIN config.event_sub_types cest ON cest.id = ese.event_sub_type_id
LEFT JOIN config.invitation_templates t ON t.id = c.template_id;
```

### `invitation_card_guest_view` (public share path — service_role queries this, never the base table)

Projects only guest-safe columns. Private R2 keys, audit fields, and internal metadata are absent. The public share route (`/invite/{share_token}`) and the render pipeline both read from this view.

```sql
CREATE VIEW invitation_card_guest_view AS
SELECT
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
  t.name    AS template_name,
  t.style_slug,
  t.layout,
  t.default_photo_key
FROM event_invitation_cards c
LEFT JOIN config.invitation_templates t ON t.id = c.template_id
WHERE c.share_enabled = true;
```

The `WHERE share_enabled = true` clause in this view means a 404 is the natural outcome when the host has disabled the link — the row simply isn't visible through this view.

---

## Share Story

**WhatsApp (in-scope):** text + link only — `wa.me` is text-only, never image attach.
- Link: `https://evenzi.app/invite/{share_token}`
- Caption composed from slot data in the app (not stored on card)

**PDF download (schema-planned, render post-v1):**
- `GET /invite/{share_token}/pdf` → streams `rendered_pdf_key` from R2 private bucket
- `rendered_pdf_key` column exists now; render pipeline built in a future slice

**Render pipeline (separate slice, not in this PR):**
- `POST /api/events/{id}/invitations/{cardId}/render`
- Satori/Puppeteer reads card data + template → PNG + optional PDF → uploads to R2
- Updates `rendered_card_key`, `rendered_pdf_key`, `render_status = 'ready'`

---

## Guest Page Lookup

When the Guest Management page needs to attach an invitation to a send action:

```sql
-- default card for a sub-event
SELECT * FROM event_invitation_cards
WHERE event_id = $event_id
  AND sub_event_id = $sub_event_id
  AND is_default = true;

-- default main event card
SELECT * FROM event_invitation_cards
WHERE event_id = $event_id
  AND sub_event_id IS NULL
  AND is_default = true;
```

The future `event_guest_invites` send-log (Guest Management) will store `guest_id + card_id` — the `sub_event_id` comes along for free via the card row.

---

## Migration Plan

| Migration | Tables / Objects |
|-----------|-----------------|
| `inv_01` | `config.invitation_card_styles` + 5 seed rows + public-read RLS inline |
| `inv_02` | `config.invitation_templates` + 7 seed rows + public-read RLS inline (preview/thumbnail/photo keys set when R2 assets are uploaded) |
| `inv_03` | `event_invitation_cards` — table + check constraint + 2 partial unique indexes + 3 triggers + owner-only RLS inline |
| `inv_04` | `event_invitation_card_summary` + `invitation_card_guest_view` |
| `inv_05` | Extend `create_event_with_details` — add invitation card seed block (with ON CONFLICT / WHERE NOT EXISTS idempotency guard) |
| `inv_06` | DATA-MODEL.md doc update (tables, views, triggers, decision log entry — rule #8) |

**Note:** RLS is inlined in each creating migration (inv_01, inv_02, inv_03) per project convention (guests, media module precedent). There is no separate RLS migration.

## Council Findings Checklist (address during migrations)

Critical fixes applied to this spec:
- ✅ C1 — `invitation_card_guest_view` created; public share route reads only this view
- ✅ C2 — `share_enabled bool` added; revocation documented; route exclusion noted

Important items for migration authors to address (not spec-level gaps, implementation-level):
- I1 — Add `'failed'` to `render_status` CHECK in `inv_03`
- I2 — Use `style_id uuid FK → config.invitation_card_styles(id)` not `style_slug` FK
- I3 — Add `WITH CHECK` clause to owner CRUD RLS policy in `inv_03`
- I4 — Document `auth.uid()` threading in DEFINER context in `inv_03` trigger bodies (follow D37 pattern)
- I5 — Seed only main event card in v1 (defer sub-event seeding), OR define UI multi-card path — **decision needed from Abhijith before inv_05**
- I6 — Add idempotency guard (`ON CONFLICT DO NOTHING` or `WHERE NOT EXISTS`) in `inv_05` invitation seed block
- I7 — Confirm `event_sub_events` is Events Core (not separate module) in DATA-MODEL.md before `inv_06` lands
- I8 — Check D37 shared stamp functions exist before creating new per-table DEFINER functions in `inv_03`; reuse if available
- I9 — Add `/invite/[token]` to public paths in `middleware.ts` (already flagged in spec above)

---

## ERD Additions (for ERD.md sync)

**Module Map (Section 1):** add new `INVITATIONS` subgraph:
- `config_invitation_card_styles`
- `config_invitation_templates`
- `event_invitation_cards`

Config seeds Invitations (dashed arrow). Invitations has parent FK to Events Core (solid arrow).

**Full ERD (Section 2):** add 3 entities + relationships:
- `CONFIG_INVITATION_CARD_STYLES ||--o{ CONFIG_INVITATION_TEMPLATES : "style_slug"`
- `CONFIG_INVITATION_TEMPLATES |o--o{ EVENT_INVITATION_CARDS : "seeds (set null)"`
- `EVENTS ||--o{ EVENT_INVITATION_CARDS : "has"`
- `EVENT_SUB_EVENTS |o--o{ EVENT_INVITATION_CARDS : "tagged (set null)"`

---

**Council reviewed:** 2026-06-16 by data_modeller · backend_engineer · security_expert · product_manager · tech_lead. Verdict: 🟡 ADDRESS-THEN-PROCEED — 2 criticals fixed in spec (share_enabled + invitation_card_guest_view); 10 importants moved to migration checklist.
