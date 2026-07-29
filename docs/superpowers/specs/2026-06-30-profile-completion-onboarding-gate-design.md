# Profile Completion — Onboarding Gate + Identity Display

**Date:** 2026-06-30
**Author:** Abhijith (brainstorm with Claude)
**Status:** Design — pending review

---

## 1. Problem & Context

New users who sign in via **phone OTP** land in the app with **no `display_name`** (and no email, no avatar). The dashboard greeting reads the auth identity, not the profile, so:

- The dashboard greets "WELCOME BACK, EVENZI.OFFICIAL" — it derives the name from `user.email` local-part (`app/home/page.tsx:66`: `user.email ?? user.phone ?? "User"`), **never reading `user_profiles.display_name`**. For a phone user with a NULL name it would show the raw phone number.
- There is no step that ever collects a `display_name` for phone-OTP users. The role-selection step sets `role_slug = 'host'` but never asks for a name.

We need to (a) force users to provide a name before they can use the app, (b) softly nudge them to complete the rest of their profile, and (c) show their real name + photo everywhere we display identity.

### Current state (verified)
- `user_profiles` columns: `id, role_slug, display_name, avatar_url, email, phone, auth_provider (NOT NULL default 'phone'), location, onboarding_completed (NOT NULL default false), created_at, updated_at`. **No migration needed — every field already exists.**
- `getUserProfile()` (`lib/supabase/profile.ts`) currently returns `id, role_slug, display_name, avatar_url, onboarding_completed`.
- The user settings page (`app/settings/page.tsx`) Profile section is a **static stub** — fields don't load from the profile and "Save profile" is a dead `type="button"` with no handler.
- Middleware (`lib/supabase/middleware.ts`) routes on `role_slug` only (no role → `/auth/role-selection`); it does **not** check profile completeness.
- RLS: `user_profiles` has owner policies (3 RLS policies) — writes are scoped to `auth.uid() = id`.

---

## 2. Goals & Non-Goals

**Goals**
1. A user with **no `display_name`** cannot reach any protected page — they are redirected to the settings page until they provide a name.
2. A user **with a name but missing** email / phone / photo sees a **persistent, dismissible warning banner** on the dashboard nudging them to complete their profile.
3. The dashboard (and other identity surfaces) show the real `display_name` + `avatar_url` (with an initials fallback), fixing the "EVENZI.OFFICIAL" greeting.
4. The settings Profile section actually **loads and saves** profile data, including a **photo upload**.

**Non-Goals**
- No change to the auth login mechanism (phone OTP / Google OAuth flows untouched).
- No change to `auth.users` — `email`/`phone` edited here are **profile/contact fields** in `user_profiles`, not auth identities.
- Not fixing the separately-tracked Google OAuth PKCE / Twilio-OTP issues (different work).
- Notifications / Security / Appearance settings sections stay as-is (out of scope).

---

## 3. Completeness Tiers (the rules)

| Tier | Condition | Behavior |
|------|-----------|----------|
| **Blocked** | `display_name` is null/empty | **Hard redirect** to `/settings` from any protected non-settings route. Dashboard unreachable. |
| **Warning** | `display_name` present **AND** any of `email` / `phone` / `avatar_url` empty | Dashboard loads + **dismissible persistent banner** → "Complete your profile" CTA to `/settings`. |
| **Complete** | `display_name` + `email` + `phone` + `avatar_url` all present | Normal dashboard, no banner. |

- **Gate mechanism:** middleware checks `display_name` **directly** (null or whitespace-only → blocked). `onboarding_completed` is set to `true` by the save endpoint once a non-empty `display_name` is persisted (kept meaningful for future use, but the gate does not rely on it).
- **Banner dismissal:** dismissible per browser (localStorage flag). Reappears on a new session until the profile is Complete. (Tunable: if nagging Google users about a missing phone proves noisy, narrow the trigger later.)

---

## 4. Components

### 4.1 Profile data layer
- **Extend `getUserProfile()`** (`lib/supabase/profile.ts`) to also select/return `email`, `phone`, `location`, `auth_provider`. Update the `UserProfile` interface. (Middleware + home + settings all consume this — one source of truth.)
- **New `PATCH /api/user/profile`** route:
  - Auth-gated (`getUser()` → 401).
  - Zod-validated body: `display_name` (string, 1–80 after trim, **required to be non-empty when present**), `email` (optional, email format or null), `phone` (optional, string or null), `location` (optional, string or null), `avatar_url` (optional, string or null).
  - `''`/whitespace → null coercion for `email`/`phone`/`location`/`avatar_url` (mirrors the D44 rule used in event settings).
  - Writes to `user_profiles` where `id = auth.uid()` (RLS-enforced; no explicit filter needed but include for clarity).
  - If the resulting `display_name` is non-empty → also set `onboarding_completed = true`.
  - Returns the updated profile.
- **New `POST /api/user/avatar`** route (photo upload):
  - Auth-gated; validates file type (jpeg/png/webp) + size (≤ ~5 MB), mirroring `app/api/events/cover/route.ts`.
  - Uploads to R2 via `lib/storage` `putObject`, key `avatars/{user.id}/{timestamp}.{ext}`.
  - Returns the public URL (`getPublicUrl(key)`), which the client stores into `avatar_url` via the profile PATCH.
  - **Note:** R2 keys are not present in the local worktree `.env.local`, so upload is **functional only where R2 env is configured** (deploy/prod). The display path (existing `avatar_url`) works everywhere.

