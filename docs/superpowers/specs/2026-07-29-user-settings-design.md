# User Settings — Design Spec

**Owner:** Abhijith · **Date:** 2026-07-29 · **Status:** Design approved, pending implementation plan

## 1. Background

User Settings was flagged in the Aug-end V0 launch readiness review as "not started" on the frontend. Investigation during this planning session found the picture is more nuanced than that single line suggested:

- **Design:** locked and complete at `designs/pages/settings/settings.html` — 4 sections (Profile information, Security, Notification preferences, Account).
- **Data model:** already live in Supabase — `public.user_profiles` and `public.user_preferences` tables (both `[NOW]` in `docs/data-model/DATA-MODEL.md`), with a working signup trigger (`on_auth_user_created`) that seeds both rows automatically. Verified directly against the database (project `smjkbmkxweevqpvygabe`): 6 `auth.users` rows, 6 `user_profiles` rows, 6 `user_preferences` rows — 1:1 parity confirms the trigger works. (Note: `DATA-MODEL.md` still tags the underlying function `handle_new_user()` as `[PLANNED]` — that tag is stale and should be corrected separately; the trigger is live.)
- **Frontend:** a route already exists at `/settings` (`app/settings/page.tsx`, component name `UserSettingsPage`) using the shared `FloatingNav` component. But it is a **static UI shell** — no `"use client"`, no save handlers, no Supabase reads/writes beyond displaying `user.email`, uncontrolled toggles with hardcoded defaults. It also doesn't match the locked design's section structure (it has an extra "Appearance" section not in the design, and folds sign-out into "Security" instead of a dedicated "Account" section).
- **Navigation:** the entry point to Settings is inconsistent across the app. The shared `FloatingNav` component (used by `/settings` and event pages) has no Settings icon at all. Meanwhile `app/home/EventsGrid.tsx` and `app/home/loading.tsx` don't use the shared component — they hand-roll a duplicate nav that includes a logout icon the shared component doesn't have. This is a reuse-before-create violation (the exact pattern CLAUDE.md's `.nav-tabs`/`.pill-tab` cautionary note warns about).

This spec covers fixing both: the navigation entry point, and bringing the `/settings` page's four sections up to the locked design with real data wiring.

## 2. Goals

1. One shared navigation component (`FloatingNav`) used everywhere, with a Settings icon that routes to `/settings`, and no destructive action (sign-out) in the nav.
2. `/settings` matches the locked design exactly: Profile information, Security, Notification preferences, Account — each section reading and writing real data.
3. No regression to Home's existing "Create event" entry point.

## 3. Navigation changes

**Component:** `components/layout/FloatingNav.tsx` (shared, already used by `/settings` and event-detail pages via the `eventId` prop).

Changes:
- Add a **Settings** icon button (`material-symbols-outlined: settings`) to `fn-actions`, positioned after `ThemeToggle` and before the avatar divider — matching the design's exact order (Bell → Theme → Settings → divider → Avatar). Routes to `/settings` via `next/link`. Uses `aria-current="page"` and the filled icon variant when `pathname === '/settings'` (matches the design's active-state styling).
- Add an optional `showCreateEvent?: boolean` prop. When true, renders the "Create event" button before the notification bell (Home is the only caller that needs it — event-detail pages and `/settings` don't).
- Wire `userInitial` from real data everywhere it's used, instead of the current hardcoded `'A'` default — derive from `user_profiles.display_name` (fallback to email/phone first character, matching the logic already written in `EventsGrid.tsx`'s `avatarLetter`).
- **No logout button in the nav.** Sign-out moves entirely to the new Account section on `/settings` (§4.4).

**Home migration:**
- `app/home/EventsGrid.tsx`: remove the hand-rolled `<nav className="floating-nav">` block (lines ~333–372) and replace with `<FloatingNav showCreateEvent userInitial={avatarLetter} />`. Remove the now-unused `handleSignOut` function and its `supabase`/`router` sign-out wiring from this file (sign-out logic moves to the Settings page).
- `app/home/loading.tsx`: same swap, so the loading skeleton stays visually consistent with the loaded state (currently it also hand-rolls a duplicate nav with a logout icon).

**Why consolidate rather than patch locally:** patching Home's local copy would leave the duplication in place and the Settings icon would still be missing from event-detail pages, which use the same shared component and will need Settings access too. Fixing it once in the shared component is the correct fix per the project's Reuse Before Create rule.

