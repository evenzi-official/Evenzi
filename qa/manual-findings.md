# Manual testing findings (founder pass) — 2026-06-23

> Collected during manual walkthrough. **Do not fix until the founder says "done".**

## M1 — Loading states: use the skeleton primitive + kill unnecessary loading
- **Where:** Create wizard Step 1 (`/events/create`) shows a generic spinner "Loading event types…".
- **Issue A (loading style):** uses a hand-rolled spinner instead of the shell **`.skeleton`** primitive (`designs/components.html §14`, `window.evenzi.setLoading`). Rule: **anything that loads should use the skeleton** (here: SK3 event-card template).
- **Issue B (why is it loading at all):** `app/events/create/components/Step1EventType.tsx:17-22` is a client component that fetches `/api/event-types` in `useEffect` after mount → browser→API→DB round-trip on every visit. The catalog is tiny/static → should be **server-rendered (or cached)**, eliminating the loading state entirely.
- **Fix direction:** (a) server-render the event-types (page/wrapper fetches, passes as initial props) to remove the spinner; (b) for any genuinely-async region, swap to the `.skeleton` template — apply this rule app-wide, not just here.
- Severity: Medium (UX + perf). Note: founder observed on `evenzi.vercel.app` (prod/`main`) — our fixes land on the Dev-Vibe branch (`0e72a70`).

## M2 — Cover-photo upload: wrong styling + ignores the existing drop-zone design
- **Where:** Create wizard Step 2 (`/events/create?step=2`), "Cover photo (optional)" upload box (`app/events/create/components/Step2BasicDetails.tsx`).
- **Issue A (theme clash):** renders as a **bright white panel on the dark theme** — visually wrong, inconsistent with every other surface.
- **Issue B (reuse-before-create):** hand-rolled upload box; the design system already has a cataloged **drop-zone primitive** for exactly this — **`.dp-dropzone`** (single) / **`.dp-dropzone--multi`** (W4 in `designs/components.html`), with dark/brand styling, drag-and-drop, and drop-rejected + hero states. Empty-state pattern: `.photo-tile` + `.photos-empty` (W5).
- **Fix direction:** replace the white box with the `.dp-dropzone` primitive (single-file, image upload), inheriting shell tokens. Wire to the existing `/api/events/cover` upload.
- Severity: Medium (design fidelity + reuse).

## M3 — Create wizard Step 2 form fields don't match the design
- **Where:** `/events/create?step=2` (`app/events/create/components/Step2BasicDetails.tsx`) vs `designs/pages/create-event/step-2-details.html`.
- **Mismatches:**
  - **Missing field: "Event Title"** — design has a top full-width "EVENT TITLE" field (e.g. "Smith-Jones Wedding Gala"). Built form has none — it auto-derives the name as "P1 & P2's Wedding". Decide: add explicit title field (per design) vs keep auto-derive.
  - **Label + required mismatch:** design "PARTNER ONE'S NAME" / "PARTNER TWO'S NAME" (no asterisk / optional); built "PARTNER 1 NAME *" / "PARTNER 2 NAME *" (required). Align labels + required-ness with design.
  - **Grid order differs:** design = Title(full) → Partner1 | Partner2 → Date | Guests → Venue(full). Built = Partner1(full) → Partner2 | Date → Guests → Venue.
- **Note:** these fields are driven by `config.event_types.field_schema` (Wedding) — matching the design may require updating the seeded `field_schema` (add event_title, relabel) AND the form layout, not just CSS.
- Severity: Medium (design fidelity; possible data-model touch).

## M4 — Event date picker: use the design calendar + add validation
- **Where:** Step 2 "Event date" field (`Step2BasicDetails.tsx` date control).
- **Issue A (design):** built renders a segmented `DD/MM/YYYY` input with a **bright white** calendar popover (theme clash). The design has a dark-themed "Pick a date" field + brand-red calendar icon + a **dark branded calendar** popover (`step-2-details.html` — already greys out past dates). Use the design's calendar.
- **Issue B (validation — NEW RULE):** event date must be **>= today** (no past dates) and **<= today + 5 years** (max). Enforce in the picker (disable out-of-range days) AND server-side in `createEventSchema` (`lib/validations/events.ts`) so it can't be bypassed.
- Severity: Medium (design fidelity + High for the validation gap — past/garbage dates currently allowed).

## M5 — Step 3 per-celebration modals (Set time / Set venue / Add custom ceremony) missing live
- **Where:** Create wizard Step 3 "Celebrations" (`/events/create?step=3`, `app/events/create/components/Step3SubEvents.tsx` + `SubEventCard.tsx`).
- **Issue:** the design has three dark, branded modals that are **not present/wired in the live app**:
  1. **Set date & time** — date field (design calendar, per M4) + **wheel time picker** (Hour / Min / AM·PM columns, live "10:14 AM" readout, Set/Cancel).
  2. **Set venue** — "Venue name" (e.g. The Grand Pavilion) + "Address (optional)".
  3. **Add a custom ceremony** — "Ceremony name" (e.g. Tilak, Roka, Vidaai) + "Short description (optional)".
- The live "SET TIME" / "SET VENUE" chips and "Add a custom ceremony" button do not open these modals.
- **Data note:** captured per-sub-event date/time/venue must persist into `event_sub_events` (`event_date`, `start_time`, `venue`, `custom_name`) via the create RPC. Confirm the create path carries these (today the wizard may only send type + custom_name).
- Severity: High (feature gap vs design; sub-event time/venue can't be set during creation).

## M6 — Step 3 celebration search has no "no results" state
- **Where:** Step 3 search box (`Step3SubEvents.tsx`).
- **Issue:** a query with no matches (e.g. "ad") filters out all cards and shows **nothing** — no empty-state message. Add a "No celebrations match '<query>'" message (and keep the "Add a custom ceremony" affordance visible so they can create it).
- Severity: Low (UX polish).

## M7 — Newly created event not shown on /home until a hard refresh
- **Where:** User dashboard `/home` (`app/home/page.tsx` — server component fetch) after creating an event.
- **Issue:** post-create, `/home` shows the empty state ("Nothing here yet"); the event only appears after a manual browser refresh. Next.js **router cache** serves the stale RSC payload on client-side navigation.
- **Fix direction:** call `router.refresh()` after the create flow navigates to `/home` (and/or after returning from the event), or `revalidatePath('/home')` on create, so the list is fresh on arrival — not on refresh.
- **Also:** a "1 error" badge shows on the dashboard (dev overlay) — confirm whether it's the known pre-existing hub SVG `transform-origin` warning or a real /home error.
- Severity: High (looks broken — user thinks their event wasn't created). On localhost / current branch.

## M8 — Dashboard needs skeleton loading (ties to M1)
- **Where:** `/home` events region while loading.
- **Issue:** blank/empty while events fetch; should show the **SK3 event-card skeleton** (`components.html §14`) instead.
- Severity: Medium (UX).

## M9 — Dashboard filter controls misaligned
- **Where:** `/home` filter row (`app/home/*` — "My events / Collaborations" left `.seg` + "Active / Past" right `.seg`).
- **Issue:** the right control (Active/Past) has **trailing dead space** and doesn't align with the left control. They should align consistently (edge-to-edge / space-between), matching the left group's width/format.
- Severity: Low (layout polish).
