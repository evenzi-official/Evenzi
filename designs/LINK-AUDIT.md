# Designs folder — link & navigation audit

**Date:** 2026-06-06  
**Location:** `designs/LINK-AUDIT.md` (single source of truth for this pass)  
**Scope:** All static prototypes under `designs/` — 35 HTML pages, CSS/JS assets, JS navigation strings  
**Method:** Static crawl (708 `href` / `src` / `action` refs) + live-server HTTP checks on `npm run design` → `:4000`  
**Verdict:** **2 broken-target patterns** (17 refs). All pages load directly; wizard, auth, and website-internal chains are intact.
**Independently re-verified (Claude / spec-kit-review, 2026-06-06):** a fresh whole-tree crawl reproduces this exactly — **17 broken refs (4 `website.html` + 13 `manifest`), 0 false-negatives, 0 false-positives**; the 83 `#` are correctly classed as intentional stubs; `event-control` Website nav → `overview.html` confirmed healthy. Safe to fix from this doc.

---

## Executive summary

| Severity | Issue | Broken refs | User impact |
|----------|-------|-------------|-------------|
| **P0 — broken nav** | `../website/website.html` does not exist | 4 | **Website** tab on Guests / Invitations / Media / Planning → **404** |
| **P1 — missing asset** | `manifest.webmanifest` missing everywhere it's linked | 13 | Console 404 on load (PWA meta only; page still renders) |
| **P2 — intentional stubs** | `href="#"` placeholder links | 83 across 19 pages | Footer Privacy / Terms / Help + prototype CTAs — no destination yet |
| **Info — retired** | `edit-pages.html` | 0 inbound links | Meta-refresh to `overview.html` — not broken |
| **Info — vendor auth** | Role select → Vendor | JS only | Toast only; no navigation (vendor MVP out of scope) |

**Healthy:** Event-control Website tab → `overview.html` ✓ · Website module cross-links ✓ · Create-event wizard ✓ · Auth chain ✓ · CSS/JS refs ✓ · All 35 HTML pages HTTP **200** when opened directly ✓

---

## Page inventory (35 HTML files)

```
designs/
├── components.html
├── index.html
└── pages/
    ├── auth/                    auth.html, verify-otp.html, role-select.html
    ├── create-event/            step-1 … step-4-review, success
    ├── event-control/           event-control.html, our-journey.html
    ├── event-settings/          general, guest-list, website, registry, plan-billing, admins
    ├── guests/                  guests.html
    ├── invitations/             invitations.html
    ├── media/                   media.html
    ├── planning/                planning.html
    ├── settings/                settings.html
    └── website/                 overview, design, photos, card-templates, edit-page, edit-pages
                                 templates/ (index + 5 theme previews)
```

---

## P0 — Broken navigation: `website.html`

**Missing file:** `designs/pages/website/website.html`  
**Correct entry (used elsewhere):** `designs/pages/website/overview.html`

The Website module was split into multiple pages. Event-control was updated; four tool-rail pages were not.

### Broken refs (complete list)

| # | Source page | Markup | Resolves to | HTTP |
|---|-------------|--------|-------------|------|
| 1 | `pages/guests/guests.html` | `href="../website/website.html"` | missing | **404** |
| 2 | `pages/invitations/invitations.html` | `href="../website/website.html"` | missing | **404** |
| 3 | `pages/media/media.html` | `href="../website/website.html"` | missing | **404** |
| 4 | `pages/planning/planning.html` | `href="../website/website.html"` | missing | **404** |

### Correct pattern (already shipped on other pages)

```html
<!-- pages/event-control/event-control.html -->
<a href="../website/overview.html" role="tab" data-section="website" class="nav-tab" aria-label="Website">

<!-- pages/website/overview.html -->
<a href="overview.html" class="nav-tab is-active" aria-current="page" aria-label="Website">
```

### Suggested fix

Change all four stale links to `../website/overview.html` (one line each).

### Do not confuse with

`pages/event-settings/website.html` — **exists**; Event Settings sidebar page (different module, same label "Website").

