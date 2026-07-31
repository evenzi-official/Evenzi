# Media & Memories — Backend-Wiring Design

> Design spec for wiring the already-built Media & Memories frontend to its already-live data model. Data model reference: `docs/data-model/DATA-MODEL.md` §"Media & Memories module" (D31–D35, D37) and §"Media & Memories module RLS". This spec does not change the schema — it defines how the existing frontend and existing backend meet, plus the new upload pipeline (presigned R2 uploads + client-side image optimization).

| | |
|---|---|
| **Date** | 2026-07-31 |
| **Author** | Abhijith (+ Claude) |
| **Status** | Design — pending user review before plan |
| **Prototype/FE** | `app/events/[id]/media/MediaClient.tsx` (1341 lines, built, currently zero persistence — all state starts empty, file inputs are literal no-ops) |
| **Backend** | Schema 100% live (`media_01`–`media_06`) — `event_media`, `event_albums`, `event_media_albums`, `event_media_tags`, `event_media_tag_links`, `event_media_storage` view. Zero app-layer routes exist. |

---

## 1. Why this is a wiring pass, not a build

A repo audit on 2026-07-31 found `MediaClient.tsx` is a complete, well-built UI (photos/videos/albums tabs, lightbox, sort/filter/date-range, bulk select, album create/rename/delete, assign-to-album, cover pin, storage meter) that holds all data in React `useState` only — arrays start empty (`useState<Photo[]>([])`), file `<input>` elements have `onChange={() => {}}`, and the storage meter reads a hardcoded module constant (`STORAGE_MOCK`). Meanwhile the data model has been live since `media_01`–`media_06`. The gap is the connective layer: an upload pipeline (new — nothing like it exists yet) + CRUD API routes + swapping client state for real persistence.

Unlike Planning Tools' wiring pass, this one includes genuinely new infrastructure: **presigned direct-to-R2 upload** is not yet used anywhere in this codebase (existing R2 writes — avatar, event cover — buffer the whole file through the server via `formData()`, fine for a ≤5MB image, unworkable for video). `lib/storage/r2.ts` already exports `getSignedUploadUrl()`, unused until now.

## 2. Field-mapping gap

| FE (`Photo`) | DB (`event_media`) | Note |
|---|---|---|
| `id: string` | `id: uuid` | FE currently has no id-generation at all (arrays are empty) — ids come from the DB on insert |
| `src: string` | `storage_key` (+ `thumbnail_key`) | FE's `src` becomes a served URL built from `storage_key` (full-size) or `thumbnail_key` (grid tiles) — see §5 serving strategy |
| `name` | `name` / `original_filename` | `name` = user-facing (editable later, not in this pass); `original_filename` = filename at upload time, stamped once |
| `albumIds: string[]` | `event_media_albums` join rows | resolved server-side into an array on read, same shape FE already expects |
| `uploadedAt: number` (ms) | `created_at: timestamptz` | convert on read (`Date.parse`) |
| `takenAt?: number` | `taken_at: timestamptz \| null` | **left null on insert this pass** — no EXIF extraction exists or is proposed (see design-review answer above); FE already falls back to `uploadedAt` when `takenAt` is null (`MediaClient.tsx:263-264`), so this is a free no-op, not a gap to build around |
| `published: boolean` | `published: bool` | column exists, **no FE toggle exists anywhere in `MediaClient.tsx`** — read/pass through as `false` always this pass, no write path built. Flagged as an accepted gap (§7), not silently dropped |
| *(no FE field)* | *(no DB field — `coverId` is FE-only)* | See §7, exception #1 |

| FE (`Video`) | DB (`event_media` where `kind='video'`) | Note |
|---|---|---|
| `id`, `albumIds`, `uploadedAt`, `takenAt` | same as Photo | |
| `poster: string` | `thumbnail_key` | video poster frame, generated client-side (§4) |
| `duration: string` (formatted, e.g. `"2:14"`) | `duration_sec: int` | FE formats `duration_sec` → `mm:ss` on read; captured client-side from the `<video>` element's `duration` before upload |

