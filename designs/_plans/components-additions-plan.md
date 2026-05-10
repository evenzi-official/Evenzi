# components.html — additions plan (2026-05-11)

Extension to `designs/components.html` + `designs/shared/shell.css`. Adds form-fields section, dialogs section, avatar sub-section, and 10 new shell primitives. Drops legacy `clay-pill` CTA at B2 in favor of canonical `btn-pill` set.

## User assignment

Both — Host (form fields, modals, OTP, file upload) and Guest (radio-pill-group on RSVP, bottom-sheet on mobile, status-badge variants). The component shelf serves all users; tile copy is Evenzi-specific (Indian names, +91, ₹).

## Why now

Last session's open follow-up flagged the gap. UI/UX agent confirmed: Event CRUD wizard, Auth completeness, Add Guest, and the public RSVP page all block on this set. Building the canonical set now stops 5 future pages from forking primitives.

## Decisions locked (founder sign-off, 2026-05-11)

| Q | Decision |
|---|---|
| Scope | Large — 12 showcase tiles (already in shell) + 10 P0 missing primitives |
| Legacy `clay-pill` "VIEW DETAILS" CTA | Delete |
| Mobile dialog pattern | Bottom-sheet `<768px`, centered modal `≥768px` — single component, two presentations |
| `form-textarea` radius | `clay-sm` (16px) |
| Date / time picker | Native `<input type="date"/"time">` with styled trigger |

P1/P2 deferred: `data-table`, `status-badge`, `dropdown-menu`, `chip-input`, `file-upload-zone`, `image-thumb-grid`, `skeleton-shimmer`, `error-state` block, `progress-step-indicator`, generic `tooltip`, charts, `notification-banner`, command palette, rich-text editor.

## Section restructure (9 → 12 sections)

```
01 · Foundations                               (no change)
02 · Shell / Chrome                            + fn-notif-panel static demo (S8)
03 · Surfaces                                  (no change)
04 · Pills & Chips                             (no change)
05 · Buttons & Controls                        - drop legacy B2 CTA
                                               + btn-pill primary/secondary/lg (B2 new)
                                               + toggle-switch (B8)
                                               + nav-tabs standalone segmented (B9)
06 · Form fields                               NEW SECTION — all form primitives
07 · Avatars & people                          NEW SECTION — avatar-edit, avatar-stack
08 · Data Display                              + scrollable-list tile (D8)
09 · Section / Layout primitives               + section-rule (L4)
                                               replace L3 with empty-cta-card
10 · Dialogs                                   NEW SECTION — modal + bottom-sheet
11 · Background flourishes                     (no change, renumbered from 8)
12 · Motion patterns                           (no change, renumbered from 9)
```

## A — Showcase tiles for already-existing primitives (no new CSS)

| ID | Component | Section | Notes |
|---|---|---|---|
| S8 | `fn-notif-panel` | 02 · Shell | Static demo — 3 items, 1 unread "Karthik & Ananya confirmed". Header + list + footer pattern |
| B2 | `btn-pill` set (replaces legacy) | 05 · Buttons | Primary `SAVE EVENT →`, primary hover, primary disabled, primary with leading icon `Add guest`, secondary `CANCEL`, secondary hover, lg `PUBLISH EVENT WEBSITE` |
| B8 | `toggle-switch` | 05 · Buttons | Three rows: "Email me when guests RSVP" (on), "Two-factor authentication" (off + helper "Recommended"), "WhatsApp delivery reports" (on, disabled — paid-tier only) |
| B9 | `nav-tabs` standalone | 05 · Buttons | "Guests · Planning · Media · Website" segmented control. A11y note tile-side: `role="tablist"` ↔ panels; for filter toggles use `role="radiogroup"` |
| F1 | `form-input` + `form-label` + `form-helper` | 06 · Form fields | Stacked states: default ("EVENT NAME" / "Anya & Kabir's Wedding"), hover, focus, error (`aria-invalid="true"` + helper "We need this to generate your invitation link"), disabled ("Phone (+91) · 9876543210" — verified) |
| F2 | `form-password` | 06 · Form fields | Closed (dots) + open (visible). Helper "8+ characters, one number" |
| AV1 | `avatar-edit` | 07 · Avatars & people | Initials "A" with camera badge + image variant + camera-badge hover |
| AV2 | `avatar-stack` | 07 · Avatars & people | 3 avatars no overflow, 5 + "+12", 1 single. Indian names |
| D8 | `scrollable-list` | 08 · Data Display | 8 checklist-rows in scrollable container with mask-fade demo |
| L3' | `empty-cta-card` | 09 · Layout | Replace placeholder L3. Real copy: "Create your first event" / "Tap to start the 4-step Curator". Default + hover side-by-side |
| L4 | `section-rule` | 09 · Layout | "PROFILE INFORMATION" + "DANGER ZONE" — paired with L1 eyebrow showing the difference |

