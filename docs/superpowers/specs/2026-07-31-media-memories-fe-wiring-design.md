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
| `src: string` | `storage_key` (+ `thumbnail_key`) | FE's `src` becomes a served URL built from `storage_key` (full-size) or `thumbnail_key` (grid tiles) — see §6 serving strategy |
| `name` | `name` / `original_filename` | `name` = user-facing (editable later, not in this pass); `original_filename` = filename at upload time, stamped once |
| `albumIds: string[]` | `event_media_albums` join rows | resolved server-side into an array on read, same shape FE already expects |
| `uploadedAt: number` (ms) | `created_at: timestamptz` | convert on read (`Date.parse`) |
| `takenAt?: number` | `taken_at: timestamptz \| null` | **left null on insert this pass** — no EXIF extraction exists or is proposed (see design-review answer above); FE already falls back to `uploadedAt` when `takenAt` is null (`MediaClient.tsx:263-264`), so this is a free no-op, not a gap to build around |
| `published: boolean` | `published: bool` | column exists, **no FE toggle exists anywhere in `MediaClient.tsx`** — read/pass through as `false` always this pass, no write path built. Flagged as an accepted gap (§8), not silently dropped |
| *(no FE field)* | *(no DB field — `coverId` is FE-only)* | See §8, exception #1 |

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
3. Client reads `video.duration` for `duration_sec`, and `video.videoWidth`/`video.videoHeight` for `width`/`height` (the same two columns photos use — shared on `event_media`, not video-specific)
4. Same 2-call presigned flow as photos (video file + poster), same commit call

