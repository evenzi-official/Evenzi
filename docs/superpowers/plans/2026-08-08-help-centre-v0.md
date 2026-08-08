# Help Centre V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Help Centre for the Evenzi host app — a guided category picker, ranked full-text search, and ticket escalation — containing no AI, where every answer shown is staff-authored text.

**Architecture:** Content lives in `config.*` catalog tables seeded by migration, exactly like every other catalog in this codebase, which removes any dependency on an admin panel. Search is a `SECURITY INVOKER` Postgres function combining full-text ranking with trigram fuzzy matching. All writes go through Next.js route handlers holding the service key, because `service_role` is the only writer on the `public.*` tables. The interface is one shared panel component behind the existing `.help-fab`, plus four server-rendered `/help` routes.

**Tech Stack:** Next.js 14 App Router · TypeScript strict · Supabase Postgres (`pg_trgm`, `pg_cron`) · Zod 4 · Vitest (node environment) · Tailwind v4 · `designs/shared/shell.css` primitives

**Spec:** [`docs/superpowers/specs/2026-08-07-help-centre-v0-design.md`](../specs/2026-08-07-help-centre-v0-design.md)
**UI spec:** [`docs/superpowers/specs/2026-08-07-help-centre-v0-ui-design.md`](../specs/2026-08-07-help-centre-v0-ui-design.md)

---

## Global Constraints

Every task's requirements implicitly include this section.

- **No AI, anywhere.** No copy may contain "chat", "assistant", "ask me", "bot", or "AI". Every answer is staff-authored text read from the database.
- **Tests live in `__tests__/`**, mirroring the source path, named `*.test.ts`. Run with `npm run test:run`.
- **API routes** follow the house pattern in `app/api/settings/profile/route.ts`: `createClient()` from `@/lib/supabase/server`, `supabase.auth.getUser()` for identity, Zod `safeParse` for bodies, explicit `Promise<NextResponse>` return type, `try/catch`, `console.error` on failure, generic message to the client.
- **TypeScript strict.** No `any`. Explicit return types on all exported functions.
- **Never accept identity from a request body.** `user_id` and `audience` are always derived server-side. See spec §8.6.
- **Never log ticket message bodies or search query text** to the application log.
- **`updated_at` is maintained by the `public.set_updated_at()` trigger**, never in application code.
- **Every `SECURITY DEFINER` function** must `revoke all ... from public, anon, authenticated` — revoking from `public` alone is a no-op in Supabase. Run `get_advisors` after every migration.
- **Spelling is "Help Centre"** (en-IN), everywhere, including code identifiers where the word appears in user-visible strings.
- **Reuse before create.** Cite the `shell.css` primitive being reused. Any new shared primitive must be added to `designs/components.html` in the same task.
- **Support address** comes from the `SUPPORT_EMAIL` constant (Task 1), never hardcoded.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/constants/support.ts` | The single support address constant |
| `lib/help/types.ts` | Shared TypeScript types for articles, categories, search results |
| `lib/help/search.ts` | Search thresholds and the result-shaping helper |
| `lib/validations/help.ts` | Zod schemas for every Help Centre request body |
| `lib/hooks/useOverlaySurface.ts` | Escape, focus return, focus trap, body scroll lock |
| `components/ui/OverlaySurface.tsx` | The shared overlay wrapper |
| `components/help/HelpPanel.tsx` | Panel state machine and frame |
| `components/help/HelpArticle.tsx` | Sanitised Markdown renderer, shared by panel and pages |
| `components/help/TicketForm.tsx` | Escalation form, used by panel and `/help` pages |
| `components/help/HelpSearchInput.tsx` | Search field with debounce |
| `app/help/page.tsx` | `/help` root and `?q=` results |
| `app/help/[category]/page.tsx` | Category listing |
| `app/help/a/[slug]/page.tsx` | Article page — the forwarded, indexable surface |
| `app/api/help/search/route.ts` | Tier 1 search |
| `app/api/help/tickets/route.ts` | Tier 3 escalation |
| `app/api/help/feedback/route.ts` | Article feedback |
| `app/api/help/queries/[ref]/route.ts` | Query-log outcome update |

Migrations are applied through the Supabase MCP `apply_migration` tool, one named migration per logical group.

---

## Task 1: Support address constant and sweep

Fixes spec §10.1. This is first because every later task that renders a support address depends on it, and hardcoding it once means hardcoding it seven more times.

**Files:**
- Create: `lib/constants/support.ts`
- Create: `__tests__/lib/constants/support.test.ts`
- Modify: `app/auth/page.tsx:143`, `app/auth/role-selection/page.tsx:58`, `app/events/[id]/settings/GeneralSettingsForm.tsx:293`, `app/events/[id]/settings/guests/GuestListContent.tsx:174`, `app/events/[id]/settings/billing/page.tsx:142`, `app/events/[id]/settings/admins/AdminsContent.tsx:168`, `components/layout/PageFooter.tsx:19`

**Interfaces:**
- Produces: `SUPPORT_EMAIL: string`, `SUPPORT_MAILTO: (subject?: string, body?: string) => string`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/constants/support.test.ts
import { describe, it, expect } from 'vitest'
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/lib/constants/support'

describe('SUPPORT_EMAIL', () => {
  it('defaults to the interim address while the support mailbox does not exist', () => {
    expect(SUPPORT_EMAIL).toBe('abhijith@evenzii.com')
  })

  it('is on the owned evenzii.com domain', () => {
    expect(SUPPORT_EMAIL).toMatch(/@evenzii\.com$/)
  })

  it('is never a consumer mail provider', () => {
    expect(SUPPORT_EMAIL).not.toMatch(/gmail|yahoo|outlook|hotmail/i)
  })
})

describe('SUPPORT_MAILTO', () => {
  it('builds a bare mailto with no arguments', () => {
    expect(SUPPORT_MAILTO()).toBe('mailto:abhijith@evenzii.com')
  })

  it('url-encodes subject and body', () => {
    expect(SUPPORT_MAILTO('Help & support', 'line one\nline two')).toBe(
      'mailto:abhijith@evenzii.com?subject=Help%20%26%20support&body=line%20one%0Aline%20two'
    )
  })

  it('omits body when not supplied', () => {
    expect(SUPPORT_MAILTO('Subject only')).toBe(
      'mailto:abhijith@evenzii.com?subject=Subject%20only'
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- __tests__/lib/constants/support.test.ts`
Expected: FAIL — `Cannot find module '@/lib/constants/support'`

- [ ] **Step 3: Write the implementation**

```typescript
// lib/constants/support.ts

/**
 * The single source of truth for the support address.
 *
 * Do not hardcode this address anywhere else. Before this constant existed it
 * appeared in seven application files as a personal Gmail account, while two
 * operations documents published a different address on a domain the company
 * does not own. See spec section 10.1.
 *
 * INTERIM ADDRESS. support@evenzii.com does not exist yet and will be created
 * at launch. Until then this is the founder's own mailbox, which is real and
 * monitored — unlike the address the operations documents currently publish.
 *
 * The launch flip is one environment variable, not a code change: set
 * NEXT_PUBLIC_SUPPORT_EMAIL=support@evenzii.com in Vercel. Nothing needs
 * redeploying beyond that, and no file needs editing.
 */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'abhijith@evenzii.com'

/** Support hours as published in platform-policies.md section 7.2. */
export const SUPPORT_HOURS = 'Mon–Sat, 9 AM–7 PM IST'

/** First-response commitment as published in platform-policies.md section 7.2. */
export const SUPPORT_RESPONSE_HOURS = 24

export function SUPPORT_MAILTO(subject?: string, body?: string): string {
  const params: string[] = []
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`)
  if (body) params.push(`body=${encodeURIComponent(body)}`)
  return params.length > 0
    ? `mailto:${SUPPORT_EMAIL}?${params.join('&')}`
    : `mailto:${SUPPORT_EMAIL}`
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- __tests__/lib/constants/support.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 5: Replace the address in all seven files**

In each of the seven files, replace the literal `mailto:evenzi.official@gmail.com` with `SUPPORT_MAILTO()` and add the import. Example, for `components/layout/PageFooter.tsx`:

```tsx
import { SUPPORT_MAILTO } from '@/lib/constants/support'

// then, at line 19, replace:
//   <a href="mailto:evenzi.official@gmail.com" className="hover:text-[#BB0020] transition-colors">Help</a>
// with:
<a href={SUPPORT_MAILTO()} className="hover:text-[#BB0020] transition-colors">Help</a>
```

The two auth screens (`app/auth/page.tsx`, `app/auth/role-selection/page.tsx`) use `className="page-help"` and should point at `/help` rather than a mailto, because `/help` is reachable logged out and is the better destination for someone who cannot sign in:

```tsx
<a href="/help" className="page-help">Need help?</a>
```

- [ ] **Step 6: Verify no hardcoded addresses remain**

Run: `grep -rn "evenzi.official@gmail.com" app/ components/ lib/`
Expected: no output.

- [ ] **Step 7: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add lib/constants/support.ts __tests__/lib/constants/support.test.ts \
  app/auth/page.tsx app/auth/role-selection/page.tsx \
  app/events/\[id\]/settings/GeneralSettingsForm.tsx \
  app/events/\[id\]/settings/guests/GuestListContent.tsx \
  app/events/\[id\]/settings/billing/page.tsx \
  app/events/\[id\]/settings/admins/AdminsContent.tsx \
  components/layout/PageFooter.tsx
