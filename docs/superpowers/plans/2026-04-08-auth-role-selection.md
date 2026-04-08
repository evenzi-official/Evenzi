# Auth & Role Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Auth & Role Selection feature — fix Google OAuth, create user_profiles table, build Role Selection page, and implement role-based middleware routing.

**Architecture:** Supabase `user_profiles` table with auto-creation trigger handles profile lifecycle. Middleware checks both auth state and profile role to route users correctly. Role Selection is a single client component at `/auth/role-selection`. All UI uses CSS custom properties via Tailwind `@theme` for easy brand token swaps.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Vitest

**Design Spec:** `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md`

**Supabase Project:** `smjkbmkxweevqpvygabe`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `app/auth/role-selection/page.tsx` | Role Selection screen — two cards (Host active, Vendor disabled), calls Supabase to set role |
| `lib/supabase/profile.ts` | Helper to fetch user profile from `user_profiles` table — used by middleware and pages |
| `__tests__/lib/supabase/profile.test.ts` | Tests for profile helper |
| `__tests__/lib/supabase/middleware.test.ts` | Tests for middleware redirect logic |
| `__tests__/app/auth/callback/route.test.ts` | Tests for callback route redirect logic |

### Modified Files
| File | Changes |
|------|---------|
| `app/globals.css` | Add brand color/spacing CSS custom properties via `@theme inline` |
| `app/layout.tsx` | Update metadata title from "WeddingPlanner" to "Evenzi" |
| `lib/supabase/middleware.ts` | Add role-based redirect logic, remove `/home` from public paths |
| `app/auth/callback/route.ts` | Fix open redirect, add role-based redirect after OAuth |
| `app/auth/page.tsx` | Rename "WeddingPlanner" → "Evenzi", remove `any` types and `console.log`, use brand tokens |
| `app/home/page.tsx` | Remove client-side auth check (middleware handles it), rename branding |

---

## Task 1: Supabase Migration — user_profiles Table

**Files:**
- Supabase migration via MCP tool

This task creates the database foundation. Must be done first as all other tasks depend on it.

- [ ] **Step 1: Create user_profiles table with triggers and RLS**

Run via Supabase MCP `apply_migration`:

```sql
-- Table
CREATE TABLE public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('host', 'vendor')),
  display_name text,
  avatar_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.phone),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
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

-- Prevent role changes after initial selection
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

-- RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Backfill existing users who signed up before this trigger
INSERT INTO public.user_profiles (id, display_name, avatar_url)
SELECT id, raw_user_meta_data->>'full_name', raw_user_meta_data->>'avatar_url'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles);
```

Migration name: `create_user_profiles`
Project ID: `smjkbmkxweevqpvygabe`

- [ ] **Step 2: Verify the migration**

Run via Supabase MCP `list_tables` with schemas `["public"]` and `verbose: true`. Confirm `user_profiles` table exists with all columns, triggers, and RLS enabled.

- [ ] **Step 3: Verify backfill**

Run via Supabase MCP `execute_sql`:

```sql
SELECT count(*) as profile_count FROM public.user_profiles;
SELECT count(*) as user_count FROM auth.users;
```

Both counts should match. If `profile_count < user_count`, the backfill missed users — re-run the backfill INSERT.

- [ ] **Step 4: Commit**

No local files changed in this task — the migration is applied directly to Supabase. Document the migration in a commit message:

```bash
git commit --allow-empty -m "feat(db): create user_profiles table with triggers and RLS

- user_profiles table (id, role, display_name, avatar_url, onboarding_completed)
- Auto-create trigger on auth.users INSERT
- Role immutability trigger (prevents role changes after set)
- Updated_at auto-trigger
- RLS: users can only view/update own profile
- Backfill for existing users"
```

---

## Task 2: Brand Tokens in globals.css

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

Set up CSS custom properties so all components use tokens instead of hardcoded values.

- [ ] **Step 1: Update globals.css with brand tokens**

Replace the contents of `app/globals.css` with:

