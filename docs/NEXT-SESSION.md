# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## Progress Tracker

### Full Document Suite (DONE — 2026-04-16)
- [x] Foundation docs (F1–F6 + Indian Events Dictionary) — `docs/foundation/`
- [x] Feature overviews for all 13 MVP modules — `docs/features/overviews/`
- [x] Ops docs (Platform Policies + Support Best Practices) — `docs/ops/`
- [x] Marketing docs (Brand Guidelines + Product Positioning) — `docs/marketing/`
- [x] PPT Script (investor + stakeholder) — `docs/presentations/`
- [x] Investor/User/Vendor Q&A scrutiny session — gaps identified and corrected
- [x] Open decisions documented — `docs/foundation/open-decisions.md`
- [ ] **5 open decisions need team discussion** — see `docs/foundation/open-decisions.md`
- [ ] **Share doc suite with Admin & Ops and Marketing & Branding teams via Google Drive**
- [ ] **Abhijith to fill 5 placeholders in `evenzi-ppt-script.docx` before presenting**

### Phase 1: ClickUp Setup (DONE)
- [x] Create Ideas list in Product space
- [x] Create workflow tags and assign to all existing tasks
- [x] Retroactive tracking — mark completed work (auth, designs, env vars)
- [x] Move post-MVP tasks to Ideas list
- [x] Update CLAUDE.md, ONBOARDING.md, PROJECT.md