**Validation (missing from the first draft — added on review):**
- `upload-url` allowlists `contentType` per `kind`: photo → `image/webp, image/jpeg, image/png, image/avif` (matches `optimizeImage`'s `ALLOWED_KEEP_TYPES`); video → `video/mp4, video/quicktime` (matches the FE `<input accept>`); poster/thumb → always `image/webp` (server-generated by construction, still checked). Reject with `400` outside the allowlist, same pattern as `cover/route.ts`'s `ALLOWED_TYPES`.
- Size can't be enforced pre-upload with a presigned `PUT` (the server never sees the bytes in flight), so it's enforced **at commit time** off the real R2 `HeadObject` size: reject the commit with `413` and immediately `deleteObject` the just-uploaded key if it exceeds the cap. Proposed caps (adjust if these numbers feel wrong): **20MB** per photo master (post-optimization; `optimizeImage`'s 4096px/q0.85 ceiling makes this generous headroom), **500MB** per video. Both are independent of the 5GB total-storage meter (§8 gap #6) — this is a per-file sanity cap, not quota enforcement.

**Multi-file batches:** the FE file inputs allow `multiple`. Each file runs the full pipeline (optimize → upload-url → PUT → commit) **independently** — a failure on file 3 of 5 doesn't block or roll back 1/2/4/5. The upload-progress list (§5) shows per-file status so a partial-batch failure is visible, not silent.

**Failure handling:** if a presigned `PUT` to R2 fails (network drop, expired URL) the commit call is simply never made — no orphaned DB row. An orphaned **R2 object** (uploaded but never committed, or rejected at commit for size) is possible but harmless (no DB reference, invisible to the app) and out of scope to garbage-collect this pass, same tolerance the codebase already accepts for advisory `byte_size` drift.

## 5. FE integration pattern

Matches `GuestManagementClient.tsx` / `PlanningClient.tsx`: `useState(initialPhotos)` / `useState(initialVideos)` / `useState(initialAlbums)` seeded from server props (replacing today's `useState<Photo[]>([])` empty-array starts). Every mutation (delete, bulk-delete, album create/rename/delete, assign/unassign) calls its API route, then on success patches local state from the response — no `router.refresh()`, no re-fetch, same as every other wired feature.

**Upload progress** is new territory (no prior feature in this codebase reports upload progress). The FE already has an empty, ready-to-populate target: `<ul className="media-upload-progress" role="list" aria-live="polite" />` (`MediaClient.tsx:668`). Wiring plan: each file gets a local progress entry driven by `XMLHttpRequest.upload.onprogress` for the R2 `PUT` step (plain `fetch` cannot report upload progress — this is the one place in the upload pipeline that can't use the codebase's usual `fetch`-based pattern), rendered as a percentage per list item; entry clears on successful commit, turns into an inline error state (with retry) on failure.

## 6. Serving strategy — private bucket, signed URLs

Per DATA-MODEL.md's explicit note ("Storage (the crux)"): media keys live in the **private** bucket, never the public one the existing `app/api/media/[...key]` route serves (that route's `ALLOWED_PREFIXES` are for a different purpose — event covers / website assets — and must **not** be extended to cover `event_media` keys, since that would make private wedding photos guessable/enumerable).

New route: `GET /api/events/[id]/media/[mediaId]/url` — owner-checked (same `auth.getUser()` + event-ownership check as every other route), returns a short-lived signed GET URL (reuse `getSignedDownloadUrl()` from `lib/storage/r2.ts`, already built). FE calls this once per tile on mount/scroll-into-view and caches the URL in state for the session; a expired-mid-session URL is handled by re-requesting on image `onError`.

## 7. Write path — new API routes

Following the Guest Management / Planning Tools precedent exactly: `uuidSchema.safeParse` on the event id → `auth.getUser()` 401 check → zod body validation → server Supabase client (ownership enforced by RLS on every table, this is defense-in-depth not the only gate) → typed JSON response, errors as `{ error, details? }`.

New files under `app/api/events/[id]/media/` (no `GET /` route needed — read path is the server-component `Promise.all` per §3, matching the Planning/Guests precedent):

| Route | Method | Purpose |
|---|---|---|
| `upload-url/route.ts` | `POST` | Body `{kind: 'photo'\|'video', part: 'master'\|'thumb', contentType}` → presigned PUT URL + key |
| `route.ts` | `POST` | Commit — body per §4, inserts `event_media` row (R2 HEAD for real `byte_size`) |
| `[mediaId]/route.ts` | `DELETE` | Purge `storage_key` + `thumbnail_key` from R2 (`deleteObject`, twice), delete row |
| `[mediaId]/url/route.ts` | `GET` | Signed GET URL, per §6 |
| `bulk-delete/route.ts` | `POST` | Body `{ids: string[]}` — same purge, batched (loop `deleteObject` + one `.delete().in('id', ids)`) |
| `albums/route.ts` | `POST` | Create custom album (`is_custom: true` — RLS requires this, forging a preset is rejected at the DB) |
| `albums/[albumId]/route.ts` | `PATCH` / `DELETE` | Rename / delete (links-only delete via cascade on `event_media_albums`, media rows survive — D32) |
| `[mediaId]/albums/route.ts` | `PATCH` | Body `{mode: 'add'\|'remove', albumIds: string[]}` — writes/removes `event_media_albums` rows |

`albums/route.ts` (create) and `albums/[albumId]/route.ts` (rename) both write against `uq_event_albums_name` (unique on `event_id, lower(name)`) — catch the Postgres unique-violation (`error.code === '23505'`) and return `409` with `{ error: 'An album with this name already exists' }`, not a generic `500`.

New `lib/validations/media.ts` — zod schemas mirroring `lib/validations/guests.ts`'s shape (`uploadUrlSchema`, `commitMediaSchema`, `createAlbumSchema`, `renameAlbumSchema`, `assignAlbumsSchema` as discriminated union on `mode`, `bulkDeleteSchema`).

## 8. Explicitly out of scope / accepted gaps

1. **`coverId` (FE "pin as cover" badge)** — no backing DB column exists anywhere (`event_albums.cover_media_id` is per-album, not event-wide). Stays local-state-only this pass. If a real "event hero cover" concept is wanted later, it needs its own schema decision (new column or reuse of an existing single-value slot) — not decided here, not silently built around.
2. **`event_albums.cover_media_id`** (the DB's actual per-album host-selectable cover, distinct from #1) — confirmed via grep, **zero references anywhere in `MediaClient.tsx`**. The FE's Albums tab picks a representative tile by computing "newest photo in the album" client-side (`albumPhotos(a.id).sort(newest)[0]`), never reads or writes this column. Left unwired this pass — building a "pick this as the album cover" UI would be new FE scope, not wiring existing FE, and the founder's "wire everything" scope call was about the built UI, not new features.
3. **`published` toggle** — column exists on `event_media`, **no FE UI to toggle it** anywhere in `MediaClient.tsx`. Read-only pass-through (`false` for all rows this pass); no write path built. This is the single-entity website-gallery selector — relevant once Digital Presence's guest site consumes it, not yet.
4. **EXIF (`taken_at`)** — no extraction, left `null` on insert; FE's existing `takenAt ?? uploadedAt` fallback absorbs this for free.
5. **Media tags** (`event_media_tags`/`event_media_tag_links`) and **`sub_event_id` tagging** — schema live, zero FE UI for either. Nothing to wire.
6. **Storage limit enforcement** — meter displays real usage against the hardcoded 5GB FE constant; no server-side upload-blocking-at-quota is built this pass (D34 explicitly defers limit/tier to [PLANNED] entitlements). An upload past 5GB will currently succeed server-side even though the meter shows "full" — acceptable for this pass, same as the founder's own scope call.
7. **Orphaned R2 objects** from a failed or size-rejected commit (§4) are not garbage-collected.
8. **Account-deletion R2 purge** — `delete_user_account` doesn't exist anywhere in this codebase yet (confirmed via grep — it's documented in DATA-MODEL.md as a planned mechanism, not built; matches the known "Danger Zone / Delete Account" deferral already tracked in `CLAUDE.md`). Not a new gap from this pass, but worth flagging here: once this pass ships, `events/{eventId}/…` in the private bucket will hold **real files** for the first time, so whoever eventually builds account/event deletion must purge those R2 prefixes, not just cascade the DB rows (DATA-MODEL.md's account-deletion section already documents this requirement — this is a pointer, not new scope). Event delete today is a **soft delete** (`deleted_at`, no cascade) — no orphan risk from that path right now.

## 9. Testing

Live browser test at the standard breakpoint set (360/390/414/768/1024/1440), per the pattern that's caught real defects on every prior wiring pass. Specific to this feature:

- Upload a real photo (incl. one HEIC file if available) and a real video, confirm both the master/poster and thumb render correctly, confirm `byte_size` in the DB matches the actual R2 object size (not a client-guessed number)
- Storage meter reflects real usage immediately after an upload (no stale/cached count)
- Delete a photo that's also an album cover elsewhere — confirm `cover_media_id` SET NULLs cleanly, album survives
- Album rename/delete, assign/unassign to multiple albums, bulk delete across a mixed photo+video selection
- Signed URL expiry: confirm the `onError` re-request path actually recovers (simulate by forcing a short `expiresIn` in dev)
- Confirm the public media proxy route (`app/api/media/[...key]`) is untouched and its `ALLOWED_PREFIXES` were not extended
- Reject an over-allowlist content-type at `upload-url` (400); reject an oversized file at commit-time and confirm the orphaned R2 object is actually deleted, not left behind (413)
- Duplicate album name on create and on rename both return 409 with the friendly message, not a raw Postgres error
- A 5-file batch upload where one file is deliberately invalid (bad type) — confirm the other 4 still complete and the progress list shows the one failure distinctly