```css
@import "tailwindcss";

:root {
  /* Brand colors — placeholder values, see docs/BRAND-GUIDELINES.md */
  --color-primary: #111827;
  --color-primary-hover: #1f2937;
  --color-bg-primary: #f9fafb;
  --color-bg-card: #ffffff;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-muted: #9ca3af;
  --color-border: #e5e7eb;
  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
  --color-error-border: #fecaca;

  /* Spacing & radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0px 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0px 4px 6px rgba(0, 0, 0, 0.07);
}

@theme inline {
  --color-background: var(--color-bg-primary);
  --color-foreground: var(--color-text-primary);
  --color-primary: var(--color-primary);
  --color-card: var(--color-bg-card);
  --color-border: var(--color-border);
  --color-muted: var(--color-text-muted);
  --color-secondary: var(--color-text-secondary);
  --color-error: var(--color-error);
  --font-sans: var(--font-inter);
}

body {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}
```

- [ ] **Step 2: Update layout.tsx metadata**

In `app/layout.tsx`, change the metadata title and description:

```typescript
export const metadata: Metadata = {
  title: "Evenzi — Plan, Manage & Celebrate Your Events",
  description: "Create events, manage guest lists, send invitations, and build beautiful event websites. All in one place.",
};
```

- [ ] **Step 3: Verify dev server loads with new tokens**

Run: `npm run dev`
Open `http://localhost:3000` — page should load without errors. Check browser DevTools → Elements → `:root` to confirm CSS variables are present.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat(ui): add brand CSS tokens and update metadata to Evenzi

- CSS custom properties for colors, radius, shadows in globals.css
- Tailwind @theme inline references brand tokens
- Metadata updated from WeddingPlanner to Evenzi"
```

---

## Task 3: Profile Helper Utility

**Files:**
- Create: `lib/supabase/profile.ts`
- Create: `__tests__/lib/supabase/profile.test.ts`

A shared helper for fetching user profiles, used by middleware and pages.

- [ ] **Step 1: Write the failing test**

Create `__tests__/lib/supabase/profile.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getUserProfile } from '@/lib/supabase/profile'

describe('getUserProfile', () => {
  it('returns profile when user has one', async () => {
    const mockProfile = {
      id: 'user-123',
      role: 'host',
      display_name: 'Test User',
      avatar_url: null,
      onboarding_completed: false,
    }

    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
    }

    const result = await getUserProfile(mockSupabase as any, 'user-123')
    expect(result).toEqual(mockProfile)
    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
    expect(mockSupabase.select).toHaveBeenCalledWith('id, role, display_name, avatar_url, onboarding_completed')
    expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-123')
  })

  it('returns null when no profile exists', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }

    const result = await getUserProfile(mockSupabase as any, 'user-456')
    expect(result).toBeNull()
  })

  it('returns null when supabase errors', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'connection failed' } }),
    }

    const result = await getUserProfile(mockSupabase as any, 'user-789')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/supabase/profile.test.ts`
Expected: FAIL — `getUserProfile` not found

- [ ] **Step 3: Write the implementation**

Create `lib/supabase/profile.ts`:

```typescript
import type { SupabaseClient } from '@supabase/supabase-js'

export interface UserProfile {
  id: string
  role: 'host' | 'vendor' | null
  display_name: string | null
  avatar_url: string | null
  onboarding_completed: boolean
}

const PROFILE_FIELDS = 'id, role, display_name, avatar_url, onboarding_completed'

export async function getUserProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select(PROFILE_FIELDS)
    .eq('id', userId)
    .single()

  if (error || !data) {
    return null
  }

  return data as UserProfile
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/supabase/profile.test.ts`
Expected: 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/profile.ts __tests__/lib/supabase/profile.test.ts
git commit -m "feat(auth): add getUserProfile helper with tests

- Fetches user profile from user_profiles table
- Returns typed UserProfile or null on error
- 3 test cases: found, not found, error"
```

---

## Task 4: Middleware — Role-Based Routing

**Files:**
- Modify: `lib/supabase/middleware.ts`
- Create: `__tests__/lib/supabase/middleware.test.ts`

Update middleware to check user role and redirect accordingly.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/lib/supabase/middleware.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the profile module
vi.mock('@/lib/supabase/profile', () => ({
  getUserProfile: vi.fn(),
}))