### 4.2 Middleware hard gate (`lib/supabase/middleware.ts`)
- After the existing role-routing block, add: if `user` has a role **and** `profile.display_name` is null/whitespace **and** the path is not allowed-through → redirect to `/settings`.
- **Allowed-through (no gate):** `/settings`, `/auth/*`, `/api/*`, `/_next/*`, the existing public paths, and dev playground. Prevents redirect loops and lets the save endpoint run.
- Applies to **all** protected routes (deep-links to `/events/[id]` included), since a nameless user has no identity anywhere.
- `getUserProfile()` is already called in middleware for role routing — reuse that result; no extra query.

### 4.3 Settings Profile section (`app/settings`)
- Convert the static Profile `<section>` into a **client component** (`ProfileSettingsForm`) that:
  - Receives the current profile (server-fetched in `page.tsx`) as props.
  - Renders editable fields: **Display name** (required), **Email**, **Phone**, **Location**, plus the **avatar** (current `avatar_url` or initials) with a "Change photo" upload.
  - **Login-identity field is read-only:** if `auth_provider = 'phone'` → phone shown read-only ("your login"); if `'google'` → email read-only. The other contact field is editable.
  - Save → `PATCH /api/user/profile` (+ `POST /api/user/avatar` first if a new photo was picked). Success toast + refresh.
  - When arrived via the gate (no name), show an inline hint: "Add your name to continue to your dashboard." (Detected via `?reason=complete-profile` query param the middleware appends, or simply by empty `display_name`.)
- The settings page keeps its breadcrumb, but the "back to dashboard" path is harmless under the gate (middleware re-redirects a nameless user back to `/settings`).

### 4.4 Dashboard identity (`app/home`)
- `home/page.tsx`: fetch the profile via `getUserProfile()` (currently it only has the auth `user`). Pass `displayName`, `avatarUrl`, and the computed completeness flags to `EventsGrid`.
- Greeting uses `display_name` (fallback order: `display_name` → a friendly generic like "there", **not** email/phone). Avatar uses `avatar_url` → colored initials fallback.
- Apply the same identity source to other surfaces that show the user (account button / nav avatar) where trivially in reach; otherwise note as follow-up.

### 4.5 Dashboard warning banner (`app/home`)
- New small client component `ProfileCompletionBanner`:
  - Renders when `display_name` present AND any of `email`/`phone`/`avatar_url` missing.
  - Dismissible (localStorage key, e.g. `evenzi:profile-banner-dismissed:<missing-hash>`); reappears next session until Complete.
  - Copy names what's missing ("Add your email and photo to finish setting up"). CTA → `/settings`.
  - Reuses existing shell banner/alert primitives where available (check `shell.css` / components before adding new).

---

## 5. Data Flow

**New phone user, first login:**
`/auth` OTP verify → role-selection sets `host` → middleware sees role but empty `display_name` → redirect `/settings?reason=complete-profile` → user fills name (+ optional rest) → `PATCH /api/user/profile` sets name + `onboarding_completed=true` → next navigation passes the gate → `/home` greets by name.

**Returning user, name set, phone missing (e.g. Google user):**
Login → middleware passes (has name) → `/home` → `getUserProfile` shows name + Google avatar → `ProfileCompletionBanner` renders ("add your phone") → dismissible.

---

## 6. Error Handling
- Profile PATCH validation failure → 400 with field errors; form shows inline errors, no navigation.
- Avatar upload failure → toast "Couldn't upload photo," profile text fields still saveable independently.
- Profile fetch failure in middleware → treat as incomplete is **too aggressive** (would gate on a transient error); instead, on a profile-fetch error middleware should **not** hard-gate (fail open to avoid locking users out on a blip), and the dashboard simply falls back to the initials/"there" greeting. Log the error.
- Save partial: text save and avatar upload are sequenced (upload → get URL → single PATCH including `avatar_url`) so there's one write, no partial-state inconsistency.

---

## 7. Testing
- **Unit/integration (Vitest):** `PATCH /api/user/profile` — auth gate (401), validation (empty name rejected when blocking, length bounds), `''`→null coercion, `onboarding_completed` set on name save, RLS scoping.
- **Middleware logic:** nameless user → redirect to `/settings`; named user → passes; `/settings` + `/api/*` never gated; profile-fetch error fails open.
- **Manual / Playwright (when auth harness available):** phone-OTP new user is gated → fills name → reaches dashboard greeted by name; Google user sees banner for missing phone; banner dismiss persists for the session; mobile widths 360/390/414.
- **DB check:** after save, `user_profiles` row has the new `display_name` + `onboarding_completed = true`.

---

## 8. Out of Scope (explicit)
- Editing the auth-identity email/phone in `auth.users` (only the `user_profiles` contact fields change).
- Notifications / Security / Appearance settings wiring.
- Vendor role variations.
- The separate Google-PKCE and Twilio-OTP auth issues.

---

## 9. Open / Tunable
- Banner trigger granularity (missing *any* of email/phone/avatar vs. only the "name-only" case) — start with "any," tune if Google users find the missing-phone nudge noisy.
- Whether to also gate on `location` later (currently location is fully optional, not even warning-level).
