# Event Settings Cleanup — Design

> Cleanup + wiring pass across `app/events/[id]/settings/**` (General, Website, Registry, Guests, Billing, Admins tabs), plus two app-wide shared primitives (tiered collaborator permissions, a full-page busy overlay) and two global dead-pill fixes (ToolRail LIVE status, Host Dashboard Collaborations tab) that surfaced while tracing the Admins tab. Scoped from the 2026-08-03/08-05 "V0 Readiness" deep-wiring audit plus a live founder walkthrough of the settings pages on 2026-08-06, corrected against current repo state (several audit findings were already fixed as a side effect of the 08-05 Digital Presence pass) and a follow-up backend sweep that found two live IDOR bugs.

| | |
|---|---|
| **Date** | 2026-08-06 |
| **Author** | Abhijith (+ Claude) |
| **Status** | Design — pending user review before plan |
| **Prerequisite work already done, same session** | Two IDOR bugs fixed and typechecked before this spec was written — see §0. Not gated on this spec's approval. |

---

## 0. Already fixed this session (not part of the plan — reference only)

A backend sweep of the settings API routes, done while scoping this spec, found two live security bugs of the exact class already fixed in `website-settings/route.ts` on 2026-08-05 (missing per-event ownership check → IDOR):

- `app/api/events/[id]/guest-settings/route.ts` — PATCH had no `verifyOwnership()` call. Any authenticated user could overwrite another event's RSVP/plus-ones/dietary/default-message settings by guessing an `event_id`.
- `app/api/events/[id]/general-settings/route.ts` — same gap, same fix. Any authenticated user could overwrite another event's tagline/dashboard-visibility fields by ID.

Both fixed by adding the identical `verifyOwnership()` helper already proven in `website-settings/route.ts`. Typecheck + lint clean. Live two-account verification (confirm a non-owner gets 404, owner still succeeds) should happen during this pass's testing phase (§7), since it wasn't done live yet — the fix is code-identical to an already-verified pattern, not independently re-verified against the running app.

---

## 1. Corrections to the source audit (read before the rest of this doc)

The 2026-08-03 audit (fix-pass-updated 08-05) has two stale findings on the Event Settings card, both fixed as a side effect of unrelated 08-05 Digital Presence work that happened to touch the same files:

- **"Password field never sent to the API"** — false. `WebsiteContent.tsx:56-57` sends `website_password`; `website-settings/route.ts:77-85` hashes it via `hash_website_password` RPC and stores `website_password_hash`. Built as part of the 08-05 password-protection feature.
- **"Settings never enforced by the public route"** — false. `event_website_settings` is the real, live-enforced table: `is_website_gate_open()` reads `site_offline` and `website_password_enabled` straight from it (`DATA-MODEL.md` §Wave 2a), and `get_public_website_payload()` calls that gate before returning anything. Not a duplicate/legacy surface.

Everything else below is current, verified against the running code on 2026-08-06 (not just the audit).

## 2. Website tab — strip the duplicate surface, don't rebuild it

`app/events/[id]/settings/website/WebsiteContent.tsx` has a "Pages" section listing 4 hardcoded page rows (`const PAGES = [...]`, fake `Published`/`Draft` statuses, never reads `event_website_pages`) plus a "View live site" link and per-page "Edit"/"Modify all" controls, all `href="#"`. This entire block duplicates `app/events/[id]/website/` (the Digital Presence host editor), which already has a real, 08-05-rebuilt Pages tab (tier badges, real data) and a real Site-URL-and-status card with a working live link (`getAppBaseUrl()` + `events.slug`, `SiteStatusCard.tsx`).

**Fix:** delete the "Pages" section and the "View live site" link from `WebsiteContent.tsx` entirely. Replace with a single "Manage your website →" link to `/events/[id]/website`. `WebsiteContent.tsx` keeps only what's genuinely account-level-website-setting, not page-content: password protect, search indexing, announcement banner, take-offline, website-expiry countdown. This is a deletion + one link, not new backend work.

## 3. Registry tab — honest stub, not a build

