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

## Part A — Small fixes (sequential — file line-numbers shift between tasks)

> **Council correction:** these tasks touch overlapping files (`GeneralSettingsForm.tsx`, `WebsiteContent.tsx`) and later tasks' line-number references only resolve correctly once earlier tasks have already run. Execute in the numbered order below, not in parallel, unless you first re-derive line numbers per file with a fresh `grep`/`Read` before editing.

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

Add `disabled` **and** `title="Registry links — coming soon"` (fund fields: `title="Cash funds — coming soon"`) to all 5 inputs/textareas (`es-registry-url`, `es-registry-label`, `es-fund-name`, `es-fund-goal`, `es-fund-message`) — matching the same discoverable-reason pattern used on the two buttons in Step 1, not just a bare `disabled` (council finding: a screen-reader user in forms-mode navigation gets no field-level context from `disabled` alone).

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

### Task 3: Guest RSVP route — enforce plus-ones/dietary toggles inside `submit_rsvp` itself, not via a direct table read

> **Council finding, fixed here:** the original version of this task read `event_guest_settings` directly from the route's Supabase client. Both Security Expert (reasoned from `lib/supabase/server.ts`'s auth-cookie logic) and Backend Engineer (live-queried `smjkbmkxweevqpvygabe`) independently confirmed this is dead code in production — the guest RSVP flow authenticates via a custom cookie (`COOKIE_NAME`), never Supabase Auth, so `auth.uid()` is null for this caller; `event_guest_settings`' RLS is `to authenticated` only (owner-only besides that), so the read returns nothing regardless of the caller's actual guest-session validity, and the `?? ''` fallback masked the failure instead of surfacing it. The route's own mocked unit tests passed while the feature did nothing real. Fixed by moving the check inside `submit_rsvp` itself — already `security definer`, so it can read `event_guest_settings` regardless of the caller's RLS, the same pattern `is_website_gate_open()`/`get_public_website_payload()` already use for other guest-facing reads.

**Files:**
- Migration (via Supabase MCP `apply_migration`, project `smjkbmkxweevqpvygabe`): extend `submit_rsvp`
- Modify: `app/api/e/[slug]/rsvp/route.ts` (pass through, no enforcement logic of its own)
- Test: `__tests__/api/e/[slug]/rsvp.test.ts` (new)

**Interfaces:**
- Consumes: `event_guest_settings` table (`allow_plus_ones: boolean`, `collect_dietary_notes: boolean`), read from inside `submit_rsvp`'s own `security definer` context — not from the route's RLS-bound client
- Produces: `submit_rsvp` now raises `'plus_ones_not_allowed'` / `'dietary_not_collected'` (mapped to 400 by the route's existing `mapRpcError` helper) instead of silently accepting the fields

- [ ] **Step 0: Read `submit_rsvp`'s current definition before touching it**

Run `mcp__<supabase-project>__execute_sql` with `select pg_get_functiondef('public.submit_rsvp'::regproc);` (adjust the signature if `submit_rsvp` is overloaded — check `\df submit_rsvp` equivalent first via `select proname, pg_get_function_identity_arguments(oid) from pg_proc where proname = 'submit_rsvp';`). Confirm its exact parameter names (`p_token`, `p_sub_event_id`, `p_response_status`, `p_plus_one_count`, `p_dietary_notes` per the existing route code) and how it currently resolves `event_id` from the token, since the new checks need that same `event_id` value, not a second lookup.

- [ ] **Step 1: Extend `submit_rsvp` to check `event_guest_settings` before writing**

Apply via `apply_migration` (name: `rsvp_guest_settings_enforcement`), inserting the check into the function body at the point where `event_id` is already resolved (exact insertion point depends on Step 0's findings — this is the logic to add, not necessarily the full function):

```sql
  -- (after event_id is resolved from the token, before the RSVP write)
  if p_plus_one_count is not null then
    if not coalesce((select allow_plus_ones from public.event_guest_settings where event_id = v_event_id), false) then
      raise exception 'plus_ones_not_allowed';
    end if;
  end if;

  if p_dietary_notes is not null then
    if not coalesce((select collect_dietary_notes from public.event_guest_settings where event_id = v_event_id), false) then
      raise exception 'dietary_not_collected';
    end if;
  end if;
```

(`v_event_id` here stands in for whatever local variable Step 0 finds the function already uses — match the real name.)

**Round-2 council fix (Security Expert) — fail closed, not open.** The `coalesce(..., false)` on each subquery is load-bearing: if `event_guest_settings` has no row for the event, a bare scalar subquery returns `NULL`, `not NULL` is `NULL`, and `if NULL then …` in PL/pgSQL is treated as false — so the exception would *never* fire and the field would be silently accepted (fail open). In practice every normally-created event gets a settings row via `_seed_event_settings()`, but a manually-inserted test event, a future creation path that skips the seed, or an admin-deleted row would all fail open without the `coalesce`. Wrapping in `coalesce(..., false)` makes a missing row reject the field (fail closed), matching this codebase's established guest-surface posture (D51's default-deny rate limiter).

- [ ] **Step 2: Add the two new error mappings to `mapRpcError`**

In `app/api/e/[slug]/_lib.ts`, add two cases to the existing `switch`:

```typescript
    case 'plus_ones_not_allowed':                 return { status: 400, body: 'Plus-ones are not enabled for this event' }
    case 'dietary_not_collected':                 return { status: 400, body: 'Dietary notes are not collected for this event' }
```

- [ ] **Step 3: Confirm the route needs no other change**

`app/api/e/[slug]/rsvp/route.ts` already forwards `plus_one_count`/`dietary_notes` to `submit_rsvp` unconditionally (existing code, `...(plus_one_count !== undefined && { p_plus_one_count: plus_one_count })` etc.) and already routes any RPC error through `mapRpcError` (existing code, `const mapped = mapRpcError(error.message)`). No route-level change is needed — the enforcement now lives entirely inside the RPC, and the route's existing error-handling path picks up the two new cases automatically once Step 2 lands.

- [ ] **Step 4: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => ({ value: 'session-token-abc' }) }),
}))

import { POST } from '@/app/api/e/[slug]/rsvp/route'

const SLUG = 'anya-kabir-20270131'

function makeSupabaseMock(rpcError?: { message: string }) {
  return {
    rpc: vi.fn().mockResolvedValue({ error: rpcError ?? null }),
  }
}

function makeRequest(body: Record<string, unknown>) {
  return new Request(`http://localhost/api/e/${SLUG}/rsvp`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

const ctx = { params: Promise.resolve({ slug: SLUG }) }

describe('POST /api/e/[slug]/rsvp — guest-settings enforcement (inside submit_rsvp)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps plus_ones_not_allowed from the RPC to a 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ message: 'plus_ones_not_allowed' }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      plus_one_count: 1,
    }), ctx)
    expect(res.status).toBe(400)
  })

  it('maps dietary_not_collected from the RPC to a 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock({ message: 'dietary_not_collected' }))
    const res = await POST(makeRequest({
      sub_event_id: '550e8400-e29b-41d4-a716-446655440000',
      response_status: 'confirmed',
      dietary_notes: 'vegetarian',
    }), ctx)
    expect(res.status).toBe(400)
  })

  it('succeeds when the RPC raises no error', async () => {
    createServerClientMock.mockReturnValue(makeSupabaseMock())
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

Note this test suite is now deliberately simpler than the original — it only verifies the route correctly forwards fields and maps RPC errors, since the actual enforcement logic lives in SQL (Step 1) and can't be meaningfully unit-tested through a mocked `.rpc()` call. Step 6 below covers the real enforcement with a live check instead.

- [ ] **Step 5: Run the tests, confirm they pass**

Run: `npx vitest run __tests__/api/e/\[slug\]/rsvp.test.ts`
Expected: PASS, all 3 — this test suite was never red/green against the *enforcement* itself (that's SQL, not TS), only against the route's pass-through/error-mapping, which was already correct before this task.

- [ ] **Step 6: Live verification of the actual enforcement — do not skip, this is what the whole task exists for**

Using the Supabase SQL editor or `mcp__<supabase-project>__execute_sql` directly (not through the Next.js app, since no guest-facing form exists yet per spec §4): call `submit_rsvp` directly with a real guest token against an event where `event_guest_settings.allow_plus_ones = false`, passing a non-null `p_plus_one_count`. Confirm it raises `plus_ones_not_allowed`, not a silent success. Repeat for `collect_dietary_notes = false` + a non-null `p_dietary_notes`. This is the only step in this task that actually proves the fix works — the mocked unit tests above cannot, by construction, exercise real RLS/RPC behavior, which is exactly what let the original bug ship with green tests.

- [ ] **Step 7: Full test suite + typecheck**

Run: `npm run test:run && npx tsc --noEmit`
Expected: clean, no regressions.

- [ ] **Step 8: Commit**

```bash
git add app/api/e/\[slug\]/_lib.ts __tests__/api/e/\[slug\]/rsvp.test.ts
git commit -m "fix(rsvp): move plus-ones/dietary enforcement into submit_rsvp itself, not an RLS-blocked route read"
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

- [ ] **Step 2: Write the component — with a real focus-trap (round-2 council, Frontend Engineer)**

The original component only blocked *mouse* input (`pointer-events:all`). Round-2 review flagged that keyboard users can still Tab into background controls while a save/delete is genuinely in flight — the second half of the round-1 finding, never actually fixed. This version adds a self-contained focus-trap: on activate it stores the previously-focused element, moves focus into the overlay card, and redirects any focus that escapes back into the overlay; on deactivate it restores focus. No dependency on `inert` support or on the consuming page owning a wrapper element.

```tsx
'use client'

import { useEffect, useRef } from 'react'

interface BusyOverlayProps {
  active: boolean
  label?: string
}

export function BusyOverlay({ active, label = 'Saving…' }: BusyOverlayProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    cardRef.current?.focus()

    function keepFocusInside(e: FocusEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        e.stopPropagation()
        cardRef.current.focus()
      }
    }
    // Trap Tab and any programmatic focus escape while busy.
    document.addEventListener('focusin', keepFocusInside, true)
    return () => {
      document.removeEventListener('focusin', keepFocusInside, true)
      previouslyFocused?.focus?.()
    }
  }, [active])

  return (
    <div className={`busy-overlay${active ? ' is-active' : ''}`} aria-hidden={!active}>
      <div
        ref={cardRef}
        className="busy-overlay-card"
        role="status"
        aria-live="polite"
        aria-busy={active}
        tabIndex={-1}
      >
        <span className="busy-overlay-spinner" aria-hidden="true" />
        <span className="busy-overlay-label">{label}</span>
      </div>
    </div>
  )
}
```

Save to `components/ui/BusyOverlay.tsx`. Because the overlay now traps focus while active, the consuming modals (Tasks 8/9) can safely stay mounted underneath it — which is what lets us drop the round-1 "close the modal before the request" change that round-2 flagged as a regression (see Task 8 Step 3).

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

Add `import { BusyOverlay } from '@/components/ui/BusyOverlay'` and render a single overlay driven by either in-flight state:

```tsx
      <BusyOverlay active={saving || deleting} label={deleting ? 'Deleting event…' : 'Saving changes…'} />
