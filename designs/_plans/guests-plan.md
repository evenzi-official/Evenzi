# Guest Management (host-side) — Design Plan

**Status:** Plan — awaiting UI/UX agent review + Abhijith sign-off. No markup until signed off.
**Surface:** Host-side Guest Management page (`designs/pages/guests/guests.html` — currently an empty shell).
**Reference:** Designed fresh from `shell.css`. No binding Figma/Stitch ref.
**Source spec:** `docs/features/overviews/guest-management-overview.md`.
**Date:** 2026-06-04

---

## 1. User goal

> "Who's actually coming?" — the host builds a guest list, watches RSVPs arrive, and records responses on guests' behalf (the elderly-relative path), without chasing people on WhatsApp/Excel.

Primary jobs on this screen:
1. **See the state of the list at a glance** (stats: total / confirmed / declined / pending / maybe + response rate).
2. **Add guests** — one at a time, or CSV bulk import.
3. **Send WhatsApp invitations** to guests not yet invited.
4. **Find a guest** — search / filter by status / sort.
5. **Record an RSVP on a guest's behalf** — one-tap Yes/No/Maybe (key flow, not an edge case).
6. **Edit / remove a guest.**

## 2. MVP scope (from the overview doc)

**In:** add/edit/remove guest (name, phone, optional email) · searchable+sortable list · RSVP status (Pending/Confirmed/Declined/Maybe) · stats bar · CSV import (with consent checkbox) · Send WhatsApp invite (per-guest link) · manual RSVP entry by host · empty state.

**Out (do NOT design):** meal preferences · seating · **plus-one/+1 tracking** · WhatsApp two-way chat · SMS/email delivery · venue check-in · multiple RSVP rounds.

> ⚠️ The existing `guests.html` subtitle says *"plus-ones"* — **out of MVP, correct the copy.**

## 3. Page anatomy (top → bottom)

```
[Floating nav + tool-rail + breadcrumb]          ← reuse, already in shell
[.section-head: GUESTS / Guest Management / sub]  ← convert from hand-rolled header
[Stats bar — rate hero card + 1 compact segmented count strip]   ← revised, see §6
[List toolbar — see §3.1 (one primary CTA; defined mobile reflow)]
[Guest list — responsive table→card rows]   (or empty state when 0 guests)
[Footer]                                         ← reuse
[Modals: Add · Edit · Import CSV · Send-confirm · Remove-confirm]
```

Convert the page to the **canonical `.page-band`** wrapper (drop the hand-rolled `max-w-[1440px] mx-auto px-6 md:px-10` on `<main>`/`<footer>`, per BRAND-GUIDELINES width contract). Adopt the canonical top-section pattern (`.section-head` family) used by every other event sub-page.

### 3.1 List toolbar (revised per P1-5 — one primary CTA + defined mobile reflow)

**Desktop (≥768px), one row:** search (grows) · sort `.form-select` · spacer · **Add guest** (`.btn-pill-primary`, the sole primary) · Import (`.btn-pill-secondary`) · Send invites (`.btn-pill-secondary`, contextual — only enabled when un-invited > 0). Status filter chips sit on their own row below.

**Mobile (<768px), stacked order:**
1. Search input (full width).
2. Filter chips — horizontal scroller (`.dp-filter-chips` already scrolls).
3. Action row: **Add guest** primary (full-width or left) + a "More" overflow holding Import (Send invites surfaces contextually as a banner/inline action when un-invited > 0). Sort folds into the More menu or a small inline control.

No 3-buttons-+-2-controls single row at 360px.

## 4. Element-by-element reuse audit

