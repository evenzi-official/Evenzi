# Media & Memories — Backend-Wiring Design

> Design spec for wiring the already-built Media & Memories frontend to its already-live data model. Data model reference: `docs/data-model/DATA-MODEL.md` §"Media & Memories module" (D31–D35, D37) and §"Media & Memories module RLS". This spec does not change the schema — it defines how the existing frontend and existing backend meet, plus the new upload pipeline (presigned R2 uploads + client-side image optimization).

| | |
|---|---|
| **Date** | 2026-07-31 |
| **Author** | Abhijith (+ Claude) |
| **Status** | Design — revised after `/council plan` (verdict: RE-PLAN — see §11) |
| **Prototype/FE** | `app/events/[id]/media/MediaClient.tsx` (1341 lines, built, currently zero persistence — all state starts empty, file inputs are literal no-ops) |
| **Backend** | Schema 100% live (`media_01`–`media_06`) — `event_media`, `event_albums`, `event_media_albums`, `event_media_tags`, `event_media_tag_links`, `event_media_storage` view (confirmed a plain `view`, not materialized — see §3). Zero app-layer routes exist. |

---

## 1. Why this is a wiring pass, not a build

A repo audit on 2026-07-31 found `MediaClient.tsx` is a complete, well-built UI (photos/videos/albums tabs, lightbox, sort/filter/date-range, bulk select, album create/rename/delete, assign-to-album, cover pin, storage meter) that holds all data in React `useState` only — arrays start empty (`useState<Photo[]>([])`), file `<input>` elements have `onChange={() => {}}`, and the storage meter reads a hardcoded module constant (`STORAGE_MOCK`). Meanwhile the data model has been live since `media_01`–`media_06`. The gap is the connective layer: an upload pipeline (new — nothing like it exists yet) + CRUD API routes + swapping client state for real persistence.

Unlike Planning Tools' wiring pass, this one includes genuinely new infrastructure: **presigned direct-to-R2 upload** is not yet used anywhere in this codebase (existing R2 writes — avatar, event cover — buffer the whole file through the server via `formData()`, fine for a ≤5MB image, unworkable for video). `lib/storage/r2.ts` already exports `getSignedUploadUrl()`, unused until now.

**This spec was revised after a 5-agent `/council plan` review** (Tech Lead, Backend Engineer, Security Expert, Frontend Engineer, Test Engineer — critique + debate + arbiter). Original verdict: 🔴 RE-PLAN, 3 architectural criticals. This version closes all 3 plus the important findings that were fixable without new infrastructure or a product decision; §11 records what's explicitly deferred and why.

## 2. Field-mapping gap

