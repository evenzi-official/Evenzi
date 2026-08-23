# Design — Connect a Second Sign-in Method (Google ↔ Phone)

**Date:** 2026-08-23
**Author:** Abhijith (Claude session)
**Status:** Approved shape, ready for implementation plan
**Supersedes/extends:** `docs/superpowers/specs/2026-08-23-connect-signin-method-scope.md` (the original scope note, Finding #7 from the 2026-08-23 live bug sweep)

---

## Problem

On `Settings → Security`, each sign-in method shows a static status pill:

- Google — "Not connected" (no action)
- Phone number — "Connected"

There is no way to connect the missing method. A user who signed up with phone cannot add Google, and a user who signed up with Google cannot add a phone number. The pills are honest but dead controls.

## Goal

Make the unconnected method actionable, in both directions, and let the user disconnect a method they no longer want — without ever letting them remove their last remaining method (which would lock them out of the account).

## Verified current state (2026-08-23)

Established from the live Supabase project `smjkbmkxweevqpvygabe` and the codebase before any changes:

- **10 users, each with exactly one identity today.** Nobody has a linked account yet. Provider breakdown: 8 `google`, 1 `email`, 1 `phone`.
- **Phone is a real `auth.identities` row** (provider `phone`), so linking a phone creates a second identity row, symmetric with Google.
- **Google sign-in already works** on the login screen via `signInWithOAuth({ provider: 'google' })`. This is the provider being *configured*, which is a different thing from manual linking (see Blocker below).
- **Existing auth primitives to reuse** (all already in `app/auth/page.tsx`, client-side):
  - Phone OTP send: `supabase.auth.signInWithOtp({ phone })`
  - Phone OTP verify: `supabase.auth.verifyOtp({ phone, token, type: 'sms' })`
  - Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
  - OAuth return handler: `app/auth/callback/route.ts` → `exchangeCodeForSession(code)`
- **Settings data load** (`app/settings/page.tsx`) already computes `connected` per method from `user.identities` (Google) and `profile.phone ?? user.phone` (Phone), and passes a `SignInMethod[]` to `SecuritySection`.

## Supabase APIs (confirmed against current docs)

| Flow | Client call | Notes |
|---|---|---|
| Link Google to current user | `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo } })` | OAuth round-trip → returns via `/auth/callback`. **Requires Manual Linking enabled** on the project (off by default). Returns HTTP 422 if disabled. |
| Add phone to current user | `supabase.auth.updateUser({ phone })` → then `supabase.auth.verifyOtp({ phone, token, type: 'phone_change' })` | Independent of the manual-linking toggle. Reuses the existing OTP UI. |
| Disconnect a method | `supabase.auth.unlinkIdentity(identity)` | `identity` is an object from `user.identities`. Supabase blocks unlinking the **last** identity server-side; we also guard in the UI. |

## Architecture

Keep `SecuritySection` a server component (it already receives the computed `methods`). Extract the interactive methods list into a small **client child component** `app/settings/ConnectMethods.tsx`. This isolates the auth interactivity, keeps the section server-rendered, and mirrors how `app/auth/page.tsx` already does auth work entirely client-side with the browser Supabase client.

**No new API routes.** The browser Supabase client carries the session in cookies and can perform `linkIdentity`, `updateUser`, `verifyOtp`, and `unlinkIdentity` directly — the same pattern the login screen already uses. This is leaner and lower-risk than introducing server routes that would re-wrap the same SDK calls.

### Data passed to the client component

For each method, the server passes:

```
{
  provider: 'google' | 'phone'
  label: string
  icon: string
  connected: boolean
  detail: string | null
  identityId: string | null   // auth.identities.id, for unlink; null if not connected
}
```

`identityId` is read from `user.identities` in `app/settings/page.tsx` and is required so the client can call `unlinkIdentity` without another round-trip to fetch identities.

### The three actions

1. **Connect Google** — shown when Google is not connected. Calls
   `linkIdentity({ provider: 'google', options: { redirectTo: \`${origin}/auth/callback?next=/settings%23security\` } })`.
   The browser redirects to Google and returns to the callback.

2. **Connect Phone** — shown when Phone is not connected. Reveals an inline `+91` number field, calls `updateUser({ phone })` to trigger an OTP, shows the existing 6-cell OTP input, then `verifyOtp({ phone, token, type: 'phone_change' })`. On success it also writes `user_profiles.phone` so the profile stays in sync with the auth record, then refreshes the section (`router.refresh()`).

3. **Disconnect** — shown on a connected method **only when two or more methods are connected**. Opens the shared `ConfirmDialog`, then calls `unlinkIdentity(identity)` and refreshes. When only one method is connected, no Disconnect control is rendered — this is the lockout guard, backed by Supabase's own server-side refusal as defence in depth.

### Callback change

`app/auth/callback/route.ts` currently always redirects to `/auth/role-selection` (or `/home` when a role exists). Add support for an optional `next` query parameter:

- Read `next` from the callback URL.
- Validate it is a safe internal path (starts with `/`, is not protocol-relative `//`, no external host).
- After a successful `exchangeCodeForSession`, if a valid `next` is present, redirect there; otherwise fall back to the existing role-selection/home logic.

This is backward-compatible: the login flow passes no `next` and behaves exactly as today. Only the link flow uses it, to return the user to `Settings → Security`.

## Error and edge handling

All surfaced as friendly inline copy; no bespoke server logic is required because Supabase returns typed errors:

- **Target identity already belongs to another Evenzi account** (`identity_already_exists`, `phone_exists`, or similar) → "That Google account / phone number is already linked to another Evenzi account."
- **Manual linking disabled** (HTTP 422 on `linkIdentity`) → "Connecting Google is temporarily unavailable." (Instead of a raw error string.)
- **Wrong or expired OTP** → reuse the existing verify error copy.
- **Last-method disconnect** → the control is not rendered; if somehow reached, Supabase's server-side refusal is shown as a friendly message.

## Reused components / primitives

- `StatusBadge` — the connected / not-connected pill (already used).
- `btn-google`, `btn-pill`, `pin-input`, `form-input-group`, `divider-or` — existing shell classes from the login screen.
- `ConfirmDialog` — for the Disconnect confirmation.
- `useBusy` / `BusyProvider` — to lock the UI during redirect / verify round-trips.

No new shared primitives are introduced, so `designs/components.html` needs no catalog addition.

## Blocker to resolve before Google-link works end to end

`linkIdentity` requires **Manual Linking** enabled in the Supabase dashboard (Authentication → Sign In / Providers → *Allow manual linking*), which is **off by default** and is a different setting from the Google provider configuration that already powers login. This cannot be toggled from SQL or the MCP; it is a dashboard action for the founder.

The build does not block on it: the phone-link direction works immediately, and the Google-link direction degrades to a clean "temporarily unavailable" message until the toggle is on, at which point it works with no code change.

## Testing

- **Phone-link** (Google-primary account): reveal field → send OTP → verify → pill flips to Connected, `user_profiles.phone` written, Disconnect appears on the now-second method.
- **Google-link** (phone-primary account): with Manual Linking on, redirect → Google → return to `/settings#security` → Google pill Connected. With the toggle off, the button shows "temporarily unavailable" and does not error out.
- **Disconnect guard**: with two methods, Disconnect works and refreshes; with one method left, no Disconnect control is shown.
- **Conflict**: attempt to link a Google account / phone already on another Evenzi user → friendly "already linked" copy.
- **Regression**: normal Google *login* (no `next` param) still lands on role-selection / home unchanged.

## Out of scope

- Two-factor authentication (separate "coming soon" row, untouched).
- Email as a third linkable method (only Google and Phone are surfaced today).
- Any change to the login screen itself.