```

Place it as a top-level sibling in the returned fragment, alongside the existing toast `<div>`.

**How the modal/overlay interaction is handled (round-2 council correction):** Round 1 flagged that `BusyOverlay` renders over the still-open delete-confirm modal with no focus-trap. Round 1's fix closed the modal *before* the request started — but round 2 (Frontend Engineer) found that regressed the UX: on a *failed* delete the user is dropped to a bare page and must reopen the modal and retype "DELETE" from scratch, and closing the modal in the same tick its own button still holds focus triggers the browser's `aria-hidden`-on-focused-element anti-pattern (focus silently falls to `<body>`). The correct fix is the other option round 1 offered: **leave the modal mounted, and rely on `BusyOverlay`'s focus-trap (added in Task 7 Step 2) to block keyboard escape.** So `handleDelete` keeps its original success-only `setConfirmOpen(false)` (Step 3 below is now a no-op confirmation, not a change) — the modal stays open under the overlay during the request, `BusyOverlay` traps focus, and on failure the modal is still there with "DELETE" still typed, ready to retry.

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

- [ ] **Step 3: Leave `handleDelete`'s modal-close in the success path — do NOT move it before the fetch**

Per the round-2 correction in Step 1, `handleDelete` stays as it is in the current live code (`GeneralSettingsForm.tsx:163-182`) — `setConfirmOpen(false)` (or `router.push('/home')`, which unmounts the whole page) only on success, never before the request. No change is needed to this function beyond what already exists; this step exists only to make the "don't regress this" decision explicit for the implementer, since the round-1 draft of this plan changed it and that change is being deliberately withdrawn. The modal stays mounted under `BusyOverlay` during the request, and `BusyOverlay`'s focus-trap (Task 7) handles the keyboard-blocking that the modal-close was originally meant to solve.

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/GeneralSettingsForm.tsx`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add app/events/\[id\]/settings/GeneralSettingsForm.tsx
git commit -m "feat(settings): wire BusyOverlay into General tab, sequence dual-save, fix modal/overlay stacking"
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

**Modal/overlay interaction (round-2 council correction — same as Task 8 Step 3):** Do NOT move `closeModal()` before the fetch. Round 1 proposed that; round 2 flagged it as the same regression as the delete modal (a failed invite drops the user to a bare page; closing a modal while its own button holds focus triggers the `aria-hidden`-on-focused browser anti-pattern). With `BusyOverlay`'s focus-trap (Task 7 Step 2) now blocking keyboard escape, the invite modal safely stays mounted under the overlay during the request. Keep `handleSendInvite` closing the modal on **success only** — the one real change this task makes to it is folding in Task 12's real-invite-id fix (`json.id`):

```typescript
  async function handleSendInvite() {
    setSending(true)
    try {
      const res = await fetch(`/api/events/${eventId}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const json = await res.json().catch(() => ({})) as { error?: string; id?: string }
      if (!res.ok) {
        flashToast(json.error ?? 'Failed to invite — please try again')
      } else {
        const name = email.split('@')[0] ?? email
        setCollabs(prev => [...prev, {
          id:          json.id ?? crypto.randomUUID(),
          displayName: name,
          email:       email.trim(),
          role,
          status:      'pending',
          initials:    name.slice(0, 2).toUpperCase(),
        }])
        closeModal()
        flashToast('Invite sent')
      }
    } catch {
      flashToast('Network error — please try again')
    } finally {
      setSending(false)
    }
  }
```

(`closeModal()` already resets `email`/`role` — see the existing helper — so it replaces the inline `setEmail('')`/`setRole('co-host')`. This also folds in Task 12's real-invite-id fix — `json.id` — so Task 12 becomes a no-op if this task runs after it; if run before Task 12, apply Task 12's route change first so `json.id` is present in the response.)

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

- [ ] **Step 1: Fetch real status in the layout — reuse the Website tab's existing default, don't invent a second one**

**Council finding:** the Website tab (`app/events/[id]/settings/website/page.tsx:38`) already reads this exact column and defaults missing rows to `?? false` (not offline). A second, independent read in `layout.tsx` with a different default (`?? true`) would make the ToolRail pill disagree with the Website tab's own toggle on the same page load for any brand-new event. Match the existing default exactly.

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

  const siteOffline = siteSettings?.site_offline ?? false // matches website/page.tsx:38's existing default — do not diverge
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

> **Council verdict on the original version of this Part: 🔴 RE-PLAN.** A 5-agent council (Tech Lead, Security Expert, Data Modeller, Backend Engineer, Frontend Engineer — Critique + Debate + Arbiter) reviewed this plan before any task started and found 6 critical, live-verified defects in the original Part D design: (1) `public.events`, `event_website_settings`, and `event_collaborators` were never RLS-converted despite the plan granting app-layer capabilities against them — confirmed live (Backend Engineer + arbiter, queried `smjkbmkxweevqpvygabe` directly) that all three carry exactly one owner-only policy each, meaning the permission system would have silently no-op'd for every real collaborator; (2) the table list omitted `event_task_assignees`, `event_expense_types`, `event_guest_tags`, `event_sub_events`, breaking task-assignment/expense-dropdown/tag-manager for collaborators even on the tables that WERE converted; (3) the original `can_access_event()` SQL had a real logic bug — its unconditional `p_capability is null` branch gave every collaborator role blanket cross-domain read access, not just `viewer`; (4) the original Task 17 PATCH route accepted unvalidated role text, letting a co-host self-promote to `role: 'owner'` and inherit Billing/Delete; (5) no CHECK constraint on `event_collaborators.role`; (6) Task 3's RSVP-toggle enforcement was dead code against an unauthenticated guest session (fixed below in Task 3's revision, not here). Full verdict, dissenting/converging reasoning, and the two overruled severity calls are preserved in the session transcript — this section is the corrected plan, not a diff against the original.
>
> This part is materially bigger than every other task combined (spec §12). It touches RLS on **26 tables** (5 in Task 13; 13 core + 8 website-content in Task 16) and every API route currently doing owner-only checks. Build in this exact order: **Step 0 live audit → RLS foundation with corrected predicate logic (13) → TS access helper (14) → apply to Settings-domain routes (15) → apply to Planning/Guests/Media/Website-content routes (16) → remove/demote UI with the role-escalation fix (17)**.
>
> **🔒 HARD GATE — no session break between Task 13 Steps 4-6 and Task 15 (round-2 council, Tech Lead, CRITICAL).** The original "land them in the same PR/deploy" framing was wrong about *how* the risk is created: Task 13's migrations apply **live via `apply_migration` the instant they run** (there is no git/Vercel "deploy" gating them). The moment Task 13 Steps 4-6 execute the policy DROP+CREATEs, collaborator RLS write access is live in the database — and until Task 15's route-level `requireEventWrite` checks are also live, any authenticated collaborator can write via a direct Supabase REST call (publishable key + their own JWT) that never touches the Next.js app. Task 13 Steps 1-3 (the two functions + the CHECK constraint + the index) grant nothing by themselves and are safe to apply and commit independently. Steps 4-6 (the actual policy conversions) MUST NOT be run until Task 15's route code is written, tested, and ready to apply back-to-back in the same working session — do not stop at an approval gate or session boundary between Task 13 Step 4 and the end of Task 15. If you cannot complete Steps 4-6 + all of Task 15 in one sitting, do not start Step 4.

**Why RLS has to come first:** every event-child table currently has RLS policies of the shape `EXISTS (select 1 from events where events.id = <table>.event_id and events.user_id = (select auth.uid()))` — owner-only, at the database layer, per `DATA-MODEL.md` D26. Even if every API route added a perfect app-level capability check, a collaborator's Supabase queries would still return empty/blocked results underneath, because RLS runs regardless of what the route's own logic decided. D26 already flagged this exact conversion as deferred to "the later collaborator pass" — this is that pass.

### Task 13: RLS foundation — live table audit, corrected `can_read_event()`/`can_write_event()` predicates, full conversion of the 5 confirmed-critical tables

**Files:**
- Migration (via Supabase MCP `apply_migration`, project `smjkbmkxweevqpvygabe`): two new functions + policies on `events`, `event_general_settings`, `event_guest_settings`, `event_website_settings`, `event_collaborators` + a CHECK constraint + an index
- Modify: `docs/data-model/DATA-MODEL.md` (decision log + RLS section)

**Interfaces:**
- Produces: `public.can_read_event(p_event_id uuid, p_capability text default null) returns boolean` and `public.can_write_event(p_event_id uuid, p_capability text) returns boolean` — two SQL functions, `security definer set search_path = public`.

**Council-driven redesign, read before implementing:** the original single-function `can_access_event()` had its `p_capability is null` branch fire unconditionally for every role, on every SELECT policy that (incorrectly) always passed `null` — collapsing "viewer reads everything" and "any table's baseline SELECT policy" into the same code path, so a `photographer` could read guest/task/budget data directly. Splitting into two functions with distinct semantics closes this:
- `can_read_event(event_id, capability)` — `capability = null` means "baseline: is this caller on the event's team at all" (used only by genuinely event-wide tables: `events` itself, `event_sub_events`). `capability = '<domain>'` means "can this caller read this domain's data" — `viewer` passes every domain check unconditionally (matches spec: "read-only everywhere"); `co-host`/`planner`/`photographer` pass only within their own scoped domains, exactly mirroring `EventAccess.canRead()` from Task 14.
- `can_write_event(event_id, capability)` — `capability` is required (no default), `viewer` has **no branch that ever returns true** here at all — not just app-layer-blocked, RLS-layer-blocked too.

- [ ] **Step 0: Live audit of every `event_id`-scoped table's current RLS — do this before writing any conversion list**

The original plan hand-enumerated tables to convert and missed 5 real ones (caught only because 3 different council agents independently cross-checked it). Don't repeat that. Run against the live project:

```sql
select t.table_name, p.policyname, p.cmd, p.qual
from information_schema.tables t
left join pg_policies p on p.tablename = t.table_name and p.schemaname = t.table_schema
where t.table_schema = 'public'
  and t.table_name in (
    select table_name from information_schema.columns
    where column_name = 'event_id' and table_schema = 'public'
  )
