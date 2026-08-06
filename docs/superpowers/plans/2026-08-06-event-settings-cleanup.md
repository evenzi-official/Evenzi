# Event Settings Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up every dead/fake control across the 6 Event Settings tabs, add a new per-event Usage tab, build a reusable full-page busy overlay, and give collaborator roles (already offered in the invite UI but currently cosmetic) real, enforced, tiered permissions at both the API and RLS layers.

**Architecture:** Small independent UI/CSS/copy fixes first (fast, low-risk, most can be built in parallel) → one shared `BusyOverlay` component wired into every Save/Delete action → the permissions system last, as its own multi-task block, because it's the only item touching RLS and every event-scoped API route → a read-only Usage tab that reuses existing aggregates, no new backend.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Supabase (Postgres + RLS), Vitest, Tailwind + the shared `designs/shared/shell.css` class system the whole app already imports (`app/globals.css:2`).

## Global Constraints

- Every new/modified API route follows the existing convention exactly: `uuidSchema.safeParse` on the event id → auth check → ownership/capability check → zod body validation → typed `NextResponse` with `{ error, details? }` on failure.
- No inline CSS or JS in `designs/**` files — generic styles go in `designs/shared/shell.css`, page-specific in the page's own `.css` (per `CLAUDE.md`).
- Every new shared UI primitive gets catalogued in `designs/components.html` in the same change that introduces it (per `CLAUDE.md`'s Component Reuse rule).
- `npm run test:run` and `npx tsc --noEmit` must stay clean after every task.
- Owner-only actions (Delete event, Plan & Billing writes) stay hardcoded to `events.user_id = auth.uid()` — never routed through the capability system, per spec §7.

---

## Part A — Independent small fixes (any order, can run in parallel)

### Task 1: Website tab — strip the duplicate Pages/live-link surface

**Files:**
- Modify: `app/events/[id]/settings/website/WebsiteContent.tsx:100-223` (header actions + Pages section)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing new (pure deletion + one link)

- [ ] **Step 1: Remove the dead "View live site" link and the entire "Pages" section**

In `WebsiteContent.tsx`, delete the `<a className="btn-pill btn-pill-secondary" href="#">View live site</a>` block (lines 109-112) and the whole `{/* Pages */}` `<section>` block (lines 195-223).

- [ ] **Step 2: Replace with a single link into the real editor**

Add, immediately after the closing `</section>` of "Search engine indexing" (was line 193) and before "Announcement banner":

```tsx
        {/* Manage website content */}
        <section className="es-section">
          <header className="es-section-head">
            <h2 className="es-section-title">
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">web</span>
              Website content
            </h2>
            <p className="es-section-sub">Pages, design, and photos live in the website editor — not here.</p>
          </header>
          <a href={`/events/${eventId}/website`} className="btn-pill btn-pill-secondary es-btn-self">
            <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
            Manage your website
          </a>
        </section>
```

The now-unused `PAGES` const (lines 20-25) is removed in the same edit.

- [ ] **Step 3: Verify no other file imports `PAGES` from this component**

Run: `grep -rn "PAGES" app/events/\[id\]/settings/website/`
Expected: no matches outside the file just edited (confirms it was local-only, safe to delete).

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/website/WebsiteContent.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/events/\[id\]/settings/website/WebsiteContent.tsx
git commit -m "fix(settings): strip duplicate fake Pages list from Website tab, link to real editor"
```

---

### Task 2: Registry tab — honest "coming soon" relabel

**Files:**
- Modify: `app/events/[id]/settings/registry/RegistryContent.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: nothing (no backend calls added — this tab stays disabled)

- [ ] **Step 1: Replace both fake-save handlers and buttons with the disabled+tooltip pattern already used by Guest Management's "Send invites"**

Reference pattern (`app/events/[id]/guests/GuestManagementClient.tsx:260-261`):
```tsx
<button type="button" className="btn-pill btn-pill-secondary gm-icon-btn gm-send-btn" disabled
  title="WhatsApp sending — coming soon" aria-label="Send WhatsApp invitations (coming soon)">
```

Apply the equivalent to `RegistryContent.tsx`: delete `handleSaveLink`/`handleSaveFund`/`savingLink`/`savingFund` state entirely, and change both buttons to:

```tsx
              <button
                type="button"
                className="btn-pill btn-pill-primary es-btn-self"
                disabled
                title="Registry links — coming soon"
                aria-label="Add link (coming soon)"
              >
                <span aria-hidden="true" className="material-symbols-outlined">add_link</span>
                Add link
              </button>
```

```tsx
              <button
                type="button"
                className="btn-pill btn-pill-primary es-btn-self"
                disabled
                title="Cash funds — coming soon"
                aria-label="Create fund (coming soon)"
              >
                <span aria-hidden="true" className="material-symbols-outlined">add</span>
                Create fund
              </button>
```

- [ ] **Step 2: Disable the input fields too, so the whole section reads as inert, not almost-working**

Add `disabled` to all 5 inputs/textareas (`es-registry-url`, `es-registry-label`, `es-fund-name`, `es-fund-goal`, `es-fund-message`).

- [ ] **Step 3: Update the header copy to set expectations**

Change `<p className="es-content-lead">` from "Add an external registry, set up a cash fund, or do both. Guests pick the option they prefer." to "Registry and cash-fund support is coming soon — check back after launch."

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/registry/RegistryContent.tsx`
Expected: clean (no unused-variable warnings for the removed state).

- [ ] **Step 5: Commit**

```bash
git add app/events/\[id\]/settings/registry/RegistryContent.tsx
git commit -m "fix(settings): relabel Registry tab as coming-soon instead of fake-saving"
```

---

### Task 3: Guest RSVP route — enforce plus-ones/dietary toggles server-side

**Files:**
- Modify: `app/api/e/[slug]/rsvp/route.ts`
- Test: `__tests__/api/e/[slug]/rsvp.test.ts` (new)

**Interfaces:**
- Consumes: `event_guest_settings` table (`allow_plus_ones: boolean`, `collect_dietary_notes: boolean`), existing `submit_rsvp` RPC (unchanged)
- Produces: nothing new — this is defense on an existing route (see spec §4: no guest-facing form calls this route yet; this makes it safe for whenever one does)

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => ({ value: 'session-token-abc' }) }),
}))

import { POST } from '@/app/api/e/[slug]/rsvp/route'

const SLUG = 'anya-kabir-20270131'

function makeSupabaseMock(opts: { allowPlusOnes: boolean; collectDietary: boolean; rsvpError?: { message: string } }) {
  return {
    rpc: vi.fn().mockImplementation((fn: string) => {
      if (fn === 'submit_rsvp') {
        return Promise.resolve({ error: opts.rsvpError ?? null })
      }
      return Promise.resolve({ data: null, error: null })
    }),
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { allow_plus_ones: opts.allowPlusOnes, collect_dietary_notes: opts.collectDietary },
        error: null,
      }),
    }),
  }
}

function makeRequest(body: Record<string, unknown>) {
  return new Request(`http://localhost/api/e/${SLUG}/rsvp`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ slug: SLUG }) }

describe('POST /api/e/[slug]/rsvp — guest-settings enforcement', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects plus_one_count when allow_plus_ones is false', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ allowPlusOnes: false, collectDietary: true }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      plus_one_count: 1,
    }), ctx)
    expect(res.status).toBe(400)
  })

  it('rejects dietary_notes when collect_dietary_notes is false', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ allowPlusOnes: true, collectDietary: false }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      dietary_notes: 'vegetarian',
    }), ctx)
    expect(res.status).toBe(400)
  })

  it('accepts both fields when both toggles are on', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ allowPlusOnes: true, collectDietary: true }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      plus_one_count: 2,
      dietary_notes: 'vegan',
    }), ctx)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run the tests, confirm they fail**

Run: `npx vitest run __tests__/api/e/\[slug\]/rsvp.test.ts`
Expected: FAIL — route currently accepts both fields unconditionally, so the 400-expecting tests fail.

- [ ] **Step 3: Implement the enforcement**

