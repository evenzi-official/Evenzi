# Cloudflare R2 Storage — Usage & Implementation Guide

> **Audience:** Dheeraj (frontend) + anyone wiring file uploads (photos, videos, invitation cards, avatars) into an Evenzi feature.
> **Status (2026-06-13):** Foundation built + verified end-to-end. Private (signed-URL) path fully working. See §3.
> **Design spec:** [`docs/superpowers/specs/2026-06-13-cloudflare-r2-storage-design.md`](superpowers/specs/2026-06-13-cloudflare-r2-storage-design.md)
> **Cost analysis:** [`docs/media/media-storage-platform-analysis.md`](media/media-storage-platform-analysis.md) — why R2/Cloudflare vs Bunny/ImageKit/Cloudinary/Mux for the photo+video album workload (+ an interactive cost forecaster).

---

## 1. TL;DR

We store all binary files (images, later video/PDFs) in **Cloudflare R2** (S3-compatible, **zero egress fees**), not in Supabase. Supabase only stores the **metadata + the R2 object key**.

The flow:
1. **Browser optimizes the image** (resize → WebP, + a thumbnail) — so we only ever upload/store an optimized file.
2. Browser asks our server for a **presigned upload URL** (auth-checked).
3. Browser **uploads the file directly to R2** (bypasses Vercel's ~4.5 MB body limit, uses no server bandwidth).
4. Server hands back the **object key**, which your feature saves in its Supabase table.
5. To display: **public** assets use a permanent URL; **private** assets use a short-lived **signed URL** minted server-side after auth.

You almost never call R2 directly — you use the helpers in `lib/storage/` + the storage API routes.

---

## 2. Architecture

```
Browser                         Next.js (server)                  Cloudflare R2
  │                                   │                                │
  │  optimizeImage(file)              │                                │
  │  → master(webp) + thumb(webp)     │                                │
  │                                   │                                │
  │  POST /api/storage/upload-url ───▶│  verify session + ownership    │
  │                                   │  generate key, presign PUT     │
  │  ◀──── { url, key } ──────────────│                                │
  │                                   │                                │
  │  PUT file ───────────────────────┼───────────────────────────────▶│ (object stored)
  │                                   │                                │
  │  save key to Supabase (feature)   │                                │
  │                                   │                                │
  │  read: public → media.evenzi.com/<key>                            │
  │        private → POST /api/storage/sign → signed GET URL ─────────▶│
```

**Two buckets:**
- `evenzi-public` — only truly public assets (public event-website landing images). Served by a permanent custom domain (`media.evenzi.com`).
- `evenzi-private` — **everything else** (media gallery, invitation cards, avatars, drafts). No public access; reads go through short-lived **signed URLs** minted only after the user is authorized.

---

## 3. What works today (and what doesn't)

| Capability | Status |
|---|---|
| Buckets `evenzi-public` / `evenzi-private` | ✅ created |
| Credentials in `.env.local` | ✅ |
| `lib/storage/{r2,keys,imageOptimize}` | ✅ built + typechecked |
| Client image optimize (WebP master + thumb, HEIC support, keep-smaller guard) | ✅ |
| **Private path** (presigned upload → store → signed GET) | ✅ verified server-side **and** in-browser |
| CORS on `evenzi-private` | ✅ |
| **Public path** display via `media.evenzi.com` | ⛔ blocked — `evenzi.com` is parked at Afternic, DNS not on Cloudflare. Use the **r2.dev** dev URL for now, or move the domain to Cloudflare for production. |
| **Production** `/api/storage/*` routes (auth + scope ownership) | ⛔ not built yet — only **dev spike** routes exist (`/api/dev/r2/*`, no auth, dev-only). |
| Supabase tables that store keys | ⛔ not built — comes with the data-model work (SP-A). |

**Try it:** dev server on `:3000`, open **http://localhost:3000/dev/r2-test** (dev-only page, no login needed in dev) → pick a photo → Private → Optimize + upload.

---

## 4. Environment variables (`.env.local`, server-only — never `NEXT_PUBLIC_`)

```bash
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_PUBLIC=evenzi-public
R2_BUCKET_PRIVATE=evenzi-private
R2_PUBLIC_BASE_URL=https://media.evenzi.com   # or the pub-xxxx.r2.dev URL while the domain is parked
```
Also set these in the **Vercel** project env for deploys. The S3 keys come from R2 → *Manage R2 API Tokens* → **Object Read & Write**.

---

## 5. The storage library — `lib/storage/`

### `r2.ts` (server-only — never import in a client component)
| Function | Use |
|---|---|
| `getSignedUploadUrl({ bucket, key, contentType, expiresIn? })` | presigned **PUT** URL (default TTL 5 min) |
| `getSignedDownloadUrl(key, { bucket?, expiresIn? })` | signed **GET** URL for a private object (default 1 h) |
| `getPublicUrl(key)` | permanent URL on the public domain |
| `deleteObject(bucket, key)` | delete one object |
| `deletePrefix(bucket, prefix)` | delete everything under a prefix (e.g. a whole event) |
| `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE` | bucket-name constants |

### `keys.ts` (pure, import anywhere)
Builds keys in the canonical scheme `{scope}/{scopeId}/{feature}/{uuid}.{ext}`. **Always use these — never hand-build a key, and never accept a key from the client for writes.**
`mediaKey(eventId, uuid, ext)`, `mediaThumbKey(eventId, uuid)`, `invitationKey(eventId, uuid)`, `websitePublicKey(eventId, purpose, uuid, ext)`, `avatarKey(userId, uuid, ext)`, `eventPrefix(eventId)`, `userPrefix(userId)`, `parseKey(key)`.

### `imageOptimize.ts` (browser-only)
```ts
const opt = await optimizeImage(file) // File | Blob
// → { master, masterType, masterExt, thumb, thumbType, thumbExt, width, height, reencoded }
```
- Decodes (incl. **HEIC/HEIF** via `heic2any`), fixes orientation, downscales to ≤4096 px, encodes **WebP q0.85** master + a ~400 px WebP **thumbnail**.
- **Keep-smaller guard:** if the original is smaller in bytes and within the cap, it keeps the original bytes/type (`reencoded: false`) so graphics/screenshots never bloat. Always upload `opt.master` with `opt.masterType`.

---

## 6. Uploading from a feature (client) — the pattern

```ts
import { optimizeImage } from '@/lib/storage/imageOptimize'

// NOTE: uses the PRODUCTION route /api/storage/upload-url (§8) — not yet built.
// Today the dev page uses /api/dev/r2/upload-url instead.
export async function uploadEventPhoto(file: File, eventId: string) {
  // 1. optimize in the browser
  const opt = await optimizeImage(file)

  // 2. ask server for presigned PUT URLs (server verifies you own eventId)
  const res = await fetch('/api/storage/upload-url', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      feature: 'media',
      scopeId: eventId,
      contentType: opt.masterType,
      ext: opt.masterExt,
      withThumb: true,
    }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  const { masterUrl, masterKey, thumbUrl, thumbKey } = await res.json()

  // 3. PUT directly to R2
  await fetch(masterUrl, { method: 'PUT', headers: { 'content-type': opt.masterType }, body: opt.master })
  if (thumbUrl) {
    await fetch(thumbUrl, { method: 'PUT', headers: { 'content-type': opt.thumbType }, body: opt.thumb })
  }

  // 4. persist the keys in your feature's Supabase table (NOT the URL)
  //    e.g. insert into media_assets { event_id, master_key: masterKey, thumb_key: thumbKey }
  return { masterKey, thumbKey }
}
```

**Why store the key, not the URL?** Public URLs change if the domain changes, and signed URLs expire. Store the stable `key`; derive the URL at read time.

---

## 7. Reading images back

**Public asset** (server component or client):
```ts
import { getPublicUrl } from '@/lib/storage/r2'   // server
const url = getPublicUrl(key)                      // https://media.evenzi.com/<key>
```

**Private asset** — mint a signed URL after authorizing the viewer:
```ts
// server component:
import { getSignedDownloadUrl } from '@/lib/storage/r2'
const url = await getSignedDownloadUrl(key)        // valid ~1h

// or from the client, via the API route:
const { url } = await (await fetch('/api/storage/sign', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ key }),
})).json()
```
For a gallery, batch the signing (one request, many keys) rather than one request per image.

---

## 8. The API routes

**Production routes (to build — spec §6.4):** `app/api/storage/`
- `POST /api/storage/upload-url` — **requires auth**; verifies the user owns the `scope` (e.g. the `eventId`); generates the key server-side; returns presigned PUT URL(s) + key(s); picks public vs private bucket by feature.
- `POST /api/storage/sign` — mints a signed GET URL after authorizing the key's scope.
- `DELETE /api/storage/object` — deletes an object/prefix after auth.

Skeleton (mirror `app/api/events/route.ts` for the auth pattern):
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
// authorize scope: e.g. confirm user owns events.id === scopeId before signing/writing
```

**Dev spike routes (exist now, temporary):** `app/api/dev/r2/{upload-url,sign}` — **no auth, 404 in production.** They power the `/dev/r2-test` page only. **Do not use them in real features** — replace with the production routes above.

---

## 9. Key/path convention

```
PUBLIC bucket (media.evenzi.com)
  website/{eventId}/{purpose}-{uuid}.webp     # hero / cover / og — public landing only

PRIVATE bucket (signed URLs)
  events/{eventId}/media/{uuid}.webp          # gallery master
  events/{eventId}/media/{uuid}_thumb.webp    # gallery thumbnail
  events/{eventId}/invitations/{uuid}.png     # card export
  events/{eventId}/receipts/{uuid}.{ext}      # expense receipts (Planning module) — PRIVATE only
  users/{userId}/avatar-{uuid}.webp
```
Deleting an event = `deletePrefix(R2_BUCKET_PRIVATE, eventPrefix(eventId))`. UUIDs make keys unguessable. **Per-feature key namespaces + which bucket each lives in get finalized together with the Supabase data model (SP-A).**

**Expense receipts (Planning module).** `public.event_expenses.receipt_key` stores the **R2 object key** under `events/{eventId}/receipts/…` — **never a public URL**. The object lives in the **private** bucket (`evenzi-private`) and is **never** served from the public domain. To display a receipt, mint a **short-lived signed URL** server-side via `/api/storage/sign` (§7/§8) — and that route must **first check the caller's access to the receipt's event** before signing (same owner/event-access check used for upload). Because receipts share the `events/{eventId}/…` prefix, the event-level `deletePrefix(...)` already purges them on event delete; the account-deletion purge (below) must also cover them via the event prefixes.

---

## 10. Cloudflare dashboard setup (one-time, already done for the two buckets)

1. **Enable R2** (requires a card on file, free tier 10 GB).
2. **Create buckets** `evenzi-public`, `evenzi-private`.
3. **API token:** R2 → Manage R2 API Tokens → **Object Read & Write** on both → copy Access Key + Secret.
4. **CORS** on each bucket (R2 → bucket → Settings → CORS Policy) — required for browser uploads:
   ```json
   [ { "AllowedOrigins": ["http://localhost:3000"], "AllowedMethods": ["GET","PUT"], "AllowedHeaders": ["*"], "MaxAgeSeconds": 3600 } ]
   ```
   Add your deployed origin (Vercel URL / prod domain) alongside `localhost` for staging/prod.
5. **Public domain** (public bucket only): Settings → Public access → Custom Domains → `media.evenzi.com`. **Requires `evenzi.com` to be a Cloudflare zone** (currently it's parked at Afternic — see §3). For testing without it, enable the bucket's **Public Development URL** (`pub-xxxx.r2.dev`) and set `R2_PUBLIC_BASE_URL` to that.

---

## 11. Gotchas & rules

- **Vercel serverless body limit ~4.5 MB** → that's why uploads go *direct to R2* via presigned PUT, never through an API route body.
- **CORS is per-bucket** and required for browser PUT/GET. Safari reports CORS failures as the vague *"Load failed"*.
- **A presigned PUT can't hard-cap file size.** Mitigations: client guards before upload + we only upload an already-optimized file. For strict server limits, switch to a presigned POST policy (`content-length-range`).
- **Keep-smaller**: for graphics/screenshots, WebP can be *larger* than the source — `optimizeImage` already keeps the smaller one. Real camera photos shrink a lot.
- **HEIC** (iPhone) needs `heic2any` (already wired); it's a heavier conversion, runs client-side.
- **Videos** are *not* optimized client-side — upload as-is (later: Cloudflare Stream). This guide's optimize is images-only.
- **Never** import `lib/storage/r2.ts` into a client component (it holds secrets). Client uses `imageOptimize.ts` + fetch to the API routes only.
- **Never** let the client choose the object key — the server generates it (prevents writing into another user's scope).
- **Account deletion must purge expense receipts.** `delete_user_account`'s storage-purge step deletes each of the user's event prefixes — `deletePrefix(R2_BUCKET_PRIVATE, eventPrefix(eventId))` — which covers `events/{eventId}/receipts/…` along with media and invitations. Receipts are rows pointing at private objects; deleting the `event_expenses` rows (via cascade) does **not** delete the R2 objects, so the prefix purge is required.
- **Rotate the R2 token** if its secret ever leaks (delete + recreate, update `.env.local` + Vercel).

---

## 12. Not done yet / next steps

1. **Production `/api/storage/*` routes** (auth + scope ownership) to replace the dev spike routes.
2. **Supabase tables** that store keys (`media_assets`, `invitation_cards`, `website_assets`, avatar on profile) + RLS — part of the data-model work (**SP-A**), where the **partitioning** (key namespaces, public/private per type, cascade cleanup) is finalized.
3. **Public domain**: move `evenzi.com` to Cloudflare (or keep using `r2.dev` for dev) so `media.evenzi.com` serves public assets.
4. **First feature wiring**: Media & Memories is the natural first consumer.
5. Optional later: **Cloudflare Image Transformations** for adaptive sizes/AVIF on delivery (5k/mo free).

---

## 13. References
- Design spec: `docs/superpowers/specs/2026-06-13-cloudflare-r2-storage-design.md`
- Cost/credits: `docs/startup-credits-2026.md`
- Code: `lib/storage/*`, `app/api/dev/r2/*`, `app/dev/r2-test/page.tsx`
- Auth pattern to copy: `app/api/events/route.ts`