| Element | Existing primitive | Disposition |
|---|---|---|
| Page chrome (nav, tool-rail, breadcrumb, footer, FAB, toast) | shell | **Reuse as-is** (already present) |
| Section heading | `.section-head` + `-eyebrow`/`-title`/`-sub` | **Reuse** (convert from current ad-hoc header) |
| Width wrapper | `.page-band` / `.bc-wrap` | **Reuse** (replace hand-rolled widths) |
| Stat cards (rate + counts) | `.stats-strip-card` + `.stat-icon` | **Reuse** (D1 pattern); response-rate uses the inline progress-bar variant |
| Status filter chips (All/Confirmed/Declined/Pending/Maybe + counts) | `.dp-filter-chips` + `.dp-filter-chip` + `.is-active` | **Reuse** |
| Search box | `.form-input` | **Extend** → `.form-input-search` (leading search icon + clear button). 2nd+ consumer (every list page) → promote to shell |
| Sort control | `.form-select` + `.form-select-chevron` | **Reuse** |
| Add guest / Import / Send buttons | `.btn-pill` + `-primary`/`-secondary` | **Reuse** |
| Guest avatar (initials) | `.avatar-grad-1/2/3` + avatar-stack styles | **Reuse** tokens; small new wrapper for single avatar in a row |
| **Guest list row** | — none — | **NEW** `.guest-row` family (responsive table↔card). Core new primitive |
| RSVP status badge | `.status-badge` + `.status-dot` | **Extend** → `.status-confirmed`/`.status-declined`/`.status-pending`/`.status-maybe` |
| Row actions (overflow) | `.fn-icon-btn` styling + `.fn-notif-panel` popover idiom | **Reuse** idiom; small new menu instance |
| Add/Edit/Import modals | `.modal-scrim`+`.modal-card`+`.modal-head`+`.modal-actions`+`.modal-section` | **Reuse** |
| Form fields (name/phone/email) | `.form-group`+`.form-label`+`.form-input`+`.form-input-group`+`.form-input-prefix` (+91) | **Reuse** |
| Manual RSVP setter (Yes/No/Maybe) | `.radio-pill-group` + `.radio-pill` | **Reuse** (inside Edit modal + as quick popover) |
| CSV dropzone | `.dp-dropzone` + `-icon`/`-title`/`-hint` | **Reuse** |
| Consent checkbox | — (no checkbox primitive; `.checklist-row` is task-styled) | **NEW** small `.form-check` (label + native checkbox + brand check) — promote-candidate |
| Send-invite confirm | `.modal-confirm-affirmative` | **Reuse** (matches showcased "Send WhatsApp invitation?" DLG1) |
| Remove-guest confirm | `.modal-confirm-cautionary` | **Reuse** |
| Empty state (0 guests) | `.empty-cta-card` + `-icon`/`-title`/`-sub` | **Reuse** |
| Toast feedback | `#bc-toast` system | **Reuse** |

## 5. New primitives (promote to shell)

### 5.1 `.guest-row` family — the core
A responsive list row that reads as an aligned **table on desktop** and a **stacked card on mobile**. CSS-grid driven (no `<table>` — avoids mobile reflow pain; keeps it a `<ul>`/`<li>` semantic list with row `role` only if needed).

Columns (desktop ≥768px), via `grid-template-columns`:
`[avatar 44px] [name+contact 1fr] [invite-state auto] [RSVP badge auto] [actions 44px]`

Mobile (<768px): collapse to 2 rows inside the card — line 1 = avatar + name + status badge (right); line 2 = contact + actions. No horizontal scroll.

Parts: `.guest-row` · `.guest-row-avatar` · `.guest-row-id` (name + `.guest-row-contact`) · `.guest-row-invite` (Sent ✓ / Not sent) · status badge slot · `.guest-row-actions`. Header row `.guest-row-head` (desktop column labels, hidden on mobile). Hover lift consistent with shell (only `@media (hover:hover)`). Whole row is NOT a link (it has multiple actions) — name is the primary affordance; actions are explicit buttons (z-index pattern, per the dashboard featured-card rule).