In `app/api/e/[slug]/rsvp/route.ts`, after the existing zod `parsed` check and before the `supabase.rpc('submit_rsvp', ...)` call, resolve the event id from the token's session first — actually the route only has `token` + `slug`, not `event_id`, directly. Read guest settings via a join through the slug instead:

```typescript
    const { sub_event_id, response_status, plus_one_count, dietary_notes } = parsed.data

    const supabase = await createClient()

    if (plus_one_count !== undefined || dietary_notes !== undefined) {
      const { data: settings } = await supabase
        .from('event_guest_settings')
        .select('allow_plus_ones, collect_dietary_notes')
        .eq('event_id', (await supabase.from('events').select('id').eq('slug', slug).single()).data?.id ?? '')
        .single()

      if (plus_one_count !== undefined && settings?.allow_plus_ones === false) {
        return NextResponse.json({ error: 'Plus-ones are not enabled for this event' }, { status: 400 })
      }
      if (dietary_notes !== undefined && settings?.collect_dietary_notes === false) {
        return NextResponse.json({ error: 'Dietary notes are not collected for this event' }, { status: 400 })
      }
    }

    const { error } = await supabase.rpc('submit_rsvp', {
```

- [ ] **Step 4: Run the tests, confirm they pass**

Run: `npx vitest run __tests__/api/e/\[slug\]/rsvp.test.ts`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Full test suite + typecheck**

Run: `npm run test:run && npx tsc --noEmit`
Expected: clean, no regressions.

- [ ] **Step 6: Commit**

```bash
git add app/api/e/\[slug\]/rsvp/route.ts __tests__/api/e/\[slug\]/rsvp.test.ts
git commit -m "fix(rsvp): enforce event_guest_settings plus-ones/dietary toggles server-side"
```

---

### Task 4: Dead "contact/guide" buttons → real mailto

**Files:**
- Modify: `app/events/[id]/settings/GeneralSettingsForm.tsx:325-328`
- Modify: `app/events/[id]/settings/billing/page.tsx` (the "Questions about your plan?" help card button — locate exact lines via the grep in Step 1)
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx:146-149`
- Modify: `app/events/[id]/settings/guests/GuestListContent.tsx:172-175`

**Interfaces:**
- Consumes: nothing
- Produces: nothing (reuses the existing `mailto:evenzi.official@gmail.com` pattern from `components/layout/PageFooter.tsx:19`)

- [ ] **Step 1: Locate the exact billing-tab button**

Run: `grep -n "Contact support\|support" app/events/\[id\]/settings/billing/page.tsx`

- [ ] **Step 2: Change all 4 buttons from `<button>` to `<a>` with the real mailto**

Pattern for each (General tab example — apply identically at the other 3 locations, same button content, changing only the outer tag):

Before (`GeneralSettingsForm.tsx:325-328`):
```tsx
          <button type="button" className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
            Contact support
          </button>
```

After:
```tsx
          <a href="mailto:evenzi.official@gmail.com" className="btn-pill btn-pill-secondary">
            <span aria-hidden="true" className="material-symbols-outlined">support_agent</span>
            Contact support
          </a>
```

Same transform for:
- `billing/page.tsx`'s support button (icon/copy unchanged, `<button>` → `<a href="mailto:evenzi.official@gmail.com">`)
- `AdminsContent.tsx:146-149` ("Read the guide" → keep label, same mailto — there's no actual guide doc yet, so route it to support instead of a dead anchor)
- `GuestListContent.tsx:172-175` ("View the guide" → same treatment)

- [ ] **Step 3: Typecheck and lint all 4 files**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/GeneralSettingsForm.tsx app/events/[id]/settings/billing/page.tsx app/events/[id]/settings/admins/AdminsContent.tsx app/events/[id]/settings/guests/GuestListContent.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/events/\[id\]/settings/GeneralSettingsForm.tsx app/events/\[id\]/settings/billing/page.tsx app/events/\[id\]/settings/admins/AdminsContent.tsx app/events/\[id\]/settings/guests/GuestListContent.tsx
git commit -m "fix(settings): wire 4 dead contact/guide buttons to the real support mailto"
```

---

### Task 5: General tab — dark date picker, remove two orphaned fields

**Files:**
- Modify: `designs/shared/shell.css` (near `.form-input`, ~line 1226)
- Modify: `app/events/[id]/settings/GeneralSettingsForm.tsx`
- Modify: `app/api/events/[id]/general-settings/route.ts`
- Modify: `docs/data-model/DATA-MODEL.md` (decision-log note)

**Interfaces:**
- Consumes: nothing new
- Produces: nothing new — this removes 2 fields from the write payload, doesn't add any

- [ ] **Step 1: Fix the native date-picker theming**

In `designs/shared/shell.css`, immediately after the existing `.form-input{...}` block (~line 1226-1236), add:

```css
.form-input[type="date"],
.form-input[type="time"],
.form-input[type="datetime-local"]{color-scheme:dark}
```

- [ ] **Step 2: Remove `show_on_dashboard` — UI**

In `GeneralSettingsForm.tsx`:
- Delete the `showOnDashboard` state (line 46) and its `setShowOnDashboard` usage.
- Delete the entire "Event list rules" `<section>` (lines 291-317).
- Remove `showOnDashboard` from `event.showOnDashboard` and the `GeneralSettingsEvent` interface (line 24).
- Remove `show_on_dashboard` from the `handleSave` payload (line 143).

- [ ] **Step 3: Remove `discoverable` — UI**

