# Cloudflare R2 Storage Integration — Design Spec

**Date:** 2026-06-13
**Status:** Approved (brainstorm) — pending implementation plan
**Scope:** SP-0 — the storage foundation only. No Supabase tables, no feature UIs, no Cloudflare Image Transformations, no video transcoding (all explicitly out of scope; see §9).

---

## 1. Summary

A reusable object-storage layer for Evenzi backed by **Cloudflare R2** (S3-compatible, zero egress). It provides direct browser→R2 uploads via presigned URLs, with **client-side image optimization** so storage only ever holds an optimized master plus a thumbnail. Two buckets separate truly public assets from private (lock-and-key) content. The layer is generic — Media & Memories, Invitations, Website, and avatars will all consume it later — but this spec ships only the foundation: the `lib/storage` modules, the upload/sign/delete API routes, env wiring, and the Cloudflare bucket setup.

Why R2: zero egress fees, $0.015/GB-month storage, a 10 GB free tier, and a $10k Cloudflare-for-Startups credit (R2-capped) available to Evenzi. See `docs/startup-credits-2026.md`.

## 2. Goals & non-goals

**Goals**
- One storage abstraction (`lib/storage`) usable by every feature.
- Large media uploads that bypass Vercel's ~4.5 MB serverless body limit.
- Storage holds optimized images only (high-cap master + thumbnail), produced in the browser.
- Clean public/private separation with extensible access (more access cases are expected — design must not hard-code only two modes).
- Per-event / per-user deletes via key prefixes.

**Non-goals (this session)**
- Supabase tables / metadata persistence (callers receive keys; persistence comes with each feature backend).
- Cloudflare Image Transformations / on-the-fly resizing (deferred until the $10k credit lands).
- Video compression/transcoding.
- Feature UIs (Media gallery, Invitations editor, etc.).

## 3. Decisions locked in brainstorming

| Topic | Decision |
|---|---|
| Upload pattern | **Presigned PUT, direct browser → R2** (auth-checked URL minted server-side) |
| Image optimization | **Client-side, before upload**; storage stores the optimized output |
| Original retention | **High-cap optimized master** (≤4096px, WebP q85) — no separate full-res original |
| Variants | **Client generates master + ~400px thumbnail** (both uploaded); Transformations deferred |
| Access model | **Hybrid two-bucket** — public bucket = public website landing images only; **everything else private**, served via short-lived signed GET URLs minted only after authorization. Extensible for future cases (TBC). |
| Key structure | `{scope}/{scopeId}/{feature}/{uuid}.{ext}`, thumbnail as `{uuid}_thumb.{ext}` |

## 4. Cloudflare setup (manual, dashboard — guided)

Performed by Abhijith in the Cloudflare dashboard; implementation plan will include a step-by-step runbook.

1. **R2 → Create bucket** ×2: `evenzi-public`, `evenzi-private`.
2. **Public bucket access:** connect a custom domain **`media.evenzi.com`** to `evenzi-public` (R2 → Settings → Public access → Custom Domain). DNS is managed in Cloudflare. The private bucket has **no** public access.
3. **S3 API token:** R2 → Manage R2 API Tokens → create a token with **Object Read & Write** on both buckets. Capture **Access Key ID** + **Secret Access Key** (shown once).
4. Note the **Account ID** and the S3 endpoint `https://<accountid>.r2.cloudflarestorage.com`.
5. (Parallel, not blocking) apply to **Cloudflare for Startups Tier 3** for the $10k credit — first-time-applicant only.

> Free tier (10 GB, zero egress) is sufficient to build and test; credits are headroom.

## 5. Environment variables

Added to `.env.local` and documented in `CLAUDE.md` env section:

```bash
R2_ACCOUNT_ID=<account id>
R2_ACCESS_KEY_ID=<s3 access key id>
R2_SECRET_ACCESS_KEY=<s3 secret>
R2_ENDPOINT=https://<accountid>.r2.cloudflarestorage.com
R2_BUCKET_PUBLIC=evenzi-public
R2_BUCKET_PRIVATE=evenzi-private
R2_PUBLIC_BASE_URL=https://media.evenzi.com
```