git commit -m "fix(support): single support address constant, replacing seven hardcoded Gmail links"
```

---

## Task 2: Fix the Help FAB — unreachable on tablet, absent on mobile

Fixes spec §10.3. Two live defects, unrelated to the Help Centre, shipped today. This task is independent of everything else and can ship on its own.

**Files:**
- Modify: `designs/shared/shell.css:723-744` (the `.help-fab` block)
- Modify: `components/layout/HelpFab.tsx`
- Modify: `app/layout.tsx` (mount once, pathname-gated)
- Modify: `app/events/[id]/layout.tsx:57`, `app/settings/page.tsx:89` (remove per-page mounts)
- Modify: `designs/components.html` (document the `--stacked` modifier)

**Interfaces:**
- Produces: `<HelpFab stacked?: boolean onClick?: () => void />`

**Background.** `.help-fab` sits at `right: 24px`, `bottom: 84px`, `z-index: 30`. `.add-fab` sits at `right: 20px`, `bottom: 92px`, `z-index: 60`. Both are 56×56, so they overlap by roughly 52×48 pixels and `.add-fab` wins. On the Guests and Planning screens the help button is unclickable between 769px and 1399px. Below 768px `.help-fab` is `display: none` entirely.

- [ ] **Step 1: Replace the `.help-fab` CSS block**

In `designs/shared/shell.css`, replace lines 716–744 with:

```css
/* ════════════════════════════════════════════════════════════════════
   HELP FAB — fixed bottom-right floating button.
   Composition: <button class="help-fab" aria-label="Open Help Centre">
                  <span class="material-symbols-outlined">help</span>
                </button>
   Visible at ALL widths. Pages that render a primary .add-fab must pass
   the --stacked modifier, which lifts help one slot above it.
   ════════════════════════════════════════════════════════════════════ */
.help-fab{
  position:fixed;
  bottom:calc(1.5rem + env(safe-area-inset-bottom,0px));
  right:max(1.25rem, calc(1.25rem + env(safe-area-inset-right,0px)));
  width:56px;height:56px;border-radius:9999px;
  display:inline-flex;align-items:center;justify-content:center;
  background:var(--brand);color:#fff;border:0;cursor:pointer;
  box-shadow:var(--shadow-clay-pill);
  z-index:59;
  transition:background-color .2s,transform .2s;
}
.help-fab .material-symbols-outlined{font-size:24px;font-variation-settings:'FILL' 1}
@media (hover:hover) and (pointer:fine){
  .help-fab:hover{background:var(--brand-hover);transform:translateY(-2px)}
}
.help-fab:focus-visible{outline:2px solid var(--brand);outline-offset:3px}
@media (prefers-reduced-motion:reduce){.help-fab{transition:none}}

/* lift clear of the bottom tool rail */
@media (max-width:1399px){
  .help-fab{bottom:calc(env(safe-area-inset-bottom,0px) + 5.25rem)}
}

/* stacked above a page's primary .add-fab — 56px button + 12px gap */
.help-fab--stacked{bottom:calc(5.75rem + 68px + env(safe-area-inset-bottom,0px))}
@media (max-width:1399px){
  .help-fab--stacked{bottom:calc(env(safe-area-inset-bottom,0px) + 5.75rem + 68px)}
}
```

Three deliberate changes: `display:none` below 768px is gone; `right` now matches `.add-fab`'s `1.25rem` so the two share a vertical axis; `z-index` is 59, below `.add-fab`'s 60 so the primary action still wins any residual overlap, but above the tool rail at 40.

- [ ] **Step 2: Update the component**

```tsx
// components/layout/HelpFab.tsx
'use client'

export function HelpFab({
  stacked = false,
  expanded = false,
  onClick,
}: {
  stacked?: boolean
  expanded?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      className={`help-fab${stacked ? ' help-fab--stacked' : ''}`}
      aria-label={expanded ? 'Close Help Centre' : 'Open Help Centre'}
      aria-expanded={expanded}
      aria-controls="help-panel"
      onClick={onClick}
    >
      <span aria-hidden="true" className="material-symbols-outlined">help</span>
    </button>
  )
}
```

- [ ] **Step 3: Mount once in the root layout, pathname-gated**

Create `components/layout/HelpFabMount.tsx`:

```tsx
'use client'
import { usePathname } from 'next/navigation'
import { HelpFab } from './HelpFab'

/** Pages that render their own primary .add-fab, so help stacks above it. */
const STACKED_PREFIXES = ['/events/'] as const
const STACKED_SUFFIXES = ['/guests', '/planning'] as const

function isStacked(pathname: string): boolean {
  return (
    STACKED_PREFIXES.some((p) => pathname.startsWith(p)) &&
    STACKED_SUFFIXES.some((s) => pathname.endsWith(s))
  )
}

function isHidden(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/e/') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/invite') ||
    pathname.startsWith('/wedding-invitation-temp-')
  )
}

export function HelpFabMount() {
  const pathname = usePathname()
  if (isHidden(pathname)) return null
  return <HelpFab stacked={isStacked(pathname)} />
}
```

Add `<HelpFabMount />` to `app/layout.tsx` inside `<body>`, after `{children}`. Remove the `<HelpFab />` line and its import from `app/events/[id]/layout.tsx:57` and `app/settings/page.tsx:89`.

The FAB is hidden on `/e/*` because that is the guest event website — a host-support button is noise to a wedding guest. It is hidden on `/help` because a button opening a small panel showing what is already full-size on screen is a dead affordance.

- [ ] **Step 4: Verify visually at the collision breakpoint**

Start the dev server via the preview tool, open `/events/{any-id}/guests`, and check at 1024px and at 375px that both buttons are visible, do not overlap, and both respond to a click. Take a screenshot at each width.

- [ ] **Step 5: Catalog the modifier**

In `designs/components.html`, find the S5 Help FAB entry near line 467 and add a second example showing `class="help-fab help-fab--stacked"` with the caption `S5b · Help FAB, stacked above a primary FAB · .help-fab--stacked`.

- [ ] **Step 6: Commit**

```bash
git add designs/shared/shell.css designs/components.html components/layout/HelpFab.tsx \
  components/layout/HelpFabMount.tsx app/layout.tsx \
  app/events/\[id\]/layout.tsx app/settings/page.tsx
git commit -m "fix(ui): help FAB visible on mobile and no longer buried under the add FAB"
```

---

## Task 3: Shared overlay wrapper

Fixes spec §10.4. Twelve files hand-roll `.modal-scrim`; four handle Escape; none implement focus return, focus trapping, or a body scroll lock. `lib/hooks/` does not exist.

**Files:**
- Create: `lib/hooks/useOverlaySurface.ts`
- Create: `components/ui/OverlaySurface.tsx`
- Create: `__tests__/lib/hooks/useOverlaySurface.test.ts`
- Modify: `components/layout/NotificationBell.tsx`

**Interfaces:**
- Produces:
  - `useOverlaySurface(opts: { open: boolean; onClose: () => void; modal: boolean; triggerRef?: React.RefObject<HTMLElement> }): { containerRef: React.RefObject<HTMLDivElement> }`
  - `<OverlaySurface open onClose modal labelledBy id className children />`

**Why `NotificationBell` is the proving consumer.** The contract splits in two: mobile is `aria-modal="true"`, focus trapped, body scroll locked; desktop is `aria-modal="false"`, untrapped, page still operable. Any modal picked from the existing twelve is a pure modal and would validate only the trapped path. `NotificationBell` is already a non-modal anchored panel that handles Escape (line 118) and uses `.fn-notif-panel` (line 183), so it exercises the untrapped path — and Task 4 promotes that same class to `.dock-panel` anyway, so the file is touched once rather than twice.

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/hooks/useOverlaySurface.test.ts
import { describe, it, expect } from 'vitest'
import { getFocusableElements, nextTrapFocus } from '@/lib/hooks/useOverlaySurface'

function makeContainer(html: string): HTMLElement {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

describe('getFocusableElements', () => {
  it('finds buttons, links with href, and inputs', () => {
    const c = makeContainer(`
      <button id="a">a</button>
      <a id="b" href="/x">b</a>
      <input id="c" />
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['a', 'b', 'c'])
  })

  it('excludes disabled controls and anchors without href', () => {
    const c = makeContainer(`
      <button id="a" disabled>a</button>
      <a id="b">b</a>
      <button id="c">c</button>
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['c'])
  })

  it('excludes elements with tabindex="-1"', () => {
    const c = makeContainer(`
      <button id="a" tabindex="-1">a</button>
      <button id="b">b</button>
    `)
    expect(getFocusableElements(c).map((e) => e.id)).toEqual(['b'])
  })
})

describe('nextTrapFocus', () => {
  const items = ['first', 'middle', 'last']

  it('wraps forward from the last element to the first', () => {
    expect(nextTrapFocus(items, 'last', false)).toBe('first')
  })

  it('wraps backward from the first element to the last', () => {
    expect(nextTrapFocus(items, 'first', true)).toBe('last')
  })

  it('moves forward normally in the middle', () => {
    expect(nextTrapFocus(items, 'first', false)).toBe('middle')
  })

  it('returns the first element when focus is outside the trap', () => {
    expect(nextTrapFocus(items, 'elsewhere', false)).toBe('first')
  })

  it('returns null for an empty trap', () => {
    expect(nextTrapFocus([], 'anything', false)).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- __tests__/lib/hooks/useOverlaySurface.test.ts`
Expected: FAIL — `Cannot find module '@/lib/hooks/useOverlaySurface'`

- [ ] **Step 3: Write the hook**

```typescript
// lib/hooks/useOverlaySurface.ts
'use client'
import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Exported for unit testing; also used by the trap. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getAttribute('tabindex') !== '-1'
  )
}

/**
 * Pure focus-cycling logic, expressed over identifiers so it can be unit
 * tested without a DOM. Returns the id that should receive focus next, or
 * null when there is nothing focusable.
 */