Same file: delete the `discoverable`/`setDiscoverable` state (line 47), remove `discoverable` from `GeneralSettingsEvent` (line 25) and from the save payload (line 144). There is no UI control to delete for this one — it was never rendered (that's the bug being fixed).

- [ ] **Step 4: Remove both fields from the API route's accepted schema**

In `app/api/events/[id]/general-settings/route.ts`, change:

```typescript
const patchSchema = z.object({
  tagline:          z.string().max(80).nullable().optional(),
  show_on_dashboard: z.boolean().optional(),
  discoverable:     z.boolean().optional(),
}).strict()
```

to:

```typescript
const patchSchema = z.object({
  tagline: z.string().max(80).nullable().optional(),
}).strict()
```

And remove the corresponding `if (show_on_dashboard !== undefined) ...` / `if (discoverable !== undefined) ...` lines from the upsert-building block, and from the destructure (`const { tagline, show_on_dashboard, discoverable } = parsed.data` → `const { tagline } = parsed.data`).

- [ ] **Step 5: Find and update the server component that passes these two fields into the form**

Run: `grep -rn "showOnDashboard\|discoverable" app/events/\[id\]/settings/page.tsx`

Remove the two fields from wherever `GeneralSettingsEvent` is constructed in that file (the server component reading `event_general_settings` to build the `event` prop).

- [ ] **Step 6: Document the now-inert DB columns**

Append to `docs/data-model/DATA-MODEL.md`'s decision log:

```markdown
| D55 | **`event_general_settings.show_on_dashboard` and `.discoverable` are now unused by design.** `show_on_dashboard` was write-only (no reader anywhere, and even wired it had no path back to a hidden event — no "Hidden events" view exists). `discoverable` was a fully wired round-trip field with no UI control that ever set it. Both removed from `general-settings/route.ts`'s accepted schema and the settings form on 2026-08-06 — columns left in place (nullable-safe, `boolean not null default false/true`), no migration, revisit if a real "hide from dashboard" feature gets designed later. | Dropping columns for genuinely-dead-but-harmless fields isn't worth a migration; removing the API/UI surface is enough. Per Event Settings Cleanup spec §6. |
```

- [ ] **Step 7: Typecheck, lint, run tests**

Run: `npx tsc --noEmit && npm run test:run`
Expected: clean. If any existing test in `__tests__/` references `show_on_dashboard`/`discoverable` on this route, update it to match the new schema.

- [ ] **Step 8: Commit**

```bash
git add designs/shared/shell.css app/events/\[id\]/settings/GeneralSettingsForm.tsx app/events/\[id\]/settings/page.tsx app/api/events/\[id\]/general-settings/route.ts docs/data-model/DATA-MODEL.md
git commit -m "fix(settings): dark-theme the date picker, drop two orphaned General-tab fields"
```

---

### Task 6: Remove the duplicate inline footer from all 6 settings tabs

**Files:**
- Modify: `app/events/[id]/settings/GeneralSettingsForm.tsx:357-364`
- Modify: `app/events/[id]/settings/website/WebsiteContent.tsx` (footer block, post-Task-1 line numbers)
- Modify: `app/events/[id]/settings/registry/RegistryContent.tsx:171-178`
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx:152-159`
- Modify: `app/events/[id]/settings/guests/GuestListContent.tsx` (footer block — locate via grep)
- Modify: `app/events/[id]/settings/billing/page.tsx` (footer block — locate via grep)

**Interfaces:**
- Consumes: `components/layout/PageFooter.tsx` (already rendered by every `page.tsx` wrapper in this section — confirmed in spec §8)
- Produces: nothing

- [ ] **Step 1: Confirm every wrapper already renders `<PageFooter />`**

Run: `grep -rl "PageFooter" app/events/\[id\]/settings --include="*.tsx"`
Expected: `page.tsx`, `admins/page.tsx`, `billing/page.tsx`, `website/page.tsx`, `guests/page.tsx`, `registry/page.tsx` — all 6.

- [ ] **Step 2: Delete the inline `<footer className="es-footer">...</footer>` block from each of the 6 tab components**

Same shape everywhere, e.g. (`GeneralSettingsForm.tsx:357-364`):
```tsx
        <footer className="es-footer">
          <span>© 2026 Evenzi · All rights reserved</span>
          <div className="es-footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Help</a>
          </div>
        </footer>
```
Delete this block from all 6 files. Leave the `.es-footer` CSS rule in `designs/pages/event-settings/event-settings.css` untouched (harmless if unused, not worth a separate cleanup in this task).

- [ ] **Step 3: Typecheck, lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/**/*.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/events/\[id\]/settings
git commit -m "fix(settings): remove duplicate inline footer from all 6 tabs, keep shared PageFooter"
```

---

## Part B — Shared busy overlay (build once, wire everywhere)

### Task 7: Build the `BusyOverlay` component

**Files:**
- Create: `components/ui/BusyOverlay.tsx`
- Modify: `designs/shared/shell.css` (new primitive)
- Modify: `designs/components.html` (catalog entry)

**Interfaces:**
- Produces: `<BusyOverlay active={boolean} label?={string} />` — a default export-free named component, viewport-covering, `aria-busy`, blocks pointer events on everything behind it including nav.

- [ ] **Step 1: Add the CSS primitive**

In `designs/shared/shell.css`, near the existing `.modal-scrim` rule (search `grep -n "\.modal-scrim{" designs/shared/shell.css` for the exact line), add a new block:

```css
.busy-overlay{
  position:fixed;inset:0;z-index:9999;
  display:flex;align-items:center;justify-content:center;
  background:color-mix(in oklab, var(--bg, #0d0d0d) 72%, transparent);
  backdrop-filter:blur(2px);
  opacity:0;pointer-events:none;
  transition:opacity .15s ease;
}
.busy-overlay.is-active{opacity:1;pointer-events:all}
.busy-overlay-card{
  display:flex;flex-direction:column;align-items:center;gap:12px;
  padding:24px 32px;border-radius:16px;
  background:var(--card, #18181b);border:1px solid var(--line, #2a2a2a);
  box-shadow:var(--shadow-clay);
}
.busy-overlay-spinner{
  width:28px;height:28px;border-radius:999px;
  border:3px solid var(--line, #2a2a2a);border-top-color:var(--brand, #ee3f3a);
  animation:busy-spin .7s linear infinite;
}
.busy-overlay-label{font-size:13px;font-weight:600;color:var(--ink-soft, #e5e7eb)}
@keyframes busy-spin{to{transform:rotate(360deg)}}
```

- [ ] **Step 2: Write the component**

```tsx
'use client'

interface BusyOverlayProps {
  active: boolean
  label?: string
}

export function BusyOverlay({ active, label = 'Saving…' }: BusyOverlayProps) {
  return (
    <div className={`busy-overlay${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div className="busy-overlay-card" role="status" aria-live="polite" aria-busy={active}>
        <span className="busy-overlay-spinner" aria-hidden="true" />
        <span className="busy-overlay-label">{label}</span>
      </div>
    </div>
  )
}
```

Save to `components/ui/BusyOverlay.tsx`.

- [ ] **Step 3: Catalog it**

In `designs/components.html`, add an entry in the same section pattern as the existing `.modal-scrim`/`.bc-toast` entries (find the section via `grep -n "modal-scrim\|bc-toast" designs/components.html` to match the existing format) documenting: purpose (full-page interaction block during an in-flight save/delete), the two CSS classes, and the React usage snippet from Step 2.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (component isn't wired into anything yet, so no visual verification possible until Tasks 8-9).

- [ ] **Step 5: Commit**

```bash
git add components/ui/BusyOverlay.tsx designs/shared/shell.css designs/components.html
git commit -m "feat(ui): add reusable BusyOverlay primitive, catalog in components.html"
```

---

### Task 8: Wire BusyOverlay into General tab; fix dual-save error handling

**Files:**
- Modify: `app/events/[id]/settings/GeneralSettingsForm.tsx`

**Interfaces:**
- Consumes: `BusyOverlay` from `components/ui/BusyOverlay.tsx` (Task 7)
- Produces: nothing new

- [ ] **Step 1: Import and render the overlay**

Add `import { BusyOverlay } from '@/components/ui/BusyOverlay'` and render `<BusyOverlay active={saving} label="Saving changes…" />` and a second one for delete: since only one overlay should ever be visible at once, use a single overlay driven by either state:

```tsx
      <BusyOverlay active={saving || deleting} label={deleting ? 'Deleting event…' : 'Saving changes…'} />