## B — New primitives in shell.css (10 P0)

For each: lives in shell.css, gets a showcase tile in components.html, follows existing token system (no hardcoded hex).

### F3 · `form-textarea`

```html
<div class="form-group">
  <label class="form-label">EVENT DESCRIPTION</label>
  <textarea class="form-textarea" rows="4" placeholder="Tell guests what to expect…"></textarea>
  <span class="form-helper">120 / 500 characters</span>
</div>
```

CSS: `border-radius:16px` (clay-sm), `padding:.85rem 1.1rem`, `min-height:96px`, `resize:vertical`, `max-height:240px`. Same border / focus / error states as `form-input`. `.form-textarea[aria-invalid="true"]` mirrors form-input red ring. Hover guard.

### F4 · `select-pill`

```html
<div class="form-group">
  <label class="form-label">EVENT TYPE</label>
  <div class="form-select">
    <select><option>Wedding</option>…</select>
    <span class="form-select-chevron material-symbols-outlined">expand_more</span>
  </div>
</div>
```

CSS: `.form-select` is a `position:relative` wrapper. Native `<select>` styled like `form-input` (pill, 44px, padding-right: 2.5rem for chevron room). Chevron is `pointer-events:none`, positioned absolute right. Native picker on mobile (iOS/Android). Hover/focus inherit from `form-input`.

### F5 · `phone-input` (= `form-input-group` with `form-input-prefix`)

```html
<div class="form-group">
  <label class="form-label">PHONE</label>
  <div class="form-input form-input-group">
    <span class="form-input-prefix">+91</span>
    <input class="form-input-field" type="tel" inputmode="numeric" placeholder="9876543210" maxlength="10">
  </div>
</div>
```

`.form-input-group` is a flex container styled identically to `form-input` (pill border, focus ring on `:focus-within`). Inner `.form-input-field` has no border, transparent background. `.form-input-prefix` has muted color, divider on right (`border-right:1px solid var(--brand-tint-2)`), `padding-right:.7rem`. Sets up currency-input (`₹`) as a free P1 reuse path — flagged in plan, not built this session.

### F6 · `date-picker-trigger` + `time-picker-trigger`

```html
<div class="form-group">
  <label class="form-label">EVENT DATE</label>
  <button type="button" class="form-input form-input-trigger" data-date-trigger>
    <span class="form-input-trigger-value">Sat · 22 Dec 2025</span>
    <span class="material-symbols-outlined">calendar_month</span>
  </button>
  <input type="date" class="sr-only" tabindex="-1" aria-hidden="true">
</div>
```

Visually: pill with trailing icon. JS (in shell.js, minimal): clicking the button focuses the hidden `<input type="date">` which opens the native picker. `change` writes the formatted DD/MM/YYYY string back to the trigger label. `.sr-only` is a standard accessibility utility. Time variant: `<input type="time">` + 12-hour rendering. Same trigger style.

### F7 · `pin-input` (OTP code)

```html
<div class="pin-input" data-len="6" role="group" aria-label="6-digit code">
  <input class="pin-input-cell" maxlength="1" inputmode="numeric" autocomplete="one-time-code">
  <input class="pin-input-cell" maxlength="1" inputmode="numeric">
  …×6
</div>
```

CSS: flex row, gap `.5rem`. Each cell `.pin-input-cell` is 44×52px, `border-radius:12px`, font 22px center, brand border on `:focus`. Inherits `form-input` token treatment via local class duplication (not extends — different layout). JS in shell.js: auto-advance on input, backspace falls back to previous cell, paste-handling distributes across cells. `autocomplete="one-time-code"` triggers iOS SMS auto-fill.

