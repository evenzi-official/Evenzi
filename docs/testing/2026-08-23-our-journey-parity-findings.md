# Our Journey — pixel-parity findings

**Date:** 2026-08-23  
**Build:** `feature/our-journey-rebuild`  
**Surfaces:** `designs/pages/event-control/our-journey.html` vs `app/events/[id]/journey`

## Fixture

Not SQL-seeded in this pass. Use any event that already has sub-events (or add them via the new Add modal) so Held / Next up / The big day can be derived from dates. Record the event id here when the Antigravity overlay pass runs:

- Fixture event id: _pending_

## Round 1 — implementation self-check

Automated Antigravity overlay diffs were **not** run in this Cursor session (no Antigravity harness). Structural parity was implemented from the locked HTML/CSS:

| Check | Status |
|---|---|
| Header eyebrow / title / subtitle copy + `.section-head` | Matched to design HTML |
| Summary pills + Add CTA (`.oj-bar`) | Matched |
| Rows: icon, title, Held / Next up / The big day, meta, Website toggle, edit/delete | Matched class names from HTML + CSS aliases |
| `is-next` / `is-marquee` treatments | Derived from dates + wedding-ceremony catalog name |
| Add/Edit modal field order, name error, website toggle, gated primary CTA | Implemented; date/time reuse wizard `DatePicker` / `TimePicker` (better than free-text) |
| Remove confirm via shared `ConfirmDialog` | Copy aligned; chrome is the platform confirm, not a forked modal |
| Empty state + footer tip | Matched |
| CSS | Ported by `@import` of `our-journey.css` in `app/globals.css` (already present). Aliases added so HTML `oj-row-*` names style. Mobile wrap on `.oj-row` so actions stay on-canvas at 360px. |
| Light / dark | Inherits shell tokens |
| Horizontal overflow | Mobile wrap added; needs live widths 360/390/414/768/1024/1440 |

## Open for Antigravity / Claude review

1. Overlay design vs React at 360, 390, 414, 768, 1024, 1440 — light and dark.  
2. Seed a 6-row fixture matching the design demo (Pre-wedding shoot past, Mehendi next, Haldi, Sangeet, Wedding ceremony, Reception).  
3. Confirm wizard DatePicker/TimePicker vs design text inputs: structure matches; trigger chrome is the existing picker, not a raw `type=text`.  
4. Website toggle is `display:none` below 768 in the design CSS — same here; edit/delete remain.

Do not mark pixel-parity **done** until the overlay pass above is green.

## Parity finding — row order diverges from the design (Claude review, 2026-08-23)

**Fixture:** event `7353ca9d-1d53-4ba4-bc73-2a8e85168978` seeded with the design's 6 functions (Pre-Wedding Shoot, Mehendi, Haldi, Sangeet, Wedding Ceremony, Reception) with matching dates/venues; `display_order` 1–6 in that sequence.

**Observed:** the React page renders Pre-Wedding, **Sangeet, Mehendi, Haldi**, Wedding, Reception. The design renders Pre-Wedding, **Mehendi, Haldi, Sangeet**, Wedding, Reception.

**Root cause:** `JourneyClient` applies `sortByWeddingRoadmap` (JourneyClient.tsx:94), which uses `WEDDING_ROADMAP_ORDER` in `lib/events/subEventRoadmap.ts` where `sangeet:4, mehendi:5, haldi:6`. That constant places Sangeet before Mehendi/Haldi, overriding both the design sequence and the row `display_order`.

**Two problems:**
1. Mismatches the locked design order (Mehendi → Haldi → Sangeet).
2. Breaks chronological order on the management list — Sangeet (Dec 20) sorts above Mehendi (Dec 19), and the "NEXT UP" row (Mehendi, nearest upcoming) is not at the top of the upcoming group.

**Fix (2026-08-23):** `JourneyClient` now sorts with `sortByDisplayOrder` (`display_order`, then `event_date` / `start_time`). `sortByWeddingRoadmap` / `WEDDING_ROADMAP_ORDER` stay on the Event Control hero strip only. Expected list for the 6-row fixture: Pre-Wedding → Mehendi → Haldi → Sangeet → Wedding → Reception.

**Everything else matches:** header, summary pills, Add button, row anatomy (icon/title/badge/meta/toggle/edit/delete), status badges (Held / Next up / The big day), meta format, comfortable spacing, empty-state hint, footer note. Light/dark and full breakpoint sweep still pending on the fixed order.

### Resolution (2026-08-23) — RESOLVED

Cursor changed `JourneyClient` to `sortByDisplayOrder(rows)` (JourneyClient.tsx:94). Re-verified live against the seeded 6-function fixture:

- Order now Pre-Wedding Shoot → Mehendi → Haldi → Sangeet → Wedding Ceremony → Reception — matches the locked design and reads chronologically. "NEXT UP" correctly sits on Mehendi (nearest upcoming) at the top of the upcoming group.
- Desktop: 1:1 with the design (header, pills, Add button, row anatomy, badges, toggle/edit/delete, meta format, spacing).
- Mobile 360px: cards stack, meta wraps to ≤2 lines, no horizontal scroll.
- Light and dark themes both render cleanly.

**Verdict: parity PASS.** No open deviations. tsc clean.