order by t.table_name;
```

(The `and p.schemaname = t.table_schema` on the join is a round-2 correctness fix — without it, a same-named table in another schema could misattribute a policy. No behavior change today, since no non-`public` schema has an `event_id` column, but free correctness.)

Also run `select policyname, cmd, qual from pg_policies where tablename = 'events';` separately (its own PK is `id`, not `event_id`, so it won't show up in the query above).

And run `select distinct role from public.event_collaborators;` — Step 3 below adds a `CHECK (role in ('co-host','planner','photographer','viewer'))` constraint, which will **error the whole migration** if any live row holds a value outside that set (the column is documented "open-ended" pre-migration). Confirm every live value is in the allowed set before applying Step 3; if not, clean the offending rows first. (As of the round-2 live check there were 2 rows, both `'co-host'` — but re-verify, don't assume.)

**Cross-reference the audit output against the two authoritative lists in this plan:** Task 13's 5-table list (below) and Task 16's full list (core + website-content). Every `event_id`-scoped table with an owner-only policy must be in exactly one of three buckets: (a) converted by Task 13, (b) converted by Task 16, or (c) named in the **"Deliberately deferred — still owner-only"** list at the end of Task 16 with a one-line rationale. If the audit surfaces a table in none of the three, resolve it into one before proceeding — do not defer it silently, and do not blindly "add it to Task 16" if its routes aren't also being converted there (that would reopen the same-deploy RLS-ahead-of-route gap the HARD GATE above exists to prevent).

- [ ] **Step 1: Create both predicate functions**

Apply via `mcp__<supabase-project>__apply_migration` (name: `collab_access_01`):

```sql
create or replace function public.can_read_event(p_event_id uuid, p_capability text default null)
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
              or c.role = 'viewer'
              or (c.role = 'co-host' and p_capability not in ('billing', 'delete'))
              or (c.role = 'planner' and p_capability in ('guests', 'planning'))
              or (c.role = 'photographer' and p_capability = 'media')
            )
        )
      )
  );
$$;

create or replace function public.can_write_event(p_event_id uuid, p_capability text)
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
              (c.role = 'co-host' and p_capability not in ('billing', 'delete'))
              or (c.role = 'planner' and p_capability in ('guests', 'planning'))
              or (c.role = 'photographer' and p_capability = 'media')
            )
        )
      )
  );
$$;

revoke all on function public.can_read_event(uuid, text) from public, anon, authenticated;
grant execute on function public.can_read_event(uuid, text) to authenticated;
revoke all on function public.can_write_event(uuid, text) from public, anon, authenticated;
grant execute on function public.can_write_event(uuid, text) to authenticated;
```

Two council-driven changes from the original migration text: (a) `can_write_event` has no `role = 'viewer'` branch anywhere — a viewer cannot pass a write check at the RLS layer, not just the app layer; (b) `EXECUTE` is granted to `authenticated` only, not `anon` — every consuming policy in this plan is `to authenticated`, and Security Expert's suggestion (no legitimate anon caller exists) is adopted. Note the explicit `revoke ... from public, anon, authenticated` + scoped `grant` pair, per the D50/`website_16` lesson already recorded in `DATA-MODEL.md`: Supabase grants EXECUTE to `anon`/`authenticated` directly via default privileges, so `revoke from public` alone is a no-op for them — this migration revokes from all three roles explicitly, then grants back only to `authenticated`.

- [ ] **Step 2: Run `get_advisors` (security) immediately after applying**

Use `mcp__<supabase-project>__get_advisors` with type `security`. Confirm no new findings — specifically confirm `anon` has no EXECUTE on either function. Per the D50 lesson, this is the only check that observes actual granted privileges rather than the SQL that was intended to set them.

- [ ] **Step 3: Add the CHECK constraint on `event_collaborators.role` and a covering index**

Apply via `apply_migration` (name: `collab_access_02_collaborators_hardening`):

```sql
alter table public.event_collaborators
  add constraint ck_event_collaborators_role
  check (role in ('co-host', 'planner', 'photographer', 'viewer'));

create index if not exists idx_event_collaborators_user_event
  on public.event_collaborators (user_id, event_id)
  where status = 'active';
```

`'owner'` is deliberately excluded from the allowed values — owner identity lives only on `events.user_id` (per D16, owner is never a collaborator row), so no value in this column should ever be `'owner'`. This is the DB-layer half of closing the Task 17 role-escalation bug (the app-layer half is Task 17's revised zod schema) — Security Expert's debate-round finding was explicit that the zod fix alone is insufficient, since a direct Supabase REST call bypasses Next.js validation entirely; this constraint holds regardless of which path writes the row. The partial index (`where status = 'active'`) backs both predicate functions' `event_collaborators` lookups, which now run on effectively every authenticated request touching a converted table.

- [ ] **Step 4: Convert `public.events` — the table every other collaborator-facing query depends on**

Apply via `apply_migration` (name: `collab_access_03_events`). First confirm the real existing policy name: `select policyname, cmd, qual from pg_policies where tablename = 'events';` (the plan's earlier IDOR-fix session referenced this as `events_owner_all` — confirm live, don't assume).

```sql
drop policy if exists "<real policy name from the query above>" on public.events;

create policy "owner_all_events" on public.events
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "collab_select_events" on public.events
  for select to authenticated
  using (public.can_read_event(id, null));

create policy "collab_update_events" on public.events
  for update to authenticated
  using (public.can_write_event(id, 'general'))
  with check (public.can_write_event(id, 'general'));

-- Column-immutability guard for collaborator updates. RLS WITH CHECK cannot reference
-- OLD, so it cannot express "a co-host may change name/date/venue but NOT user_id or
-- deleted_at". This trigger does — matching this codebase's existing guard-trigger
-- pattern (event_id guards, D23/D27). Without it, collab_update_events would let a
-- co-host UPDATE events SET user_id = <their own id> (steal ownership) or set deleted_at
-- (soft-delete) via a direct Supabase REST call. The owner (auth.uid() = old.user_id)
-- is exempt and keeps full control via owner_all_events.
create or replace function public.guard_events_collab_update()
returns trigger
security definer set search_path = public
language plpgsql as $$
begin
  if (select auth.uid()) is distinct from old.user_id then
    if new.user_id is distinct from old.user_id then
      raise exception 'collaborators cannot transfer event ownership';
    end if;
    if new.deleted_at is distinct from old.deleted_at then
      raise exception 'collaborators cannot delete or restore the event';
    end if;
  end if;
  return new;
end; $$;

revoke all on function public.guard_events_collab_update() from public, anon, authenticated;