| FE (`Album`) | DB (`event_albums`) | Note |
|---|---|---|
| `id`, `name` | same | |
| `preset: boolean` | `is_custom: bool` (inverted) | `preset = !is_custom`. Preset albums come from `config.album_presets` seed (6 defaults) via `create_event_with_details` — already seeded for every event, nothing to build for album creation-on-event-creation |

## 3. Read path

Server component (`page.tsx`) does one `Promise.all`, same convention as `app/events/[id]/guests/page.tsx` and `planning/page.tsx` — typed props into `MediaClient`, no client-side initial fetch:

- `event_media` — all columns, ordered `created_at desc, id desc` (matches the existing `idx_event_media_event_new` keyset index)
- `event_media_albums` — joined/grouped into each media row's `albumIds` array server-side (cross-schema embeds aren't available in this codebase's query pattern — same two-step resolve used for Planning's sub-event names)
- `event_albums` — ordered by `display_order`
- `event_media_storage` view — `used_bytes, photo_count, video_count` for the meter (limit stays the hardcoded `5 * 1024 * 1024 * 1024` FE constant — entitlements are [PLANNED], see [[project_storage_entitlements_planned]] memory, explicitly out of scope here)

## 4. Upload pipeline (the new part)

**Photos:**
1. Client picks file(s) → for each, `optimizeImage()` (`lib/storage/imageOptimize.ts`, already built, currently only used by the dev test page) produces `{master, thumb}` WebP blobs client-side (HEIC handled, keep-smaller guard applies)
2. Client calls `POST /upload-url` twice (master, thumb) → gets two presigned PUT URLs + the R2 keys to use
3. Client `PUT`s both blobs directly to R2 (no server involvement)
4. Client calls `POST /` (commit) with both keys + `width/height` (from `optimizeImage`'s return) + `content_type` — server does one R2 `HeadObject` on the master key to stamp the **real** `byte_size` (never trusts a client-reported size — D34 is explicit that `byte_size` is advisory/server-stamped), inserts the `event_media` row, returns it

**Videos:**
1. Client picks file → no re-encoding (out of scope — browser video transcoding isn't practical client-side)
2. Client seeks the `<video>` element to ~1s, draws that frame to a canvas, exports as WebP → this is the poster (same shape as a photo thumb)
3. Client reads `video.duration` for `duration_sec`
4. Same 2-call presigned flow as photos (video file + poster), same commit call

**Failure handling:** if a presigned `PUT` to R2 fails (network drop, expired URL) the commit call is simply never made — no orphaned DB row. An orphaned **R2 object** (uploaded but never committed) is possible but harmless (no DB reference, invisible to the app) and out of scope to garbage-collect this pass, same tolerance the codebase already accepts for advisory `byte_size` drift.

## 5. Serving strategy — private bucket, signed URLs

Per DATA-MODEL.md's explicit note ("Storage (the crux)"): media keys live in the **private** bucket, never the public one the existing `app/api/media/[...key]` route serves (that route's `ALLOWED_PREFIXES` are for a different purpose — event covers / website assets — and must **not** be extended to cover `event_media` keys, since that would make private wedding photos guessable/enumerable).

New route: `GET /api/events/[id]/media/[mediaId]/url` — owner-checked (same `auth.getUser()` + event-ownership check as every other route), returns a short-lived signed GET URL (reuse `getSignedDownloadUrl()` from `lib/storage/r2.ts`, already built). FE calls this once per tile on mount/scroll-into-view and caches the URL in state for the session; a expired-mid-session URL is handled by re-requesting on image `onError`.

## 6. Write path — new API routes

Following the Guest Management / Planning Tools precedent exactly: `uuidSchema.safeParse` on the event id → `auth.getUser()` 401 check → zod body validation → server Supabase client (ownership enforced by RLS on every table, this is defense-in-depth not the only gate) → typed JSON response, errors as `{ error, details? }`.

New files under `app/api/events/[id]/media/` (no `GET /` route needed — read path is the server-component `Promise.all` per §3, matching the Planning/Guests precedent):

| Route | Method | Purpose |
|---|---|---|
| `upload-url/route.ts` | `POST` | Body `{kind: 'photo'\|'video', part: 'master'\|'thumb', contentType}` → presigned PUT URL + key |
| `route.ts` | `POST` | Commit — body per §4, inserts `event_media` row (R2 HEAD for real `byte_size`) |
| `[mediaId]/route.ts` | `DELETE` | Purge `storage_key` + `thumbnail_key` from R2 (`deleteObject`, twice), delete row |
| `[mediaId]/url/route.ts` | `GET` | Signed GET URL, per §5 |
| `bulk-delete/route.ts` | `POST` | Body `{ids: string[]}` — same purge, batched (loop `deleteObject` + one `.delete().in('id', ids)`) |
| `albums/route.ts` | `POST` | Create custom album (`is_custom: true` — RLS requires this, forging a preset is rejected at the DB) |
| `albums/[albumId]/route.ts` | `PATCH` / `DELETE` | Rename / delete (links-only delete via cascade on `event_media_albums`, media rows survive — D32) |
| `[mediaId]/albums/route.ts` | `PATCH` | Body `{mode: 'add'\|'remove', albumIds: string[]}` — writes/removes `event_media_albums` rows |

New `lib/validations/media.ts` — zod schemas mirroring `lib/validations/guests.ts`'s shape (`uploadUrlSchema`, `commitMediaSchema`, `createAlbumSchema`, `renameAlbumSchema`, `assignAlbumsSchema` as discriminated union on `mode`, `bulkDeleteSchema`).

## 7. Explicitly out of scope / accepted gaps

1. **`coverId` (FE "pin as cover" badge)** — no backing DB column exists anywhere (`event_albums.cover_media_id` is per-album, not event-wide). Stays local-state-only this pass. If a real "event hero cover" concept is wanted later, it needs its own schema decision (new column or reuse of an existing single-value slot) — not decided here, not silently built around.
2. **`published` toggle** — column exists on `event_media`, **no FE UI to toggle it** anywhere in `MediaClient.tsx`. Read-only pass-through (`false` for all rows this pass); no write path built. This is the single-entity website-gallery selector — relevant once Digital Presence's guest site consumes it, not yet.
3. **EXIF (`taken_at`)** — no extraction, left `null` on insert; FE's existing `takenAt ?? uploadedAt` fallback absorbs this for free.
4. **Media tags** (`event_media_tags`/`event_media_tag_links`) and **`sub_event_id` tagging** — schema live, zero FE UI for either. Nothing to wire.
5. **Storage limit enforcement** — meter displays real usage against the hardcoded 5GB FE constant; no server-side upload-blocking-at-quota is built this pass (D34 explicitly defers limit/tier to [PLANNED] entitlements). An upload past 5GB will currently succeed server-side even though the meter shows "full" — acceptable for this pass, same as the founder's own scope call.
6. **Orphaned R2 objects** from a failed commit (§4) are not garbage-collected.

## 8. Testing

Live browser test at the standard breakpoint set (360/390/414/768/1024/1440), per the pattern that's caught real defects on every prior wiring pass. Specific to this feature:

- Upload a real photo (incl. one HEIC file if available) and a real video, confirm both the master/poster and thumb render correctly, confirm `byte_size` in the DB matches the actual R2 object size (not a client-guessed number)
- Storage meter reflects real usage immediately after an upload (no stale/cached count)
- Delete a photo that's also an album cover elsewhere — confirm `cover_media_id` SET NULLs cleanly, album survives
- Album rename/delete, assign/unassign to multiple albums, bulk delete across a mixed photo+video selection
- Signed URL expiry: confirm the `onError` re-request path actually recovers (simulate by forcing a short `expiresIn` in dev)
- Confirm the public media proxy route (`app/api/media/[...key]`) is untouched and its `ALLOWED_PREFIXES` were not extended
