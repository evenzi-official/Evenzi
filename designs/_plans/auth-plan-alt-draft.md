# Auth page — design plan

**Page:** `designs/pages/auth/auth.html`
**Date:** 2026-05-14
**Owner:** Abhijith
**Reference:** Live React page at `evenzi.vercel.app/auth`, source `app/auth/page.tsx`.

## User goal

Static design prototype of the existing functional auth page. Same functionality (Sign Up / Log In tabs, phone OTP flow, Google OAuth) — but elevated visually using Evenzi shell primitives instead of the React page's plain Tailwind-with-CSS-variables look.

This is a **standalone, pre-login surface** — no shell chrome (no `.floating-nav`, no breadcrumb, no `.tool-rail`, no `.help-fab`). Just a centered authentication card on a warm background, with a brand wordmark above and a copyright footer below.

## Out of scope

- Real Supabase wiring (this is a static prototype — only mock flows with timers + toasts).
- Password authentication (the existing React page uses phone OTP + Google only).
- Role-selection page (`/auth/role-selection`) — separate scope.
- 2FA, magic-link, social providers beyond Google.

---

## Functional spec (from React source)

The page has 4 logical states:

1. **Default** — Phone input + Send OTP button. Google button + "or" divider above.
2. **OTP-sent** — Phone input replaced by 6-cell OTP input + Verify button + Change button (returns to state 1).
3. **Loading** — any primary action shows a spinner; all CTAs disabled.
4. **Error** — banner at the top of the auth card showing the error message, dismissible.

Tabs: Sign Up / Log In. Switching tabs only changes the **header copy** ("Create your account to get started" vs. "Welcome back to Evenzi") — the form below is identical.

## Element-by-element categorisation

| Element | Primitive | Action |
|---|---|---|
| Brand wordmark "EVENZI" | New page-specific styling | Page-specific in `auth.css` — mirrors the `.fn-logo` typography (Poppins 800, brand color, tracking -0.05em), centered, larger size |
| Auth card surface | `.clay-card` | Reuse |
| Tabs (Sign Up / Log In) | `.nav-tabs` + `role="tablist"` + `.nav-tab` with `role="tab"` + `aria-selected` | Reuse (already canonical for "panel swap" semantics) |
| Header copy | `<p>` with muted color | Page-specific small typography |
| Error banner | **New `.alert` + `.alert-error` primitive in shell.css** | Generic enough for re-use (form-submit errors, validation summaries, etc.) |
| Phone input | `.form-input-group` + `.form-input-prefix` (`+91`) + `.form-input-field` | Reuse (same as settings page) |
| OTP input | `.pin-input` + 6 × `.pin-input-cell` with auto-advance | Reuse — `shell.js` handles auto-advance/backspace/paste |
| "or" divider | New page-specific `.auth-divider` rule | Page-specific in `auth.css` |
| Continue with Google button | `.btn-pill btn-pill-secondary btn-pill-lg` with inline Google SVG | Reuse btn-pill; SVG is brand-mark, stays inline |
| Send/Verify OTP button | `.btn-pill btn-pill-primary btn-pill-lg` with `.btn-pill-spinner` for loading | Reuse btn-pill; **add `.btn-pill.is-loading` + `.btn-pill-spinner` primitive in shell.css** (matches what was added in the parallel `crazy-lovelace` worktree — same code) |
| Change button | `.btn-pill btn-pill-secondary` (smaller, inline next to Verify) | Reuse |
| Footer copyright | Page-specific small typography | Inline in `auth.css` |

## File-by-file plan

### `designs/shared/shell.css` — additions

1. **New `.alert` primitive** — semantic colored banner. Variants: `.alert-error` (semantic red), `.alert-success` (semantic green), `.alert-info` (brand-tint). Composition: icon + text. Default size; pairs with `role="alert"` / `aria-live="polite"`.
2. **New `.btn-pill.is-loading` + `.btn-pill-spinner` rules** — hides label/trailing icon when loading, shows centered spinner. Add `position:relative` to `.btn-pill`. Reduced-motion fallback swaps spin to opacity pulse.

### `designs/shared/shell.js` — no changes