All secrets are **server-only** (no `NEXT_PUBLIC_` prefix). They must also be set in Vercel project env for deploys.

## 6. Components

### 6.1 `lib/storage/r2.ts` — R2 client + primitives (server-only)
Thin wrapper over `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`, configured with `region: "auto"` and the R2 endpoint.

- `getSignedUploadUrl({ bucket, key, contentType, expiresIn })` → presigned **PUT** URL, scoped to the exact key and content-type with a short TTL.
  - **Size enforcement caveat:** a presigned PUT cannot hard-cap upload size. Mitigations: (a) client-side guard before optimize/upload; (b) the client uploads an already-optimized WebP (small by construction); (c) optional post-upload `HEAD` check that deletes the object if it exceeds the cap. If strict server-enforced limits become necessary, switch that path to a **presigned POST policy** (`content-length-range`). For the MVP foundation we rely on (a)+(b) and document (c) as available.
- `getSignedDownloadUrl(key, { expiresIn })` → presigned **GET** URL for the private bucket (default TTL 3600s).
- `getPublicUrl(key)` → `${R2_PUBLIC_BASE_URL}/${key}` (public bucket only).
- `deleteObject(bucket, key)`.
- `deletePrefix(bucket, prefix)` → list + batch delete (for per-event/per-user cleanup).

Single responsibility: knows about R2/S3 only; knows nothing about features, auth, or HTTP.

### 6.2 `lib/storage/keys.ts` — key builders (isomorphic, pure)
Enforces the canonical scheme so keys are never hand-built by callers.

- `mediaKey(eventId, uuid, ext)` → `events/{eventId}/media/{uuid}.{ext}`
- `mediaThumbKey(eventId, uuid)` → `events/{eventId}/media/{uuid}_thumb.webp`
- `invitationKey(eventId, uuid)` → `events/{eventId}/invitations/{uuid}.png`
- `websitePublicKey(eventId, purpose, uuid, ext)` → `website/{eventId}/{purpose}-{uuid}.{ext}`
- `avatarKey(userId, uuid, ext)` → `users/{userId}/avatar-{uuid}.{ext}`
- `eventPrefix(eventId)` / `userPrefix(userId)` → for deletes.
- A `parseKey(key)` helper returning `{ scope, scopeId, feature }` used by the API routes for authorization.

### 6.3 `lib/storage/imageOptimize.ts` — client-side optimizer (browser-only)
Pure-ish module run in the browser before upload.

- Input: a `File`/`Blob`.
- Steps: decode (HEIC/HEIF via `heic2any` → bitmap; others via `createImageBitmap`); fix EXIF orientation; downscale longest edge to ≤4096px; encode **WebP q≈0.85** master; encode ~400px-longest-edge **WebP** thumbnail.
- Output: `{ master: Blob, thumb: Blob, width, height, originalType }`.
- Fallbacks: if WebP encode unsupported, fall back to JPEG; if decode fails (exotic format), surface a typed error so the caller can reject the file.

### 6.4 API routes (server)
All under `app/api/storage/`. Every route: (a) requires an authenticated Supabase session; (b) authorizes the `scope` — for `events/{eventId}/*` the user must own/admin that event; for `users/{userId}/*` it must be the same user; (c) validates inputs.

- **`POST /api/storage/upload-url`**
  Body: `{ feature, scopeId, contentType, ext, withThumb?: boolean }`.
  Returns: `{ masterUrl, masterKey, thumbUrl?, thumbKey?, bucket }`.
  Validates content-type against an allow-list (`image/webp`, `image/jpeg`, `image/png`, `image/avif`; `image/png` also for invitation cards), generates the UUID + key(s) server-side (client never picks keys), mints presigned PUT URL(s). Bucket selection: public-website features → public bucket; all others → private bucket.

