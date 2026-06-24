# Guest Tagging & Sub-event Assignment — Design Plan

**Status:** Plan — awaiting UI/UX agent review + Abhijith sign-off. No markup until signed off.
**Builds on:** the shipped host-side Guest Management page (`designs/pages/guests/*`).
**Date:** 2026-06-04

## 1. Model (locked by Abhijith)

- The event has **sub-events / functions** (Haldi · Mehendi · Sangeet · Wedding · Reception) — defined in the event wizard (`create-event/step-3-celebrations`).
- Each guest is **assigned to one or more sub-events**. That assignment is the source of truth for **what the guest sees on the website** and **which functions they RSVP to** (per Digital Presence D-4).
- **Tags** (Family · Bride's side · Groom's side · Out-of-town · Table 5 · A-list) are a **separate organizing layer** — for filtering, grouping, and **bulk-assigning** a whole group to sub-events. Tags do NOT themselves grant access.
- Host list keeps **one rolled-up RSVP status** per guest (per-sub-event RSVP detail deferred); assignment is what's new here.

## 2. Sub-events (sample for the prototype)

`Haldi · Mehendi · Sangeet · Wedding · Reception` (5). Real list comes from the event. Each guest's `subEvents` = subset of these. A guest with **zero** assigned sub-events is flagged (they'd see nothing).

## 3. Data shape

Prototype (in-memory, extend the `guests` fixture): each guest gains
- `tags: string[]` — e.g. `['Family','Out-of-town']`
- `subEvents: string[]` — e.g. `['mehendi','wedding','reception']`

Plus a module-level `EVENT_SUBEVENTS` list and a `TAGS` registry (name + derived count).

**React-port note (forward):** `guest_tags` (guest_id × tag_id, m2m) · `event_sub_events` (id, name, order) · `guest_sub_events` (guest_id × sub_event_id = invite scope) · later `rsvp_responses` per sub-event. Tag/assignment writes need RLS + event-ownership (see security forward-notes in `guests-plan.md`). The guest's website view is filtered server-side by `guest_sub_events`.

## 4. Host-side UI additions

### 4.1 Edit-guest modal — two new sections
- **"Invited to"** — a sub-event checklist (reuse `.form-check`, one row per function). This is the assignment control. Zero-checked shows an inline warning ("This guest won't see any functions"). 
- **"Tags"** — a token input: existing tags show as removable chips; an input adds a tag (autocomplete from the `TAGS` registry; typing a new name creates it). 