export function nextTrapFocus(
  ids: readonly string[],
  currentId: string,
  backward: boolean
): string | null {
  if (ids.length === 0) return null
  const i = ids.indexOf(currentId)
  if (i === -1) return ids[0]
  const next = backward ? i - 1 : i + 1
  if (next < 0) return ids[ids.length - 1]
  if (next >= ids.length) return ids[0]
  return ids[next]
}

export function useOverlaySurface({
  open,
  onClose,
  modal,
  triggerRef,
}: {
  open: boolean
  onClose: () => void
  modal: boolean
  triggerRef?: RefObject<HTMLElement | null>
}): { containerRef: RefObject<HTMLDivElement | null> } {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Escape closes, in both modal and non-modal presentations.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modal || !containerRef.current) return
      const items = getFocusableElements(containerRef.current)
      if (items.length === 0) return
      const active = document.activeElement as HTMLElement | null
      const i = active ? items.indexOf(active) : -1
      const goingBack = e.shiftKey
      if (i === -1) {
        e.preventDefault()
        items[0].focus()
      } else if (goingBack && i === 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!goingBack && i === items.length - 1) {
        e.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, modal])

  // Body scroll lock, modal presentation only.
  useEffect(() => {
    if (!open || !modal) return
    document.body.classList.add('no-scroll')
    return () => document.body.classList.remove('no-scroll')
  }, [open, modal])

  // Focus return to the trigger on close.
  useEffect(() => {
    if (open) return
    triggerRef?.current?.focus()
  }, [open, triggerRef])

  return { containerRef }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- __tests__/lib/hooks/useOverlaySurface.test.ts`
Expected: PASS, 8 tests

- [ ] **Step 5: Write the wrapper component**

```tsx
// components/ui/OverlaySurface.tsx
'use client'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useOverlaySurface } from '@/lib/hooks/useOverlaySurface'

export function OverlaySurface({
  open,
  onClose,
  modal,
  labelledBy,
  id,
  className = '',
  triggerRef,
  children,
}: {
  open: boolean
  onClose: () => void
  modal: boolean
  labelledBy: string
  id: string
  className?: string
  triggerRef?: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  const { containerRef } = useOverlaySurface({ open, onClose, modal, triggerRef })
  const closedByOutsideClick = useRef(false)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current) return
      if (containerRef.current.contains(e.target as Node)) return
      if (triggerRef?.current?.contains(e.target as Node)) return
      closedByOutsideClick.current = true
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onClose, containerRef, triggerRef])

  if (!open) return null

  return (
    <div
      ref={containerRef}
      id={id}
      role="dialog"
      aria-modal={modal}
      aria-labelledby={labelledBy}
      className={className}
    >
      {children}
    </div>
  )
}
```

The panel is not rendered at all when closed — not `visibility: hidden` — so it costs nothing and cannot be reached by Tab.

- [ ] **Step 6: Migrate `NotificationBell` onto it**

In `components/layout/NotificationBell.tsx`, delete the bespoke Escape listener at line 118 and wrap the `.fn-notif-panel` element (line 183) in `<OverlaySurface open={open} onClose={close} modal={false} labelledBy="fn-notif-title" id="fn-notif-panel" triggerRef={bellRef} />`. Add an `id="fn-notif-title"` to the panel's heading. Keep all existing visual classes.

- [ ] **Step 7: Verify the bell still works**

Open the app, click the bell, confirm: it opens, Escape closes it, focus returns to the bell button, the page behind still scrolls (it is non-modal), and clicking outside closes it.

- [ ] **Step 8: Typecheck, lint, full test run**

Run: `npx tsc --noEmit && npm run lint && npm run test:run`
Expected: clean, all tests pass.

- [ ] **Step 9: Commit**

```bash
git add lib/hooks/useOverlaySurface.ts components/ui/OverlaySurface.tsx \
  __tests__/lib/hooks/useOverlaySurface.test.ts components/layout/NotificationBell.tsx
git commit -m "feat(ui): shared OverlaySurface with focus trap, focus return and scroll lock"
```

---

## Task 4: Design-system primitives

Fixes spec §10.5. `.prose` does not exist anywhere in `shell.css` — zero occurrences — and Tailwind v4's preflight zeroes list markers, so every Markdown numbered list in an FAQ answer would render as an unnumbered run-on block. That is the single most important formatting in the whole content set.

**Files:**
- Modify: `designs/shared/shell.css`
- Modify: `designs/components.html`

**Interfaces:**
- Produces: CSS classes `.prose`, `.list-nav-row` (+ `-icon`, `-label`, `-sub`, `-chevron`), `.dock-panel` (+ `--origin-br`), `.alert-banner` (+ `--danger`, `--warning`, `--info`)

- [ ] **Step 1: Add `.prose`**

Append to `designs/shared/shell.css`:

```css
/* ════════════════════════════════════════════════════════════════════
   PROSE — rich text rendered from staff-authored Markdown.
   Tailwind's preflight zeroes list markers and margins; this restores
   them within an explicit scope. Consumers: Help Centre answers, and
   later the event-website Story/Q&A blocks and policy pages.
   ════════════════════════════════════════════════════════════════════ */
.prose{color:var(--ink-soft);font-size:14px;line-height:1.65;max-width:65ch}
.prose > *:last-child{margin-bottom:0}
.prose p{margin:0 0 .75rem}
.prose ol,.prose ul{margin:0 0 .75rem;padding-inline-start:1.25rem}
.prose ol{list-style:decimal}
.prose ul{list-style:disc}
.prose li{margin-bottom:.4rem}
.prose li::marker{color:var(--muted)}
.prose strong{font-weight:700;color:var(--ink)}
.prose em{font-style:italic}
.prose h3{font-size:15px;font-weight:700;color:var(--ink);margin:1.25rem 0 .5rem}
.prose h4{font-size:14px;font-weight:600;color:var(--ink);margin:1rem 0 .4rem}
.prose a{color:var(--brand);text-decoration:underline;text-underline-offset:2px;padding-block:.35rem}
.prose code{background:var(--line-soft);border-radius:4px;padding:1px 5px;font-size:13px}
.prose blockquote{border-left:3px solid var(--line);padding-left:.75rem;margin:0 0 .75rem;color:var(--muted)}
.prose hr{border:0;border-top:1px solid var(--line);margin:1.25rem 0}
```

The `padding-block` on links is deliberate: it lifts an inline link to a 44px tap target without changing its visual size.

- [ ] **Step 2: Add `.list-nav-row`**

```css
/* ════════════════════════════════════════════════════════════════════
   LIST NAV ROW — full-width tappable row that navigates one level
   deeper. Generalised from .fn-notif-item. Consumers: Help Centre
   category rows, question rows, search results.
   ════════════════════════════════════════════════════════════════════ */
.list-nav-row{
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:10px;
  width:100%;min-height:56px;padding:9px 4px;
  background:transparent;border:0;border-radius:10px;
  text-align:left;cursor:pointer;color:inherit;
  transition:background-color .15s;
}
.list-nav-row--no-icon{grid-template-columns:1fr auto}
@media (hover:hover) and (pointer:fine){
  .list-nav-row:hover{background:var(--brand-tint)}
}
.list-nav-row:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.list-nav-row-icon{
  width:30px;height:30px;border-radius:8px;background:var(--brand-tint);
  display:flex;align-items:center;justify-content:center;color:var(--brand);
}
.list-nav-row-icon .material-symbols-outlined{font-size:16px}
.list-nav-row-label{
  font-size:13px;font-weight:600;color:var(--ink);
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;
  overflow:hidden;overflow-wrap:anywhere;
}
.list-nav-row--no-icon .list-nav-row-label{font-weight:500}
.list-nav-row-sub{font-size:11px;color:var(--muted);margin-top:1px}
.list-nav-row-chevron{color:var(--muted-soft)}
.list-nav-row-chevron .material-symbols-outlined{font-size:16px}
```

- [ ] **Step 3: Promote `.fn-notif-panel` to `.dock-panel`**

Locate the `.fn-notif-panel` block at `shell.css:992`. Rename the selector to `.dock-panel, .fn-notif-panel` so the existing bell keeps working unchanged, and add below it:

```css
/* Docked panel anchored to a chrome button. .fn-notif-panel is retained
   as a one-release alias; migrate the bell's markup then drop it. */