---

## P1 — Missing PWA manifest: `manifest.webmanifest`

**Missing file:** No `manifest.webmanifest` anywhere under `designs/`.  
Each affected page uses relative `href="manifest.webmanifest"` → resolves beside that HTML file → **404**.

### Broken refs (complete list — 13 pages)

| # | Source page |
|---|-------------|
| 1 | `components.html` |
| 2 | `index.html` |
| 3 | `pages/event-control/event-control.html` |
| 4 | `pages/event-control/our-journey.html` |
| 5 | `pages/guests/guests.html` |
| 6 | `pages/invitations/invitations.html` |
| 7 | `pages/media/media.html` |
| 8 | `pages/planning/planning.html` |
| 9 | `pages/settings/settings.html` |
| 10 | `pages/website/overview.html` |
| 11 | `pages/website/design.html` |
| 12 | `pages/website/photos.html` |
| 13 | `pages/website/card-templates.html` |

### Pages without manifest link (22 — no issue)

Auth (3), create-event wizard (5), event-settings (6), website templates (6), `edit-page.html`, `edit-pages.html` redirect stub.

### Live-server evidence

```
GET /manifest.webmanifest              → 404  (from index.html)
GET /pages/planning/manifest.webmanifest → 404  (from planning.html)
```

### Suggested fix (pick one)

1. Add canonical `designs/manifest.webmanifest` and point all `<link rel="manifest">` at it (path varies by page depth), **or**
2. Remove `<link rel="manifest">` until PWA is in scope (eliminates console noise).

---

## P2 — Placeholder `href="#"` links

**83 instances across 19 pages** — not file-missing (same-page anchor) but **dead navigation**.

| Label pattern | Approx. count | Notes |
|---------------|---------------|-------|
| Privacy | 16 | Footer legal stub |
| Terms | 16 | Footer legal stub |
| Help | 16 | Footer help stub |
| (empty label) | 21 | Mostly `components.html` catalog anchors |
| Misc CTAs | ~14 | e.g. "Full checklist →", "Download template", "Open dashboard" |

Intentional for prototype phase (`_test.md` row `3.deadlinks` on several pages). Low priority until marketing/legal routes exist.

---

## Reachability notes (not broken)

| Page | How reached | Status |
|------|-------------|--------|
| `pages/website/edit-pages.html` | No inbound nav; typed URL only | Retired — `<meta refresh>` + JS → `overview.html` |
| `pages/auth/verify-otp.html` | `auth.js` → `verify-otp.html` | ✓ |
| `pages/auth/role-select.html` | `auth.js` after OTP / Google | ✓ |
| `pages/create-event/step-4-review.html` | `create-event.js` wizard | ✓ |
| `pages/create-event/success.html` | `create-event.js` after submit | ✓ |
| `pages/website/edit-page.html` | `website.js` / `edit-pages.js` → `edit-page.html?page=` | ✓ |

### Auth flow (JS — verified targets exist)

```
auth.html  → verify-otp.html (phone OTP)
auth.html  → role-select.html (Google OAuth)
verify-otp.html → role-select.html
role-select.html → ../../index.html (host only)
role-select.html → vendor: toast only, no redirect
```

### Create-event wizard (JS — verified targets exist)

```
step-1-type → step-2-details → [step-3-celebrations if wedding] → step-4-review → success → index.html
```

### Website module internal links (static — all resolve)

