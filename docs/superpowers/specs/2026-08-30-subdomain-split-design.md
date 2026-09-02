# Subdomain Split — Three Surfaces in One Next.js App (Design Spec)

**Date:** 2026-08-30
**Author:** Abhijith (via Claude)
**Status:** Draft → council review → handoff to Cursor
**Related:** memory `project_domain_strategy.md`; `docs/testing/audit-2026-08-07/prod-risk.md`; `docs/ops/2026-08-07-v0-readiness-update-brief.md`

---

## 1. Goal

Split the Evenzi platform into three clearly separated surfaces, each served from its own subdomain, while keeping **one Next.js app and one Vercel project**:

| Surface | Subdomain | What it is |
| --- | --- | --- |
| **Marketing** | `evenzii.com` (+ `www.evenzii.com`) | Public landing / marketing site (the main site). |
| **App** | `app.evenzii.com` | The product — everything a signed-in host uses. |
| **Admin** | `admin.evenzii.com` | Internal admin panel (built in a **later** session; this session only reserves and secures the subdomain behind an interim gate). |

This is a **permanent two-plus-one site structure**, not a temporary cutover: root domain is the marketing site, `app.` is the product, `admin.` is internal tooling.

### Non-goals (explicitly out of scope this session)

- No admin panel functionality — `admin.evenzii.com` serves a gated placeholder shell only.
- No role-based access control (RBAC) design or `role_slug='admin'` schema change — that is designed in the dedicated admin-panel session that follows this one.
- No database/schema changes at all.
- No cross-subdomain single-sign-on (shared cookie domain). App and admin sessions stay independent per host (this is the more secure default; SSO can be added later if ever needed).
- No monorepo / multi-project split (evaluated and rejected — see §3).
- **`designs/` is not a deployed surface.** The `designs/` folder (static HTML/CSS/JS prototypes) stays the standalone internal workshop served by `npm run design` (live-server :4000). It is never a host-routed surface, never a route in the Next app, and is untouched by the folder moves. (Founder decision, 2026-08-30.)

---

## 2. Background & constraints

- The current repo (`evenzi`, Vercel project `evenzi`, `prj_dXWmfgGtBOJDsBO18BOmcNxfwwoX`) already contains **both** the marketing landing page (`app/page.tsx` + `components/landing/*`) **and** the entire product app, all under the single Next.js `app/` routing directory.
- `evenzii.com` currently aliases to a **separate** Vercel project `evenzi-coming-soon` (placeholder). Cutover retires that alias and points `evenzii.com` at this project's marketing surface.
- The app is currently served for UAT at `evenzi.vercel.app`; that URL stays usable, with `app.evenzii.com` becoming the primary app host.
- `lib/url.ts` `getAppBaseUrl()` is already environment-driven (`NEXT_PUBLIC_APP_URL` → `VERCEL_URL` → localhost), so absolute-URL generation needs extension, not rework.
- **Framework constraint:** `app/` is Next.js's reserved routing root. Three routable sibling folders at the *repo* root would require three separate Next.js apps (a monorepo). To keep one app and one Vercel project, the three surface folders live **inside** the routing dir: `app/app/`, `app/marketing/`, `app/admin/`.

---

## 3. Approach: host-aware rewrites in one Next.js app (R1)

### 3.1 Chosen approach

One Next.js app, one Vercel project. All three subdomains are aliased to this project. `middleware.ts` inspects the `Host` header and **internally rewrites** the request path to the correct surface folder. The external URL the visitor sees stays clean (no `/app`, `/marketing`, `/admin` prefix leaks into the address bar).

```
Visitor URL                       Internal rewrite         Served from
app.evenzii.com/home        →     /app/home          →     app/app/home/page.tsx
app.evenzii.com/events/123  →     /app/events/123    →     app/app/events/[id]/page.tsx
evenzii.com/                →     /marketing         →     app/marketing/page.tsx
evenzii.com/legal/terms     →     /marketing/legal/… →     app/marketing/legal/terms/page.tsx
admin.evenzii.com/          →     /admin             →     app/admin/page.tsx
<any host>/api/…            →     (no rewrite)       →     app/api/…            (shared)
<any host>/e/<slug>         →     (no rewrite)       →     app/e/[slug]/…       (shared, guest-facing)
```

### 3.2 Approaches considered and rejected

- **A-minimal (app left at repo route root, only marketing + admin get folders).** Least churn, but asymmetric and messy — the product surface has no folder of its own, mixing app routes with shared/global files. Rejected in favour of symmetric folders.
- **B / monorepo (three separate Next.js apps + three Vercel projects, shared code in `packages/`).** Full deploy isolation but triples infra, forces a large shared-code extraction, and re-opens the separate-projects path the founder already rejected. Rejected.

### 3.3 Why R1