### 4.2 Guest row — surface tags + assignment compactly
- **Tags:** small `.tag-chip`s after the contact line, max 2 shown + `+N` overflow, only when the guest has tags. (Mobile: keep the row compact — tags on their own line below contact, truncated.)
- **Assignment:** a compact indicator near the invite chip — e.g. `5/5 functions` or `Mehendi +2` (full list in edit). Zero-assigned shows a subtle warning dot.
- Desktop: a new **"Tags"** column (or fold into the Guest cell); reassess column budget (we're at 4 — avatar/id/invite/rsvp).

### 4.3 Tag manager (WithJoy "Organize Tags" analog)
A panel/modal: list existing tags with guest-counts, create a new tag, rename, delete (with confirm). Opened from a toolbar control ("Tags") or the bulk bar. Promote the panel shell if reusable.

### 4.4 Bulk select + bulk actions  ⚠️ supersedes the earlier "no multi-select in MVP" call
The feature needs group operations, so re-introduce **selection mode**:
- A select affordance per row (checkbox, appears in selection mode) + "select all (filtered)".
- A **bulk action bar** (appears when ≥1 selected): **Tag…** · **Assign to sub-event…** · **Send invites** · Clear.
- This is how "tag a group, then assign the group to Mehendi" works.

### 4.5 Filtering
- Keep the RSVP-status filter chips.
- Add a **second filter axis** — by **tag** and by **sub-event** (a "Filter" control opening the same sheet/popover, multi-select; or a secondary chip row). Combined with search + status filter.

## 5. Guest-view logic
Host-side: an optional **"Preview as guest"** affordance in the edit modal showing which functions this guest will see (derived from `subEvents`). The actual public-site filtering is **guest-site work** — wired when the guest-facing website is built (parked). This plan delivers the host-side assignment + the data that feeds it.

## 6. New primitives (promote-candidates → shell)
- `.tag-chip` (+ `.tag-chip-removable` with an × ) — generic label chip; consumers: guest rows, edit modal, tag manager, future filters.
- **Token/tags input** — chips + input + autocomplete. Generic (future: event tags, vendor tags).
- **Selection checkbox on list rows** + **bulk action bar** — generic list-management pattern (future: media, invitations).
- **Tag manager panel** — page-specific first; promote if a 2nd consumer appears.
- Sub-event checklist = **reuse `.form-check`** (no new primitive).
- Tag/sub-event filter = **reuse the new `openPicker`** sheet/popover (multi-select variant).

## 7. Reuse audit (vs what exists)
| Need | Existing | Disposition |
|---|---|---|
| Sub-event checklist (assignment) | `.form-check` | Reuse |
| Tag/sub-event filter menu | `openPicker` (sheet/popover) | Extend (multi-select mode) |
| Remove-tag confirm / delete-tag | `.modal-confirm-cautionary` | Reuse |
| Tag chips | — | **New** `.tag-chip` |
| Tags token input | `.form-input` + chips | **New** composite |
| Row selection + bulk bar | — | **New** |
| Tag manager | modal shells | **New** instance |

## 8. States to cover
- Guest with: no tags · 1–2 tags · 5+ tags (overflow `+N`) · no sub-events (warning) · all sub-events.
- Tag input: empty · autocomplete matches · creating new · duplicate guard.
- Selection: none · some · all-filtered · bulk action on N.
- Tag manager: empty (no tags yet) · populated · delete-in-use (confirm shows count).
- Filter: by tag · by sub-event · combined with status + search · no matches.
- Mobile + desktop, light + dark.

## 9. Build order
0. Shell: `.tag-chip` (+removable) + tags token-input + row-selection/bulk-bar + `openPicker` multi-select mode.
1. Data: extend fixture (tags, subEvents, EVENT_SUBEVENTS, TAGS).
2. Edit modal: "Invited to" checklist + "Tags" input.
3. Guest row: tag chips + assignment indicator (mobile-compact).
4. Tag manager panel.
5. Bulk select + bulk action bar (Tag / Assign / Send).
6. Filtering by tag + sub-event.
7. "Preview as guest" affordance (host-side stub).
8. Full test matrix + UI/UX agent post-build.

## 10. Open questions
- **Q1 — Row density:** tags on the row add height. Show max 2 chips + `+N` (recommended), or hide tags on the row and surface only in edit + filters? 
- **Q2 — Assignment default:** when adding a guest, default to **all** sub-events assigned (invite to everything), or **none** (host assigns explicitly)? Recommend **all** (least-surprise; host narrows down).
- **Q3 — Sub-event source:** use a fixed sample list now (`EVENT_SUBEVENTS`), or also build a "manage functions" entry here? Recommend **fixed sample** now (functions are owned by the event wizard / our-journey manager).
- **Q4 — "Invited" vs "Assigned":** does "Send invitations" go per-sub-event or once per guest? Recommend **once per guest** in MVP (the link shows their assigned functions); per-function sends deferred.

---

## 11. UI/UX agent review — REVISE → resolutions (2026-06-04)

Verdict was **REVISE**; all P0s resolved into the plan below. Build against these.

**P0-1 · Tags + assignment go on the EXISTING empty mobile row-2, not a new line.** The compact row's line 2 (`"avatar invite invite"`) is empty for invited guests. Reuse it as a single horizontal **meta strip**: `[Not-invited chip?] · [assignment pill] · [tag chips ≤2] · [+N]`, `flex-wrap:nowrap; overflow:hidden`, chip labels get `max-width`+ellipsis. Row stays ~65px (filling dead space, not adding height). Do NOT append tags after `.guest-row-contact`.

**P0-2 · `openPicker` multi-select is real new work, not a flag.** Today it's single-select `menuitemradio`, commit-on-tap, auto-close. Multi-select variant (`cfg.multi`): children → `role="menuitemcheckbox"`, toggle without closing, sticky footer **Apply + Clear**, `onApply(values[])`, sheet body scrolls when options overflow. Regression-test the single-select callers (RSVP setter, Sort) since it's shared.

**P0-3 · Bulk bar is a top-of-list-card toolbar MORPH, never bottom-pinned.** A bottom bar collides with the floating tool-rail dock + `.gm-offline` (z-75) + help-FAB. In selection mode the toolbar slot becomes the bulk bar (Tag… · Assign… · Send · Clear/Cancel). No new bottom real estate.

**P0-4 · Tags token input = real combobox.** `<input role="combobox" aria-expanded aria-controls aria-activedescendant>` → `role="listbox"` of `role="option"` suggestions; removable chips' × = `<button aria-label="Remove tag Family">`; Backspace-on-empty removes last chip (announced); **duplicate rule:** case-insensitive+trimmed match selects existing, "Create '<x>'" only when no match; mobile `enterkeyhint="done"`, `autocapitalize="words"`; **Enter commits suggestion/create and `preventDefault()`s** so it never submits the parent guest `<form>`.

**P1-1 · Row selection checkbox swaps the AVATAR cell** in `.is-selecting` mode (same 40px grid cell) — no new column, no layout shift, doesn't fight the `.guest-row-id` edit button. Hidden outside selection mode.

**P1-2 · One "Filter" pill (with active-count badge), not a second chip row.** Opens the multi-select picker with two sections (Sub-events / Tags). Status chips stay the always-visible primary axis; active tag/sub-event filters show as the pill count + removable chips in the filtered-empty affordance. Toolbar stays 2 rows.

**P1-3 · List-level zero-assigned banner** ("N guests aren't invited to any function — they'll see nothing" + **Review** → derived filter `subEvents.length===0`). The per-row dot alone misses bulk-imported guests.

**P1-4 · Assignment indicator = constant-width fraction pill `3/5`** (event icon, tabular-nums, reuse `.guest-invite-chip` box as `.guest-assign-chip`); zero-assigned = warning-tint variant + distinct icon (color-not-only). NOT "Mehendi +2" (leaks long names onto 360px).

**P1-5 · "Invited" naming collision — rename.** The assignment section header "Invited to" collides with the existing **"Invited"** send-state chip. Rename the assignment control to **"Functions"** (or "Invited to functions"); keep **"Invited"** strictly = an invitation was sent. Copy must not blur the two concepts.

**P2 (noted):** `.tag-chip` base owns truncation; reserve a `--tag-tint` hook (default neutral) but DON'T build per-tag colors now; tag-manager delete-confirm copy = plain-language with count ("Remove 'Table 5'? It's on 8 guests; they keep their other tags."); "Preview as guest" = read-only derived list in edit modal, not a live-preview button, ship last/cuttable.

### Q1–Q4 — resolved
- **Q1:** Keep tags on the row (max 2 + `+N`) **on the reused row-2 meta strip**; assignment as the `3/5` pill. Stays ~65px.
- **Q2:** New guest defaults to **all sub-events assigned** (least-surprise; warning becomes the exception).
- **Q3:** **Fixed sample `EVENT_SUBEVENTS`** + a one-line stub ("Functions are set up in your event"). No "manage functions" here.
- **Q4:** **One invite send per guest** in MVP (link shows their functions); per-function sends deferred. + the P1-5 naming fix.

---

## Built — 2026-06-04 (Phases 0–3 + edit modal)

Done + verified in-browser (360/390/1280, light+dark, no console errors):
- **Data:** `EVENT_SUBEVENTS` (Haldi/Mehendi/Sangeet/Wedding/Reception) + `TAGS` registry; each guest gains `subEvents[]` + `tags[]`. Fixture varied (zero-function, partial, full; 0–2 tags).
- **Shell primitives:** `.tag-chip` (+ `.tag-chip-removable` × button, `--tag-tint` hook, label truncation), `.guest-assign-chip` (fraction pill + `.is-none` warning variant).
- **Row redisplay (P0-1):** the guest row is now a unified 2-line layout both breakpoints — row-2 is a **meta strip** carrying `[Not invited?] · [N/5 assignment] · [tags ≤2 +N]`, shown **only when notable** (full+invited+untagged collapses to ~65px). Adaptive tag count so a double-exception row (not-invited + partial) shows `+N` instead of clipping. Desktop header simplified to 3 cols.
- **Edit modal (Phase 2):** "Invited to functions" checklist (reuse `.form-check`, defaults all for new guests, zero-checked warning) + a real **Tags combobox** (`role=combobox`/`listbox`/`option`, `aria-activedescendant`, arrow-nav, Enter commits without submitting the form, Backspace-removes-last, case-insensitive dedupe, "Create '<x>'", removable chips). Save writes `subEvents` + `tags`; row reflects immediately.

## Built — 2026-06-04 (Phases 4–7 + banner) — FEATURE COMPLETE

All remaining phases done + verified (360/390/1280, light+dark, no console errors):
- **`openPicker` multi-select variant (P0-2):** `menuitemcheckbox` semantics, group headers (Functions / Tags), scrollable body, sticky **Clear + Apply** footer, `onApply(values[])`, Tab-trap. Single-select callers (RSVP, Sort) regression-checked.
- **Phase 6 Filter (P1-2):** one **"Filter" pill** with active-count badge → multi-select picker (Functions + Tags groups). `state.subFilters`/`tagFilters`; ANY-within-axis, AND-across-axes. Status chips stay the always-visible primary axis.
- **Phase 5 Bulk (P0-3, P1-1):** **"Select"** enters selection mode → the toolbar **morphs** into a top bulk bar (Cancel · N selected · Tag · Assign · Send) — never bottom-pinned. Row selection swaps the **avatar cell** into a checkbox (`.is-selecting`); id/rsvp pointer-events off. Bulk Tag (adds), Bulk Assign (sets functions), Bulk Send (invites) — all via the multi-select picker; selection persists across re-render.
- **Phase 4 Tag manager:** modal (opened from the edit modal's "Manage tags" link) — create, list with live guest-counts, delete with an **inline count-aware confirm** ("Remove 'A-list' from 1 guest? They keep their other tags."); delete cascades to all guests + active filters.
- **Phase 7 Preview-as-guest:** read-only live line in the edit modal ("This guest will see: …"), updates with the function checkboxes. Not a live-preview button (per P2-4).
- **Zero-assigned banner (P1-3):** list-level amber banner ("N guests aren't invited to any function") + **Review** toggle → derived `onlyUnassigned` filter.

### Post-build UI/UX review (REVISE) — critical fixes applied (2026-06-04)

Agent flagged selection mode as a keyboard/SR ship-blocker + trust gaps. Fixed + verified:
- **P0 selection-mode a11y** — the name block becomes a real `role=checkbox` (`aria-checked`, "Select <name>" label) in selection mode (no more mouse-only); focus moves to the first row on enter; `#gm-bulkbar` is `role=toolbar`; live announcement on enter; dropped the invalid `aria-selected`-on-`<li>`.
- **+ Select-all (filtered)** toggle in the bulk bar (the agent's core-gap Q).
- **P1-3 bulk Send** now routes through the send-confirm modal (no silent bulk WhatsApp blast).
- **P1-2 bulk Assign** title says "replaces current" + consequence-stating toast.
- **P1-1 amber demote** — "Not invited" is now neutral grey; amber reserved for the 0-functions warning + banner.
- **P1-4** tags combobox stays open for rapid multi-tag entry. **P1-6** banner is a reliable live region (class-toggle, not `hidden`; shown in selection mode). **P2-3** assign chip `aria-label` ("Invited to 3 of 5 functions"). **P2-5** dead `.gm-sort` CSS removed.

**Deferred (agent P1-5/P2s):** surface active filters as removable chips when results non-empty · `+N`/tag-label `title` tooltips · bulk-picker reflecting current shared state · components.html backfill (now large) · dead `.guest-row-actions`/`.gm-add-btn` CSS · BRAND-GUIDELINES token mirror · council/codex re-review · real-device phone pass.

### Founder phone-review round (2026-06-05) — applied + verified

From the on-device review:
1. **Stats → individual cards** — count strip replaced with a responsive grid of cards (Total spans the row on mobile; 5-across on desktop). Bigger numbers, clear separation.
2. **Spacing** — tightened stats + the card treatment gives breathing room.
3. **Bulk select → Jira pattern** — bulk bar is now a **floating dark bottom bar** (`N selected · Select all · Tag · Assign · Send · ✕`), toolbar stays visible (not hidden), avatars get a corner checkbox badge + selected cards get a brand rim. Moved to body-level (out of the `.reveal` transform) so `position:fixed` anchors to the viewport.
4. **Mobile rows → cards** — each guest is now a distinct card (border + shadow + gap), bigger padding, 2-section layout.
5. **Add guest → FAB** — removed from the toolbar; floating extended FAB (bottom-right, above the dock), auto-hides in selection mode.
6. **Offline toast → smaller** — single-line compact pill, shorter copy, lifted above the dock.
+ Fixed the name-turns-red-on-touch (dropped the `:hover` color change). Added `[hidden]` guards so the fixed FAB/bulk-bar/offline honor the `hidden` attribute over their `display`.

Verified 360/390/1280, light+dark, no console errors, no horizontal scroll.

### Founder phone-review round 2 (2026-06-05) — applied + verified

1. **Bulk bar above the dock** — floating bottom bar lifted to clear the tool-rail dock; width capped so it doesn't exceed the dock edges.
2. **Offline toast → top** — moved below the floating nav (was bottom), kept compact.
3. **Add-guest FAB → icon-only** — 56px circular `person_add` FAB, sits above the dock, right edge within the dock margin (auto-hides in selection mode).
4. **Edit-modal RSVP pills → 2×2 grid** — the 4 pills were clipping ("Confirme…/Pending") on wider phones where `.radio-pill-group` went single-row; now `.gm-rsvp-pills` is a 2-col grid (4-col ≥600px). Fixes the "spacing/formatting miss."
5. Floating elements (FAB / bulk bar / toast) constrained so their max placement stays within the dock edges.

**Noted (not a code bug):** the modal close rendered as the text "close" on-device = a Material-Symbols **font-load flash (FOUT)**; renders as the ✕ glyph once the icon font is cached. Mitigation (global icon visibility-gate on `document.fonts.ready`) deferred — it's shell-wide.

**Swipe-to-reveal row actions (built, verified):** each guest card is a horizontal **scroll-snap track** — swipe left to reveal a 3-button rail: **RSVP** (brand) · **Assign** (slate) · **Send** (green). CSS-native swipe (no touch JS); the card content lives in `.guest-row-surface`, the rail is a snap-end sibling. RSVP → opens the setter; Assign → opens the function multi-picker **pre-filled with the guest's current functions**; Send → invites that one guest. Tap-to-edit + badge-tap RSVP preserved; swipe disabled in selection mode; rail hidden on desktop (≥768px, no swipe). Verified mobile + desktop, no console errors. (The `.guest-row` grid moved to `.guest-row-surface` in shell.css to support the slide.)