### F8 · `radio-pill-group`

```html
<div class="radio-pill-group" role="radiogroup" aria-labelledby="rsvp-q">
  <span id="rsvp-q" class="form-label">YOUR RSVP</span>
  <button type="button" role="radio" aria-checked="true" class="radio-pill is-checked">
    <span class="material-symbols-outlined icon-fill">check_circle</span>
    Yes, I'll be there
  </button>
  <button type="button" role="radio" aria-checked="false" class="radio-pill">…</button>
  <button type="button" role="radio" aria-checked="false" class="radio-pill">…</button>
</div>
```

CSS: stacked flex column with gap. `.radio-pill` is a clay-card-like pill (height auto, padding 14px 18px, `border-radius:9999px`, `border:1px solid var(--brand-tint-2)`). `.is-checked` + `[aria-checked="true"]`: `background:var(--brand-tint)`, `border-color:var(--brand)`, `color:var(--brand)`, leading icon visible. Unchecked: icon hidden via `:not(.is-checked) .material-symbols-outlined { display:none }`. `≥480px`: horizontal row layout. JS later for keyboard arrow navigation per ARIA radiogroup spec — out of scope for showcase.

### F9 · `form-error` + `form-helper-success`

```html
<p class="form-error" role="alert">
  <span class="material-symbols-outlined">error</span>
  Mobile number must be 10 digits
</p>
<p class="form-helper form-helper-success">
  <span class="material-symbols-outlined">check_circle</span>
  OTP verified
</p>
```

CSS: `.form-error` color = `#ef4444` (matches the existing `form-input[aria-invalid]` ring color), font-size 12px, leading icon 14px. Spacing 4px between icon and text. `.form-helper-success` reuses `.form-helper` but color `#22c55e` (matches `bc-toast .bc-live`). Both never color-only — always icon + text per role-book a11y rule.

### DLG1 · `modal` + `sheet-bottom` (single component, two presentations)

```html
<div class="modal-scrim" data-modal-open>
  <div class="modal-card lg-glass-card">
    <h2 class="font-display font-bold text-xl">Send WhatsApp invitation?</h2>
    <p class="text-sm text-muted mt-2">142 guests will receive a message with the RSVP link.</p>
    <div class="modal-actions">
      <button class="btn-pill btn-pill-secondary">CANCEL</button>
      <button class="btn-pill btn-pill-primary">SEND <span class="material-symbols-outlined">arrow_forward</span></button>
    </div>
  </div>
</div>
```

CSS:
- `.modal-scrim`: `position:fixed`, full viewport, `background:rgba(17,24,39,0.5)`, `backdrop-filter:blur(8px)`, `display:flex`, `align-items:center`, `justify-content:center`, `padding:1rem`. `z-index:80` (above toast 60, below would-be sheets 80+).
- `.modal-card`: extends `.lg-glass-card`. `max-width:520px`, `width:100%`, `padding:1.5rem 1.5rem 1.25rem`. Drag-handle bar shown only in sheet variant.
- `.modal-actions`: flex row, gap `.6rem`, `justify-content:flex-end`, `margin-top:1.25rem`.
- `<768px`: `.modal-scrim { align-items:flex-end; padding:0 }`, `.modal-card { max-width:100%; border-radius:24px 24px 0 0; padding-bottom:calc(1.25rem + env(safe-area-inset-bottom)) }`. Drag handle bar appears via `::before` (4×40px pill, centered, top 12px).
- Animation: scrim fades, card slides up (sheet) or scales-in (modal). 180ms cubic-bezier. Respects `prefers-reduced-motion`.
- Showcase: render two demos side-by-side using a static "open" state (no JS toggle in showcase — wireup is page concern). One labeled "Modal · ≥768px" forced via class, one "Bottom sheet · <768px" forced via class. Use `.modal-scrim-static` modifier to disable `position:fixed` so they render inline.

