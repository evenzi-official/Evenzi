# Design Spec: Auth & Role Selection

**Date:** 2026-04-08
**ClickUp Task:** Feature: User Auth & Role Selection (`86d2jwz1h`)
**Status:** Design approved, pending implementation

---

## Summary

Complete the Auth & Role Selection feature by:
1. Fixing Google OAuth (SSO login)
2. Building the Role Selection screen for first-time users
3. Creating the `user_profiles` table with automatic profile creation
4. Implementing role-based redirect logic in middleware

Auth is 75% complete — Phone OTP, Google OAuth flow, and session management are built. This spec covers the remaining 25%: Role Selection screen, user profiles DB layer, and redirect logic.

---

## Scope

### In Scope
- Fix Google OAuth callback (debug redirect URL / error handling)
- `user_profiles` Supabase table with DB trigger for auto-creation
- RLS policies for profile security
- Role Selection page at `/auth/role-selection`
- Middleware changes for role-based routing
- Update branding from "WeddingPlanner" to "Evenzi" on auth page

### Out of Scope
- Vendor role flows (deferred post-MVP)
- Host Onboarding wizard (separate task: Event CRUD `86d2jwz3x`)
- Email/password auth
- Multi-factor authentication

---

## Database Design

### Table: `user_profiles`

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, FK → auth.users(id) ON DELETE CASCADE | 1:1 with auth user |
| `role` | text | nullable, CHECK (role IN ('host', 'vendor')) | null = role not selected |
| `display_name` | text | nullable | From Google name or phone |
| `avatar_url` | text | nullable | From Google avatar |
| `onboarding_completed` | boolean | NOT NULL, DEFAULT false | Has user finished event creation wizard? |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | Auto-set |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | Updated via trigger |

### DB Trigger: Auto-create profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.phone),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;  -- handles race conditions / backfill overlap
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Updated_at trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_profile_updated
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Role immutability trigger

Once a role is set, it cannot be changed. This prevents users from switching roles via direct Supabase client calls.

```sql
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger AS $$
BEGIN
  IF OLD.role IS NOT NULL AND NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Role cannot be changed once set';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_role_change_attempt
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_change();
```

### RLS Policies

```sql
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

No INSERT policy needed (trigger runs as SECURITY DEFINER). No DELETE policy (profiles cascade with auth user deletion).

### Backfill existing users

Run after table and trigger creation to handle any users who signed up before the trigger existed:

```sql
INSERT INTO public.user_profiles (id, display_name, avatar_url)
SELECT id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);
```

---

## Auth Flow

### Complete user journey

```
Landing Page → "Sign In" / "Get Started"
  → Auth Page (/auth)
    → Phone OTP flow OR Google OAuth flow
      → First-time user (no role)?
        → /auth/role-selection
          → Select "Host" → update user_profiles.role = 'host'
            → /home (dashboard)
      → Returning user (has role)?
        → /home (dashboard)
```

### Google OAuth fix

**Confirmed broken:** Clicking "Continue with Google" redirects to Google but returns to `/auth?error=auth_failed`. The callback at `/auth/callback` fails to exchange the auth code. Investigation areas:
1. **Redirect URL mismatch** — Supabase dashboard redirect URL must match `{origin}/auth/callback`
2. **Missing error handling** — callback route silently fails; add logging
3. **PKCE flow** — Supabase SSR uses PKCE by default; ensure callback properly exchanges code

The callback route (`app/auth/callback/route.ts`) currently redirects to `/home`. After this change, it should redirect based on profile state:
- Profile has role → `/home`
- Profile has no role (new user) → `/auth/role-selection`

### Security: Open redirect fix in callback

The current callback uses `searchParams.get('next')` directly in a redirect, which is an open redirect vulnerability. Fix: hardcode allowed destinations instead of accepting arbitrary paths.

```typescript
// BEFORE (vulnerable):
const next = searchParams.get('next') ?? '/home'
return NextResponse.redirect(`${origin}${next}`)