- Cleanest folder separation without tripling infrastructure.
- Shared code (auth, Supabase clients, UI, design system, `lib/*`, `components/*`) stays direct-import via the `@/` alias — no package extraction.
- One deploy, one build. The trade-off (shared blast radius) is mitigated by middleware tests and preview-deploy verification before prod cutover (see §9).

---

## 4. Target folder structure

```
evenzi/
  app/                          ← Next.js routing root (unchanged location)
    layout.tsx                  ← ROOT layout: html/body + fonts + globals ONLY (chrome removed)
    globals.css                 ← shared
    manifest.ts, not-found.tsx, favicon.ico, icon.*, apple-icon.png  ← shared
    page.tsx                    ← app-host root: redirect → /home (or /auth if signed out)

    app/                        ← APP surface
      layout.tsx                ← app chrome (BusyProvider, HelpFabMount, ServiceWorker, Preloader, RevealObserver)
      home/
      events/
      settings/
      auth/                     ← page.tsx, callback/, role-selection/, accept-invite/
      help/

    marketing/                  ← MARKETING surface
      layout.tsx                ← marketing chrome (no app-only providers/service worker)
      page.tsx                  ← landing (moved from old app/page.tsx)
      legal/                    ← privacy/, terms/  (public)

    admin/                      ← ADMIN surface (reserved this session)
      layout.tsx                ← admin chrome (minimal)
      page.tsx                  ← gated placeholder ("Admin — coming soon")

    api/                        ← SHARED (host-agnostic, unchanged)
    e/[slug]/                   ← SHARED, guest-facing public event site (unchanged)

  components/                   ← unchanged (landing/ used by marketing; rest by app)
  lib/                          ← unchanged, extended: url.ts
  middleware.ts                 ← host-aware rewrite + existing auth/session logic
```

### 4.1 Move / relocate / delete list

**Move into `app/app/`:** `home/`, `events/`, `settings/`, `auth/`, `help/`.

**Move into `app/marketing/`:** old `app/page.tsx` (becomes `app/marketing/page.tsx`), `legal/`.

**Create new:** `app/page.tsx` (app-host root redirect), `app/app/layout.tsx`, `app/marketing/layout.tsx`, `app/admin/layout.tsx`, `app/admin/page.tsx`.

**Stay at routing root (shared):** `api/`, `e/`, `layout.tsx` (slimmed), `globals.css`, `manifest.ts`, `not-found.tsx`, all icon/favicon assets.

**In-tree cleanup coupled to this move (CORRECTED 2026-08-30 — the original "all four are dead" list was wrong; verified live tendrils):**

- **Extract, keep, delete only the remainder:** `app/website-theme-framer/` — only `components/FlyCanvas.tsx` is live (imported by the landing). Extract `FlyCanvas` → `components/ui/FlyCanvas.tsx`, then delete the rest of the dir (its `page.tsx` + 6 sibling components are used only within it).
- **KEEP `app/wedding-invitation-temp-1/`** — not dead. Its route is linked live from `app/events/[id]/website/design/page.tsx:149` (the "Cinematic Scroll" template preview), and its `WeddingTemplate1Client` is imported by the public guest site `app/e/[slug]/page.tsx`. Extract `WeddingTemplate1Client` → `components/templates/`, move the route into `app/app/wedding-invitation-temp-1/`.
- **KEEP `app/dev/` + `app/api/dev/`** — a dev-only playground gated in `lib/supabase/middleware.ts:47-49` (`/dev` allowed only when `NODE_ENV !== 'production'`). Not dead; leave both and the middleware block.

> Any folder whose keep/delete status is uncertain at build time is **kept and moved into `app/app/`**, never silently deleted. Only the `website-theme-framer` remainder (after extracting FlyCanvas) is authorised for deletion by this spec.

---

## 5. The layout split (important)

Today `app/layout.tsx` is the single root layout and it loads **app-only chrome** for every route: `BusyProvider`, `HelpFabMount`, `ServiceWorkerRegister`, `Preloader`, `RevealObserver`, plus `metadataBase` from `getAppBaseUrl()`. Marketing and admin must **not** inherit app chrome (e.g. the Help FAB, the app service worker, app OG metadata).

**Change:**

- **Root `app/layout.tsx`** slims to the shared essentials only: `<html>`/`<body>`, font variables, `globals.css`. No providers, no service worker, no FAB. Generic/neutral metadata (per-surface layouts override).
- **`app/app/layout.tsx`** (new) carries all current app chrome and app `metadataBase` (`NEXT_PUBLIC_APP_URL`).
- **`app/marketing/layout.tsx`** (new) carries marketing metadata (`NEXT_PUBLIC_MARKETING_URL`) and only the chrome the landing needs. No app service worker, no Help FAB.
- **`app/admin/layout.tsx`** (new) minimal shell; admin `metadataBase` (`NEXT_PUBLIC_ADMIN_URL`), `robots: noindex`.

---

## 6. Middleware (the delicate change)