JS hooks (added to shell.js): `[data-modal-open]` adds `body.no-scroll`; clicking scrim closes; `Esc` closes; focus-trap inside `.modal-card`. Trigger pattern: `<button data-modal-target="#m1">` opens `<div id="m1" class="modal-scrim">`. Out of scope for first build pass — showcase shows static open state.

## Test matrix (applied to every new primitive + every showcase tile)

1. **Component states** — every interactive primitive renders default / hover (with `@media (hover:hover)` guard) / focus / disabled / aria-invalid where applicable. Every input renders empty / filled / placeholder visible.
2. **Keyboard** — Tab order logical; Enter/Space activate buttons; Esc closes modal; native picker opens on date trigger via keyboard.
3. **Responsive** — components.html holds at 360 / 390 / 414 / 768 / 1024 / 1440. No horizontal scroll. Touch targets ≥44px on mobile widths. `radio-pill-group` stacks below 480, rows above. `modal` switches to bottom-sheet below 768.
4. **Cross-theme** — light + dark mode parity. Every new primitive uses tokens, no hardcoded hex except the two semantic colors (#ef4444 error, #22c55e success — already in shell elsewhere).
5. **Cross-page** — components.html → other pages via existing nav. No regression in 8 existing pages from shell.css edits (touch new primitives only, do not refactor existing).
6. **Mobile device test (manual)** — Abhijith opens components.html on phone via LAN URL. Walks every form field, taps OTP cells, opens date picker, opens modal, dismisses bottom-sheet.
7. **WhatsApp Android Webview test (deferred)** — out of scope for this session; flag for follow-up.
8. **UI/UX agent review** — final pass after build, agent critiques against role-book + finds new gaps.

## Build order

1. shell.css — add 10 new primitive blocks (F3–F9 + DLG1) at the end of the file, after the existing `@supports not` fallback block. Group with `═══` headers matching existing convention.
2. Update `@supports not` fallback to include `.modal-card` (Liquid Glass surface).
3. components.html — restructure to 12 sections. Drop legacy B2. Add 12 A-tiles + 10 B-tiles.
4. shell.js — add minimal date-picker-trigger handler + pin-input auto-advance (other JS deferred).

## Open follow-ups (post-build, not blocking)

- P1 primitives (`status-badge`, `data-table`, `dropdown-menu`/popover-panel generalization of fn-notif-panel, `chip-input`, `file-upload-zone`, `image-thumb-grid`, `skeleton-shimmer`, `error-state` block, `progress-step-indicator`, generic `tooltip`).
- Modal/sheet JS wireup (focus trap, scrim click, Esc) — deferred from this session.
- `radio-pill-group` keyboard arrow navigation per ARIA spec — deferred.
- WhatsApp Android Webview test — deferred.
- Currency input (₹) using `form-input-group` reuse path — not blocked, just not in scope.
- Status-badge color tokens (success / warning / danger / info) — flagged for next session.

## Built (2026-05-11)

### Shipped

**shell.css** — added 10 new primitive blocks (~370 lines) before the `@supports not` fallback:
- `.form-textarea` — multi-line, `clay-sm` (16px) radius, hover/focus/disabled/aria-invalid states
- `.form-select` + `.form-select-chevron` — native `<select>` styled as a pill, chevron rotation on focus
- `.form-input-group` + `.form-input-prefix` + `.form-input-suffix` + `.form-input-field` — phone (+91) and currency (₹) compositions, `:focus-within` border ring
- `.form-input-trigger` + `.form-input-trigger-value` — pill button for date/time, opens hidden native `<input>` sibling
- `.pin-input` + `.pin-input-cell` — 6-cell OTP, `:not(:placeholder-shown)` filled-state styling, narrower width below 380px
- `.radio-pill-group` + `.radio-pill` + `.is-checked` — stacked column on mobile, horizontal row ≥480px
- `.form-error` + `.form-helper-success` — semantic colors (`#ef4444` / `#22c55e`), icon + text never color-only
- `.modal-scrim` + `.modal-card` + `.modal-title` + `.modal-body` + `.modal-actions` — single component, two presentations (centered modal ≥768px, bottom-sheet <768px with drag handle bar). `.modal-static` showcase variant excluded from media query.
- `.btn-pill:disabled` + `.btn-pill[aria-disabled]` rule added (no longer needs inline `style="opacity:.5"`)
- `.cs-code` + `.cs-note` showcase utilities (replaced 23 verbatim inline `<code style="...">` blocks)
- `@supports not` fallback updated to include `.modal-scrim` (solid scrim for old Android Webview)

**shell.js** — added 4 new IIFEs (~190 lines) at end of file:
- Password show/hide — delegated, supports `data-pw-toggle="<id>"` and bare `data-pw-toggle` (resolves to previous `<input.form-input>` sibling)
- Radio pill group — click toggles `aria-checked` across siblings; ArrowUp/Down/Left/Right key navigation
- Date/time trigger — click focuses or `showPicker()`s the hidden native input sibling; `change` formats DD MMM YYYY (date) or 12-hour AM/PM (time) back to the label
- Modal/sheet — `[data-modal-target]` opens, `[data-modal-close]` + scrim click + Escape close. Focus-trap (Tab/Shift+Tab cycles within `.modal-card`), `lastFocused` restore on close, `body.no-scroll` lock

**components.html** — restructured 9 → 12 sections:
- 02 Shell/Chrome: + S8 fn-notif-panel static demo (3 sample items, 1 unread)
- 05 Buttons & Controls: dropped legacy "VIEW DETAILS" `clay-pill` CTA. Added B2 btn-pill set (primary / primary-hover / disabled / with-leading-icon / secondary / secondary-hover / lg full-width). B8 toggle-switch (3 rows: email-on / 2FA-off + recommended helper / WhatsApp PRO disabled). B9 segmented control reframed as `role="radiogroup"` (Active / Past / Archived) with explanatory note on tablist-vs-radiogroup.
- **06 Form fields** (new): FF1 text input states, FF2 password closed+revealed, FF3 textarea normal+error, FF4 select event-type+expense-category, FF5 input-group phone(+91)+currency(₹), FF6 date+time triggers, FF7 OTP 6-cell, FF8 radio-pill-group RSVP, FF9 inline error+success messages
- **07 Avatars & people** (new): AV1 avatar-edit initials+photo, AV2 avatar-stack 3 / 5+12 / 1
- 08 Data Display: + D8 scrollable-list (8 checklist rows in lg-glass-card with mask-fade)
- 09 Section/Layout: + L4 section-rule "Profile information" / "Danger zone". L3 replaced with empty-cta-card (default + hover side-by-side, real Evenzi copy "Create your first event")
- **10 Dialogs** (new): DLG1 modal centered (forced via `.modal-static`), DLG2 bottom-sheet (forced via `.modal-static-sheet`), live "Open dialog" button targeting a real `#cs-modal-live` rendered just before `</body>` (outside any `transform`-bearing ancestor — modal needs viewport containing block)
- 11 Backgrounds (renumbered from 8)
- 12 Motion (renumbered from 9)
- ID collision fix: Form-section tile labels renamed F1–F9 → FF1–FF9 (Foundations 01 already used F1 / F2 / F3)

### Verification passed

- Console: zero errors at desktop 1280 and mobile 390
- 12 sections present, 60 tile labels confirmed, all 22 new primitive classes resolve in DOM
- Legacy `clay-pill` "VIEW DETAILS" CTA confirmed removed
- Light + dark theme parity verified
- Modal: opens on `[data-modal-target]` click, body locks scroll, first focusable focuses, Tab cycles within `.modal-card`, Esc closes, focus restores to trigger
- Modal/bottom-sheet differentiation: showcase tiles render forced variants (centered DLG1 + sheet DLG2 even at 390px); live modal adopts bottom-sheet correctly at 390px
- Password toggle flips `type` and `material-symbols-outlined` icon
- Radio pill click moves `aria-checked` across siblings; arrow keys navigate
- Pin auto-advance focuses next cell on input
- Date trigger has correct hidden `<input type="date">` sibling
- Page-load focus lands on `<body>` (no `autofocus` theft)
- 23 `.cs-code` chips render with correct brand color tokens
- B9 confirmed `role="radiogroup"` with 3 radios (no longer contradicts the rule)

### Bug fixes during build

1. **Modal `<768px` media query also styled `.modal-static` showcase tiles** — DLG1 was rendering with drag handle bar at mobile widths even though it's meant to demonstrate the centered desktop modal. Fixed by scoping all bottom-sheet rules to `.modal-scrim:not(.modal-static)`.
2. **Live modal trapped inside a `.reveal` containing block** — `transform` on any ancestor scopes `position:fixed` to that ancestor (CSS containing-block rule), so the live modal's scrim + card rendered with the wrong dimensions and well below the viewport. Fixed by moving the live modal target to body level (just before `</body>`).
3. **Tile-ID collision** — Foundations section already used F1/F2/F3 for color/typography/radii. Form fields tiles renamed F1–F9 → FF1–FF9. Cross-reference in B9 description updated.

### UI/UX agent review pass — P1s addressed in same session

The post-build UI/UX agent review flagged 4 P1s; all fixed before close:
1. **B9 nav-tabs demo contradicted the rule it taught** (used `role="tablist"` with no panels in a tile that warned against exactly that). Reframed B9 as a `role="radiogroup"` filter (Active / Past / Archived).
2. **Pervasive inline `style="..."` for `<code>` chips** (15+ verbatim repeats, ~80 inline-style hits in new sections). Extracted `.cs-code` and `.cs-note` showcase utilities; 23 chip occurrences now use the class.
3. **FF1 `autofocus` stole keyboard caret on every page visit** (jumped past the page intro for screen-reader and tab users). Removed `autofocus`; visual focused state simulated via inline `border-color:var(--brand);box-shadow:0 0 0 4px var(--brand-tint)`.
4. **Modal had no focus-trap and no restore-focus-on-close** (Tab could escape the dialog; close dropped focus to `<body>`). Added `lastFocused = document.activeElement` capture, Tab/Shift+Tab cycle within `.modal-card`, restore on close.

### P2 cleanups also applied

- Dropped dead `data-radio-pill` attribute (shell.js doesn't read it; selector is `.radio-pill[role="radio"]`).
- Replaced inline `style="opacity:.5;cursor:not-allowed"` on B2 disabled button with `.btn-pill:disabled` shell rule.
- Added `placeholder=" "` to all 6 pin-input cells so `:not(:placeholder-shown)` filled-state styling works correctly.

### Open follow-ups

**P1 deferred (not blocking ship; surfaced by agent for next sprint):**
- Form-validation JS helper (`data-validate` hook) — without it, Auth/Wizard/Guest invite/RSVP page will each fork their own `form-error` wiring against the brand-new primitive
- Modal `aria-describedby` convention so `.modal-body` is announced by TalkBack alongside `.modal-title`
- WhatsApp Android Webview test of every new primitive (deferred from build; needs a real device session)

**P1/P2 from the original gap audit (still deferred):**
- `status-badge` (canonical color-coded pill set: success / warning / danger / info)
- `data-table` + responsive card-mode collapse (guest list, expense list, ticket list)
- `dropdown-menu` — generalize the `.fn-notif-panel` into a reusable `.popover-panel`
- `chip-input` (multi-value tag input)
- `file-upload-zone` (extends `.empty-cta-card`)
- `image-thumb-grid` (gallery)
- `skeleton-shimmer` (loading state primitive)
- `error-state` / `empty-state` block (full-surface "link expired" / "no guests yet")
- `progress-step-indicator` (wizard stepper distinct from `.cs-roadmap`)
- Generic `tooltip` (extract from tool-rail's `::after`)
- Bar/pie charts, notification banner, command palette, rich-text editor (P2)

**Code-quality follow-ups in `designs/`:**
- `settings.html` still has an inline IIFE for password toggle (lines 296+) duplicating the new shell.js handler. Remove inline copy.
- Existing `.nav-tabs` usage in `floating-nav` (lines 231–240 of components.html, plus every other page) uses `role="tablist"` for buttons that map to no panels. Match B9's reframing — convert to `role="radiogroup"` everywhere it's used as a filter, not as page-content tabs.
- FF1 long-content stress: showcase doesn't yet render a 90-char event name to prove wrap behavior. Add when expanding form-field tile copy.
- FF7 OTP error-state tile (showcase doesn't yet demonstrate `aria-invalid="true"` on `.pin-input` — primitive supports it, tile doesn't expose it).