```

Place it as a top-level sibling in the returned fragment, alongside the existing toast `<div>`.

- [ ] **Step 2: Replace the `Promise.all` dual-save with sequential calls and precise error messaging**

Replace the `handleSave` body (lines 130-161) with:

```typescript
    setSaving(true)
    try {
      const evRes = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!evRes.ok) {
        flashToast(evRes.status === 404 ? 'Event not found.' : 'Could not save event details.', 'error')
        return
      }

      const gsRes = await fetch(`/api/events/${event.id}/general-settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagline: nullify(tagline) }),
      })
      if (!gsRes.ok) {
        flashToast('Event details saved, but the tagline failed to save — please retry.', 'error')
        return
      }

      flashToast('Changes saved', 'success')
      router.refresh()
    } catch {
      flashToast('Could not save changes.', 'error')
    } finally {
      setSaving(false)
    }
```

This sequences the two writes (core event fields first, since they're the more important half) and tells the user precisely which half failed instead of one generic message — the event write always either fully succeeds or fully fails before the settings write is even attempted, so there's no window where both look "saved" but only one is.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/GeneralSettingsForm.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/events/\[id\]/settings/GeneralSettingsForm.tsx
git commit -m "feat(settings): wire BusyOverlay into General tab, sequence dual-save with precise error messages"
```

---

### Task 9: Wire BusyOverlay into Website, Guests, and Admins tabs

**Files:**
- Modify: `app/events/[id]/settings/website/WebsiteContent.tsx`
- Modify: `app/events/[id]/settings/guests/GuestListContent.tsx`
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx`

**Interfaces:**
- Consumes: `BusyOverlay` from Task 7

- [ ] **Step 1: Website tab**

Import `BusyOverlay`, render `<BusyOverlay active={saving || takingOffline} label={takingOffline ? (siteOffline ? 'Bringing site online…' : 'Taking site offline…') : 'Saving…'} />` as a sibling of the existing toast.

- [ ] **Step 2: Guests tab**

Import `BusyOverlay`, render `<BusyOverlay active={saving} label="Saving…" />` (locate the exact `saving` state variable via `grep -n "saving" app/events/\[id\]/settings/guests/GuestListContent.tsx` — confirm the exact name before wiring).

- [ ] **Step 3: Admins tab**

Import `BusyOverlay`, render `<BusyOverlay active={sending} label="Sending invite…" />`.

- [ ] **Step 4: Typecheck and lint all 3**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/website/WebsiteContent.tsx app/events/[id]/settings/guests/GuestListContent.tsx app/events/[id]/settings/admins/AdminsContent.tsx`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add app/events/\[id\]/settings/website/WebsiteContent.tsx app/events/\[id\]/settings/guests/GuestListContent.tsx app/events/\[id\]/settings/admins/AdminsContent.tsx
git commit -m "feat(settings): wire BusyOverlay into Website, Guests, and Admins tab save actions"
```

---

## Part C — ToolRail, Dashboard, invite-id fixes

### Task 10: ToolRail — real LIVE/OFFLINE status, clickable link

**Files:**
- Modify: `app/events/[id]/layout.tsx`
- Modify: `components/layout/ToolRail.tsx`
- Modify: `designs/shared/shell.css` (`.tr-status` variants)

**Interfaces:**
- Produces: `ToolRail` now takes `isLive: boolean`, `liveUrl: string | null` instead of the old bare `isLive` boolean flag.

- [ ] **Step 1: Fetch real status in the layout**

In `app/events/[id]/layout.tsx`, add after the existing profile fetch:

```typescript
  const { data: ev } = await supabase
    .from('events')
    .select('slug')
    .eq('id', id)
    .single()

  const { data: siteSettings } = await supabase
    .from('event_website_settings')
    .select('site_offline')
    .eq('event_id', id)
    .single()

  const siteOffline = siteSettings?.site_offline ?? true
  const liveUrl = ev?.slug && !siteOffline ? `${getAppBaseUrl()}/e/${ev.slug}` : null
```

Add `import { getAppBaseUrl } from '@/lib/url'` at the top.

Change the `<ToolRail eventId={id} isLive />` call to `<ToolRail eventId={id} isLive={liveUrl !== null} liveUrl={liveUrl} />`.

- [ ] **Step 2: Update the component**

Replace `ToolRail.tsx`'s props and status rendering:

```tsx
interface ToolRailProps {
  eventId: string
  isLive: boolean
  liveUrl: string | null
}

export function ToolRail({ eventId, isLive, liveUrl }: ToolRailProps) {
  const pathname = usePathname()

  function isActive(toolId: string) {
    return pathname.includes(`/events/${eventId}/${toolId === 'event-settings' ? 'settings' : toolId}`)
  }

  return (
    <aside className="tool-rail" aria-label="Event tools">
      {TOOLS.map((tool) => (
        <Link
          key={tool.id}
          href={tool.path(eventId)}
          className={`tr-btn${isActive(tool.id) ? ' is-active' : ''}`}
          data-label={tool.label}
          data-page={tool.id}
          aria-label={tool.label}
        >
          <span aria-hidden="true" className="material-symbols-outlined icon-fill">{tool.icon}</span>
        </Link>
      ))}
      <span className="tr-divider" aria-hidden="true" />
      {isLive && liveUrl ? (
        <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="tr-status" aria-label="Site is live — open it">
          <span className="bc-live" />
          LIVE
        </a>
      ) : (
        <span className="tr-status is-offline" aria-label="Site is offline">
          <span className="bc-live is-offline-dot" aria-hidden="true" />
          OFFLINE
        </span>
      )}
    </aside>
  )
}
```

- [ ] **Step 3: Add the offline visual variant**

In `designs/shared/shell.css`, near the existing `.tr-status` rules (~line 696-708), add:

```css
.tr-status.is-offline{color:var(--muted-soft);cursor:default}
.tr-status .bc-live.is-offline-dot{background:var(--danger, #ef4444);animation:none}
```

- [ ] **Step 4: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/layout.tsx components/layout/ToolRail.tsx`
Expected: clean.

- [ ] **Step 5: Live verification**

Open an event with `site_offline=true`, confirm the rail shows red "OFFLINE" and is not a link. Toggle online from the Website tab, reload, confirm it shows green "LIVE" and clicking opens the real `/e/[slug]` URL in a new tab.

- [ ] **Step 6: Commit**

```bash
git add app/events/\[id\]/layout.tsx components/layout/ToolRail.tsx designs/shared/shell.css
git commit -m "fix(toolrail): derive LIVE/OFFLINE from real site_offline state, make it a real link"
```

---

### Task 11: Host Dashboard — wire the Collaborations tab to real data

**Files:**
- Modify: `app/home/page.tsx`
- Modify: `app/home/EventsGrid.tsx`

**Interfaces:**
- Consumes: `event_collaborators` (status='active', user_id = caller)
- Produces: `EventsGrid` gets a new `collabEvents: EventListItem[]` prop, replacing the hardcoded empty arrays.

- [ ] **Step 1: Fetch collaborator events in the server component**

In `app/home/page.tsx`, add a query for events where the current user is an active collaborator, joined to `events` for display fields (match whatever shape the existing owned-events query already builds into `EventListItem` — mirror it exactly rather than inventing a new shape):

```typescript
  const { data: collabRows } = await supabase
    .from('event_collaborators')
    .select('event_id, role, events!inner(id, name, primary_date, primary_venue, cover_photo_key, deleted_at)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .is('events.deleted_at', null)
```

Map `collabRows` into the same `EventListItem` shape the owned-events query already produces (locate that mapping in the same file via `grep -n "EventListItem" app/home/page.tsx` and reuse its exact field names), then pass as a new prop: `<EventsGrid events={events} collabEvents={collabEvents} ... />`.

- [ ] **Step 2: Update `EventsGrid` to use the real prop instead of hardcoded arrays**

In `EventsGrid.tsx`, change:
```typescript
  const collabActive: EventListItem[] = []
  const collabPast: EventListItem[] = []
```
to:
```typescript
  const collabActive = collabEvents.filter(isActive)
  const collabPast = collabEvents.filter((e) => !isActive(e))
```
and add `collabEvents: EventListItem[]` to the `Props` interface.

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/home/page.tsx app/home/EventsGrid.tsx`
Expected: clean.

- [ ] **Step 4: Live verification**

Using two test accounts: owner invites collaborator, collaborator accepts (existing accept-invite flow), collaborator logs into their own dashboard, switches to "Collaborations" filter, confirms the event now appears (previously always empty).

- [ ] **Step 5: Commit**

```bash
git add app/home/page.tsx app/home/EventsGrid.tsx
git commit -m "fix(dashboard): wire Collaborations tab to real event_collaborators query"
```

---

### Task 12: Admins tab — use the real invite row id

**Files:**
- Modify: `app/api/events/[id]/admins/route.ts`
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx`

**Interfaces:**
- Produces: `POST /api/events/[id]/admins` now returns `{ success: true, id: string }` instead of just `{ success: true }`.

- [ ] **Step 1: Return the real id**

In `admins/route.ts`, change the final success response (line 99) from:
```typescript
    return NextResponse.json({ success: true }, { status: 201 })
```
to:
```typescript
    return NextResponse.json({ success: true, id: newCollab.id }, { status: 201 })
```
(`newCollab.id` is already available — the insert's `.select('id').single()` result, line 52-61.)

- [ ] **Step 2: Use the real id client-side**

In `AdminsContent.tsx`'s `handleSendInvite`, change:
```typescript
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        flashToast((json as { error?: string }).error ?? 'Failed to invite — please try again')
      } else {
        const name = email.split('@')[0] ?? email
        setCollabs(prev => [...prev, {
          id:          crypto.randomUUID(),
```
to:
```typescript
      const json = await res.json().catch(() => ({})) as { error?: string; id?: string }
      if (!res.ok) {
        flashToast(json.error ?? 'Failed to invite — please try again')
      } else {
        const name = email.split('@')[0] ?? email
        setCollabs(prev => [...prev, {
          id:          json.id ?? crypto.randomUUID(),
```
(fallback to `crypto.randomUUID()` kept only as a defensive no-op for a malformed response — the real path always has `json.id` on success.)

- [ ] **Step 3: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/api/events/[id]/admins/route.ts app/events/[id]/settings/admins/AdminsContent.tsx`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/api/events/\[id\]/admins/route.ts app/events/\[id\]/settings/admins/AdminsContent.tsx
git commit -m "fix(admins): return and use the real collaborator row id instead of a fabricated one"
```

---

## Part D — Tiered co-host permissions (largest block — spec §7, §12)

This part is materially bigger than every other task combined (spec §12). It touches RLS on multiple tables and every API route currently doing owner-only checks. Build in this exact order: RLS foundation (14) → TS access helper (15) → apply to the Settings-domain routes this spec already touches (16) → apply to the remaining domain routes (17) → remove/demote UI (18). Each sub-task is independently reviewable and shippable — the app is safe (still owner-only, just not yet collaborator-aware) after any one of them lands, since nothing here loosens existing access, it only extends it.

**Why RLS has to come first:** every event-child table currently has RLS policies of the shape `EXISTS (select 1 from events where events.id = <table>.event_id and events.user_id = (select auth.uid()))` — owner-only, at the database layer, per `DATA-MODEL.md` D26. Even if every API route added a perfect app-level capability check, a collaborator's Supabase queries would still return empty/blocked results underneath, because RLS runs regardless of what the route's own logic decided. D26 already flagged this exact conversion as deferred to "the later collaborator pass" — this is that pass.

### Task 13: RLS — `can_access_event()` shared predicate + two worked table migrations

**Files:**
- Migration (via Supabase MCP `apply_migration`, project `smjkbmkxweevqpvygabe`): new function + 2 tables' policies
- Modify: `docs/data-model/DATA-MODEL.md` (decision log + RLS section)

**Interfaces:**
- Produces: `public.can_access_event(p_event_id uuid, p_capability text default null) returns boolean` — SQL function, `security definer set search_path = public`, callable from any RLS policy.

- [ ] **Step 1: Create the predicate function**

Apply via `mcp__<supabase-project>__apply_migration` (name: `collab_access_01`):

```sql
create or replace function public.can_access_event(p_event_id uuid, p_capability text default null)
returns boolean
security definer set search_path = public
language sql stable as $$
  select exists (
    select 1 from public.events e
    where e.id = p_event_id
      and e.deleted_at is null
      and (
        e.user_id = (select auth.uid())
        or exists (
          select 1 from public.event_collaborators c
          where c.event_id = e.id
            and c.user_id = (select auth.uid())
            and c.status = 'active'
            and (
              p_capability is null
              or (c.role = 'co-host' and p_capability not in ('billing', 'delete'))
              or (c.role = 'planner' and p_capability in ('guests', 'planning'))
              or (c.role = 'photographer' and p_capability = 'media')
              or (c.role = 'viewer' and p_capability is null)
            )
        )
      )
  );
$$;

revoke all on function public.can_access_event(uuid, text) from public;
grant execute on function public.can_access_event(uuid, text) to anon, authenticated;
```

Note the explicit `revoke ... from public` + `grant ... to anon, authenticated` pair (not just `revoke from public` alone) — per the D50/`website_16` lesson already recorded in `DATA-MODEL.md`: Supabase grants EXECUTE to `anon`/`authenticated` directly via default privileges, so `revoke from public` alone is a no-op for them. This function needs to be callable from RLS checks regardless of role, so the explicit grant here is correct (not a repeat of that bug — the bug was granting when the function should have stayed internal-only; this function is meant to be broadly callable).

- [ ] **Step 2: Run `get_advisors` (security) immediately after applying**

Use `mcp__<supabase-project>__get_advisors` with type `security`. Confirm no new findings. Per the D50 lesson, this is the only check that observes actual granted privileges rather than the SQL that was intended to set them — run it right after this migration, not at the end of the whole Part D.

- [ ] **Step 3: Convert `event_general_settings` RLS as the first worked example**

Apply via `apply_migration` (name: `collab_access_02_general_settings`):

```sql
drop policy if exists "owner_select_general_settings" on public.event_general_settings;
drop policy if exists "owner_all_general_settings" on public.event_general_settings;

create policy "collab_select_general_settings" on public.event_general_settings
  for select to authenticated
  using (public.can_access_event(event_id, null));

create policy "collab_write_general_settings" on public.event_general_settings
  for all to authenticated
  using (public.can_access_event(event_id, 'general'))
  with check (public.can_access_event(event_id, 'general'));
```

(Exact existing policy names must be confirmed first — run `mcp__<supabase-project>__execute_sql` with `select policyname from pg_policies where tablename = 'event_general_settings';` before writing the `drop policy` statements, and use the real names found, not the placeholder names above if they differ.)

- [ ] **Step 4: Convert `event_guest_settings` RLS as the second worked example**

Same pattern, capability `'guests'`:

```sql
-- (after confirming real existing policy names via the same pg_policies query)
create policy "collab_select_guest_settings" on public.event_guest_settings
  for select to authenticated
  using (public.can_access_event(event_id, null));

create policy "collab_write_guest_settings" on public.event_guest_settings
  for all to authenticated
  using (public.can_access_event(event_id, 'guests'))
  with check (public.can_access_event(event_id, 'guests'));
```

- [ ] **Step 5: `get_advisors` again**

Confirm clean after both table conversions.

- [ ] **Step 6: Document in DATA-MODEL.md**

Add a new `### Collaborator access (`collab_access_01`–`02`)` subsection under the RLS section, describing `can_access_event()`'s signature and the capability matrix (owner: all 8; co-host: all except billing/delete; planner: guests+planning; photographer: media; viewer: read-only via the `null`-capability SELECT policies). Add a decision-log entry (next available `D` number) recording this is the D26-deferred collaborator RLS conversion, starting with `event_general_settings` and `event_guest_settings`, remaining tables converted in Task 16.

- [ ] **Step 7: Regenerate TypeScript types**

Run the project's type-generation step (per established convention — `mcp__<supabase-project>__generate_typescript_types`, written to `lib/supabase/database.types.ts`). No type shape changes are expected (RLS doesn't change columns), but this confirms the migration didn't break schema introspection.

- [ ] **Step 8: Commit the docs change (migrations themselves are already live via MCP, not file-based)**

```bash
git add docs/data-model/DATA-MODEL.md
git commit -m "docs: record can_access_event() RLS predicate + general/guest-settings conversion"
```

---

### Task 14: TS access-check helper + unit tests

**Files:**
- Create: `lib/auth/eventAccess.ts`
- Test: `__tests__/lib/auth/eventAccess.test.ts`

**Interfaces:**
- Produces:
  - `type EventRole = 'owner' | 'co-host' | 'planner' | 'photographer' | 'viewer'`
  - `type EventCapability = 'billing' | 'delete' | 'admins' | 'website' | 'guests' | 'planning' | 'media' | 'general'`
  - `getEventAccess(supabase, eventId: string, userId: string): Promise<EventAccess>`
  - `EventAccess = { role: EventRole | null; canWrite(capability: EventCapability): boolean; canRead(capability: EventCapability): boolean }`
  - `requireEventWrite(supabase, eventId, userId, capability): Promise<{ ok: true } | { ok: false; response: NextResponse }>`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getEventAccess, requireEventWrite } from '@/lib/auth/eventAccess'

function makeSupabase(opts: { isOwner: boolean; collabRole?: string; collabStatus?: string }) {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.is = vi.fn().mockReturnValue(chain)
      if (table === 'events') {
        chain.single = vi.fn().mockResolvedValue(
          opts.isOwner ? { data: { id: 'event-1' }, error: null } : { data: null, error: { message: 'not found' } }
        )
      } else if (table === 'event_collaborators') {
        chain.single = vi.fn().mockResolvedValue(
          opts.collabRole
            ? { data: { role: opts.collabRole }, error: null }
            : { data: null, error: { message: 'not found' } }
        )
      }
      return chain
    }),
  }
}

describe('getEventAccess', () => {
  it('returns owner role when the caller owns the event', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: true }) as never, 'event-1', 'user-1')
    expect(access.role).toBe('owner')
    expect(access.canWrite('billing')).toBe(true)
    expect(access.canWrite('delete')).toBe(true)
  })

  it('returns co-host role with billing/delete excluded', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'co-host' }) as never, 'event-1', 'user-2')
    expect(access.role).toBe('co-host')
    expect(access.canWrite('website')).toBe(true)
    expect(access.canWrite('billing')).toBe(false)
    expect(access.canWrite('delete')).toBe(false)
  })

  it('scopes planner to guests+planning only', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'planner' }) as never, 'event-1', 'user-3')
    expect(access.canWrite('guests')).toBe(true)
    expect(access.canWrite('planning')).toBe(true)
    expect(access.canWrite('website')).toBe(false)
    expect(access.canRead('website')).toBe(false)
  })

  it('scopes photographer to media only', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'photographer' }) as never, 'event-1', 'user-4')
    expect(access.canWrite('media')).toBe(true)
    expect(access.canWrite('guests')).toBe(false)
  })

  it('viewer can read everything but write nothing', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false, collabRole: 'viewer' }) as never, 'event-1', 'user-5')
    expect(access.canRead('billing')).toBe(true)
    expect(access.canWrite('billing')).toBe(false)
    expect(access.canWrite('media')).toBe(false)
  })

  it('returns null role for a non-owner, non-collaborator caller', async () => {
    const access = await getEventAccess(makeSupabase({ isOwner: false }) as never, 'event-1', 'user-6')
    expect(access.role).toBeNull()
    expect(access.canRead('general')).toBe(false)
  })
})