.dock-panel--origin-br{transform-origin:bottom right}
```

- [ ] **Step 4: Promote `.media-error-banner` to `.alert-banner`**

Move the `.media-error-banner` rules out of `designs/pages/media/media.css` into `shell.css`, renaming the selector to `.alert-banner, .media-error-banner`, and add role modifiers:

```css
.alert-banner--danger{border-color:var(--danger);color:var(--danger)}
.alert-banner--warning{border-color:var(--warning)}
.alert-banner--info{border-color:var(--line);color:var(--muted)}
```

- [ ] **Step 5: Add the 16px input floor**

Any input below 16px triggers a viewport zoom on iOS Safari, and `.form-input` is 14px. `designs/pages/website/website.css` already patches this for one field locally — this replaces that page-local hack.

```css
/* iOS Safari zooms the viewport when a focused input is under 16px. */
@media (max-width:768px){
  .form-input,.form-textarea,.form-select select,.form-input-field{font-size:16px}
}
```

- [ ] **Step 6: Catalog all four primitives**

Add a new `<section class="cs-section reveal" id="help-primitives">` to `designs/components.html` with a live example of each: `.prose` rendering a heading, a paragraph, a three-item numbered list and a link; three `.list-nav-row`s (one with icon, one without, one with a two-line clamped label); a `.dock-panel`; and an `.alert-banner` in each of its three roles. Follow the markup pattern of the existing sections.

An uncatalogued primitive is invisible to the next builder, which is exactly how `.nav-tabs` and `.pill-tab` both came to exist for one job.

- [ ] **Step 7: Verify in the design server**

Run the design server and open `designs/components.html#help-primitives`. Confirm the numbered list renders with visible numbers, the rows are 56px tall with 44px-plus tap targets, and everything reads correctly in both light and dark themes.

- [ ] **Step 8: Commit**

```bash
git add designs/shared/shell.css designs/components.html designs/pages/media/media.css designs/pages/website/website.css
git commit -m "feat(design-system): prose, list-nav-row, dock-panel, alert-banner primitives"
```

---

## Task 5: Database migration

Implements spec §5 in full. Apply through the Supabase MCP `apply_migration` tool, not through raw SQL execution.

**Files:**
- Migration: `help_01_schema`
- Migration: `help_02_rls_and_grants`
- Migration: `help_03_functions_and_cron`

**Interfaces:**
- Produces tables `config.faq_categories`, `config.faq_articles`, `public.support_tickets`, `public.help_queries`, `public.faq_article_feedback`; function `config.faq_tags_text(text[])`

- [ ] **Step 1: Confirm the starting state**

Run through the Supabase MCP:

```sql
select extname, extnamespace::regnamespace::text as schema
from pg_extension where extname in ('pg_trgm','pg_cron');
```

Expected: `pg_trgm` present in `extensions`. `pg_cron` absent — it is installed by this migration.

- [ ] **Step 2: Apply `help_01_schema`**

Use the exact DDL from spec §5.2 through §5.6, in that order. The `config.faq_tags_text` wrapper function **must** be created before `config.faq_articles`, because the generated column references it.

Do not substitute `array_to_string` back into the generated column. It is `STABLE`, Postgres requires generated expressions to be `IMMUTABLE`, and the migration will fail with `42P17`.

- [ ] **Step 3: Verify the generated column populates**

```sql
insert into config.faq_categories (audience, slug, name, description, icon_name)
values ('app','tmp','Temp','Temp category','build');

insert into config.faq_articles (category_id, slug, question, answer, tags, status)
select id, 'tmp-article', 'Why did my guest not get their invitation?',
       'Check the country code.', array['link broken'], 'published'
from config.faq_categories where slug = 'tmp';

select search_tsv is not null as populated,
       search_tsv::text
from   config.faq_articles where slug = 'tmp-article';
```

Expected: `populated = true`, and the `search_tsv` text contains `'invit':8A` style weighted lexemes.

- [ ] **Step 4: Apply `help_02_rls_and_grants`**

Use the exact DDL from spec §5.9 — the `grant usage`/`grant select` statements, `alter table ... enable row level security` on all five tables, and the three `create policy` statements.

`help_queries` and `faq_article_feedback` get **no policy**. With row-level security enabled and no policy present, every client role is denied and only `service_role` reaches them. That is deliberate and matches `guest_lookup_attempts` from decision D51.

- [ ] **Step 5: Verify RLS actually denies**

```sql
set local role anon;
select count(*) from config.faq_articles;           -- expect 1 (published)
select count(*) from public.help_queries;           -- expect: permission denied
reset role;
```

- [ ] **Step 6: Apply `help_03_functions_and_cron`**

Use the exact DDL from spec §5.9 for the four `updated_at` triggers, `public.generate_ticket_reference()` with its three-role revoke and its trigger, `create extension if not exists pg_cron;`, and the `cron.schedule` call.

- [ ] **Step 7: Verify the reference generator and clean up**

```sql
select public.generate_ticket_reference is not null;
select cron.jobname from cron.job where jobname = 'help_queries_retention';

delete from config.faq_articles where slug = 'tmp-article';
delete from config.faq_categories where slug = 'tmp';
```

- [ ] **Step 8: Run the security advisor**

Run `get_advisors` with type `security` through the Supabase MCP.

Expected: no new findings. This is the only check that observes actually-granted privileges rather than the SQL that intended to set them, and it is how decisions D50 and D51's gaps were caught. If it flags `generate_ticket_reference` as executable by `anon` or `authenticated`, the revoke did not take — re-run it naming all three roles explicitly.

- [ ] **Step 9: Regenerate types and commit**

```bash
# via Supabase MCP generate_typescript_types, written to:
#   lib/supabase/database.types.ts
git add lib/supabase/database.types.ts
git commit -m "feat(db): help centre schema, RLS, reference generator and retention job"
```

---

## Task 6: Seed content

**Files:**
- Migration: `help_04_seed_categories`
- Create: `docs/help-content/authoring-brief.md`
- Create: `docs/help-content/question-list.md`

- [ ] **Step 1: Seed the ten categories**

Insert the six app-corpus categories and four public-corpus categories exactly as tabulated in spec §5.2, with `display_order` matching the listed order and `enabled = true` for all ten.

- [ ] **Step 2: Write the authoring brief**

Create `docs/help-content/authoring-brief.md` for Brindo and Sree. It must contain:

- **Tone.** Warm, direct, second person. Contractions. No apologising. Never "simply" or "just".
- **Length.** Under 300 words per answer, per `support-best-practices.md` §5.1.
- **Format.** Markdown. Numbered lists for anything multi-step. No raw HTML — it is stripped at render.
- **Tags are required, not optional.** Every article needs three to five synonym tags covering the words a user would actually type. Full-text search matches word roots; a user typing "my link is broken" will not reach an article titled "Regenerating an RSVP link" unless `link broken` is a tag. This is the single manual lever that makes search work.
- **The do-not-promise list**, copied from spec §9.4 verbatim.
- **Sources.** `platform-policies.md` §2–8 is user-facing prose and can be adapted directly. `support-best-practices.md` §3, §4 and §6 are **internal** — mine them for the questions users ask, never for the answers, because they contain ClickUp references and internal escalation paths.
- **Review.** Two-person rule from `support-best-practices.md` §5.4. One writes, the other reviews, then `status` moves to `published`.
- **Publishing.** Articles are rows in `config.faq_articles`. Until the admin panel exists, they are inserted by migration or edited in the Supabase dashboard.

- [ ] **Step 3: Write the question list**

Create `docs/help-content/question-list.md` with roughly five questions per category, mined from `support-best-practices.md` §3 and `platform-policies.md`. Questions are phrased as a user would ask them, not as the team would title them — "Why didn't I get my OTP?" rather than "OTP troubleshooting". Include a suggested tag set per question.

- [ ] **Step 4: Seed the exemplar articles**

Write and seed three articles for the app corpus and two for the public corpus, fully written, establishing tone and length. These are what Brindo and Sree pattern-match against. Every one must pass the do-not-promise list.

- [ ] **Step 5: Commit**

```bash
git add docs/help-content/
git commit -m "docs(help-content): authoring brief, question list and exemplar articles"
```

---

## Task 7: Search function and library

Implements spec §6. **This refines §6.2:** the ranking query cannot be expressed through PostgREST, and it needs `pg_trgm.word_similarity_threshold` set per statement, so it ships as a Postgres function rather than a client-built query.

The function is `SECURITY INVOKER` — the default, stated explicitly — so the `status = 'published'` row-level-security predicate still applies to the caller. Getting this backwards would expose draft articles. It is granted to `anon` and `authenticated`, which is correct for a guest-facing surface and is the deliberate exception to the revoke rule in the Global Constraints.

**Files:**
- Migration: `help_05_search_function`
- Create: `lib/help/types.ts`
- Create: `lib/help/search.ts`
- Create: `__tests__/lib/help/search.test.ts`

**Interfaces:**
- Consumes: tables from Task 5
- Produces:
  - SQL: `config.search_faq(p_query text, p_audience text, p_limit int) returns table(...)`
  - TS: `HELP_CONFIDENCE_THRESHOLD: number`, `type HelpSearchRow`, `type HelpSearchResult`, `shapeSearchResults(rows: HelpSearchRow[]): HelpSearchResult`

- [ ] **Step 1: Apply the search function migration**

