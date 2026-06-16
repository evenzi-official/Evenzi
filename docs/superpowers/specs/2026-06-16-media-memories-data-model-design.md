# Evenzi — Media & Memories Data Model (Design Spec)

> Design spec for the **Media & Memories** module's database layer (host-side photo/video gallery + albums). Companion to [`docs/data-model/DATA-MODEL.md`](../../data-model/DATA-MODEL.md). Agreed design; runnable migrations + the doc update land in the build PR.

| | |
|---|---|
| **Date** | 2026-06-16 |
| **Author** | Abhijith (+ Claude) |
| **Module** | Media & Memories (host-side gallery) |
| **Status** | Design approved — pending council → spec review → plan → build |
| **Builds on** | CORE + Planning + Guests; references `public.events`, `public.event_sub_events`, `auth.users`; extends `create_event_with_details`; R2 storage (`docs/R2-STORAGE-GUIDE.md`) |
| **Prototype** | `designs/pages/media/` (v2, build-kit `_spec.md` + `media.fixtures.js`) |

---

## 1. Goal

Back the host-side Media page: a per-event gallery of **photos and videos**, organized into **albums** (user groupings, distinct from the event's functions), with a storage meter. Files live in **Cloudflare R2**; the database stores only **object keys** + metadata (same as `avatar_url`, `cover_image_url`, `receipt_key`).

**Single-entity model (locked, prototype TL1/FE6):** the public website "Gallery" is the `published = true` *subset* of this store — not a second pool. Media owns the canonical photos/videos.

**Out of scope (deferred):** the public guest-facing gallery's anon-read path (ships with Digital Presence), entitlement-driven storage limit/tier, HEIC transcode + thumbnail generation (backend/edge concern), a bulk hard-delete (the UI forbids it — delete is single + confirmed).

---

## 2. What already exists (and changes)

| Object | State | Change |
|---|---|---|
| `public.events`, `public.event_sub_events`, `auth.users` | live | referenced — no change |
| `create_event_with_details` RPC | live (`guests_05`) | **extend** — seed `event_albums` from `config.album_presets` at event creation (6th seed block) |
| R2 buckets | live (`evenzi-public` / `evenzi-private`) | media originals + thumbnails go to the **private** bucket; served via signed URLs |

---

## 3. Decision log additions (D31–D35)

| # | Decision | Why |
|---|---|---|
| **D35** | **Media files live in R2; the DB stores object keys** (`storage_key`, `thumbnail_key`) + metadata, never bytes. Private bucket + short-lived signed URLs gated on event access (like `receipt_key`). The `published` flag is the single-entity website-gallery selector; the **anon-read path is deferred** with the public website. | Files aren't rows (storage section). Single-entity model (one store, `published` subset = website). Public-read only matters once the guest-facing site ships. |
| **D34** | **Storage usage is derived** (`sum(event_media.byte_size)` via `event_media_storage` view); **limit/tier deferred to the [PLANNED] entitlements/subscription layer** (app hardcodes free = 5 GB until then). No `event_storage` table now. | Storing a derivable aggregate drifts (D7); the meter's limit/tier belong to entitlements, a separate module. The fixtures explicitly flag "no backing table yet." |
| **D33** | **Album presets = `config.album_presets` catalog → per-event copy** (6 defaults seed `public.event_albums` at event creation, `is_custom=false`). Provenance/forge handling identical to guest tags (D29/D30): client INSERT requires `is_custom=true`; the DEFINER seed writes the `false` presets. | Consistent with `expense_types`/`guest_tags` (D25/D29). Presets render as inert chips from day one (prototype arbiter A); admin-tunable. |
| **D32** | **Media↔album is M:N** (`event_media_albums`); **deleting an album cascades only the links**, never the media ("photos stay in All Photos"). The join carries a trigger-guarded `event_id` (single-hop RLS, D27) + rejects a cross-event album. | The fixtures model `albumIds[]` (a photo in many albums); link tables not arrays (D7/D27); the delete-album copy promises photos survive. |
| **D31** | **One `event_media` table + a `kind` discriminator** (`text CHECK ('photo','video')`), video-only `duration_sec` (CHECK: null unless video). Photos and videos share the grid, album links, filters, and sort. | The prototype merges them in one grid with cross-type sort/filter; two tables would double the link tables/views/RLS and force UNIONs. `kind` is a true binary — `CHECK` not a catalog. |

---

## 4. Tables (DDL)

### 4.1 New catalog (`config.*`)

```sql
create table config.album_presets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique, name text not null, description text,
  display_order int not null default 0, enabled boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- seed: ceremony, reception, mehendi, sangeet, candids, prewedding
```

### 4.2 `public.event_media` (photos + videos)

```sql
create table public.event_media (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  kind text not null check (kind in ('photo','video')),
  storage_key text not null,                                   -- R2 object key (original) — NOT a public URL
  thumbnail_key text,                                          -- R2 key for the grid thumb / video poster
  name text,                                                   -- display name (falls back to original_filename)
  original_filename text, content_type text,
  byte_size bigint not null default 0 check (byte_size >= 0),  -- storage meter
  width int, height int,
  duration_sec int check (duration_sec is null or kind = 'video'),
  sub_event_id uuid references public.event_sub_events(id) on delete set null,  -- which function (nullable)
  taken_at timestamptz,                                        -- EXIF capture time (drives date filter)
  published boolean not null default false,                    -- website-gallery selector (single-entity)
  created_by uuid references auth.users(id) on delete set null, -- uploader (stamped server-side)
  created_at timestamptz not null default now(),               -- = uploadedAt (Newest sort / Recent strip)
  updated_at timestamptz not null default now()
);
create index idx_event_media_event_new on public.event_media(event_id, created_at desc);   -- Newest / Recent
create index idx_event_media_event_kind on public.event_media(event_id, kind);
create index idx_event_media_event_subevent on public.event_media(event_id, sub_event_id);
create index idx_event_media_event_taken on public.event_media(event_id, taken_at);          -- date filter
create index idx_event_media_published on public.event_media(event_id) where published;       -- website gallery
```

### 4.3 `public.event_albums`

```sql
create table public.event_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  is_custom boolean not null default false, source_slug text,  -- false+null = seeded preset
  cover_media_id uuid references public.event_media(id) on delete set null,  -- host-selectable cover
  display_order int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index uq_event_albums_name on public.event_albums(event_id, lower(name));
create index idx_event_albums_event on public.event_albums(event_id, display_order);
```
*(Created after `event_media` so the `cover_media_id` FK target exists; presets seed with `cover_media_id = null`.)*

### 4.4 `public.event_media_albums` (M:N)

```sql
create table public.event_media_albums (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,  -- guard-derived; rejects cross-event
  media_id uuid not null references public.event_media(id) on delete cascade,
  album_id uuid not null references public.event_albums(id) on delete cascade,  -- delete-album drops links only
  created_at timestamptz not null default now(),
  unique (media_id, album_id)
);
create index idx_media_albums_album on public.event_media_albums(event_id, album_id);  -- album contents + counts
create index idx_media_albums_media on public.event_media_albums(media_id);
```

---

## 5. Seeds

```sql
insert into config.album_presets (slug, name, display_order) values
  ('ceremony','Ceremony',1), ('reception','Reception',2), ('mehendi','Mehendi',3),
  ('sangeet','Sangeet',4), ('candids','Candids',5), ('prewedding','Pre-Wedding',6);
```

---

## 6. Derived read views (`security_invoker = on`, `authenticated`-only grant)

```sql
-- Storage meter usage + counts (limit/tier come from entitlements LATER — not here)
create view public.event_media_storage as
select event_id,
       coalesce(sum(byte_size),0) as used_bytes,
       count(*) filter (where kind='photo') as photo_count,
       count(*) filter (where kind='video') as video_count
from public.event_media group by event_id;
alter view public.event_media_storage set (security_invoker = on);

-- Album media counts (album CARD shows when count >= 1; preset chips when 0)
create view public.event_album_counts as
select event_id, album_id, count(*) as media_count
from public.event_media_albums group by event_id, album_id;
alter view public.event_album_counts set (security_invoker = on);
```
Both `revoke from anon, public; grant select to authenticated`. `event_media_storage` returns **no row** for a media-less event → FE coalesces to zeros.

---

## 7. Functions

| Function | Status | Purpose |
|---|---|---|
| `create_event_with_details(...)` | **extend** | add a 6th seed block: copy `config.album_presets` (enabled) → `public.event_albums` (`is_custom=false`, `source_slug=slug`, `created_by=null`, `cover_media_id=null`, `on conflict (event_id, lower(name)) do nothing`). Same signature → live caller unaffected. |
| `set_updated_at()` | live | attach to `event_media`, `event_albums`, `config.album_presets`; NOT the insert/delete-only `event_media_albums`. |
| storage limit/tier source | [PLANNED] | entitlements/subscription lookup (a `config.plans`-driven value), built with the enablement module. |
| bulk add/remove-from-album, upload | app-side | `.upsert([...], {ignoreDuplicates:true})` / `.delete().in()` under RLS; upload writes one `event_media` row after the R2 PUT. |

---

## 8. Triggers

| Trigger | On | When | Does |
|---|---|---|---|
| `trg_<table>_updated` | `event_media`, `event_albums`, catalog | before update | `set_updated_at()` |
| `media_album_before` | `event_media_albums` | before insert/update | derive `event_id` from the media; **reject an `album_id` from another event**. `SECURITY DEFINER`, `search_path=''`, anon-revoked, BEFORE-only. |
| `stamp_media_created_by` | `event_media` | before insert | stamp `created_by = auth.uid()` (every upload is user) |
| `stamp_album_created_by` | `event_albums` | before insert | stamp `created_by = auth.uid()` **only when `is_custom=true`** (seeded presets stay null — D30/D33) |

---

## 9. Security (RLS) — owner-only, inlined (D26)

RLS **enabled in the table-creation migration** (`media_02`); policies in `media_04`. `event_media`, `event_media_albums` get one `FOR ALL` owner-only policy on their `event_id`. `event_albums` is **split** (like `event_guest_tags`, D30): SELECT/UPDATE/DELETE owner-only (rename/delete seeded albums OK), but **INSERT requires `is_custom=true`** — clients can't forge a seeded preset; the DEFINER seed bypasses RLS.

```sql
create policy event_media_owner on public.event_media for all to authenticated
  using     (exists (select 1 from public.events e where e.id = event_media.event_id and e.user_id = (select auth.uid())))
  with check (exists (select 1 from public.events e where e.id = event_media.event_id and e.user_id = (select auth.uid())));
-- event_media_albums identical on its event_id; event_albums split (insert adds: and is_custom = true)
```

**Catalog** `config.album_presets`: RLS on, `SELECT using(true)`, no write policy (admin via `service_role`), `grant select`. **Storage/PII:** media keys point at the **private** R2 bucket; served via signed URLs from an event-access-checked route. `published=true` media stay private for now (the public website's anon-read path is deferred); the website serves them through the host's session until then. The `delete_user_account` purge already covers `events/{eventId}/…` (D18) — media keys live under that prefix.

---

## 10. Migration order (build PR)

| # | Migration | Contents |
|---|---|---|
| `media_01` | catalog + seed | `config.album_presets` + 6 seeds + `updated_at` trigger + RLS select-only + grant |
| `media_02` | live tables | `event_media` → `event_albums` (cover FK) → `event_media_albums` + indexes + `updated_at`/guard/stamp triggers + **RLS enabled** |
| `media_03` | views | `event_media_storage`, `event_album_counts` (`security_invoker`, authenticated-only) |
| `media_04` | RLS policies | owner-only on the 3 tables; `event_albums` split (INSERT `is_custom=true`) |
| `media_05` | function | extend `create_event_with_details` (+ album-preset seed) |

After: `gen types`, `get_advisors` (security + performance).

---

## 11. FE-INTEGRATION.md impact

- Cache `config.album_presets` like other catalogs (`.schema('config')`).
- Upload = R2 PUT (presigned), then insert one `event_media` row (`kind`, `storage_key`, `thumbnail_key`, `byte_size`, …); `created_by` is stamped by trigger.
- Display = mint a signed URL per `storage_key`/`thumbnail_key` from an event-access-checked route (never expose the key as a public URL).
- Add/remove from album = `event_media_albums` upsert (`{ignoreDuplicates:true}`) / delete; the guard fills `event_id`.
- Albums: create lands `is_custom=true`; set cover = update `event_albums.cover_media_id`; counts via `event_album_counts` (card shows when ≥1).
- Storage meter: `event_media_storage.used_bytes` (coalesce no-row→0); limit/tier hardcoded (free 5 GB) until entitlements.
- Newest sort / Recent = `order by created_at desc`; date filter = `taken_at`; website gallery = `where published`.

---

## 12. Deferred / out of scope

- Public guest-facing gallery anon-read (with Digital Presence) — `published` flag exists now.
- Entitlement-driven storage limit/tier (`event_storage` / plan lookup) — with the enablement module.
- HEIC transcode + thumbnail/poster generation — backend/edge (the DB just holds the resulting keys).
- Bulk hard-delete (UI forbids it; delete is single + confirmed).
- `can_access_event()` cutover (all event-children together).
- Video transcoding/streaming pipeline.

---

## 13. DATA-MODEL.md update checklist (same PR)

1. Add `config.album_presets` + the 3 live tables (DDL + Notes + Rationale, `[NOW]`).
2. Add the 2 views to the Views section; note `security_invoker` + authenticated-only grant.
3. Note the `create_event_with_details` album-preset seed in Functions.
4. Add the media triggers to Triggers.
5. Extend Security with the Media RLS subsection (incl. the `event_albums` split + private-R2/signed-URL note).
6. Update the ER diagram (event_media→events/sub_events; event_albums→events/cover; media_albums→media/albums).
7. Append decision log **D31–D35**.
8. Add derived rows (storage used + counts, album counts).
9. Account-deletion cascade tree: add the 3 media tables (cascade from events); `created_by`/`cover_media_id` SET NULL.
10. Bump Version + Last updated + scope.
11. Mirror FE changes into `FE-INTEGRATION.md`; confirm the media-key prefix in the R2 purge note.

---

## 14. Open items for spec review

1. `kind` as `text CHECK ('photo','video')` (not a catalog) — agreed (binary, no presentation). OK?
2. `cover_media_id` on `event_albums` (host-selectable cover, `set null` on media delete) — confirm the FK + the create-order (media before albums).
3. `published` modelled now, anon-read deferred — confirm the flag-now/path-later split.
