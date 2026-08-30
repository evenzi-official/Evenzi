# 03 — Image & Video Storage

> **Status:** Locked 2026-05-03
> **Provider:** Cloudflare R2 (object storage, S3-compatible)
> **Model:** Store-and-retrieve only. All processing happens app-side before upload.
> **Privacy:** All buckets private. Reads served via short-lived signed URLs.

---

## Why R2

- **Zero egress fees** — guests downloading 1 TB of photos costs $0. Other providers (Vercel Blob, Firebase, S3+CloudFront) charge $0.09–$0.30/GB.
- **Cheap storage** — $0.015/GB/month after 10 GB always-free.
- **S3-compatible** — use `@aws-sdk/client-s3` directly. Easy to migrate later if needed.
- **Built on Cloudflare's CDN** — auto-cached at the edge, no extra config.
- **Free tier covers MVP** — 10 GB storage + 1M class-A ops + 10M class-B ops, every month, forever.

Cost projection (image-only; videos handled separately below):

| Stage | Events | Storage | Egress | R2 cost/mo |
|---|---|---|---|---|
| MVP launch | 50 | 12.5 GB | 250 GB | **$0.04** |
| 6 months | 500 | 125 GB | 6.25 TB | **$1.73** |
| 1 year | 2000 | 500 GB | 25 TB | **$7.35** |

---

## What R2 stores

R2 is a **store-and-retrieve** layer. All transformation, validation, optimisation happens in the app before objects land in R2.

### Buckets (one per asset family)

| Bucket | Use | Private? | Avg object size | Lifecycle |
|---|---|---|---|---|
| `evenzi-avatars` | Profile photos | Private (signed) | 50–200 KB | Delete on user delete |
| `evenzi-covers` | Event cover images | Private (signed) | 200 KB–2 MB | Delete on event delete |
| `evenzi-gallery` | Event photo galleries | Private (signed) | 500 KB–5 MB | Delete on event delete; archive after N months |
| `evenzi-videos` | Event videos | Private (signed) | 5–500 MB | Delete on event delete; tiered storage after N months |
| `evenzi-invitations` | Invitation card designs | Private (signed) | 100 KB–1 MB | Delete on event delete |
| `evenzi-cms` | Landing page assets (blog images, hero media) | Public (cached at edge) | 100 KB–2 MB | Manual via Admin Module |

Naming convention for object keys:
```
<bucket>/<event_id-or-user_id>/<asset_type>/<uuid>.<ext>
```

Examples:
- `evenzi-gallery/evt_a1b2c3/photos/d4e5f6.jpg`
- `evenzi-avatars/usr_xyz789/v1.png`
- `evenzi-videos/evt_a1b2c3/ceremony/clip01.mp4`

---

## Processing model — done in code, not at edge

User's constraint: **R2 is just a bucket. All transforms happen in app code.**

### Image processing (Sharp on Node)

For each upload (in `app/api/upload/process` route or edge function):

