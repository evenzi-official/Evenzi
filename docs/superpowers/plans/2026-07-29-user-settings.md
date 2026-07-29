# User Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every logged-in user one real Settings entry point — a Settings icon in the shared nav (replacing the inconsistent per-page logout icon) leading to a `/settings` page whose four sections (Profile, Security, Notifications, Account) actually read and write the already-live `user_profiles`/`user_preferences` tables, instead of the current static, non-functional shell.

**Architecture:** `components/layout/FloatingNav.tsx` is the single shared nav component; Home's two hand-rolled duplicate navs are deleted and replaced with it. `/settings` stays a server component (`app/settings/page.tsx`) that fetches the user's profile/preferences/identities once and passes them as props to four sibling client components, one per design section, each independently wired to a small REST-ish API route under `/api/settings/*`. All new API routes follow the exact validate→auth→zod→Supabase→JSON-response shape already used by `app/api/events/[id]/general-settings/route.ts`.

**Tech Stack:** Next.js 14 App Router, Supabase (`@supabase/ssr`), Zod, `@aws-sdk/client-s3` (R2), existing shell CSS/JSX primitives (`FormGroup`, `FormInput`, `ToggleSwitch`).

## Global Constraints

- No inline styles beyond what already exists in the files being edited — all new markup uses classes already defined in `designs/shared/shell.css` and `designs/pages/settings/settings.css` (verified live in both files during planning; no new CSS is written by this plan).
- Every new API route must check `supabase.auth.getUser()` and return 401 before touching data — matches every existing `/api/events/**` route.
- `user_profiles.phone` and `.email` are read-only mirrors (per `docs/data-model/DATA-MODEL.md` D3) — never write to them from the client.
- 2FA is a UI-only placeholder this pass (spec §4.2) — the toggle renders disabled with "Coming soon," no Supabase MFA calls are made.
- Danger Zone / Delete Account (spec §4.5) is out of scope for every task in this plan.
- Full spec: `docs/superpowers/specs/2026-07-29-user-settings-design.md`.

## Plan deviation from spec (found during planning, correct as implemented here)

The spec's Security section (§4.2) frames the password-form branch as keyed on `user_profiles.auth_provider = 'email'`. Live data shows **no user in this system has `auth_provider = 'email'`** — every account is `'phone'` or `'google'` (verified: 1 phone, 5 google, 0 email, against project `smjkbmkxweevqpvygabe`), and `auth_provider` records the *original* signup method — it does not update if a user later adds a password. The technically correct signal for "does this user currently have a password" is Supabase Auth's own `user.identities` array (each entry has a `.provider` field; a password exists once an `'email'` identity is linked). Task 5 implements the check against `identities`, not the `user_profiles` column. This is a refinement, not a scope change — the two branches described in the spec (Change password vs. Set a password) are unchanged.

---

## File Structure

