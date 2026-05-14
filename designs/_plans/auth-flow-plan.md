# Auth flow — Login / Sign Up → Role Selection

**Pages:** `designs/pages/auth/auth.html`, `designs/pages/auth/role-select.html`
**Date:** 2026-05-14
**Owner:** Abhijith
**Reference:** Wireframes provided + live React implementation at https://evenzi.vercel.app/auth

## User goal

Build the static HTML/CSS/JS prototype of the three auth screens (login, signup, role-selection) that match the wireframes. The prototype mirrors the React app's behavior and gets converted to React when integrated.

The auth flow is the **first impression** for every new Evenzi user — calmest possible surface, mobile-first, fast OTP path, Google fallback. Identity is acknowledged through brand presence (logo, brand-red CTAs) but the design must read as *quiet credibility*, not a marketing landing.

## Out of scope

- Real OTP send + verification (PIN-input page is a separate next-screen; this prototype stops at "OTP requested" toast).
- Email auth (wireframes only show phone + Google).
- Country picker — India-only per `user-types-scope.md`. `+91` is hardcoded.
- Onboarding screen — the user explicitly said "onboard screen will do after this screens."
- Tailwind CDN → build migration.

---

## Pages + structure

### 1. `designs/pages/auth/auth.html` (combined Login / Sign Up)

Single HTML file. Two-tab state managed by JS — Sign Up and Log In tabs in a segmented control. Tab swap updates the card title, the CTA copy, and the policy-text below. Phone-number entry and Google button stay identical between tabs.

**Body composition (mobile-first, top to bottom):**

```
<body data-page="auth">
  <header class="auth-shell-header">
    <a class="auth-logo" href="../../index.html">Evenzi</a>
    <a class="auth-help" href="#">Need help?</a>
  </header>

  <main class="auth-main">
    <section class="auth-card clay-card">
      <h1 class="auth-card-title" data-title>Log in to your Evenzi account</h1>
      <p class="auth-card-lead">Get started with your free event website and AI photo sharing</p>

      <div class="nav-tabs auth-tabs" role="radiogroup" aria-label="Auth mode">
        <button type="button" role="radio" class="nav-tab" aria-checked="false" data-auth-mode="signup">
          <span class="nav-tab-label">Sign Up</span>
        </button>
        <button type="button" role="radio" class="nav-tab is-active" aria-checked="true" data-auth-mode="login">
          <span class="nav-tab-label">Log In</span>
        </button>
      </div>

      <div class="form-group">
        <label class="form-label" for="phone">Phone Number</label>
        <div class="form-input form-input-group">
          <span class="form-input-prefix" aria-hidden="true">+91</span>
          <input id="phone" class="form-input-field" type="tel" inputmode="numeric"
                 autocomplete="tel" placeholder="9999999999" />
        </div>
      </div>

      <button type="button" class="btn-pill btn-pill-primary btn-pill-lg auth-cta" data-send-otp>
        <span>Send OTP</span>
        <span aria-hidden="true" class="btn-pill-spinner"></span>
      </button>

      <div class="auth-divider"><span>or</span></div>

      <button type="button" class="btn-google" data-google>
        <svg class="btn-google-icon" viewBox="0 0 24 24" aria-hidden="true">… inline Google G …</svg>
        <span>Continue with Google</span>
      </button>

      <p class="auth-policy">
        By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
      </p>
    </section>
  </main>

  <footer class="auth-shell-footer">
    <p>© 2026 EVENZI · ALL RIGHTS RESERVED</p>
  </footer>

  <div id="bc-toast" class="bc-toast" role="status" aria-live="polite">
    <span class="bc-live"></span>
    <span id="bc-toast-text">OTP SENT</span>
  </div>

  <script src="../../shared/shell.js"></script>
  <script src="auth.js"></script>
</body>
```

### 2. `designs/pages/auth/role-select.html`

Same shell header + footer. Main content is a wider card-grid.

**Body composition:**