## 4. `/settings` page — section-by-section spec

Route stays at `/settings` (already exists, no need for a new path). Rebuild the page body to match `designs/pages/settings/settings.html` exactly, replacing the current stub's four sections (Profile/Notifications/Security/Appearance) with the design's four (Profile information/Security/Notification preferences/Account). The stray "Appearance" (dark-mode) section is dropped — dark mode is already controlled from the nav's `ThemeToggle`, so a second control would be a duplicate, not a new capability.

### 4.1 Profile information

Fields: Full name, Phone number (+91 prefix), Email address, Avatar.

- Maps to `user_profiles.display_name` ("Full name" in the design — the DB column is named `display_name`, not `full_name`; use the DB name in code, the design's label in the UI), `.phone`, `.email`, `.avatar_url`.
- Phone and email are **read-only mirrors** of the verified `auth.users` values (per `DATA-MODEL.md` D3 — they're written by the signup trigger, never by the user, and only the two fields already denormalized are safe to show). Only `display_name` and avatar are actually editable here. This means the design's Phone/Email fields should render as read-only in the built version, even though the design mockup shows them as ordinary inputs — changing verified phone/email is a separate, bigger flow (re-verification) that's out of scope for this pass.
- "Save profile" writes `display_name` to `user_profiles` via a Supabase update, scoped by RLS (owner-only, already enforced).
- Avatar upload: follows the same R2 signed-upload pattern already built for event cover images and media (`lib/storage/r2.ts`, `lib/storage/imageOptimize.ts`) — get a signed upload URL, upload directly to R2, write the resulting key/URL to `user_profiles.avatar_url`.

### 4.2 Security

Password change + 2FA toggle, **conditional on `user_profiles.auth_provider`** (confirmed 2026-07-29):

- **`auth_provider = 'email'`/has a password already:** show the design's exact "Change password" form (current password, new password, update button) — calls Supabase Auth's `updateUser({ password })`.
- **`auth_provider = 'phone'` or `'google'` (no existing password):** show a "Set a password" variant instead — same form shape, but framed as adding a second login method (email + new password) rather than changing an existing one, and skips the "current password" field since there isn't one to verify.
- **2FA toggle:** UI-only for this pass (confirmed 2026-07-29). Renders the design's toggle and copy exactly, but wired to a disabled/placeholder state with a "Coming soon" note. Real Supabase Auth MFA enrollment (factor registration, verification, recovery codes) is a separate future task — flagged here so it isn't forgotten, not built now.

### 4.3 Notification preferences

Three choice-cards: Email alerts, Push notifications, SMS alerts — maps 1:1 to `user_preferences.email_alerts`, `.push_notifications`, `.sms_alerts` (all boolean, confirmed via live schema check). Toggling a card writes an update to `user_preferences` immediately (no separate save button, matching the design's `aria-pressed` choice-card pattern which reads as instant-apply, not a staged form).

### 4.4 Account (new section, matches design exactly)

Single card: "Sign out" title + description + a danger-styled pill button (`btn-pill-danger`). Wires to the existing `supabase.auth.signOut()` call (already implemented correctly in the current `EventsGrid.tsx`, just relocating it here) followed by a redirect to `/`. This is the **only** place sign-out lives once the nav change (§3) ships — no logout icon anywhere else in the shell.

### 4.5 Danger Zone — Delete Account (approved 2026-07-29, deferred to a follow-up pass)

A second card below Account, styled after GitHub's repo-settings "Danger Zone" pattern (bordered red/danger container, row layout: title + description on the left, destructive action button on the right). One row for this feature: "Delete account" title, a description of the consequences, and a `btn-pill-danger` "Delete this account" button. **Not part of this build** — the founder explicitly deferred it until the rest of the User Settings page ships. Flagged here so it isn't lost; needs its own follow-up design pass before implementation (confirmation flow, what "delete" actually cascades to — events, guests, media in R2 — is a real data-lifecycle decision, not just a UI addition).

## 5. Explicitly out of scope for this pass

- Real Supabase Auth MFA/2FA enrollment — UI placeholder only (§4.2).
- Editing verified phone/email (re-verification flow) — Profile section shows them read-only.
- `user_profiles.location` — exists in the schema but isn't part of the locked design; not added.
- Any changes to `DATA-MODEL.md`'s stale `[PLANNED]` tag on `handle_new_user()` — noted here as a finding, corrected as a separate small docs fix, not part of this feature's implementation plan.
- Danger Zone / Delete Account (§4.5) — approved in concept, explicitly deferred to a follow-up pass with its own design work.

## 6. Testing considerations for the implementation plan

- Profile save: round-trips `display_name` correctly; RLS blocks reading/writing another user's `user_profiles` row.
- Security: conditional rendering verified for all three `auth_provider` values (`email`, `phone`, `google`); password update calls the correct Supabase Auth method; 2FA toggle is visibly disabled/non-functional, not silently broken.
- Notification cards: each toggle persists on reload (real `user_preferences` write, not local-only state).
- Account: sign-out actually clears the session and redirects; verify no stale session data remains (matches existing `EventsGrid.tsx` behavior, just relocated).
- Nav: Settings icon present and correctly routes on Home, event-detail pages, and `/settings` itself (active state); Create-event button still present only on Home; avatar shows the real user initial everywhere, not hardcoded `'A'`; no logout icon anywhere in the nav on any page.
- Home's loading skeleton (`app/home/loading.tsx`) visually matches the loaded nav (same component, no flash of a different layout).

---

## Built — 2026-07-29

Implemented from [`docs/superpowers/plans/2026-07-29-user-settings.md`](../plans/2026-07-29-user-settings.md) across eight tasks, each independently reviewed before the next began. Verified live against the dev server on a real Supabase session, not just by type-check.

### What shipped

| Area | Result |
|---|---|
| Shared nav | `FloatingNav` gained a Settings icon (active state on `/settings`), an optional Create-event slot, and profile-photo support. Home's two hand-rolled duplicate navs were deleted in favour of it. **No logout icon remains anywhere in the nav.** |
| Sign-out | Relocated to a dedicated Account section on `/settings`, matching the locked design. Verified: clears the Supabase cookie, redirects to `/`, and `/settings` then correctly redirects to `/auth`. |
| Profile | `display_name` saves through `PATCH /api/settings/profile` and round-trips (confirmed against the database, not just the UI). Phone and email render genuinely read-only. Avatar uploads via `POST /api/settings/avatar` to R2. |
| Security | Renders conditionally on whether the account actually has a password. 2FA is a disabled "Coming soon" placeholder that fires no requests, as scoped. |
| Notifications | All three choice-cards write to `user_preferences` immediately and revert on failure. Verified both directions against the database. |
| Page CSS | `designs/pages/settings/settings.css` was never imported by the app; added to `app/globals.css`, so the page's layout rules now actually reach it. |

### Two bugs found by live testing and fixed

1. **The saved name went nowhere.** Home derived both its greeting and the nav avatar initial from the email local-part, so a name saved in Settings never appeared. Home now reads `user_profiles.display_name` and falls back to email/phone only when it is unset. (Commit `b06e6d4`.) The same fix switched the fallback chain from `??` to `||`, because Supabase returns an empty string — not null — for an unset email/phone, which `??` passed straight through as a blank greeting and a "U" avatar.
2. **The nav ignored profile photos.** The avatar always rendered a letter, even for Google sign-ins that arrive with a photo and for hosts who had uploaded one. It now renders the photo and falls back to the initial. Required one new shared primitive, `.fn-avatar-img` in `shell.css`, catalogued under B4 in `designs/components.html` per the Reuse Before Create rule. (Commits `dfab7d8`, `17b44e1`.)

### Breakpoints — all six clean

Checked at 360, 390, 414, 768, 1024 and 1440px. No horizontal overflow at any width. The Profile section correctly collapses from two columns to one below 768px, and the notification cards reflow 1 → 2 → 3 columns without clipping.

### Known, not fixed (pre-existing, out of this pass's scope)

- Nav icon buttons are 36×36px, below the 44px touch-target guideline. This is the shell's existing `.fn-icon-btn` size and affects every nav icon equally — the Settings icon simply matches its siblings. Worth a design-system-wide decision rather than a one-off change here.
- A React hydration warning (`Extra attributes from the server: class`) fires on every page, caused by the anti-FOUC theme script in `app/layout.tsx`. Pre-existing and unrelated to this work.
- `text-success` is referenced by the success toasts in `ProfileSection` and `SecuritySection` but is not defined in any CSS the app imports, so those toasts render in the default text colour instead of green. `text-error` does resolve. Cosmetic.

### Still deferred

Danger Zone / Delete Account (§4.5) remains out of scope, as agreed — it needs its own design pass covering the confirmation flow and what deletion cascades to (events, guests, R2 media).
