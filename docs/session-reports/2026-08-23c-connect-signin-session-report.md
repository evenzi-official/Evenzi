# Session Report — Connect a Second Sign-in Method (Finding #7)

**Date:** 2026-08-23 (session c)
**User:** Abhijith
**Branch:** `feature/connect-signin-method` → merged to `Dev-Vibe` → `Dev-Vibe-Testing` (prod)
**ClickUp:** none (dormant, per standing founder decision)

## Goal

Close Finding #7 from the 2026-08-23 live bug sweep: the `Settings → Security` sign-in pills were static, with no way to connect the missing method. Make them actionable in both directions (link Google to a phone account, link a phone to a Google account) with a guard that prevents removing the last remaining sign-in method.

## What shipped

A new client component `app/settings/ConnectMethods.tsx` that owns the interactivity, plus a backward-compatible callback change. No new API routes — everything reuses the browser Supabase client and existing shell primitives, mirroring how the login screen already works.

- **Connect Google** — `supabase.auth.linkIdentity({ provider: 'google', options: { redirectTo: '/auth/callback?next=/settings#security' } })`. OAuth round-trip returns the user to the Security section instead of the sign-in role gate.
- **Connect Phone** — `updateUser({ phone })` → reuse the existing 6-cell OTP UI → `verifyOtp({ type: 'phone_change' })` → also writes `user_profiles.phone` to keep the profile in sync → refresh.
- **Disconnect** — `unlinkIdentity(identity)` behind a `ConfirmDialog`, shown only when the account has two or more identities (`identityCount >= 2`). This is the lockout guard, backed by Supabase's own server-side refusal to unlink the last identity.
- **Callback** — `app/auth/callback/route.ts` now honors an optional `next` query param, validated to same-origin internal paths only (open-redirect guarded: rejects `//host`, `://`, and non-slash-leading values). No `next` = existing login behavior, unchanged.

## Files changed

- `app/settings/ConnectMethods.tsx` (new) — the three-action client component.
- `app/settings/SecuritySection.tsx` — delegates the methods list to `ConnectMethods`; new `identityCount` / `userId` props.
- `app/settings/page.tsx` — computes and passes `identityCount` and `userId`.
- `app/auth/callback/route.ts` — `safeNext` validator + `next`-aware redirect.
- `docs/superpowers/specs/2026-08-23-connect-signin-method-design.md` (new) — approved design.
- `docs/ops/v0-readiness.html` — fix-log row #7 flipped from "scoped / Own session" to "Live".

## Verification

- **tsc** — clean (confirms all four Supabase SDK calls are typed in the installed version).
- **eslint** — clean on all touched files.
- **Server render** — `/settings` renders server-side without error; unauthenticated redirect intact (the module graph including `ConnectMethods` compiles and executes).
- **Unit checks** — `safeNext` (6 cases incl. open-redirect vectors) and `toE164` (3 cases) all pass.
- **Not done in-session:** live click-through of the two link flows and disconnect. The automated browser cannot drive the controlled OTP input and cannot complete Google OAuth interactively, so this needs a real logged-in session. Recommended: founder logs in on the dev server (or the testing deploy) and walks the three actions.

## Open follow-ups

1. **Supabase dashboard action (founder):** enable **Authentication → Allow manual linking** (off by default; distinct from the Google provider config that already powers login). Required for Google-link to complete. Phone-link needs nothing new. Until enabled, the Google Connect button shows a clean "temporarily unavailable" message rather than a raw 422.
2. **Live QA:** walk phone-link (Google-primary account), Google-link (phone-primary account, once the toggle is on), disconnect guard (two methods → works; one left → no control), and the conflict case (target identity already on another account → friendly "already linked" copy).

## Next session (unchanged from prior report, minus #7)

- Help Centre launch gates — `support@evenzii.com` mailbox + ticket watching.
- Un-merged Stage-2 audit branch `feature/platform-truth-audit` — decide merge/deploy.
- Repo cleanup A/B/C + fixture cleanup.
- Q4 Digital Invitations persist · Q5 hide Billing upgrade CTA.
