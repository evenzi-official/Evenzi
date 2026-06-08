# Guest Management — page record

**Status:** built + merged. Host-only.

## What's built
Stats cards · responsive guest cards · manual-RSVP setter (sheet/popover) · search + RSVP-status filter chips · sort · 5 modals · CSV-import sim · per-guest function/sub-event assignment + tags combobox (`openPicker` single+multi) · row meta strip · tag manager · zero-assigned warning banner · **Jira-style bulk select** (floating bar) · **swipe-to-reveal row actions** (CSS scroll-snap) · icon-only Add FAB · offline toast · **compact header + (i) info-disclosure**.

## Shared primitives it introduced (now in shell)
`.guest-row` family · `.tag-chip` · `.guest-assign-chip` · `.form-input-search` · `.form-check` · `openPicker` · `.gm-setter` (promoted) · the FAB/bulk-bar (promoted to `.add-fab`/`.bulk-bar`).

## Notes
- Source of `EVENT_SUBEVENTS` shape (`{id,label}`, `mehendi`) reused by planning.
- Deferred: public guest-facing RSVP page (the other half — do last).