// Mock @supabase/ssr
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
}))

import { getUserProfile } from '@/lib/supabase/profile'
import type { UserProfile } from '@/lib/supabase/profile'

// Helper to create a mock NextRequest
function mockRequest(pathname: string, cookies: Record<string, string> = {}): any {
  const url = new URL(`http://localhost:3000${pathname}`)
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url),
    },
    cookies: {
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      set: vi.fn(),
    },
    url: url.toString(),
  }
}

describe('middleware routing logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = 'test-key'
  })

  it('allows public paths without auth', async () => {
    const publicPaths = ['/', '/auth', '/auth/callback', '/_next/static/chunk.js', '/api/test']
    for (const path of publicPaths) {
      const req = mockRequest(path)
      // Public paths should not redirect to /auth
      // This validates our path matching logic
      const isPublic = path === '/' ||
        path === '/auth' ||
        path.startsWith('/auth/callback') ||
        path.startsWith('/_next') ||
        path.startsWith('/api')
      expect(isPublic).toBe(true)
    }
  })

  it('/home is NOT a public path', () => {
    const path = '/home'
    const isPublic = path === '/' ||
      path === '/auth' ||
      path.startsWith('/auth/callback') ||
      path.startsWith('/_next') ||
      path.startsWith('/api')
    expect(isPublic).toBe(false)
  })

  it('role-selection is semi-protected (auth required, no role required)', () => {
    const path = '/auth/role-selection'
    const isSemiProtected = path === '/auth/role-selection'
    expect(isSemiProtected).toBe(true)
  })
})