drop trigger if exists trg_guard_events_collab_update on public.events;
create trigger trg_guard_events_collab_update
  before update on public.events
  for each row execute function public.guard_events_collab_update();
```

Three policies + a guard trigger (round-2 council fix, Security Expert's functional gap — with a self-caught ownership-theft hole closed): `owner_all_events` preserves the owner's full `FOR ALL` access unchanged; `collab_select_events` adds baseline SELECT for any active collaborator regardless of role; `collab_update_events` lets a `co-host` (the only non-owner role whose `can_write_event(id, 'general')` returns true) save core event fields via the General tab's dual-save. **The `trg_guard_events_collab_update` trigger is the column-level guard** that keeps ownership-transfer and soft-delete owner-only — RLS `WITH CHECK` alone can't do this because it can't compare `NEW` against `OLD`, so a `WITH CHECK (deleted_at is null)` would block delete but leave `user_id` freely changeable (the ownership-theft hole a manual trace caught during this round-2 fix). The trigger rejects any non-owner update that changes `user_id` or `deleted_at`, so a co-host editing name/date/venue succeeds while an attempt to steal ownership or soft-delete via direct REST is rejected at the database. Without any of this, a co-host with `'general'` capability could save `event_general_settings` (tagline) but the General tab's parallel `PUT /api/events/[id]` write of name/date/venue would fail at the RLS layer — a real functional gap the first two review rounds missed. Task 15 (revised) adds the matching `requireEventWrite(..., 'general')` on that PUT route and `requireEventWrite(..., 'delete')` on the DELETE route so the app and DB layers agree; the DELETE route's soft-delete write runs as the owner (only owners have `'delete'`), so the trigger's owner-exemption lets it through.

- [ ] **Step 5: Convert `event_general_settings`, `event_guest_settings`, `event_website_settings`**

Same two-policy shape (owner `FOR ALL` unchanged + collaborator SELECT/write split), capability-scoped this time since these are domain tables, not baseline. Apply via `apply_migration` (name: `collab_access_04_settings_tables`) after confirming each table's real existing policy name via the same `pg_policies` query as Step 4:

```sql
-- event_general_settings — capability 'general'
drop policy if exists "<real name>" on public.event_general_settings;
create policy "owner_all_general_settings" on public.event_general_settings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collab_select_general_settings" on public.event_general_settings
  for select to authenticated using (public.can_read_event(event_id, 'general'));
create policy "collab_write_general_settings" on public.event_general_settings
  for all to authenticated using (public.can_write_event(event_id, 'general')) with check (public.can_write_event(event_id, 'general'));

-- event_guest_settings — capability 'guests'
drop policy if exists "<real name>" on public.event_guest_settings;
create policy "owner_all_guest_settings" on public.event_guest_settings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collab_select_guest_settings" on public.event_guest_settings
  for select to authenticated using (public.can_read_event(event_id, 'guests'));
create policy "collab_write_guest_settings" on public.event_guest_settings
  for all to authenticated using (public.can_write_event(event_id, 'guests')) with check (public.can_write_event(event_id, 'guests'));

-- event_website_settings — capability 'website'
drop policy if exists "<real name>" on public.event_website_settings;
create policy "owner_all_website_settings" on public.event_website_settings
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "collab_select_website_settings" on public.event_website_settings
  for select to authenticated using (public.can_read_event(event_id, 'website'));
create policy "collab_write_website_settings" on public.event_website_settings
  for all to authenticated using (public.can_write_event(event_id, 'website')) with check (public.can_write_event(event_id, 'website'));
```

Each table's DROP+CREATE pair goes in one `apply_migration` call, not split across multiple round-trips (Backend Engineer's blind-spot finding: a policy swap split across two separate migration calls could leave a brief no-policy or old-policy-only window — both fail *closed*, so it's an availability risk, not a security hole, but avoid it). **Atomicity caveat (round-2 council, Data Modeller):** that a single `apply_migration` call wraps its statements in one transaction is *assumed, not verified* here — Postgres DDL is transactional per-session, and the MCP tool plausibly wraps each call in one implicit transaction, but this repo has no confirmed record of that behavior. Before trusting it for the real DROP+CREATE pairs, run a cheap pre-flight: a throwaway migration with a deliberate error in its second statement, then confirm the first statement rolled back. If it did not roll back (the tool auto-commits per statement), split each table into a single `create policy` after having first confirmed the drop, or use `ALTER POLICY` where a shape change isn't needed. DROP+CREATE (not `ALTER POLICY`) is the correct tool for the *shape* change here — D50's `ALTER POLICY` case only changed a `USING` clause on an existing same-shaped policy; this conversion turns one `FOR ALL` into three policies (owner `FOR ALL` + collaborator `SELECT` + collaborator `FOR ALL`), which `ALTER POLICY` cannot express.

- [ ] **Step 6: Add self-select + write policies to `event_collaborators` itself**

This table was never touched by any policy in the original plan despite Task 17 writing to it directly. Apply via `apply_migration` (name: `collab_access_05_collaborators_policies`) — confirm the real existing policy name first:

```sql
drop policy if exists "<real name, e.g. collaborators_via_event>" on public.event_collaborators;

create policy "owner_all_collaborators" on public.event_collaborators
  for all to authenticated
  using (event_id in (select id from public.events where user_id = (select auth.uid())))
  with check (event_id in (select id from public.events where user_id = (select auth.uid())));

create policy "collab_self_select" on public.event_collaborators
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "collab_write_admins" on public.event_collaborators
  for all to authenticated
  using (public.can_write_event(event_id, 'admins'))
  with check (public.can_write_event(event_id, 'admins'));
```

Three distinct policies fixing three distinct failure modes the council identified as separate (Data Modeller's debate-round table): `owner_all_collaborators` preserves today's owner behavior; `collab_self_select` is what makes `getEventAccess()`'s own self-lookup query work at all (this was the live-confirmed root cause of the entire permission system's silent no-op — without this policy, a collaborator querying for their own row gets zero rows back regardless of anything else in this plan); `collab_write_admins` is the RLS-layer backstop for Task 17's DELETE/PATCH, so a co-host's admin action is enforced at both the route and the database, not the route alone.

- [ ] **Step 7: `get_advisors` again, then confirm every conversion live**

Run `get_advisors` (security). Then run the Step 0 audit query again, filtered to the 5 tables converted in this task (`events`, `event_general_settings`, `event_guest_settings`, `event_website_settings`, `event_collaborators`) — confirm each shows the new policy set, not the old single owner-only policy.

- [ ] **Step 8: Document in DATA-MODEL.md**

Add a new subsection under the RLS section describing `can_read_event()`/`can_write_event()`'s signatures, the capability matrix, and the `event_collaborators.role` CHECK constraint. Add a decision-log entry (next available `D` number) recording: this is the D26-deferred collaborator RLS conversion; it covers `events`, `event_general_settings`, `event_guest_settings`, `event_website_settings`, `event_collaborators` in this task, remaining Planning/Guests/Media tables in Task 16; and that a council review (2026-08-06) caught and fixed a real logic bug in an earlier draft of the predicate function (single-function version's unconditional null-capability branch granted unintended blanket read) before it was ever applied to the live database — record this the same way `D50`/`website_16` record the `revoke from public` lesson, since it's the same category of "reads as correct, wrong until tested/reviewed" bug this project keeps a running list of.

- [ ] **Step 9: Regenerate TypeScript types**

Run `mcp__<supabase-project>__generate_typescript_types`, written to `lib/supabase/database.types.ts`. No column-shape changes are expected; this confirms the migrations didn't break schema introspection (a cheap check, not a deep one — `apply_migration` itself would already have failed loudly on a DDL error).

- [ ] **Step 10: Commit the docs change (migrations themselves are already live via MCP, not file-based)**

```bash
git add docs/data-model/DATA-MODEL.md
git commit -m "docs: record can_read_event()/can_write_event() RLS predicates + 5-table conversion, council-corrected"
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
import { getEventAccess, requireEventWrite, type EventRole, type EventCapability } from '@/lib/auth/eventAccess'

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