```sql
create or replace function config.search_faq(
  p_query    text,
  p_audience text,
  p_limit    int default 8
)
returns table (
  id uuid, slug text, question text,
  category_slug text, category_name text,
  fts_score real, trgm_score real, combined real
)
language plpgsql
security invoker           -- MUST stay invoker so RLS applies to the caller
set search_path = ''
as $$
declare
  v_tsq tsquery;
begin
  -- 0.5, not the 0.6 default: the verified typo case scores 0.571 and
  -- would fail at the default. See spec section 6.2.
  set local pg_trgm.word_similarity_threshold = 0.5;

  -- Build the query from lexemes, never from parsed tsquery text.
  -- to_tsvector parses no operators, so negation cannot invert.
  select (select string_agg(lexeme, ' | ')
          from unnest(pg_catalog.to_tsvector('english', p_query)))::tsquery
  into   v_tsq;

  return query
  select a.id, a.slug, a.question,
         c.slug, c.name,
         coalesce(pg_catalog.ts_rank(a.search_tsv, v_tsq, 32), 0)::real,
         extensions.word_similarity(p_query, a.question)::real,
         (coalesce(pg_catalog.ts_rank(a.search_tsv, v_tsq, 32), 0) * 2.0
          + extensions.word_similarity(p_query, a.question))::real
  from   config.faq_articles a
  join   config.faq_categories c on c.id = a.category_id
  where  a.status = 'published'
    and  c.enabled = true
    and  c.audience = p_audience
    and  ((v_tsq is not null and a.search_tsv @@ v_tsq)
          or p_query <% a.question)
  order  by 8 desc
  limit  greatest(1, least(p_limit, 20));
end; $$;

grant execute on function config.search_faq(text, text, int) to anon, authenticated;
```

`extensions.word_similarity` is schema-qualified because `pg_trgm` lives in `extensions` and `search_path` is empty. Decision D51 records that a bare `digest(...)` failed for exactly this reason.

- [ ] **Step 2: Verify the two regression cases against the live function**

```sql
-- negation must not widen the result set
select count(*) as with_negation    from config.search_faq('invite -whatsapp', 'app', 20);
select count(*) as without_negation from config.search_faq('invite', 'app', 20);
-- stopwords only must return zero rows and not error
select count(*) as stopwords_only   from config.search_faq('the and or of', 'app', 20);
```

Expected: `with_negation <= without_negation`, and `stopwords_only = 0` with no error raised.

- [ ] **Step 3: Write the failing test**

```typescript
// __tests__/lib/help/search.test.ts
import { describe, it, expect } from 'vitest'
import {
  HELP_CONFIDENCE_THRESHOLD,
  shapeSearchResults,
} from '@/lib/help/search'
import type { HelpSearchRow } from '@/lib/help/types'

function row(over: Partial<HelpSearchRow> = {}): HelpSearchRow {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    slug: 'why-no-invitation',
    question: 'Why didn’t my guest get their invitation?',
    category_slug: 'managing-guests',
    category_name: 'Managing Guests',
    fts_score: 0.49,
    trgm_score: 0.55,
    combined: 1.53,
    ...over,
  }
}

describe('HELP_CONFIDENCE_THRESHOLD', () => {
  it('is 0.8, the value the measured separation supports', () => {
    expect(HELP_CONFIDENCE_THRESHOLD).toBe(0.8)
  })
})

describe('shapeSearchResults', () => {
  it('marks a confident result set as confident', () => {
    const out = shapeSearchResults([row()])
    expect(out.confident).toBe(true)
    expect(out.results).toHaveLength(1)
    expect(out.topScore).toBe(1.53)
  })

  it('is not confident when the best score is below the threshold', () => {
    const out = shapeSearchResults([row({ combined: 0.43 })])
    expect(out.confident).toBe(false)
    expect(out.results).toHaveLength(0)
  })

  it('drops individual rows below the threshold but keeps those above', () => {
    const out = shapeSearchResults([row({ combined: 1.53 }), row({ combined: 0.2, slug: 'weak' })])
    expect(out.results.map((r) => r.slug)).toEqual(['why-no-invitation'])
  })

  it('handles an empty row set without throwing', () => {
    const out = shapeSearchResults([])
    expect(out.confident).toBe(false)
    expect(out.results).toEqual([])
    expect(out.topScore).toBeNull()
  })

  it('reports resultCount as the number of rows shown, not rows returned', () => {
    const out = shapeSearchResults([row({ combined: 1.5 }), row({ combined: 0.1, slug: 'weak' })])
    expect(out.resultCount).toBe(1)
  })
})
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm run test:run -- __tests__/lib/help/search.test.ts`
Expected: FAIL — `Cannot find module '@/lib/help/search'`

- [ ] **Step 5: Write the types**

```typescript
// lib/help/types.ts
export type HelpAudience = 'public' | 'app'

export interface HelpSearchRow {
  id: string
  slug: string
  question: string
  category_slug: string
  category_name: string
  fts_score: number
  trgm_score: number
  combined: number
}

export interface HelpSearchResultItem {
  id: string
  slug: string
  question: string
  categorySlug: string
  categoryName: string
}

export interface HelpSearchResult {
  results: HelpSearchResultItem[]
  confident: boolean
  topScore: number | null
  resultCount: number
}

export interface HelpCategory {
  slug: string
  name: string
  description: string
  iconName: string
  articleCount: number
}

export interface HelpArticle {
  id: string
  slug: string
  question: string
  answer: string
  categorySlug: string
  categoryName: string
  updatedAt: string
}
```

- [ ] **Step 6: Write the library**

```typescript
// lib/help/search.ts
import type { HelpSearchRow, HelpSearchResult } from './types'

/**
 * Minimum combined score for a result to be shown.
 *
 * On the verified corpus the correct answer scored above 1.0 while every
 * unrelated article scored below 0.45. Showing weak results is worse than
 * showing none: it teaches the user that search does not work here and it
 * suppresses the escalation path they actually need. See spec section 6.5.
 *
 * Calibrate against real help_queries rows during the dogfood week.
 */
export const HELP_CONFIDENCE_THRESHOLD = 0.8

/** Maximum characters accepted from the search box. Mirrors the DB CHECK. */
export const HELP_QUERY_MAX_LENGTH = 300

/** Minimum characters before a search fires at all. */
export const HELP_QUERY_MIN_LENGTH = 3

export function shapeSearchResults(rows: HelpSearchRow[]): HelpSearchResult {
  const kept = rows.filter((r) => r.combined >= HELP_CONFIDENCE_THRESHOLD)
  return {
    results: kept.map((r) => ({
      id: r.id,
      slug: r.slug,
      question: r.question,
      categorySlug: r.category_slug,
      categoryName: r.category_name,
    })),
    confident: kept.length > 0,
    topScore: rows.length > 0 ? rows[0].combined : null,
    resultCount: kept.length,
  }
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test:run -- __tests__/lib/help/search.test.ts`
Expected: PASS, 6 tests

- [ ] **Step 8: Commit**

```bash
git add lib/help/ __tests__/lib/help/ lib/supabase/database.types.ts
git commit -m "feat(help): search function and result-shaping library"
```

---

## Task 8: Validation schemas

**Files:**
- Create: `lib/validations/help.ts`
- Create: `__tests__/lib/validations/help.test.ts`

**Interfaces:**
- Produces: `helpSearchSchema`, `createTicketSchema`, `feedbackSchema`, `queryOutcomeSchema`

- [ ] **Step 1: Write the failing test**

```typescript
// __tests__/lib/validations/help.test.ts
import { describe, it, expect } from 'vitest'
import { createTicketSchema, helpSearchSchema, feedbackSchema } from '@/lib/validations/help'

describe('createTicketSchema', () => {
  const valid = {
    email: 'host@example.com',
    message: 'I cannot find where to add a guest to my event at all.',
    topicSlug: 'managing-guests',
  }

  it('accepts a valid ticket', () => {
    expect(createTicketSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects a message under 20 characters, matching the DB CHECK', () => {
    expect(createTicketSchema.safeParse({ ...valid, message: 'too short' }).success).toBe(false)
  })

  it('rejects a message over 2000 characters, matching the DB CHECK', () => {
    expect(
      createTicketSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).success
    ).toBe(false)
  })

  it('rejects a malformed email', () => {
    expect(createTicketSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false)
  })

  it('allows topicSlug to be omitted', () => {
    const { topicSlug: _omitted, ...rest } = valid
    expect(createTicketSchema.safeParse(rest).success).toBe(true)
  })

  it('strips a client-supplied user_id rather than trusting it', () => {
    const parsed = createTicketSchema.parse({ ...valid, user_id: 'attacker-supplied' })
    expect('user_id' in parsed).toBe(false)
  })
})

describe('helpSearchSchema', () => {
  it('rejects a query under 3 characters', () => {
    expect(helpSearchSchema.safeParse({ q: 'ab' }).success).toBe(false)
  })

  it('rejects a query over 300 characters, matching the DB CHECK', () => {
    expect(helpSearchSchema.safeParse({ q: 'x'.repeat(301) }).success).toBe(false)
  })

  it('accepts a normal query', () => {
    expect(helpSearchSchema.safeParse({ q: 'my guest didnt get the invite' }).success).toBe(true)
  })
})

describe('feedbackSchema', () => {
  it('requires helpful to be a boolean', () => {
    expect(feedbackSchema.safeParse({ articleSlug: 'a-slug', helpful: 'yes' }).success).toBe(false)
    expect(feedbackSchema.safeParse({ articleSlug: 'a-slug', helpful: true }).success).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:run -- __tests__/lib/validations/help.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write the schemas**

```typescript
// lib/validations/help.ts
import { z } from 'zod'
import { HELP_QUERY_MAX_LENGTH, HELP_QUERY_MIN_LENGTH } from '@/lib/help/search'

