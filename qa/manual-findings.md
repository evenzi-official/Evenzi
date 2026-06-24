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

---

# Round 2 — 2026-06-23 (testing the shipped fixes; create wizard)

## M11 — Date picker month/year view: left/right arrows don't work
- **Where:** `DatePicker.tsx` — when you click the month/year header (e.g. "July 2026" ▲) it shows the month grid (Jan/Feb/Mar…), but the `<` `>` arrows at the top don't change the year. Fix: wire prev/next in the month-selection view to step the year (respecting the min today / max +5y bounds).
- Severity: Medium.

## M12 — Guest count: cap unreasonable input + witty helper
- **Where:** Step 2 "Guest count" (`Step2BasicDetails.tsx`). Currently accepts absurd values (e.g. `20021412412343312423`).
- **Fix:** enforce a sensible max (e.g. ≤ 100000) in the input + `createEventSchema`. AND add a helper line *below* the field (same treatment as the label/field group) that reacts to the value — once it crosses a reasonable threshold, show a *witty* comment (e.g. "Planning a stadium wedding? 😄"). Keep it light; cap the actual stored value.
- Severity: Medium (validation) + nice-to-have (witty copy).

## M13 — Sub-event date must respect the main Event Date
- **Where:** Step 3 "Set date & time" sub-event date picker vs the Event Date chosen in Step 2 (Details).
- **Issue:** sub-event date can be set independently of the main event date. Founder rule: *sub-event date should not cross the Event Date selected in Details.*
- **Fix:** constrain the sub-event date picker relative to the main event date (min today, max = event date). ⚠️ Open question to confirm at fix time: some ceremonies legitimately happen *after* the main day (e.g. Post-Wedding Brunch) — decide whether to hard-cap at event date or allow a small +N-day window. Default for now: cap at event date unless founder says otherwise.
- Severity: Medium.

## M14 — Loading delay on the Celebrations (Step 3) page
- **Where:** Step 3 shows skeleton placeholder cards while sub-event types load (client fetch). Same class as M1.
- **Fix:** server-render the sub-event types (pass as initial props) so there's no load delay. (Skeleton is the correct fallback if a load is unavoidable, but the goal is no load.)
- Severity: Medium (UX + perf).

## M15 — End time should be constrained to after Start time (not just error after)
- **Where:** Step 3 "Set date & time" — End time. Validation message "End time must be after the start time" works ✅, but the user can still *select* an invalid time first.
- **Fix:** make the End-time wheel picker only offer times *after* the chosen Start time (disable/hide earlier options) so an invalid pick isn't possible. Keep the error as a backstop.
- Severity: Low–Medium (UX).

## M16 — Use the preloader / loading treatment wherever needed
- **Where:** app-wide.
- **Ask:** apply a loading treatment wherever there's a wait — the brand *preloader* for full-page/route transitions where it fits, and the *skeleton* for in-page data regions (dashboard, celebrations, event dashboard, etc.). Audit the in-scope screens and add the right one to each loading point.
- Severity: Medium (consistency/UX).