describe('requireEventWrite', () => {
  it('returns ok:false with a 404 response when the capability check fails', async () => {
    const result = await requireEventWrite(makeSupabase({ isOwner: false }) as never, 'event-1', 'user-6', 'general')
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(404)
  })

  it('returns ok:true when the capability check passes', async () => {
    const result = await requireEventWrite(makeSupabase({ isOwner: true }) as never, 'event-1', 'user-1', 'general')
    expect(result.ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

Run: `npx vitest run __tests__/lib/auth/eventAccess.test.ts`
Expected: FAIL — module doesn't exist yet.

- [ ] **Step 3: Implement**

```typescript
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type EventRole = 'owner' | 'co-host' | 'planner' | 'photographer' | 'viewer'

export type EventCapability =
  | 'billing'
  | 'delete'
  | 'admins'
  | 'website'
  | 'guests'
  | 'planning'
  | 'media'
  | 'general'

const CAPABILITY_MATRIX: Record<EventRole, ReadonlySet<EventCapability>> = {
  owner:        new Set(['billing', 'delete', 'admins', 'website', 'guests', 'planning', 'media', 'general']),
  'co-host':    new Set(['admins', 'website', 'guests', 'planning', 'media', 'general']),
  planner:      new Set(['guests', 'planning']),
  photographer: new Set(['media']),
  viewer:       new Set([]),
}

export interface EventAccess {
  role: EventRole | null
  canWrite: (capability: EventCapability) => boolean
  canRead: (capability: EventCapability) => boolean
}

function isEventRole(value: string): value is EventRole {
  return value === 'owner' || value === 'co-host' || value === 'planner' || value === 'photographer' || value === 'viewer'
}

function buildAccess(role: EventRole | null): EventAccess {
  const capabilities = role ? CAPABILITY_MATRIX[role] : new Set<EventCapability>()
  return {
    role,
    canWrite: (capability) => role !== null && role !== 'viewer' && capabilities.has(capability),
    canRead: (capability) => role !== null && (role === 'viewer' || capabilities.has(capability)),
  }
}

export async function getEventAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  userId: string
): Promise<EventAccess> {
  const { data: owned } = await supabase
    .from('events')
    .select('id')
    .eq('id', eventId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .single()

  if (owned) return buildAccess('owner')

  const { data: collab } = await supabase
    .from('event_collaborators')
    .select('role')
    .eq('event_id', eventId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (collab && isEventRole(collab.role)) return buildAccess(collab.role)

  return buildAccess(null)
}

export async function requireEventWrite(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  eventId: string,
  userId: string,
  capability: EventCapability
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const access = await getEventAccess(supabase, eventId, userId)
  if (!access.canWrite(capability)) {
    return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Run, confirm pass**

Run: `npx vitest run __tests__/lib/auth/eventAccess.test.ts`
Expected: PASS, all 8 tests.

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add lib/auth/eventAccess.ts __tests__/lib/auth/eventAccess.test.ts
git commit -m "feat(auth): add getEventAccess/requireEventWrite tiered-capability helper"
```

---

### Task 15: Apply the capability helper to the Settings-domain routes

**Files:**
- Modify: `app/api/events/[id]/general-settings/route.ts`
- Modify: `app/api/events/[id]/guest-settings/route.ts`
- Modify: `app/api/events/[id]/website-settings/route.ts`
- Modify: `app/api/events/[id]/admins/route.ts` (POST)

**Interfaces:**
- Consumes: `requireEventWrite` from Task 14

- [ ] **Step 1: Replace `verifyOwnership` with `requireEventWrite` — worked example on `general-settings/route.ts`**

Remove the local `verifyOwnership` function (added earlier this session) and its call site:

```typescript
    if (!await verifyOwnership(supabase, id, user.id)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
```

Replace with:

```typescript
import { requireEventWrite } from '@/lib/auth/eventAccess'
// ...
    const access = await requireEventWrite(supabase, id, user.id, 'general')
    if (!access.ok) return access.response
```

- [ ] **Step 2: Apply the identical transform to the other 3 routes**

Same before/after shape, different capability string per route:
- `guest-settings/route.ts` → `'guests'`
- `website-settings/route.ts` → `'website'`
- `admins/route.ts` (the `POST` handler's existing owner-check block, lines 30-37) → `'admins'`

- [ ] **Step 3: Update the existing tests for these routes to mock the new helper's dependency shape**

For each route's existing test file (if one exists — check via `find __tests__ -path "*general-settings*" -o -path "*guest-settings*" -o -path "*website-settings*" -o -path "*admins*"`), update the Supabase mock so `getEventAccess`'s two-query pattern (events lookup, then collaborators lookup) resolves the way the test expects — mirror the mock shape from Task 14's own test file.

If no test files exist yet for these routes, write one per route following the `delete.test.ts` pattern shown in Task 3, covering: owner succeeds, non-owner/non-collaborator gets 404, an active collaborator with the wrong role gets 404, an active collaborator with the right role succeeds.

- [ ] **Step 4: Typecheck, full test suite**

Run: `npx tsc --noEmit && npm run test:run`
Expected: clean.

- [ ] **Step 5: Live two-account verification**

Owner invites a co-host, co-host accepts. Co-host logs in, navigates to the event's Website/Guests/General settings tabs directly (`/events/[id]/settings/...`), confirms they can now view and save (previously would have 404'd at the RLS layer even before hitting the route's own check). A `planner`-role collaborator attempting the Website tab should get a 404 from the route (capability check) even though Task 13's RLS SELECT policy lets them read — confirm the distinction holds (read-visible in raw Supabase, write-blocked by the route).

- [ ] **Step 6: Commit**

```bash
git add app/api/events/\[id\]/general-settings/route.ts app/api/events/\[id\]/guest-settings/route.ts app/api/events/\[id\]/website-settings/route.ts app/api/events/\[id\]/admins/route.ts
git commit -m "feat(permissions): apply tiered capability checks to Settings-domain routes"
```

---

### Task 16: Extend RLS + capability checks to Planning, Guests, and Media routes

**Files:**
- RLS migration (via MCP): `event_tasks`, `event_budgets`, `event_expenses` (capability `'planning'`); `event_guests`, `event_guest_sub_events`, `event_guest_tag_links` (capability `'guests'`); `event_media`, `event_albums`, `event_media_albums` (capability `'media'`)
- Modify (apply `requireEventWrite` the same way as Task 15): every route file listed in Step 3

**Interfaces:**
- Consumes: `can_access_event()` (Task 13), `requireEventWrite` (Task 14)

- [ ] **Step 1: Convert RLS on the Planning tables**

Same pattern as Task 13 Steps 3-4, capability `'planning'`, for `event_tasks`, `event_budgets`, `event_expenses`. Confirm real existing policy names via `pg_policies` before dropping, exactly as in Task 13.

- [ ] **Step 2: Convert RLS on the Guests and Media tables**

Same pattern, capability `'guests'` for `event_guests`/`event_guest_sub_events`/`event_guest_tag_links`; capability `'media'` for `event_media`/`event_albums`/`event_media_albums`. Run `get_advisors` after each domain's conversion, not just once at the end.

- [ ] **Step 3: Apply `requireEventWrite` to every route in these three domains**

Exact file list, each getting the identical transform from Task 15 Step 1 (swap whatever ownership check currently exists for `requireEventWrite(supabase, id, user.id, '<capability>')`):

Planning (`'planning'`):
- `app/api/events/[id]/planning/budget/route.ts`
- `app/api/events/[id]/planning/expense-types/route.ts`
- `app/api/events/[id]/planning/expenses/route.ts`
- `app/api/events/[id]/planning/expenses/[expenseId]/route.ts`
- `app/api/events/[id]/planning/tasks/route.ts`
- `app/api/events/[id]/planning/tasks/[taskId]/route.ts`
- `app/api/events/[id]/planning/tasks/bulk/route.ts`

Guests (`'guests'`):
- `app/api/events/[id]/guests/route.ts`
- `app/api/events/[id]/guests/[guestId]/route.ts`
- `app/api/events/[id]/guests/bulk/route.ts`
- `app/api/events/[id]/guests/import/route.ts`
- `app/api/events/[id]/guest-tags/route.ts`
- `app/api/events/[id]/guest-tags/[tagId]/route.ts`

Media (`'media'`):
- `app/api/events/[id]/media/route.ts`
- `app/api/events/[id]/media/[mediaId]/route.ts`
- `app/api/events/[id]/media/[mediaId]/url/route.ts`
- `app/api/events/[id]/media/[mediaId]/albums/route.ts`
- `app/api/events/[id]/media/albums/route.ts`
- `app/api/events/[id]/media/albums/[albumId]/route.ts`
- `app/api/events/[id]/media/bulk-delete/route.ts`
- `app/api/events/[id]/media/upload-url/route.ts`
- `app/api/events/[id]/media/urls/route.ts`

Each file: find its existing ownership-check block (`grep -n "verifyOwnership\|user_id.*user.id" <file>` to locate it precisely per file, since not all of these currently use the named-helper pattern — some may inline `.eq('user_id', user.id)` directly on a different table), replace with the `requireEventWrite` call, same shape as Task 15 Step 1.

- [ ] **Step 4: Update/add tests per route**

Same approach as Task 15 Step 3 — update existing test mocks for the new `getEventAccess` call pattern; add coverage for the 4 cases (owner/non-collaborator/wrong-role/right-role) on routes that don't have tests yet. Given the volume (20 files), prioritize the write-heavy routes (`route.ts` POST/PUT handlers) over the narrower `[id]`-scoped single-resource ones if time-constrained — flag any skipped routes explicitly in the commit message rather than silently leaving them untested.

- [ ] **Step 5: Full suite + typecheck**

Run: `npm run test:run && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Live verification per role**

Using a `planner` collaborator: confirm Planning + Guests writes succeed, Media writes 404. Using a `photographer` collaborator: confirm Media writes succeed, Planning + Guests writes 404. This is the highest-risk verification in the whole plan (spec §11) — don't skip it for time.

- [ ] **Step 7: Commit**

```bash
git add app/api/events/\[id\]/planning app/api/events/\[id\]/guests app/api/events/\[id\]/guest-tags app/api/events/\[id\]/media
git commit -m "feat(permissions): extend tiered capability checks + RLS to Planning, Guests, Media routes"
```

---

### Task 17: Remove/demote a collaborator

**Files:**
- Modify: `app/api/events/[id]/admins/route.ts` (add `DELETE`, `PATCH`)
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx`
- Test: `__tests__/api/events/[id]/admins/route.test.ts` (new or extended)

**Interfaces:**
- Produces: `DELETE /api/events/[id]/admins?collaboratorId=<uuid>`, `PATCH /api/events/[id]/admins` with body `{ collaboratorId: string, role: string }`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))

import { DELETE, PATCH } from '@/app/api/events/[id]/admins/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const COLLAB_ID = '660e8400-e29b-41d4-a716-446655440001'

function makeSupabase(opts: { isOwner: boolean }) {
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    from: vi.fn().mockImplementation((table: string) => {
      const chain: Record<string, unknown> = {}
      chain.select = vi.fn().mockReturnValue(chain)
      chain.eq = vi.fn().mockReturnValue(chain)
      chain.is = vi.fn().mockReturnValue(chain)
      chain.delete = vi.fn().mockReturnValue(chain)
      chain.update = vi.fn().mockReturnValue(chain)
      chain.single = vi.fn().mockResolvedValue(
        table === 'events' && opts.isOwner
          ? { data: { id: EVENT_ID }, error: null }
          : { data: null, error: { message: 'not found' } }
      )
      chain.eq = vi.fn().mockImplementation(() => chain) // terminal for delete/update chains
      return chain
    }),
  }
}

describe('DELETE /api/events/[id]/admins', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a non-owner, non-co-host caller with 404', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: false }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins?collaboratorId=${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: EVENT_ID }) })
    expect(res.status).toBe(404)
  })

  it('removes the collaborator when the caller is the owner', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins?collaboratorId=${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, { params: Promise.resolve({ id: EVENT_ID }) })
    expect(res.status).toBe(204)
  })
})