1. Validate MIME type (whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/heic`)
2. Strip EXIF (privacy — removes GPS, device info)
3. Generate variants (in code, with [`sharp`](https://sharp.pixelplumbing.com)):
   - `original.<ext>` — the file as-uploaded after EXIF strip
   - `large.webp` — 2048px max dimension, WebP, ~80% quality
   - `medium.webp` — 1024px max dimension, WebP, ~80% quality
   - `thumb.webp` — 256px square (cover crop), ~75% quality
4. Upload all 4 variants to the appropriate bucket
5. Persist 4 R2 object keys in DB

Storage cost per photo: ~3.5× the original (4 variants), still trivially cheap.

### Video processing (FFmpeg WASM or external worker)

Phase 1 MVP — **store originals only, no transcoding**:
- Validate MIME (whitelist `video/mp4`, `video/webm`, `video/quicktime`)
- Hard cap: 500 MB per file
- Multipart upload from browser (chunked, 5–10 MB chunks) to a pre-signed multipart URL
- Store object key + metadata (duration, dimensions, codec) extracted with `ffprobe` server-side after upload completes

Phase 2 (post-MVP) — add transcoding to deliver mobile-friendly variants. Options:
- **FFmpeg in Cloudflare Worker** (5-min timeout limit; OK for short clips)
- **External transcoder service** (Mux, Bunny.net Stream — paid, deferred)
- **Self-hosted FFmpeg job runner** (cheapest at scale; complex)

Defer this decision — capture as a follow-up in Ops.

---

## Privacy & access

All events are fully private. Every read goes through a signed URL.

### Upload flow (host uploads photos)

```
Browser                 Next.js /api/upload/sign        R2
   │                         │                           │
   │ POST /api/upload/sign   │                           │
   │ { contentType, size }   │                           │
   ├────────────────────────>│                           │
   │                         │ generate pre-signed PUT   │
   │                         │ (5-min TTL)               │
   │                         ├──────────────────────────>│
   │                         │<──────────────────────────│
   │ { uploadUrl, objectKey }│                           │
   │<────────────────────────│                           │
   │                                                     │
   │ PUT uploadUrl  (raw bytes — no proxy through Next)  │
   ├────────────────────────────────────────────────────>│
   │<────────────────────────────────────────────────────│
   │ 200 OK                                              │
   │                                                     │
   │ POST /api/upload/finalize                           │
   │ { objectKey, eventId }                              │
   ├────────────────────────>│                           │
   │                         │ process variants (sharp)  │
   │                         │ upload variants           │
   │                         ├──────────────────────────>│
   │                         │ persist to DB             │
   │ 200 { mediaId }         │                           │
   │<────────────────────────│                           │
```

### Read flow (guest views photo)

```
Guest browser     Next.js /api/media/[id]/url       Auth check          R2
     │                    │                              │                │
     │ GET /api/media/...?token=<magic>                  │                │
     ├───────────────────>│                              │                │
     │                    │ validate token + RSVP rights │                │
     │                    ├─────────────────────────────>│                │
     │                    │<─────────────────────────────│                │
     │                    │ generate pre-signed GET URL  │                │
     │                    │ (10-min TTL)                 │                │
     │ 302 redirect to signed URL                        │                │
     │<───────────────────│                              │                │
     │ GET signed URL                                    │                │
     ├──────────────────────────────────────────────────────────────────>│
     │<──────────────────────────────────────────────────────────────────│
     │ 200 + bytes (cached at Cloudflare edge for 10 min)                │
```

Or simpler for `<img>` tags: API route returns the signed URL JSON, client puts it in `<img src>`.

### Signed URL TTLs

| Asset | Read TTL | Why |
|---|---|---|
| Avatar | 1 day | Cached aggressively; rarely changes |
| Cover | 1 hour | Often viewed; balance freshness/load |
| Gallery photo | 10 minutes | High-volume reads; short TTL prevents link sharing |
| Video | 1 hour | Long playback; needs longer URL window |
| Invitation | 1 day | Embedded in WhatsApp links — needs longer life |
| CMS asset | n/a (public bucket) | Marketing site assets are public |

Refresh strategy: client refetches signed URL on 403/expired before retrying the asset.

---

## Custom domain

Use a CNAME / sub-domain for R2 reads to brand the URLs and keep flexibility to swap providers.

Recommended: **`cdn.evenzi.com`**

Setup:
1. Add `evenzi.com` (or just delegate `cdn.` subdomain) to Cloudflare DNS — free.
2. Create R2 bucket with custom domain `cdn.evenzi.com` mapped to it.
3. Cloudflare auto-issues SSL.
4. All URLs in the app reference `cdn.evenzi.com/<bucket>/<key>` — no provider lock-in in URLs.

**Not used for private signed URLs** (those are short-lived and signature-bound to R2 endpoint). Custom domain is for public CMS assets only.

---

## Module boundary

New module: **`@evenzi/storage`** in `lib/storage/`.

```typescript
// lib/storage/r2-client.ts
export function r2(): S3Client { ... }

// lib/storage/upload.ts
export async function generatePresignedUpload(
  bucket: string,
  key: string,
  contentType: string,
  ttlSeconds: number = 300
): Promise<{ uploadUrl: string; objectKey: string }>;

// lib/storage/read.ts
export async function generatePresignedRead(
  bucket: string,
  key: string,
  ttlSeconds: number = 600
): Promise<string>;

// lib/storage/process.ts (image variants)
export async function processImage(
  buffer: Buffer
): Promise<{ original: Buffer; large: Buffer; medium: Buffer; thumb: Buffer }>;

// lib/storage/process-video.ts (Phase 2)
export async function probeVideo(buffer: Buffer): Promise<VideoMetadata>;

// lib/storage/delete.ts
export async function deleteObjects(bucket: string, keys: string[]): Promise<void>;
```

All feature modules import from `@evenzi/storage`. Never call the R2 SDK directly.

---

## Database schema impact

New table to track media:

```sql
create table media (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id),
  event_id uuid references events(id),
  bucket text not null,                      -- 'evenzi-gallery', etc.
  object_key text not null,                  -- 'evt_xyz/photos/abc.jpg'
  variants jsonb,                            -- {original, large, medium, thumb}
  mime_type text not null,
  size_bytes integer not null,
  width integer,
  height integer,
  duration_seconds integer,                  -- for videos
  metadata jsonb,                            -- arbitrary (album, tags, caption)
  uploaded_at timestamptz default now(),
  deleted_at timestamptz                     -- soft delete
);