// AFTER (safe):
const allowedPaths = ['/home', '/auth/role-selection']
const next = searchParams.get('next') ?? '/home'
const safePath = allowedPaths.includes(next) ? next : '/home'
// Then determine redirect based on profile role state
```

---

## Middleware Changes

### Current behavior
```
Request → getUser() → no user? → redirect /auth
                    → has user? → allow through
```

### New behavior
```
Request → getUser()
  → no user + protected route? → redirect /auth
  → has user → fetch user_profiles.role
    → no role + not on /auth/role-selection? → redirect /auth/role-selection
    → has role + on /auth/role-selection? → redirect /home (prevent re-selection)
    → has role + on /auth? → redirect /home (already logged in)
    → has role + protected route? → allow through
```

### Public paths (no auth required)
- `/` (landing)
- `/auth` (login/signup)
- `/auth/callback` (OAuth callback)
- `/api/*` (API routes)
- `/_next/*` (static assets)

**Note:** `/home` must be REMOVED from public paths (currently listed as public in middleware). Dashboard requires authentication — the client-side auth check is not sufficient.

### Semi-protected paths (auth required, no role required)
- `/auth/role-selection` (must be logged in, must NOT have role yet)

### Protected paths (auth + role required)
- `/home` (dashboard)
- Everything else

### Performance

The middleware now queries `user_profiles` on each request. At this app's scale (~5ms per query), this is acceptable. If it becomes a concern later, we can cache the role in a short-lived cookie.

---

## UI: Role Selection Screen

### Route
`/auth/role-selection` — client component

### Design Reference
Figma: `LjoTKwL7pkpYVnAW6hr4s8` node `27:49`

> **Note:** Colors, fonts, and spacing values below are placeholders from the Figma design. They will be replaced with finalized brand tokens from `docs/BRAND-GUIDELINES.md` once confirmed. All components will reference CSS custom properties (Tailwind theme tokens), not hardcoded values — making the swap zero-effort.

### Layout
- Full-page centered, light background (`#f9fafb`)
- Evenzi logo header (Inter Bold, 24px, `#111827`)
- Heading: "How will you use the platform?" (Inter Bold, 36px, `#111827`)
- Subtitle: "Select your role to get a personalized experience tailored to your needs." (Inter Regular, 18px, `#6b7280`)
- Two cards in 2-column grid (gap 32px, max-width 1024px)
- "Back to Login" link below (with left arrow icon)
- Footer: "2026 Evenzi. All rights reserved." (`#9ca3af`, 14px)

### Host Card (Active)
- White background, rounded-16px, border 2px `#e5e7eb`, subtle shadow
- Party popper icon in light gray circle (top, centered) — use inline SVG matching Figma asset
- Title: "Host / Event Owner" (Inter Bold, 24px, `#111827`)
- Description: "Manage your event details, guest lists, and create a beautiful event website. Collect all your memories in one place." (Inter Regular, 16px, `#6b7280`)
- CTA button: "Continue as Host" (Inter Semi Bold, 18px, white text, `#111827` background, rounded-12px, full width, py-16px)
- Hover: card border becomes `#111827`, button lightens slightly

### Vendor Card (Disabled — Coming Soon)
- Same layout as Host card
- Opacity ~50% or grayscale filter
- "Coming Soon" badge in top-right corner (small pill, muted colors)
- Briefcase icon (grayed) — use inline SVG matching Figma asset
- Title: "Vendor" (grayed)
- Button disabled: "Continue as Vendor" (no hover, cursor-not-allowed)

### Accessibility
- Card container: `role="radiogroup"`, `aria-label="Select your role"`
- Host card: `role="radio"`, `aria-checked="false"` (toggles on click), `tabindex="0"`
- Vendor card: `role="radio"`, `aria-disabled="true"`, `aria-checked="false"`
- Keyboard navigation: Arrow keys move between cards, Enter/Space activates
- Focus management: On page load, focus lands on the heading or first card
- Error region: `aria-live="polite"` so screen readers announce errors
- Vendor badge: `<span role="status">Coming Soon</span>`
- Respect `prefers-reduced-motion` for any card animations

### States
1. **Loading** — Page-level skeleton while middleware confirms user needs role selection
2. **Ready** — Cards visible, interactive
3. **Submitting** — "Continue as Host" button shows spinner, cards non-interactive
4. **Error** — Dismissible error banner above cards with retry action
5. **Success** — Redirect to `/home`

### Behavior
1. Click "Continue as Host" → show loading spinner on button
2. Call Supabase: `UPDATE user_profiles SET role = 'host' WHERE id = auth.uid()`
3. On success → `router.push('/home')`
4. On error → show dismissible error banner above cards with retry action
5. "Back to Login" → `supabase.auth.signOut()` → redirect to `/auth`

### Mobile (< 768px)
- Cards stack vertically, full width
- Heading font size reduces to 28px
- Padding reduces

### Guard
- If user already has a role, redirect to `/home` (middleware handles this)
- If user is not authenticated, redirect to `/auth` (middleware handles this)

---

## Files Changed

### New Files
| File | Purpose |
|------|---------|
| `app/auth/role-selection/page.tsx` | Role Selection screen (client component) |
| Supabase migration (via MCP) | `user_profiles` table, triggers, RLS |

### Modified Files
| File | Changes |
|------|---------|
| `lib/supabase/middleware.ts` | Add role-based redirect logic |
| `app/auth/page.tsx` | Fix Google OAuth, rename "WeddingPlanner" → "Evenzi", remove `any` types and `console.log` debug statements |
| `app/auth/callback/route.ts` | Redirect based on profile role (new user → role-selection) |
| `app/home/page.tsx` | Remove redundant client-side auth check |

---

## Testing

### Manual test cases
1. **New user (Phone OTP):** Sign up → land on role selection → pick Host → land on dashboard
2. **New user (Google OAuth):** Sign up → callback → land on role selection → pick Host → land on dashboard
3. **Returning user:** Login → skip role selection → land on dashboard directly
4. **Direct URL access:** Navigate to `/auth/role-selection` with role already set → redirect to `/home`
5. **Unauthenticated access:** Navigate to `/auth/role-selection` without logging in → redirect to `/auth`
6. **Vendor card:** Click → nothing happens (disabled)
7. **Back to Login:** Click → signs out → redirects to `/auth`
8. **Google OAuth error:** Invalid callback → shows error on auth page

### Automated tests (Vitest)
- `user_profiles` trigger creates profile on signup
- Middleware redirects correctly for each user state
- Role selection API call updates profile
- RLS prevents cross-user profile access

---

## Acceptance Criteria

1. Google OAuth login works end-to-end (sign up + sign in)
2. First-time users see the Role Selection screen after auth
3. Selecting "Host" persists the role and redirects to dashboard
4. Returning users bypass role selection and go straight to dashboard
5. Vendor card shows "Coming Soon" and is non-interactive
6. `user_profiles` table has proper RLS (users can only access own profile)
7. Auth page shows "Evenzi" branding (not "WeddingPlanner")
8. Mobile-responsive role selection layout

---

## Dependencies

- Supabase Auth configured (DONE)
- Supabase project accessible (DONE — `smjkbmkxweevqpvygabe`)
- Google OAuth provider configured in Supabase (DONE — needs redirect URL verification)

## Agent Review Notes

This spec was reviewed by three agents. The following changes were incorporated:

| Agent | Key Changes Made |
|-------|-----------------|
| **Data Modeller** | Added `ON CONFLICT` to trigger, role immutability trigger, backfill migration |
| **Frontend Engineer** | Added accessibility section (ARIA roles, keyboard nav, focus), UI states (loading/error/retry) |
| **Security Expert** | Fixed open redirect in callback, removed `/home` from public paths, added role immutability |

Deferred to implementation (low priority): font substitution (Inter → distinctive fonts), card entry animations, `role` column index.

---

## Risks

- **Google OAuth redirect URL:** May need to update Supabase dashboard if current config is wrong
- **Existing users without profiles:** If any users exist from before the trigger, they won't have profiles. Backfill migration handles this (see Database Design section).
- **Middleware performance:** Extra DB query per request. Acceptable at current scale.