`RegistryContent.tsx`'s "Add link" and "Create fund" both use `setTimeout` to fake a success toast — zero persistence anywhere (no table, no API route, not even localStorage). "Create a cash fund" additionally implies holding and paying out guest money (UPI/bank transfer per its own copy) — the same category of work blocked behind LLP registration + GST + a current account, same as Plan & Billing's "Upgrade now".

**Fix:** relabel the whole tab as not-yet-available, same pattern as Guest Management's "Send invites" (disabled control + honest tooltip/copy, not a silently-fake success state). No new table, no new API route, no partial build (i.e. don't wire the link-only half for real — both features move together so the tab reads as one coherent "coming soon" state rather than one real control next to one fake one).

## 4. Guests tab — backend enforcement only (correction: no guest RSVP form exists yet)

`event_guest_settings.allow_plus_ones` / `.collect_dietary_notes` persist correctly but nothing downstream reads them — confirmed `app/api/e/[slug]/rsvp/route.ts` accepts `plus_one_count` and `dietary_notes` unconditionally regardless of the host's toggle state.

**Correction found while planning:** there is no guest-facing RSVP submission form anywhere in the live guest site. Traced `app/e/[slug]/page.tsx` fully — after `GuestLookupForm` identifies a guest, the page only renders a "Welcome, {name}" banner. Nothing in `app/e/**` calls `POST /api/e/[slug]/rsvp`. The route is real and live (Wave 2b), but no UI exists yet that calls it. (`app/wedding-invitation-temp-1/` matches "/rsvp" in a repo-wide search but is the unrelated design-test page per `CLAUDE.md`, not the real site.)

**Fix, scoped down accordingly:** `app/api/e/[slug]/rsvp/route.ts` reads `event_guest_settings` for the event before accepting the submission; rejects the request (400) if `plus_one_count` is present while `allow_plus_ones=false`, or `dietary_notes` is present while `collect_dietary_notes=false`. This is backend-only hardening — makes the route safe for whenever a guest RSVP form does get built. **Building that guest-facing RSVP form is explicitly out of scope for this pass** (§10) — it's a real Digital Presence feature (guest-facing UI, not a settings-tab fix), materially bigger than this cleanup, and should get its own spec.

## 5. Billing tab — no code change, but fix the two dead buttons

"Upgrade now" is out of scope — no payment system exists anywhere in the repo, and building one needs a registered entity, GST, and a current account first (per the launch-readiness backlog). Leave it exactly as-is.

**Fix (small):** "Contact support" (Billing + General tabs) and the two "guide" buttons found in the sweep (Admins tab "Read the guide", Guests tab "View the guide") all get the same treatment — reuse the existing `mailto:evenzi.official@gmail.com` pattern already live in `PageFooter.tsx:19`. Four dead buttons, one existing pattern, no new infrastructure.

## 6. General tab — four small fixes, one field removed

- **Native date input** (`GeneralSettingsForm.tsx:244-250`, `<input type="date">`) renders the OS-default light calendar popup against the dark UI — nothing in `app/globals.css` sets `color-scheme`. Fix: add `color-scheme: dark` (scoped to the form input, or site-wide if other native date/time inputs exist — confirm at plan time) so Chromium-based browsers render a dark-themed native picker. Safari's picker styling is more limited; accept whatever Safari does by default rather than building a custom picker component for this pass.
- **"Show this event on my dashboard"** (`show_on_dashboard`) — written by the form, never read by `app/home/page.tsx` or `EventsGrid.tsx`'s filter logic, and even if wired there's no "Hidden events" view or any other path back to a hidden event once it's off the dashboard. Remove the toggle from the UI and stop sending `show_on_dashboard` in the save payload. Leave the column in `event_general_settings` as inert (no migration) — note it in `DATA-MODEL.md`'s decision log as unused-by-design, not silently dropped.
- **`discoverable`** field — found in the sweep: fully wired round-trip (read on load, sent on every save) but no UI control anywhere ever sets it. Same treatment as `show_on_dashboard` — remove from the save payload and the Zod schema on `general-settings/route.ts`, leave the DB column inert, note in `DATA-MODEL.md`.
- **Dual-save partial failure** (`handleSave` fires `PUT /api/events/[id]` and `PATCH .../general-settings` via `Promise.all`, one can fail while the other succeeds, generic toast either way) — fixed as part of the busy-overlay work in §8, not as a standalone change. The busy-overlay's error-state design should surface which half failed, or the two calls should be sequenced/rolled back together — decided at plan time, not this doc.