/**
 * Every schema below uses a strict object shape so unknown keys are stripped.
 * Identity fields are never present here by design — user_id and audience are
 * derived server-side. See spec section 8.6.
 */

export const helpSearchSchema = z.object({
  q: z.string().trim().min(HELP_QUERY_MIN_LENGTH).max(HELP_QUERY_MAX_LENGTH),
})

export const createTicketSchema = z.object({
  email: z.string().trim().email().max(320),
  message: z.string().trim().min(20).max(2000),
  topicSlug: z.string().trim().toLowerCase().max(64).optional(),
  articleSlug: z.string().trim().max(128).optional(),
  pageUrl: z.string().trim().max(2048).optional(),
})

export const feedbackSchema = z.object({
  articleSlug: z.string().trim().min(1).max(128),
  helpful: z.boolean(),
})

export const queryOutcomeSchema = z.object({
  resolved: z.boolean().optional(),
  escalated: z.boolean().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type FeedbackInput = z.infer<typeof feedbackSchema>
```

Zod strips unknown keys by default on a plain object schema, which is what makes the `user_id` test pass — a client-supplied identity field simply never reaches the insert.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:run -- __tests__/lib/validations/help.test.ts`
Expected: PASS, 10 tests

- [ ] **Step 5: Commit**

```bash
git add lib/validations/help.ts __tests__/lib/validations/help.test.ts
git commit -m "feat(help): request validation schemas"
```

---

## Task 9: Search API route

**Files:**
- Create: `app/api/help/search/route.ts`
- Create: `__tests__/api/help/search.test.ts`

**Interfaces:**
- Consumes: `helpSearchSchema`, `shapeSearchResults`, `config.search_faq`
- Produces: `POST /api/help/search` → `{ results, confident, queryRef }`

- [ ] **Step 1: Write the route**

```typescript
// app/api/help/search/route.ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { helpSearchSchema } from '@/lib/validations/help'
import { shapeSearchResults } from '@/lib/help/search'
import type { HelpSearchRow } from '@/lib/help/types'

export async function POST(request: Request): Promise<NextResponse> {
  try {
    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = helpSearchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }

    // Identity and audience are derived here, never read from the body.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const audience = user ? 'app' : 'public'

    const { data, error } = await supabase.rpc('search_faq', {
      p_query: parsed.data.q,
      p_audience: audience,
      p_limit: 8,
    })

    if (error) {
      console.error('POST /api/help/search rpc failed:', error.message)
      return NextResponse.json({ error: 'Search unavailable' }, { status: 500 })
    }

    const shaped = shapeSearchResults((data ?? []) as HelpSearchRow[])

    // Log the query for the Phase 2 evidence gate. Never log the text itself
    // to the application log — it goes to the database only.
    const service = createServiceClient()
    const { data: logged } = await service
      .from('help_queries')
      .insert({
        user_id: user?.id ?? null,
        audience,
        query: parsed.data.q,
        result_count: shaped.resultCount,
        top_score: shaped.topScore,
      })
      .select('ref')
      .single()

    return NextResponse.json({
      results: shaped.results,
      confident: shaped.confident,
      queryRef: logged?.ref ?? null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

If `lib/supabase/service.ts` does not exist, create it: a `createServiceClient()` returning `createSupabaseClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)` with `auth: { persistSession: false }`. `SUPABASE_SERVICE_ROLE_KEY` is already in the environment for the push-dispatch route.

- [ ] **Step 2: Write the integration test**

```typescript
// __tests__/api/help/search.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const rpc = vi.fn()
const getUser = vi.fn()
const insert = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser }, rpc }),
}))
vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: () => ({
      insert: (...args: unknown[]) => {
        insert(...args)
        return { select: () => ({ single: async () => ({ data: { ref: 'ref-uuid' } }) }) }
      },
    }),
  }),
}))

async function post(body: unknown) {
  const { POST } = await import('@/app/api/help/search/route')
  return POST(new Request('http://localhost/api/help/search', {
    method: 'POST',
    body: JSON.stringify(body),
  }))
}

beforeEach(() => {
  rpc.mockReset(); getUser.mockReset(); insert.mockReset()
  rpc.mockResolvedValue({ data: [], error: null })
})

describe('POST /api/help/search', () => {
  it('searches the public corpus when logged out', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    await post({ q: 'what does evenzi cost' })
    expect(rpc).toHaveBeenCalledWith('search_faq', expect.objectContaining({ p_audience: 'public' }))
  })

  it('searches the app corpus when signed in', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
    await post({ q: 'how do I add a guest' })
    expect(rpc).toHaveBeenCalledWith('search_faq', expect.objectContaining({ p_audience: 'app' }))
  })

  it('never accepts audience or user_id from the request body', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'real-user' } } })
    await post({ q: 'a valid query', audience: 'public', user_id: 'attacker' })
    expect(rpc).toHaveBeenCalledWith('search_faq', expect.objectContaining({ p_audience: 'app' }))
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'real-user' }))
  })

  it('rejects a query under 3 characters', async () => {
    getUser.mockResolvedValue({ data: { user: null } })
    const res = await post({ q: 'ab' })
    expect(res.status).toBe(400)
  })

  it('returns 400 on malformed JSON', async () => {
    const { POST } = await import('@/app/api/help/search/route')
    const res = await POST(new Request('http://localhost/api/help/search', {
      method: 'POST', body: 'not json',
    }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 3: Run the tests**

Run: `npm run test:run -- __tests__/api/help/search.test.ts`
Expected: PASS, 5 tests

- [ ] **Step 4: Commit**

```bash
git add app/api/help/search/route.ts __tests__/api/help/search.test.ts lib/supabase/service.ts
git commit -m "feat(help): search API route with server-derived audience and query logging"
```

---

## Task 10: Ticket, feedback and query-outcome API routes

**Files:**
- Create: `app/api/help/tickets/route.ts`
- Create: `app/api/help/feedback/route.ts`
- Create: `app/api/help/queries/[ref]/route.ts`
- Create: `__tests__/api/help/tickets.test.ts`

**Interfaces:**
- Produces: `POST /api/help/tickets` → `{ reference }` · `POST /api/help/feedback` → `{ success }` · `PATCH /api/help/queries/[ref]` → `{ success }`

- [ ] **Step 1: Write the ticket route**

```typescript
// app/api/help/tickets/route.ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextResponse } from 'next/server'
import { createTicketSchema } from '@/lib/validations/help'

/** Strip query string and fragment — a user who searched their own phone
 *  number would otherwise carry it into the ticket row. Spec section 8.6. */
function stripUrl(raw: string | undefined): string | null {
  if (!raw) return null
  try {
    const u = new URL(raw)
    return `${u.origin}${u.pathname}`
  } catch { return null }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = createTicketSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const service = createServiceClient()

    // Rate limit: 5 tickets per user per hour. Spec section 8.4.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count } = await service
      .from('support_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', since)

    if ((count ?? 0) >= 5) {
      return NextResponse.json(
        { error: 'You have sent several messages recently. Please wait before sending another.' },
        { status: 429 }
      )
    }

    // context is built from an explicit allow-list, never spread from the
    // client. Same discipline as D50's jsonb_build_object. Spec section 8.6.
    const context: Record<string, string> = {}
    if (parsed.data.articleSlug) context.article_slug = parsed.data.articleSlug
    if (parsed.data.topicSlug) context.category_slug = parsed.data.topicSlug

    const { data, error } = await service
      .from('support_tickets')
      .insert({
        user_id: user.id,                       // session identity, never the body
        email: parsed.data.email,
        topic_slug: parsed.data.topicSlug ?? null,
        message: parsed.data.message,
        context,
        page_url: stripUrl(parsed.data.pageUrl),
      })
      .select('reference')
      .single()

    if (error || !data) {
      console.error('POST /api/help/tickets insert failed:', error?.message)
      return NextResponse.json({ error: 'Could not send that just now' }, { status: 500 })
    }

    // Email is best-effort and no-ops while RESEND_API_KEY is unset, per
    // .cursor/rules/resend-deferred.mdc. A failure here must never fail the
    // ticket — the database row is the source of truth.
    // (Wire the Resend call here when keys are configured.)

    return NextResponse.json({ reference: data.reference }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Never `console.error` the message body — spec §8.2.

- [ ] **Step 2: Write the feedback route**

Same shape. Auth optional (`user?.id ?? null`), validate with `feedbackSchema`, resolve `articleSlug` to an `article_id`, then `upsert` on the `(article_id, user_id)` conflict target so a user changing their mind updates rather than inflating the count.

- [ ] **Step 3: Write the query-outcome route**

`PATCH /api/help/queries/[ref]`. Validate with `queryOutcomeSchema`. Update `public.help_queries` **keyed on `ref` only**, never on `id`, and set nothing but `resolved` and `escalated`. Spec §5.5.

- [ ] **Step 4: Write the ticket integration test**

Cover, at minimum: unauthenticated request returns 401; a foreign `user_id` in the body is ignored and the session identity is stored; a message of 19 characters is rejected; `page_url` has its query string stripped; the sixth ticket in an hour returns 429; the response carries a `reference`.

```typescript
it('stores the session identity, not a client-supplied user_id', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'real-user' } }, error: null })
  await post({ email: 'a@b.com', message: 'x'.repeat(30), user_id: 'attacker' })
  expect(insert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'real-user' }))
})