describe('PATCH /api/events/[id]/admins', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the role when the caller has admins capability', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins`, {
      method: 'PATCH',
      body: JSON.stringify({ collaboratorId: COLLAB_ID, role: 'planner' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: EVENT_ID }) })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

Run: `npx vitest run __tests__/api/events/\[id\]/admins/route.test.ts`
Expected: FAIL — `DELETE`/`PATCH` not exported yet.

- [ ] **Step 3: Implement both handlers**

Append to `app/api/events/[id]/admins/route.ts`:

```typescript
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const collaboratorId = new URL(request.url).searchParams.get('collaboratorId')
    if (!collaboratorId || !uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid collaborator ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'admins')
    if (!access.ok) return access.response

    const { error } = await supabase
      .from('event_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/admins failed:', error)
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const patchSchema = z.object({
  collaboratorId: z.string().uuid(),
  role: z.string().max(50),
}).strict()

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'admins')
    if (!access.ok) return access.response

    let body: unknown
    try { body = await request.json() } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_collaborators')
      .update({ role: parsed.data.role })
      .eq('id', parsed.data.collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('PATCH /api/events/[id]/admins failed:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Add `import { requireEventWrite } from '@/lib/auth/eventAccess'` at the top (this file's `POST` handler was already converted to use it in Task 15).

- [ ] **Step 4: Run, confirm pass**

Run: `npx vitest run __tests__/api/events/\[id\]/admins/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire the UI — remove control**