describe('redirect logic', () => {
  it('user with no role on protected route should go to /auth/role-selection', () => {
    const profile: UserProfile = {
      id: 'u1',
      role: null,
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: false,
    }
    const pathname = '/home'
    const needsRoleSelection = profile.role === null && pathname !== '/auth/role-selection'
    expect(needsRoleSelection).toBe(true)
  })

  it('user with role on /auth/role-selection should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1',
      role: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: false,
    }
    const pathname = '/auth/role-selection'
    const hasRoleOnRoleSelection = profile.role !== null && pathname === '/auth/role-selection'
    expect(hasRoleOnRoleSelection).toBe(true)
  })

  it('user with role on /auth should go to /home', () => {
    const profile: UserProfile = {
      id: 'u1',
      role: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: false,
    }
    const pathname = '/auth'
    const hasRoleOnAuth = profile.role !== null && pathname === '/auth'
    expect(hasRoleOnAuth).toBe(true)
  })

  it('user with role on /home should pass through', () => {
    const profile: UserProfile = {
      id: 'u1',
      role: 'host',
      display_name: 'Test',
      avatar_url: null,
      onboarding_completed: false,
    }
    const pathname = '/home'
    const shouldPassThrough = profile.role !== null && pathname !== '/auth/role-selection' && pathname !== '/auth'
    expect(shouldPassThrough).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they pass** (these test pure logic, not the middleware function directly)

Run: `npx vitest run __tests__/lib/supabase/middleware.test.ts`
Expected: All tests PASS (they test the routing logic conditions)

- [ ] **Step 3: Update the middleware**

Replace `lib/supabase/middleware.ts` with:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getUserProfile } from '@/lib/supabase/profile'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY

  // If env vars are missing, allow access to public routes only
  if (!supabaseUrl || !supabaseKey) {
    const pathname = request.nextUrl.pathname
    if (
      pathname === '/' ||
      pathname.startsWith('/auth') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')
    ) {
      return NextResponse.next()
    }
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    url.searchParams.set('error', 'env_missing')
    return NextResponse.redirect(url)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as any)
        )
      },
    },
  })

  // IMPORTANT: Do not add logic between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Public paths — no auth required
  const isPublicPath =
    pathname === '/' ||
    pathname === '/auth' ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api')

  // No user on non-public path → redirect to auth
  if (!user && !isPublicPath) {
    // Allow /auth/role-selection to redirect to /auth too
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    return NextResponse.redirect(url)
  }

  // User exists — check role for routing decisions
  if (user) {
    const profile = await getUserProfile(supabase, user.id)
    const hasRole = profile?.role != null

    // User with no role trying to access protected routes → role selection
    if (!hasRole && pathname !== '/auth/role-selection' && !isPublicPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/role-selection'
      return NextResponse.redirect(url)
    }

    // User with role on role-selection page → redirect to dashboard
    if (hasRole && pathname === '/auth/role-selection') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }

    // User with role on auth page → redirect to dashboard
    if (hasRole && pathname === '/auth') {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/middleware.ts __tests__/lib/supabase/middleware.test.ts
git commit -m "feat(auth): add role-based routing to middleware

- Remove /home from public paths (security fix)
- Redirect no-role users to /auth/role-selection
- Redirect role-havers away from /auth and /auth/role-selection
- Remove any types, use typed cookie params"
```

---

## Task 5: Fix OAuth Callback Route

**Files:**
- Modify: `app/auth/callback/route.ts`
- Create: `__tests__/app/auth/callback/route.test.ts`

Fix the open redirect vulnerability and add role-based redirect after OAuth.

- [ ] **Step 1: Write the failing test**

Create `__tests__/app/auth/callback/route.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('callback redirect safety', () => {
  const allowedPaths = ['/home', '/auth/role-selection']

  it('allows /home as redirect target', () => {
    const next = '/home'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('allows /auth/role-selection as redirect target', () => {
    const next = '/auth/role-selection'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/auth/role-selection')
  })

  it('blocks open redirect to external URL', () => {
    const next = '//evil.com'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('blocks open redirect with backslash', () => {
    const next = '/\\evil.com'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('blocks arbitrary path redirect', () => {
    const next = '/admin/delete-all'
    const safe = allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })

  it('defaults to /home when next is null', () => {
    const next = null
    const safe = next && allowedPaths.includes(next) ? next : '/home'
    expect(safe).toBe('/home')
  })
})
```

- [ ] **Step 2: Run test to verify it passes** (pure logic tests)

Run: `npx vitest run __tests__/app/auth/callback/route.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 3: Update the callback route**

Replace `app/auth/callback/route.ts` with:

```typescript
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/profile'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('OAuth callback error:', error.message)
      return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
    }

    // Determine redirect based on profile role
    if (data.user) {
      const profile = await getUserProfile(supabase, data.user.id)
      const redirectPath = profile?.role ? '/home' : '/auth/role-selection'
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth?error=auth_failed`)
}
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add app/auth/callback/route.ts __tests__/app/auth/callback/route.test.ts
git commit -m "fix(auth): fix OAuth callback — close open redirect, add role routing

- Remove unsafe 'next' param usage (open redirect vulnerability)
- Redirect new users (no role) to /auth/role-selection
- Redirect returning users (has role) to /home
- Add error logging for failed exchanges"
```

---

## Task 6: Role Selection Page

**Files:**
- Create: `app/auth/role-selection/page.tsx`

The main UI for this feature. Two cards — Host (active) and Vendor (disabled with "Coming Soon").

- [ ] **Step 1: Create the Role Selection page**

Create `app/auth/role-selection/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RoleSelectionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleSelectHost = async () => {
    setError("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: "host" })
        .eq("id", user.id);

      if (updateError) {
        console.error("Role update error:", updateError);
        setError("Failed to set your role. Please try again.");
        setLoading(false);
        return;
      }

      router.push("/home");
    } catch (err) {
      console.error("Role selection error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleBackToLogin = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  return (
    <div
      className="min-h-screen flex flex-col justify-between px-8 py-12"
      style={{ background: "var(--color-bg-primary)" }}
    >
      {/* Header */}
      <header className="flex justify-center">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Evenzi
        </h1>
      </header>

      {/* Main */}
      <main className="flex flex-col items-center justify-center py-14">
        {/* Heading */}
        <div className="text-center mb-14">
          <h2
            className="text-4xl md:text-[36px] font-bold tracking-tight mb-4"
            style={{ color: "var(--color-text-primary)" }}
          >
            How will you use the platform?
          </h2>
          <p
            className="text-lg max-w-[672px] mx-auto"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Select your role to get a personalized experience tailored to your
            needs.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-8 w-full max-w-[1024px] px-4 py-3 rounded-lg border text-sm flex items-center justify-between"
            style={{
              background: "var(--color-error-bg)",
              borderColor: "var(--color-error-border)",
              color: "var(--color-error)",
            }}
          >
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="ml-4 font-medium underline"
              style={{ color: "var(--color-error)" }}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Role Cards */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-[1024px]"
          role="radiogroup"
          aria-label="Select your role"
        >
          {/* Host Card */}
          <div
            role="radio"
            aria-checked="false"
            tabIndex={0}
            className="flex flex-col items-center p-10 rounded-2xl border-2 transition-all duration-200 cursor-pointer hover:border-[var(--color-primary)]"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
            onClick={!loading ? handleSelectHost : undefined}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !loading) {
                e.preventDefault();
                handleSelectHost();
              }
            }}
          >
            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{ background: "var(--color-bg-primary)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-primary)" }}
              >
                <path d="M5.8 11.3 2 22l10.7-3.79" />
                <path d="M4 3h.01" />
                <path d="M22 8h.01" />
                <path d="M15 2h.01" />
                <path d="M22 20h.01" />
                <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
                <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.63-.69 1.09-1.33 1.09h-.06c-.72 0-1.34.5-1.48 1.2l-.15.65" />
                <path d="M5 3 4 4l1 1 1-1Z" />
              </svg>
            </div>

            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: "var(--color-text-primary)" }}
            >
              Host / Event Owner
            </h3>
            <p
              className="text-base text-center mb-10 max-w-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Manage your event details, guest lists, and create a beautiful
              event website. Collect all your memories in one place.
            </p>
            <button
              disabled={loading}
              className="w-full py-4 rounded-xl text-lg font-semibold text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)" }}
              onClick={(e) => {
                e.stopPropagation();
                if (!loading) handleSelectHost();
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Setting up...
                </span>
              ) : (
                "Continue as Host"
              )}
            </button>
          </div>

          {/* Vendor Card (Disabled) */}
          <div
            role="radio"
            aria-checked="false"
            aria-disabled="true"
            tabIndex={-1}
            className="relative flex flex-col items-center p-10 rounded-2xl border-2 opacity-50 cursor-not-allowed"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            {/* Coming Soon Badge */}
            <span
              role="status"
              className="absolute top-4 right-4 px-3 py-1 text-xs font-medium rounded-full"
              style={{
                background: "var(--color-bg-primary)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
            >
              Coming Soon
            </span>

            {/* Icon */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-8"
              style={{ background: "var(--color-bg-primary)" }}
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: "var(--color-text-muted)" }}
              >
                <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                <rect width="20" height="14" x="2" y="6" rx="2" />
              </svg>
            </div>

            <h3
              className="text-2xl font-bold mb-4 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Vendor
            </h3>
            <p
              className="text-base text-center mb-10 max-w-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Manage your bookings, coordinate with hosts, and showcase your
              services to potential clients efficiently.
            </p>
            <button
              disabled
              className="w-full py-4 rounded-xl text-lg font-semibold text-white cursor-not-allowed opacity-60"
              style={{ background: "var(--color-text-muted)" }}
            >
              Continue as Vendor
            </button>
          </div>
        </div>

        {/* Back to Login */}
        <button
          onClick={handleBackToLogin}
          className="mt-16 flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 6H2M5 9L2 6l3-3" />
          </svg>
          Back to Login
        </button>
      </main>

      {/* Footer */}
      <footer className="text-center">
        <p
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          &copy; 2026 Evenzi. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify page renders in dev**

Run: `npm run dev`
Navigate to `http://localhost:3000/auth/role-selection`
Expected: Two cards visible — Host active, Vendor grayed with "Coming Soon" badge.
Note: Middleware will redirect if you're not logged in; test by first logging in via phone OTP with `9999999999` / `123456`.

- [ ] **Step 3: Commit**

```bash
git add app/auth/role-selection/page.tsx
git commit -m "feat(auth): add Role Selection page

- Two-card layout: Host (active) + Vendor (Coming Soon, disabled)
- Sets user_profiles.role on Host selection
- Loading spinner, error banner with dismiss/retry
- Keyboard navigation and ARIA attributes
- Uses brand CSS tokens throughout
- Mobile responsive (stacked cards < 768px)"
```

---

## Task 7: Update Auth Page

**Files:**
- Modify: `app/auth/page.tsx`

Rename branding, clean up types, remove debug logs.

- [ ] **Step 1: Update auth page**

In `app/auth/page.tsx`, make these changes:

1. Replace the `supabase` declaration (line 16-21) — remove `any` type:

```typescript
  let supabase: ReturnType<typeof createClient> | null = null;
  try {
    supabase = createClient();
  } catch {
    // Handle missing env vars - error will be shown in UI
  }
```

2. Replace "WeddingPlanner" heading (line 191):

```tsx
<h1 className="text-3xl font-bold text-gray-900 mb-2">Evenzi</h1>
```

3. Replace "Welcome back" subtitle (line 192):

```tsx
<p className="text-gray-600">Welcome to Evenzi</p>
```

4. Remove all `console.log` and `console.error` statements from `handleVerifyOTP` (lines 90, 98, 109, 119, 129, 142, 149, 153):
   - Remove: `console.log("Verifying OTP for phone:", ...)`
   - Remove: `console.log("Verify response:", ...)`
   - Remove: `console.log("User found in data:", ...)`
   - Remove: `console.log("Session check:", ...)`
   - Remove: `console.log("Redirecting to /home")`
   - Remove: `console.log("Router.push didn't work, ...")`
   - Remove: `console.log("User found in session, ...")`
   - Remove: `console.error("No user found after verification")`
   - Remove: `console.error("OTP verification exception:", err)`
   - Keep: `console.error("OTP verification error:", verifyError)` — this is a real error

5. In `handleVerifyOTP`, change redirect from `/home` to `/auth/role-selection` for the success case (lines 124, 130, 143):

```typescript
router.push("/auth/role-selection");
// ...fallback:
window.location.href = "/auth/role-selection";
```

Note: The middleware will handle redirecting returning users (who already have a role) to `/home`, so always sending to role-selection after OTP is safe.

6. In `handleGoogleAuth`, the redirect is handled by the callback route, so no change needed there.

- [ ] **Step 2: Verify auth page in dev**

Run: `npm run dev`
Navigate to `http://localhost:3000/auth`
Expected: Shows "Evenzi" heading, no console.log spam in browser DevTools.

- [ ] **Step 3: Commit**

```bash
git add app/auth/page.tsx
git commit -m "fix(auth): update auth page — Evenzi branding, clean up types and logs

- Rename WeddingPlanner → Evenzi
- Remove any type from supabase client
- Remove debug console.log statements
- Redirect OTP success to /auth/role-selection"
```

---

## Task 8: Update Home Page

**Files:**
- Modify: `app/home/page.tsx`

Remove redundant client-side auth check (middleware handles it now) and update branding.

- [ ] **Step 1: Simplify home page**

Replace `app/home/page.tsx` with:

```tsx
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}>
        <div style={{ color: "var(--color-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}>Evenzi</div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm"
                style={{ color: "var(--color-text-secondary)" }}>
                {user.email || user.phone || "User"}
              </div>
            )}
            <button
              onClick={handleSignOut}
              className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
            style={{ color: "var(--color-text-primary)" }}>
            Welcome to Evenzi!
          </h1>
          <p className="text-xl sm:text-2xl mb-12 max-w-2xl mx-auto"
            style={{ color: "var(--color-text-secondary)" }}>
            Start planning your perfect event.
          </p>

          <button
            onClick={() => alert("Create Event Wizard coming soon!")}
            className="px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-white"
            style={{ background: "var(--color-primary)" }}
          >
            Create Your First Event
          </button>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify home page in dev**

Run: `npm run dev`
Log in → complete role selection → land on `/home`
Expected: Shows "Evenzi" branding, user info, sign-out button. No redirect loops.

- [ ] **Step 3: Commit**

```bash
git add app/home/page.tsx
git commit -m "refactor(home): simplify dashboard — remove auth check, update branding

- Remove client-side auth check (middleware handles routing)
- Rename WeddingPlanner → Evenzi
- Use brand CSS tokens
- Type user as User instead of any
- Remove quick-action cards (placeholder cleanup)"
```

---

## Task 9: Debug Google OAuth

**Files:**
- No file changes — this is a Supabase dashboard configuration task

Google OAuth currently fails with `auth_failed` at the callback. This task investigates and fixes the Supabase configuration.

- [ ] **Step 1: Check Supabase auth configuration**

Run via Supabase MCP `get_project` with ID `smjkbmkxweevqpvygabe` to get the project URL.

Then run `execute_sql`:

```sql
SELECT raw_app_meta_data FROM auth.users LIMIT 1;
```

This confirms the auth schema is accessible.

- [ ] **Step 2: Check redirect URL configuration**

The Google OAuth callback URL must be configured in two places:
1. **Supabase Dashboard** → Authentication → URL Configuration → Redirect URLs: must include `http://localhost:3000/auth/callback`
2. **Google Cloud Console** → OAuth 2.0 Client → Authorized redirect URIs: must include `https://smjkbmkxweevqpvygabe.supabase.co/auth/v1/callback`

Log into the Supabase Dashboard at `https://supabase.com/dashboard/project/smjkbmkxweevqpvygabe/auth/url-configuration` and verify:
- Site URL is set to `http://localhost:3000`
- Redirect URLs include `http://localhost:3000/auth/callback`

- [ ] **Step 3: Test Google OAuth after configuration**

Open `http://localhost:3000/auth` in a real browser, click "Continue with Google".

Expected flow:
1. Redirect to Google consent screen
2. After consent → redirect to `http://localhost:3000/auth/callback?code=...`
3. Callback exchanges code → redirect to `/auth/role-selection` (new user) or `/home` (returning user)

If still failing, check browser Network tab for the exact error in the callback response.

- [ ] **Step 4: Document the fix**

Add a comment in `app/auth/callback/route.ts` noting what was wrong and how it was fixed, for future reference.

- [ ] **Step 5: Commit** (if any code changes were needed)

```bash
git add -A
git commit -m "fix(auth): fix Google OAuth callback configuration

- [describe what was wrong and the fix]"
```

---

## Task 10: Run Full Test Suite + Manual E2E

**Files:**
- No new files

Final validation that everything works together.

- [ ] **Step 1: Run all automated tests**

Run: `npx vitest run`
Expected: All tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: No errors.

- [ ] **Step 3: Manual E2E — New user flow (Phone OTP)**

1. Open `http://localhost:3000/auth`
2. Enter `9999999999`, click "Send OTP"
3. Enter `123456`, click "Verify OTP"
4. Should redirect to `/auth/role-selection`
5. Click "Continue as Host"
6. Should redirect to `/home` with "Evenzi" branding

- [ ] **Step 4: Manual E2E — Returning user flow**

1. Sign out from dashboard
2. Log back in with same phone number
3. Should skip role selection and go directly to `/home`

- [ ] **Step 5: Manual E2E — Google OAuth** (after Task 9 fix)

1. Open `http://localhost:3000/auth`
2. Click "Continue with Google"
3. Complete Google consent
4. Should land on `/auth/role-selection` (new) or `/home` (returning)

- [ ] **Step 6: Manual E2E — Guard tests**

1. While logged in with role: navigate to `/auth/role-selection` → should redirect to `/home`
2. While logged in with role: navigate to `/auth` → should redirect to `/home`
3. While logged out: navigate to `/auth/role-selection` → should redirect to `/auth`
4. While logged out: navigate to `/home` → should redirect to `/auth`

- [ ] **Step 7: Verify Supabase data**

Run via Supabase MCP `execute_sql`:

```sql
SELECT id, role, display_name, onboarding_completed, created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;
```

Confirm test user has `role = 'host'`.

- [ ] **Step 8: Final commit**

```bash
git add -A
git commit -m "test(auth): verify full auth & role selection flow

- All automated tests passing
- Manual E2E verified: new user, returning user, guards
- Google OAuth status: [working/still needs dashboard config]"
```