**Footer 404s** (Privacy/Terms `href="#"`, no `/legal/*` route exists anywhere, same finding as Landing Section's audit card): flagged only, not fixed in this pass. Needs real legal pages, which is its own body of work (content + routing), not a settings-tab fix.

## 7. Admins tab + co-host permissions — the one real feature build in this pass

Three things, scoped together because they're the same surface and the same underlying gap:

1. **Tiered permissions.** `event_collaborators.role` is currently a cosmetic label — the invite modal already offers 4 options (`Co-host`, `Photographer`, `Planner`, `Viewer`, `AdminsContent.tsx:198-201`) but nothing anywhere checks it. Build:
   - **Co-host** = full parity with the owner, except Billing/Plan changes and Delete-event.
   - **Planner** = Planning (checklist + budget) + Guests + Event Hub read/write. No Website, Billing, or Admins access.
   - **Photographer** = Media & Memories only.
   - **Viewer** = read-only everywhere the above roles can reach.
   - One shared access-check helper (server-side, replacing the scattered `verifyOwnership`-style checks across every route that currently checks `events.user_id = auth.uid()` only) that returns the caller's effective role + a capability set, consulted by every route this touches. RLS policies on the relevant child tables get the equivalent collaborator-aware predicate. **This is the largest single item in the spec** — exact route inventory + RLS policy list to be enumerated at plan time (candidates identified so far: `website-settings`, `guest-settings`, `general-settings`, `admins`, planning routes, guest routes, media routes — likely 15-20+ routes given the app's size).
   - Owner-only actions (Delete event, Plan & Billing) stay hardcoded to `events.user_id` regardless of role.

2. **Remove/demote a collaborator.** Confirmed in the sweep: no UI control and no `DELETE`/`PATCH` route exist for this at all (the role-edit pencil in `AdminsContent.tsx` is `disabled`, labeled "coming soon"). Build both — needed the moment tiered roles exist, otherwise a host can invite but never fix a wrong role or remove access.

3. **Real invite-row id.** `AdminsContent.tsx:54-62` currently appends the new collaborator to local state with a client-fabricated `crypto.randomUUID()` — the POST response only returns `{ success: true }`, not the real row. Harmless today because nothing acts on the id, but it will silently target the wrong row the moment (2) ships. Fix: `POST /api/events/[id]/admins` returns the real inserted row's id; client uses that instead of fabricating one.

