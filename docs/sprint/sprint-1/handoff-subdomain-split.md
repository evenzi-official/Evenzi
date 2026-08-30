# Cursor Build-Doc — Subdomain Split (3 host-routed surfaces)

**For:** Cursor (auto mode, free NVIDIA model is fine — this is mechanical + one careful middleware file).
**Owner/review:** Claude reviews each pass before merge; founder executes the DNS/env cutover.
**Branch:** create `feature/subdomain-split` from `Dev-Vibe`.
**Full design + rationale:** `docs/superpowers/specs/2026-08-30-subdomain-split-design.md` — READ §14 (folded council findings) before starting; every `Cn`/`Dn`/§ reference below points there. This doc is the actionable runbook; the spec is the authority on any ambiguity.

> This build-doc is self-contained: you do NOT have access to the conversation that produced it. Everything you need is here or in the linked spec. If something is genuinely undecided, STOP and ask — do not guess on auth/middleware behaviour.

---

## 0. What we're building (one paragraph)

Evenzi becomes three surfaces served from three subdomains, but stays **one Next.js app + one Vercel project**. `middleware.ts` reads the request `Host` header, resolves it to a surface (`marketing` = `evenzii.com`, `app` = `app.evenzii.com`, `admin` = `admin.evenzii.com`), and internally rewrites the path to a surface folder (`app/marketing/*`, `app/app/*`, `app/admin/*`) so the external URL stays clean. `api/` and `/e/[slug]` are shared/global. Admin is a gated placeholder this session (real admin panel + RBAC come later). No schema changes.

---

## 1. Ground rules (do not violate)

- Next.js 14 App Router, TypeScript strict (no `any`), Tailwind. Imports via `@/` alias.
- **Supabase SSR rule:** never insert logic between `createServerClient()` and `supabase.auth.getUser()` in the middleware. Host resolution + rewrite happen either before client creation or after `getUser()`.
- **No `vercel.json`, no `next.config` rewrites.** Routing is middleware-only. (§14.3)
- `ADMIN_USER_IDS` is **server-only** — never prefix `NEXT_PUBLIC_`. (§14.3)
- Use `git mv` for all moves (preserve history).
- Ship the work in **two passes** with a green build between them (below). Do not bundle them.

---

## 2. PASS 1 — structural move (must end green, no host routing yet)

Goal: get the folders and layouts into their new shape while the app still behaves exactly as today, so any breakage is a move/layout bug, not a routing bug.

### 2.1 Layout split
- Slim `app/layout.tsx` to the **document shell only**: `<html lang>`/`<body>`, the `next/font` variables, `import "./globals.css"`, and generic/neutral `metadata`. **Remove** from the root layout: `BusyProvider`, `HelpFabMount`, `ServiceWorkerRegister`, `Preloader`, `RevealObserver`, and the app-specific `metadataBase`. The root layout is the ONLY layout with `<html>`/`<body>`.
- Create three **nested, non-`<html>`** layouts (no `<html>`/`<body>` tags in these):
  - `app/app/layout.tsx` — moves ALL the app chrome removed above (BusyProvider, HelpFabMount, ServiceWorkerRegister, Preloader, RevealObserver) + `metadataBase: new URL(getAppBaseUrl())`.
  - `app/marketing/layout.tsx` — only what the landing needs; **no** app service worker, **no** Help FAB; `metadataBase` from `getMarketingBaseUrl()` (added in Pass 2 — for Pass 1 use `getAppBaseUrl()` as a placeholder and TODO it).
  - `app/admin/layout.tsx` — minimal; `robots: { index: false, follow: false }`.

### 2.2 Moves (`git mv`)
- Into `app/app/`: `home/`, `events/`, `settings/`, `auth/`, `help/`.
- Into `app/marketing/`: current `app/page.tsx` → `app/marketing/page.tsx`; `legal/` → `app/marketing/legal/`.
- Create `app/app/page.tsx` = thin server redirect to `/home` (fallback; the real signed-in/out decision lands in middleware in Pass 2).
- Add `app/app/not-found.tsx`, `app/marketing/not-found.tsx`, `app/admin/not-found.tsx` (surface-appropriate chrome). Keep the root `app/not-found.tsx` too.
- Add `app/admin/page.tsx` = static placeholder ("Admin — coming soon"). (Gate wired in Pass 2.)