In `AdminsContent.tsx`, replace the disabled `more_horiz` button (lines 123-132) with a working remove action. Add state + handler:

```typescript
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(collabId: string) {
    setRemovingId(collabId)
    try {
      const res = await fetch(`/api/events/${eventId}/admins?collaboratorId=${collabId}`, { method: 'DELETE' })
      if (!res.ok) {
        flashToast('Failed to remove — please try again')
      } else {
        setCollabs(prev => prev.filter(c => c.id !== collabId))
        flashToast('Collaborator removed')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setRemovingId(null)
    }
  }
```

Replace the disabled button with:

```tsx
              <button
                type="button"
                className="fn-icon-btn"
                onClick={() => handleRemove(collab.id)}
                disabled={removingId === collab.id}
                aria-busy={removingId === collab.id}
                aria-label={`Remove ${collab.displayName.split(' ')[0]}`}
              >
                <span aria-hidden="true" className="material-symbols-outlined">person_remove</span>
              </button>
```

Role-editing (the `PATCH` half) is left as a follow-up UI (dropdown-on-click) — the route exists and is tested; wiring a role-change dropdown into this row is small enough to fold into a future pass rather than blocking this task, since remove is the higher-value, more urgent half (an owner can already fix a wrong role today by removing and re-inviting).