The `pin-input` auto-advance / backspace / paste handlers and `nav-tabs` selected-state logic are already in shell.js (per the active-state IIFE for `[data-section]`-driven tabs — for tablist-with-panels semantic, we'll handle locally in `auth.js`).

### `designs/pages/auth/auth.html` — new file

Structure:

```
<body data-page="auth">
  <main class="auth-shell">
    <div class="auth-brand">
      <span class="auth-logo">EVENZI</span>
      <p class="auth-tagline">CAPTURE · SHARE · CHERISH</p>
    </div>

    <section class="clay-card auth-card">
      <!-- Tabs -->
      <div class="nav-tabs auth-tabs" role="tablist" aria-label="Auth mode">
        <button role="tab" class="nav-tab is-active" aria-selected="true" data-auth-tab="signup">
          <span class="nav-tab-label">Sign up</span>
        </button>
        <button role="tab" class="nav-tab" aria-selected="false" data-auth-tab="login">
          <span class="nav-tab-label">Log in</span>
        </button>
      </div>

      <!-- Header copy (changes with tab) -->
      <h1 class="auth-h1">Create your account</h1>
      <p class="auth-lead" data-auth-lead>Sign up to start planning events with Evenzi.</p>

      <!-- Error banner (hidden by default) -->
      <div class="alert alert-error" role="alert" hidden data-auth-error>
        <span class="material-symbols-outlined" aria-hidden="true">error</span>
        <span data-auth-error-text></span>
      </div>

      <!-- Phone input → Send OTP (state 1) -->
      <div class="auth-step" data-auth-step="phone">
        <div class="form-group">
          <label class="form-label" for="auth-phone">Phone number</label>
          <div class="form-input form-input-group">
            <span class="form-input-prefix" aria-hidden="true">+91</span>
            <input id="auth-phone" type="tel" class="form-input-field" placeholder="99999 99999" inputmode="numeric" autocomplete="tel"/>
          </div>
        </div>
        <button type="button" class="btn-pill btn-pill-primary btn-pill-lg auth-cta" data-auth-send-otp>
          <span>Send OTP</span>
          <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
          <span class="btn-pill-spinner" aria-hidden="true"></span>
        </button>
      </div>

      <!-- OTP input → Verify (state 2, hidden by default) -->
      <div class="auth-step" data-auth-step="otp" hidden>
        <div class="form-group">
          <label class="form-label" for="auth-otp-0">Enter the 6-digit code sent to <span data-auth-phone-preview></span></label>
          <div class="pin-input" data-len="6" role="group" aria-label="OTP">
            <input class="pin-input-cell" maxlength="1" inputmode="numeric" autocomplete="one-time-code" id="auth-otp-0"/>
            <input class="pin-input-cell" maxlength="1" inputmode="numeric"/>
            <input class="pin-input-cell" maxlength="1" inputmode="numeric"/>
            <input class="pin-input-cell" maxlength="1" inputmode="numeric"/>
            <input class="pin-input-cell" maxlength="1" inputmode="numeric"/>
            <input class="pin-input-cell" maxlength="1" inputmode="numeric"/>
          </div>
        </div>
        <div class="auth-cta-row">
          <button type="button" class="btn-pill btn-pill-primary btn-pill-lg auth-cta" data-auth-verify-otp>
            <span>Verify</span>
            <span class="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
            <span class="btn-pill-spinner" aria-hidden="true"></span>
          </button>
          <button type="button" class="btn-pill btn-pill-secondary" data-auth-change-phone>
            Change
          </button>
        </div>
      </div>

      <!-- OR divider -->
      <div class="auth-divider" aria-hidden="true">
        <span>or</span>
      </div>

      <!-- Google OAuth -->
      <button type="button" class="btn-pill btn-pill-secondary btn-pill-lg auth-google" data-auth-google>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="..."/>
          <path fill="#34A853" d="..."/>
          <path fill="#FBBC05" d="..."/>
          <path fill="#EA4335" d="..."/>
        </svg>
        <span>Continue with Google</span>
        <span class="btn-pill-spinner" aria-hidden="true"></span>
      </button>
    </section>

    <footer class="auth-footer">
      <p>© 2026 Evenzi · Capture · Share · Cherish</p>
    </footer>
  </main>

  <div id="bc-toast" class="bc-toast" role="status" aria-live="polite">
    <span class="bc-live" aria-hidden="true"></span>
    <span id="bc-toast-text"></span>
  </div>

  <script src="../../shared/shell.js"></script>
  <script src="auth.js"></script>
</body>
```

### `designs/pages/auth/auth.css` — new file

- `.auth-shell` — min-height 100dvh, flex column, centered horizontally, vertical padding with safe-area awareness. Subtle radial-gradient `var(--cream-soft)` / `var(--peach)` behind the card for warmth.
- `.auth-brand` — center-aligned wordmark block at top. `.auth-logo` typography mirrors `.fn-logo` but larger (~3rem). `.auth-tagline` is small uppercase tracked-out muted text below.
- `.auth-card` — `max-width: 28rem`, padding `1.75rem` mobile / `2.5rem` ≥640px. Centers within the shell.
- `.auth-tabs` — overrides `.nav-tabs` width to fill the card (`display:flex`, each `.nav-tab` `flex:1`).
- `.auth-h1` — title that changes with tab. Poppins 700, ~1.5rem, brand-ink, tight letter-spacing.
- `.auth-lead` — muted body text, max-width none, line-height 1.5.
- `.auth-step` — flex column with gap. `auth-step[hidden]` doesn't render.
- `.auth-cta` — full-width `.btn-pill` override (`width:100%; justify-content:center`).
- `.auth-cta-row` — flex row for Verify + Change buttons, `gap:.5rem`.
- `.auth-divider` — flex row with `flex:1` borders on either side of the centered "or" text.
- `.auth-google` — full-width like `.auth-cta`. Inline SVG sized 20px.
- `.auth-footer` — centered small text, muted color, top-margin auto to push to bottom of `100dvh`.

### `designs/pages/auth/auth.js` — new file

1. **Tab toggle** — clicking a `[data-auth-tab]` updates `aria-selected` + `is-active`, swaps `.auth-h1` and `.auth-lead` text via a `{signup, login}` content map.
2. **Send OTP** — validates phone (10 digits, starts with 9/8/7/6); on valid, flips primary button to `.is-loading`, after 1.2s timeout hides `[data-auth-step="phone"]` and reveals `[data-auth-step="otp"]`, updates `[data-auth-phone-preview]` text. On invalid, shows error banner.
3. **Verify OTP** — validates all 6 cells filled; on valid, `.is-loading` on Verify button, after 1.2s timeout fires success toast `WELCOME · ABHIJITH` and (in real app) routes to role-selection. Test OTP: `123456` (per CLAUDE.md test phone `9999999999` + OTP `123456`); any other value triggers `.alert-error`.
4. **Change phone** — re-shows `[data-auth-step="phone"]`, clears OTP cells, clears errors.
5. **Google OAuth** — flips Google button to `.is-loading` with label change to "Redirecting to Google…", stays in loading state (in real app browser leaves the page).
6. **Error dismissal** — error banner shows once per failed action; clears on tab change or input change.

## Acceptance criteria

- Sign Up / Log In tabs swap header copy.
- Phone field accepts 10 digits with `+91` prefix split, `inputmode="numeric"` triggers numeric keyboard on mobile.
- OTP input is 6 individual cells that auto-advance on input and back-jump on backspace (shell.js handles this).
- Test path: phone `9999999999` + OTP `123456` → success toast.
- Invalid phone or invalid OTP → `.alert-error` banner shows above the form.
- Loading states on every primary CTA: spinner shows, label/icon hide, button disabled.
- "Continue with Google" button shows the multi-color Google SVG; clicking it enters loading state with "Redirecting to Google…" label.
- Mobile (360–414px): card padding reduces, all CTAs ≥44px tall, no horizontal scroll, safe-area-aware top/bottom padding.
- Desktop (≥640px): card centered horizontally, max-width 28rem, footer pinned to bottom of viewport.
- `prefers-reduced-motion`: spinner pulses (opacity), doesn't spin.
- Keyboard: Tab moves focus through tabs → tab → phone field → Send OTP → OR → Google. All controls activate with Enter; tabs activate with Arrow keys (handled by `aria-selected`-aware code in auth.js).
- Dark mode + light mode both render legibly with the same shell tokens.

## Test phase (per design path SKILL)

- **Component-level** — every state (default/hover/focus/disabled/error/loading) on Phone input, OTP cells, Send OTP, Verify, Change, Google, error banner.
- **Interaction** — full Sign-Up happy path and Log-In happy path. Tab toggle works. Phone validation catches < 10 digits, non-numeric, wrong prefix. OTP validation catches < 6 digits. "Change" returns to phone state with form cleared.
- **Responsiveness** — 360 / 390 / 414 / 640 / 768 / 1024 / 1440 px widths. Mobile-first.
- **Cross-page sanity** — adding `.alert` and `.btn-pill.is-loading` to shell.css must not regress existing consumers. Open dashboard / event-control / components.html to verify.
- **Mobile device** — Abhijith opens the page on phone via LAN URL.
- **UI/UX agent review** — post-build pass.

## Open questions for plan review

1. **Should the auth page have a back-affordance** (e.g., back-chip to the marketing site)? React page doesn't. For MVP, no — but flag if guests need it.
2. **Forgot/no-OTP-received affordance?** React page omits. Could add a "Didn't get a code? Resend in N seconds" countdown. Defer to post-MVP; flag.
3. **Phone format validation** — accept any 10-digit number starting with 6/7/8/9 (Indian mobile prefixes), or only `9*` like the React fallback? Real app should accept all valid Indian mobile prefixes. Plan goes with 6/7/8/9.
4. **OTP `one-time-code` autocomplete** — included on the first pin-input cell to trigger iOS auto-fill. Verify against test devices (deferred — needs real Twilio).

---

## Plan sign-off

- [ ] UI/UX agent review pass
- [ ] Abhijith sign-off

## Built

_To be filled after build + test._