`middleware.ts` (and `lib/supabase/middleware.ts`) is the single highest-risk change because all auth/session/redirect logic runs through it.

### 6.1 New responsibilities, in order

1. **Resolve surface from host.** Map `Host` header → surface:
   - `admin.` prefix → `admin`
   - `app.` prefix → `app`
   - bare root / `www.` → `marketing`
   - Local dev and preview hosts map via the same rules (see §7).
2. **Reject cross-surface prefix leakage.** If the *path* already starts with another surface's prefix (`/admin`, `/marketing`, `/app`) on the wrong host, return 404. These prefixes are internal-only; a visitor can never address them directly.
3. **Rewrite** the path to `/{surface}${pathname}` for `app`/`marketing`/`admin`, **except** shared paths (`/api/*`, `/e/*`, `/_next/*`, static assets, icons/manifest) which pass through unrewritten on every host.
4. **Run existing auth/session logic** (Supabase `getUser`, role gate, public-path redirects) against the resolved surface. Public-path and role rules become surface-scoped:
   - **marketing**: fully public, no auth.
   - **app**: existing behaviour (public: `/auth`, `/auth/*`; protected: everything else → redirect to `/auth`; host-only `/events` role guard preserved).
   - **admin**: gated by the interim allowlist (see §8); unauthenticated or non-allowlisted → redirect to an admin login / 403.

### 6.2 Constraints preserved

- The Supabase SSR rule holds: **no logic inserted between `createServerClient()` and `supabase.auth.getUser()`**. Host resolution and rewrite happen either before client creation or after `getUser()`, never in between.
- Cookies remain per-host (default `@supabase/ssr` behaviour) → app and admin sessions are independent. No shared cookie domain is set.

### 6.3 Matcher

Middleware must run on all surface routes but skip static assets. Update the `config.matcher` so `/api`, `/_next/static`, `/_next/image`, and file-extension assets are excluded, while surface pages and `/e/*` are included where auth/host handling is needed.

### 6.4 `/e/[slug]` canonical host (council §14.3)

The public guest event site (`/e/[slug]`) is pinned to a **single canonical host — the app host** (`app.evenzii.com/e/<slug>`), matching current `getAppBaseUrl()` link generation. On the marketing and admin hosts, `/e/*` returns 404. This avoids duplicate content / ambiguous canonical + OG URLs and — importantly — stops an unauthenticated public route from rendering same-origin as admin. Because the route may be statically generated (built once, served regardless of request-time rewrites), the canonical URL is enforced in the route's `generateMetadata`, not assumed from the middleware rewrite.

---

## 7. Local development

Subdomains must be testable locally. Approach:

- Use the browser-supported `*.localhost` convention (resolves to `127.0.0.1` with no `/etc/hosts` edit in modern browsers):
  - App: `http://app.localhost:3000`
  - Marketing: `http://localhost:3000` (bare) and/or `http://marketing.localhost:3000`
  - Admin: `http://admin.localhost:3000`
- Host resolution in middleware handles `*.localhost` and the bare `localhost` the same way it handles production hosts.
- `.env.local` gains the three base URLs for local cross-links:
  - `NEXT_PUBLIC_APP_URL=http://app.localhost:3000`
  - `NEXT_PUBLIC_MARKETING_URL=http://localhost:3000`
  - `NEXT_PUBLIC_ADMIN_URL=http://admin.localhost:3000`
- Document the three local URLs in the build-doc so Cursor and Antigravity test the right hosts.

---

## 8. Admin interim gate

`admin.evenzii.com` must not be publicly open, but there is no admin role yet.

- Gate `app/admin/*` on an **environment allowlist**: `ADMIN_USER_IDS` = comma-separated Supabase `auth.users` UUIDs (Abhijith + Dheeraj initially).
- Flow: unauthenticated admin-host visitor → redirect to a minimal admin sign-in (reuse existing Supabase auth); authenticated but not in `ADMIN_USER_IDS` → 403 "Not authorised"; allowlisted → the placeholder shell ("Admin — coming soon").
- `robots: noindex` on the admin layout.
- This is explicitly interim. The next session designs real RBAC (`role_slug='admin'` or a dedicated table + RLS) and replaces the env allowlist. A `TODO(admin-rbac)` marker is left in the gate code pointing at that follow-up.

---

## 9. Environment & URL helpers

- Extend `lib/url.ts`:
  - `getAppBaseUrl()` — unchanged contract (`NEXT_PUBLIC_APP_URL` first).
  - Add `getMarketingBaseUrl()` (`NEXT_PUBLIC_MARKETING_URL`) and `getAdminBaseUrl()` (`NEXT_PUBLIC_ADMIN_URL`), each with the same `VERCEL_URL` / localhost fallbacks.
