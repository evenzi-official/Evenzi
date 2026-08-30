# AGENTS.md

> Project overview and dev workflow live in `CLAUDE.md` and `docs/PROJECT.md`.
> Standard commands are in `package.json` (`dev`, `build`, `start`, `lint`, `test`, `test:run`, `sys-check`).

## Cursor Cloud specific instructions

Evenzi is a single Next.js 14 (App Router) web app — there is no monorepo and no local backend to start. The only runtime dependency is a **hosted Supabase project** (Postgres + Auth). Node 20+ is required (verified on Node 22).

### Running / testing the app
- `npm run dev` starts the dev server on `http://localhost:3000` (do not use the production `build`/`start` for development).
- `npm run lint` currently reports pre-existing errors in app code (e.g. `app/events/create/components/Step2BasicDetails.tsx`, `lib/supabase/server.ts`). These are not environment problems — do not "fix" them unless that is your task. `next build` succeeds despite them.
- `npm run test:run` runs Vitest once (65 tests pass); `npm run test` is watch mode.
- `npm run build` succeeds and is a good smoke test of the whole app compiling.

### Supabase environment variables (required for auth + event flows)
- The app reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` from the process environment (`lib/supabase/{client,server,middleware}.ts`). In Cloud, set them as agent **secrets** — Next.js picks up `NEXT_PUBLIC_*` from `process.env`, so no `.env.local` is needed. Locally you can instead create `.env.local`.
- **Gotcha — `SETUP.md` is stale.** The URL/key in `SETUP.md` (`rkakqjneqwlszcvqixxr.supabase.co`) point to a dead project whose DNS no longer resolves, and that key returns `UNAUTHORIZED_INVALID_API_KEY` against the live project. The live project is `smjkbmkxweevqpvygabe.supabase.co` (see `CLAUDE.md` / `docs/ONBOARDING.md`). Use the live project's own anon/publishable key — the `SETUP.md` key is for a different project.
- Without a valid key for the live project, the UI still renders and route protection works, but any auth/API call fails. The authenticated end-to-end flow (login + create event) cannot be exercised until the correct key is supplied.

### Test login (once the correct Supabase key is set)
- Phone OTP test account: phone `9999999999`, OTP `123456` (pre-configured in Supabase as `919999999999=123456`; India +91). This avoids real Twilio/Google setup for E2E testing of login → role selection → `/home` → create event.

### Network note
- Cloud egress is not policy-restricted, but a Supabase project host only resolves if the project actually exists. If `*.supabase.co` DNS fails for a given ref, the project is likely deleted/paused — verify you are pointing at the live project ref, not a stale one.