it('strips the query string from page_url', async () => {
  getUser.mockResolvedValue({ data: { user: { id: 'u' } }, error: null })
  await post({
    email: 'a@b.com', message: 'x'.repeat(30),
    pageUrl: 'https://evenzii.com/help?q=9876543210',
  })
  expect(insert).toHaveBeenCalledWith(
    expect.objectContaining({ page_url: 'https://evenzii.com/help' })
  )
})
```

- [ ] **Step 5: Run the tests**

Run: `npm run test:run -- __tests__/api/help/`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add app/api/help/ __tests__/api/help/
git commit -m "feat(help): ticket, feedback and query-outcome routes with server-derived identity"
```

---

## Task 11: Markdown renderer

**Files:**
- Create: `components/help/HelpArticle.tsx`
- Create: `lib/help/markdown.ts`
- Create: `__tests__/lib/help/markdown.test.ts`
- Modify: `package.json`
- Modify: `next.config.js`

**Interfaces:**
- Produces: `renderHelpMarkdown(md: string): Promise<string>` returning sanitised HTML · `<HelpArticle answer />`

Sanitisation runs **server-side, in the render path**. `/help/a/{slug}` must be readable with client JavaScript disabled, so a browser-side pass would ship unsanitised HTML to precisely the forwarded, indexable route the requirement exists for.

- [ ] **Step 1: Install dependencies**

```bash
npm install unified remark-parse remark-rehype rehype-sanitize rehype-stringify
```

- [ ] **Step 2: Write the failing test**

```typescript
// __tests__/lib/help/markdown.test.ts
import { describe, it, expect } from 'vitest'
import { renderHelpMarkdown } from '@/lib/help/markdown'

describe('renderHelpMarkdown', () => {
  it('renders a numbered list as a real ordered list', async () => {
    const html = await renderHelpMarkdown('1. first\n2. second')
    expect(html).toContain('<ol>')
    expect(html).toContain('<li>first</li>')
  })

  it('strips raw HTML', async () => {
    const html = await renderHelpMarkdown('<script>alert(1)</script>hello')
    expect(html).not.toContain('<script>')
    expect(html).toContain('hello')
  })

  it('strips a javascript: URL', async () => {
    const html = await renderHelpMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('strips an entity-encoded javascript: URL', async () => {
    const html = await renderHelpMarkdown('[click](&#106;avascript:alert(1))')
    expect(html.toLowerCase()).not.toContain('javascript:')
  })

  it('strips a data: URI', async () => {
    const html = await renderHelpMarkdown('![x](data:text/html;base64,PHNjcmlwdD4=)')
    expect(html).not.toContain('data:')
  })

  it('strips style attributes', async () => {
    const html = await renderHelpMarkdown('<p style="position:fixed">x</p>')
    expect(html).not.toContain('style=')
  })

  it('strips srcset', async () => {
    const html = await renderHelpMarkdown('<img src="/a.png" srcset="evil.png 2x">')
    expect(html).not.toContain('srcset')
  })

  it('strips svg', async () => {
    const html = await renderHelpMarkdown('<svg><foreignObject><body>x</body></foreignObject></svg>')
    expect(html).not.toContain('<svg')
  })

  it('keeps a normal https link', async () => {
    const html = await renderHelpMarkdown('[docs](https://evenzii.com/help)')
    expect(html).toContain('href="https://evenzii.com/help"')
  })

  it('keeps bold, italic and inline code', async () => {
    const html = await renderHelpMarkdown('**b** _i_ `c`')
    expect(html).toContain('<strong>b</strong>')
    expect(html).toContain('<code>c</code>')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:run -- __tests__/lib/help/markdown.test.ts`
Expected: FAIL — module not found

- [ ] **Step 4: Write the renderer**

```typescript
// lib/help/markdown.ts
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * Explicit allow-list. Everything not named here is stripped.
 * See spec section 8.1 for the full vector list this covers.
 */
const schema = {
  ...defaultSchema,
  tagNames: [
    'p', 'br', 'strong', 'em', 'del', 'code', 'pre',
    'ul', 'ol', 'li', 'blockquote', 'hr',
    'h3', 'h4', 'a',
  ],
  attributes: {
    a: ['href', 'title'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
  clobberPrefix: 'help-',
}

export async function renderHelpMarkdown(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, schema)
    .use(rehypeStringify)
    .process(markdown)
  return String(file)
}
```

`allowDangerousHtml: false` at the parser stage is what removes raw HTML before sanitisation even runs. `tagNames` omits `img`, `svg`, `table` and `iframe` entirely — help answers need none of them, and each is a vector.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:run -- __tests__/lib/help/markdown.test.ts`
Expected: PASS, 10 tests

- [ ] **Step 6: Write the component**

```tsx
// components/help/HelpArticle.tsx
import { renderHelpMarkdown } from '@/lib/help/markdown'

export async function HelpArticle({ answer }: { answer: string }) {
  const html = await renderHelpMarkdown(answer)
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
}
```

`dangerouslySetInnerHTML` is safe here and only here, because the string has been through the allow-list above. Never pass unsanitised content to this component.

- [ ] **Step 7: Add the Content-Security-Policy**

`next.config.js` currently sets no headers at all, which makes the sanitiser a single point of control rather than one layer of several.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['three'],
  async headers() {
    return [
      {
        source: '/help/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

- [ ] **Step 8: Commit**

```bash
git add lib/help/markdown.ts components/help/HelpArticle.tsx \
  __tests__/lib/help/markdown.test.ts next.config.js package.json package-lock.json
git commit -m "feat(help): server-side sanitised markdown renderer and CSP for /help"
```

---

## Task 12: The `/help` pages

All four route compositions. Server-rendered, readable with JavaScript disabled.

**Files:**
- Create: `app/help/page.tsx`, `app/help/[category]/page.tsx`, `app/help/a/[slug]/page.tsx`
- Create: `components/help/HelpCategoryGrid.tsx`, `components/help/HelpContactBand.tsx`
- Modify: `lib/supabase/middleware.ts`

**Interfaces:**
- Consumes: `HelpArticle`, `config.search_faq`, `SUPPORT_MAILTO`

- [ ] **Step 1: Add `/help` to the middleware public paths**

`lib/supabase/middleware.ts` has two public-path lists that have drifted — line 14 uses `startsWith('/auth')` while line 61 uses `=== '/auth'`, and the first list is missing `/invite` entirely. Add `/help` to **both**, using an exact-plus-prefix form so a future `/helpdesk` route is not silently made public:

```typescript
pathname === '/help' || pathname.startsWith('/help/') ||
```

- [ ] **Step 2: Write a middleware test**

```typescript
// add to __tests__/lib/supabase/middleware.test.ts
it('treats /help and its children as public', () => {
  expect(isPublicPath('/help')).toBe(true)
  expect(isPublicPath('/help/managing-guests')).toBe(true)
  expect(isPublicPath('/help/a/why-no-invitation')).toBe(true)
})

it('does not make a /help-prefixed route public by accident', () => {
  expect(isPublicPath('/helpdesk')).toBe(false)
})