4. **Host Dashboard Collaborations tab.** `app/home/EventsGrid.tsx` — `collabActive`/`collabPast` are hardcoded to `[]`. An accepted co-host currently has zero path back to an event they collaborate on (invite email + accept-invite flow work, per Dheeraj's 08-03 pass, but the dashboard never queries for events where the caller is an active collaborator). Fix: `app/home/page.tsx`'s server-side fetch adds a query for events where the caller has an `event_collaborators` row with `status='active'`, passed into `EventsGrid` alongside owned events.

## 8. Two shared primitives (app-wide, not settings-local)

**ToolRail LIVE status.** `components/layout/ToolRail.tsx:40-45` + `app/events/[id]/layout.tsx:39` — `isLive` is a hardcoded `true` boolean, not derived from anything, and the pill is `aria-hidden="true"` with no link. Fix: `layout.tsx` fetches the event's real gate state (`is_website_gate_open()` or an equivalent read of `event_website_settings.site_offline`) and passes the real boolean; `ToolRail` renders green + "LIVE" when true, red/muted + "OFFLINE" when false, and wraps the pill in a link to the live URL (`getAppBaseUrl()/e/[slug]`) — only when live; offline state is not a link (nothing to visit).

**Full-page busy overlay.** No such component exists anywhere in the codebase (confirmed by search). Every Save/Delete action today only disables its own button — the rest of the page (nav, other controls) stays interactive during the request, the same class of race already fixed once for User Settings' unload-during-save bug. Build one reusable component (viewport-covering overlay, blocks all pointer/keyboard interaction including nav, a11y: `aria-busy`/focus-trap while open) and wire it into every Save-triggering control across the 6 settings tabs (inventory from the sweep: General's Save + Delete-confirm, Website's Save + Take-offline, Guests' Save, Admins' Send-invite) plus the Delete-event confirmation modal specifically named by the founder. Built once as a shared primitive under `components/`, catalogued in `designs/components.html` per the reuse-before-create rule — future pages adopt it without rebuilding.

## 9. New tab — Usage (per-event)

New sixth-becomes-seventh tab in `app/events/[id]/settings/usage/`, scoped to this event only (plan is assigned per-event via `events.plan_id`, not per-user):

- Storage used — real, same `event_media` aggregate already computed for Media & Memories' storage meter (`sum(byte_size)`), against the same hardcoded 5GB limit (`STORAGE_LIMIT_BYTES` in `MediaClient.tsx` — reuse, don't reimplement).
- Guest count — real, `event_hub_summary` view already has this.
- Plan tier + perks — reuse `billing/page.tsx`'s existing `config.plans` read pattern.
- Task/budget completion snapshot — reuse `event_hub_summary`'s existing task-progress and budget-percent fields (already computed for the Event Hub's stat tiles).

No new backend — every number this tab needs is already computed somewhere else in the app. This is a read-only aggregation page, not a new data model.

## 10. Explicitly out of scope

- Guest-facing RSVP submission form (`app/e/[slug]`) — doesn't exist yet, discovered while planning §4. Backend enforcement ships in this pass; the actual form is its own Digital Presence spec.
- Legal pages (`/legal/*`) — flagged (§6), not built.
- Payment gateway / real "Upgrade now" — blocked on LLP registration, tracked separately in the launch-readiness backlog.
- Registry's real backend (link or cash fund) — deferred per §3.
- Digital Invitations, Support Chatbot, Admin (developer) Module — untouched, not part of this pass.
- Deep RLS audit beyond what tiered permissions requires — this spec scopes the collaborator-aware access layer for the routes this pass touches plus whatever else is discovered necessary to make tiered roles actually work; it does not promise a full-codebase security audit.

## 11. Testing plan

- **IDOR fixes (§0):** live two-account test — non-owner authenticated user hits both PATCH routes with another event's id, confirm 404; owner still succeeds.
- **Tiered permissions (§7):** for each of the 4 non-owner roles, confirm both the allowed surface works and the disallowed surface correctly 403s/404s/hides in the UI — this is the highest-risk item in the pass and needs the most deliberate test matrix at plan time.
- **Registry/Billing stub relabels:** confirm no `fetch` calls fire, honest copy renders, matches the Send-invites precedent visually.
- **Website tab strip:** confirm the "Manage your website →" link lands on the right event, no broken references to the deleted Pages section elsewhere.
- **Busy overlay:** confirm it blocks nav-away and other button clicks mid-save on at least General (dual-save case) and one single-save tab; confirm it releases correctly on both success and error.
- **ToolRail:** toggle site online/offline from Website tab, confirm the pill updates without a full reload where reasonable, and that clicking it while live opens the real URL.
- **Usage tab:** spot-check numbers against Media's existing storage meter and Event Hub's existing stat tiles for the same event — should match exactly since both reuse the same source data.
- Standard project pattern: live-browser testing at 6 breakpoints before whole-branch review, per every prior feature pass in this project.

## 12. Explicitly the largest unknown

§7's permission system is a materially bigger build than everything else in this spec combined — it touches RLS policies and every route currently doing owner-only checks. The plan phase should size this as its own task group (likely its own subagent-driven build with a review gate per task, same pattern as Guest Management/Planning Tools), not treated as equal-weight to the other, much smaller items in this spec.