### Phase 2: Feature Task Creation (MOSTLY DONE)
- [x] Create 9 feature parent tasks with descriptions and dependencies
- [x] Set feature dependencies in ClickUp
- [x] Clean up standalone tasks (deleted 32 flat tasks that didn't fit hierarchy)
- [x] Create `docs/clickup/` folder with 5 reference docs (TEMPLATES, GUIDELINES, WORKSPACE, INTAKE, DEPENDENCIES)
- [x] Add parallel subagent instructions to CLAUDE.md and start-session skill
- [x] Expand to 14 feature parents (added Landing, Admin, Event Mgmt Hub, Event Settings, User Settings)
- [x] Create full subtask hierarchy — 237 tasks across 10 features (Batches 1-3)
- [ ] **Batch 4 — remaining subtasks needed for:** Landing Section (86d2k1kwh), Admin Module (86d2k1kye), Digital Invitations (86d2jwza1), Digital Presence (86d2jwzge — partial, 1 component exists)
- [x] Sprint ClickApp enabled on all spaces

### Phase 2.5: Sprint Setup (NOT STARTED)
- [ ] Create Sprint 1 and assign features (Fix Vercel, Component Library, Auth)
- [ ] Create Sprint 2+ and assign remaining features per dependency order

### Phase 3: Implementation (IN PROGRESS)
- [x] **Fix Vercel Deployment (S — DONE)** — Live at evenzi.vercel.app
- [ ] Reusable Component Library (L — unblocks all UI work)
- [x] **Auth & Role Selection (M — DONE)** — Google OAuth, phone OTP, role selection, middleware routing, user_profiles table, auth-routing fix landed
- [ ] Profile Completion Gate — dashboard prompt for incomplete profiles (depends on User Settings)
- [x] **Event CRUD — 4-Step Wizard (XL — IN REVIEW)** — Spec done, 14 tasks implemented, 65 tests, E2E verified, revamp delivered, UI polish enhancement closed. Awaiting feature-level review.
- [x] **Host Dashboard (M — IN REVIEW)** — Server component with real event cards, hero CTA, empty state. Awaiting review.
- [ ] **Landing Section (L — IN PROGRESS)** — Subtask hierarchy in place (9 components). Static pages (Home, Layout, Legal) intentionally skip Backend Dev per JSON-config content architecture.
- [x] **Support Chatbot (MVP — PLANNED, not implemented)** — Spec + plan + multi-agent review + ClickUp hierarchy done. Blocked on Figma. Feature task: `86d2n3jxv`. See spec `2026-04-14-chatbot-design.md` and plan `2026-04-14-chatbot-implementation.md`.
- [ ] Event Management Hub (M — central navigation for event features)
- [ ] Guest Management & RSVP (L)
- [ ] Digital Invitations — WhatsApp (M)
- [ ] Planning Tools — Checklist & Budget (L)
- [ ] Media & Memories — Photo Gallery (M)
- [ ] Digital Presence — Event Website (L)
- [ ] Event Settings (M)
- [ ] User Settings (M)
- [ ] Admin Module (L — developer monitoring panel)

---

## Context

**Event CRUD is functionally complete.** Full 4-step wizard (Type → Details → Sub-Events → Review), success screen, dashboard with real event cards, all working end-to-end. Vercel deployment is live at evenzi.vercel.app.

---

**What was done this session (2026-05-15 — Celebratory Curator wizard + auth/settings improvements):**

- **Celebratory Curator wizard (NEW)** — full 5-screen event-creation flow in `designs/pages/create-event/`. Triggered from Dashboard's `+ Create event` nav button and the empty-CTA "Start a new event" card on `designs/index.html`. Per-step routing via sessionStorage state machine (`evz-event` key). All 5 screens: step-1-type, step-2-details, step-3-celebrations, step-4-review, success.
- **Wedding-only MVP scope** — Step 1 has Wedding clickable; Birthday, Anniversary, Corporate dimmed with brand-tinted "SOON" tag and `aria-disabled="true"`. Click on disabled card fires a toast `BIRTHDAY COMING SOON` etc.
- **New shell primitive**: `.cw-stepper` family — 4-step progress indicator with `.is-done` / `.is-active` / upcoming states, mobile-collapses labels at ≤640px, connector min-width tightens further at ≤380px to fit small phones.
- **New shell primitive**: `.btn-pill-danger` — for destructive-but-not-primary CTAs (Sign Out). Transparent bg, brand-red border/text, brand-tint hover.
- **Loading-state visual upgrade**: `.btn-pill-spinner` replaced from a rotating circle to **3 bouncing dots** (using ::before/::after pseudo-elements + staggered animation delays). Reduced-motion fallback swaps to synchronous opacity pulse. Show-rule generalised to `.is-loading > .btn-pill-spinner` so any button (`.btn-pill`, `.btn-google`, etc.) inherits the pattern.
- **Auth flow follow-ups landed**: Logo bumped to 1.625rem mobile / 1.875rem desktop. `.nav-tabs.auth-tabs` track bg switched from `var(--peach)` (which is `#1f2937` solid in dark) to `color-mix(in oklab, var(--brand) 6%, var(--card))` — fixes the dark-mode "navy ring around tabs" bug. `.nav-tab` made self-sufficient (transparent bg + border:0 + appearance:none) so UA defaults don't leak through when Tailwind preflight loads late. Theme-toggle added to all 3 auth pages with localStorage persistence.
- **Settings page**: Logout button added in a new "Account" section between Notification Preferences and the action footer. Uses the new `.btn-pill-danger` variant. Wired in `settings.js` to navigate to `../auth/auth.html` on click with loading state + toast.
- **Settings cross-page hardening**: `.theme-icon-light`/`.theme-icon-dark` specificity bumped to beat Material Symbols' default `display:inline-block` (was causing both icons to render simultaneously in light mode).
- **P1 #3 (en-IN date format)**: review screen renders `2026-09-15 → "15 Sept 2026"` via `toLocaleDateString('en-IN')`.
- **`[hidden]` safety net**: `.cc-shell [hidden] { display:none !important }` so any flex/grid child honouring the `hidden` attribute doesn't show through. Fixes Birthday review (no partners row, no itinerary section).

**Open follow-ups for next session:**

1. **P1 #5 — Page-chrome promotion to `.page-shell` family** (deferred). Currently `.auth-shell-*` and `.cc-shell-*` are duplicated across `designs/pages/auth/auth.css` and `designs/pages/create-event/create-event.css` (~80 LOC each). Promote a single `.page-shell-*` family into `shell.css` and update the 8 HTML files (auth.html, verify-otp.html, role-select.html, step-1/2/3/4-*.html, success.html) to use the new class names. Mechanical but careful work — risk is breaking 8 pages at once if a class name slips. Estimated 30-45 min.

2. **Anniversary celebrations** — agent flagged that Indian 25th/50th anniversaries often have a puja + reception arc. Currently anniversary is "Coming Soon"; when it ships, decide whether Step 3 (Celebrations picker) is shown or hidden. Hint: maybe a simpler 2-celebration default (puja + reception).

3. **Step 3 meta buttons** — "Set Time" / "Set Venue" inside each celebration card currently fire stub toasts. Defer to a later session: build the actual time/venue pickers, integrate with the dashboard event-detail page.

4. **Form-validation helper (`data-validate` hook)** — still the highest-value deferred follow-up. Auth + wizard + settings all duplicate small validators. A delegated handler in shell.js that reads `data-validate="required|min:10|pattern:..."` on inputs and flips `aria-invalid` + `.form-error` text would normalise the pattern.

5. **Real-device WhatsApp Webview testing** — auth flow + wizard need a phone pass. Pin-input distribution, dark-mode contrast, +91 prefix readability — all phone-screen-only checks.

6. **`status-badge` primitive** — most-requested deferred P1 from the 5/11 audit. Canonical success / warning / danger / info chips. The new `.role-tag-soon` and `.cc-type-tag` are early variants that should generalise.

7. **Refresh-on-Step-3-mid-selection** is now state-safe (immediate sessionStorage write on toggle), but Step 2 form fields only autosave on `input` events (250ms debounced). If the user refreshes mid-keystroke they may lose <250ms of typing. Acceptable trade-off; flag for future.

8. **Custom ceremony picker** on Step 3 — `[data-cc-add-custom]` fires a `CUSTOM CEREMONY PICKER` toast but does nothing. Likely a modal with a free-text input. Defer.

---

**Next session intent (2026-05-15):** **Design the Auth flow** — Login / Sign Up / Role Selection — as static HTML/CSS/JS prototypes in `designs/pages/auth/`.

Four screens to build (Abhijith provided a Stitch/Figma reference screenshot last session):
1. **Login** — Phone-number entry + `Send OTP` brand CTA + `OR` divider + `Continue with Google` secondary. Two pill tabs at top (`Sign Up` | `Log In`, active=dark). Card layout, brand wordmark top-left, "Need Help?" link top-right. Subtitle: "Get started with your free event website and AI photo sharing." Footer: terms-of-service + copyright.
2. **Sign Up** — Same layout, `Sign Up` tab active, title swaps to "Create your Evenzi account."
3. **Role Selection — variant A ("Brand Left Aligned")** — Two role cards side-by-side (Host / Event Owner · Vendor) with brand-tint icon, description, and `Continue as <role>` brand CTA. "← Back to Login" beneath. Page-foot: Privacy Policy · Terms of Service · Help Center.
4. **Role Selection — variant B ("Final Layout")** — Same role cards, lighter page chrome (just copyright in foot).

**Ground against:** the live React implementation at https://evenzi.vercel.app/auth — match the visual reality, not invent. The static prototype's goal is to lock visual language for the existing React port to be brought up to.

**Shell primitives already available (no new ones expected):**
- Pill tabs → use `.radio-pill-group` from FF6 (was originally OTP-section reframed; works as 2-tab segmented control with `role="radiogroup"`).
- Phone input → `.form-input-group` + `.form-input-prefix` `+91` + `.form-input-field` (now proven on the settings page Profile section).
- Send OTP CTA → `.btn-pill.btn-pill-primary.btn-pill-lg` with the new `.is-loading` state (also proven on settings page Save button).
- "Continue with Google" → likely needs a new `.btn-google` primitive (white bg, brand line border, Google G mark, label text) — **add to shell.css**, candidate for promotion if any other social-login surfaces appear.
- Role cards → reuse `.choice-card` from settings (notification preferences pattern) — promote from settings.css to shell.css since this is the second consumer (per the choice-card rule established in the settings audit-fix plan).
- "Need Help?" link, "← Back to Login" link → candidate `.btn-text` primitive that was DROPPED from the settings session (agent's call). Re-evaluate: with 2+ consumers now (auth back-link, future "Forgot password?"), **promote `.btn-text` to shell.css** in next session.
- Form-validation helper (`data-validate` hook) — **build this first** before Phone-number input wiring. Agent flagged as the highest-value deferred follow-up; auth flow is exactly the second consumer that triggers the "build now or fork twice" decision.

**Build order (proposed):**
1. UI/UX agent gap audit on the 4 screens against current shell.
2. Promote `.choice-card` to shell.css. Promote `.btn-text` to shell.css. Add `.btn-google` to shell.css.
3. Build `data-validate` helper in shell.js (handles required, pattern, custom-validator hooks; flips `aria-invalid` + `.form-error` text).
4. Create `designs/pages/auth/auth.html` + `auth.css` + `auth.js`. Tab swap via JS toggles title + form behavior. Single page handles login + signup + role-selection states via `body[data-step]`.
5. Test on phone — WhatsApp Android Webview test for the Google button + Phone OTP flow especially.

**What was done last session (2026-05-14 — settings page audit-fix + Profile redesign, no ClickUp tasks):**
- **All P0/P1/P2/P3 from the settings shell-component audit resolved.** Plan + post-build review: `designs/_plans/settings-audit-fix-plan.md` (verdict: APPROVE WITH NOTES).
- **P2 root-cause fix:** `.form-input` default border re-based from `var(--brand-tint-2)` (18% red in dark — read as "semi-focused at rest" on every input page-wide) → `var(--line)` (neutral). Same fix applied to `.form-textarea`, `.form-select select`, `.pin-input-cell`. `.form-input-group` / `.form-input-trigger` inherit via composition; not double-updated. Affects every form-input across the app.
- **P0:** Removed 3 inline IIFEs from `settings.html`. Duplicate password-toggle (was causing double-fire bug — verified fix). `.toggle-switch` keyboard handler hoisted to `shell.js` as delegated listener with `preventDefault()` on Space (stops viewport scroll on Firefox/Safari). `data-toggle-card` (choice-card) handler moved to new `designs/pages/settings/settings.js`.
- **P1:** Removed 3 inline `style=""` attrs. New shell rules: `.fn-icon-btn[aria-current="page"]` (strict equality), `.bc-copy` base + icon size + hover/focus, `.help-fab` base rule (was Tailwind-only). Stripped the 11-class Tailwind chain from `.help-fab` across all 9 design pages.
- **P3:** `.floating-nav-inner.is-minimal` modifier added to shell.css; `!important` rule deleted from settings.css.
- **Profile section redesigned to 50/50 split:** Mirrors Security section's `border-left` divider pattern at ≥640px. Fields take the left column (Full Name, Phone with new `+91` split prefix using `form-input-group`, Email); avatar 96px (kept compact — agent overrode original 120px push) on the right with vertical divider. Mobile (<640px) stacks avatar above fields via `order:-1`.
- **`<label for="avatar-upload">` + visually-hidden file-input pattern:** Camera badge is now a real file picker. New `.avatar-edit-input` rule in shell.css with `:focus-visible + .avatar-edit-btn` to surface focus ring on the label. shell.js delegated change handler enforces 5MB cap with `#avatar-error` recovery message; fires "PHOTO READY" toast on success.
- **New shell primitives:** `.btn-pill.is-loading` + `.btn-pill-spinner` with reduced-motion fallback (spin → opacity pulse). Save button on settings demonstrates the pattern; 1.2s simulated roundtrip + success toast `SETTINGS SAVED`.
- **iOS PWA safe-area:** `.settings-actions` now has `padding-bottom: max(1rem, env(safe-area-inset-bottom, 0px))`.
- **components.html showcase:** B2 Buttons gained `.btn-pill.is-loading` row (primary + secondary). AV1 Avatar editor gained a 3rd "File-input" variant demonstrating the `<label for>` pattern. S5 Help FAB tile rewritten — was still using the old Tailwind chain even after the build pass; agent caught it in post-build review.
- **UI/UX agent both pre-build (REVISE → revised) and post-build (APPROVE WITH NOTES). Final findings flagged:**
  - `.help-fab` hidden ≤768px but mobile tool-rail has no help entry either — design gap, flag for next session.
  - `.bc-copy` Tailwind chain `hidden md:inline-flex` still raw on settings.html — defer.
  - Tailwind CDN itself still on settings.html — defer to Next.js migration.
  - Security section breakpoint 880px (not 768) — keep, document.

**What was done previous session (2026-05-11 — components.html form fields + 10 new shell primitives, no ClickUp tasks):**
- Extended `designs/components.html` from 9 to 12 sections. New: **06 Form fields** (FF1–FF9), **07 Avatars & people** (AV1–AV2), **10 Dialogs** (DLG1–DLG2 + live demo). Added tiles in existing sections: S8 fn-notif-panel, B8 toggle-switch, B9 segmented-radiogroup, D8 scrollable-list, L4 section-rule. Replaced legacy `clay-pill` "VIEW DETAILS" CTA with canonical `btn-pill` set (B2). Replaced placeholder L3 with `empty-cta-card`.
- Added **10 new primitives** to `shell.css` (~411 lines): `form-textarea` (clay-sm radius), `form-select` + chevron (native picker, pill-styled), `form-input-group` + prefix/suffix/field (phone +91, currency ₹), `form-input-trigger` (date/time native picker bridge), `pin-input` 6-cell OTP, `radio-pill-group` (RSVP Yes/No/Maybe — `role="radiogroup"`), `form-error` + `form-helper-success` (semantic colors with icon — never color-only), `modal-scrim` + `modal-card` (single component, two presentations: centered ≥768px, bottom-sheet <768px with drag handle), `btn-pill:disabled` rule, `cs-code` + `cs-note` showcase utilities. `@supports not` fallback updated to include `.modal-scrim`.
- Added **4 new IIFEs** to `shell.js` (~269 lines): password show/hide toggle (delegated, supports both `data-pw-toggle="<id>"` and bare attr), radio-pill click + arrow-key navigation, date/time trigger that opens hidden native `<input>` sibling and formats DD MMM YYYY / 12-hour AM/PM back to label, modal/sheet open-close with **focus-trap (Tab/Shift+Tab cycle within `.modal-card`) + lastFocused restore on close + body.no-scroll lock**.
- **UI/UX agent ran two passes** — pre-build gap audit (24 components recommended; selected 10 P0 + 12 showcase tiles for already-existing primitives) and post-build review (4 P1s caught: B9 self-contradicting role-tablist demo, 80+ inline `style="..."` hits including 15+ verbatim `<code style>` blocks, FF1 autofocus stealing caret on page load, modal missing focus-trap/restore — a11y blocker). All 4 P1s fixed in-session.
- **Two build bugs caught and fixed**: (1) `<768px` media query was styling `.modal-static` showcase tiles, making DLG1 "centered modal" demo render with drag handle on mobile — fixed by scoping to `.modal-scrim:not(.modal-static)`; (2) live modal trapped inside `.reveal` containing block (CSS rule: `transform` on ancestor scopes `position:fixed`) — fixed by moving live modal target to body level just before `</body>`. Both fixes documented inline in markup.
- **Founder decisions locked in**: bottom-sheet `<768px` + centered modal `≥768px`; `form-textarea` uses `clay-sm` radius (16px); native `<input type="date|time">` with styled trigger (Android Webview reliability + WhatsApp in-app browser); legacy `clay-pill` "VIEW DETAILS" deleted.
- Plan doc + ## Built section: `designs/_plans/components-additions-plan.md`.
- Session report: `docs/session-reports/2026-05-11-session-report.md`.
- **Open follow-ups for next session:**
  - **Settings page form-input borders** — Abhijith flagged in screenshot: 3 fields rendering with overly saturated red borders against dark background. Likely a `var(--brand-tint-2)` saturation issue at 18% opacity in dark mode, OR `settings.css` has overrides. Investigate before tweaking shell.css. **This was Abhijith's stated next-session intent.**
  - **Form-validation JS helper (`data-validate` hook)** — agent's highest-value follow-up. Without it, Auth/Wizard/Guest invite/RSVP will each fork their own `form-error` wiring against the brand-new primitive within two pages.
  - WhatsApp Android Webview test of every new primitive (modal/sheet, OTP, radio-pill, form-input) — needs real device session.
  - `status-badge` primitive (canonical color-coded set: success / warning / danger / info) — most-requested deferred P1 from the gap audit.
  - Existing `.nav-tabs` usage in `floating-nav` and other pages still uses `role="tablist"` for buttons with no panels — match B9's reframing to `role="radiogroup"` where it's a filter, not page-content tabs.
  - Remove inline IIFE password toggle from `settings.html` (handler now lives in `shell.js`).
  - FF7 OTP showcase tile doesn't yet expose `aria-invalid="true"` error state — add when expanding form-field tiles.

**What was done previous session (2026-05-10 — design path skill + UI/UX agent + design folder fixes, no ClickUp tasks):**
- Added **"Design next page" path** to `/start-evenzi-session` (5a.7) under Abhijith. Five sub-sections: init (`ui-ux-pro-max` + UI/UX agent + `npm run design`), plan (component reuse audit + agent review + sign-off), build (no inline CSS/JS, mobile-first, agent passes per increment), test (component states + interaction + 6-width responsiveness + cross-page + mobile device + agent review), close. Eight path-specific rules. New table row in 5a.6 surface menu.
- Added **`npm run design`** script using `live-server` on :4000 / host 0.0.0.0 (LAN-reachable from phone). Added `live-server` devDep + `.claude/launch.json` `design` config.
- **Reorganized `designs/`** flat → structured: `designs/{shared/, pages/<page>/, assets/}`. Dashboard renamed to root `index.html`. All 9 HTMLs and `index.css` path-rewritten. Smoke test: every internal href returns 200.
- **Created `ai/agents/ui_ux_designer.md`** — Evenzi UI/UX role book (216 lines). Two-user split, free-tier-feels-paid, WhatsApp-aware, anti-trend stance, component reuse, content-length resilience, mobile-dominant responsive, motion restraint, glass surgical, a11y floor, performance discipline, `code quality in designs/`. Defers project facts to `docs/foundation/*` and `BRAND-GUIDELINES.md` (read at task time, not baked in). Evolves freely with new patterns learned per pass.
- **Reconciled `docs/BRAND-GUIDELINES.md`** to mirror `designs/shared/shell.css` — brand red `#BB0020`/`#ee3f3a`, Poppins, Liquid Glass tokens, clay shadow system, light + dark values, motion + a11y. Replaced placeholder draft.
- **Updated `/end-evenzi-session`** symmetrically: 4a.1 ClickUp step now conditional (skip for design-only sessions), new 4a.7 design-path closing (verify `## Built` block, verify `components.html`, agent file evolution expected, stop design server), renumbered downstream sections.
- **First UI/UX agent review pass on `designs/`** — full sweep, ~5000-word findings. P0/P1 fixes applied directly:
  - **P0** Extracted 688-line inline `<style>` from `event-control.html` into new `event-control.css`. Fixed live `.stats-strip-card` opacity bug where the inline 75% was winning the cascade against shell.css's documented 28% bleed-through.
  - **P0** Wrapped 34 `:hover` rules in `@media (hover:hover) and (pointer:fine)` across `shell.css` (28), `index.css` (4), `settings.css` (2). No more sticky-hover on touch.
  - **P1** Added `@supports not (backdrop-filter)` fallback for 9 Liquid Glass primitives.
  - **P1** Switched breadcrumb clock to 12-hour AM/PM. `tickClock` now pauses on `document.hidden` + `visibilitychange` (battery saver).
  - **P1** All 3 dashboard featured-event cards: `<a>` wrapping faux-button `<span>`s → `<article>` + `<h2><a class="fec-link-stretched">` + real `<a>` action buttons (z-index pattern).
  - **P1** Dashboard filter pills: `role="tablist"` → `role="radiogroup"`, `aria-selected` → `aria-checked` (correct semantics; they're toggles, not tabs).
- **Memory: paired-skill consistency rule** — when editing one of start-evenzi-session ↔ end-evenzi-session, audit and update the partner. Saved to `~/.claude/projects/.../memory/feedback_paired_skill_consistency.md`.
- **Open follow-ups for next session:**
  - Replace `designs/assets/hero-image.jpg` (6.8 MB → ~250 KB sized variant). Blocks meaningful perf testing on guest devices.
  - **Design the public RSVP page** — guest-facing surface, AAA contrast, two-tap, WhatsApp-in-app-browser tested. First real exercise of the new design path skill end-to-end.
  - Auto-inject chrome (head, footer, FAB, toast, nav, tool-rail) via `shell.js` to stop the 8x duplication.
  - Tokenize type scale, radii, spacing, semantic colors in `shell.css`.
  - Doc consistency cleanup: 4-step vs 5-step wizard mismatch between `user-types-scope.md` and `user-flows.md`.

**What was done previous session (2026-05-10 — design system + 8 new screens, no ClickUp tasks):**
- Built the **Evenzi static-prototype design system**. Two new shared files: `designs/shell.css` (~700 lines: tokens, Liquid Glass, clay surfaces, floating nav, breadcrumb, tool rail, footer, FAB, toast, scroll-progress, reveal, motion patterns + component primitives — clay pill, hero pill/meta chip, tool card, qa card/tile, stats strip, stat icon, avatar stack, empty CTA card, checklist row, btn-pill, form-input/label/password, toggle switch, section rule, avatar-edit, notification dropdown panel) and `designs/shell.js` (theme switcher, breadcrumb interactivity, tool rail/nav-tab active state via `body[data-page]/[data-section]`, scroll progress, scroll reveal w/ sync in-viewport fallback, count-up + bar-fill, **auto-injected notification dropdown** for any bell button).
- Created **5 sub-page shells**: `designs/guests.html`, `invitations.html`, `planning.html`, `media.html`, `website.html` — all link `shell.css` + `shell.js`, share the same nav/breadcrumb/tool-rail/footer/help-FAB/toast/scroll-progress shell, render only a page header + empty content card. Auto-active state per page via `body data-page` and `data-section`.
- Created **`designs/components.html`** — full component-library showcase: 9 sections (Foundations, Shell/Chrome, Surfaces, Pills/Chips, Buttons/Controls, Data Display, Layout primitives, Backgrounds, Motion patterns), 30 components with all states, ~42 tiles total.
- Created **`designs/dashboard.html`** + `designs/dashboard.css` — user home page after login. Single page with **4 toggleable view combinations** (MY EVENTS · ACTIVE / PAST × COLLABORATIONS · ACTIVE / PAST), JS-driven via `body[data-ownership]/[data-time]`. Dashboard-specific nav variant: drops segmented Dashboard/Website tabs, adds **+ Create Event** CTA. Featured event card uses `hero-image.jpg` cover + 3 hero meta chips + avatar stack + countdown chip + 2 CTAs. Compact event cards in the right column. "Empty state" CTA cards for "+ New project" and "Join with code". Includes a "No past collaborations yet" empty state for the 4th view.
- Created **`designs/settings.html`** + `designs/settings.css` — top-level user settings page (no event scope). 3 sections: Profile information (name/phone/email + avatar editor with camera badge), Security (current password + new password with eye toggle + Update password CTA, 2FA toggle switch with description), Notification preferences (3 choice cards: Email/Push/SMS — toggle active/inactive). Discard + Save All Settings action footer. Reuses `clay-card` for surfaces and `btn-pill` for actions.
- **Refactored `event-control.html`** to use `shell.css` + `shell.js` — removed 7 duplicated inline IIFEs (~210 lines) that lived in shell.js (theme/breadcrumb/tool-rail/scroll-progress/reveal/count-up/bar-fill); kept 3 page-specific IIFEs inline (hero parallax, QA tile composer, journey ring). Same logo/breadcrumb/footer markup; visual unchanged. Theme toggle now fires once per click (was double-firing). Updated all 14 navigation links to relative `.html` filenames + dashboard.html as top-level home (logo, breadcrumb DASHBOARD link, back chip).
- **Locked navigation hierarchy**: Logo (every page) → `dashboard.html`. Breadcrumb "DASHBOARD" path link → `dashboard.html`. Back chip = parent in tree (sub-page → event-control; event-control → dashboard; settings/components → dashboard). Dashboard/Website segmented tabs stay event-scoped only. Audited all 8 pages.
- **Liquid Glass design enforcement**: restored full glass treatments in light mode (qa-card, qa-tile, stats-strip-card, hero-pill, hero-meta-chip — all use `--lg-bg-grad` + backdrop blur or translucent `card/N%` with saturation boost). Reduced opacity on hero stats from 75% → 28% (light) / 60% (dark) so the hero image bleeds through. Hero pills now glass instead of solid white.
- **Mobile + accessibility polish**: floating nav `top: calc(.85rem + env(safe-area-inset-top))` so iOS PWA status bar doesn't overlap the avatar. Tool rail dock + Help FAB respect `safe-area-inset-bottom`. Touch targets ≥44pt. Reduce-motion respected. All forms accessible (aria-label, aria-checked, aria-pressed). Notification panel uses ARIA dialog + Esc close.
- **Notification dropdown panel** auto-injected on every bell button. Glass card with header (Notifications + Mark all read) + 5 sample items (2 unread with red pip indicator) + View all footer. Closes on outside-click, Esc, or scroll-start. Repositions on resize.
- **Activity timeline ring color fix**: replaced Tailwind's `ring-brand/20` (which falls back to default blue with CSS-var colors) with explicit `box-shadow: 0 0 0 4px var(--brand-tint-2)`. Applied in both event-control.html and components.html.
- **Component reuse cleanup**: promoted `.fec-action` (was in dashboard.css) to shell.css as `.btn-pill` / `.btn-pill-primary` / `.btn-pill-secondary` / `.btn-pill-lg`. Updated dashboard.html (12 instances) + settings.html to use the shared button. Removed duplicates from settings.css. Reused `.clay-card` for settings sections instead of bespoke `.settings-card`.
- **Checklist row redesign**: replaced the heavy 6-line-wrapping rounded-square checkbox with a clean Apple-Tasks-style row — circular checkbox (22px), 2-line title clamp, optional muted sub-line for vendor/category, due chip with `is-urgent` variant (red bg + clock icon), uses `:has()` selector for checked state (filled brand circle + line-through title). Promoted to shell.css. Updated event-control "Up Next" list (8 items) and components.html showcase.
- **Tested** across 7 pages × light/dark × mobile (375px), tablet (768px), desktop (1280px, 1440px, 1600px). Floating nav aligns end-to-end with main content (max-w-[1440px] + matching px). Zero console errors. All filter combinations verified.
- **Open follow-ups for next session:**
  - Wire dashboard pages to real Next.js routes (currently links go to `.html` filenames, will need to map to Next.js dynamic routes when integrated)
  - Add `manifest.webmanifest` for PWA shortcut path (referenced but missing)
  - Switch from Tailwind CDN to project Tailwind build when migrating to the Next.js app
  - Touch-target audit: `fn-icon-btn` is 40px desktop / 36px mobile — below Apple HIG (44pt) and Material (48dp). Bumping requires revisiting nav density. Defer to integration phase.
  - components.html showcase doesn't yet demonstrate the new `.btn-pill`, `.form-input`, `.toggle-switch`, `.avatar-edit` primitives — add tiles for these.
  - event-control.html still has its own inline `<style>` block (~700 lines). Could be further refactored to fully use shell.css, but kept as canonical reference per earlier instruction.

**What was done previous session (2026-05-09 — design exploration, no ClickUp tasks):**
- Designed the **Event Management Hub / Event Control** screen end-to-end as a self-contained HTML/CSS/JS prototype at `designs/event-control.html` + `designs/hero-image.jpg`. Single source-of-truth for the per-event command center landing screen — replaces earlier Stitch drafts.
- Visual language locked: **Apple-style Liquid Glass** (themed light/dark tokens — black-tinted in light to avoid wash-out, white-tinted in dark for refraction), **Evenzi red brand** (`#BB0020` light / `#ee3f3a` dark), **Poppins** typography, claymorphism radii (24/16/9999px).
- Page composition: floating glass nav (logo + Dashboard/Website tabs + bell/theme/settings/avatar) → sticky breadcrumb → full-viewport hero (Anya & Kabir's wedding) with parallax bg image + interactive Quick Actions card + Venue/Date glass chips + 4-stat strip → "Our Journey" timeline snapshot (circular progress ring + featured "Catering menu finalisation" card + 7-step roadmap dots) → "Manage your event" 5-card bento (Guest mgmt, Invitations, Planning, Media, Website — uniform brand-red icons + numbered corners 01–05) → Up next checklist + Recent activity (both scrollable glass cards with mask-fade edges) → footer.
- Interactive layer: scroll-progress hairline at top, scroll-spy on tool rail, count-up stat numbers, progress-fill bars, IntersectionObserver-driven section reveals, mouse parallax on hero, theme persist via localStorage.
- Tested across 1280/768/375 × light/dark — all sections legible, glass elements hold up, no JS errors.
- Preview server config added to `.claude/launch.json` as `stitch-preview` (Python http.server on port 8770 from `designs/`). Original `nextjs-dev` config preserved.
- **Open follow-ups:** wire to real Next.js routes (links currently 404), add `manifest.webmanifest` for the PWA shortcut path, switch from Tailwind CDN to project Tailwind build when integrated.

**What was done previous session (2026-05-04):**
- Created `/start-evenzi-session` and `/end-evenzi-session` as **proper project skills** at `.claude/skills/start-evenzi-session/SKILL.md` and `.claude/skills/end-evenzi-session/SKILL.md`. Both ask "Who's using? (Abhijith / Dheeraj)" and branch the flow accordingly (Abhijith path = full ClickUp + Dev-Vibe; Dheeraj path = `dheeraj-progress.md` + feature branch only)
- Renamed-not-duplicated: deleted the original `.claude/skills/start-session/` and `.claude/skills/end-session/` (these were the generic ancestors; the Evenzi-specific upgrades replace them)
- Updated `.claude/skills/clickup-pm/SKILL.md` with two new modes: `sync-dheeraj-progress` (approval-gated read of un-synced entries from `dheeraj-progress.md`, push to ClickUp as comments + status updates, archive into `## Synced`) and `regenerate-digests` (overwrites per-user `abhijith.md` / `dheeraj.md` digests from current ClickUp state)
- Updated `.claude/skills/session-report/SKILL.md` references from `/end-session` → `/end-evenzi-session`
- Created `docs/sprint/README.md` — pointer to active sprint (none yet), folder layout spec, ownership matrix, append-only rules
- **Renamed `ai/agents/qa_engineer.md` → `ai/agents/test_engineer.md`** and enriched it: 3 modes (Planning / Execution / Maintenance), 10-row stack-and-coverage matrix (Vitest, Playwright, axe, Lighthouse, etc.), sad-path catalogue (auth/validation/DB/network/state/third-party/UI), test plan template that writes to `docs/test-plans/<slug>.md`, backlog of features needing backfill (Auth, Event CRUD, Host Dashboard)
- Updated all live references to the renamed agent: `ai/pipelines/feature.md`, `enhancement.md`, `bug.md`, `ai/agents/task_distributor.md` (6 places + sweet-spot row rewrite), `CLAUDE.md` (env var comment), `.claude/skills/plan-review/SKILL.md` (table + perspective bullets), `docs/foundation/team-structure.md`. Historical specs/plans (chatbot, agent-runner, mission-control) intentionally left unmodified
- Updated memory entries `project_team_split.md` and `project_dheeraj_no_clickup.md` to confirm the skills exist as files (not just references) and to instruct using `/start-evenzi-session` + `/end-evenzi-session` over the generic ancestors

**What was done previous session (2026-05-03):**
- ClickUp connection validated (workspace ID 90161512057, 3 spaces resolved)
- 6 ClickUp task transitions applied with comments:
  - Fix Vercel Deployment (`86d2jmkn4`) → done
  - UI Polish enhancement (`86d2kt2qj`) → done (revamp covered it)
  - Auth & Role Selection (`86d2jwz1h`) → already done, confirmation comment
  - Event CRUD wizard (`86d2jwz3x`) → review
  - Host Dashboard (`86d2jwz6v`) → review
  - Landing Section (`86d2k1kwh`) → in progress
- Three tasks moved from Backlog to Active Sprint to access `done`/`review` statuses
- Branch sync: force-pushed `origin/Dev-Vibe` to match `origin/Dev-Vibe-Testing` tip (`b5e4804`); the prior `078289d chore:testing main dev` commit was discarded
- Discovered + fixed status name mismatch: ClickUp uses `review` (not `in review`); GUIDELINES.md and clickup-pm/SKILL.md updated, also flagged that the Backlog list doesn't expose `done`/`review` statuses (must move to Active Sprint first)
- Installed `gh` CLI 2.92.0 via Homebrew to enable git auth from this environment

**What was done previous session (2026-04-16):**
- Created full Evenzi document suite: 50 files (25 .md + 25 .docx) across Foundation, Feature Overviews, Ops, Marketing, Presentations
- 9 parallel agents built the initial suite; 5 parallel agents refined it after a founder Q&A
- Q&A scrutinised docs from investor/user/vendor perspectives — 6 critical gaps fixed (vendor model, DPDP Act, event magazine, market sizing, PWA, guest accessibility)
- New: Indian Wedding & Events Dictionary (5 traditions, 33 sub-events, 26-term glossary)
- New: Open Decisions doc (5 decisions pending team discussion before external sharing)
- New: Session report saved to `docs/session-reports/2026-04-16-session-report.md`

**What was done previous session (2026-04-14):**
- Brainstormed + spec'd the Support Chatbot feature (MVP Phase 1)
- Wrote full implementation plan (34 tasks across Phase A/B/C)
- Multi-agent review: Tech Lead + Data Modeller + Security + Backend + Frontend + QA → 29 findings
- Revised plan with 20 fixes (6 critical + 14 important) as Revisions R1–R20
- Created ClickUp hierarchy: **Feature + 11 subtasks + 18 sub-subtasks = 30 tasks**, all dependencies set
- **Implementation intentionally deferred** — awaiting Figma designs for UI tasks
- Spec: `docs/superpowers/specs/2026-04-14-chatbot-design.md`
- Plan: `docs/superpowers/plans/2026-04-14-chatbot-implementation.md`
- Feature ClickUp task: `86d2n3jxv`

**Chatbot architecture at a glance:**
- RAG over Supabase pgvector with admin-editable FAQ
- Gemini 2.5 Flash primary + Groq Llama 3.1 8B fallback + keyword degradation (all free tier)
- Widget on most pages + `/help` page + `/admin/faq/*` CRUD + `/admin/tickets` list
- Resend email escalation for unresolved questions
- Zero paid API keys; graceful degradation when quota exhausted
- Admin analytics bot + guest-aware bot deferred to Phase 2+

**What was done previous session (2026-04-13):**
- ClickUp workspace planning: Growth & Marketing + Operations & Admin spaces restructured
- 3 list renames, 3 new lists, 32 milestone tasks created
- Full team roster documented (6 members across 3 spaces)
- Abhijith confirmed as project owner/reviewer across all spaces
- Design spec: `docs/superpowers/specs/2026-04-13-clickup-spaces-planning-design.md`

**What was built previous session (2026-04-10):**
- Design spec: `docs/superpowers/specs/2026-04-09-event-crud-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` (14 tasks, 23 review fixes)
- 4-agent plan review (Tech Lead, Security, Data Modeller, Frontend) — all findings addressed
- Database: 5 new tables (event_types, sub_event_types, events, event_metadata, event_sub_events) + atomic RPC
- Seed data: Wedding (enabled) + 5 disabled types + 7 wedding sub-event types
- API routes: GET event-types, GET sub-events, POST/GET events, GET event detail
- Types + Zod validation: 17 tests for schemas + validateDynamicFields
- Wizard state: React Context + useReducer with 11 tests
- 8 wizard components: Shell, Progress, Steps 1-4, EventTypeCard, SubEventCard
- Success screen (server component)
- Dashboard: converted to server component + client EventsGrid
- Middleware: host-role guard for /events routes
- Event placeholder page (until dashboard feature is built)
- Shared ICON_MAP utility (lib/utils/icons.ts)
- Enhancement task created for UI polish (86d2kt2qj)
- Full E2E test in Chrome, code review with all fixes applied
- 65/65 tests, build passes, 18 commits on worktree branch

**ClickUp state (after 2026-05-03):**
- Fix Vercel Deployment (86d2jmkn4) → done
- Auth & Role Selection (86d2jwz1h) → done
- UI Polish enhancement (86d2kt2qj) → done
- Event CRUD wizard (86d2jwz3x) → review (awaiting feature-level approval)
- Host Dashboard (86d2jwz6v) → review
- Landing Section (86d2k1kwh) → in progress
- Spec & Architecture: Event CRUD (86d2k1mq4) → done

**Database (Supabase):**
- `user_profiles` — existing (3 users)
- `event_types` — 6 rows (1 enabled: Wedding)
- `sub_event_types` — 7 rows (wedding sub-events)
- `events` — has test data from E2E (Aarav & Ishani's Wedding)
- `event_metadata` — partner name key-value pairs
- `event_sub_events` — 3 sub-events (Wedding Ceremony, Reception, Sangeet)
- `create_event_with_details` RPC — atomic insert with auth.uid()

## How To Resume

### Immediate Next Steps

1. **Auth flow design (Login / Sign Up / Role Selection)** — see "Next session intent" block above. Build static HTML/CSS/JS prototypes in `designs/pages/auth/`. Grounded against live React at https://evenzi.vercel.app/auth. **Abhijith's stated next-session intent.**
2. **Form-validation JS helper** — `data-validate` hook + `data-error-required`/`data-error-pattern` attributes that flip `aria-invalid` and toggle `form-error` messages. UI/UX agent's #1 follow-up — auth flow is the second consumer; build this BEFORE wiring the auth phone-input or it gets forked again. **Build first** within the auth-design session.
3. **Settings page polish (DONE 2026-05-14)** — form-input red border bug root-caused in shell.css (`.form-input` default `var(--brand-tint-2)` → `var(--line)`). See `designs/_plans/settings-audit-fix-plan.md`.
3. **Team discussion on 5 open decisions** (`docs/foundation/open-decisions.md`) — pricing, free tier limits, magazine name, WhatsApp approach, vendor plan name
2. **Share document suite via Google Drive** — Admin & Ops and Marketing & Branding teams
3. **Abhijith fills PPT placeholders** — fund ask, bios, pricing limits, timeline, contact
4. **Review Event CRUD wizard + Host Dashboard** (`86d2jwz3x`, `86d2jwz6v` — both `review`) — sign off or send back with feedback. Approving unblocks Component QA / Integration Testing.
5. **Landing Section** (`86d2k1kwh` — `in progress`) — Spec & Architecture is the next phase to start (subtask `86d2k1n3d`).
6. **Event CRUD Data Modeling** (`86d2k1mqc`) — Spec is done, tables exist. Mark done or refine if schema changes are needed.
7. **Fix Success Screen redirect** — Server component may have cookie/auth issue. Test on Dev-Vibe directly.
8. **Agent enrichment (remaining Medium agents)** — backend_engineer, data_modeller, tech_lead, product_manager (test_engineer was enriched + renamed from qa_engineer on 2026-05-04)

### Known Issues
- Success screen redirects to /home instead of rendering (cookie issue)
- UI needs significant polish to match Figma (enhancement task created)
- Missing test for GET /api/events/[id] route
- Progress bar initially shows "Step 1 of 3" before type selection (totalSteps defaults to 4 but renders 3)
- Zod upgraded to v4 (was v3) — z.record() syntax changed

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-04-09-event-crud-design.md` | Event CRUD design spec (approved) |
| `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` | Implementation plan (14 tasks, 23 review fixes) |
| `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md` | Auth design spec |
| `docs/BRAND-GUIDELINES.md` | Brand source of truth — reconciled to `designs/shared/shell.css` (brand red `#BB0020`, Poppins, Liquid Glass tokens, clay shadows) |
| `ai/agents/ui_ux_designer.md` | UI/UX role book — design + review + code quality in `designs/`. Evolves freely. |
| `docs/clickup/WORKSPACE.md` | All ClickUp IDs, workspace structure |
| `docs/PROJECT.md` | Full feature descriptions, DB plans |
| `CLAUDE.md` | Project guide, conventions, parallel subagents |
