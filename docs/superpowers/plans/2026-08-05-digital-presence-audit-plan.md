# Digital Presence (Event Website) — Consolidated Fix Plan

**Date:** 2026-08-05
**Source:** V0 readiness audit artifact (2026-08-03, 104 findings) + a fresh code-verified pass + a pixel-by-pixel design comparison against `designs/pages/website/overview.html` (live at https://evenzi-official.github.io/Evenzi/pages/website/overview.html)
**Status:** Planned, not started — session paused for `/compact`

## Context

Two live security bugs were confirmed directly in code (not just cited from the prior audit):
1. `PATCH /api/events/[id]/website-settings` has no ownership check — any authenticated user can modify any event's website settings.
2. The guest-lookup rate limiter (`resolve_guest_by_lookup`) has no IP parameter at all (confirmed via live Postgres function signature query) — it cannot be per-IP as designed, it's effectively a global-per-event bucket.

Separately, a full pixel-by-pixel comparison of the design prototype's Website Overview screen against the React implementation (`app/events/[id]/website/page.tsx`) found the React version is a stripped-down shell — missing live preview, publish flow, share flow, and most of the "Get started" checklist — plus a nav-tab swap (design puts "Card Templates" as a top-level Website tab and keeps Pages management inline on Overview; React promoted "Pages" to its own tab and dropped Card Templates from this nav entirely).

## Phase 1 — Security (small, do first) — ✅ DONE 2026-08-05

| Item | Correction during execution | Fix applied | Verified |
|---|---|---|---|
| IDOR on `website-settings` PATCH | None — as planned | Added `verifyOwnership` helper (copied from `website-pages/route.ts:20-29`) to `app/api/events/[id]/website-settings/route.ts`, called before the upsert | Route now 401s/404s without a valid owner session (code-verified: identical pattern to the already-live `website-pages` route, typecheck clean) |
| Rate limiter not per-IP | **Correction:** no migration needed for an IP param — `resolve_guest_by_lookup` already reads the caller's IP from the Postgres `request.headers` GUC (`x-forwarded-for`), already has the exact 5/IP/15min + 30/event/15min ceiling. The real bug was the IP never being forwarded on the server-to-server `supabase.rpc()` call. | `app/api/e/[slug]/lookup/route.ts` now reads `x-forwarded-for` off the incoming request and forwards it via `.setHeader('x-forwarded-for', ip)` on the rpc call (real method on `@supabase/postgrest-js` `PostgrestBuilder`) | Live-tested against dev server + prod DB: sent `x-forwarded-for: 203.0.113.77`, confirmed `guest_lookup_attempts.ip_hash` matches `sha256('203.0.113.77')` exactly |
| **NEW — found during verification:** rate limiter was completely non-functional against brute-force guessing | The RPC raised `EXCEPTION 'lookup failed'` on a failed guess (wrong name/phone). PostgREST wraps each call in one transaction — the exception rolled back the *entire* transaction, including the `guest_lookup_attempts` insert that had just run. Only a *successful* match (function returns normally, transaction commits) ever persisted an attempt row. Verified empirically: 7 consecutive wrong-guess calls before the fix → all 401, zero new DB rows, count stuck forever. | Migration `fix_guest_lookup_rate_limit_rollback`: changed both `raise exception 'lookup failed'` branches to `return null` (app layer already treats a null token as "no match" → 401, unchanged UX). Only the `'too many attempts'` branch still raises (intentionally — it exits before any insert, nothing to lose). | Re-tested same 7-call sequence post-fix: attempts 1–5 → 401 (rows now persist), attempt 6+ → 429. Confirmed via DB: 5 rows logged, correct event, correct IP hash |

**Known limitation (accepted 2026-08-05):** the 5-attempts/15-min per-IP ceiling counts failed guesses too, so a real guest who mistypes their own name/phone 5x in 15 min locks themselves out and must wait out the window. No fix scheduled — flagged for a future pass (e.g. distinguish "no match" from "malformed" attempts, or add a soft warning at attempt 3-4 before the hard block).

### How to test Phase 1

**IDOR fix (website-settings ownership check):**
1. Log in as any host, open an event you own → Settings → Website tab. Toggle something (e.g. search indexing) and Save — should still work normally (this is just a regression check that the ownership check doesn't break legitimate saves).
2. To actually prove the IDOR is closed you need a second account: log in as a different user, grab the event ID of an event *they don't own* (from its URL, e.g. `/events/<id>/settings/website`), then try `PATCH /api/events/<id>/website-settings` with any tool (browser devtools console, Postman) while logged in as the second user. Expect `404 Not found`, not a successful save.

**Guest-lookup rate limiter:**
1. Open any live event's public site at `/e/<slug>` (not logged in / incognito).
2. Scroll to "Find your invitation", submit obviously-wrong name/phone 5 times in a row within 15 minutes.
3. On the 5th attempt you should still get the normal "couldn't find you" error. On the **6th** attempt, expect "Too many attempts — please try again later" instead — that's the 429 kicking in.
4. Wait 15 minutes (or just trust the earlier live-verified DB check) and it resets.

## Phase 2 — Publish/status model + enforcement — mostly done 2026-08-05, one item open

| Item | Finding | Status |
|---|---|---|
| Site status (Draft/Published/Offline) | Decision made 2026-08-05: reuse the existing `site_offline` boolean, no 3-state column/migration. No distinct pre-publish Draft state — site is reachable the moment it's created; host can only take it offline/online. | ✅ Decided — see next row, already implemented |
| `site_offline` saved but never enforced on the public site | **Correction — this was already fixed**, most likely landed in Dheeraj's Wave 1–3 Digital Presence push (2026-08-02), after the original audit that flagged it. `get_public_website_payload` already calls `is_website_gate_open()` and returns `null` when the gate is closed; `app/e/[slug]/page.tsx` already calls `notFound()` on a null payload — before the guest-session code path even runs, so returning guests with a valid session are correctly blocked too. | ✅ Live-verified: `curl localhost:3000/e/b-s-20270131` (an event with `site_offline=true`) → 404. A `site_offline=false` event → 200. No code change needed. |
| Live URL hardcoded to `evenzi.app` (doesn't exist as a domain) | App-layer only, as planned | ✅ Fixed — new shared `lib/url.ts` (`getAppBaseUrl()`, reused from the existing pattern in `admins/route.ts`, deduplicated into one helper per "reuse before create"). `app/events/[id]/website/page.tsx` now builds the live URL from it + `events.slug`, and the Overview page's Live/Offline badge now reads the real `site_offline` flag instead of always showing "Live". Live-verified in browser: shows `localhost:3000/e/dheeraj-1-dheeraj-2-s-wedding-20260917` with correct "LIVE" badge. |
| Website Settings "Website" tab password field not sent to API | Confirmed broken end-to-end (see above), decision 2026-08-05: build it now | ✅ Built + live-verified — see full writeup below |
| "Private content lock" toggle (guest needs phone match or password to unlock private content) | Checked `WebsiteContent.tsx` in full — **no such toggle exists in the current UI at all** (may have been from the design comparison, not the built page). Private-tier pages are already correctly gated by requiring a resolved guest session (`_website_page_content(event_id, 'private')`, only reachable via `get_guest_website_payload`). | ✅ No gap — nothing to build, confirmed via code read |

### Website password protection — built 2026-08-05

**DB (2 migrations):**
- `add_website_password_protection` — new table `event_website_password_sessions` (token/event_id/created_at, RLS-locked, same deny-all-direct-access pattern as `guest_lookup_attempts`/`guest_tokens`). New `hash_website_password(text)` (pgcrypto `crypt()`+`gen_salt('bf')`, already-enabled extension, no new npm dependency). New `verify_website_password(slug, password)` — reuses the same per-IP/per-event rate-limit shape from Phase 1 (shares the `guest_lookup_attempts` bucket), returns a session token on match. New `is_website_password_verified(slug, token)`.
- `expose_password_enabled_in_public_payload` — `get_public_website_payload` now also returns `password_enabled`.
- **Pre-existing bug found + fixed while wiring this in:** `is_website_gate_open()` already existed and already factored in `website_password_enabled` — but as a hard `return false` (site fully closed, no way back in), with no verification path ever built around it. Enabling password-protect would have 404'd the site for everyone, including the owner testing it. Fixed via `website_gate_offline_only_not_password` — the offline gate now only checks `site_offline`; password enforcement moved to the app layer (below), which is where the actual prompt+verify UX lives.

**App layer:**
- `app/api/events/[id]/website-settings/route.ts` — PATCH now accepts `website_password` (optional), hashes it server-side via the new RPC, stores into `website_password_hash`. Omitted/blank password on save leaves the existing hash untouched (upsert only sets columns present in the payload).
- `app/events/[id]/settings/website/WebsiteContent.tsx` — `handleSave()` now actually sends the typed password when the toggle is on and a value was entered; clears the field after a successful save (matches the existing "leave blank to keep current" helper copy).
- `app/api/e/[slug]/verify-password/route.ts` (new) — mirrors `lookup/route.ts` exactly: forwards real IP via `.setHeader`, maps rate-limit/error responses, sets an httpOnly `evz_site_pw` cookie (30-day, same pattern as the guest session cookie) on success.
- `app/e/[slug]/PasswordGate.tsx` (new) — guest-facing prompt, modeled on `GuestLookupForm.tsx`.
- `app/e/[slug]/page.tsx` — after fetching the public payload, if `password_enabled` is true, verifies the `evz_site_pw` cookie via `is_website_password_verified`; if invalid/missing, renders **only** `PasswordGate` — no site content, no guest-lookup form, nothing leaks pre-password.

**Live-verified (dev server + prod DB, test event `dheeraj-1-dheeraj-2-s-wedding-20260917`):** no cookie → password prompt renders, nothing else; wrong password → 401; correct password → cookie set, page now renders full site content; regression check on the offline-gate fix from earlier in this phase → still 404 correctly. Test settings row + session token cleaned up after.

**Known follow-up (not built, flagged not fixed):** `resolve_guest_by_lookup` (the name+phone guest-identification RPC) has no awareness of the password gate — a client that calls `/api/e/[slug]/lookup` directly (bypassing the website's password prompt UI entirely) can still obtain a valid guest session and full private-tier content if they already know/guess a guest's phone+name, even on a password-protected site. Closing this needs `resolve_guest_by_lookup` to also accept and check the `evz_site_pw` token when `website_password_enabled` is true. Deferred — same class of gap as the Phase 1 known limitation (defense-in-depth against a determined attacker with prior knowledge, not the primary threat model of "randoms browsing a public link").

### How to test Phase 2

**Offline gate:** Open your event → Website Settings → "Take website offline" → Take offline. Open the live site URL in an incognito window → should show a 404 / not-found page, not the site. Toggle it back online → site loads normally again within a page refresh.

**Live URL fix:** Open your event → Website (Overview tab). The URL card should show your real dev/prod domain + slug (e.g. `localhost:3000/e/your-slug` locally, or `evenzi.vercel.app/e/your-slug` in prod) — not `evenzi.app`. Click "Preview" — it should actually open the site. If the site is offline, the badge should say "Offline" (red) instead of "Live" (green).

**Password protection:**
1. Event → Settings → Website tab → turn on "Password protect website", type a password, Save.
2. Open the live site URL in incognito → should show a plain "Enter the password to continue" screen, nothing else (no hero, no pages, no guest lookup form).
3. Type the wrong password → error message, no access.
4. Type the correct password → site unlocks and shows real content.
5. Refresh the page → should stay unlocked (cookie persists) without re-entering the password.
6. Turn the toggle back off and Save → site should be reachable again with no prompt.

## Phase 3 — Pages panel parity — ✅ CLOSED 2026-08-05, no code changes needed

| Item | Finding | Decision |
|---|---|---|
| Reorder | Confirmed fully wired and already live: `PagesListClient.tsx` (up/down buttons, not drag handles, but functionally equivalent) → `PATCH /api/events/[id]/website-pages` (batch reorder, ownership-checked, optimistic UI with rollback on failure) | ✅ Keep as-is — decision 2026-08-05: don't relocate into Overview, current dedicated "Pages" tab is fully functional, relocation is cosmetic-only and not worth the rebuild cost right now |
| Hide/Show toggle | Confirmed fully wired: same file → `PATCH /api/events/[id]/website-pages/[pageId]` (`is_visible`, ownership-checked, optimistic with rollback) | ✅ Keep as-is — same decision as above |
| Add page / Remove page | Confirmed zero backend (no POST/DELETE route in either `website-pages` file); every event auto-seeds all 10 catalog pages on first visit, so there's no "not added" state | ✅ Dropped from scope — decision 2026-08-05: Hide/Show already covers the real need ("guest shouldn't see this page"), not worth reworking the auto-seed model for this |

### How to test Phase 3

Nothing changed, so this is just confirming the existing behavior still works:
1. Event → Website → Pages tab. Use the up/down arrows on any page row — order should update immediately and persist after a refresh.
2. Toggle the visibility switch on any page — badge should flip Visible/Hidden immediately, persist after refresh, and (for a page you set to Hidden) that page should disappear from the guest-facing site's nav at `/e/<slug>`.

## Phase 4 — Net-new UI (preview, share, cross-link) — ✅ DONE 2026-08-05, built by Cursor, reviewed by Claude

Delivered: `app/events/[id]/website/LivePreviewCard.tsx` (iframe-based, device toggle, matches the
recommended approach exactly — no duplicated hero-rendering logic), `ShareSiteDialog.tsx`
(copy-link, WhatsApp wa.me deep link, server-generated QR via the `qrcode` npm package — no
external QR API, no client-side QR JS, exactly as specced), `page.tsx` updated to wire both in.
Full QA screenshot set at `qa/website-overview-preview/` (mobile/desktop preview, share dialog at
1024px/360px, page at 360/768/1024/1440px, offline-404 check).

**Claude review (2026-08-05):** typecheck clean, lint clean, all CSS classes used
(`dp-card`, `wb-qr-panel` etc.) confirmed to exist in `designs/pages/website/website.css` and
confirmed present in the compiled `.next/static/css/app/layout.css` (i.e. actually shipped to the
live app, not just the static prototype — no missing-style risk). Visually inspected two
screenshots directly: live preview correctly shows the real event's hero content inside a phone
frame, share dialog shows a real URL, a real decodable QR code, and a correctly-encoded WhatsApp
link. No new backend routes added, no new status model introduced, Card Templates cross-link
correctly NOT built — all matches the handoff spec's Definition of Done.

Decision 2026-08-05: this was net-new UI, not a fix — routed to Cursor per this project's Delegation Gate rather than built inline. Handoff prompt used, kept below for reference. Card Templates cross-link stayed blocked either way (Digital Invitations backend has zero persistence — see `docs/NEXT-SESSION.md`).

### Cursor handoff prompt (as given)

```
ROUTING: Cursor, auto-mode (free NVIDIA NIM model is fine — this is UI composition, not novel logic).

OBJECTIVE & CONTEXT
Project: Evenzi — wedding/event planning SaaS. Next.js 14.2.5 App Router, TypeScript 5 strict,
React 18.3.1, Tailwind CSS 4, Supabase (Postgres). Repo root has a live design-system reference
at designs/shared/shell.css + designs/components.html — check both before writing any new CSS,
reuse existing primitives (clay-card, btn-pill / btn-pill-primary / btn-pill-secondary,
toggle-switch, seg / seg-item nav tabs, StatusBadge component at components/ui/StatusBadge.tsx).

Task: build two net-new UI pieces on the Website Overview page
(app/events/[id]/website/page.tsx, a Server Component) that exist in the design mockup but
were never built in React:
1. A "Live preview" widget (mobile/desktop toggle, shows what guests actually see)
2. A "Share" dialog (WhatsApp message + QR code + copy link)

Reference design (static HTML prototype, wireframe-level only — colors/spacing/exact layout
are NOT binding, free to match Evenzi's existing shell instead):
https://evenzi-official.github.io/Evenzi/pages/website/overview.html
Look at the "Live preview" card near the top and the "Site URL & Status" card further down
(has PREVIEW / PUBLISH / SHARE pill buttons, a copyable site URL row).

CURRENT STATE (already built, don't rebuild)
- app/events/[id]/website/page.tsx already fetches and computes: event.name, event.slug,
  liveUrl (full URL incl. protocol, via lib/url.ts getAppBaseUrl() + slug),
  liveUrlDisplay (same URL without the protocol, for display), siteOffline (boolean).
- The actual guest-facing site renders at app/e/[slug]/page.tsx — this is the real,
  fully-working public site (hero, pages, RSVP, gallery etc.), already gated correctly by
  site_offline (returns 404 when offline) and by an optional password gate
  (app/e/[slug]/PasswordGate.tsx, shows when the site has a password set and no valid session).

DEV SPEC

1. Live preview widget
   - Recommended approach: render an <iframe src={liveUrl}> inside a device-frame chrome,
     rather than re-implementing hero rendering separately — this guarantees the preview is
     always pixel-identical to what a real guest sees (any template/design change stays in sync
     automatically, no duplicate logic to maintain).
   - Add a mobile/desktop toggle (two icon buttons, phone_iphone / desktop_windows from Material
     Symbols, same icon font already used everywhere else — see any existing page for the
     className pattern) that resizes the iframe's container: ~375px wide with a phone-style
     rounded frame for mobile, full-width ~800px+ for desktop. Client-side state only
     (useState), no persistence needed.
   - Known caveat, not a bug: if the site is currently offline (siteOffline === true) or
     password-protected, the iframe will show the 404 / password-prompt page — same as the
     existing "Preview" link already does today. Don't try to bypass this; it's correct
     behavior (owner sees exactly what a guest would see right now).
   - Needs its own 'use client' component (e.g. LivePreviewCard.tsx), same pattern as the
     existing app/events/[id]/website/edit/PagesListClient.tsx or
     app/events/[id]/settings/website/WebsiteContent.tsx — Server Component page passes props
     down, client component owns the toggle state.

2. Share dialog
   - Trigger: a "Share" pill button (btn-pill pattern) that opens a modal/dialog (check
     designs/components.html for an existing modal primitive before building a new one).
   - Contents:
     a. Copy link — the site URL (liveUrl) in a read-only input/row + copy button using
        navigator.clipboard.writeText, same pattern already implemented in
        components/layout/Breadcrumb.tsx (icon swaps to a checkmark for 2s on copy — reuse
        that exact UX, don't reinvent).
     b. WhatsApp message — a textarea prefilled with something like
        "You're invited! View details & RSVP: {liveUrl}" (editable, ephemeral — do NOT persist
        this to the DB, this is session/component state only, out of scope for now). Below it,
        a "Share on WhatsApp" link using the standard wa.me deep link:
        https://wa.me/?text={encodeURIComponent(message)}
     c. QR code — encodes liveUrl. No QR library is installed yet
        (checked package.json — confirmed absent). Recommended: add the `qrcode` npm package
        (small, no runtime deps, can generate server-side) and generate the QR as a data URI
        directly in the Server Component (page.tsx) via qrcode's toDataURL(), then just pass
        the data URI string down as a prop and render it as a plain <img> — avoids adding any
        client-side QR rendering JS. Do not use a third-party API/CDN for QR generation
        (privacy — don't send guest URLs to an external service).
   - No backend routes needed for this phase — everything here is either already-available data
     (liveUrl) or purely client-side/ephemeral state.

3. Explicitly OUT OF SCOPE for this handoff (do not build)
   - Card Templates nav tab / cross-link promo — blocked on a separate Digital Invitations
     backend-wiring pass that hasn't happened yet (that feature currently has zero persistence).
   - A DRAFT/PUBLISHED/OFFLINE 3-state status model — this project already decided to keep the
     existing binary site_offline boolean (see Phase 2 in this same plan doc), don't add a new
     status enum or PUBLISH button that implies a separate publish action beyond what
     "Take website offline" toggle in Settings already does.
   - Any changes to the Pages panel (reorder/hide-show) — already fully built and intentionally
     staying on its own tab, not being moved onto this page.

TESTING
- Unit/integration: none required — this is presentational UI over already-fetched data, no
  new business logic to unit test.

VISUAL TESTING
- Screenshot the Live preview widget in both mobile and desktop toggle states.
- Screenshot the Share dialog open, with a real event's data (name + real liveUrl) visible.

UI/UX TESTING
- Confirm the mobile/desktop toggle actually changes the iframe frame size and is obviously
  the "current" state (active/selected styling on whichever icon is selected).
  - Copy-link button gives clear visual feedback on click (checkmark swap, matches Breadcrumb
  pattern) and the clipboard actually contains the correct URL.
- WhatsApp share link opens (or would open) wa.me with the correct pre-filled message including
  the real site URL — verify by inspecting the constructed href, not just clicking (avoid
  actually sending a WhatsApp message during testing).
- QR code image actually decodes back to the correct liveUrl (any phone camera or QR reader
  can confirm this quickly).
- Test with an event that has site_offline = true and confirm the preview iframe shows the
  expected 404 (not a broken/blank iframe) — this is correct behavior per the caveat above, not
  a bug to fix.

RESPONSIVENESS TESTING
- Test the whole Overview page (not just the new widgets) at 360px, 768px, 1024px, 1440px.
  The Live preview card and Share dialog must not cause horizontal scroll or overflow at any
  width — the mobile-frame preview especially needs to shrink gracefully on a narrow viewport
  rather than overflowing its card.

DEFINITION OF DONE
- [ ] Live preview widget renders on Website Overview, iframe shows the real guest site
- [ ] Mobile/desktop toggle works, visibly changes frame size
- [ ] Share dialog opens from a Share button, contains working copy-link, WhatsApp share link,
      and a QR code that decodes to the correct URL
- [ ] No new backend routes added (everything uses already-available liveUrl/siteOffline data
      or is purely client-side state)
- [ ] No new status/publish model introduced — untouched from Phase 2's decision
- [ ] Card Templates cross-link NOT built
- [ ] Typecheck + lint clean (npm run lint, npx tsc --noEmit)
- [ ] Screenshots provided at mobile + desktop for both new widgets
```

### How to test Phase 4 (once Cursor's build comes back for review)

1. Open Website Overview for a real event. Confirm the Live preview widget shows the actual site content (not a static mockup) and that toggling mobile/desktop visibly resizes it.
2. Click Share — confirm Copy Link copies the real URL, the WhatsApp link opens wa.me with your event's real URL prefilled, and the QR code scans to the correct URL from your phone.
3. Take the site offline (Settings → Take website offline) and reload Overview — the Live preview should now show the 404 state, not break or go blank. Bring it back online after.
4. Resize the browser to a phone width (or use devtools responsive mode) — confirm nothing overflows or causes horizontal scroll.

## Phase 5 — Quick dead-control sweep

| Item | Finding | Status |
|---|---|---|
| Font-pair dropdowns on Design page — no `onChange`, no save | **Bigger than planned**: `config.website_fonts` (the catalog `heading_font_id`/`body_font_id` reference) had **zero rows** — even a correct `onChange` handler would have had nothing valid to save. | ✅ Fixed — migration `seed_website_fonts_catalog` (8 rows: 4 fonts × heading/body role, matching the 4 fonts already hardcoded in `FontPicker.tsx`'s font list). New `FontPairSection.tsx` client component wraps both pickers with save-on-select → `PATCH /api/events/[id]/website-design` (route already accepted `heading_font_id`/`body_font_id`, just was never called). `design/page.tsx` now fetches the real catalog + resolves the event's current selection instead of two hardcoded `value=` strings. Live-verified: selected "Poppins" for Heading font, confirmed `PATCH` → `200`, confirmed DB row updated (`heading_font_id` resolves to "Poppins" via the catalog join), confirmed it survives a full page reload. |
| Get-started checklist — React has 4 items, 2 hardcoded `done: false` | Not started this session — deferred, see below | 🔴 Deferred |
| Dead buttons: "View live site" / "Modify all" / per-page Edit stubs (`href="#"`) | Not started this session — deferred, see below | 🔴 Deferred |
| Home/RSVP custom sections localStorage-only, undisclosed | Not started this session — deferred, see below | 🔴 Deferred |

**Pre-existing, unrelated environment bug found + fixed while verifying this:** `node_modules` was missing two packages that `package.json`/imports actually need — `resend` (direct dependency, just not installed) and `buffer` (transitive dependency of `@supabase/storage-js`, not even present in `package-lock.json`). Together these were breaking `npm run dev` for **any** page that touches the Supabase browser client (e.g. `/auth`) with a hard build-error overlay — not something either of us introduced this session, but it was blocking all further browser verification. Fixed: `npm install` (picked up `resend`) + `npm install buffer --save` (added the missing transitive dep explicitly, decision confirmed with you before installing). Both now present, dev server verified working end-to-end afterward.

**Remaining Phase 5 items deferred — not started this session** (get-started checklist wiring, dead button fixes, localStorage disclosure). Small and low-risk; pick up next session or hand to Cursor alongside Phase 4 if preferred.

### How to test Phase 5

**Font pair:** Event → Website → Design tab, scroll to "Font pair". Change Heading font and Body font via the dropdowns — no separate Save button, it saves on selection (look for "(saving…)" briefly in the label). Reload the page — your selection should still be there, not reverted to default.

**Environment fix (if you were hitting build errors before):** `npm run dev` should no longer show a "Build Error" overlay mentioning `buffer` or `resend` when visiting `/auth` or any Supabase-auth page.

## Phase 6 — Full design-parity pass (Overview + Design + Photos + Pages) — ✅ DONE 2026-08-05, built by Cursor, reviewed by Claude

**Claude review verdict: pass, high quality.** Typecheck clean on every touched/new file. Lint:
one error found (`react-hooks/set-state-in-effect` in `SectionEditor.tsx`) — verified via
`git show HEAD` that this predates today's session entirely, not a Cursor regression, left as-is.
Live-verified in browser (not just screenshots): Overview (8-item real checklist, new Site URL &
Status card, Live preview caption bug fixed), Pages tab (tier badges + eye icons, correctly
stayed off Overview), Design tab (Palette — 8 real options persisting correctly, Font — correctly
collapsed to 1 heading-only picker with fixed-Poppins-body note, Cover/OG — real R2 upload wired,
ownership-checked, magic-byte-verified, honestly labeled "crop UI coming later" rather than
silently shipping a stripped feature). One QA screenshot (`design-1440.png`) looked broken
(sections missing) — turned out to be a stale capture from mid-HMR-glitch, not a real bug;
re-verified live and it's correct.

**Notable good calls Cursor made under ambiguity:**
- RSVP collection toggle: found and reused a pre-existing `event_guest_settings.rsvp_enabled`
  column (from a mid-June migration) instead of adding new schema — exactly per instruction.
- Private content lock: implemented as an always-on, disabled toggle with an explanatory tooltip
  + link to the optional password setting, rather than a fake interactive control — correctly
  recognized this is already enforced by the guest-session architecture, matching this session's
  own earlier finding.
- Slug editing: added proper server-side validation (matching the client-side regex) and a real
  409-on-conflict path using the existing `events_slug_key` unique constraint — not just a
  client-side-only edit box.
- Card Templates cross-link: correctly not built anywhere. Photos page: correctly preserves and
  even doubles down on disclosing the Gallery-cover vs site-cover distinction in two places.

No fixes needed from this review. Zero DB migrations were made by Cursor — everything reused
already-existing schema (font/palette catalogs seeded ahead of time this session, RSVP/slug
columns discovered pre-existing).

Triggered by a live founder walkthrough comparing every page in `designs/pages/website/` against
the deployed/local React build, screenshot by screenshot. This is a bigger scope than Phases 1-5:
a near-full rebuild of the Website module's visual layer to match the design 1:1, not small fixes.

**Scope decisions confirmed with founder (2026-08-05), both reopen earlier calls in this doc:**
- Draft/Published status badge on Overview: **build it** (reopens Phase 2's "keep the simple
  boolean" call) — but implement by relabeling/restyling the *existing* `site_offline` boolean
  rather than adding a new column. No migration needed: `site_offline=true` → "Draft" badge,
  `site_offline=false` → "Published" badge. The "Publish" button and the "Visibility" toggle are
  two UI entry points to the same underlying flip, not two different concepts. If a genuine
  separate "temporarily paused after being published" state is wanted later, that's a new,
  explicitly-scoped follow-up — not bundled into this pass.
- Add page / per-row Delete on the Pages panel: **stays out of scope** (Phase 3's call stands) —
  apply the visual parity (tier badges, icons) but leave Hide/Show as the only page-level control.

**Already fixed tonight, ahead of this handoff (don't redo):**
- `config.website_palettes` seeded with all 8 real color stories + exact hex values pulled
  directly from `designs/pages/website/website.css` (migration `seed_website_palettes_catalog`).
  `swatch_hex` is a 3-element array `[primary, surface, ink]`; `css_tokens` is jsonb
  `{"primary":..,"surface":..,"ink":..}` — same shape, pick whichever's more convenient to read.
- `config.website_fonts` gained a 5th heading option, `Lora` (migration
  `add_lora_to_heading_fonts`) — the design's heading-font list is Poppins/Cormorant
  Garamond/Playfair Display/Lora/Inter (5), the catalog seeded earlier this session only had 4.

**Known structural mismatch, flagged not fixed — Cursor should resolve during this pass:**
the design has **one** font picker ("Heading font" — 5 options including Poppins itself; body
text always stays Poppins, not user-selectable). The current React `FontPairSection.tsx` (built
earlier tonight) has **two** pickers (Heading + Body), inherited from an earlier session's
`FontPicker.tsx` build that predates this comparison. Recommend collapsing to the design's
one-picker model as part of this pass — drop the Body picker, hardcode body font to Poppins in
the actual template rendering (confirm `app/e/[slug]` already does this or needs a small change).

### Cursor handoff prompt

\`\`\`
ROUTING: Cursor, auto-mode (free NVIDIA NIM model is fine — this is UI composition + wiring
against already-built API routes, not novel backend logic).

OBJECTIVE & CONTEXT
Project: Evenzi — wedding/event planning SaaS. Next.js 14.2.5 App Router, TypeScript 5 strict,
React 18.3.1, Tailwind CSS 4, Supabase (Postgres). This is a full visual/structural parity pass
for the "Event Website" module — bring the React implementation in line with the design
prototype, page by page. The design lives at designs/pages/website/*.html (read these directly,
they're wireframe-AND-visual reference here, not just wireframe-level — the founder wants close
visual fidelity, not just structural). Page-specific CSS/JS: designs/pages/website/website.css,
website.js. Shared shell: designs/shared/shell.css, shell.js, components.html.

Every design file lists its own module sub-nav order (Overview → Design → Photos → Card
Templates) and shares the same floating-nav / tool-rail / breadcrumb chrome — those are already
correctly built in React's layout, don't touch them. Focus on the page-body content.

CURRENT REACT STATE (what's already built — read before touching anything)
- app/events/[id]/website/page.tsx — Overview page. Already has: LivePreviewCard.tsx (iframe-
  based live preview, mobile/desktop toggle — built earlier tonight, matches design's Live
  preview card well), get-started checklist (4 items, 2 hardcoded `done: false` — needs real
  wiring, see below), Pages summary list (read-only), Live URL row with Preview/Share buttons
  (ShareSiteDialog.tsx already built — copy link, WhatsApp, QR code, all working).
- app/events/[id]/website/design/page.tsx + WebsiteDesignClient.tsx + FontPairSection.tsx +
  FontPicker.tsx — Design page. Has: template picker (6 disabled "Soon" placeholder cards + 1
  real "Cinematic Scroll" template — see TEMPLATE SYSTEM note below, this does NOT match the
  design's template model, don't try to force-fit it), font-pair section (2 pickers, needs
  collapsing to 1 per the structural-mismatch note above). Has NOTHING for: Palette picker,
  Cover image upload, OG/social-share image upload.
- app/events/[id]/website/photos/page.tsx + WebsitePhotosClient.tsx — Photos page. Currently a
  coming-soon-toast stub, no real upload backend wired (Dheeraj's note: "full upload backend not
  yet built"). Out of scope to build real upload in this pass — see PHOTOS PAGE section below for
  what IS in scope.
- app/events/[id]/website/edit/PagesListClient.tsx — the standalone "Pages" tab (reorder via
  up/down arrows, hide/show toggle — both fully backed by real API routes already). This STAYS
  its own tab — a past decision this session explicitly rejected moving it inline onto Overview.
  Needs visual parity only (see PAGES PANEL PARITY section).
- app/events/[id]/website/edit/[pageId]/page.tsx + 6 editor components (StoryEditor,
  ScheduleEditor, QAEditor, TravelEditor, WeddingPartyEditor, SectionEditor) — the per-page
  editor. SectionEditor.tsx already supports all 11 section types the design expects (heading,
  photo, photogrid, schedule, person, hotel, qa, divider, map, countdown, video) — confirmed by
  direct comparison, this file does NOT need new section types. Needs visual polish only (device
  toggle + preview-frame styling to match the design's `.dp-preview-frame`/`.dp-preview-stage`
  pattern already used elsewhere; page meta bar could show a tier badge like the design's
  `.dp-page-tier`).
- lib/url.ts (getAppBaseUrl), lib/supabase/server.ts, verifyOwnership patterns in every
  app/api/events/[id]/website-*/route.ts — all correct, reuse these, don't rebuild auth checks.

DB CATALOGS — already seeded tonight, ready to use
- config.website_fonts: 5 heading rows (Cormorant Garamond, Playfair Display, Poppins, Inter,
  Lora) + 4 body rows (same minus Lora — irrelevant once you collapse to 1 picker, see above).
- config.website_palettes: 8 rows (Brand Red, Blush, Ivory, Sage, Midnight, Sunset, Ocean,
  Marigold), each with swatch_hex array + css_tokens jsonb (primary/surface/ink hex).
- event_website_design table already has palette_id, heading_font_id, body_font_id,
  cover_image_key, og_image_key columns — all exist, none but the font ones are wired yet.
- app/api/events/[id]/website-design/route.ts PATCH already accepts palette_id — just needs a
  UI to call it, same save-on-select pattern as FontPairSection.tsx.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. OVERVIEW PAGE (app/events/[id]/website/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: designs/pages/website/overview.html (full file, already read this session — every
section below maps to a named section in that file).

a) Live preview card — BUG FIX ONLY: the caption text ("Public hero shows to anyone with the
   link...") currently overlaps/collides with the bottom of the preview frame instead of sitting
   cleanly below it (screenshot evidence from founder walkthrough tonight). Check
   LivePreviewCard.tsx's `.dp-preview-caption` positioning — likely a missing margin-top or the
   frame's height is computed wrong, causing the caption to render underneath instead of after.
   Don't rebuild this card, it's otherwise working well — just fix the overlap.

b) Get-started checklist — currently 4 hardcoded items (2 always `done: false` regardless of
   real state). Design has 8, all real-data-driven (see overview.html lines ~186-276,
   `.dp-gs-grid` / `.gs-tile`). Wire all 8 against real data, no new migration needed — tables
   already exist:
     - "Add a cover photo" → done when event_website_design.cover_image_key is set (or
       events.cover_image_url if cover upload isn't built yet this pass — see DESIGN PAGE
       section, cover upload may or may not land in this same pass, use whichever is live)
     - "Edit hero copy" → done when events.name + events.primary_date are both set (already
       true for essentially every event, matches "always done" reality)
     - "Add sub-events" → done when event_sub_events has ≥1 row for this event
     - "Add wedding party" → done when event_wedding_party_members has ≥1 row
     - "Set a site password" → done when event_website_settings.website_password_enabled is true
       (optional item — design shows it as skippable, chevron not checkmark even when unset is
       fine, but if set it should show done)
     - "Add Q&A" → done when event_qa_items has ≥1 row
     - "Upload first photos" → done when event_media has ≥1 row published for this event's
       gallery (or whatever the Photos page's real backing table ends up being — if Photos page
       upload isn't wired in this pass, this item can stay always-incomplete, that's honest)
     - "Preview & publish" → done when site_offline = false (i.e. "Published", per the status
       model decision above)
   Each tile links out per the design's href pattern — reuse those hrefs, they already point at
   real routes (#cover anchors don't exist yet since Design page doesn't have a cover section
   yet in React — either add matching id="cover" anchors when you build the Cover section, or
   point at `/website/design` without the anchor for now).

c) "Site URL & Status" card — NET NEW, doesn't exist in React at all. Build per
   overview.html lines ~279-348 (`.dp-url-h` section):
   - Status badge: "Draft" (site_offline=true) / "Published" (site_offline=false) — style using
     the existing StatusBadge component (components/ui/StatusBadge.tsx), map to whichever
     existing variant reads correctly (probably 'draft' / 'live').
   - Header action row: Preview (can reuse the existing "Preview" link that opens the live site
     in a new tab — already built), Publish (button — same action as flipping the Visibility
     toggle to true, PATCH site_offline=false via the existing
     app/api/events/[id]/website-settings route), Share (reuse the already-built
     ShareSiteDialog.tsx — don't rebuild it, just also surface a trigger here if useful, or
     leave Share only in the existing Live URL row if that's redundant — founder call on
     whether both rows need it, default to not duplicating).
   - Editable URL row: slug display + copy button (reuse the copy-to-clipboard-with-checkmark
     pattern from components/layout/Breadcrumb.tsx) + edit-slug pencil icon (this needs a new
     small PATCH to events.slug — check for slug uniqueness/collision handling, look at how
     slug is originally generated at event creation for the validation pattern to reuse).
   - Visibility / RSVP collection / Private content lock — 3 toggle rows
     (`.dp-status-list` / `.dp-status-row`):
       - Visibility → site_offline (inverted: toggle ON = site_offline FALSE)
       - RSVP collection → NEW concept, no backing column currently found this session. Check if
         one exists before assuming a migration is needed; if not, this may need a small
         addition to event_website_settings (e.g. `rsvp_enabled boolean default true`) — flag to
         founder before adding a column if you don't find one, don't add DB schema silently.
       - Private content lock → per this session's Phase 2 finding, this is likely ALREADY
         enforced implicitly by the existing guest-session architecture (private-tier pages
         already require a resolved guest session). This toggle may just need to reflect real
         state (always effectively "on" given how private-tier gating already works) rather than
         needing new backend logic — confirm, don't assume a gap exists.

d) Card Templates teaser card — STAYS OUT OF SCOPE. Don't build it. Same reason as the Design
   tab's "Card Templates" nav item — the underlying Digital Invitations backend has zero
   persistence (see docs/NEXT-SESSION.md), promoting it would surface a feature that doesn't
   save anything.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. PAGES PANEL VISUAL PARITY (app/events/[id]/website/edit/PagesListClient.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stays on its own "Pages" tab (confirmed, not moving to Overview). Reference:
overview.html lines ~370-507 for the visual pattern (`.dp-page-list` / `.page-list-row`) — the
STRUCTURE (own tab) doesn't change, just match the ROW STYLING:
  - Drag handle icon (`drag_indicator` Material Symbol) instead of/alongside the current up/down
    arrow buttons — keep the up/down arrows too if true drag-and-drop reordering is out of scope
    for this pass (up/down is a fine accessible fallback, the design's own row still has
    `aria-disabled="true"` on the drag handle with "keyboard reorder coming soon" — so the
    design ITSELF doesn't have working drag yet either, don't feel obligated to build real
    drag-and-drop).
  - Tier badge next to the page name: `.dp-page-tier.dp-tier-public` (green "Public") or
    `.dp-page-tier.dp-tier-private` (red "Private", with a small lock icon) — this data already
    exists (the `tier` field already fetched in PagesListClient's page shape, just not
    displayed).
  - Visibility icon: replace the current toggle-switch with an eye / eye-off icon button
    (`visibility` / `visibility_off` Material Symbol) per the design — same underlying
    is_visible PATCH call, just a different control visual. (Founder-confirmed: no per-row
    delete button, no Add-page button — those stay out per the Phase 3 decision.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. DESIGN PAGE (app/events/[id]/website/design/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: designs/pages/website/design.html (full file, already read — 4 left-column cards in
order: Template, Palette, Heading font, Cover & OG image; sticky right-column Live preview).

a) TEMPLATE SYSTEM — flag, don't force a fix. The design assumes a multi-template gallery (5
   static templates under designs/pages/website/templates/: bold-festive, classic-romance,
   garden-soft, midnight-elegant, minimal-modern). React has built ONE real, different template
   ("Cinematic Scroll", a video-scroll experience) that isn't part of that 5-template set, plus
   6 disabled "Soon" placeholder cards for a DIFFERENT theme concept (Classic/Modern/Garden/
   Golden/Midnight/Heritage — different names, no real content). These are two different product
   directions, not a simple visual mismatch — do not delete the working Cinematic Scroll
   template or try to reshape it into the design's card format. Leave the Template section as-is
   functionally; only restyle the CURRENT-template summary card (thumbnail + name + blurb +
   "Change template" link, per design.html lines ~150-180 `.dp-current-template`) to visually
   match if it's a quick win, but the underlying template catalog strategy is a product decision
   outside this pass's scope — flag it back to the founder rather than guessing.

b) Palette card — NET NEW. Build per design.html lines ~183-280 (`.dp-tile-grid-sm`,
   `.dp-palette-tile`). Fetch config.website_palettes (already seeded, 8 rows), render as a
   radio-group grid of swatch tiles (3-color swatch strip + name + selected checkmark), save-on-
   select via PATCH .../website-design with palette_id — same pattern as FontPairSection.tsx,
   copy that component's structure. Use the css_tokens or swatch_hex data for the swatch colors,
   don't hardcode hex values in the component (they're already in the DB specifically so this
   isn't hardcoded).

c) Font section — COLLAPSE to 1 picker per the structural-mismatch note above. Body text is
   fixed to Poppins (design copy: "Body text stays Poppins for clarity — your headings define
   your style"). Drop the second (Body font) FontPicker instance from FontPairSection.tsx, keep
   only Heading font wired to heading_font_id. Confirm/set body font rendering in the actual
   guest-facing template (app/e/[slug]/page.tsx or wherever body font-family is applied) to
   always use Poppins regardless of any stored body_font_id — the column can stay in the schema
   unused, don't drop it, just stop surfacing it as a user choice.

d) Cover & social-share image card — NET NEW, and the biggest single item in this pass. Build
   per design.html lines ~332-416 (`#cover` section) + the two crop modals (`#dp-cover-crop-
   modal`, `#dp-og-crop-modal`, lines ~474-540):
   - Cover: image preview (16:9), "Replace cover" button opens an upload+crop modal (drop-zone →
     crop stage with a zoom slider → Apply), shows file metadata (format/dimensions/size) below.
     Empty state: dashed dropzone prompting "Add a cover photo".
   - OG/social-share: toggle "Use a custom social-share image" (default off — auto-derives from
     cover, cropped to 1.91:1); when on, shows its own upload+crop modal (same pattern, different
     aspect ratio).
   - STORAGE: this project already has a working presigned-upload + magic-byte-verification R2
     pipeline for Media & Memories (see app/api/events/[id]/media/* routes, and
     docs/data-model/DATA-MODEL.md for the pattern) — reuse that exact upload flow rather than
     inventing a new one. Store the resulting object keys in event_website_design.cover_image_key
     / og_image_key (columns already exist, just unused).
   - Real image cropping (the zoom slider + crop stage in the design) can be a real crop library
     (e.g. react-easy-crop, check it's not already installed before adding) or, if time-boxed,
     a simpler "upload only, no crop UI" first pass with a note back to the founder that crop-on-
     upload was deferred — founder's call which fidelity level to ship first, flag it rather than
     silently shipping a stripped-down version without saying so.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. PHOTOS PAGE (app/events/[id]/website/photos/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: designs/pages/website/photos.html (full file, already read). Real upload backend is
explicitly OUT of scope for this pass (Dheeraj's prior note: coming-soon toast is intentional
until Media & Memories sync lands — this page's own copy says "When Media & Memories launches,
your event's shared albums will sync here automatically"). In scope for THIS pass:
   - Note the design's `.dp-tip-banner` copy exactly: this page's photos are explicitly
     DIFFERENT from the "Gallery cover" mentioned in design.html's Cover section ("Your Gallery
     cover is separate from the site cover, set in Design") — i.e. there are TWO distinct cover
     concepts: site/hero cover (Design tab, built in section 3 above) and a Gallery-specific
     cover (this page). Don't conflate them into one control.
   - If real upload isn't landing this pass, at minimum restyle the current coming-soon state to
     match the design's card structure/copy (`.dp-photos-card`, `.dp-tip-banner`) so it reads as
     intentional rather than broken, and keep the "link to Media section" behavior Dheeraj
     already built.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. PER-PAGE EDITOR (app/events/[id]/website/edit/[pageId]/page.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Reference: designs/pages/website/edit-page.html (full file, already read). Good news: this file
is already close — SectionEditor.tsx already supports all 11 section types the design expects
(confirmed by direct code comparison this session), so no new section-type work is needed here.
In scope:
   - Page meta bar: add a tier badge (`.dp-page-tier`, same component as Pages panel section 2)
     next to the page name, and a "Saved" indicator (`.ep-saved`, cloud_done icon) if there isn't
     one already reflecting real save state.
   - Preview panel: align its device-toggle + frame styling with the pattern already built in
     LivePreviewCard.tsx / the Design page's preview (`.dp-preview-stage`, `.dp-preview-frame`,
     `.device-toggle`) for visual consistency across all 3 preview instances in this module.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUT OF SCOPE — do not build in this pass
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Card Templates nav tab / cross-link (Overview teaser + Design tab nav item) — Digital
  Invitations backend has zero persistence, don't promote a feature that doesn't save anything.
- edit-pages.html — the design's own notes mark this as "retired → redirects to overview.html",
  it's dead in the design itself, no React equivalent needed.
- Real drag-and-drop reordering — the design's own drag handles are `aria-disabled="true"` with
  "keyboard reorder coming soon", i.e. not even built in the design. Up/down arrows are fine.
- A genuine 3-state (Draft/Published/Paused) status model — the founder-approved approach reuses
  the existing site_offline boolean with different labels, see the status-model note above.
- Real image cropping is nice-to-have, not required — see the Cover section note on flagging
  fidelity trade-offs rather than silently shipping less.
- templates/ subfolder (5-template gallery + detail pages) — separate from this pass, tied to
  the TEMPLATE SYSTEM flag above; don't build a new template gallery without a founder decision.

TESTING
No new business logic beyond what's noted above (RSVP-collection column, if it doesn't already
exist) — everything else is UI + already-existing API routes. Standard unit tests not required.

VISUAL TESTING
Screenshot every page (Overview, Design, Photos, Pages tab, one per-page editor) at both a
populated-data event and an empty/fresh event, so both states are visible.

UI/UX TESTING
- Get-started checklist: verify all 8 items reflect real done/not-done state against actual
  event data (add a sub-event, confirm that tile flips to done; etc.) — don't ship items that
  are cosmetically wired but not actually checking real data.
- Status badge + Publish button + Visibility toggle: confirm all three stay in sync (flipping
  one updates the other two without a page reload where reasonably possible).
- Palette picker: confirm selecting a palette actually persists (reload test, same pattern
  already verified for the font picker this session).
- Cover upload (if built): confirm the uploaded image actually appears in a real, unauthenticated
  guest-facing preview, not just in the host-side editor.

RESPONSIVENESS TESTING
Every page in this pass at 360px, 768px, 1024px, 1440px — this module has historically had
mobile overflow issues (the live-preview caption bug found tonight was one instance), so treat
narrow-width testing as a first-class requirement, not an afterthought.

DEFINITION OF DONE
- [ ] Live preview caption overlap bug fixed
- [ ] Get-started checklist shows 8 real items, all backed by real data checks
- [ ] Site URL & Status card built: Draft/Published badge, Publish button, editable URL +copy,
      Visibility/RSVP/Private-lock toggles (RSVP-collection backing confirmed or flagged, not
      silently added as a new column)
- [ ] Pages panel (own tab): tier badges + eye-icon visibility control added, no Add/Delete
- [ ] Design page: Palette picker built + persists; Font section collapsed to 1 picker (body
      fixed to Poppins); Cover & OG image section built (or upload deferred with an explicit
      flag back to the founder, not silently shipped incomplete)
- [ ] Template system mismatch flagged back, not silently "fixed" by deleting real work
- [ ] Photos page: Gallery-cover vs site-cover distinction preserved, no upload backend required
- [ ] Per-page editor: tier badge + preview-frame visual consistency
- [ ] Card Templates cross-link NOT built anywhere
- [ ] Typecheck + lint clean
- [ ] Screenshots at all 4 breakpoints for every touched page
\`\`\`

### How to test Phase 6 (once Cursor's build comes back for review)

1. Walk every page in the Website module (Overview, Design, Photos, Pages tab, one per-page
   editor) side-by-side with its design file — this session's screenshots are a good starting
   comparison set.
2. Toggle Visibility on Overview and confirm the Draft/Published badge and the "Take website
   offline" toggle in Settings stay in sync (same underlying flag, verify no drift).
3. Pick a palette and heading font, reload, confirm both persisted.
4. If Cover upload landed: upload a cover, open the event's real public site in an incognito
   window, confirm the new cover actually renders there.
5. Resize to 360px on every touched page — this module has a history of overflow bugs tonight,
   check carefully.

## Notes

- The nav-tab swap (Pages ↔ Card Templates) isn't its own phase — it resolves naturally once Phase 3 (Pages goes inline on Overview) and Phase 4 (Card Templates gated on the Invitations backend landing) are both done.
- Given tight weekly token budget at time of writing (92% used), work should proceed phase-by-phase with explicit go-ahead per phase, not as one large batch.
- Related memory: `project_domain_strategy.md` (evenzii.com / app.evenzii.com), `project_dynamic_checklist_system.md` (platform-wide checklist idea, parked).