```
<body data-page="role-select">
  <header class="auth-shell-header">…same…</header>

  <main class="auth-main auth-main-wide">
    <header class="role-select-head">
      <h1 class="auth-card-title">How will you use the platform?</h1>
      <p class="auth-card-lead">Select your role to get a personalized experience tailored to your needs.</p>
    </header>

    <div class="role-grid">
      <article class="role-card">
        <span class="role-card-icon" aria-hidden="true">
          <span class="material-symbols-outlined icon-fill">celebration</span>
        </span>
        <h2 class="role-card-title">Host / Event Owner</h2>
        <p class="role-card-desc">Manage your event details, guest lists, and create a beautiful event website. Collect all your memories in one place.</p>
        <button type="button" class="btn-pill btn-pill-primary btn-pill-lg" data-role="host">Continue as Host</button>
      </article>

      <article class="role-card">
        <span class="role-card-icon" aria-hidden="true">
          <span class="material-symbols-outlined icon-fill">storefront</span>
        </span>
        <h2 class="role-card-title">Vendor</h2>
        <p class="role-card-desc">Manage your bookings, coordinate with hosts, and showcase your services to potential clients efficiently.</p>
        <button type="button" class="btn-pill btn-pill-primary btn-pill-lg" data-role="vendor">Continue as Vendor</button>
      </article>
    </div>

    <a class="auth-back-link" href="auth.html" data-back>
      <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
      Back to Login
    </a>
  </main>

  <footer class="auth-shell-footer">…same…</footer>

  <script src="../../shared/shell.js"></script>
  <script src="auth.js"></script>
</body>
```

---

## Element-by-element categorisation

### Shell primitives reused as-is

| Element | Source |
|---|---|
| `.clay-card` (card surface) | shell.css |
| `.nav-tabs` + `.nav-tab` + `.is-active` (segmented control) — semantics: `role="radiogroup"` + `role="radio"` + `aria-checked` per B9 docstring | shell.css |
| `.form-group` / `.form-label` / `.form-input.form-input-group` / `.form-input-prefix` / `.form-input-field` | shell.css |
| `.btn-pill` / `-primary` / `-lg` | shell.css |
| `.btn-pill-spinner` + `.btn-pill.is-loading` (for Send OTP loading state) | shell.css |
| `.bc-toast` + `.bc-live` (success toast after Send OTP click) | shell.css |
| Brand tokens (`--brand`, `--ink`, `--muted`, `--card`, `--line`, etc.) | shell.css |

### Shell additions (generic, candidates for shell.css)

| Primitive | Why generic | Spec |
|---|---|---|
| `.btn-google` | OAuth button repeats — auth, link-account, settings | White bg, `var(--line)` border, Google G icon (inline SVG), ink text, hover gives subtle brand-tint border. Same height as `.btn-pill-lg` (46px). Full-width by default. Focus-visible ring. |
| `.divider-or` | "or" separator between two action paths — likely reused on login, payment-method-select, etc. | Centered "or" text on a horizontal rule. `var(--muted)` text, `var(--line)` rule. Tiny tracking (matches `.form-label` tracking). |

### Page-specific (live in `auth.css`)

| Selector | Purpose |
|---|---|
| `.auth-shell-header` | Logo + Need help? top bar. Logo is `.fn-logo`-style brand text. Help link is `.auth-help` (muted, hover-brand). |
| `.auth-main` | Center the card vertically + horizontally. Min-height calc so footer pins to bottom. |
| `.auth-main-wide` | Wider variant for role-select (2-card grid) |
| `.auth-card` | Card padding + max-width 440px override of clay-card |
| `.auth-card-title` | Display heading inside card — Poppins 700, ~26px on mobile / ~30px desktop |
| `.auth-card-lead` | Lead text below title — muted, 14px |
| `.auth-tabs` | Override `.nav-tabs` to be full-width (`width:100%`), 2 equal-flex children |
| `.auth-cta` | Full-width modifier for `.btn-pill-lg` |
| `.auth-policy` | Footer text inside card — terms + privacy links |
| `.auth-shell-footer` | Bottom copyright bar, centered, muted, tracking-wide |
| `.role-select-head` | Center-aligned page header above role-grid |
| `.role-grid` | 2-col on ≥640px, stacks on mobile. `gap:1.25rem` |
| `.role-card` | Card with icon (88px circle, brand-tint bg, brand fill icon) + title + description + CTA. `padding:2rem 1.75rem`, `text-align:center`, hover: subtle lift |
| `.role-card-icon` | 88px circular icon container |
| `.role-card-title` | Poppins 700, ~18px |
| `.role-card-desc` | Muted body, ~14px, max-width to balance line-length |
| `.auth-back-link` | "Back to Login" with leading arrow, muted text, brand on hover, focus-visible ring, ≥44px hit area |