| FE (`Photo`) | DB (`event_media`) | Note |
|---|---|---|
| `id: string` | `id: uuid` | FE currently has no id-generation at all (arrays are empty) — ids come from the DB on insert |
| `src: string` | `storage_key` (+ `thumbnail_key`) | FE's `src` becomes a served URL fetched via a batched signed-URL call, not a direct `<img src>` — see §6 serving strategy |
| `name` | `name` / `original_filename` | `name` = user-facing (editable later, not in this pass); `original_filename` = filename at upload time, stamped once |
| `albumIds: string[]` | `event_media_albums` join rows | resolved server-side into an array on read, same shape FE already expects |
| `uploadedAt: number` (ms) | `created_at: timestamptz` | convert on read (`Date.parse`) |
| `takenAt?: number` | `taken_at: timestamptz \| null` | **left null on insert this pass** — no EXIF extraction exists or is proposed; FE already falls back to `uploadedAt` when `takenAt` is null (`MediaClient.tsx:263-264`), so this is a free no-op |
| `published: boolean` | `published: bool` | column exists, **no FE toggle exists anywhere in `MediaClient.tsx`** — read/pass through as `false` always this pass, no write path built. Flagged as an accepted gap (§10 #3) |
| *(no FE field)* | *(no DB field — `coverId` is FE-only)* | See §10, item #1 |
| `width`, `height` | `width int`, `height int` | **now bounds-checked server-side** — see §4 Validation (council finding: Tech Lead #4 / Security Expert) |

| FE (`Video`) | DB (`event_media` where `kind='video'`) | Note |
|---|---|---|
| `id`, `albumIds`, `uploadedAt`, `takenAt` | same as Photo | |
| `poster: string` | `thumbnail_key` | video poster frame, generated client-side (§4) — **now server-verified to exist before commit**, not trusted |
| `duration: string` (formatted, e.g. `"2:14"`) | `duration_sec: int` | FE formats `duration_sec` → `mm:ss` on read; captured client-side from the `<video>` element's `duration` before upload, **now bounds-checked server-side** (positive, under a 4-hour ceiling) |

| FE (`Album`) | DB (`event_albums`) | Note |
|---|---|---|
| `id`, `name` | same | |
| `preset: boolean` | `is_custom: bool` (inverted) | `preset = !is_custom`. Preset albums come from `config.album_presets` seed (6 defaults) via `create_event_with_details` — already seeded for every event, nothing to build for album creation-on-event-creation |

## 3. Read path

Server component (`page.tsx`) does one `Promise.all`, same convention as `app/events/[id]/guests/page.tsx` and `planning/page.tsx` — typed props into `MediaClient`, no client-side initial fetch:

- `event_media` — all columns, ordered `created_at desc, id desc` (matches the existing `idx_event_media_event_new` keyset index)
- `event_media_albums` — joined/grouped into each media row's `albumIds` array server-side (cross-schema embeds aren't available in this codebase's query pattern — same two-step resolve used for Planning's sub-event names)
- `event_albums` — ordered by `display_order`
- `event_media_storage` view — `used_bytes, photo_count, video_count` for the meter. **Council finding resolved:** confirmed via `DATA-MODEL.md:1309` (`create view`, not `create materialized view`) — this is a live aggregate, always current, no staleness/refresh-trigger concern. Limit stays the hardcoded `5 * 1024 * 1024 * 1024` FE constant — entitlements are [PLANNED], see [[project_storage_entitlements_planned]] memory, explicitly out of scope here.

## 4. Upload pipeline

**Photos:**
1. Client picks file(s) → for each, `optimizeImage()` (`lib/storage/imageOptimize.ts`, already built, currently only used by the dev test page) produces `{master, thumb}` WebP blobs client-side (HEIC handled via `heic2any`, keep-smaller guard applies)
2. Client calls `POST /upload-url` twice (master, thumb) → gets two presigned PUT URLs + the R2 keys to use (server-generated, not client-supplied — satisfies the `storage_key` CHECK constraint's `events/{event_id}/…` prefix requirement)
3. Client `PUT`s both blobs directly to R2 via `XMLHttpRequest` (not `fetch` — see §5, upload-progress needs `onprogress`)
4. Client calls `POST /` (commit) with both keys + `width/height` + `content_type` — server verifies **both** keys exist and are within size (§4 Validation, closes council critical #2), stamps the **real** `byte_size` from R2, inserts the `event_media` row, returns it

**Videos:**
1. Client picks file → no re-encoding (out of scope — browser video transcoding isn't practical client-side)
2. Client seeks the `<video>` element to ~1s, draws that frame to a canvas, exports as WebP → this is the poster (same shape as a photo thumb). **Seek gets an 8-second timeout** (council finding, Frontend Engineer) — on timeout, the file's pipeline entry transitions to the same inline error/retry state a failed upload gets, not an indefinite hang.
3. Client reads `video.duration` for `duration_sec`, and `video.videoWidth`/`video.videoHeight` for `width`/`height`
4. Same 2-call presigned flow as photos (video file + poster), same commit call

### Validation (revised after council review)

**Content-type allowlist:** `upload-url` allowlists `contentType` per `kind`: photo → `image/webp, image/jpeg, image/png, image/avif`; video → `video/mp4, video/quicktime`; poster/thumb → always `image/webp`. Reject `400` outside the allowlist, matching `cover/route.ts`'s `ALLOWED_TYPES` pattern.

**Server-side authenticity check (new — closes council finding, Security Expert #5):** the content-type allowlist only constrains the presign signature's declared header, not the actual bytes. At commit time, in the same call that HEADs the object for `byte_size`, the server also does a small ranged `GetObject` (first ~16 bytes) on the master/video key and checks magic bytes against the declared `kind`/`content_type` (WebP: `RIFF….WEBP`; JPEG: `FFD8FF`; PNG: `89504E47`; MP4/MOV: `ftyp` at offset 4). Mismatch → reject commit with `400`, delete both uploaded keys. No new dependency — this is a `GetObjectCommand` with a `Range` header on the existing R2 client.

**Both keys verified, not just master (closes council critical #2 — Backend Engineer #1 / Security Expert #2 / Test Engineer #2):** commit now does `HeadObject` on **both** the master/video key and the thumb/poster key, in parallel. Thumb/poster gets its own, tighter size ceiling — **2MB** (thumbnails have no legitimate reason to be larger; this is a Security Expert suggested value, tight enough to be a meaningful gate without needing per-image-size math). If either HEAD fails (object missing) or either size check fails, commit is rejected and **both** uploaded keys are deleted (closes council finding, Backend Engineer #3 — previously only the singular oversized key was named for cleanup).

**Size caps (unchanged from original draft, now applied correctly to both keys):** master — **20MB** photo / *(video file has no separate cap beyond the 500MB below)*; thumb/poster — **2MB**; video — **500MB**. Enforced at commit time via `HeadObject` (a presigned `PUT` can't cap size pre-transfer), `413` + delete-both-keys on violation.

**Bounds-checked metadata (closes council suggestion, Tech Lead #4 / Security Expert):** `width`/`height` — positive integers, capped at a generous 10000px (well above `optimizeImage`'s 4096px ceiling, just a sanity bound against a spoofed/malformed value). `duration_sec` — positive, capped at 4 hours (14400s). Added to `lib/validations/media.ts`'s `commitMediaSchema` — not a security fix, integrity hygiene matching the precedent this same spec already sets for `byte_size`.

**Multi-file batches:** the FE file inputs allow `multiple`. Each file runs the full pipeline (optimize → upload-url → PUT → commit) **independently** — a failure on file 3 of 5 doesn't block or roll back 1/2/4/5. **Client-side concurrency capped at 3 files in flight at once** (closes council finding, Frontend Engineer #3 / Tech Lead #5 — a 10-file batch was previously unbounded, risking a main-thread freeze from simultaneous `optimizeImage()` WebP re-encodes); the rest queue and start as slots free up. A full Web Worker migration for `optimizeImage()` is **not** done this pass (see §10 #9) — the concurrency cap alone closes the worst-case tab-freeze risk cheaply; moving the encode off the main thread is a larger, separable follow-up.

**Presign expiry scaled by kind (closes council suggestion, Backend Engineer #5):** `getSignedUploadUrl()`'s `expiresIn` is **300s (5 min)** for photo/thumb parts, **1800s (30 min)** for video parts — a 500MB upload on a slow connection can plausibly exceed 5 minutes, and failing against an expired URL after most of the transfer completed is an avoidable, bad failure mode.

**Failure handling:** if a presigned `PUT` to R2 fails (network drop, expired URL) the commit call is simply never made — no orphaned DB row. An orphaned **R2 object** (uploaded but never committed, or rejected at commit) is possible; garbage-collecting it is explicitly deferred (§10 #6).

## 5. FE integration pattern

Matches `GuestManagementClient.tsx` / `PlanningClient.tsx`: `useState(initialPhotos)` / `useState(initialVideos)` / `useState(initialAlbums)` seeded from server props (replacing today's `useState<Photo[]>([])` empty-array starts).

### Mutation pattern — optimistic update with rollback (closes council critical #3)

Every mutation (delete, bulk-delete, album create/rename/delete, assign/unassign) follows a single shared pattern, not ad-hoc per-action logic: apply the change to local state immediately (optimistic), fire the API call, and **on failure, revert the local state to its pre-mutation snapshot** and surface an inline error at the interaction site (toast or inline message, matching whatever affordance the existing modals already use). This is the pattern `PlanningClient.tsx` needed to retrofit after shipping without it (per `CLAUDE.md`'s Planning Tools entry — "missing optimistic-update rollback" was one of its two post-review fixes); this spec pulls that pattern forward instead of re-deriving it. Implement as one shared hook (e.g. `useOptimisticMediaMutation`) that every action (`removePhoto`, `bulkDeletePhotos`, `submitAlbumForm`, `submitAssign`, etc.) calls through, not six bespoke copies.

**New error case this introduces that today's pure-local-state code has never had to handle:** album create/rename can now return `409` (duplicate name — see §7); the shared hook surfaces this as an inline form error on the album-name modal, not a generic toast, since it's actionable (rename the input) rather than a transient failure.

### Bulk-delete response contract (closes council critical, Backend Engineer #4 / Test Engineer #5)

`bulk-delete` returns a **per-id result**, not a flat success/failure: `{ deleted: string[], failed: { id: string, reason: string }[] }`. On the client, the optimistic-rollback hook removes only the `failed` ids' tiles from the optimistic-delete state (reverting just those), leaving `deleted` ids gone — never an all-or-nothing rollback that would punish successful deletes for one bad id. **Selection-state reset rule** (closes council suggestion, Frontend Engineer): after any bulk operation completes (delete or assign), the selection set clears entirely, regardless of partial failure — simplest safe default; a "retry failed only" affordance is not built this pass.

### Optimistic upload preview lifecycle (closes council blind spot, Frontend Engineer)

Each picked file gets a local `URL.createObjectURL(file)` preview shown immediately in the grid (so the UI doesn't sit blank through the optimize→upload→commit round trip), tracked through an explicit per-item state machine: `local-pending → optimizing → uploading → committing → committed | failed`. On `committed`, the tile swaps from the blob URL to a real signed URL (fetched via the batch endpoint, §6) and `URL.revokeObjectURL()` fires immediately after the swap — not before (avoids a flash of broken image) and not never (avoids a memory leak across large batch sessions). On component unmount mid-pipeline (user navigates away), any in-flight `XMLHttpRequest` is aborted via `xhr.abort()` in a cleanup effect, and no commit call fires for an aborted upload — if a PUT happened to complete right before abort but commit never ran, that's the same harmless-orphan case already accepted in §4's failure handling.

### Upload progress (new territory — no prior feature in this codebase reports upload progress)

The FE already has an empty, ready-to-populate target: `<ul className="media-upload-progress" role="list" aria-live="polite" />` (`MediaClient.tsx:668`). Each file's progress is driven by `XMLHttpRequest.upload.onprogress` for the R2 `PUT` step (plain `fetch` cannot report upload progress). **Accessibility fix (closes council suggestion, Frontend Engineer / Test Engineer):** the numeric percentage updates on every `onprogress` tick as **visual-only** text (`aria-hidden`); the `aria-live="polite"` region only announces on state *transitions* (upload started, upload complete, upload failed) — not on every percentage tick, which would otherwise spam a screen-reader user dozens of times per file.

## 6. Serving strategy — private bucket, signed URLs, batched

Per DATA-MODEL.md's explicit note ("Storage (the crux)"): media keys live in the **private** bucket, never the public one the existing `app/api/media/[...key]` route serves (that route's `ALLOWED_PREFIXES` are for a different purpose — event covers / website assets — and must **not** be extended to cover `event_media` keys, since that would make private wedding photos guessable/enumerable).

**Batched, not per-tile (closes council finding — Tech Lead #1 / Backend Engineer #7 / Frontend Engineer #5):** `POST /api/events/[id]/media/urls` — body `{mediaIds: string[]}` (capped at 200 per call), owner-checked once for the whole batch, returns a `{ [mediaId]: { url, expiresAt } }` map (reusing `getSignedDownloadUrl()`, default 1hr expiry, unchanged). FE fetches this once per visible page/viewport batch on mount (not per-tile), caches the map in state keyed by id with the `expiresAt`, and only re-requests a specific id on that `<img>`'s `onError` (expired-mid-session recovery) rather than re-requesting the whole batch. This closes the originally-flagged N-simultaneous-requests-on-mount problem, which Frontend Engineer confirmed would fire as a real thundering-herd against this route (React doesn't throttle a `useEffect`-per-tile pattern) — and which could otherwise itself look like the kind of abuse pattern Security Expert flagged for `upload-url`.

## 7. Write path — new API routes

Following the Guest Management / Planning Tools precedent, with one addition closing council critical #1: `uuidSchema.safeParse` on the event id → `auth.getUser()` 401 check → **explicit event-ownership check** (`SELECT id FROM events WHERE id = $eventId AND user_id = $userId`, 403/404 if no match) → zod body validation → server Supabase client → typed JSON response, errors as `{ error, details? }`.

**The ownership check is now a named, mandatory step for every route below, not an implicit assumption.** This matters most for `upload-url` and the commit route: neither touches a table with RLS in a way that would catch a missing check (`upload-url` touches no table at all; commit's `INSERT` would succeed under RLS's `WITH CHECK` only if the row's `event_id` is legitimately owned — but by then a presigned URL has already been issued and possibly used). Extract this into a small shared helper (e.g. `assertEventOwnership(supabase, eventId, userId)`) so every route calls the same code path instead of six independent implementations.

New files under `app/api/events/[id]/media/` (no `GET /` route needed — read path is the server-component `Promise.all` per §3, matching the Planning/Guests precedent):

| Route | Method | Purpose |
|---|---|---|
| `upload-url/route.ts` | `POST` | Body `{kind: 'photo'\|'video', part: 'master'\|'thumb', contentType}` → presigned PUT URL + server-generated key. **Ownership-checked** (§7 intro) — this route has no other backstop. |
| `route.ts` | `POST` | Commit — body per §4, verifies both keys (HEAD + magic-byte check on master, HEAD + size on thumb), inserts `event_media` row. **Idempotency (closes council important, Tech Lead #2 / Backend Engineer #2 / Test Engineer #3):** before inserting, the handler does a `SELECT id FROM event_media WHERE storage_key = $storageKey` — if a row already exists, returns that row instead of inserting a duplicate. This is a best-effort application-level check, not a DB unique constraint (the schema isn't being changed this pass — see §10 #7 for the residual race window this leaves open). |
| `[mediaId]/route.ts` | `DELETE` | Purge `storage_key` + `thumbnail_key` from R2 (`deleteObject`, twice), delete row |
| `[mediaId]/url/route.ts` | `GET` | Single signed GET URL — kept only as the `onError` re-fetch path for an expired batch-issued URL (§6); not the primary read path |
| `urls/route.ts` | `POST` | Batched signed GET URLs, per §6 |
| `bulk-delete/route.ts` | `POST` | Body `{ids: string[]}`, **capped at 100 ids** (closes council important, Security Expert #4). Every id must resolve to a row whose `event_id` matches the URL's `event_id` before any deletion executes (closes the mass-IDOR angle Security Expert raised — ownership of the *event* alone isn't sufficient, each id is re-checked). **Delete order (closes council important, Backend Engineer #4):** DB row deleted first (source of truth for what the UI shows), then best-effort R2 purge — an orphaned R2 object is a cheaper failure mode than a ghost row surviving in the UI. Returns `{ deleted: string[], failed: {id, reason}[] }` per §5. |
| `albums/route.ts` | `POST` | Create custom album (`is_custom: true` — RLS requires this, forging a preset is rejected at the DB) |
| `albums/[albumId]/route.ts` | `PATCH` / `DELETE` | Rename / delete (links-only delete via cascade on `event_media_albums`, media rows survive — D32) |
| `[mediaId]/albums/route.ts` | `PATCH` | Body `{mode: 'add'\|'remove', albumIds: string[]}` — writes/removes `event_media_albums` rows. **`add` on an already-present album is a no-op success (closes council suggestion, Backend Engineer #6):** catch the `unique(media_id, album_id)` violation (`23505`) and treat it as success rather than letting it bubble to `500` — matches idempotent-toggle UX. |

`albums/route.ts` (create) and `albums/[albumId]/route.ts` (rename) both write against `uq_event_albums_name` (unique on `event_id, lower(name)`) — catch the Postgres unique-violation (`error.code === '23505'`) and return `409` with `{ error: 'An album with this name already exists' }`, not a generic `500`. This is the error case §5's mutation hook surfaces as an inline form error.

New `lib/validations/media.ts` — zod schemas mirroring `lib/validations/guests.ts`'s shape (`uploadUrlSchema`, `commitMediaSchema` — now with width/height/duration_sec bounds per §4, `createAlbumSchema`, `renameAlbumSchema`, `assignAlbumsSchema` as discriminated union on `mode`, `bulkDeleteSchema` — now with a max-length array constraint, `batchUrlsSchema` — max 200 ids).

## 8. Testing (revised after council review — scope explicitly split)

**Council ruling on test-layer scope (arbiter, upheld-with-modification):** the 8 API routes get mandatory Vitest unit/integration coverage — they run in Node and need no browser globals (`vitest.config.ts` is Node-env, per project convention). The client-side pipeline (`optimizeImage`/`heic2any`, `createImageBitmap`, canvas re-encode, `<video>` seek-based poster capture) stays explicitly **out** of unit-test scope — it depends on real browser APIs `vitest`'s Node environment doesn't have, and forcing it via jsdom/heavy mocking would trade real codec/seek-stall coverage for false confidence. That half is covered by the live-browser pass below only.

### Integration tests (Vitest, new — closes council important, Test Engineer #6)

For the 8 routes: auth/ownership matrix (unauthenticated → 401; non-owner authenticated → 403/404 — closes council critical #1's test gap, Security Expert #1 / Test Engineer #1), the size-cap boundary (exactly-at-cap succeeds, one-byte-over fails — closes Test Engineer #7), commit idempotency (call commit twice with identical keys, assert one row not two), the master-succeeds/thumb-fails asymmetric case (closes council critical #2's test gap, Backend Engineer #1 / Security Expert #2 / Test Engineer #2 — upload only the master, call commit, assert rejection), magic-byte mismatch rejection, duplicate album name → `409` not raw Postgres error, `bulk-delete` batch-size cap + partial-failure response shape.

### Live browser tests (Playwright/manual, standard breakpoint set 360/390/414/768/1024/1440)

- Upload a real photo (incl. one HEIC file if available) and a real video, confirm both the master/poster and thumb render correctly, confirm `byte_size` in the DB matches the actual R2 object size
- HEIC decode failure path (a HEIC variant `heic2any` rejects) — confirm it surfaces as a clear per-file error, not a silent skip or a crash (closes council important, Frontend Engineer's revised HEIC finding)
- Storage meter reflects real usage immediately after an upload (resolved as testable now the view is confirmed non-materialized, §3)
- Delete a photo that's also an album cover elsewhere — confirm `cover_media_id` SET NULLs cleanly, album survives
- Album rename/delete, assign/unassign to multiple albums (incl. re-assigning to an already-assigned album — confirm no-op success, not an error), bulk delete across a mixed photo+video selection with one deliberately-failing id — confirm the failed tile's optimistic-delete rolls back while the rest stay deleted, and selection clears
- A video whose poster-frame seek is artificially stalled (throttle the video load) — confirm the 8s timeout fires and the file shows a retryable error, not an indefinite spinner
- A 5-file batch upload where one file is deliberately invalid (bad type) — confirm the other 4 still complete (respecting the 3-concurrent cap) and the progress list shows the one failure distinctly, with visual-only percentage text and state-transition-only screen-reader announcements
- Signed URL expiry: confirm the batch fetch + per-tile `onError` re-request path actually recovers (simulate by forcing a short `expiresIn` in dev)
- Navigate away mid-upload (unmount `MediaClient`) — confirm the in-flight request aborts and no orphaned commit happens
- Confirm the public media proxy route (`app/api/media/[...key]`) is untouched and its `ALLOWED_PREFIXES` were not extended

## 9. Test environment note (for whoever picks up the test plan)

The integration tests in §8 need a decision on R2 fixtures (real dev bucket vs. mocked S3 client) and test-tenant setup for the cross-ownership case — this is scoped to the eventual `docs/test-plans/media-memories.md` (Test Engineer's Mode 1 planning output), not locked down in this design spec. Flagging here so it isn't lost between spec and test-plan authorship (council blind spot, Test Engineer).

## 10. Explicitly out of scope / accepted gaps

1. **`coverId` (FE "pin as cover" badge)** — no backing DB column exists anywhere (`event_albums.cover_media_id` is per-album, not event-wide). Stays local-state-only this pass.
2. **`event_albums.cover_media_id`** (the DB's actual per-album host-selectable cover, distinct from #1) — confirmed via grep, zero references anywhere in `MediaClient.tsx`. FE picks a representative tile by computing "newest photo in the album" client-side. Left unwired — a picker UI is new FE scope, not wiring existing FE.
3. **`published` toggle** — column exists, no FE UI to toggle it anywhere. Read-only pass-through `false`, no write path.
4. **EXIF (`taken_at`)** — no extraction, left `null` on insert; FE's existing fallback absorbs this for free.
5. **Media tags** (`event_media_tags`/`event_media_tag_links`) and **`sub_event_id` tagging** — schema live, zero FE UI for either.
6. **Orphaned R2 objects** — from a failed/rejected commit, or from the residual idempotency race (§7), are not garbage-collected. A periodic reconciliation job (list R2 keys with no matching DB row → GC) is a real, separable follow-up (council blind spot, Backend Engineer) — needs a scheduling mechanism this codebase doesn't have yet (no cron/scheduled-function infra), so it's a product/infra decision, not something this spec should quietly build.
7. **Idempotency is best-effort, not DB-enforced** (§7) — the `SELECT`-then-`INSERT` check has a TOCTOU race under truly concurrent identical commits (same user, same storage_key, near-simultaneous requests). Accepted as low-probability (requires a genuine double-fire, not just a slow retry) and low-severity (worst case is a duplicate row, not data loss or a security issue) rather than adding a schema migration to a spec that's explicitly scoped as schema-unchanged.
8. **True rate limiting on `upload-url` issuance** (council important, Security Expert #3) — the spec closes the *worst* abuse angle (both keys now verified and size-capped at commit, so nothing gets counted against the DB/meter without passing checks), but a scripted client can still issue many presigned URLs and PUT large objects to R2 without ever committing, consuming real storage/bandwidth with no server-side throttle. Closing this properly needs a rate-limiting primitive (Redis/Upstash sliding window, or a DB-backed counter) this codebase doesn't have anywhere yet — that's an infra choice for the founder, not something to bolt on silently inside this spec. Flagged as a follow-up with the same urgency class as the storage-quota gap below.
9. **Web Worker migration for `optimizeImage()`** — the concurrency cap (§4) closes the acute tab-freeze risk cheaply; moving the actual encode off the main thread is a larger, separable perf follow-up.
10. **Storage limit enforcement** — meter displays real usage against the hardcoded 5GB FE constant; no server-side upload-blocking-at-quota (D34 explicitly defers limit/tier to [PLANNED] entitlements, see [[project_storage_entitlements_planned]]). An upload past 5GB will currently succeed server-side even though the meter shows "full."
11. **EXIF/GPS metadata stripping** (council suggestion, Security Expert) — wedding photos commonly carry embedded location data. Not stripped this pass; mitigated somewhat by the private-bucket + signed-URL model (not a public, permanent URL), but anyone with lookup access to a signed URL still gets the original bytes including metadata. Worth a founder call on whether to strip server-side (adds an image-processing step) — not decided here.
12. **Presigned URL replay / no single-use tracking** (council suggestion, Security Expert) — inherent to the presigned-URL model generally (standard industry tradeoff, not unique to this design); mitigated by the short TTLs already in place (§4) rather than solved.
13. **Read-signed-URL TTL/scope refinement** (council suggestion, Security Expert) — 1hr default via `getSignedDownloadUrl()`, unchanged. A leaked/shared signed URL grants original-quality access for up to an hour. Accepted default; revisit if abuse is observed.
14. **Account-deletion R2 purge** — `delete_user_account` doesn't exist anywhere in this codebase yet (confirmed via grep; documented in DATA-MODEL.md as planned, matches the known "Danger Zone / Delete Account" deferral tracked in `CLAUDE.md`). Not new scope here, but flagged: once this pass ships, `events/{eventId}/…` in the private bucket holds **real files** for the first time, so whoever builds account/event deletion later must purge those R2 prefixes, not just cascade DB rows. Event delete today is a **soft delete** (`deleted_at`, no cascade) — no orphan risk from that path right now.

## 11. Council review record

**Council reviewed:** 2026-07-31 by Tech Lead, Backend Engineer, Security Expert, Frontend Engineer, Test Engineer (critique + debate + arbiter). **Original verdict:** 🔴 RE-PLAN — 3 criticals (event-ownership authorization not mandated; thumb/poster key never verified; async mutation UX/rollback contract undefined), ~13 important findings. This revision closes all 3 criticals and the important findings that were addressable without new infrastructure or a product decision (see §10 for what's explicitly deferred and why). A lighter confirm-the-fixes council pass is the next step before writing the implementation plan, matching the precedent set by this project's Digital Presence Wave 2 spec.
