# Settings page — audit-fix + Profile redesign plan

**Page:** `designs/pages/settings/settings.html`
**Date:** 2026-05-14
**Owner:** Abhijith
**Scope:** Fix all P0/P1/P2/P3 from the shell-component audit + redesign the Profile Information section in an identity-led layout.

---

## User goal

- Resolve the visible "saturated red border" bug on every form-input across the app (P2 root-cause in `shell.css`).
- Remove inline JS / inline style violations on `settings.html` so it complies with the design path's "no inline CSS/JS, ever" rule.
- Make the Profile Information section feel intentional — elevate identity (avatar) and resolve the awkward 3-column layout that squeezes the Email row.
- All changes ride on shell primitives. New CSS lands in `shell.css` only when generic; page-specific styles stay in `settings.css`. New JS for page-specific behavior lands in a new `designs/pages/settings/settings.js`.

## Out of scope

- Tailwind CDN → project build (deferred at the integration phase).
- Promoting `choice-card` to `shell.css` (defer until 2nd consumer).
- Form-validation JS helper (`data-validate` hook) — listed as separate follow-up in `NEXT-SESSION.md`.
- Notification Preferences / Security section visual redesign — only the form-input bug fix touches them.

---

## Element-by-element categorisation

### Profile Information section (redesigned)

| Element | Source | Action |
|---|---|---|
| Section header (`PROFILE INFORMATION` eyebrow + bar) | `shell.css` `.section-rule` + `.section-rule-bar` | Reuse as-is |
| Outer card surface | `shell.css` `.clay-card` | Reuse as-is (hover suppression already in `settings-card-inner`) |
| 2-column layout (avatar left, fields right) | New page-specific grid | Add to `settings.css` — replaces current 3-col grid |
| Avatar 120px | `shell.css` `.avatar-edit` + new `.avatar-edit-lg` modifier | **Extend** — add `avatar-edit-lg` modifier in shell.css (96px stays default) |
| "Change photo" text button under avatar | `shell.css` — needs a `btn-text` primitive | **New, generic** — add `btn-text` (subdued, brand-on-hover) to shell.css. Used everywhere a button needs to read as inline-link-action |
| Full Name field | `shell.css` `.form-group` + `.form-label` + `.form-input` | Reuse as-is |
| Phone field with `+91` prefix | `shell.css` `.form-input-group` + `.form-input-prefix` + `.form-input-field` | Reuse as-is (already exists; previously used raw text — fix) |
| Email field | `shell.css` `.form-group` + `.form-label` + `.form-input` | Reuse as-is |

### P0 — Inline JS removals + hoists

| Item | Current | New |
|---|---|---|
| Password-toggle IIFE | Inline in `settings.html:295–306` (DUPLICATE of `shell.js:382–397`) | **Delete inline block.** `shell.js` handler is the canonical owner. |
| `.toggle-switch` click handler | Inline in `settings.html:309–314` (only here) | **Hoist to `shell.js`** as a delegated `document.addEventListener('click', …)` next to the password-toggle IIFE. Flips `aria-checked` on `[role="switch"].toggle-switch`. Also handle `Space`/`Enter` keydown for keyboard parity. |
| `data-toggle-card` choice-card handler | Inline in `settings.html:317–324` | **Move to new `designs/pages/settings/settings.js`** (page-specific component). |
| `<script src="settings.js">` tag | Not present | Add at end of body after `shell.js` tag. |

### P1 — Inline `style="…"` attribute removals

| Hit | File:line | Replacement |
|---|---|---|
| Active-page nav button background/color | `settings.html:70` | Add `.fn-icon-btn[aria-current="page"]` rule in `shell.css` next to existing `.fn-icon-btn` block. Sets `background:var(--brand-tint); color:var(--brand)`. Apply to any nav icon-button that uses `aria-current="page"`. |
| Breadcrumb copy icon `font-size:15px` | `settings.html:100` | Bake into `.bc-copy .material-symbols-outlined { font-size:15px }` in `shell.css`. Then remove the inline attr. |
| `.help-fab` `box-shadow` | `settings.html:284` (and every other page that uses help-fab) | Move `box-shadow:var(--shadow-clay-pill)` into the existing `.help-fab` rule in `shell.css`. Remove from all consumers. |