it('still redirects a protected route when signed out', () => {
  expect(isPublicPath('/events/abc')).toBe(false)
})
```

- [ ] **Step 3: Build `/help` root**

Server component. Read the viewer's auth state, pick the corpus (`app` when signed in, `public` when not), fetch enabled categories with published article counts, and render:

`.section-head` with eyebrow "SUPPORT" and `h1` "Help Centre" · a search form that submits as a real GET to `/help?q=` so it works without JavaScript · `.dp-tile-grid` of `.dp-tile` category cards using `.dp-tile-link` for the stretched-link pattern · the contact band.

When `searchParams.q` is present, render the results list server-side instead of the category grid.

Do **not** render `<HelpFab />` on this page.

- [ ] **Step 4: Build the contact band**

Two compositions in one component, chosen by auth state. Signed in: `.clay-card` with `h2` "Still need help?", the 24-hour commitment and support hours from `lib/constants/support.ts`, and a `.btn-pill-primary` opening the ticket form. Signed out: "Filing a support ticket needs an Evenzi account, so we know which events to look at", a `.btn-pill-primary` to `/auth?next=/help`, and a `.btn-pill-secondary` to `SUPPORT_MAILTO()`.

Neither path is a disabled button.

- [ ] **Step 5: Build `/help/[category]`**

`.section-head` with an eyebrow linking back to `/help`, then a full `<ul>` of `.list-nav-row` links — every published article, no cap, no pagination. Empty category renders the "Nothing here yet" composition from the UI spec §3 A3-empty.

- [ ] **Step 6: Build `/help/a/[slug]`**

The forwarded, indexable surface. Breadcrumb · `h1` article title, never clamped · meta line with category and "Updated DD/MM/YYYY" · `<HelpArticle answer={...} />` · feedback row · contact band.

Add `generateMetadata` producing Open Graph `title` (the question), `description` (first 150 characters of the answer with Markdown stripped), a static branded `og:image`, and a canonical URL. Return `notFound()` for an unpublished or missing slug.

An app-corpus article opened while logged out renders normally with the logged-out contact band. Do not redirect to `/auth` and do not gate it — no help content is confidential.

- [ ] **Step 7: Verify with JavaScript disabled**

Open `/help/a/{slug}` in the preview browser with JavaScript disabled. Confirm the article body, its numbered lists and its links all render. This is the requirement the server-side sanitisation exists for.

- [ ] **Step 8: Verify responsive behaviour**

Check 360, 390, 768 and 1440px. No horizontal scroll at any width. Screenshot 360 and 1440.

- [ ] **Step 9: Commit**

```bash
git add app/help/ components/help/ lib/supabase/middleware.ts __tests__/lib/supabase/middleware.test.ts
git commit -m "feat(help): /help root, category, search and article pages"
```

---

## Task 13: The Help panel

**Files:**
- Create: `components/help/HelpPanel.tsx`, `components/help/TicketForm.tsx`, `components/help/HelpSearchInput.tsx`
- Modify: `components/layout/HelpFabMount.tsx`

**Interfaces:**
- Consumes: `OverlaySurface`, `HelpArticle`, all four API routes

Build the full state machine from UI spec §3: A0 closed, A1 root, A3 category, A4 answer, A5 searching, A6 results, A6-empty no match, A7 ticket form, A8 submitting, A9 success, A10 navigation. Every state's loading, empty, error and offline variant is specified there — implement them all.

- [ ] **Step 1: Panel frame and root state**

Docked `.dock-panel .dock-panel--origin-br` at ≥768px, `.modal-scrim` bottom sheet below. Wrap in `<OverlaySurface modal={isMobile} />`. Head with back/title/close at 44×44. Six `.list-nav-row` categories, full-width at every breakpoint. Escalate footer always present.

Focus on open lands on the panel title with `tabIndex={-1}`, never the search field — auto-focusing search raises the mobile keyboard and hides two-thirds of the panel.

- [ ] **Step 2: Persist panel position**

Write `{node, categorySlug, articleSlug, query}` to `sessionStorage` on every transition. The panel owns no URL state — pushing history would make browser Back unwind help navigation instead of app navigation. On mobile only, push one throwaway history entry on open so the Android hardware Back button closes the sheet; pop it on close.

On route change the panel closes but the stored node survives, except the ticket form, which always resets to level 0 and discards its draft.

- [ ] **Step 3: Search with debounce**

300ms debounce, fires at 3 characters. Cancel the in-flight request on every keystroke so stale results never render. No spinner under 250ms of latency. `aria-live="polite"` on the results header.

- [ ] **Step 4: No-match state**

The state where the product earns or loses trust. Copy must not apologise, must not blame the user's phrasing, and must never say "I don't understand". Six `.tag-chip` category chips return the user to browsing. The escalate footer's button becomes `.btn-pill-primary` and full-width, above the line "Can't find it? Send us your question and a person will reply."

- [ ] **Step 5: Ticket form and success**

Per UI spec §3 A7–A9. Submit is enabled at all times — a disabled submit gives an already-stuck user a second thing that does not work. On failure, return with every field intact and add a second-failure `mailto:` fallback carrying the message pre-filled.

The success state must never say "check your inbox" or "a confirmation email is on its way". The on-screen reference is the receipt.

- [ ] **Step 6: Wire the FAB**

Lift open/close state into `HelpFabMount`, pass `expanded` to `<HelpFab>`, and render `<HelpPanel>` alongside it.

- [ ] **Step 7: Accessibility walk**

Keyboard only, end to end: Tab order is back → title → close → search → clear → rows → escalate footer. Escape closes. Focus returns to the FAB. On mobile the trap holds; on desktop the page behind stays operable. Then a TalkBack pass on a real Android device.

- [ ] **Step 8: Commit**

```bash
git add components/help/ components/layout/HelpFabMount.tsx
git commit -m "feat(help): help panel with guided browse, search, and ticket escalation"
```

---

## Task 14: Data-model documentation

Per the standing rule, the database, `DATA-MODEL.md` and `ERD.md` change together in the same pull request. This task closes that obligation for Task 5's migration.

**Files:**
- Modify: `docs/data-model/DATA-MODEL.md`, `docs/data-model/ERD.md`, `docs/data-model/evenzi-erd.drawio`
- Modify: `CLAUDE.md`
- Modify: `docs/features/chatbot-overview.md`
- Modify: `docs/ops/platform-policies.md`, `docs/ops/support-best-practices.md`

- [ ] **Step 1: Add the tables to `DATA-MODEL.md`**

A Help Centre module section with all five tables, their DDL, and per-table notes, matching the format of the Guest Management and Media modules. Add the four triggers to the Triggers table, the three policies to the Security section, and the `config.search_faq` and `generate_ticket_reference` functions to the Functions section.

- [ ] **Step 2: Add a decision-log entry**

A `D60` entry recording: content in `config.*` so no admin panel is needed; `audience` as curation not RLS, with the reasoning that `status = 'published'` is the real boundary; the immutable-wrapper requirement for the generated column and why `array_to_tsvector` is not the alternative; the lexeme-built OR query and the negation defect it fixes; `word_similarity` at 0.5 rather than `similarity`; and `help_queries.ref` existing because the D51 bigint precedent does not fully transfer.

- [ ] **Step 3: Update the account-deletion cascade tree**

Add all three `public.*` tables with the behaviour from spec §5.9 — `support_tickets` cascades, `help_queries` nulls its `user_id` **and redacts `query`**, `faq_article_feedback` nulls and retains.

- [ ] **Step 4: Update `ERD.md` and the drawio**

Add the five entities to both the Module Map and the full Mermaid ERD, and to `evenzi-erd.drawio`.

- [ ] **Step 5: Retire the chatbot naming**

Update the `CLAUDE.md` MVP table row from "Support Chatbot (FAQ + Admin + Escalation)" to "Help Centre", and rewrite `docs/features/chatbot-overview.md` — it currently describes a Gemini-and-Groq LLM bot escalating via Resend, a design that was abandoned. Left in place it is exactly the kind of source an automated drafting tool would treat as authoritative.

- [ ] **Step 6: Correct the support address in the ops docs**

Replace `support@evenzi.com` in `platform-policies.md` §7.1 and `support-best-practices.md` §2.2, and `support@evenzi.in` in `docs/foundation/team-structure.md` and `docs/foundation/user-flows.md`, with `support@evenzii.com`. Add search-query text and support-ticket content to `platform-policies.md` §4.1 and the §4.6 retention table, with the ninety-day window — neither is currently disclosed, and §5.1 gives every user the right to know what is held about them.

- [ ] **Step 7: Commit**

```bash
git add docs/ CLAUDE.md
git commit -m "docs(data-model): help centre tables, D60 decision entry, retire chatbot naming"
```

---

## Launch gates — not code

These block launch, not the build. Track them separately.

| Gate | Owner | Spec |
|---|---|---|
| `support@evenzii.com` mailbox created, then set `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel. Until then the interim address is `abhijith@evenzii.com`, which is real and monitored | Founder | §10.1 |
| Ticket-watching arrangement — configure Resend, or build the admin ticket list. **Not** informal Supabase dashboard access, which grants unrestricted read of every table including guest phone numbers and emails | Founder | §10.2 |
| Content delivery date agreed, with a per-category order | Brindo and Sree | §14 |
| Launch minimum: at least three published articles per enabled category, and zero enabled-but-empty categories. Under-served categories ship `enabled = false` rather than empty | Founder | §9.1 |
| `/help/a/{slug}` opened in WhatsApp's Android in-app browser | Anyone | §13 |
| Confidence threshold calibrated against real `help_queries` rows | Founder | §6.5 |

---

## Self-review

**Spec coverage.** §4 audiences → Tasks 6, 9, 12. §5 data model → Tasks 5, 14. §6 search → Task 7. §7 screens → Tasks 12, 13. §8 security → Tasks 9, 10, 11. §9 content → Task 6. §10.1 → Task 1. §10.2 → launch gates. §10.3 → Task 2. §10.4 → Task 3. §10.5 → Task 4. §11 Phase 2 → deliberately not built. §12 build sequence → task order. §13 testing → tests in every task.

**Type consistency.** `HelpSearchRow` fields match the `config.search_faq` return columns exactly. `shapeSearchResults` returns `HelpSearchResult` as declared in `lib/help/types.ts`. `SUPPORT_MAILTO` has one signature, used in Tasks 1, 12 and 13.

**Known deviation from the spec, deliberate.** §6.2 presents the search as an inline query. It ships as `config.search_faq` instead, because the ranking cannot be expressed through PostgREST and `pg_trgm.word_similarity_threshold` must be set per statement. The function is `SECURITY INVOKER` so row-level security still applies, and is granted to `anon` and `authenticated` — the correct exception for a guest-facing surface, and the trap the Security Expert pre-flagged. Fold this back into the spec when Task 14 runs.
