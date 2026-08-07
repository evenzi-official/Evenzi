# Prod-risk pass — evenzi.vercel.app / domains

| | |
|---|---|
| **Date** | 2026-08-07 |
| **App host** | `https://evenzi.vercel.app` |
| **Custom domain** | `https://www.evenzii.com` / `evenzii.com` |
| **Status** | Mostly complete — OS toast still needs founder click |

## Checklist

| ID | Item | Result | Evidence |
|----|------|--------|----------|
| **PR-1** | Browser push OS toast + `push_dispatch_log` + webhook HMAC | **FIXED (live)** | Trigger was firing but sent raw secret as signature while route required body HMAC → all **401**. Replaced with `public.dispatch_notification_push()` that HMAC-signs body. Verify: insert `c16e5056-…` → `net._http_response` **200** `{"ok":true}` + `push_dispatch_log` row. Code also accepts shared-secret header (for deploy) + vitest. |
| **PR-2** | `main` / evenzii.com vs Testing deploy gap | **PASS — intentional** | Vercel project `evenzi` production = `Dev-Vibe-Testing` @ `61cbb204` (same tree as `Dev-Vibe`). GitHub `main` is **343 commits behind** Dev-Vibe (git hygiene only — **not** what `evenzi.vercel.app` serves). **`www.evenzii.com` / `evenzii.com` → marketing** (`evenzi-coming-soon`). **App UAT = `evenzi.vercel.app`**. **Post cutover:** app → `app.evenzii.com`; marketing stays on `evenzii.com`. `/sw.js` 404 on marketing host is expected. |
| **PR-3** | R2 signed URLs / CORS from deployed origin | **Partial** | Unauth `POST …/media/upload-url` → **401** (expected). Full signed upload/read from prod origin needs logged-in host session — **not run** this pass. |
| **PR-4** | Resend invite email | **N/A (deferred)** | Keys deferred by policy. |
| **PR-5** | SW caching / `/sw.js` | **PASS** (app host) | `evenzi.vercel.app/sw.js` → **200**, `application/javascript`, `cache-control: public, max-age=0, must-revalidate`, `x-vercel-cache: HIT`, push SW body present. Coming-soon domain correctly has no app SW. |
| **PR-6** | Collab invite notify on deployed app | **PASS in-app / FAIL browser push** | Recent `notifications` rows (`collab_invite_received`, `collaborator_added`) from today’s E2E. In-app bell path live. Browser push blocked by PR-1 (zero dispatches). |

## Host map (locked — founder 2026-08-07)

| Hostname | Role now | Role after cutover |
|----------|----------|--------------------|
| `evenzi.vercel.app` | **App Dev/UAT** (project `evenzi`) | Still usable; primary app URL becomes `app.evenzii.com` |
| `www.evenzii.com` / `evenzii.com` | **Marketing** (`evenzi-coming-soon`) | Stays marketing |
| `app.evenzii.com` | Not connected yet | **App production** — wire when Dev/UAT on vercel.app is done |

Do **not** treat marketing-host missing `/sw.js` / API routes as app bugs.

## Recommended follow-ups (ops, not code)

1. ~~**Fix push webhook (PR-1)**~~ — **done 2026-08-07**: HMAC-signing trigger `dispatch_notification_push` + route accepts shared-secret or body HMAC (uncommitted until end-of-session). After cutover, update trigger URL to `https://app.evenzii.com/api/notifications/dispatch-push` if needed.
2. **Optional:** founder confirms OS toast on device that subscribed (Apple push endpoints exist for user `d09f7310-…`).
3. **Cutover (later):** alias `app.evenzii.com` → project `evenzi` production; leave `evenzii.com` on coming-soon/marketing.
4. **Git hygiene:** merge/promote `Dev-Vibe` → `main` when you want GitHub `main` to match production intent (Vercel already tracks Testing).
5. **PR-3:** one logged-in media upload on `evenzi.vercel.app` when convenient.
6. **Hardening:** move webhook secret out of function source into Vault / config table (secret currently in trigger function body — was already present as static header before).

## Out of scope this pass

- Logging into founder browser for OS toast
- Changing DNS / domain aliases
- Installing Resend keys