- Cross-surface links use these helpers, never hard-coded hosts:
  - Marketing "Get started" / "Sign in" → `${getAppBaseUrl()}/auth`.
  - App references to public/legal/marketing pages → `getMarketingBaseUrl()`.
- New env vars (Vercel, all three needed in production):
  - `NEXT_PUBLIC_APP_URL=https://app.evenzii.com`
  - `NEXT_PUBLIC_MARKETING_URL=https://evenzii.com`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.evenzii.com`
  - `ADMIN_USER_IDS=<uuid>,<uuid>`

---

## 10. Deploy & DNS cutover (founder-executed, guided)

Claude/Cursor cannot perform DNS or Vercel domain changes. The build-doc includes a runbook; the founder executes:

1. On Vercel project `evenzi`, add domains: `evenzii.com`, `www.evenzii.com`, `admin.evenzii.com` (and confirm `app.evenzii.com`). Retire the `evenzii.com` alias on the separate `evenzi-coming-soon` project.
2. Set the four env vars (§9) in the `evenzi` project (Production + Preview as appropriate).
3. Verify each host on a **preview deploy** before promoting to production (see §11).
4. **After cutover:** repoint the Supabase push-webhook trigger URL from `https://evenzi.vercel.app/api/notifications/dispatch-push` to `https://app.evenzii.com/api/notifications/dispatch-push` (per `CLAUDE.md` ops note).

---

## 11. Testing & verification

- **Unit / middleware tests:** host → surface resolution (app/marketing/admin/local/preview), cross-surface prefix rejection (404), shared-path pass-through (`/api`, `/e`), and that app auth redirects still fire on the app host.
- **Preview-deploy manual matrix** (Antigravity / founder), per host:
  - Marketing host loads landing, no app chrome, no service worker, "Get started" → app host `/auth`.
  - App host: sign-in, dashboard, events, settings, help all reachable at clean URLs; `/e/<slug>` still works; direct `/admin` and `/marketing` on the app host → 404.
  - Admin host: unauthenticated → sign-in; non-allowlisted → 403; allowlisted → placeholder shell; `noindex` present.
- **Regression:** existing Vitest suite must stay green (imports unaffected by the moves; only path/middleware tests may need host context).
- No success claim before the middleware tests pass and the preview matrix is walked (verification-before-completion).

---

## 12. Sequencing (how this ships)

1. **Git/infra cleanup pass** (separate commit, *before* the move): delete `e2e-truth-audit` fixture + Account B test user, prune merged branches and stale worktrees (per `docs/NEXT-SESSION.md`). Independent of the tree; gives a clean base.
2. **Subdomain split build — TWO Cursor passes** (§14.4), each under a Claude review gate:
   - **Pass 1 — structural move (must end green):**
     - a. Slim root `app/layout.tsx` to the document shell (`<html>/<body>` + fonts + globals); create the three per-surface **nested, non-`<html>`** layouts.
     - b. `git mv` route folders into `app/app/` (home, events, settings, auth, help); landing + legal into `app/marketing/`; add `app/app/page.tsx` redirect fallback + `app/{app,marketing,admin}/not-found.tsx`.
     - c. In-tree deletions (§4.1).
     - d. Temporary **identity/pass-through** `middleware.ts` (existing auth behaviour unchanged — no host routing yet), so Pass 1 isolates move/layout breakage from routing.
     - e. **Gate:** `grep` for `@/app/...` specifiers fixed, `tsc --noEmit` clean, `npm run test:run` green, `npm run build` succeeds. → **Claude review.**
   - **Pass 2 — host routing + admin (the delicate half):**
     - f. Host-aware `middleware.ts`: exact-host allowlist resolution (C2), preview override gated to non-production (C4), decode+prefix-rejection (§14.3), rewrite via `x-middleware-rewrite` carrying Supabase cookies (C5), host-scoped cookies (C6), app-root redirect (C1), surface-scoped auth + admin fail-closed gate (C3), `/e/[slug]` canonical-host pinning (§6.4).
     - g. `app/admin/` gated placeholder shell + `robots: noindex` + per-surface security headers.
     - h. Extend `lib/url.ts` (`getMarketingBaseUrl`, `getAdminBaseUrl`) + wire cross-surface links + `.env.local` + `sys-check` env assertion.
     - i. Middleware/host **unit tests** (all the "required test" cases named in §14).
     - j. **Gate:** tests green + preview host-header smoke matrix (§11). → **Claude review (council code checkpoint — middleware + auth touched).**
3. **Merge to `Dev-Vibe`** → preview verify (all three surfaces via the override) → **founder DNS/env cutover runbook (§14.2 D1–D3)** → prod → webhook repoint (§14.3).

---

## 13. Risks