### 2.3 Stay put (do NOT move)
`app/api/`, `app/e/`, `app/layout.tsx`, `app/globals.css`, `app/manifest.ts`, `app/not-found.tsx`, all icon/favicon assets.

### 2.4 Delete (in-tree cleanup, §4.1)
`git rm -r` these confirmed-unused test/dev pages: `app/website-theme-framer/`, `app/wedding-invitation-temp-1/`, `app/dev/`, `app/api/dev/`. (If `tsc` reveals any real import of these from a product route — it won't — STOP and report instead of deleting.)

### 2.5 Fix moved-import specifiers
- Run: `grep -rn "@/app/\(home\|events\|settings\|auth\|help\|legal\|page\)" app lib components` and fix each hit to its new `@/app/app/...` / `@/app/marketing/...` path. (`@/` imports of `lib`, `components`, etc. do NOT change — only specifiers that pointed *into* the moved folders.)
- Watch for: co-located `_components`, server actions, and any test importing a page/layout by path.

### 2.6 Middleware in Pass 1 = pass-through
Leave `middleware.ts` / `lib/supabase/middleware.ts` **functionally unchanged** (existing auth/session/route-protection behaviour). No host routing yet. If a move changed a public-path string, update it minimally so current behaviour is preserved.

### 2.7 PASS 1 ACCEPTANCE GATE (all must pass before review)
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run test:run` green (same pass count as `Dev-Vibe` baseline; the one known pre-existing failure in `__tests__/api/events/route.test.ts` may remain — note it, don't "fix" by deleting).
- [ ] `npm run build` succeeds.
- [ ] `npm run dev` — app still works at `localhost:3000` exactly as before (home, events, settings, auth, help, legal, `/e/<slug>` all reachable).
- [ ] No nested `<html>` (only the root layout has it).
- **STOP here. Hand back to Claude for Pass 1 review.**

---

## 3. PASS 2 — host routing + admin gate (the delicate half)

Only start after Claude approves Pass 1.

### 3.1 URL helpers — `lib/url.ts`
Add alongside the existing `getAppBaseUrl()`:
```ts
export function getMarketingBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_MARKETING_URL) return process.env.NEXT_PUBLIC_MARKETING_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // known-wrong for cross-surface on preview; do not rely on outside localhost
  return 'http://localhost:3000'
}
export function getAdminBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_ADMIN_URL) return process.env.NEXT_PUBLIC_ADMIN_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://admin.localhost:3000'
}
```
Point `app/marketing/layout.tsx` `metadataBase` at `getMarketingBaseUrl()`; `app/admin/layout.tsx` at `getAdminBaseUrl()`. Wire marketing "Get started"/"Sign in" links to `` `${getAppBaseUrl()}/auth` ``.

### 3.2 Host → surface resolution (C2, SE3)
Create a helper (e.g. `lib/surface.ts`) resolving surface from the **platform `host` header** (`req.headers.get('host')`) — **ignore `x-forwarded-host`**. Use an **exact-host allowlist**, never `startsWith`/`includes`:
```
app.evenzii.com                      -> 'app'
evenzii.com | www.evenzii.com        -> 'marketing'
admin.evenzii.com                    -> 'admin'
*.localhost / localhost              -> map by the same subdomain rules (app.localhost->app, admin.localhost->admin, bare localhost->marketing... see NOTE)
any unrecognized host                -> 'marketing'   // least privilege, NEVER app/admin
```
NOTE on local dev: `app.localhost:3000` → app, `admin.localhost:3000` → admin, `localhost:3000` and `marketing.localhost:3000` → marketing.

Preview override (C4) — **only when `process.env.VERCEL_ENV !== 'production'`**: also honor `?surface=app|admin|marketing` and an `x-evenzi-surface` header. Hard-ignored in production. Surface selection alone must NEVER grant admin — the admin allowlist (3.4) still runs.

### 3.3 The rewrite (C1, C5, C6, §14.3)
In `middleware.ts`, after resolving surface and running the existing Supabase `getUser()`:
- **Shared pass-through (no rewrite):** `/api/*`, `/_next/*`, static/file-extension assets, and `/e/*` **only on the app host** (see 3.6).
- **Prefix-rejection:** decode + normalize the pathname first (guard `/%2fadmin`, `//admin`, `/./admin`); if it already starts with another surface's prefix (`/app`, `/marketing`, `/admin`) → 404.
- **Rewrite:** set the internal path to `/{surface}${pathname}` and apply it via **`x-middleware-rewrite`** (or copy `supabaseResponse.cookies` onto the rewrite response) so the Supabase-refreshed `Set-Cookie` survives. Do NOT return a fresh `NextResponse.rewrite()` that discards those cookies.
- **App-host root (C1):** on the app host, `/` → redirect to `/home` (signed in) or `/auth` (signed out), decided in middleware. `app/app/page.tsx` remains a fallback redirect.
- **Cookies (C6):** keep `@supabase/ssr` default cookie scoping — do NOT set `Domain=.evenzii.com`. (Assert/comment this.)

### 3.4 Surface-scoped auth (C3)
- `marketing`: fully public, no auth.
- `app`: existing behaviour — public: `/auth`, `/auth/*`; everything else → redirect to `/auth` if no user; preserve the host-only `/events` role guard (non-host role blocked).
- `admin`: parse `ADMIN_USER_IDS` into a trimmed, lowercased, non-empty `Set<string>`. Gate: `if (surface==='admin' && (!user || !adminSet.has(user.id.toLowerCase())))` → redirect to admin sign-in / 403. **Empty or missing env ⇒ deny everyone** (fail closed). The `user` must come from a real `getUser()`, not a raw cookie read. Leave a `// TODO(admin-rbac): replace env allowlist with role_slug='admin' + RLS (next session)` marker.

### 3.5 Matcher (§6.3)
Update `config.matcher` to run on surface pages (and `/e/*` where host handling is needed) but exclude `/api`, `/_next/static`, `/_next/image`, and file-extension assets. Add a code comment: **API routes are host-agnostic and self-gate; future admin APIs must re-check `ADMIN_USER_IDS`/RBAC in-handler and never trust the Host header.**

### 3.6 `/e/[slug]` canonical host (§6.4)
Serve `/e/[slug]` only on the **app host**; 404 it on marketing and admin. Enforce the canonical absolute URL in the route's `generateMetadata` (`getAppBaseUrl()`), not via the rewrite.

### 3.7 Per-surface security headers (§14.3)
Set response headers per resolved surface (in middleware): admin gets a stricter CSP + `frame-ancestors 'none'` + `X-Frame-Options: DENY`; marketing/app get their appropriate posture. Don't let one shared config default admin down to marketing's laxer headers.

### 3.8 Manifest/PWA (§14.4, cheap)
Drop `<link rel="manifest">` (and app-branded icons) from the marketing and admin layouts so those surfaces aren't installable as the app PWA.

### 3.9 sys-check env assertion (§14.3)
Extend `scripts/run-sys-check.ts` to fail if any of `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL`, `NEXT_PUBLIC_ADMIN_URL`, `ADMIN_USER_IDS` is unset (in a non-local env).

### 3.10 Tombstone service worker (D3, deploy-time asset)
Add a `public/`-served self-unregistering `sw.js` plan for the apex (owned by marketing): `self.registration.unregister()` + `caches.delete(...)`. (Actual `Clear-Site-Data` header + first-deploy wiring is in the founder runbook, §4 — but ship the tombstone script now.)

### 3.11 Tests (§11, §14 "required test" cases)
Add middleware/host unit tests covering:
- [ ] host→surface: each exact host resolves correctly; unknown host → marketing.
- [ ] spoofed `x-forwarded-host` does NOT change the resolved surface.
- [ ] cross-surface prefix (`/admin` on app host, encoded variants) → 404.
- [ ] admin gate: allowlisted user → allowed; non-allowlisted → 403; **empty `ADMIN_USER_IDS` → 403 (deny all)**.
- [ ] preview override honored when `VERCEL_ENV!=='production'`, **ignored** in production.
- [ ] `Set-Cookie` from a Supabase refresh survives a rewritten request.
- [ ] app-host `/` redirects to `/home` (signed in) / `/auth` (signed out).

### 3.12 `.env.local` (local dev)
```
NEXT_PUBLIC_APP_URL=http://app.localhost:3000
NEXT_PUBLIC_MARKETING_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000
ADMIN_USER_IDS=<abhijith-uuid>,<dheeraj-uuid>
```

### 3.13 PASS 2 ACCEPTANCE GATE
- [ ] `tsc --noEmit` clean, `npm run test:run` green (incl. all 3.11 tests), `npm run build` succeeds.
- [ ] Local host-header/`*.localhost` smoke: `app.localhost:3000` serves the app; `localhost:3000` serves the landing; `admin.localhost:3000` non-allowlisted → 403, allowlisted → placeholder; `app.localhost:3000/admin` → 404; `app.localhost:3000/e/<slug>` works, `localhost:3000/e/<slug>` → 404.
- **STOP. Hand back to Claude for Pass 2 review (council code checkpoint — middleware + auth touched).**

---

## 4. Founder cutover runbook (NOT Cursor — Abhijith executes after Claude merges to Dev-Vibe)

Ordered to avoid a marketing outage (D1) — apex is the only cross-project move:
1. Merge `feature/subdomain-split` → `Dev-Vibe`; confirm a **green production build** on Vercel project `evenzi` with all four env vars set in **Production AND Preview** (values below).
2. On `evenzi`, add domains **`www.evenzii.com` + `admin.evenzii.com` first** (no conflict — coming-soon only holds the apex). Let SSL issue (can take minutes).
3. Verify all three surfaces on the preview/`www` using the `?surface=` override + a `Host:`-header curl matrix.
4. **Only then**: remove `evenzii.com` from project `evenzi-coming-soon` and immediately add it to `evenzi`. Apex = A record `76.76.21.21`; `www` = CNAME; pick a canonical (recommend apex→`www` or `www`→apex) and 308 the other. Don't promote until the padlock is live on all three hosts.
5. **Rollback lever (D2):** if any host errors, Vercel → Deployments → previous prod build → Promote (instant). Keep `evenzi-coming-soon` **paused, not deleted, 48h**.
6. **Stale SW (D3):** before cutover check the live apex (DevTools → Application → Service Workers) for a coming-soon `sw.js`; if present, the tombstone `sw.js` + `Clear-Site-Data: "cache","storage"` (apex only, **never `"cookies"`**) on the first apex deploy clears it.
7. **Webhook (§14.3):** after the app host is verified, `curl -X POST https://app.evenzii.com/api/notifications/dispatch-push` (expect auth-reject = alive), THEN repoint the Supabase trigger URL from `evenzi.vercel.app` → `app.evenzii.com`. Keep the old URL valid 24h.

**Production env values:**
| Var | Production | Preview | Dev |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://app.evenzii.com` | preview app alias or override | `http://app.localhost:3000` |
| `NEXT_PUBLIC_MARKETING_URL` | `https://evenzii.com` | preview URL | `http://localhost:3000` |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.evenzii.com` | preview admin alias or override | `http://admin.localhost:3000` |
| `ADMIN_USER_IDS` (server-only) | `<uuid>,<uuid>` | same | local uuids |

---

## 5. Prerequisite (separate, before this build)
The git/infra cleanup pass (delete `e2e-truth-audit` fixture + Account B test user, prune merged branches/worktrees — `docs/NEXT-SESSION.md`) is a **separate** commit done before the move, to give a clean base. Not part of this build-doc. Coordinate with Claude/founder.

---

## 6. Definition of done
- [ ] Pass 1 merged after Claude review; Pass 2 merged after Claude council-code review.
- [ ] All acceptance gates (2.7, 3.13) green.
- [ ] All 3.11 tests present and passing.
- [ ] No `vercel.json` / `next.config` rewrites added.
- [ ] `ADMIN_USER_IDS` server-only; admin gate fails closed.
- [ ] Founder runbook (§4) handed over; DNS/env cutover is founder's to execute.
- [ ] Spec `docs/superpowers/specs/2026-08-30-subdomain-split-design.md` §14 satisfied.