Overview, design, photos, card-templates, templates/* cross-link correctly. Entry point = **`overview.html`**, not `website.html`.

---

## Stress-test results

| Check | Result |
|-------|--------|
| HTML pages (35) — direct `GET` on `:4000` | All **200** |
| Broken internal `href`/`src`/`action` (excl. `#`, external) | **17** (4 website + 13 manifest) |
| Missing CSS/JS from HTML | **0** |
| JS `node --check` (15 files under `designs/`) | **All pass** |
| JS `window.location` → missing `.html` | **0** |
| Website module cross-links | **0 broken** |
| Create-event wizard HTML targets | **0 broken** |
| Auth HTML targets | **0 broken** |
| `pages/guests/` + `pages/website/` visual regression (alias promotion) | Not re-run this pass — prior spec-kit guardrails green |

### Methodology

1. Recursively scan all `.html` for `href`, `src`, `action`.
2. Resolve relative paths from each source file; flag missing targets (skip `#`, `http(s):`, `mailto:`, `javascript:`, `data:`).
3. Scan `.css` `url()` and conservative `.js` HTML string patterns.
4. Curl each HTML page + its linked local assets on live-server `:4000`.
5. Trace JS navigation in `auth.js`, `create-event.js`, `website.js`, `edit-pages.js`.

---

## Open questions (product call)

1. **Manifest:** Create `designs/manifest.webmanifest`, or strip `<link rel="manifest">` until PWA ships?
2. **Website tab (P0):** Batch-fix 4 pages `website.html` → `overview.html` in one hygiene PR?
3. **Footer `#` links (P2):** Keep as stubs, or point Privacy/Terms/Help at a shared placeholder page?
4. **Vendor role-select:** Stay toast-only, or navigate to a "coming soon" stub?

---

## Suggested fix order

| Priority | Action | Effort |
|----------|--------|--------|
| 1 | P0 — `website.html` → `overview.html` on 4 pages | 4 one-line edits |
| 2 | P1 — manifest create **or** remove links | Small |
| 3 | P2 — footer/legal placeholders | Backlog |

---

## Decisions + exact fix mandate (for Cursor)

> Verified by Claude 2026-06-06 — the list below is exact (17 refs, no others). This is the fix mandate.

**⚠️ Scope note (read first):** this is a deliberate **cross-cutting chrome-hygiene pass**, separate from any single page's build. It edits the floating-nav link in `guests.html`, `invitations.html`, `media.html`, `planning.html` — that is **in scope here** and does NOT contradict the planning-build "don't edit other pages" guardrail (that applied only to the planning *rework build*, not to a hygiene pass). Edit ONLY the nav `href` strings + the manifest `<link>` lines listed below — do **not** alter any page's module content/layout. The `planning` page stays `DONE` (its change is a 1-line nav href, consistent with its siblings).

### P0 — `website.html` → `overview.html` · REQUIRED · 4 one-line edits
In each file, change the floating-nav Website tab `href="../website/website.html"` → `href="../website/overview.html"` (keep `data-section="website"` + all other attributes unchanged):
- `pages/guests/guests.html`
- `pages/invitations/invitations.html`
- `pages/media/media.html`
- `pages/planning/planning.html`

`event-control` is already correct — **do not touch it**. Do not confuse with `event-settings/website.html` (a real, different page).

### P1 — manifest · RECOMMENDED: **strip** (confirm before running)
PWA is not in MVP scope → cleanest fix is to **remove the `<link rel="manifest" href="manifest.webmanifest">` line** from all 13 pages. **Keep** the `theme-color` + `apple-mobile-web-app-*` meta tags (those don't 404). Kills the console 404 with no fake asset; reversible when PWA ships.
- *Alternative (only if PWA meta should resolve now):* create `designs/manifest.webmanifest` and repoint each `<link>` to the correct relative depth (root: `manifest.webmanifest`; `pages/*`: `../../manifest.webmanifest`; `pages/website/*`: `../../manifest.webmanifest`). More edits + a new asset.

### P2 — `href="#"` stubs · LEAVE
Intentional prototype placeholders (footer Privacy/Terms/Help + `components.html` catalog anchors). Keep — backlog until legal/marketing routes exist.

### Vendor role-select · LEAVE
Toast-only; vendor MVP out of scope. No change.

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-06 | Initial full audit — static crawl + `:4000` HTTP stress test |
| 2026-06-06 | Independently re-verified by Claude (17 confirmed, 0 false-neg/pos); added fix mandate + scope note. Open questions resolved: P0 fix 4 pages; P1 manifest → **strip (recommended, confirm)**; P2 stubs leave; vendor leave. |