| Risk | Mitigation |
| --- | --- |
| Middleware bug 500s all three hosts (shared blast radius). | Middleware unit tests + mandatory preview-deploy matrix before prod promote. |
| Large mechanical move breaks an import or a route. | Imports use `@/` (root-anchored) so moves are safe; typecheck + full test run + preview walk catch stragglers. |
| A "shared vs app" misclassification (e.g. a route that assumed root path). | Explicit classification table (§4) reviewed by council; uncertain folders default to app surface, never deleted. |
| Marketing inherits app service worker / caching. | Layout split (§5) removes app chrome from marketing; verify no `sw.js` registration on marketing host. |
| Admin subdomain exposed before RBAC exists. | Interim `ADMIN_USER_IDS` allowlist gate + `noindex` (§8). |
| DNS/alias cutover done before verification. | Preview-deploy verification precedes production promotion (§10–11). |

---

## 14. Council review — folded findings (authoritative)

**Council reviewed:** 2026-08-30 by Tech Lead, Security Expert, DevOps Engineer. **Verdict:** 🟡 ADDRESS-THEN-PROCEED (no re-plan). Phases: Critique + Debate; no true contested findings so the arbiter round was skipped. The resolutions below **override** anything earlier in this spec that conflicts, and are the binding requirements for the Cursor build-doc.

### 14.1 Critical — must be implemented in code (build blockers)

- **C1 — App-host root is unreachable; do the root decision in middleware.** The app host rewrites `/` → `/app`, so there is no reachable root `app/page.tsx` and none should be depended on. Middleware, on the app host, redirects `/` to `/home` (signed in) or `/auth` (signed out) before/after the rewrite. Provide `app/app/page.tsx` only as a thin server redirect to `/home` fallback. (was §3.1/§4/§6.1 ambiguity)

- **C2 — Surface resolution is an exact-host allowlist, never a prefix/substring test.** `host.startsWith('admin.')` / `host.includes('app')` is forbidden — it matches `admin.evenzii.com.attacker.com` and `app.evil.com`. Resolve against an explicit map of exact known hosts: `app.evenzii.com` → app; `evenzii.com` + `www.evenzii.com` → marketing; `admin.evenzii.com` → admin; plus the `*.localhost` and preview rules (§14.1-C4). **Any unrecognized host → marketing (least privilege), never app/admin.**

- **C3 — Admin gate fails closed and is surface-scoped.** Parse `ADMIN_USER_IDS` into a trimmed, normalized (lowercased) non-empty `Set<string>`. Gate: `if (surface === 'admin' && (!user || !adminSet.has(user.id)))` → redirect to admin sign-in / 403. If the set is empty or the env var is missing → **deny everyone** (never fall through to "no filter = allow"). The gate must run after a real `supabase.auth.getUser()` (not a raw cookie read), so a forged/expired cookie cannot reach admin. Required test: empty-env ⇒ 403.

- **C4 — Preview/`*.vercel.app` surface override (previews have no `app.`/`admin.` host).** Without this, every preview host resolves to marketing and the §11 verification matrix is impossible. Host resolution, **only when `process.env.VERCEL_ENV !== 'production'`**, additionally honors a `?surface=app|admin|marketing` query (and/or an `x-evenzi-surface` request header for curl/Playwright smokes). This override is hard-disabled in production and **still passes through the C3 admin allowlist** — surface selection alone never grants admin. Required test: `preview host + ?surface=admin + non-allowlisted user` ⇒ 403; `production + ?surface=admin` ⇒ override ignored.

- **C5 — The rewrite response must carry Supabase's refreshed cookies.** `@supabase/ssr` writes rotated session cookies onto its `NextResponse`; a fresh `NextResponse.rewrite(url)` that doesn't copy them drops the refresh → logout loops. Implement the rewrite via `x-middleware-rewrite` on the same response object, or copy `supabaseResponse.cookies` onto the rewrite response. Required test: `Set-Cookie` survives a rewritten request.

- **C6 — Cookies stay host-scoped.** Do not set `Domain=.evenzii.com` on auth cookies (keep the `@supabase/ssr` default, and assert it), so app/admin session cookies never travel to the marketing or public (`/e`) origins. Shared-domain SSO stays deferred (§1 non-goals).

### 14.2 Critical — deploy runbook (founder-executed; goes in the build-doc runbook)

- **D1 — Apex move is the single risky cross-project step.** `evenzii.com` currently lives on the separate `evenzi-coming-soon` project and must move to `evenzi` (unavoidable in R1, since marketing now lives in this repo). A domain verifies on only one Vercel project at a time. Sequence: (1) merge + confirm a green production build on `evenzi` with all four env vars set; (2) add `www.evenzii.com` + `admin.evenzii.com` to `evenzi` **first** (no conflict — coming-soon only holds the apex) and let SSL issue; (3) verify marketing via `www` + all surfaces via the preview override; (4) **only then** remove `evenzii.com` from `evenzi-coming-soon` and immediately add it to `evenzi`. Apex uses an A record (`76.76.21.21`); `www` uses CNAME; pick a canonical direction and 308 the other. Don't promote until the padlock is live on all three hosts.