// Drift-guard (round-2 council, Security Expert): pins the capability model so an
// accidental edit to CAPABILITY_MATRIX fails loudly. This is the TS half; the SQL
// predicates can_read_event/can_write_event (Task 13) must be updated in lockstep —
// there is no automated cross-check between the two, so this test's failure is the
// signal to also re-check the migration.
describe('capability model — drift guard', () => {
  const cases: Array<[EventRole, EventCapability, 'read+write' | 'read-only' | 'none']> = [
    ['owner', 'billing', 'read+write'], ['owner', 'delete', 'read+write'], ['owner', 'general', 'read+write'],
    ['co-host', 'general', 'read+write'], ['co-host', 'website', 'read+write'], ['co-host', 'billing', 'none'], ['co-host', 'delete', 'none'],
    ['planner', 'planning', 'read+write'], ['planner', 'guests', 'read+write'], ['planner', 'website', 'none'], ['planner', 'media', 'none'],
    ['photographer', 'media', 'read+write'], ['photographer', 'guests', 'none'], ['photographer', 'planning', 'none'],
    ['viewer', 'billing', 'read-only'], ['viewer', 'media', 'read-only'], ['viewer', 'guests', 'read-only'],
  ]
  it.each(cases)('%s + %s → %s', async (role, cap, expected) => {
    const isOwner = role === 'owner'
    const access = await getEventAccess(makeSupabase({ isOwner, collabRole: isOwner ? undefined : role }) as never, 'event-1', 'u')
    expect(access.canRead(cap)).toBe(expected !== 'none')
    expect(access.canWrite(cap)).toBe(expected === 'read+write')
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

// ⚠️ This matrix MUST stay in sync with the SQL predicates public.can_read_event() /
// public.can_write_event() (Task 13 Step 1). They are two hand-maintained copies of the
// same capability model — if you change one, change the other. The drift-guard test in
// __tests__/lib/auth/eventAccess.test.ts pins this matrix so an accidental TS-side edit
// fails loudly; there is no automated check on the SQL side, so treat any change here as
// a paired change to the migration.
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
Expected: PASS — the 8 behavior tests plus the 17-case drift-guard table.

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

> **🔒 Part of the HARD GATE with Task 13 Steps 4-6 — see the Part D intro.** This task's route checks and Task 13's policy conversions must go live back-to-back in one working session, no approval-gate or session break between them. Do not start Task 13 Step 4 unless you can finish through this task's Step 7 in the same sitting.

**Files:**
- Modify: `app/api/events/[id]/route.ts` (PUT → `'general'`, DELETE → `'delete'`) — round-2 addition, see Step 0 below
- Modify: `app/api/events/[id]/general-settings/route.ts`
- Modify: `app/api/events/[id]/guest-settings/route.ts`
- Modify: `app/api/events/[id]/website-settings/route.ts`
- Modify: `app/api/events/[id]/admins/route.ts` (POST — auth gate + invite-role schema, see Step 2)

**Interfaces:**
- Consumes: `requireEventWrite` from Task 14 (which now calls `can_write_event()` at the RLS layer via each table's `collab_write_*` policy from Task 13 — the app-layer and DB-layer checks are two independent enforcement points on the same capability string, by design)

- [ ] **Step 0: Convert the core `events` route (round-2 council addition — Security Expert's functional gap)**

`app/api/events/[id]/route.ts` holds the General tab's core-field save (`PUT`, name/date/venue) and the event soft-delete (`DELETE`). It was missing from the original Task 15 list, which meant a co-host with `'general'` capability could save the tagline sidecar but not the core event fields the same tab writes in parallel. Read the file first (`grep -n "verifyOwnership\|user_id.*user.id\|auth.getUser" app/api/events/\[id\]/route.ts`), then:
- `PUT` handler → gate with `requireEventWrite(supabase, id, user.id, 'general')` (co-host + owner pass; matches the new `collab_update_events` RLS policy from Task 13 Step 4).
- `DELETE` handler → gate with `requireEventWrite(supabase, id, user.id, 'delete')` (owner-only, since no non-owner role has `'delete'` in the capability matrix; matches the `deleted_at is null` guard on `collab_update_events`, which blocks a co-host from soft-deleting at the RLS layer too).

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

- [ ] **Step 2: Apply the identical transform to the other 3 routes — and tighten the invite-role schema**

Same before/after shape, different capability string per route:
- `guest-settings/route.ts` → `'guests'`
- `website-settings/route.ts` → `'website'`
- `admins/route.ts` (the `POST` handler's existing owner-check block, lines 30-37) → `'admins'`

**Round-2 council fix (Security Expert):** the `POST /api/events/[id]/admins` invite handler's authorization just widened from owner-only to any co-host (it now uses `requireEventWrite(..., 'admins')`, and co-host has that capability). Its existing invite-body zod schema is currently `role: z.string().max(50).default('co-host')` (confirmed in the live file) — the same open-string shape that was the Task 17 escalation vector. Tighten it in this same change to `role: z.enum(['co-host', 'planner', 'photographer', 'viewer']).default('co-host')`, so a co-host cannot invite a new collaborator with `role: 'owner'` (or any junk value). This fails closed at the DB layer anyway via Task 13 Step 3's CHECK constraint, but that would surface as an unhandled 500; the zod enum returns a clean 400 and keeps the app-layer validation complete. Also confirm the route maps a Postgres CHECK-constraint violation (error code `23514`) to a clean 400 rather than leaking a raw 500.

- [ ] **Step 3: Update the existing tests for these routes to mock the new helper's dependency shape**

For each route's existing test file (if one exists — check via `find __tests__ -path "*general-settings*" -o -path "*guest-settings*" -o -path "*website-settings*" -o -path "*admins*"`), update the Supabase mock so `getEventAccess`'s two-query pattern (events lookup, then collaborators lookup) resolves the way the test expects — mirror the mock shape from Task 14's own test file.

If no test files exist yet for these routes, write one per route following the `delete.test.ts` pattern shown in Task 3, covering: owner succeeds, non-owner/non-collaborator gets 404, an active collaborator with the wrong role gets 404, an active collaborator with the right role succeeds.

- [ ] **Step 4: Typecheck, full test suite**

Run: `npx tsc --noEmit && npm run test:run`
Expected: clean.

- [ ] **Step 5: Live two-account verification**

Owner invites a co-host, co-host accepts. Co-host logs in, navigates to the event's Website/Guests/General settings tabs directly (`/events/[id]/settings/...`), confirms they can now view and save (previously would have 404'd at the RLS layer even before hitting the route's own check), including the General tab's core name/date/venue save (the round-2 `collab_update_events` + `events`-route fix).

**Round-2 council fix (Security Expert) — use the right role for the read/write-split check.** The original wording tested a `planner` on the Website tab to demonstrate "readable in raw Supabase, write-blocked by the route" — but that's wrong: `can_read_event(event_id, 'website')` returns false for a planner (planner only matches `'guests'`/`'planning'`), so a planner is deny/deny on Website, not read/write-split. The role that actually demonstrates the split is a **`viewer`**: `can_read_event` returns true for every capability (so a viewer sees Website/Guests/etc. data in raw Supabase), while `can_write_event`/`requireEventWrite` return false for all of them (so every save 404s). Verify with a `viewer` collaborator: confirm they can load/read the Website and Guests tabs but every Save returns 404. Separately confirm a `planner` gets deny/deny on Website (can't even read it) but read+write on Planning/Guests.

- [ ] **Step 6: Commit**

```bash
git add app/api/events/\[id\]/route.ts app/api/events/\[id\]/general-settings/route.ts app/api/events/\[id\]/guest-settings/route.ts app/api/events/\[id\]/website-settings/route.ts app/api/events/\[id\]/admins/route.ts
git commit -m "feat(permissions): apply tiered capability checks to Settings-domain + core event routes"
```

---

### Task 16: Extend RLS + capability checks to Planning, Guests, and Media routes — corrected table list

> **Council findings, fixed here (rounds 1 + 2):** round 1 caught 4 tables missing from the original list (`event_task_assignees`, `event_expense_types`, `event_guest_tags`, `event_sub_events`). Round 2 (Backend Engineer, live-verified) caught an entire missing **Website-content domain** — the `'website'` capability was only ever wired to `event_website_settings` (the toggles table), but a co-host with `'website'` capability actually needs to edit page content, and every one of those routes/tables was still owner-only, so a co-host would 404 on every real website-editor action, directly contradicting spec §7.1's "co-host = full parity except Billing/Delete." The 8 website-content tables + their 15 route files are added below. Cross-check the full list against the Step 0 live audit — every `event_id`-scoped table it surfaces must land in this task, in Task 13, or in the explicit "Deliberately deferred" list at the end of this task.

**Files:**
- RLS migration (via MCP), Planning (`'planning'`): `event_tasks`, `event_budgets`, `event_expenses`, `event_task_assignees`, `event_expense_types`
- Guests (`'guests'`): `event_guests`, `event_guest_sub_events`, `event_guest_tag_links`, `event_guest_tags`
- Media (`'media'`): `event_media`, `event_albums`, `event_media_albums`
- Website-content (`'website'`, round-2 addition): `event_website_design`, `event_website_pages`, `event_website_sections`, `event_story_blocks`, `event_wedding_party_members`, `event_qa_items`, `event_travel_points`, `event_stays`
- Baseline read-only: `event_sub_events` (`can_read_event(event_id, null)`, no `collab_write_*` policy — read by every role via Event Hub/Guest Mgmt; keep the existing owner-only `FOR ALL` policy unchanged for writes)
- Modify (apply `requireEventWrite` the same way as Task 15): every route file listed in Step 3

**Interfaces:**
- Consumes: `can_read_event()`/`can_write_event()` (Task 13), `requireEventWrite` (Task 14)

- [ ] **Step 1: Convert RLS on the Planning tables**

Same two-policy-plus-owner shape as Task 13 Step 5, capability `'planning'`, for `event_tasks`, `event_budgets`, `event_expenses`, `event_task_assignees`, `event_expense_types` — 5 tables, not 3. Confirm real existing policy names via `pg_policies` before dropping, exactly as in Task 13.

- [ ] **Step 2: Convert RLS on the Guests, Media, Website-content, and `event_sub_events` tables**

Same pattern, capability `'guests'` for `event_guests`/`event_guest_sub_events`/`event_guest_tag_links`/`event_guest_tags` (4 tables); capability `'media'` for `event_media`/`event_albums`/`event_media_albums` (3 tables); capability `'website'` for `event_website_design`/`event_website_pages`/`event_website_sections`/`event_story_blocks`/`event_wedding_party_members`/`event_qa_items`/`event_travel_points`/`event_stays` (8 tables — round-2 addition). For `event_sub_events`, add only a `collab_select_sub_events` policy using `can_read_event(event_id, null)` — no write policy, per the table note above. Run `get_advisors` after each domain's conversion, not just once at the end.

- [ ] **Step 3: Apply `requireEventWrite` to every route in these three domains**

**Council finding, fixed here:** the original instruction ("grep for the existing check, replace it") failed when spot-checked against real files — `guests/route.ts`, `media/route.ts`, and `planning/tasks/route.ts` all authenticate the caller but have **no app-level ownership check at all today**, relying entirely on RLS. There's nothing to "replace" in those files; `requireEventWrite` needs to be **added**, not swapped in. Before editing any file in the list below, run this per file to know which case you're in:

```bash
grep -n "verifyOwnership\|\.eq('user_id', user\.id)\|auth\.getUser()" <file>
```

If the file has an ownership check (any shape), replace it with `requireEventWrite`. If it only has `auth.getUser()` and nothing else, add the `requireEventWrite` call immediately after the auth check, in the same position the check would go in every other route in this codebase.

Exact file list:

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

Website-content (`'website'`, round-2 addition — Backend Engineer live-confirmed all of these hardcode `verifyOwnership()` today):
- `app/api/events/[id]/website-design/route.ts`
- `app/api/events/[id]/website-design/commit/route.ts`
- `app/api/events/[id]/website-design/upload-url/route.ts`
- `app/api/events/[id]/website-pages/route.ts`
- `app/api/events/[id]/website-pages/[pageId]/route.ts`
- `app/api/events/[id]/story-blocks/route.ts`
- `app/api/events/[id]/story-blocks/[blockId]/route.ts`
- `app/api/events/[id]/wedding-party/route.ts`
- `app/api/events/[id]/wedding-party/[memberId]/route.ts`
- `app/api/events/[id]/qa-items/route.ts`
- `app/api/events/[id]/qa-items/[itemId]/route.ts`
- `app/api/events/[id]/travel-points/route.ts`
- `app/api/events/[id]/travel-points/[pointId]/route.ts`
- `app/api/events/[id]/stays/route.ts`
- `app/api/events/[id]/stays/[stayId]/route.ts`

(No separate route files exist for `event_task_assignees`/`event_expense_types`/`event_website_sections` — they're written through their parent-domain routes already in the lists above, e.g. assigning a task writes an `event_task_assignees` row from within `planning/tasks/[taskId]/route.ts`, and sections are written through `website-pages`. Confirm via `grep -rln "event_task_assignees\|event_expense_types\|event_website_sections" app/api/events/\[id\]` before assuming no route-level change is needed for these three tables — if a dedicated route is found, add it.)

Apply `requireEventWrite`, per the Step 3 decision-tree above, to every file above. Total: ~37 route files across four domains. These website-content routes are the ones that DO have an existing `verifyOwnership()` to *replace* (unlike Planning/Guests/Media, which mostly need the check *added*) — so both branches of Step 3's decision-tree get exercised.

- [ ] **Step 4: Update/add tests per route — hard requirement with an enforced coverage check**

**Council finding, fixed here (rounds 1 + 2):** round 1 removed the "skip if time-constrained" escape hatch; round 2 (Tech Lead) noted the "no exceptions" wording still had no *verification* step — a green suite passes whether every route got 4 cases or only some did. So: every route in this task's file list gets the full 4-case test (owner succeeds / non-owner-non-collaborator gets 404 / wrong-role collaborator gets 404 / right-role collaborator succeeds), and this is verified by a concrete count, not by wording alone.

This is exactly the surface class that already produced 2 live IDOR bugs earlier this same session (spec §0). Split into sequenced sub-commits by domain (Planning → Guests → Media → Website-content) rather than shipping any domain under-tested.

- [ ] **Step 5: Enforce coverage with a count check, then full suite + typecheck**

Run, per domain, a count of `it()` blocks across that domain's test files and confirm each route file's test has ≥4 cases:

```bash
for f in $(find __tests__/api/events -path "*planning*" -o -path "*guests*" -o -path "*guest-tags*" -o -path "*media*" -o -path "*website*" -o -path "*story-blocks*" -o -path "*wedding-party*" -o -path "*qa-items*" -o -path "*travel-points*" -o -path "*stays*" -name "*.test.ts"); do
  echo "$(grep -c 'it(' "$f")  $f"
done
```

Every route file in this task's list must have a corresponding test file with a count ≥4. If any route file has no test file, or a count below 4, this task is not done. Then:

Run: `npm run test:run && npx tsc --noEmit`
Expected: clean.

- [ ] **Step 6: Live verification per role**

Using a `planner` collaborator: confirm Planning + Guests writes succeed, Media + Website-content writes 404. Using a `photographer` collaborator: confirm Media writes succeed, Planning + Guests + Website-content writes 404. Using a `co-host`: confirm Website-content writes succeed (the round-2 gap this closes). This is the highest-risk verification in the whole plan (spec §11) — don't skip it for time.

- [ ] **Step 7: Commit**

```bash
git add app/api/events/\[id\]/planning app/api/events/\[id\]/guests app/api/events/\[id\]/guest-tags app/api/events/\[id\]/media app/api/events/\[id\]/website-design app/api/events/\[id\]/website-pages app/api/events/\[id\]/story-blocks app/api/events/\[id\]/wedding-party app/api/events/\[id\]/qa-items app/api/events/\[id\]/travel-points app/api/events/\[id\]/stays __tests__/api/events
git commit -m "feat(permissions): extend tiered capability checks + RLS to Planning, Guests, Media, and Website-content routes"
```

- [ ] **Step 8: Document the deliberately-deferred tables**

Append a "**Deliberately deferred — still owner-only after this pass**" note to `DATA-MODEL.md`'s new collaborator-access subsection, naming every `event_id`-scoped table left un-converted, with a one-line rationale each (round-2 council: Data Modeller + Backend Engineer both flagged that an *undocumented* omission is the same failure class as the original oversight — an explicit, reasoned deferral is not):

- `event_invitation_cards` — Digital Invitations FE is unpersisted (no live route reads/writes it, confirmed by grep). Convert under a future `'invitations'` capability when that feature is wired; owner-only until then.
- `event_media_tags`, `event_media_tag_links` — schema exists (D37) but no live route touches them (confirmed by grep). Convert under `'media'` when media-tagging is wired to a route.

If the Step 0 audit surfaced any other `event_id`-scoped table not in Task 13's or this task's conversion lists, add it here with its own rationale rather than leaving it silently un-converted.

---

### Task 17: Remove/demote a collaborator

> **Council finding, fixed here — was the single most severe defect the review found:** the original version of this task's `PATCH` schema was `z.object({ role: z.string().max(50) })`, no enum restriction. Since `isEventRole()` (Task 14) explicitly accepts `'owner'` as a valid value, a co-host with `'admins'` capability could `PATCH` **their own** collaborator row to `role: 'owner'` and, on their next request, inherit the full owner capability set including Billing and Delete-event — directly contradicting this plan's own Global Constraint that those two stay hardcoded to `events.user_id`. Fixed below with a closed zod enum excluding `'owner'`, backed by Task 13's DB-level CHECK constraint as defense-in-depth against any write path that bypasses this route entirely (a direct Supabase REST call, a future admin script). The council also flagged (lower severity, bundled here as a drive-by rather than its own task) that the original `DELETE`/`PATCH` shape took the target id via query-param/body instead of this codebase's established path-segment convention (compare `media/[mediaId]/route.ts`) — fixed by moving both handlers to their own `[collaboratorId]/route.ts` file.

**Files:**
- Create: `app/api/events/[id]/admins/[collaboratorId]/route.ts` (`DELETE`, `PATCH`)
- Modify: `app/events/[id]/settings/admins/AdminsContent.tsx`
- Test: `__tests__/api/events/[id]/admins/[collaboratorId]/route.test.ts` (new)

**Interfaces:**
- Produces: `DELETE /api/events/[id]/admins/[collaboratorId]`, `PATCH /api/events/[id]/admins/[collaboratorId]` with body `{ role: 'co-host' | 'planner' | 'photographer' | 'viewer' }`

- [ ] **Step 1: Write the failing tests**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { createServerClientMock } = vi.hoisted(() => ({ createServerClientMock: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: createServerClientMock }))
vi.mock('next/headers', () => ({ cookies: vi.fn().mockResolvedValue({ getAll: () => [], set: vi.fn() }) }))

import { DELETE, PATCH } from '@/app/api/events/[id]/admins/[collaboratorId]/route'

const EVENT_ID = '550e8400-e29b-41d4-a716-446655440000'
const COLLAB_ID = '660e8400-e29b-41d4-a716-446655440001'

// Owner-path mock: getEventAccess resolves 'owner' from the events lookup and never
// queries event_collaborators for the caller's role, so the target-row lookup (guard)
// is the only event_collaborators .single() call — it returns a non-self user_id here.
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
        table === 'events'
          ? (opts.isOwner ? { data: { id: EVENT_ID }, error: null } : { data: null, error: { message: 'not found' } })
          : table === 'event_collaborators'
            ? { data: { user_id: 'user-2' }, error: null } // target is someone else, guard passes
            : { data: null, error: { message: 'not found' } }
      )
      chain.eq = vi.fn().mockImplementation(() => chain) // terminal for delete/update chains
      return chain
    }),
  }
}

const ctx = { params: Promise.resolve({ id: EVENT_ID, collaboratorId: COLLAB_ID }) }

describe('DELETE /api/events/[id]/admins/[collaboratorId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('rejects a non-owner, non-co-host caller with 404', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: false }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(404)
  })

  it('removes the collaborator when the caller is the owner', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, { method: 'DELETE' })
    const res = await DELETE(req, ctx)
    expect(res.status).toBe(204)
  })

  // 6th case (self-removal → 400, the lockout guard): the caller must resolve as an
  // active co-host (so requireEventWrite('admins') passes) AND the target row's user_id
  // must equal the caller's. Because getEventAccess's own role-lookup and the guard's
  // target-lookup both hit event_collaborators.single(), a co-host-caller mock needs to
  // return { role: 'co-host', user_id: 'user-1' } for that table (the caller IS the
  // target). Add this case with that mock shape — assert status 400.
})