### JS (in `auth.js`)

| Behavior | Notes |
|---|---|
| Tab toggle on `[data-auth-mode]` | Already handled by shell.js delegated `.radio-pill` handler? No — `.nav-tab` is not delegated. Need a small page-specific handler. Updates `aria-checked`, `.is-active`, the card title, the CTA label (Send OTP stays the same), and the policy text. |
| Send OTP click → loading state → toast | Same pattern as settings.js save handler (1.2s timer, then `window.evenzi.showToast('OTP SENT')`). For static prototype only. |
| Google click → toast `OPENING GOOGLE` | Cosmetic confirmation. |
| Role select click → toast `CONTINUE AS HOST` / `CONTINUE AS VENDOR` | Cosmetic. Real flow: navigate to onboard. |

### Files to create

```
designs/pages/auth/
├── auth.html
├── role-select.html
├── auth.css
└── auth.js
```

Both HTML files share `auth.css` + `auth.js`.

### Files to modify

- `designs/shared/shell.css` — add `.btn-google` and `.divider-or` rules
- `designs/components.html` — add tiles for `.btn-google`, `.divider-or`, the auth `.nav-tabs` 2-tab variant, and the role-card pattern (optional but per skill convention)

---

## Mobile behavior (≤767px)

- Auth card: `max-width:100%`, padding ~24px around content, 16px outer page margin
- Tabs stretch full-width (`flex:1` on each `.nav-tab`)
- All inputs/buttons full-width
- Role-select: cards stack vertically full-width
- "Back to Login" link sits centered below the card grid
- Footer stays at the bottom of the viewport (flex column with `flex:1` on main)
- Touch targets ≥44px (Send OTP, Google, Continue, Back, tabs, phone input)
- Safe-area-inset-bottom respected on the footer via `padding-bottom: max(1rem, env(safe-area-inset-bottom))`

## Accessibility floor

- Logical heading hierarchy (h1 → h2 in cards)
- `role="radiogroup"` + `role="radio"` + `aria-checked` on tabs (matches B9 semantics)
- `aria-label` on auth-tabs radiogroup ("Auth mode")
- Phone input: `type="tel"` + `inputmode="numeric"` + `autocomplete="tel"`
- "Send OTP" button gets `aria-busy="true"` + `disabled` during loading
- `.btn-google` focusable, visible focus-ring, descriptive label
- "Back to Login" focusable, clear text, brand-on-hover
- Toast is `role="status"` + `aria-live="polite"` (already wired)
- `prefers-reduced-motion` respected via existing shell rules (no extra animation introduced)

## Light + dark mode

Both modes already tokenized in shell.css. The new primitives (`.btn-google`, `.divider-or`, `.role-card`) inherit `--bg`, `--card`, `--line`, `--ink`, `--brand`, `--muted` automatically. Specific dark-mode considerations:

- `.btn-google` in dark: bg stays `var(--card)` (= `#18181b`), text stays `var(--ink)` (= `#f9fafb`). The Google G icon stays its standard 4-color logo (not themed — Google's brand guidelines forbid recoloring).
- `.role-card-icon` brand-tint bg works in both modes (already token-based).

## Risks / open questions for the agent

1. **Combined login/signup with a JS tab toggle vs. two separate HTML files** — combined is the React pattern, easier to keep in sync. Two files would mean duplicating the form on each page. I chose combined; agent should validate.
2. **`.nav-tabs` re-used as auth segmented tabs** vs. building a new `.tab-pill` primitive — at 2 tabs the visual is essentially "pill with two halves." `.nav-tabs` already supports this look. Agent: any reason to fork?
3. **`+91` prefix as static text vs. selectable dropdown** — India-only confirmed. Static `<span>` (matches shell pattern, not tappable). Agent: confirm.
4. **Card max-width 440px vs. 480px** — wireframes look ~440px. Agent: any objection?
5. **Role-card hover treatment** — slight lift + brand-tint border on hover. Or keep it static (the CTA is the action)? Erring on lift to telegraph interactivity.
6. **`.divider-or` styling** — horizontal rule with centered text. Standard pattern. Agent: any concern about Reduced contrast in dark mode?
7. **Google icon — inline SVG vs. icon font?** — inline SVG. Google has strict brand guidelines and Material Symbols doesn't have the multi-color G. Use the canonical 4-color G logo as inline SVG.
8. **Footer placement on short viewports** — Use `min-height: 100dvh` on `<body>` + flex layout so footer sticks to bottom. Avoid `100vh` (mobile address-bar issue).

## Implementation order (build phase)

1. shell.css: add `.btn-google` + `.divider-or` rules
2. auth.css: build all page-specific layout rules
3. auth.html: build the markup (tab default = Log In, matching wireframe #1)
4. auth.js: tab toggle + Send OTP loading + Google click + role-card click handlers
5. role-select.html: build markup (reuses auth.css)
6. UI/UX agent pass on the increment
7. components.html: add tiles for `.btn-google`, `.divider-or`, auth tabs, role-card

After each milestone, brief UI/UX agent pass.

## Test phase

- Component-level: all states for tabs (Sign Up active, Log In active), Send OTP (default, loading, returned), Google button (default, hover, focus), role cards (default, hover, focus, both side-by-side and stacked).
- Interaction: tab toggle updates title + tab states; Send OTP click → spinner → toast; Google click → toast; Continue-as-Host/Vendor → toast; Back-to-Login navigation works.
- Responsive: 360 / 390 / 414 / 640 / 768 / 1024 / 1440. No horizontal scroll. Touch ≥44px on mobile.
- Light + dark mode.
- Cross-page: navigate auth.html → role-select.html → back to auth.html. Logo home-link works.
- Mobile device test (LAN URL on phone) — Abhijith walks through the flow.
- UI/UX agent post-build review.

## Plan sign-off

- [x] UI/UX agent review pass — REVISE
- [x] Revisions captured below
- [x] Abhijith sign-off on revised scope

---

## Plan revisions (post-agent-review, 2026-05-14)

### Decisions captured

| Topic | Decision |
|---|---|
| OTP verification screen | **Build now** — new `verify-otp.html` with `.pin-input` 6-cell pattern, Resend countdown, Change-number affordance. Folded into this session. |
| Role-select layout | **Radio-pill stack + single Continue CTA** — drops the 2-card grid, reuses `.radio-pill-group`. No new `.role-card` primitive. |
| Vendor role in MVP | **Show with "Coming soon" tag** — vendor pill visible but `disabled` + a small `.role-tag-soon` chip. Honest about roadmap. |
| Need-help link | `mailto:evenzi.official@gmail.com` |
| Card max-width | **380px** (agent's call). Will adjust to 420 if cramped on dev review. |
| Ambient brand presence | Add subtle `--featured-grad` at low opacity behind the card on `<body>` for warmth — costs nothing, removes easily. |
| Lead copy swap | Sign Up → "Get started with your free event website and AI photo sharing"; Log In → "Welcome back. Enter your number to continue." JS handles. |
| `aria-live` on title | Add `aria-live="polite"` to `.auth-card-title` so screen readers announce the tab swap. |

### Net additions to file-by-file list

**Shell additions (`designs/shared/shell.css`):**

| Primitive | Spec |
|---|---|
| `.btn-google` | OAuth button — white bg (`var(--card)`), `var(--line)` border, ink text, inline Google G SVG, hover gives `var(--brand-tint-2)` border + no transform (per role-book hover-guard). Full-width default. `min-height:46px`. Focus-visible 2px brand outline. Disabled state via `.is-loading` + spinner (reuses `.btn-pill-spinner` structurally). |
| `.divider-or` | "or" separator — horizontal rule via `::before/::after` pseudo-elements + centered text. Rule color `var(--brand-tint-2)` for AA in dark. Text: tracked-out muted Poppins. |
| `.auth-tabs` modifier on `.nav-tabs` | Override: `width:100%`, larger padding (`.7rem 1rem`), 14px font, removes the `backdrop-filter` (parent card isn't translucent). Inactive tab `:hover` background swapped to a quieter `var(--line-soft)` so it doesn't compete with the active tab. |
| `.auth-bg` utility | Body-level radial-gradient backdrop using `--featured-grad` at low opacity. Mobile and dark-aware. |
| `.role-tag-soon` | Small pill chip — "Coming soon" tag. Reuses tracking/weight from existing labels. Sits inside the `.radio-pill` content row, far-right. |

**JS additions:**

- `auth.js` — page-local script:
  - Tab toggle: flips `aria-checked`, `.is-active`, `.auth-card-title` text, `.auth-card-lead` text, CTA copy stays "Send OTP" (per wireframe).
  - Send OTP: validates phone (10 digits required, numeric), shows `.form-error` inline if invalid; on valid, `.btn-pill.is-loading` for 1.2s → navigate to `verify-otp.html` (carry phone via `sessionStorage`).
  - Google: `.btn-pill.is-loading` for 1.2s → toast `OPENING GOOGLE` → navigate to `role-select.html`.
  - Verify OTP page: 6-cell `.pin-input` (shell.js handles auto-advance + paste); Resend countdown (30s); "Change number" link back to auth.html; "Verify" CTA → toast → navigate to `role-select.html`.
  - Role-select: radio-pill semantics (Continue CTA disabled until a role is picked); on Continue, toast `CONTINUE AS HOST` (or vendor-soon disabled toast `VENDOR COMING SOON`).
  - Phone-prefix tap forwards focus to `.form-input-field` via JS.

**Error states matrix** (all live in `auth.css` + `auth.js`):

| Trigger | UI |
|---|---|
| Empty phone + Send OTP | inline `.form-error` "Enter your phone number" |
| <10 digits | inline `.form-error` "Phone number must be 10 digits" |
| Non-numeric pasted | JS sanitizes input on `input` event |
| Network / send fail (cosmetic — simulated 5% chance) | toast `OTP FAILED — TRY AGAIN`, button restored |
| Google popup cancelled (cosmetic — back from Google nav delay) | silent restore, no toast |
| OTP wrong | inline `.form-error` on `.pin-input` (uses existing `[aria-invalid="true"]` state on shell) |

### Files to create (final list)

```
designs/pages/auth/
├── auth.html         (Login / Sign Up — combined)
├── verify-otp.html   (6-digit pin entry)
├── role-select.html  (Host / Vendor radio-pill)
├── auth.css          (shared page styles)
└── auth.js           (tab toggle + Send OTP + Verify + Google + role-pick + nav)
```

### Files to modify

- `designs/shared/shell.css` — add `.btn-google`, `.divider-or`, `.auth-tabs` modifier, `.auth-bg`, `.role-tag-soon`
- `designs/components.html` — add tiles for `.btn-google` (3 states), `.divider-or`, `.auth-tabs` 2-tab variant, `.role-tag-soon`

### Acceptance criteria

- Tab swap updates title, lead, and `aria-checked`; screen-reader-announced via `aria-live` on title.
- Phone input validates inline (empty + <10 digits); `+91` prefix tap forwards focus on mobile.
- Send OTP → spinner → navigate to verify-otp.html with phone carried in sessionStorage.
- Verify OTP: pin-input auto-advances + accepts pasted 6-digit; wrong code shows `aria-invalid` + inline error; Resend countdown 30s; "Change number" → back to auth.html.
- Google OAuth button: spinner on click → toast → navigate to role-select.html.
- Role-select: Continue CTA disabled until a role picked; Vendor pill disabled with "Coming soon" tag; Continue → toast → (Host: nav to a stub `home.html` or back to dashboard; Vendor disabled).
- All 3 pages: mobile (≤414px) no horizontal scroll, touch ≥44px, safe-area on footer.
- Light + dark mode visually verified.
- "Need help?" link = `mailto:evenzi.official@gmail.com`.

### Explicitly deferred (documented, not missed)

- Tailwind CDN → build migration (consistent with existing deferred items).
- Forgot-password path (not applicable — phone OTP only; any unknown number auto-signs-up).
- Already-authenticated redirect logic (React port concern; static prototype has no session state).
- Onboarding screen sequence (post-role-select, separate session per user's note).

---

## Built

**Date:** 2026-05-14
**Verdict:** UI/UX post-build review → **APPROVE WITH NOTES**.

### Shipped files

**Shell additions (`designs/shared/shell.css`):**
- `.btn-google` — Google OAuth button with inline 4-color G SVG, ink text, full-width, loading state via `.is-loading` + `.btn-pill-spinner` child. Hover gated, focus-visible ring.
- `.divider-or` — "or" separator using `::before/::after` rules. Rule color `var(--brand-tint-2)` for AA in dark mode.
- `.nav-tabs.auth-tabs` modifier — full-width, larger touch padding, `backdrop-filter:none` (parent card is opaque), quieter `--line-soft` hover on inactive (kills the "second selected state" effect).
- `.auth-bg` body utility — subtle dual-radial brand gradient at low opacity for ambient warmth. Light + dark variants. `min-height:100dvh` (mobile address-bar safe).
- `.role-tag-soon` — small brand-tinted "Coming soon" pill chip.

**Shell modifications (`designs/shared/shell.css`):**
- **Scope fix:** `.nav-tab-label { display:none }` at line 231 was unscoped; now `.floating-nav .nav-tab-label`. Pre-existing bug surfaced when `.auth-tabs` mobile labels disappeared.

**Shell modifications (`designs/shared/shell.js`):**
- `window.evenzi.showToast` exposed for page-specific scripts.
- Radio-pill click handler now skips selection when target is disabled (`disabled` or `aria-disabled="true"`); page-level click handlers can still fire (no `stopPropagation`).
- Radio-pill arrow-key handler skips disabled pills in keyboard nav.

**New auth-flow pages (`designs/pages/auth/`):**
- `auth.html` — Combined Log In / Sign Up. Tab swap toggles `aria-checked`, `.is-active`, title (`aria-live="polite"`), and lead copy. Phone field uses `.form-input-group` with `+91` prefix span (tap forwards focus to field). Send OTP CTA + `.divider-or` + `.btn-google` + policy text. Defensive `setMode` at JS init.
- `verify-otp.html` — 6-cell `.pin-input` with phone display + Change number link + 30s Resend countdown + Verify CTA. Wrong/short code → inline `.form-error` + `aria-invalid` on the pin group. Phone carried from auth.html via `sessionStorage`.
- `role-select.html` — Host + Vendor as `.radio-pill-group` (vendor disabled with `.role-tag-soon` "Coming soon" + `tabindex="-1"`). Single Continue CTA disabled until a role is selected. "Back to Login" link below.
- `auth.css` — Page-specific layout (sticky-footer flex, card 380px max-width, role-pill body styling, verify screen extras, action footer with safe-area-inset).
- `auth.js` — Tab toggle (click + ArrowLeft/Right with `preventDefault()`), phone sanitize on input, Send OTP validation + loading + nav, Google loading + nav, verify (pin-input integration), resend countdown, role select + Continue.

**Showcase additions (`designs/components.html`):**
- B10 `.btn-google` (default + loading states)
- B11 `.divider-or`
- B12 `.nav-tabs.auth-tabs` 2-tab variant with semantics docstring
- B13 `.role-tag-soon`

### Acceptance criteria — all PASS

UI/UX post-build review verified each with file:line evidence.

### Test phase results

- **Console:** clean (only the standard Tailwind-CDN production warning).
- **Tab swap:** Log In ↔ Sign Up flips `aria-checked`, `.is-active`, title, and lead copy. Active tab `bg: rgb(187, 0, 32)` (solid brand) confirmed; inactive `:hover` uses `--line-soft` (gray, doesn't compete with active).
- **Phone validation:** empty → "Enter your phone number"; <10 digits → "Phone number must be 10 digits"; non-numeric paste → sanitized to digits-only on input event.
- **Send OTP happy path:** valid → loading state (is-loading + aria-busy=true + disabled) → toast "OTP SENT" → nav to verify-otp.html with phone in sessionStorage.
- **Role select:** Host click → aria-checked=true, Continue enabled. Vendor click (disabled) → aria-checked stays false, toast "VENDOR COMING SOON" fires.
- **Mobile 360px dark:** tab labels visible (scope fix), card fills correctly, +91 prefix readable, ambient brand gradient subtle. Touch targets ≥44px.
- **Desktop 1440px light:** card centered, ambient pink/brand gradient warm without overwhelming, all 3 screens render per wireframe.
- **Verify-OTP:** phone display "+91 99999 99999" populated from sessionStorage; 6-cell pin-input; Resend countdown working; Change number link routes back to auth.html.

### Bugs surfaced + fixed during build

1. **`window.evenzi.showToast` was not exposed in this worktree's shell.js** — added exposure at line 74-75.
2. **shell.js radio-pill handler ignored `aria-disabled`** — added `isDisabled` guard in both click and keydown handlers so Vendor "Coming soon" pill cannot be selected.
3. **`.nav-tab-label { display:none }` was unscoped** — pre-existing scope bug at shell.css:231 hid labels on every consumer at ≤768px, not just floating-nav. Scoped to `.floating-nav .nav-tab-label`.
4. **role-pill checked-state text colors assumed solid brand bg** — auth.css fixed to match the actual brand-tint bg from shell's `.radio-pill[aria-checked="true"]`.
5. **`innerHTML` in resend reset** — pre-emptively avoided per security hook; rewrote with two pre-existing hidden/visible children (`[data-resend-counter]` / `[data-resend-active]`) and `textContent`-only updates.

### Open follow-ups (for NEXT-SESSION.md)

1. **Real-device dark-mode contrast** on `.role-pill-desc` (muted on brand-tint) and the disabled Vendor pill — 30-second phone check. Cosmetic if any.
2. **`sessionStorage` cold-start on verify-otp.html** — if user lands directly without prior auth.html visit, the prototype shows the placeholder phone. React port needs a guard/redirect.
3. **Promote `+91 prefix → field focus` to shell.js** as a delegated `[data-prefix-focus]` handler. Pattern will reappear on any prefix-based input group.
4. **Recursive `setTimeout` for Resend countdown** — replace with `useEffect` cleanup in React port.
5. **`.btn-google` reduced-motion** — no transitions defined (good), but `:hover` does `border-color`/`background` transition. Already gated by `(hover:hover) and (pointer:fine)` — fine.
6. **Tailwind CDN still loading** on these new pages — consistent with the deferred Tailwind-build migration. Acceptable.
7. **Radio-pill docstring update** — note the new `aria-disabled` skip behavior for future consumers.

### Documented deferrals (per plan)

- Tailwind CDN → build migration (project-wide deferred item).
- Onboarding screen sequence (user's explicit note: "onboard screen will do after this screens").
- Already-authenticated redirect logic (React port concern; prototype has no session model).
- Forgot-password path — not applicable (phone OTP only).

---

### Files-touched summary

| File | Change |
|---|---|
| `designs/shared/shell.css` | +6 primitives (`.btn-google`, `.divider-or`, `.nav-tabs.auth-tabs`, `.auth-bg`, `.role-tag-soon`); 1 scope fix |
| `designs/shared/shell.js` | `window.evenzi.showToast` exposure; radio-pill `aria-disabled` guard (click + keydown) |
| `designs/pages/auth/auth.html` | new |
| `designs/pages/auth/verify-otp.html` | new |
| `designs/pages/auth/role-select.html` | new |
| `designs/pages/auth/auth.css` | new |
| `designs/pages/auth/auth.js` | new |
| `designs/components.html` | +4 showcase tiles (B10–B13) |
| `designs/_plans/auth-flow-plan.md` | new (this plan) |