- `lib/utils.ts` — **modify**: add `avatarInitial()`, extracted from `EventsGrid.tsx`'s inline logic so `FloatingNav`, `EventsGrid`, and `app/settings/page.tsx` share one implementation.
- `components/layout/FloatingNav.tsx` — **modify**: add Settings icon, `showCreateEvent` prop, real `userInitial` fallback.
- `app/home/EventsGrid.tsx` — **modify**: delete the hand-rolled `<nav>` block, use `<FloatingNav />`, delete `handleSignOut`.
- `app/home/loading.tsx` — **modify**: delete the hand-rolled skeleton `<nav>` block, use `<FloatingNav />` (it's a Server Component rendering a Client Component child — allowed in Next.js App Router).
- `lib/validations/settings.ts` — **create**: Zod schemas for the profile-patch and notifications-patch payloads.
- `app/api/settings/profile/route.ts` — **create**: `PATCH` — updates `user_profiles.display_name`.
- `app/api/settings/notifications/route.ts` — **create**: `PATCH` — updates `user_preferences` booleans.
- `app/api/settings/avatar/route.ts` — **create**: `POST` — uploads to R2 via `avatarKey()`, writes `user_profiles.avatar_url`.
- `app/settings/SecuritySection.tsx` — **create**: client component, Security section.
- `app/settings/NotificationsSection.tsx` — **create**: client component, Notification preferences section.
- `app/settings/page.tsx` — **modify**: rewrite as a thin server shell — fetch profile/preferences/identities, render the four section components.
- `app/settings/ProfileSection.tsx` — **create**: client component, Profile information section.
- `app/settings/AccountSection.tsx` — **create**: client component, Account (sign-out) section.
- `app/globals.css` — **modify**: add the missing `@import "../designs/pages/settings/settings.css";` (currently not imported — confirmed by grep during planning; without this, none of the settings-page-specific layout CSS reaches the app).

---

### Task 1: FloatingNav — Settings icon, Create-event slot, shared avatar initial

**Files:**
- Modify: `lib/utils.ts`
- Modify: `components/layout/FloatingNav.tsx`

**Interfaces:**
- Produces: `avatarInitial(display: string): string` from `lib/utils.ts` — used by Tasks 1, 2, 7.
- Produces: `<FloatingNav eventId? notificationCount? userInitial? showCreateEvent? />` — `showCreateEvent` and the Settings icon are new; everything else is unchanged.

- [ ] **Step 1: Add the shared avatar-initial helper**

Add to `lib/utils.ts`:

```typescript
/** First letter of a display name/email/phone, uppercased. Falls back to "U". */
export function avatarInitial(display: string): string {
  return (display.replace(/[^a-zA-Z]/g, "")[0] ?? "U").toUpperCase()
}
```

- [ ] **Step 2: Update FloatingNav to add the Settings icon and Create-event slot**

Replace the full contents of `components/layout/FloatingNav.tsx` with:

```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

interface FloatingNavProps {
  eventId?: string
  notificationCount?: number
  userInitial?: string
  /** Shows the "Create event" button before the notification bell. Home only. */
  showCreateEvent?: boolean
}

export function FloatingNav({
  eventId,
  notificationCount = 0,
  userInitial = 'A',
  showCreateEvent = false,
}: FloatingNavProps) {
  const pathname = usePathname()
  const isWebsite = pathname.includes('/website')
  const isDashboard = !isWebsite
  const isSettings = pathname === '/settings'

  return (
    <nav className="floating-nav" aria-label="Main">
      <div className="floating-nav-inner">
        <Link href="/home" className="fn-logo-link" aria-label="Evenzi home">
          <span className="fn-logo">EVENZI</span>
          <span className="hidden sm:flex flex-col leading-tight border-l border-brand/30 pl-3" aria-hidden="true">
            <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">CAPTURE</span>
            <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">SHARE · CHERISH</span>
          </span>
        </Link>

        {eventId && (
          <div className="nav-tabs inline-flex" role="tablist" aria-label="Primary view">
            <Link
              href={`/events/${eventId}`}
              className={`nav-tab${isDashboard ? ' is-active' : ''}`}
              aria-label="Dashboard"
              aria-current={isDashboard ? 'page' : undefined}
            >
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">dashboard</span>
              <span className="nav-tab-label">Dashboard</span>
            </Link>
            <Link
              href={`/events/${eventId}/website`}
              className={`nav-tab${isWebsite ? ' is-active' : ''}`}
              aria-label="Website"
              aria-current={isWebsite ? 'page' : undefined}
            >
              <span aria-hidden="true" className="material-symbols-outlined">language</span>
              <span className="nav-tab-label">Website</span>
            </Link>
          </div>
        )}

        {!eventId && <span aria-hidden="true" />}

        <div className="fn-actions">
          {showCreateEvent && (
            <Link href="/events/create" className="dash-create-btn" aria-label="Create new event">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              <span className="dash-create-label">Create event</span>
            </Link>
          )}
          <button
            aria-label={notificationCount > 0 ? `Notifications, ${notificationCount} unread` : 'Notifications'}
            className="fn-icon-btn"
          >
            <span aria-hidden="true" className="material-symbols-outlined">notifications</span>
            {notificationCount > 0 && <span aria-hidden="true" className="fn-dot" />}
          </button>
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            aria-current={isSettings ? 'page' : undefined}
            className="fn-icon-btn"
          >
            <span aria-hidden="true" className={`material-symbols-outlined${isSettings ? ' icon-fill' : ''}`}>settings</span>
          </Link>
          <span className="fn-divider hidden sm:inline-block" aria-hidden="true" />
          <button aria-label="Account menu" className="fn-avatar">{userInitial}</button>
        </div>
      </div>
    </nav>
  )
}
```

Note: the original had `<span aria-hidden="true" />` unconditionally as a center spacer; it's now only rendered when there's no `eventId` tab group, so the tab group and the spacer never both occupy that grid slot (matches the original's single-spacer-or-tabs layout — the `floating-nav-inner` grid expects exactly one middle element).

- [ ] **Step 3: Verify existing call sites still compile**

Run: `grep -rn "FloatingNav" app components --include="*.tsx" | grep -v "FloatingNav.tsx"`
Expected: every call site (currently `app/settings/page.tsx` and any `app/events/[id]/*` pages) either passes no new props or only the existing ones — none should break, since `showCreateEvent` defaults to `false` and the Settings icon addition is purely additive.

- [ ] **Step 4: Commit**

```bash
git add lib/utils.ts components/layout/FloatingNav.tsx
git commit -m "feat(settings): add Settings icon + Create-event slot to shared FloatingNav"
```

---

### Task 2: Migrate Home's nav to the shared FloatingNav

**Files:**
- Modify: `app/home/EventsGrid.tsx`
- Modify: `app/home/loading.tsx`

**Interfaces:**
- Consumes: `<FloatingNav showCreateEvent userInitial={...} />` from Task 1; `avatarInitial()` from Task 1.

- [ ] **Step 1: Replace EventsGrid's hand-rolled nav**

In `app/home/EventsGrid.tsx`, replace the import block (lines 1–9) with:

```tsx
"use client"

import Link from "next/link"
import { useState } from "react"
import type { EventListItem } from "@/lib/types/events"
import { ScrollProgress } from "@/components/layout/ScrollProgress"
import { FloatingNav } from "@/components/layout/FloatingNav"
import { avatarInitial } from "@/lib/utils"
```

(Removes `useRouter`, `createClient` — no longer needed once sign-out moves off this page.)

Then in the component body, remove the `handleSignOut` function entirely (the `useRouter`/`createClient`/`handleSignOut` block, originally around lines 288–297 depending on final line numbers after the import change) and remove the `const supabase = createClient()` line alongside it.

Replace the `<nav className="floating-nav" aria-label="Main">...</nav>` block (originally lines 333–372) with:

```tsx
      <FloatingNav showCreateEvent userInitial={avatarLetter} />
```

Keep the existing `avatarLetter` computation line as-is (`const avatarLetter = avatarInitial(userDisplay)` — update this one line to call the new shared helper instead of the inline regex, i.e. replace:
```tsx
const avatarLetter = (userDisplay.replace(/[^a-zA-Z]/g, "")[0] ?? "U").toUpperCase()
```
with:
```tsx
const avatarLetter = avatarInitial(userDisplay)
```
).

- [ ] **Step 2: Replace loading.tsx's hand-rolled skeleton nav**

In `app/home/loading.tsx`, add the import at the top (after the existing `import Link from "next/link"`):

```tsx
import { FloatingNav } from "@/components/layout/FloatingNav"
```

Replace the `<nav className="floating-nav" aria-label="Main">...</nav>` block (lines 71–95) with:

```tsx
      <FloatingNav showCreateEvent />
```

(No `userInitial` yet known during loading — the component's own `'A'` default renders, matching the previous skeleton's generic placeholder circle closely enough; this is a loading state, not a place requiring the real initial.)

- [ ] **Step 3: Verify no leftover unused imports or dead code**

Run: `grep -n "useRouter\|createClient\|handleSignOut" app/home/EventsGrid.tsx`
Expected: no matches — all three were only used for sign-out, which is now gone from this file.

Run: `npx tsc --noEmit`
Expected: no new type errors introduced by this task (pre-existing unrelated errors, if any, are not this task's concern).

- [ ] **Step 4: Commit**

```bash
git add app/home/EventsGrid.tsx app/home/loading.tsx
git commit -m "refactor(home): migrate to shared FloatingNav, drop duplicate nav + logout"
```

---

### Task 3: Validation schemas + Profile & Notifications API routes

**Files:**
- Create: `lib/validations/settings.ts`
- Create: `app/api/settings/profile/route.ts`
- Create: `app/api/settings/notifications/route.ts`

**Interfaces:**
- Produces: `updateProfileSchema` (Zod), `updateNotificationsSchema` (Zod) from `lib/validations/settings.ts`.
- Produces: `PATCH /api/settings/profile` body `{ display_name: string }` → `{ success: true }` or `{ error, details? }`.
- Produces: `PATCH /api/settings/notifications` body `{ email_alerts?: boolean, push_notifications?: boolean, sms_alerts?: boolean }` → `{ success: true }` or `{ error, details? }`.

- [ ] **Step 1: Write the validation schemas**

Create `lib/validations/settings.ts`:

```typescript
import { z } from 'zod'

export const updateProfileSchema = z.object({
  display_name: z.string().trim().min(1, 'Name is required').max(100),
}).strict()

export const updateNotificationsSchema = z.object({
  email_alerts:       z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  sms_alerts:         z.boolean().optional(),
}).strict()
```

- [ ] **Step 2: Write the profile PATCH route**

Create `app/api/settings/profile/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateProfileSchema } from '@/lib/validations/settings'

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: parsed.data.display_name })
      .eq('id', user.id)

    if (error) {
      console.error('PATCH /api/settings/profile failed:', error)
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write the notifications PATCH route**

Create `app/api/settings/notifications/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { updateNotificationsSchema } from '@/lib/validations/settings'

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = updateNotificationsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { error } = await supabase
      .from('user_preferences')
      .update(parsed.data)
      .eq('user_id', user.id)

    if (error) {
      console.error('PATCH /api/settings/notifications failed:', error)
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Verify the routes compile and reject unauthenticated requests**

Run: `npx tsc --noEmit`
Expected: no type errors in the three new files.

Run (with dev server running on :3000): `curl -s -X PATCH http://localhost:3000/api/settings/profile -H "Content-Type: application/json" -d '{"display_name":"Test"}'`
Expected: `{"error":"Unauthorized"}` with a 401 (no session cookie sent) — confirms the auth gate works before any DB write is attempted.

- [ ] **Step 5: Commit**

```bash
git add lib/validations/settings.ts app/api/settings/profile/route.ts app/api/settings/notifications/route.ts
git commit -m "feat(settings): add profile + notifications PATCH API routes"
```

---

### Task 4: Avatar upload API route

**Files:**
- Create: `app/api/settings/avatar/route.ts`

**Interfaces:**
- Consumes: `avatarKey(userId, uuid, ext)` from `lib/storage/keys.ts`; `putObject`, `getPublicUrl`, `R2_BUCKET_PUBLIC` from `lib/storage/r2.ts`.
- Produces: `POST /api/settings/avatar` multipart form (`file` field) → `{ url: string }` or `{ error }`.

- [ ] **Step 1: Write the avatar upload route**

Create `app/api/settings/avatar/route.ts`, mirroring `app/api/events/cover/route.ts`'s validated-upload pattern but using the canonical `avatarKey()` helper:

```typescript
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { putObject, getPublicUrl, R2_BUCKET_PUBLIC } from '@/lib/storage/r2'
import { avatarKey } from '@/lib/storage/keys'

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file field is required' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF images are allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 })
  }

  const ext = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1]
  const key = avatarKey(user.id, randomUUID(), ext)

  const arrayBuffer = await file.arrayBuffer()
  const body = Buffer.from(arrayBuffer)

  try {
    await putObject({ bucket: R2_BUCKET_PUBLIC, key, body, contentType: file.type })
  } catch (err) {
    console.error('R2 avatar upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const publicUrl = getPublicUrl(key)

  const { error: dbError } = await supabase
    .from('user_profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (dbError) {
    console.error('avatar_url update failed:', dbError)
    return NextResponse.json({ error: 'Upload succeeded but saving the URL failed' }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl }, { status: 200 })
}
```

- [ ] **Step 2: Verify it compiles and rejects unauthenticated requests**

Run: `npx tsc --noEmit`
Expected: no type errors.

Run (dev server on :3000): `curl -s -X POST http://localhost:3000/api/settings/avatar`
Expected: `{"error":"Unauthorized"}` with a 401.

- [ ] **Step 3: Commit**

```bash
git add app/api/settings/avatar/route.ts
git commit -m "feat(settings): add avatar upload API route"
```

---

### Task 5: Security section (conditional password form + 2FA placeholder)

**Files:**
- Create: `app/settings/SecuritySection.tsx`

**Interfaces:**
- Consumes: `hasPassword: boolean` prop (computed in `page.tsx`, Task 7, from `user.identities`).
- Produces: `SecuritySection` component used by `page.tsx`.

- [ ] **Step 1: Write the Security section**

Create `app/settings/SecuritySection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  hasPassword: boolean
}

export function SecuritySection({ hasPassword }: Props): React.ReactElement {
  const supabase = createClient()
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSubmit(): Promise<void> {
    if (saving) return
    if (newPw.length < 8) {
      flashToast('New password must be at least 8 characters.', 'error')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) {
        flashToast(error.message, 'error')
        return
      }
      flashToast(hasPassword ? 'Password updated' : 'Password set — you can now also sign in with email + password', 'success')
      setCurrentPw('')
      setNewPw('')
    } catch {
      flashToast('Could not update password.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section id="security" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Security
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-security">
          <div className="settings-security-fields">
            {hasPassword && (
              <div className="form-group">
                <label className="form-label" htmlFor="current-pw">Current password</label>
                <div className="form-password">
                  <input
                    id="current-pw"
                    type={showCurrent ? 'text' : 'password'}
                    className="form-input"
                    value={currentPw}
                    onChange={(e) => setCurrentPw(e.target.value)}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="form-password-toggle"
                    aria-label={showCurrent ? 'Hide password' : 'Show password'}
                    onClick={() => setShowCurrent((v) => !v)}
                  >
                    <span aria-hidden="true" className="material-symbols-outlined">
                      {showCurrent ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="new-pw">{hasPassword ? 'New password' : 'Set a password'}</label>
              <div className="form-password">
                <input
                  id="new-pw"
                  type={showNew ? 'text' : 'password'}
                  className="form-input"
                  placeholder={hasPassword ? 'Enter new password' : 'Add a password for email sign-in'}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="form-password-toggle"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  onClick={() => setShowNew((v) => !v)}
                >
                  <span aria-hidden="true" className="material-symbols-outlined">
                    {showNew ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="form-helper">At least 8 characters with one number and one symbol.</p>
            </div>
            <div className="settings-security-actions">
              <button type="button" className="btn-pill btn-pill-primary" onClick={() => { void handleSubmit() }} disabled={saving}>
                <span aria-hidden="true" className="material-symbols-outlined">lock_reset</span>
                {saving ? 'Saving…' : hasPassword ? 'Update password' : 'Set password'}
              </button>
              {toast && <span className={`ml-3 text-sm ${toast.tone === 'success' ? 'text-success' : 'text-error'}`}>{toast.message}</span>}
            </div>
          </div>

          <div className="settings-security-divider">
            <h3 className="settings-2fa-title">Two-factor authentication</h3>
            <p className="settings-2fa-desc">Coming soon — add an extra layer of security to your account by requiring a verification code in addition to your password.</p>
            <div className="settings-2fa-toggle-row">
              <span className="settings-2fa-label">Enable 2FA</span>
              <button
                type="button"
                className="toggle-switch"
                role="switch"
                aria-checked={false}
                aria-label="Enable two-factor authentication (coming soon)"
                disabled
              >
                <span className="toggle-switch-thumb" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (it isn't imported anywhere yet — Task 7 wires it into `page.tsx`).

- [ ] **Step 3: Commit**

```bash
git add app/settings/SecuritySection.tsx
git commit -m "feat(settings): add Security section with conditional password form + 2FA placeholder"
```

---

### Task 6: Notification preferences section

**Files:**
- Create: `app/settings/NotificationsSection.tsx`

**Interfaces:**
- Consumes: `emailAlerts, pushNotifications, smsAlerts: boolean` props (from `page.tsx`, Task 7); `PATCH /api/settings/notifications` (Task 3).
- Produces: `NotificationsSection` component used by `page.tsx`.

- [ ] **Step 1: Write the Notifications section**

Create `app/settings/NotificationsSection.tsx`:

```tsx
'use client'

import { useState } from 'react'

interface Props {
  emailAlerts: boolean
  pushNotifications: boolean
  smsAlerts: boolean
}

interface ChoiceCardDef {
  key: 'email_alerts' | 'push_notifications' | 'sms_alerts'
  icon: string
  title: string
  desc: string
}

const CARDS: ChoiceCardDef[] = [
  { key: 'email_alerts', icon: 'mail', title: 'Email alerts', desc: 'Detailed event reports and guest list updates delivered to your inbox.' },
  { key: 'push_notifications', icon: 'notifications_active', title: 'Push notifications', desc: 'Real-time alerts for incoming RSVPs, vendor messages, and approvals.' },
  { key: 'sms_alerts', icon: 'sms', title: 'SMS alerts', desc: 'Critical day-of-event timing reminders sent to your mobile.' },
]

export function NotificationsSection({ emailAlerts, pushNotifications, smsAlerts }: Props): React.ReactElement {
  const [state, setState] = useState({
    email_alerts: emailAlerts,
    push_notifications: pushNotifications,
    sms_alerts: smsAlerts,
  })
  const [pending, setPending] = useState<Record<string, boolean>>({})

  async function toggle(key: ChoiceCardDef['key']): Promise<void> {
    if (pending[key]) return
    const next = !state[key]
    setPending((p) => ({ ...p, [key]: true }))
    setState((s) => ({ ...s, [key]: next })) // optimistic

    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: next }),
      })
      if (!res.ok) {
        setState((s) => ({ ...s, [key]: !next })) // revert on failure
      }
    } catch {
      setState((s) => ({ ...s, [key]: !next }))
    } finally {
      setPending((p) => ({ ...p, [key]: false }))
    }
  }

  return (
    <section id="notifications" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Notification preferences
        </h2>
      </header>
      <div className="notif-prefs-grid">
        {CARDS.map((card) => {
          const active = state[card.key]
          return (
            <button
              key={card.key}
              type="button"
              className={`choice-card${active ? ' is-active' : ''}`}
              aria-pressed={active}
              disabled={pending[card.key]}
              onClick={() => { void toggle(card.key) }}
            >
              <span className="choice-card-icon" aria-hidden="true">
                <span className="material-symbols-outlined">{card.icon}</span>
              </span>
              <h3 className="choice-card-title">{card.title}</h3>
              <p className="choice-card-desc">{card.desc}</p>
              <span className="choice-card-state">
                <span className="choice-card-dot" aria-hidden="true">
                  <span className="material-symbols-outlined">check</span>
                </span>
                <span>{active ? 'Active' : 'Inactive'}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (it isn't imported anywhere yet — Task 7 wires it into `page.tsx`).

- [ ] **Step 3: Commit**

```bash
git add app/settings/NotificationsSection.tsx
git commit -m "feat(settings): add Notification preferences section with instant-apply toggles"
```

---

### Task 7: Rebuild `/settings` page shell + Profile section + Account section

**Files:**
- Modify: `app/globals.css`
- Modify: `app/settings/page.tsx`
- Create: `app/settings/ProfileSection.tsx`
- Create: `app/settings/AccountSection.tsx`

**Interfaces:**
- Consumes: `FloatingNav` (Task 1), `avatarInitial` (Task 1), `PATCH /api/settings/profile` (Task 3), `POST /api/settings/avatar` (Task 4), `SecuritySection` (Task 5), `NotificationsSection` (Task 6).
- Produces: `ProfileSection` props `{ userId: string; displayName: string | null; email: string | null; phone: string | null; avatarUrl: string | null }`.
- Produces: `AccountSection` — no props (calls `supabase.auth.signOut()` directly via the browser client, matching the existing working pattern in `EventsGrid.tsx`).

- [ ] **Step 1: Import the missing page-specific stylesheet**

In `app/globals.css`, add this line after the existing `@import "../designs/pages/event-settings/event-settings.css";` (line 11):

```css
@import "../designs/pages/settings/settings.css";
```

Without this the design's `.settings-eyebrow`, `.settings-h1`, `.settings-section`, `.settings-profile`, `.settings-security`, `.notif-prefs-grid`, `.choice-card`, `.settings-account`, `.avatar-edit`, `.form-password`, `.settings-2fa-*` classes (208 lines total, confirmed present in `designs/pages/settings/settings.css` and absent from the app's compiled CSS during planning) never reach the built app — the page would render with only the generic shell primitives and none of this page's specific spacing/layout rules.

- [ ] **Step 2: Write the Profile section component**

Create `app/settings/ProfileSection.tsx`:

```tsx
'use client'

import { useState } from 'react'

type ToastTone = 'success' | 'error'
interface ToastState { message: string; tone: ToastTone }

interface Props {
  userId: string
  displayName: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
}

export function ProfileSection({ displayName, email, phone, avatarUrl }: Props): React.ReactElement {
  const [name, setName] = useState(displayName ?? '')
  const [avatar, setAvatar] = useState(avatarUrl)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState | null>(null)

  function flashToast(message: string, tone: ToastTone): void {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3000)
  }

  async function handleSave(): Promise<void> {
    if (saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim() }),
      })
      if (!res.ok) {
        flashToast('Could not save changes.', 'error')
        return
      }
      flashToast('Changes saved', 'success')
    } catch {
      flashToast('Could not save changes.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: formData })
      const data: { url?: string; error?: string } = await res.json()
      if (!res.ok || !data.url) {
        setAvatarError(data.error ?? 'Upload failed')
        return
      }
      setAvatar(data.url)
      flashToast('Avatar updated', 'success')
    } catch {
      setAvatarError('Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <section id="profile" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Profile information
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-profile">
          <div className="settings-profile-fields">
            <div className="form-group">
              <label className="form-label" htmlFor="full-name">Full name</label>
              <input
                id="full-name"
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone number</label>
              <div className="form-input form-input-group">
                <span className="form-input-prefix" aria-hidden="true">+91</span>
                <input
                  id="phone"
                  type="tel"
                  className="form-input-field"
                  value={phone ?? ''}
                  readOnly
                  autoComplete="tel"
                  inputMode="numeric"
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email ?? ''}
                readOnly
                autoComplete="email"
              />
            </div>
          </div>

          <div className="settings-profile-avatar">
            <div className="avatar-edit">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" className="avatar-edit-img" />
              ) : (
                <span className="avatar-edit-img" aria-hidden="true">{(name || 'U')[0]?.toUpperCase()}</span>
              )}
              <input
                type="file"
                id="avatar-upload"
                className="avatar-edit-input"
                accept="image/*"
                onChange={(e) => { void handleAvatarChange(e) }}
                disabled={uploading}
              />
              <label htmlFor="avatar-upload" className="avatar-edit-btn" aria-label="Change avatar">
                <span aria-hidden="true" className="material-symbols-outlined">photo_camera</span>
              </label>
            </div>
            <p className="form-error" id="avatar-error" role="alert" hidden={!avatarError}>{avatarError}</p>
          </div>
        </div>

        <div className="mt-4">
          <button type="button" className="btn-pill btn-pill-primary" onClick={() => { void handleSave() }} disabled={saving}>
            <span aria-hidden="true" className="material-symbols-outlined">save</span>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
          {toast && <span className={`ml-3 text-sm ${toast.tone === 'success' ? 'text-success' : 'text-error'}`}>{toast.message}</span>}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Write the Account section component**

Create `app/settings/AccountSection.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function AccountSection(): React.ReactElement {
  const router = useRouter()
  const supabase = createClient()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut(): Promise<void> {
    if (signingOut) return
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <section id="account" className="settings-section reveal">
      <header className="settings-section-head">
        <h2 className="section-rule">
          <span className="section-rule-bar" aria-hidden="true" />
          Account
        </h2>
      </header>
      <div className="clay-card settings-card-inner">
        <div className="settings-account">
          <div className="settings-account-body">
            <h3 className="settings-account-title">Sign out</h3>
            <p className="settings-account-desc">You&apos;ll need to sign in again with your phone number or Google account to keep planning your events.</p>
          </div>
          <button type="button" className="btn-pill btn-pill-danger" onClick={() => { void handleSignOut() }} disabled={signingOut}>
            <span aria-hidden="true" className="material-symbols-outlined">logout</span>
            <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Rewrite the page shell**

`SecuritySection` (Task 5) and `NotificationsSection` (Task 6) already exist by this point — this step wires all four sections together. Replace the full contents of `app/settings/page.tsx` with:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { ScrollProgress } from '@/components/layout/ScrollProgress'
import { HelpFab } from '@/components/layout/HelpFab'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { avatarInitial } from '@/lib/utils'
import { ProfileSection } from './ProfileSection'
import { SecuritySection } from './SecuritySection'
import { NotificationsSection } from './NotificationsSection'
import { AccountSection } from './AccountSection'

export default async function UserSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('display_name, email, phone, avatar_url')
    .eq('id', user.id)
    .single()

  const { data: preferences } = await supabase
    .from('user_preferences')
    .select('email_alerts, push_notifications, sms_alerts')
    .eq('user_id', user.id)
    .single()

  const hasPassword = (user.identities ?? []).some((identity) => identity.provider === 'email')
  const displayName = profile?.display_name ?? null
  const initial = avatarInitial(displayName ?? user.email ?? user.phone ?? 'User')

  return (
    <div data-page="settings">
      <ScrollProgress />
      <FloatingNav userInitial={initial} />

      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: 'SETTINGS' },
        ]}
        backHref="/home"
      />

      <main className="page-band pt-10 md:pt-14 pb-20">
        <header className="reveal">
          <p className="settings-eyebrow">Account</p>
          <h1 className="settings-h1">Settings</h1>
          <p className="settings-lead">Manage your profile, security, and how you&apos;d like to be notified about events you host or collaborate on.</p>
        </header>

        <ProfileSection
          userId={user.id}
          displayName={displayName}
          email={profile?.email ?? user.email ?? null}
          phone={profile?.phone ?? user.phone ?? null}
          avatarUrl={profile?.avatar_url ?? null}
        />
        <SecuritySection hasPassword={hasPassword} />
        <NotificationsSection
          emailAlerts={preferences?.email_alerts ?? true}
          pushNotifications={preferences?.push_notifications ?? true}
          smsAlerts={preferences?.sms_alerts ?? false}
        />
        <AccountSection />
      </main>

      <HelpFab />
      <PageFooter />
    </div>
  )
}
```

- [ ] **Step 5: Verify types**

Run: `npx tsc --noEmit`
Expected: zero errors — all four section components already exist (Tasks 5–7) and their prop types match exactly what this page passes.

- [ ] **Step 6: Commit**

```bash
git add app/globals.css app/settings/page.tsx app/settings/ProfileSection.tsx app/settings/AccountSection.tsx
git commit -m "feat(settings): rebuild page shell with Profile + Account sections, add missing CSS import"
```

---

### Task 8: Full functional + breakpoint testing pass

**Files:** none (verification only — fix-forward into the files above if a bug is found, no new files expected)

- [ ] **Step 1: Start the dev server and open the browser preview**

Start `npm run dev` (background), open `http://localhost:3000/home` in the browser preview tool.

- [ ] **Step 2: Nav consistency check across three pages**

Navigate to `/home`, then to any `/events/[id]` page, then to `/settings`. On each:
- Confirm the Settings icon is present and visually active (filled + `aria-current="page"`) only on `/settings`.
- Confirm **no logout icon** appears anywhere in the nav on any of the three pages.
- Confirm the "Create event" button appears **only** on `/home`.
- Confirm the avatar shows the real first-letter initial (not a hardcoded `'A'`) — check against the logged-in test user's actual name/email.
- Read console for errors: use `read_console_messages` (onlyErrors: true) — expect zero.

- [ ] **Step 3: Profile section — functional check**

On `/settings`, change the "Full name" field, click "Save profile." Reload the page. Confirm the new name persisted (real DB round-trip, not just in-memory). Upload an avatar image; confirm it appears immediately and persists after reload. Confirm phone/email fields are visibly read-only (no cursor/edit affordance).

- [ ] **Step 4: Security section — functional check**

Confirm the section renders either "Set a password" (for the logged-in test user's `phone`/`google` identity) or "Change password" + a "Current password" field (only if that user already has an `'email'` identity — check via the `identities` state from Task 5's logic). Confirm the 2FA toggle is visibly disabled and shows "Coming soon" copy — clicking it must not fire any request (check `read_network_requests` shows nothing to an MFA endpoint).

- [ ] **Step 5: Notifications section — functional check**

Toggle each of the three choice-cards. Confirm the visual state (`is-active` class, "Active"/"Inactive" text) flips immediately. Reload the page and confirm the toggled state persisted (real `user_preferences` write, not optimistic-only).

- [ ] **Step 6: Account section — functional check**

Click "Sign out." Confirm it actually clears the session and redirects to `/`. Log back in and confirm `/settings` is reachable again with the same data intact.

- [ ] **Step 7: Breakpoint sweep**

Using `resize_window`, check `/home`, one `/events/[id]` page, and `/settings` at each of: 360px, 390px, 414px, 768px, 1024px, 1440px. At each width, confirm:
- No horizontal scroll (`document.documentElement.scrollWidth <= document.documentElement.clientWidth` via `javascript_tool`, or visually via screenshot).
- Nav icons remain tappable (no overlap/clipping) — the "Create event" label may collapse to icon-only per existing responsive rules, that's expected, not a bug.
- On `/settings`, the Profile section's two-column layout (fields + avatar) collapses to single-column below 768px per the design's `@media (min-width:768px)` rule already in `settings.css`; confirm this actually happens.
- Notification choice-cards reflow to a single column on narrow widths without overlapping text.

- [ ] **Step 8: Write up findings**

If every check in Steps 2–7 passes with no bugs found, append a short note to `docs/superpowers/specs/2026-07-29-user-settings-design.md` under a new `## Built` heading: what shipped, confirmation that all six breakpoints were tested clean, and explicitly restate that Danger Zone/Delete Account (§4.5) remains deferred. If any check fails, fix it in the relevant file from Tasks 1–7, re-run the specific failed check, and only then proceed to the write-up.

- [ ] **Step 9: Final commit**

```bash
git add docs/superpowers/specs/2026-07-29-user-settings-design.md
git commit -m "docs(settings): mark User Settings nav + page build complete, all breakpoints tested"
```