create index media_event_id_idx on media(event_id);
create index media_owner_user_id_idx on media(owner_user_id);
```

RLS policies:
- Owner can do anything to their own media.
- Guests with valid RSVP for `event_id` can SELECT media for that event.
- Public CMS assets bypass RLS (separate `cms_media` table or flag).

---

## Environment variables

```
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_AVATARS=evenzi-avatars
R2_BUCKET_COVERS=evenzi-covers
R2_BUCKET_GALLERY=evenzi-gallery
R2_BUCKET_VIDEOS=evenzi-videos
R2_BUCKET_INVITATIONS=evenzi-invitations
R2_BUCKET_CMS=evenzi-cms
R2_CUSTOM_DOMAIN=cdn.evenzi.com
R2_REGION=auto
```

Add to `.env.local` (dev) and Vercel project settings (prod).

---

## Cost guardrails

Monitor and alert on:

| Metric | Threshold | Action |
|---|---|---|
| R2 storage > 8 GB (80% of free tier) | Yellow | Plan paid tier; review oldest events for archival |
| R2 storage > 50 GB | Yellow | Move pre-MVP archives to deep storage / delete |
| Class A ops (writes) > 800k/mo | Yellow | Likely a bug — uploads should not approach this |
| Egress (informational only — costs $0) | — | Track for capacity planning, not billing |
| Total R2 cost > $50/mo | Red | Architecture review — videos are likely culprit |

Where to track: Cloudflare Dashboard + monthly admin review (later, via F15 Admin Module).

---

## Setup checklist (Ops task)

1. **Create Cloudflare account** — ap171998@gmail.com (Abhijith), enable 2FA
2. **Add domain** `evenzi.com` (or delegate `cdn.` subdomain) to Cloudflare
3. **Enable R2** (no credit card required for free tier; CC needed only past 10 GB)
4. **Create 6 buckets**: avatars, covers, gallery, videos, invitations, cms
5. **Create R2 API token** — scoped to the 6 buckets, read+write
6. **Map custom domain** `cdn.evenzi.com` → CMS bucket (public)
7. **Add env vars** to local `.env.local` + Vercel project
8. **Install SDK**: `npm i @aws-sdk/client-s3 @aws-sdk/s3-request-presigner sharp`
9. **Build `lib/storage/` module** (above)
10. **Create `media` table** + RLS policies
11. **Create `/api/upload/sign`** + `/api/upload/finalize` routes
12. **Smoke test** — upload + read avatar end-to-end

ETA for setup: 4–6 hrs (Abhijith).

---

## Open questions deferred

| Question | Decide when |
|---|---|
| Image transformation later (Cloudflare Images, $5/mo)? | When mobile clients complain about download size |
| Video transcoding strategy (Worker / Mux / self-host)? | When MVP ships and analytics show video usage |
| Backup / disaster recovery? | When hitting Series A or first paid customer |
| Per-event storage quotas (subscription gates)? | Locked together with subscription decision in [04-subscription-billing.md](./04-subscription-billing.md) |
| GDPR / DPDP Act compliance for EU/India users? | Before any EU/India launch — not MVP-blocker |

---

## Related decisions

- [04 — Subscription & Billing](./04-subscription-billing.md) — defines per-tier storage quotas
- [05 — Modular Architecture](./05-modular-architecture.md) — `@evenzi/storage` module boundaries
- [06 — Scalability](./06-scalability.md) — when storage cost exits the free tier