- **`POST /api/storage/sign`**
  Body: `{ key }` (private). Returns `{ url, expiresIn }`. Authorizes the key's scope before signing. (For lists, accepts `{ keys: [] }` and returns a map — bounded to a max batch size.)

- **`DELETE /api/storage/object`**
  Body: `{ key }` or `{ prefix }`. Authorizes scope, then deletes object / prefix.

## 7. Upload flow (end-to-end)

1. User selects an image in the browser.
2. `imageOptimize()` produces `master` + `thumb` blobs.
3. Client `POST /api/storage/upload-url` (cookie-authed) → receives presigned PUT URLs + keys.
4. Client `PUT`s each blob directly to R2 at the presigned URLs.
5. Client now holds the keys. **This session stops here** — keys are returned to the caller. Persisting them (e.g. an `event_media` row) is each feature backend's job, added later.
6. Reads: public → `getPublicUrl(key)`; private → caller hits `/api/storage/sign` (after the viewer is authorized) and uses the returned signed URL.

## 8. Error handling

| Scenario | Behavior |
|---|---|
| Unauthenticated request | 401 from every route |
| Authenticated but not owner of scope | 403 |
| Disallowed content-type / bad ext | 400 with message |
| Oversized file (pre-presign guard) | 400; client also guards before optimize |
| HEIC/unknown decode failure (client) | typed error → UI rejects file with a clear message |
| WebP encode unsupported (client) | fall back to JPEG master/thumb |
| R2/network failure on PUT (client) | surfaced to UI for retry; no DB write happened, so safe to retry |
| Delete of non-existent key | treat as success (idempotent) |

## 9. Security

- All R2 credentials server-only; signing happens exclusively in API routes.
- Presigned PUT scoped to exact key + content-type, short TTL (e.g. 5 min), size-limited.
- Keys are generated server-side with UUIDs; clients cannot choose paths (prevents writing into another scope).
- Private bucket has no public access; signed GET TTL short (default 1h).
- Authorization (scope ownership) checked on **every** route — defense in depth alongside future RLS on the metadata tables.
- Public bucket privacy is obscurity-only (unguessable UUIDs) and therefore holds **only** non-sensitive public-website assets.

## 10. Testing

- **Unit (Vitest):** `keys.ts` builders + `parseKey`; content-type/allow-list + scope-authorization helpers; bucket-selection logic.
- **Integration (Vitest):** `upload-url` route returns a well-formed presigned URL and correct key/bucket for each feature; `sign` and `delete` enforce 401/403; oversize/bad-type → 400.
- **Manual (documented):** real R2 round-trip (presigned PUT → object appears → public URL / signed GET resolves) — requires live R2 creds, so it's a manual verification step in the plan, not CI.
- **Client (manual/browser):** `imageOptimize` produces a WebP under the cap from JPEG/PNG/HEIC inputs; orientation correct.

## 11. Dependencies to add
`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `heic2any` (client). (Evaluate `browser-image-compression` vs hand-rolled canvas in the plan; prefer the smallest reliable option.)

## 12. File manifest (new)
```
lib/storage/r2.ts
lib/storage/keys.ts
lib/storage/imageOptimize.ts
app/api/storage/upload-url/route.ts
app/api/storage/sign/route.ts
app/api/storage/object/route.ts
lib/storage/__tests__/keys.test.ts
lib/storage/__tests__/upload-url.test.ts   (route handler)
```
Plus: `.env.local` additions, `CLAUDE.md` env doc update, Vercel env vars.

## 13. Open items deferred (TBC, by design)
- Additional access modes beyond public/private-signed (more cases expected) — the lib is built to extend.
- WhatsApp-shared invitation cards: permanent public URL vs tokenized long-lived link — decided in the Invitations feature.
- Cloudflare Image Transformations for adaptive sizes/AVIF — after the credit.
- Video handling (Cloudflare Stream?) — separate spec.