### 5.2 RSVP status badge variants — extend `.status-badge`
- `.status-confirmed` → `--success` family (green)
- `.status-declined` → **new `--danger` token family** (red, distinct from brand `#BB0020`; use `#ef4444`-leaning per BRAND-GUIDELINES so it doesn't read as a brand element)
- `.status-pending` → muted/neutral (mirror `.status-draft`)
- `.status-maybe` → **new `--warning` token family** (amber `#f59e0b`)

Add `--danger`/`--danger-on`/`--danger-tint`/`--danger-rim` and `--warning`/… families to `:root` + `.dark` in shell.css (mirror the existing `--success` block; update BRAND-GUIDELINES §Semantic colors to point at the real tokens). **Never color-only** — each badge keeps its `.status-dot` + text label (a11y `color-not-only`).

### 5.3 `.form-input-search`
`.form-input` with a leading `search` icon and a trailing clear (`close`) button that appears when non-empty. Promote (every future list page — invitations, media — is a consumer).

### 5.4 `.form-check`
Label + native `<input type=checkbox>` + brand-tinted custom check box (the import consent gate). Generic; promote-candidate.

## 6. RSVP status model

| Status | Token | Badge | Filter chip |
|---|---|---|---|
| Pending | muted | grey dot | "Pending · N" |
| Confirmed (Yes) | success | green | "Confirmed · N" |
| Declined (No) | danger | red | "Declined · N" |
| Maybe | warning | amber | "Maybe · N" |

**Stats bar (revised per Q5):** two pieces, not six tiles —
1. **Response-rate hero card** — solid `.clay-card` substrate (P0-2), big % + `.pf-bar` progress + small `how_to_reg` `.stat-icon`. ("responded / invited".)
2. **Compact segmented count strip** — ONE solid card holding Total + the 4 status figures inline, each with its colored status **dot** + count + label, no per-figure 48px icon. Reads as the breakdown of the rate, ties visually to the RSVP colors. Desktop = one row; mobile = 2×2/wrap, no horizontal scroll.

Doc's example dataset: 154 guests, ~65% response rate → realistic sample data (Indian + one Devanagari name, mix of statuses, some not-yet-invited, one missing email, one 30+char name — per P2-4).

## 7. Manual RSVP entry (the elderly-relative flow)

The doc calls this a **primary** flow (elderly relatives — host records by phone). Make it one-tap, phone-ergonomic:
- The status badge in each row is an **interactive button** (`aria-haspopup`, `aria-expanded`) → opens the status setter with the 4 statuses (status-scoped `.radio-pill--*` variants, per-status icon).
- **Responsive surface (P1-4):** at `<480px` the setter is a bottom **action sheet** (`.modal-static-sheet`) with ≥44px Yes/No/Maybe/Pending rows (thumb-reachable, no WebView clipping); at ≥480px it's an anchored popover.
- **A11y (P1-3):** reuse the in-house `role="radiogroup"` + roving-tabindex pattern (`website.js`) with `aria-checked`; focus moves into the setter on open, returns to the badge on close; Esc + click-outside close.
- Tap → optimistic set → toast (`RSVP UPDATED`) → badge + stats recompute live. **On failure (P1-1):** badge reverts + `COULDN'T UPDATE — TAP TO RETRY`.
- Same control also lives inside the **Edit guest** modal as a `.radio-pill-group` (same status variants).

## 8. Modals inventory

| Modal | Shell | Content |
|---|---|---|
| Add guest | `.modal-card` | Name · Phone (+91 group) · Email (optional) · Save. Inline validation (name required, phone 10-digit). |
| Edit guest | `.modal-card` | Prefilled add-form + RSVP `.radio-pill-group` + Invite-status row + "Remove guest" (danger text → fires Remove-confirm). |
| Import CSV | `.modal-card` | "Download template" link · `.dp-dropzone` · **required `.form-check` consent** ("I have consent to share these contacts") · parsed-count preview · Import (disabled until file + consent). |
| Send invitations confirm | `.modal-confirm-affirmative` | "Send WhatsApp invitation to N guests who haven't been invited?" · Send. |
| Remove guest confirm | `.modal-confirm-cautionary` | "Remove [Name] from the guest list?" · Cancel / Remove. |

All via `window.evenzi.openModal/closeModal` (stacking-safe controller). No modal markup duplicated — instances live in `guests.html`; behaviour in `guests.js`.

## 9. States to cover (test-phase checklist seed)

- **Loading (P1-1):** list + stats **skeleton** on initial load — quiet, no aggressive pulse.
- **Guest row:** default · hover · status×4 · invited vs not-invited · long name (truncate, ellipsis, `min-width:0`) · missing email · Devanagari name.
- **List:** populated · filtered-empty ("No guests match") · search-empty · **zero guests** (`.empty-cta-card`: "Add your first guest" + "Import CSV").
- **Stats:** 0-state (all zeros, 0% rate) and populated.
- **Manual RSVP (P1-1):** optimistic success · **rollback on failure** (badge reverts + retry toast).
- **Offline / network-error (P1-1):** plain-language banner; UI not silently dead (WhatsApp WebView on weak signal).
- **Forms:** required-error · invalid phone · valid · loading (`.is-loading` on Save) · success toast.
- **Import:** no-file · file-selected (count preview) · consent-unchecked (Import disabled) · importing · done · **parse-error (P1-1):** malformed / wrong columns / 0 valid rows / "12 OK, 3 skipped (duplicates)".
- **Send invites:** N>0 (enabled, shows count) · N=0 ("Everyone's already invited" — disabled/empty).
- Light + dark, all of the above.

## 10. Files

- `designs/pages/guests/guests.html` — rewrite content (keep chrome), `.page-band`, section-head, stats, toolbar, list, modals.
- `designs/pages/guests/guests.css` — **page-specific only** (toolbar layout, guest-row grid template, status popover). Generic → shell.
- `designs/pages/guests/guests.js` — sample data, render, search/filter/sort, CRUD modals, manual-RSVP popover, CSV import sim, live stats recompute.
- `shared/shell.css` — `--danger`/`--warning` tokens, `.status-confirmed/declined/pending/maybe`, `.guest-row` family, `.form-input-search`, `.form-check`.
- `shared/shell.js` — `.form-input-search` clear behaviour, `.form-check` (if any JS), status popover helper if generalized.
- `designs/components.html` — backfill new primitives (also clears standing backfill debt for these).
- `docs/BRAND-GUIDELINES.md` — wire real `--danger`/`--warning` token names into §Semantic colors.

## 11. Build order (phased — each phase gets an agent increment pass)

0. **Shell foundation:** semantic tokens (`--danger`,`--warning`) + RSVP `.status-*` variants + `.guest-row` family + `.form-input-search` + `.form-check`.
1. **Page skeleton:** `.page-band` conversion + `.section-head` + footer fix.
2. **Stats bar** (rate + 5 counts) wired to sample data.
3. **List toolbar** (search + filter chips + sort + action buttons).
4. **Guest list** render (rows + header + empty/filtered-empty states) + live filter/search/sort.
5. **Manual RSVP popover** (the one-tap setter) + live stats recompute.
6. **Modals:** Add → Edit → Remove-confirm → Import CSV → Send-confirm.
7. **Polish + full test matrix** (states, responsive 360→1440, light/dark, a11y, mobile device).

## 12. Open questions — RESOLVED (UI/UX agent + plan author, 2026-06-04)

- **Q1 — Sort options.** ✅ Name A–Z (default) · Recently added · Status. **Status sort = needs-attention-first order: Pending → Maybe → Confirmed → Declined** (host's actual job, not alphabetical).
- **Q2 — Invite state.** ✅ Surface it, paired with text (no bare ✓): un-invited rows get a quiet "Not invited" pill; invited rows show a faint "Invited" (or nothing). Makes the Send action legible + lets the host scan outstanding.
- **Q3 — Bulk select.** ✅ No per-row checkboxes in MVP. One "Send to all un-invited (N)" action; shows count, disables/empty-states at N=0.
- **Q4 — Sub-event attendance.** ✅ Single overall RSVP status on the host list in MVP. Per-sub-event deferred. **Note for data-model (Dheeraj): schema should not preclude per-sub-event later** (guest RSVP page may capture it) — host list just rolls up.
- **Q5 — Stats density.** ✅ **Revised — do NOT ship 6 equal icon-cards.** Response-rate stays a hero card (with `.pf-bar`). Total + 4 statuses become ONE compact **segmented count strip** (inline figures + colored status dots, no per-figure `.stat-icon`). Reads as "the breakdown of the rate." Icon only on the rate hero. See revised §6.

---

## 13. UI/UX agent review — findings + resolutions (2026-06-04)

**Verdict: APPROVE-WITH-NOTES.** All P0s resolved into the plan below; P1s pinned for early build; P2s noted.

### P0 (resolved in plan)
- **P0-1 · `.radio-pill` checked-state is hardwired brand-red → can't express RSVP semantics.** A selected "Declined" would render brand red, "Confirmed" red-not-green, killing color-not-only on the *selected* affordance. **Resolution:** add status-scoped checked variants `.radio-pill--confirmed/-declined/-maybe/-pending` that override checked bg/border/ring to the matching semantic token, with per-status icon (check_circle / cancel / help / schedule). Applies to the manual-RSVP setter (popover/sheet + Edit modal).
- **P0-2 · `.stats-strip-card` is glass-for-hero-overlay → washes out on flat `--bg`, and colored numerals on 28%-alpha glass are contrast-unverified.** **Resolution:** stats bar uses a SOLID substrate (`.clay-card`/`tool-card` or a `.stats-strip-card--solid` modifier). No glass-on-flat-bg. (Also moots most `@supports` concern for the stats.)
- **P0-3 · Status-badge text (11px uppercase) on 10–12% tint fails AA — amber worst (~2:1 light).** Dot+label gives color-not-only, but the *label legibility* fails. **Resolution:** split tokens — `dot` = vivid hue (`#f59e0b`), `text` = darkened `--{danger,warning,success}-ink` (e.g. warning-ink ~`#92660a` light / `#fbbf24` dark), `tint` = bg. **Measure AA at 11px in BOTH modes before build** — not a token-copy.

### P1 (pinned for early build)
- **P1-1 · Missing states** → added to §9: list/stats **skeleton** (quiet, no aggressive pulse), manual-RSVP **optimistic rollback** (badge reverts + `COULDN'T UPDATE — TAP TO RETRY`), **offline/network-error** banner, **CSV parse-error** (malformed / wrong columns / 0 valid / "12 OK, 3 skipped").
- **P1-2 · `.guest-row` mobile geometry** (§5.1 updated): name cell `min-width:0` + ellipsis; badge never wraps; badge-button AND actions-button each ≥44×44 with non-overlapping hit areas; pin the two-tap-target layout so it's tested, not discovered.
- **P1-3 · Status setter a11y** (§7 updated): badge = `<button aria-haspopup aria-expanded>`; menu = reuse the in-house `role="radiogroup"` + roving-tabindex pattern (proven in `website.js`) with `aria-checked`; focus moves in on open, returns to badge on close; Esc + click-outside close.
- **P1-4 · Manual RSVP on phone** (§7 updated): at `<480px` the setter opens as a bottom **action sheet** (`.modal-static-sheet`) with 44px+ rows; anchored popover only at ≥480px. Bigger thumb targets for the most-used control; no clipping in WhatsApp WebView.
- **P1-5 · Toolbar overload / one primary CTA** (§3 updated): **Add guest** is the sole `.btn-pill-primary`. Import + Send invites are secondary; on mobile they collapse (Import lives in empty-state + a secondary slot; Send invites is contextual — only when un-invited > 0). Specify the mobile toolbar wrap/stack order explicitly (search row → chip scroller → actions); a 3-button + 2-control single row does not fit 360px.
- **P1-6 · `@supports not (backdrop-filter)` fallback** must be referenced for any blur that survives (filter chips / popover); stats no longer use glass (P0-2).

### P2 (noted)
- **P2-1** Fix the existing `--success-on == --success` no-op while adding tokens (don't propagate a meaningless `-on` convention; define real text-on-tint = the `-ink` tokens above).
- **P2-2** Single guest avatar likely = one `.avatar-stack-item` without the stack — try reuse before adding a wrapper.
- **P2-3** List must be real `<ul role="list">`/`<li>`; `.guest-row-head` truly `hidden` on mobile; "Invited" icon needs visually-hidden text (not icon-only).
- **P2-4** Sample fixture must include: a 30+char name, a missing-email row, a not-invited row, and a Devanagari name — to exercise truncation/content-resilience in the prototype.

---

## Built — 2026-06-04

**Files:** `pages/guests/guests.{html,css,js}` (was an empty shell) · `shared/shell.{css,js}` (new primitives) · plan above.

**Shell foundation (shell.css/js):**
- Semantic tokens `--danger` / `--warning` (+ `-ink` text tokens, AA-measured ≥4.5:1 at 11px in both modes) + `--success-ink`. BRAND-GUIDELINES still TODO to mirror.
- RSVP `.status-confirmed/declined/pending/maybe` (text = `-ink`, dot = vivid hue, label always present → color-not-only).
- Status-scoped `.radio-pill--confirmed/declined/maybe/pending` checked variants (P0-1 fix — selected "Declined" reads red, not brand).
- `.guest-row` family — responsive grid: aligned 5-col table ≥768px; mobile stacks name (full-width) / contact / RSVP badge / invite chip with a fixed actions column (names no longer truncate early). `<ul role=list>`.
- `.form-input-search` (leading icon + clear button, delegated JS) + `.form-check` (consent checkbox).

**Page (guests.html/css/js):** `.page-band` width fix · `.section-head` (subtitle corrected — no plus-ones) · rate-hero + segmented count strip (Q5) · toolbar (search · sort · Import · Send-invites[contextual] · **Add guest** primary) · status filter chips (radiogroup + roving arrows) · 12-guest sample fixture (30+char name, Devanagari, missing-email, not-invited rows) · skeleton on load · empty/filtered-empty states · 5 modals (Add/Edit/Import/Send-confirm/Remove-confirm) · manual-RSVP setter = **bottom sheet <480 / anchored popover ≥480** with optimistic update + rollback + live stats recompute · offline banner.

**Verified in-browser (live-server :4000):** desktop+mobile, light+dark; 12 rows render; rate/counts/chips live; RSVP setter (popover + sheet) sets status with optimistic update + stats recompute; Add modal (edit-only fields hidden); badge contrast legible both modes; **no horizontal scroll at 360px**; names fill width on mobile. Fixed a build bug (`*/` inside a JS comment broke parse) + mobile row geometry (name was truncating under the badge).

**Not yet done (next):** Import/Send/Remove modal visual + flow screenshots · `components.html` backfill of the new primitives · BRAND-GUIDELINES semantic-token mirror · real-device phone pass.

### Council + Codex review (2026-06-04) — importants fixed

Ran `/council code` (code_reviewer · frontend_engineer · ui_ux_designer · security_expert + Tech Lead arbiter) in parallel with an independent **Codex** review. No P0/critical. Fixed all 🟡 important findings in-session (verified in-browser):
1. **Setter focus lost on pick path** (Codex) — `closeSetter` now re-queries the badge by guest id (the row is rebuilt by `render()` before close); focus returns to the new badge. ✓ verified.
2. **Stat tile mislabeled** (Codex) — "Invited" → **"Total"** (it showed `total`, not invited-count). ✓
3. **z-index scale** (frontend) — RSVP setter (72) / setter-scrim (70) / offline banner (75) moved **below** `.modal-scrim` (80) so a modal stays the top context.
4. **Dropzone drag feedback dead** (frontend) — JS now toggles `is-dragover` (matches the shell rule). ✓ verified.
5. **`editingId` stale after close** (code_reviewer) — `MutationObserver` on the modal's `aria-hidden` resets it on every close path.
6. **Filter-chip roving tabindex** (Codex) — initialised in markup (`[0,-1,-1,-1,-1]`). ✓ verified.
7. **Setter Tab + `aria-modal`** (arbiter UPHELD-w/-mod) — added `aria-modal`, role `menu`/`menuitemradio`, and Tab now **cycles** the options. ✓ verified.
8. **No live-region / `aria-busy`** (ui_ux) — added `#gm-live` polite announcer ("N guests shown") + `aria-busy` on the list during skeleton. ✓
9. **`aria-pressed` on count tiles** + menu semantics fix stale `aria-checked`.
10. **CSV counts** (code_reviewer + Codex) — preview / imported / toast now all derive from one `IMPORT_NAMES` source.
Bonus: reduced-motion guards for the rate bar + count-tile smooth-scroll.

**Arbiter rulings:** "whole status column is color-only (WCAG 1.4.1)" → **OVERRULED** (every badge has dot **+ text label**). `[data-status-dot]` dup → **upheld-w/-mod** (single-source into shell — deferred to `components.html` pass).

**Deferred (suggestions / follow-ups):** single-source the status→dot map into shell + align "pending" greys · "Not invited" amber → neutral/outline (clashes with "Maybe") · skeleton CLS + fade · 44px search-clear button · `.guest-row` hover-lift · dead `.guest-row-actions`/`.gm-sort` CSS cleanup.

### Mobile redesign pass (2026-06-04) — founder feedback

Founder flagged mobile as cramped, the sort dropdown wrong/misplaced, and spacing off. Fixed + verified at 360/390 dark+light:
1. **Guest row redesigned** — was a 145px 4-row stack (avatar floating in 51px of dead space, 44px badge + invite each on their own line). Now a compact **~65px row**: name+contact wrapped in one tight block (a reset `<button>` = tap-the-guest-to-edit), status badge inline right (chevron dropped on mobile), "Not invited" chip only when relevant (invited shows nothing). The separate pencil was removed — the name block IS the edit trigger (keyboard-accessible `<button>`), which also freed the name column from 110px → 157px (no more early truncation).
2. **Sort dropdown replaced** — the native full-width `<select>` (jarring OS dropdown, weird placement) → a compact **`↕` Sort icon-button** that opens the **same sheet/popover** as the RSVP setter. Generalised the setter into a reusable `openPicker({title,options,current,onPick,refocus})`; both RSVP and Sort use it (DRY). `data-set`→`data-val` in the setter CSS.
3. **Toolbar + spacing** — mobile is now: search → full-width **Add guest** → 3 compact utility icons (Send/Import/Sort, labels collapse <560px) → chips. Tightened list-card + row padding. No horizontal scroll at 360px; desktop stays a 4-col aligned table.

**Security forward-notes for the React port** (prototype confirmed XSS-clean — no innerHTML): server-side phone/email validation · CSV server-side parse + **formula-injection** sanitization + row/size caps · consent persisted with audit · **RSVP link token must be CSPRNG, not the sequential `gst.id`** (IDOR) · RLS + ownership authz on guest PII · no PII in RSVP-link query params · rate-limit anon RSVP + import endpoints.
