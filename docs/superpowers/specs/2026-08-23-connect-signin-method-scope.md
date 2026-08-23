# Scope Note — Connect a second sign-in method (Google ↔ Phone)

**Status:** scoped, NOT built. Needs its own build session (backend + auth work).
**Raised:** 2026-08-23 (Abhijith session), Finding #7 from the live bug sweep.

## The finding

On `Settings → Security`, each sign-in method shows a status pill:

- Google — "NOT CONNECTED" (static, no action)
- Phone number — "CONNECTED"

There is no way to connect the missing method. Expected: if the user signed in with phone, they can connect Google; if they signed in with Google, they can connect a phone number. The pills should become actionable ("Connect") for the unconnected method.

Source: `app/settings/SecuritySection.tsx` (the connected-methods list) + the settings data load that determines which identities exist.

## Why this is its own build, not a one-line UI fix

Connecting a second method is **account identity linking**, which is real auth/backend work, not copy or a disabled-button toggle:

- Supabase supports linking identities (`supabase.auth.linkIdentity({ provider: 'google' })` for OAuth, and the phone OTP link flow for phone). This requires **Manual Linking enabled** on the Supabase project and a redirect/callback round-trip for the OAuth case.
- The phone-link flow needs an OTP verify step (send code → verify → attach identity), reusing the existing phone-OTP infrastructure but in a "link to current user" mode rather than "sign in".
- Edge cases: the target identity already belongs to another Evenzi user (conflict), unlinking the last remaining method (must be blocked so the account can't be locked out), and reflecting the new state back into the Security section after linking.
- Security review needed: linking changes who can access an account, so it should go through `/council design` before build (auth surface).

## Suggested approach (for the future session)

1. Confirm Manual Linking is enabled on project `smjkbmkxweevqpvygabe`.
2. Brainstorm → spec the two link flows (Google OAuth link; phone OTP link) + the unlink guard (never remove the last method).
3. `/council design` (auth/security surface) before implementation.
4. Build: a `Connect` action per unconnected method in `SecuritySection.tsx`, the link/verify API routes, and a refresh of the connected-methods state.
5. Test: link each direction, conflict case, last-method-unlink block.

## Interim (optional, cheap)

Until built, the pills are honest but dead. If a stopgap is wanted, the unconnected pill could read "Coming soon" (matching the 2FA row's pattern) so it does not look like a broken control. Confirm with founder whether the interim is worth doing before the real feature.