- [ ] **Step 6: Typecheck, lint, full suite**

Run: `npx tsc --noEmit && npm run test:run`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add app/api/events/\[id\]/admins/route.ts app/events/\[id\]/settings/admins/AdminsContent.tsx __tests__/api/events/\[id\]/admins
git commit -m "feat(admins): add remove-collaborator DELETE/PATCH routes, wire remove button in UI"
```

---

## Part E — Usage tab

### Task 18: New per-event Usage tab

**Files:**
- Create: `app/events/[id]/settings/usage/page.tsx`
- Create: `app/events/[id]/settings/usage/UsageContent.tsx`
- Modify: `app/events/[id]/settings/SettingsNav.tsx`
- Modify: `designs/pages/event-settings/event-settings.css` (new `.es-usage-*` classes if the stat-tile pattern from Event Hub isn't already generic — check first)

**Interfaces:**
- Consumes: `event_media` (storage aggregate, same query Media & Memories already uses), `event_hub_summary` view (guest_total, task_percent, budget_percent), `config.plans` (same read as `billing/page.tsx`)
- Produces: nothing new — pure read-only aggregation page

- [ ] **Step 1: Check for a reusable stat-tile component first**

Run: `grep -rln "stat-tile\|StatTile" app/events/\[id\]/page.tsx components/`

If one exists (Event Hub's stat tiles are the likely candidate), reuse it. If not, build the tab's own simple tile markup inline — don't create a new generic component for a single consumer (YAGNI).

- [ ] **Step 2: Add the nav entry**

In `SettingsNav.tsx`, add to `SETTINGS_TABS` (positioned after Billing):

```typescript
  { href: (id: string) => `/events/${id}/settings/usage`,    label: 'Usage',          icon: 'monitoring',  exact: false },
```

- [ ] **Step 3: Server component — fetch all four numbers**

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageFooter } from '@/components/layout/PageFooter'
import { UsageContent } from './UsageContent'

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024 // matches MediaClient.tsx — reused, not reimplemented

export default async function UsageSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: ev } = await supabase
    .from('events')
    .select('id, plan_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!ev) redirect('/home')

  const [{ data: media }, { data: hub }, { data: plansRaw }] = await Promise.all([
    supabase.from('event_media').select('byte_size').eq('event_id', id),
    supabase.from('event_hub_summary').select('guest_total, task_percent, budget_percent').eq('event_id', id).single(),
    supabase.schema('config').from('plans').select('id, slug, name, price_inr').eq('is_active', true).order('sort_order', { ascending: true }),
  ])

  const storageUsedBytes = (media ?? []).reduce((sum, m) => sum + (m.byte_size ?? 0), 0)
  const plans = plansRaw ?? []
  const currentPlan = plans.find(p => p.id === ev.plan_id) ?? plans.find(p => p.slug === 'free') ?? plans[0]

  return (
    <main className="page-band reveal pt-6 md:pt-8 pb-24">
      <UsageContent
        storageUsedBytes={storageUsedBytes}
        storageLimitBytes={STORAGE_LIMIT_BYTES}
        guestTotal={hub?.guest_total ?? 0}
        taskPercent={hub?.task_percent ?? null}
        budgetPercent={hub?.budget_percent ?? null}
        planName={currentPlan?.name ?? 'Free'}
      />
      <PageFooter />
    </main>
  )
}
```

- [ ] **Step 4: Client display component**

```tsx
interface Props {
  storageUsedBytes: number
  storageLimitBytes: number
  guestTotal: number
  taskPercent: number | null
  budgetPercent: number | null
  planName: string
}

function fmtGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function UsageContent({ storageUsedBytes, storageLimitBytes, guestTotal, taskPercent, budgetPercent, planName }: Props) {
  const storagePct = storageLimitBytes > 0 ? Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100)) : 0

  return (
    <div className="es-content">
      <header className="es-content-head">
        <div>
          <h1 className="es-content-title">Usage</h1>
          <p className="es-content-lead">A snapshot of this event&apos;s storage, guests, and plan.</p>
        </div>
      </header>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">database</span>
            Storage
          </h2>
          <span className="es-section-tag">{fmtGB(storageUsedBytes)} of {fmtGB(storageLimitBytes)}</span>
        </header>
        <div className="es-usage-bar">
          <div className="es-usage-bar-fill" style={{ width: `${storagePct}%` }} />
        </div>
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">groups</span>
            Guests
          </h2>
        </header>
        <p className="es-usage-stat">{guestTotal}</p>
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">checklist</span>
            Planning progress
          </h2>
        </header>
        <p className="es-usage-stat">{taskPercent !== null ? `${taskPercent}% tasks done` : 'No tasks yet'}</p>
        <p className="es-usage-stat">{budgetPercent !== null ? `${budgetPercent}% of budget spent` : 'No budget set'}</p>
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">verified</span>
            Plan
          </h2>
        </header>
        <p className="es-usage-stat">{planName}</p>
      </section>
    </div>
  )
}
```

- [ ] **Step 5: Add the two new CSS classes if not already covered by existing `.es-section`/`.stack-bar`-style rules**

Check first: `grep -n "es-usage\|stack-bar" designs/pages/event-settings/event-settings.css designs/shared/shell.css`. If a generic progress-bar class already exists (the V0 Readiness artifact's `.stack-bar`/`.stack-seg` pattern, or Media's own storage-meter CSS), reuse its class names instead of inventing `.es-usage-bar`/`.es-usage-bar-fill` — check `app/events/[id]/media/MediaClient.tsx`'s storage-meter markup for its class names first (`grep -n "meter" app/events/\[id\]/media/MediaClient.tsx`) and match that pattern for visual consistency between the two storage displays. Only add new CSS if genuinely nothing reusable exists.

- [ ] **Step 6: Typecheck, lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/usage`
Expected: clean.

- [ ] **Step 7: Live verification**

Open the tab for an event with real media/guests/tasks/budget data, confirm all 4 numbers match what Media's own storage meter and the Event Hub's own stat tiles show for the same event (spec §11 — should match exactly since both reuse the same source data).

- [ ] **Step 8: Commit**

```bash
git add app/events/\[id\]/settings/usage app/events/\[id\]/settings/SettingsNav.tsx designs/pages/event-settings/event-settings.css
git commit -m "feat(settings): add read-only per-event Usage tab"
```

---

## Plan Self-Review Notes

- **Spec coverage:** §2→Task1, §3→Task2, §4→Task3, §5→Task4, §6→Tasks5+8, §7.1(permissions)→Tasks13-16, §7.2(remove/demote)→Task17, §7.3(invite id)→Task12, §7.4(dashboard)→Task11, §8(ToolRail)→Task10, §8(overlay)→Tasks7-9, §9(Usage)→Task18. §0(IDOR)/§1(corrections) already done, reference-only, no task. §10's `/legal/*` and Registry-real-backend items are explicitly not tasked (out of scope, matches spec).
- **Placeholder scan:** no TBD/TODO left; the two spots that say "confirm exact policy names via `pg_policies` first" (Task 13 Step 3, Task 16 Step 1) are real, necessary preconditions for a DDL statement whose target must be verified against live state before running — not vagueness, the query to run is fully specified.
- **Type consistency:** `EventCapability`/`EventRole`/`EventAccess`/`getEventAccess`/`requireEventWrite` signatures introduced in Task 14 are used identically in Tasks 15-17. `BusyOverlay`'s `{ active, label? }` props from Task 7 are used identically in Tasks 8-9. `ToolRail`'s new `{ eventId, isLive, liveUrl }` props from Task 10 replace the old bare-boolean signature completely (no stale callers left — `app/events/[id]/layout.tsx` is the only caller, updated in the same task).
- **Scope check:** Part D (Tasks 13-17) is intentionally the largest, most sequential block, matching spec §12's explicit sizing call-out — each of its 5 tasks is still independently shippable and reviewable on its own.