### P2 — Form-input red border (root cause in shell.css)

**Problem:** `shell.css:822` — `.form-input { border:1px solid var(--brand-tint-2); }`. In dark mode `--brand-tint-2 = rgba(238,63,58,0.18)`, which against `--card #18181b` reads as "semi-focused at rest." Affects every form-input on every page.

**Fix direction:** Re-base the default border on `var(--line)`. Reserve brand-tinted borders for hover/focus/invalid states (matches `.clay-card`, `.choice-card`, `.lg-glass-card` patterns).

**Variants to update (all in shell.css):**

| Selector | Current default border | New default |
|---|---|---|
| `.form-input` (line 822) | `1px solid var(--brand-tint-2)` | `1px solid var(--line)` |
| `.form-input-group` (line 1127ish) | inherits / mirrors form-input | `1px solid var(--line)` |
| `.form-input-trigger` (line 1177ish) | inherits | `1px solid var(--line)` |
| `.form-textarea` | mirrors form-input | `1px solid var(--line)` |
| `.form-select` | mirrors form-input | `1px solid var(--line)` |
| `.pin-input` cells | mirrors form-input | `1px solid var(--line)` |

**State rules — unchanged:**
- `:hover` → `border-color: color-mix(in oklab, var(--brand) 35%, var(--brand-tint-2))` (already correct)
- `:focus` → `border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-tint)` (already correct)
- `[aria-invalid="true"]` → `border-color: #ef4444; box-shadow: 0 0 0 4px rgba(239,68,68,.12)` (already correct)
- `:disabled` → `opacity:.55; cursor:not-allowed` (already correct)

### P3 — `.settings-nav-inner` `!important` cleanup

| Current | New |
|---|---|
| `settings.css:171–172` uses `!important` on `grid-template-columns` and `padding` to override `.floating-nav-inner` | Add `.floating-nav-inner.is-minimal` modifier in `shell.css` that sets `grid-template-columns:auto 1fr auto; padding:.4rem .55rem .4rem 1.1rem`. Replace the `settings-nav-inner` class on `<div class="floating-nav-inner">` in `settings.html` with `is-minimal`. Delete the `.settings-nav-inner` rule from `settings.css`. |

---

## File-by-file change list

### `designs/shared/shell.css` (the heaviest file)

1. **P2** — `.form-input` default border → `var(--line)`.
2. **P2** — repeat for `.form-input-group`, `.form-input-trigger`, `.form-textarea`, `.form-select`, `.pin-input` cells.
3. **P1** — new rule `.fn-icon-btn[aria-current="page"] { background:var(--brand-tint); color:var(--brand) }`.
4. **P1** — new rule `.bc-copy .material-symbols-outlined { font-size:15px }`.
5. **P1** — add `box-shadow:var(--shadow-clay-pill)` to the existing `.help-fab` rule.
6. **P3** — new `.floating-nav-inner.is-minimal` modifier (grid-template + padding override).
7. **Redesign** — new `.avatar-edit-lg` modifier (120px variant of `.avatar-edit`).
8. **Redesign** — new `.btn-text` primitive — subdued text-button, brand on hover, no background, no border, ≥44px touch-target padding, focus-visible ring.

### `designs/shared/shell.js`

1. **P0** — new delegated handler for `.toggle-switch[role="switch"]` clicks → flip `aria-checked`. Add `Space`/`Enter` keydown handler too.
2. No other changes.

### `designs/pages/settings/settings.html`