- **D2 — Named rollback.** Edge middleware can't be hotfixed; if any host errors post-promotion, immediately Vercel → Deployments → previous production build → Promote to Production (instant, no rebuild). Keep `evenzi-coming-soon` **paused, not deleted, for 48h** as an apex fallback.

- **D3 — Kill the stale apex service worker.** If `evenzi-coming-soon` ever registered a `sw.js` on `evenzii.com`, it survives the project swap (same origin) and keeps serving the old cached site. Ship a self-unregistering tombstone `sw.js` at the apex root (`self.registration.unregister()` + `caches.delete(...)`) and send `Clear-Site-Data: "cache", "storage"` on the first apex deploy — **never include `"cookies"`** (it would nuke live Supabase sessions on shared origins). Verify on the live apex (DevTools → Application → Service Workers) before cutover.

### 14.3 Important — fold into the build-doc

- **`/e/[slug]` pinned to one host (§6.4 new).** Serving the public guest site on all three hosts causes duplicate content, ambiguous canonical/OG, and — critically — renders an unauthenticated public route same-origin as admin. Pin `/e/[slug]` to a single canonical host (**app host** by default, matching current `getAppBaseUrl()` link generation); 404 it on marketing and admin. Enforce the canonical URL in the route's `generateMetadata`, not via the rewrite (SSG routes are built once and served on all hosts).
- **Move safety is gated, not assumed.** `@/` protects shared-code imports, but `@/app/...` specifiers (co-located `_components`, server actions, tests importing a page/layout by path) shift to `@/app/app/...` and won't auto-fix. Before the move: `grep -rn "@/app/\(home\|events\|settings\|auth\|help\)" ` and for `@/app/legal`, `@/app/page`. Use `git mv` (preserve history). Gate the pass on `tsc --noEmit` clean + full `npm run test:run` green — not just a preview walk.
- **Per-surface `not-found.tsx` + defined 404 mechanism.** A single root `not-found.tsx` renders unstyled under the slim root layout. Add `app/app/not-found.tsx`, `app/marketing/not-found.tsx`, `app/admin/not-found.tsx`. Specify the middleware 404 mechanism for cross-surface prefix rejection (rewrite to a dedicated not-found route vs `NextResponse` 404).
- **Resolve from the platform `host` header; ignore `x-forwarded-host`.** Document that `x-forwarded-host` is deliberately not trusted for surface resolution. Test: a spoofed `x-forwarded-host` does not change the resolved surface.
- **`/api` host-agnostic — standing constraint.** API routes are excluded from the matcher and reachable from all hosts; they are protected solely by their own `supabase.auth.getUser()` + RLS. Add a one-line constraint in code comments: future admin APIs must re-check `ADMIN_USER_IDS`/RBAC in-handler and must never trust the Host header for authorization.
- **Path normalization + same-surface redirect.** Decode/normalize the pathname before the cross-surface prefix-rejection check (guards `/%2fadmin`, `//admin`, `/./admin`). Constrain any post-login redirect target to a **relative path on the same resolved surface** (reject absolute URLs and other surfaces' hosts) — open-redirect guard, made easier to trip by three legitimate hosts.
- **Env in Preview too.** Set the three `NEXT_PUBLIC_*_URL` vars in the **Preview** environment, not just Production (they bake per-build; a missing Preview value ships wrong absolute URLs into exactly the environment used for verification). The `VERCEL_URL` fallback collapses all three helpers to one host and is known-wrong for cross-surface links — never rely on it outside pure localhost.
- **Env × environment matrix + server-only invariant.** The build-doc includes a table: each of `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MARKETING_URL`, `NEXT_PUBLIC_ADMIN_URL`, `ADMIN_USER_IDS` × {Production, Preview, Development} with concrete values. Hard note: `ADMIN_USER_IDS` is **server-only** — never `NEXT_PUBLIC_` (that would ship the admin roster to every client bundle). Extend `npm run sys-check` to fail if any of the four are unset.
- **No `vercel.json` / no `next.config` rewrites.** Routing is middleware-only; state this explicitly so nobody adds Vercel-level rewrites that fight the middleware.
- **Webhook repoint timing + health checks.** After cutover, `curl -X POST https://app.evenzii.com/api/notifications/dispatch-push` (expect the route's auth-reject, proving it's routed and alive) **before** updating the Supabase trigger URL; keep `evenzi.vercel.app` valid as fallback 24h. Add a per-host health check (`/` 200/redirect, `/api` reachable) to the §11 gate.
- **Layout document-shell ownership.** The root `app/layout.tsx` owns the single `<html>`/`<body>` + fonts + `<html lang>`. The three per-surface layouts are **nested, non-`<html>`** layouts (chrome/providers/metadata only). A moved app layout that keeps its own `<html>`/`<body>` causes nested `<html>` and hydration breakage.
- **Per-surface security headers.** Admin needs a stricter CSP and `frame-ancestors 'none'`; don't let a shared config default admin down to marketing's laxer posture. Set headers per resolved surface (middleware or per-surface config).

### 14.4 Suggestions (do if cheap)

- Make `manifest.ts` + icon links host-aware (or drop `<link rel="manifest">` from marketing/admin layouts) so those surfaces aren't installable as the app PWA and don't advertise app branding.
- **Two Cursor passes** (adopted — see revised §12): Pass 1 = slim root layout + per-surface layouts + folder moves + deletions with a temporary identity/pass-through middleware, verified green (`tsc` + tests + build); Claude review; Pass 2 = admin shell + host resolution + url helpers + rewrite + tests. Isolates a bad import from a bad rewrite at the review gate.
- SSG/`generateStaticParams` routes are built once and served on all hosts — canonical-host enforcement lives in the route/metadata layer, never assumed from the request-time rewrite.

### 14.5 Debate notes (non-blocking)

- TL2 and DO1 are the same underlying issue (preview host→surface undefined) — merged into C4, not double-counted.
- DevOps clarified TL7 (2-pass split): it reduces review load but does **not** change the cutover story — the apex swap is one verification-gated step regardless of pass count. Adopted on the review-load merit.
- DO6's tombstone-SW is half app-concern (a real `public/sw.js` asset + route), not pure ops — owned by the marketing surface build, executed at deploy.

---

## 15. Vercel + Supabase changes (added 2026-08-30)

The original runbook (§10, §14.2) covered Vercel domains + env but **omitted a Supabase Auth change that is required for sign-in to work on the new host.** This section is the complete external-config change set, with the current live state (verified via the Vercel MCP on 2026-08-30) so each item is a checkable delta.

### 15.1 Vercel — current state vs target

**Project `evenzi` (`prj_dXWmfgGtBOJDsBO18BOmcNxfwwoX`) domains today:** `evenzi.vercel.app`, `evenzi-evenzi.vercel.app`, `evenzi-git-dev-vibe-testing-evenzi.vercel.app`. **None of the `evenzii.com` hosts are attached yet.**

| Change | Status | Action |
| --- | --- | --- |
| Add `www.evenzii.com` to `evenzi` | ❌ missing | Add first (no conflict — coming-soon holds only the apex). Let SSL issue. |
| Add `admin.evenzii.com` to `evenzi` | ❌ missing | Add (new DNS record). SSL issue. |
| Add `app.evenzii.com` to `evenzi` | ❌ missing | Add (new DNS record). SSL issue. This becomes the primary app host. |
| Move apex `evenzii.com` from `evenzi-coming-soon` → `evenzi` | ❌ (on coming-soon) | **Last** step (§14.2 D1): remove from coming-soon, add to `evenzi`. Apex = A record `76.76.21.21`; `www` = CNAME. Pick a canonical (apex↔www) and 308 the other. |
| Env `NEXT_PUBLIC_APP_URL=https://app.evenzii.com` | ❌ new | Set in **Production + Preview**. Referenced in code (`lib/url.ts`, middleware). |
| Env `NEXT_PUBLIC_MARKETING_URL=https://evenzii.com` | ❌ new | Production + Preview. |
| Env `NEXT_PUBLIC_ADMIN_URL=https://admin.evenzii.com` | ❌ new | Production + Preview. |
| Env `ADMIN_USER_IDS=<uuid>,<uuid>` | ❌ new | **Server-only — never `NEXT_PUBLIC_`.** Production + Preview. Abhijith + Dheeraj Supabase `auth.users` UUIDs. |

### 15.2 Supabase Auth — the required addition (was missing)

Sign-in redirects are built from `window.location.origin`, so on the new app host they resolve to `https://app.evenzii.com/auth/callback`:

- `app/app/auth/page.tsx:92` — Google OAuth `redirectTo: ${origin}/auth/callback`.
- `app/app/settings/ConnectMethods.tsx:56` — link-Google `redirectTo: ${origin}/auth/callback?next=…`.

Supabase rejects any redirect target not on its allowlist, so **without this change Google OAuth and phone-OTP callback fail on `app.evenzii.com`.** In the Supabase dashboard → **Authentication → URL Configuration**:

| Setting | Change |
| --- | --- |
| **Site URL** | Set to `https://app.evenzii.com` (the surface where auth runs). Keep `evenzi.vercel.app` working during transition. |
| **Redirect URLs (allowlist)** | Add `https://app.evenzii.com/auth/callback` and `https://app.evenzii.com/**`. Keep the existing `evenzi.vercel.app` and `http://localhost:3000/**` entries; add `http://app.localhost:3000/**` for local dev. |
| **Google provider** | If the Google Cloud OAuth client has its own "Authorized redirect URIs", they point at the Supabase callback (`<project>.supabase.co/auth/v1/callback`), which is unchanged — no Google console edit needed. Only Supabase's own allowlist changes. |

Also pending (pre-existing, not split-specific but same screen): **Auth → Allow manual linking = ON** (needed for the connect-Google link flow from the 2026-08-23c session).

No schema change. No RLS change.

### 15.3 Push webhook (after cutover)

The Postgres trigger `notifications-dispatch-push` posts to `https://evenzi.vercel.app/api/notifications/dispatch-push`. After the app host is verified live, repoint it to `https://app.evenzii.com/api/notifications/dispatch-push` (per `CLAUDE.md` ops note). Verify first with `curl -X POST https://app.evenzii.com/api/notifications/dispatch-push` (expect the route's signature-reject = alive). Keep the `evenzi.vercel.app` URL valid 24h as fallback.

### 15.4 What can be prepared now vs at cutover

- **Now (safe, no user impact):** set the 4 env vars in Vercel Production + Preview; add the Supabase redirect-URL allowlist entries for `app.evenzii.com` (additive — doesn't break the current host); flip Allow-manual-linking ON. None of these affect the live site until the domains are attached.
- **At cutover (gated on a green build + preview verify):** attach the 4 domains, retire the coming-soon apex, repoint the webhook.

---

## 16. End-of-split click-through QA (full manual + automated pass)

Before the split is called done, a **full click-through** of every surface runs — automated where possible (Antigravity, per the delegation gate) and a founder manual pass on a real session for anything automation can't drive (Google OAuth, OTP input, the OS file-picker). This runs on the **preview deploy** (using the `?surface=` / `x-evenzi-surface` override for the app/admin surfaces) **before** the DNS cutover, and again as a smoke pass on the real hosts after cutover.

### 16.1 Marketing surface (`evenzii.com` / preview `?surface=marketing`)
- Landing renders fully; no app chrome (no Help FAB, no app service worker registered — check DevTools → Application → Service Workers).
- "Get started" / "Sign in" → `app.evenzii.com/auth` (correct cross-host link, not the preview origin).
- `/legal/privacy` and `/legal/terms` load. No `/home`, `/events`, `/api`-driven app content leaks.
- Direct `evenzii.com/admin`, `/app`, `/e/<slug>` → 404.

### 16.2 App surface (`app.evenzii.com` / preview `?surface=app`) — the deep pass
- **Auth:** Google OAuth round-trip completes (returns to `/auth/callback` → `/home`). Phone OTP: request + verify + role-selection for a fresh user. Sign-out.
- **Connect a 2nd method** (Settings): link Google and link phone both complete; disconnect respects the last-method guard.
- **Event lifecycle:** create (4-step wizard) → edit → delete. Dashboard tiles/counts correct.
- **Every event hub tab:** guests (add/import/RSVP/WhatsApp send queue), planning (checklist + budget add/edit/delete/toggle), media (upload), website/design (edit, live preview, share), invitations card designer (persist across reload incl. photo-BG + upload-own-card), settings (all sub-tabs incl. usage/billing/registry).
- **Root `/`:** signed-in → `/home`; signed-out → `/auth`.
- **Guest site `/e/<slug>`:** loads on the app host, public (no auth redirect), RSVP works. Confirmed 404 on marketing/admin hosts.
- **App-only assets:** `/manifest.webmanifest`, `/icon.png` serve on app host; PWA installable only here.
- Push: in-app bell + a browser push on a subscribed device (needs VAPID env + webhook).

### 16.3 Admin surface (`admin.evenzii.com` / preview `?surface=admin`)
- Unauthenticated → 403 (fail-closed). Authenticated but **not** in `ADMIN_USER_IDS` → 403. Allow-listed user → the "Admin — coming soon" placeholder.
- Response carries strict CSP (`frame-ancestors 'none'`) + `X-Frame-Options: DENY` + `noindex` (check headers).
- Admin login: `admin.evenzii.com/auth` reaches the sign-in screen (rewritten to app auth), and after login an allow-listed user lands on the placeholder.

### 16.4 Cross-cutting
- **Preview override** works only on non-production (`?surface=admin` reaches admin on preview; ignored on prod).
- **Sessions are host-independent:** an app session does not grant admin (cookie host-scoping).
- No horizontal scroll / broken layout at 360 / 390 / 768 / 1440 on each surface's key pages (Antigravity responsive pass).
- Console clean (no CSP violations, no failed asset/manifest fetches) on each surface.

### 16.5 Ownership
- **Antigravity:** automated regression/responsive/a11y across the three surfaces on the preview URL (via `?surface=`), plus the app feature click-throughs it can drive.
- **Founder (manual):** the auth flows (Google OAuth, OTP), the OS file-picker uploads (invitation photo-BG, media), and the real-device push toast.
- **Claude:** reviews the Antigravity `_findings` against this matrix, patches spec/tests on any gap, and signs off before cutover.