describe('PATCH /api/events/[id]/admins/[collaboratorId]', () => {
  beforeEach(() => vi.clearAllMocks())

  it('updates the role when the caller has admins capability', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'planner' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(200)
  })

  it('rejects role: "owner" with 400 — the escalation vector the council found', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'owner' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(400)
  })

  it('rejects an unrecognized role string with 400', async () => {
    createServerClientMock.mockReturnValue(makeSupabase({ isOwner: true }))
    const req = new Request(`http://localhost/api/events/${EVENT_ID}/admins/${COLLAB_ID}`, {
      method: 'PATCH',
      body: JSON.stringify({ role: 'super-admin' }),
    })
    const res = await PATCH(req, ctx)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run, confirm failure**

Run: `npx vitest run __tests__/api/events/\[id\]/admins/\[collaboratorId\]/route.test.ts`
Expected: FAIL — file doesn't exist yet.

- [ ] **Step 3: Implement both handlers**

Create `app/api/events/[id]/admins/[collaboratorId]/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireEventWrite } from '@/lib/auth/eventAccess'

const uuidSchema = z.string().uuid()

// Deliberately excludes 'owner' — owner identity lives only on events.user_id (D16),
// never on an event_collaborators row. This is the app-layer half of closing the
// self-escalation bug the council found; Task 13's CHECK constraint is the DB-layer half.
const patchSchema = z.object({
  role: z.enum(['co-host', 'planner', 'photographer', 'viewer']),
}).strict()

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
): Promise<NextResponse> {
  try {
    const { id, collaboratorId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireEventWrite(supabase, id, user.id, 'admins')
    if (!access.ok) return access.response

    // Lockout guard (round-2 council): a co-host must not be able to remove their own
    // access mid-session and strand themselves. The owner can never hit this (owner is
    // never a collaborator row), so this only protects a co-host from self-removal.
    const { data: target } = await supabase
      .from('event_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .eq('event_id', id)
      .single()
    if (target?.user_id && target.user_id === user.id) {
      return NextResponse.json({ error: "You can't remove your own access" }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_collaborators')
      .delete()
      .eq('id', collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('DELETE /api/events/[id]/admins/[collaboratorId] failed:', error)
      return NextResponse.json({ error: 'Failed to remove collaborator' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; collaboratorId: string }> }
): Promise<NextResponse> {
  try {
    const { id, collaboratorId } = await params
    if (!uuidSchema.safeParse(id).success || !uuidSchema.safeParse(collaboratorId).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
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

    // Lockout guard (round-2 council): a co-host must not demote themselves out of
    // 'admins' capability mid-session. Same self-target check as DELETE.
    const { data: target } = await supabase
      .from('event_collaborators')
      .select('user_id')
      .eq('id', collaboratorId)
      .eq('event_id', id)
      .single()
    if (target?.user_id && target.user_id === user.id) {
      return NextResponse.json({ error: "You can't change your own role" }, { status: 400 })
    }

    const { error } = await supabase
      .from('event_collaborators')
      .update({ role: parsed.data.role })
      .eq('id', collaboratorId)
      .eq('event_id', id)

    if (error) {
      console.error('PATCH /api/events/[id]/admins/[collaboratorId] failed:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

Note this is a **new file**, not an append to `app/api/events/[id]/admins/route.ts` — the existing `POST` handler (invite) stays in the parent `admins/route.ts` untouched; `DELETE`/`PATCH` live in the new `[collaboratorId]` sub-route, matching this codebase's established path-segment convention (`media/[mediaId]/route.ts`).

- [ ] **Step 4: Run, confirm pass**

Run: `npx vitest run __tests__/api/events/\[id\]/admins/\[collaboratorId\]/route.test.ts`
Expected: PASS — the escalation-rejection cases (role: 'owner' and unrecognized role → 400) and the self-removal lockout case (→ 400) all green.

- [ ] **Step 5: Wire the UI — remove control**

In `AdminsContent.tsx`, replace the disabled `more_horiz` button (lines 123-132) with a working remove action. Add state + handler:

```typescript
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleRemove(collabId: string) {
    setRemovingId(collabId)
    try {
      const res = await fetch(`/api/events/${eventId}/admins/${collabId}`, { method: 'DELETE' })
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
git add app/api/events/\[id\]/admins/\[collaboratorId\]/route.ts app/events/\[id\]/settings/admins/AdminsContent.tsx __tests__/api/events/\[id\]/admins
git commit -m "feat(admins): add remove/demote-collaborator routes with role-escalation fix, wire remove button in UI"
```

---

## Part E — Usage tab

### Task 18: New per-event Usage tab

> **Council ordering requirement — this task must run after Task 16, not in parallel with Part D and not independently.** The arbiter read the live `event_hub_summary` view definition (`security_invoker = on`) and traced this task's 3 columns (`guest_total`, `task_percent`, `budget_percent`) to their source views/tables — `event_guests`/`event_guest_sub_events` (guests), `event_tasks` (tasks), `event_budgets`/`event_expenses` (budget) — all of which are in Task 16's conversion list. Under `security_invoker`, a collaborator querying this view before Task 16 lands gets silently zeroed/null numbers instead of an error (RLS-filtered joins return empty rows, not failures) — this task depends specifically on Task 16, not on Tasks 13/14/15/17. It also depends on Task 13's `events` conversion (Step 4) for the page to load for a collaborator at all, since Step 3 below gates on `.from('events')...single()` before anything else runs.

**Files:**
- Create: `app/events/[id]/settings/usage/page.tsx`
- Create: `app/events/[id]/settings/usage/UsageContent.tsx`
- Modify: `app/events/[id]/settings/SettingsNav.tsx`
- Modify: `designs/pages/event-settings/event-settings.css` (new `.es-usage-*` classes if the stat-tile pattern from Event Hub isn't already generic — check first)

**Interfaces:**
- **Blocked by: Task 16** (round-2 council, Tech Lead — this dependency must survive a dispatcher that skims structured fields, not just prose). Do not start this task until Task 16 has landed, and never dispatch it in parallel with Part D. It also requires Task 13 Step 4 (`events` conversion) for a collaborator to load the page at all.
- Consumes: `event_media` (storage aggregate, same query Media & Memories already uses), `event_hub_summary` view (guest_total, task_percent, budget_percent), `config.plans` (same read as `billing/page.tsx`), `getEventAccess` (Task 14, for the per-domain access booleans)
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
import { getEventAccess } from '@/lib/auth/eventAccess'
import { UsageContent } from './UsageContent'

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024 // matches MediaClient.tsx — reused, not reimplemented

export default async function UsageSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: ev } = await supabase
    .from('events')
    .select('id, plan_id')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
  if (!ev) redirect('/home')

  const access = await getEventAccess(supabase, id, user.id)
  const canReadGuests = access.canRead('guests')
  const canReadPlanning = access.canRead('planning')
  const canReadMedia = access.canRead('media')

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
        canReadMedia={canReadMedia}
        guestTotal={hub?.guest_total ?? 0}
        canReadGuests={canReadGuests}
        taskPercent={hub?.task_percent ?? null}
        budgetPercent={hub?.budget_percent ?? null}
        canReadPlanning={canReadPlanning}
        planName={currentPlan?.name ?? 'Free'}
      />
      <PageFooter />
    </main>
  )
}
```

**Council finding, addressed here:** the original version had no way to distinguish "this event genuinely has 0 guests" from "you don't have access to guest data" — both rendered as a bare `0`. Since RLS-filtered joins return empty rows rather than errors, a `photographer` collaborator (who can't read `guests`/`planning` per the capability matrix) would see a fully-populated-looking "0 guests, no tasks, no budget" page and reasonably conclude the app is broken, not that they're viewing a permissions boundary. `canReadGuests`/`canReadPlanning`/`canReadMedia` are passed through so the client component can render an honest "You don't have access to this" state instead of a fake zero.

- [ ] **Step 4: Client display component**

```tsx
interface Props {
  storageUsedBytes: number
  storageLimitBytes: number
  canReadMedia: boolean
  guestTotal: number
  canReadGuests: boolean
  taskPercent: number | null
  budgetPercent: number | null
  canReadPlanning: boolean
  planName: string
}

function fmtGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function UsageContent({
  storageUsedBytes, storageLimitBytes, canReadMedia,
  guestTotal, canReadGuests,
  taskPercent, budgetPercent, canReadPlanning,
  planName,
}: Props) {
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
          {canReadMedia && <span className="es-section-tag">{fmtGB(storageUsedBytes)} of {fmtGB(storageLimitBytes)}</span>}
        </header>
        {canReadMedia ? (
          <div className="es-usage-bar">
            <div className="es-usage-bar-fill" style={{ width: `${storagePct}%` }} />
          </div>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to storage data — contact the event owner.</p>
        )}
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">groups</span>
            Guests
          </h2>
        </header>
        {canReadGuests ? (
          <p className="es-usage-stat">{guestTotal}</p>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to guest data — contact the event owner.</p>
        )}
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">checklist</span>
            Planning progress
          </h2>
        </header>
        {canReadPlanning ? (
          <>
            <p className="es-usage-stat">{taskPercent !== null ? `${taskPercent}% tasks done` : 'No tasks yet'}</p>
            <p className="es-usage-stat">{budgetPercent !== null ? `${budgetPercent}% of budget spent` : 'No budget set'}</p>
          </>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to planning data — contact the event owner.</p>
        )}
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

(`.es-usage-no-access` is a small new text-style rule — muted color, same treatment as `.es-section-sub` — add alongside whatever `.es-usage-*` classes Step 5 below determines are actually new.)

- [ ] **Step 5: Add the two new CSS classes if not already covered by existing `.es-section`/`.stack-bar`-style rules**

Check first: `grep -n "es-usage\|stack-bar" designs/pages/event-settings/event-settings.css designs/shared/shell.css`. If a generic progress-bar class already exists (the V0 Readiness artifact's `.stack-bar`/`.stack-seg` pattern, or Media's own storage-meter CSS), reuse its class names instead of inventing `.es-usage-bar`/`.es-usage-bar-fill` — check `app/events/[id]/media/MediaClient.tsx`'s storage-meter markup for its class names first (`grep -n "meter" app/events/\[id\]/media/MediaClient.tsx`) and match that pattern for visual consistency between the two storage displays. Only add new CSS if genuinely nothing reusable exists.

- [ ] **Step 6: Typecheck, lint**

Run: `npx tsc --noEmit && npx eslint app/events/[id]/settings/usage`
Expected: clean.

- [ ] **Step 7: Live verification — owner AND a non-owner collaborator**

As the owner: open the tab for an event with real media/guests/tasks/budget data, confirm all 4 numbers match what Media's own storage meter and the Event Hub's own stat tiles show for the same event (spec §11 — should match exactly since both reuse the same source data).

As a `photographer` collaborator (council finding — the original plan only verified against an owner account): confirm Storage shows real numbers, Guests/Planning show the "You don't have access" message, not `0`.

- [ ] **Step 8: Commit**

```bash
git add app/events/\[id\]/settings/usage app/events/\[id\]/settings/SettingsNav.tsx designs/pages/event-settings/event-settings.css
git commit -m "feat(settings): add read-only per-event Usage tab"
```

---

## Plan Self-Review Notes

- **Spec coverage:** §2→Task1, §3→Task2, §4→Task3, §5→Task4, §6→Tasks5+8, §7.1(permissions)→Tasks13-16, §7.2(remove/demote)→Task17, §7.3(invite id)→Task12, §7.4(dashboard)→Task11, §8(ToolRail)→Task10, §8(overlay)→Tasks7-9, §9(Usage)→Task18. §0(IDOR)/§1(corrections) already done, reference-only, no task. §10's `/legal/*` and Registry-real-backend items are explicitly not tasked (out of scope, matches spec).
- **Placeholder scan:** no TBD/TODO left; every "confirm the real policy name via `pg_policies` first" instruction (Task 13 Steps 4-6, Task 16 Step 1) is a real, necessary precondition for a DDL statement whose target must be verified against live state before running — not vagueness, the query to run is fully specified.
- **Type consistency:** `EventCapability`/`EventRole`/`EventAccess`/`getEventAccess`/`requireEventWrite` signatures introduced in Task 14 are used identically in Tasks 15-17-18. `BusyOverlay`'s `{ active, label? }` props from Task 7 are used identically in Tasks 8-9. `ToolRail`'s new `{ eventId, isLive, liveUrl }` props from Task 10 replace the old bare-boolean signature completely (no stale callers left). `can_read_event()`/`can_write_event()` (Task 13) are referenced consistently by name in Tasks 15/16's prose — no lingering reference to the original single-function `can_access_event()` design.
- **Scope check:** Part D (Tasks 13-17) is intentionally the largest, most sequential block, matching spec §12's explicit sizing call-out. Unlike the original draft, Tasks 13 and 15 are explicitly **not** independently shippable (must land same deploy, per the council's Security Finding 4); Task 18 explicitly depends on Task 16 specifically (per arbiter ruling), not on all of Part D and not on nothing.

## Council Review

**Reviewed:** 2026-08-06, 5-agent council (Tech Lead, Security Expert, Data Modeller, Backend Engineer, Frontend Engineer) — Critique + Debate + Arbiter, all phases run.

**Original verdict:** 🔴 RE-PLAN Part D (Tasks 13-17). 6 critical findings (3 tables never RLS-converted despite granted app-layer capabilities, 4 more tables missing from the conversion list, a blanket-read logic bug in the RLS predicate, a live privilege-escalation path via unvalidated role PATCH, no CHECK constraint on `role`, dead-code RSVP enforcement against an unauthenticated guest session — the last already fixed in Task 3's current text) plus 8 important findings (rollout-order exploit window, incomplete route-audit instructions, soft test-coverage language on the highest-risk task, modal/overlay z-index stacking, mislabeled task-ordering, missing lockout guard, missing access-denied empty state, no live-audit process). 3 contested severity/dependency calls resolved by arbiter (2 overruled to lower severity, 1 upheld-with-modification narrowing Task 18's dependency to Task 16 specifically).

**Disposition (round 1):** Every critical and important finding was addressed inline in the task text above. Founder directed a full plan revision before any task starts, rather than execute-then-patch — this document is that revision, not a diff.

**Round-2 re-review (same 5-agent roster, verified the round-1 fixes against the current plan text + live Supabase).** All round-1 critical fixes were confirmed genuinely correct (both agents who independently traced the RLS predicate SQL confirmed the blanket-read bug and the escalation bug are closed at both layers). Re-review surfaced additional residual gaps, all now fixed in this revision:

- **Website-content domain missing (critical, Backend Engineer, live-verified):** the `'website'` capability was only wired to `event_website_settings` (toggles), but a co-host needs to edit page content — 8 more tables + ~15 route files (`website-design`, `website-pages`, `story-blocks`, `wedding-party`, `qa-items`, `travel-points`, `stays`) were all still owner-only. Added to Task 16.
- **Task 13/15 same-deploy not structurally enforced (critical, Tech Lead):** rewritten as an explicit HARD GATE in the Part D intro + Task 15 header — no session break between Task 13 Steps 4-6 and the end of Task 15, with the distinction drawn between Task 13's inert prep steps (1-3) and its privilege-granting steps (4-6).
- **`events` had no collaborator write policy (functional gap, Security Expert):** added `collab_update_events` (Task 13 Step 4) with a `deleted_at is null` column-guard keeping soft-delete owner-only, plus the core `events` route (`PUT`→`'general'`, `DELETE`→`'delete'`) added to Task 15.
- **`submit_rsvp` failed open (important, Security Expert):** `coalesce(..., false)` added to both checks (Task 3).
- **Invite route role validation + widened auth (important, Security Expert):** `POST /admins` invite schema tightened to the same closed enum (Task 15 Step 2).
- **Modal-close-before-request regression + missing BusyOverlay focus-trap (important, Frontend Engineer):** round-1's modal-close change withdrawn (it regressed retry UX + triggered the `aria-hidden`-on-focused anti-pattern); instead `BusyOverlay` got a real focus-trap (Task 7) so the modal safely stays mounted under it (Tasks 8/9).
- **Missing lockout guard (important):** self-removal/self-demotion now rejected with 400 in Task 17's DELETE/PATCH.
- **Task 15 verification used the wrong role (important, Security Expert):** corrected from `planner` to `viewer` to actually demonstrate the read/write split.
- **Test-coverage requirement had no verification step (important, Tech Lead):** Task 16 Step 5 now runs a concrete `it()`-count check per route file.
- **Task 18 dependency only in prose (important, Tech Lead):** added a structured "Blocked by: Task 16" tag to its Interfaces block.
- **Deferred tables undocumented (important, Data Modeller):** Task 16 Step 8 now names `event_invitation_cards` / `event_media_tags` / `event_media_tag_links` as deliberately owner-only, with rationale, and Step 0's audit catch-all routes any newly-surfaced table into convert/defer explicitly.
- **Suggestions folded in:** capability-matrix drift-guard test (Task 14), `apply_migration` atomicity downgraded to "assumed, verify with a pre-flight" (Task 13 Step 5), `pg_policies` join schema-qualified + `select distinct role` pre-flight added to Step 0, stale table count corrected (26).

A standalone rollback/kill-switch runbook for the RLS cutover is still deliberately not written here — recommend the executing session write one live, informed by whatever the actual `apply_migration` transaction behavior turns out to be (which Task 13 Step 5's pre-flight now determines).