1. **P0** — delete inline `<script>` IIFE for password-toggle (lines 295–306).
2. **P0** — delete inline `<script>` IIFE for `.toggle-switch` (lines 309–314).
3. **P0** — delete inline `<script>` IIFE for `data-toggle-card` (lines 317–324).
4. **P0** — add `<script src="settings.js">` tag after the shell.js tag.
5. **P1** — remove `style="background:var(--brand-tint);color:var(--brand)"` from settings nav icon-button (line 70).
6. **P1** — remove `style="font-size:15px"` from breadcrumb copy icon (line 100).
7. **P1** — remove `style="box-shadow:var(--shadow-clay-pill)"` from `.help-fab` button (line 284).
8. **P3** — replace `class="floating-nav-inner settings-nav-inner"` with `class="floating-nav-inner is-minimal"` (line 50).
9. **Redesign** — rewrite the Profile Information `<section>` markup (lines 116–149):
   - Outer wrapper: `<div class="clay-card settings-card-inner"><div class="settings-profile">…</div></div>`
   - Left column: `<div class="settings-profile-identity">` containing `.avatar-edit.avatar-edit-lg` + a `<button class="btn-text">Change photo</button>`
   - Right column: `<div class="settings-profile-fields">` containing 3 `<div class="form-group">` rows — Full Name, Phone (now using `.form-input-group` with `+91` prefix), Email

### `designs/pages/settings/settings.css`

1. **P3** — delete the `.settings-nav-inner` rule (lines 170–173).
2. **Redesign** — replace `.settings-profile` grid rules (lines 35–61) with the new 2-col layout:
   - `.settings-profile` → `grid-template-columns: 1fr` on mobile, `auto 1fr` on `≥768px`, `gap: 2rem`
   - `.settings-profile-identity` → flex-column, `align-items:center` on mobile, `align-items:flex-start` on `≥768px`, `gap:.75rem`
   - `.settings-profile-fields` → flex-column, `gap:1.25rem`
   - Remove `.settings-avatar-block` + `.settings-avatar-label` rules (the new layout doesn't need them; "Change photo" lives as a `btn-text` directly under the avatar).
3. No other section changes — Security / Notifications / Action-footer untouched.

### `designs/pages/settings/settings.js` (new file)

1. `data-toggle-card` delegated click handler — toggles `.is-active`, flips `aria-pressed`, updates the `[data-state-text]` label text between "Active" and "Inactive". Moved verbatim from the inline IIFE.

### `designs/components.html` — also touched (because shell primitives change)

1. **Update** the existing `.form-input` showcase tile screenshot/state demo if any state-of-rest screenshot now reads differently (visual only — the showcase markup itself doesn't change).
2. **Add** tile for `.btn-text` (new primitive) — alongside the existing `.btn-pill` showcase.
3. **Add** a tile for `.avatar-edit.avatar-edit-lg` next to the existing avatar-edit tile.

---

## Mobile-first behavior (≤767px)

- Profile Information card: avatar+ "Change photo" centers on top; fields stack below, each full-width.
- Phone field `+91` prefix stays inline (already does).
- All touch targets ≥44pt — `.btn-text` gets ≥44px hit area via padding.
- Card padding reduces to `1.75rem` (existing `settings-card-inner` rule).
- No horizontal scroll at 360px width.

## Accessibility checklist (UI/UX agent will verify)

- `.btn-text` must have `:focus-visible` ring (≥2px) — keyboard nav.
- "Change photo" button must have `aria-label="Change photo"` or visible text — visible text wins.
- `aria-current="page"` on nav button — already present, now CSS picks it up.
- New `.toggle-switch` handler in shell.js must keep `aria-checked` in sync — already in plan, plus Space/Enter keydown for keyboard parity.
- Default `.form-input` border `var(--line)` must keep ≥3:1 contrast against `--card` in both light + dark modes. Light: `#e5e7eb` on `#ffffff` ≈ 1.4:1 (border is decorative, not data — acceptable). Dark: `#2a2a2a` on `#18181b` ≈ very low but acceptable for decorative border. **Note for agent review:** verify this passes UI/UX standard for "decorative borders need not meet 3:1" — borders adjacent to filled controls don't carry semantic information.
- `:focus` state still gives ≥3:1 ring (`box-shadow: 0 0 0 4px var(--brand-tint)`) — unchanged.

## Risks / open questions for the agent

1. **`var(--line)` border too quiet in dark mode?** `--line = #2a2a2a` against `--card #18181b` is subtle. Want the agent's call: is this "calm + correct" or does it need to bump to `--line-soft +1` step? Light-mode reads fine (`#e5e7eb` on `#ffffff`).
2. **`.btn-text` placement under avatar — is the affordance clear without the camera badge?** The camera badge stays on the avatar; "Change photo" is a redundant second affordance, but redundancy improves discoverability. Agent confirms.
3. **`+91` prefix in Phone — should the cell be selectable (so a user can change country)?** For MVP Indian-only, no. Defer multi-country to a separate task. Agent confirms.
4. **Removing inline scripts may break `live-server` hot-reload semantics?** No — live-server reloads on file change regardless of script source. Risk is zero.

## Implementation order (build phase)

1. **P2 first** — shell.css form-input border re-base. Quick, applies globally, lets us judge the redesign against the corrected borders rather than the bugged ones.
2. **P1 inline-style sweep** — shell.css rule additions for `[aria-current="page"]`, `.bc-copy` icon size, `.help-fab` shadow. Strip the 3 `style="…"` attrs from settings.html.
3. **P3 `is-minimal` modifier** — shell.css addition + settings.html class swap + settings.css rule deletion.
4. **P0 inline-JS sweep** — shell.js gets the new `.toggle-switch` delegated handler. Create `designs/pages/settings/settings.js` with the choice-card handler. Delete the 3 inline IIFEs from settings.html. Add `<script src="settings.js">` tag.
5. **Profile redesign** — shell.css gets `.avatar-edit-lg` + `.btn-text`. settings.css gets the new `.settings-profile` 2-col grid. settings.html rewrites the Profile section markup.
6. **components.html** — add `.btn-text` tile + `.avatar-edit-lg` tile.

After each milestone, dispatch a UI/UX agent pass on the increment (per SKILL: "After each major component or section is built, run a quick UI/UX agent pass on that increment").

## Test phase (per SKILL)

Once all 6 milestones land:

- **Component-level** — every input renders in default / hover / focus / disabled / invalid; new `btn-text` in all states; `avatar-edit-lg` rendering correctly; `.toggle-switch` keyboard activatable.
- **Interaction** — password toggle fires exactly once per click (the duplicate-fire bug should be gone); 2FA toggle responds to mouse + Space + Enter; choice-cards still toggle; "Change photo" focusable and clickable.
- **Responsiveness** — 360/390/414/768/1024/1440px widths. Profile card reflows correctly at 768px breakpoint. No horizontal scroll. Touch targets ≥44px at all phone widths.
- **Cross-page** — open every other design page (event-control, dashboard, components, guests, invitations, planning, media, website) and verify the form-input border change didn't introduce regressions; help-fab still has its shadow; aria-current nav buttons highlight on every page that uses them.
- **Mobile device** — Abhijith opens settings.html on phone via LAN URL.
- **UI/UX agent post-build review** — final pass.

## Plan sign-off

- [x] UI/UX agent review pass — verdict: REVISE
- [x] Revisions captured below, scope reduced where agent pushed back, scope expanded where agent flagged gaps
- [x] Abhijith sign-off on revised scope

---

## Plan revisions (post-agent-review, 2026-05-14)

### Decisions captured

| Topic | Decision |
|---|---|
| Profile redesign | **Agent's call** — keep 96px existing `.avatar-edit`. Drop `.avatar-edit-lg` modifier. Drop `.btn-text` primitive. Camera-badge-only affordance. Fields take majority of card width. |
| `.help-fab` | **Promote to real primitive** — new base rule in shell.css with position/size/bg/color/shadow. Strip Tailwind utilities from all 9 consumer pages. |
| Loading/error states | **Sketch now** — Save button gets `.is-loading` state with spinner. Success uses existing `bc-toast` pattern. Avatar upload error uses `.form-error`. |
| 2-col breakpoint | **640px for Profile** section, 768px stays for Security section. |

### Net changes to file-by-file list

**`designs/shared/shell.css` — final list:**
1. **P2** — `.form-input` default border → `var(--line)`. Do NOT touch `.form-input-group` / `.form-input-trigger` (they compose `.form-input`).
2. **P2** — apply `var(--line)` default to `.form-textarea`, `.form-select select`, `.pin-input-cell` (these don't compose `.form-input`).
3. **P1** — new rule `.fn-icon-btn[aria-current="page"]` (strict equality — confirmed). Sets `background:var(--brand-tint); color:var(--brand)`.
4. **P1** — new rule `.bc-copy .material-symbols-outlined { font-size:15px }`.
5. **P1 + Promote** — new `.help-fab` base rule. Includes `position:fixed; bottom:max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom))); right:max(1.5rem, calc(1.5rem + env(safe-area-inset-right))); width:56px; height:56px; border-radius:9999px; background:var(--brand); color:#fff; display:inline-flex; align-items:center; justify-content:center; box-shadow:var(--shadow-clay-pill); z-index:30; transition:background-color .2s, transform .2s;`. Hover gated. Reduced-motion respected.
6. **P3** — new `.floating-nav-inner.is-minimal` modifier.
7. **Redesign — DROPPED:** `.avatar-edit-lg` modifier. Not needed.
8. **Redesign — DROPPED:** `.btn-text` primitive. Not needed.
9. **States — NEW:** `.btn-pill.is-loading` state — label + trailing icon hide, spinner shows. Add `.btn-pill-spinner` element rule (24px circle, `border:2px solid currentColor; border-top-color:transparent; border-radius:9999px; animation:btn-pill-spin .8s linear infinite`). `@keyframes btn-pill-spin` and a `@media (prefers-reduced-motion: reduce)` override that swaps the spin animation for a pulse.
10. **Avatar file-input — NEW:** `.avatar-edit-input` (visually-hidden file input) + `.avatar-edit-input:focus-visible + .avatar-edit-btn` (focus ring on label when input has keyboard focus).

**`designs/shared/shell.js` — final list:**
1. **P0** — delegated `.toggle-switch[role="switch"]` click handler. Flips `aria-checked` between `"true"` / `"false"`.
2. **P0** — keydown handler scoped to `[role="switch"].toggle-switch` — Space and Enter both toggle. **Critically:** `event.preventDefault()` on Space *before* toggling (stops page scroll on Firefox/Safari).
3. **Avatar upload — NEW:** delegated handler for `.avatar-edit-input` change event. On file pick, log file name, fire a success toast via the existing `#bc-toast` element (re-use the path-copied pattern).
4. **Verify** the existing global reduced-motion CSS at `shell.css:471` covers `.toggle-switch-thumb` `transform` transition. If not, add an override.

**`designs/pages/settings/settings.html` — final list:**
1. **P0** — delete inline `<script>` IIFEs (3 of them).
2. **P0** — add `<script src="settings.js">` after shell.js.
3. **P1** — strip 3 `style="…"` attributes.
4. **P1 + Promote** — strip Tailwind utility classes from the `.help-fab` button (`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover hover:-translate-y-0.5 transition-all z-30`). Leaves just `class="help-fab"`.
5. **P3** — swap `floating-nav-inner settings-nav-inner` → `floating-nav-inner is-minimal`.
6. **Redesign** — rewrite Profile section markup. New structure:
   ```
   <section class="settings-section reveal">
     <header class="settings-section-head">
       <h2 class="section-rule">
         <span class="section-rule-bar"></span>
         Profile information
       </h2>
     </header>
     <div class="clay-card settings-card-inner">
       <div class="settings-profile">
         <div class="settings-profile-fields">
           Full Name (form-group + form-input)
           Phone (form-group + form-input-group with +91 prefix span + form-input-field)
           Email (form-group + form-input)
         </div>
         <div class="settings-profile-avatar">
           <div class="avatar-edit">
             <span class="avatar-edit-img">A</span>
             <input type="file" id="avatar-upload" class="avatar-edit-input" accept="image/*">
             <label for="avatar-upload" class="avatar-edit-btn" aria-label="Change avatar">
               <span class="material-symbols-outlined">photo_camera</span>
             </label>
           </div>
           <p class="form-error" id="avatar-error" hidden>Avatar upload failed. Try again.</p>
         </div>
       </div>
     </div>
   </section>
   ```
7. **States — NEW:** Save button gets `.btn-pill-spinner` child element + `is-loading` toggle wiring.
8. **Mobile safe-area:** `.settings-actions` gets `padding-bottom: max(1rem, env(safe-area-inset-bottom))`.

**`designs/pages/settings/settings.js` (new):**
1. `data-toggle-card` delegated click handler (notification preference cards).
2. Save button click handler — flips `.is-loading`, sets `aria-busy="true"`, disables, after a 1.2s setTimeout removes loading state + shows success toast via `#bc-toast` (text: "SETTINGS SAVED").

**`designs/pages/settings/settings.css` — final list:**
1. **P3** — delete `.settings-nav-inner` rule.
2. **Redesign** — replace `.settings-profile` rules:
   - `.settings-profile` → `display:grid; grid-template-columns:1fr; gap:1.5rem`. At `min-width:640px` → `grid-template-columns:1fr auto; gap:2rem; align-items:start`.
   - `.settings-profile-fields` → `display:flex; flex-direction:column; gap:1.25rem`.
   - `.settings-profile-avatar` → `display:flex; flex-direction:column; align-items:center; gap:.5rem`. At `min-width:640px` → `align-self:start; justify-self:end`.
   - Delete `.settings-avatar-block` and `.settings-avatar-label`.

**`designs/components.html` — final list:**
1. Update form-input showcase tile note ("default border is now neutral; brand-tinted reserved for hover/focus/invalid").
2. **DROPPED:** `.avatar-edit-lg` tile (not built).
3. **DROPPED:** `.btn-text` tile (not built).
4. **NEW:** showcase tile for `.btn-pill.is-loading` (Buttons section).
5. **NEW:** showcase tile for the file-input avatar pattern (Avatars section).

### Explicitly deferred (documented, not missed)

- Tailwind CDN → project build migration (inline `tailwind.config = {…}` script at `settings.html:19–40` stays for this session — design prototypes only).
- `.bc-copy` Tailwind utility chain at `settings.html:99` — promote in a future pass (flag in NEXT-SESSION.md).
- Focus-trap considerations for `help-fab` source-order — flag in NEXT-SESSION.md.
- "Save disabled when nothing changed" form-state tracking — out of scope for this session.

### Acceptance criteria

- Password-toggle clicks once per click (no double-fire).
- 2FA toggle responds to mouse, Space (no page scroll), and Enter.
- All 3 inline `style=""` attrs removed from settings.html.
- All 3 inline IIFEs removed from settings.html.
- All form-input fields rest with a neutral `var(--line)` border in both light + dark modes (not red).
- Help-fab on every page renders identically without the Tailwind chain.
- Profile section reflows at 640px for fields/avatar, mobile shows avatar above fields.
- Save button enters loading state on click, shows toast on completion.
- Mobile (≤414px) — no horizontal scroll, touch targets ≥44px, action footer respects safe-area.

---

## Built

**Date:** 2026-05-14
**Verdict:** UI/UX agent post-build review → **APPROVE WITH NOTES**.

### What shipped

**`designs/shared/shell.css`** — modifications:
- `.form-input` default border `var(--brand-tint-2)` → `var(--line)`. Same change to `.form-textarea`, `.form-select select`, `.pin-input-cell`. `.form-input-group` / `.form-input-trigger` left untouched (they compose `.form-input` — agent flagged this in the plan review).
- New rule `.fn-icon-btn[aria-current="page"]` (strict equality) — sets brand-tint background and brand color for active nav-icon-buttons.
- New `.bc-copy` rule — replaces the Tailwind utility chain on the breadcrumb copy button. Includes hover-guarded color/bg, focus-visible ring, 15px icon size.
- New `.help-fab` base rule — promotes it to a real primitive. `position:fixed`, safe-area-aware bottom/right insets, 56×56, brand bg, clay-pill shadow, hover-gated transform, focus-visible outline. The existing media-query overrides keep their behavior but drop the `!important` since the base rule no longer fights inline styles.
- New `.floating-nav-inner.is-minimal` modifier — drops `!important` from settings.css.
- New `.btn-pill.is-loading` + `.btn-pill-spinner` rules — spinner shows centered, label/icon hide. `@keyframes btn-pill-spin` + reduced-motion fallback (`@keyframes btn-pill-pulse`).
- New `.avatar-edit-input` (visually-hidden file-input) + `:focus-visible + .avatar-edit-btn` rule that surfaces the focus ring on the label when the input has keyboard focus.

**`designs/shared/shell.js`** — modifications:
- `window.evenzi.showToast` exposed for page-specific scripts.
- New delegated `.toggle-switch[role="switch"]` click + keydown (Space/Enter, both `preventDefault()` so the page doesn't scroll, with legacy `'Spacebar'` key string handled too).
- New delegated `change` handler on `.avatar-edit-input` — fires `PHOTO READY` toast on selection, enforces 5 MB cap with an `#avatar-error` text fallback, resets the input on rejection.

**`designs/pages/settings/settings.html`** — restructured:
- 3 inline IIFEs deleted (password-toggle was a duplicate of the global shell.js handler, causing double-fire bug; toggle-switch and choice-card handlers hoisted/moved).
- 3 inline `style="…"` attrs deleted (settings nav button, breadcrumb copy icon, help-fab).
- Tailwind utility chain stripped from `.help-fab` button — now bare `class="help-fab"`.
- Settings nav class swapped: `floating-nav-inner settings-nav-inner` → `floating-nav-inner is-minimal`.
- Profile section rewrites: new 2-col `.settings-profile` grid with `.settings-profile-fields` and `.settings-profile-avatar` children. Avatar 96px (unchanged) sits in right column on desktop, centers above fields on mobile via `order:-1`. Phone field now uses `.form-input-group` with split `+91` prefix span. `<label for="avatar-upload">` + visually-hidden `<input type="file">` replaces the old `<button>` — gives the camera badge a real file-picker affordance with correct keyboard semantics.
- Save button now includes `<span class="btn-pill-spinner">` child + `data-save` hook; Discard button has `data-discard`.
- New `<script src="settings.js">` tag.

**`designs/pages/settings/settings.css`** — modifications:
- `.settings-profile` rewritten — `1fr` mobile, `1fr auto` at `≥640px`. `.settings-profile-fields` / `.settings-profile-avatar` children. Old `.settings-avatar-block` / `.settings-avatar-label` deleted.
- `.settings-actions` gains `padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px))` for iOS PWA home-indicator clearance.
- `.settings-nav-inner` `!important` rule deleted (replaced by `is-minimal` modifier in shell).

**`designs/pages/settings/settings.js`** — new file:
- Delegated `[data-toggle-card]` click handler (notification preference cards) — flips `.is-active`, `aria-pressed`, `[data-state-text]` label.
- Delegated `[data-save]` click handler — flips `.is-loading`, `aria-busy`, disables; 1.2s timer; success toast `SETTINGS SAVED`. Delegated `[data-discard]` handler — fires `CHANGES DISCARDED` toast.

**8 other design pages** — `index.html`, `components.html`, `pages/website/website.html`, `pages/planning/planning.html`, `pages/event-control/event-control.html`, `pages/invitations/invitations.html`, `pages/media/media.html`, `pages/guests/guests.html`:
- Stripped the `fixed bottom-6 right-6 w-14 h-14 rounded-full bg-brand text-white flex items-center justify-center hover:bg-brand-hover hover:-translate-y-0.5 transition-all z-30` chain + inline `style="box-shadow:..."` from `.help-fab` button. Now bare `class="help-fab"`. Icon `text-2xl` Tailwind class dropped — shell rule sets font-size.

**`designs/components.html`** — showcase updates:
- B2 Buttons tile gained a `.btn-pill.is-loading` showcase row (primary + secondary loading variants).
- AV1 Avatar editor tile gained a 3rd variant — the `<label for="">` + hidden `.avatar-edit-input` file-input pattern.
- S5 Help FAB tile rewritten — now uses `class="help-fab"` with inline `position:static` override for inline-showcase display (canonical primitive instead of dead Tailwind chain).

### Acceptance criteria — all PASS

UI/UX agent post-build review verified each one with file:line evidence. Highlights:
- Password-toggle fires once per click (double-fire bug fixed)
- 2FA toggle responds to mouse, Space (no page scroll), Enter
- All 3 inline `style=""` attrs removed
- All 3 inline IIFEs removed
- Form-input default border is `var(--line)` in light + dark
- Help-fab renders identically on all 9 pages without Tailwind chain
- Profile reflows at 640px (avatar above fields on mobile)
- Save button enters loading state on click; toast on completion
- Mobile ≤414px: no horizontal scroll, ≥44px touch targets, safe-area on action footer

### Test phase results

- **Console**: clean (only `cdn.tailwindcss.com should not be used in production` — explicitly deferred).
- **Interactions**: password-toggle no-double-fire (verified password→text after 1 click), toggle-switch keydown with `defaultPrevented:true` on Space, choice-card click flips all 3 state hooks, save button enters/exits loading state with correct ARIA, success toast appears.
- **Mobile 360px**: avatar centers above fields, `+91` prefix readable next to 10-digit number, neutral borders, no horizontal scroll. Touch targets confirmed ≥44px.
- **Desktop 1440px**: 2-col layout (fields left, avatar right), section header + breadcrumb intact, help-fab visible bottom-right with shadow.
- **Light mode**: borders read as quiet gray on white — no red. Avatar + camera badge legible.
- **Dark mode**: borders read as `#2a2a2a` on `#18181b` — calm-and-correct per agent's "decorative borders need not meet 3:1" verdict.
- **Cross-page regression**: index.html (dashboard) help-fab renders with single class, position:fixed, brand bg, shadow. components.html: 10 form-inputs all use the new border. Computed `borderColor: rgb(42, 42, 42)` matches `--line` dark.

### Open follow-ups (flag for NEXT-SESSION.md)

1. **`.help-fab` hidden ≤768px** — agent flagged. Mobile has no visible help affordance on the tool-rail either. Either add help to mobile rail or relax breakpoint to ≤640px.
2. **`.bc-copy` Tailwind chain at `settings.html:99`** — still raw `hidden md:inline-flex`. The new `.bc-copy` shell rule covers the rest. Promote to a real modifier in a future pass.
3. **Tailwind CDN + `tailwind.config = {…}` inline script at `settings.html:16–40`** — explicitly deferred per plan. Resolves when migrating to the Next.js Tailwind build.
4. **Security section breakpoint drift** — plan note said 768px stays for Security; actual code uses 880px (unchanged from before). Functionally fine; document if 880 becomes the standard.
5. **`status-badge` primitive** — still the most-requested deferred P1 from last session's audit. Not addressed here.
6. **Form-validation JS helper (`data-validate` hook)** — still high-value follow-up.
