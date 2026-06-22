# Antigravity Test Runbook — Event CRUD + Hub + Settings (2026-06-22)

> Paste this whole file to Antigravity as the task. It is self-contained. Follow `.agents/rules/evenzi-testing.md` (your Evenzi testing role-book) for tone, constraints, and conventions. **Do not modify application code** — you are testing + reporting only. Write every finding to the findings file named at the end.

---

## 0. Context & what changed

Repo: Next.js 14.2.5 (App Router), TypeScript **strict**, React 18, Tailwind, Supabase (raw `@supabase/supabase-js`, **no ORM**). Branch under test is a worktree at HEAD `1fee831` + uncommitted fixes from a Claude review pass.

A review found and fixed several P1 issues in the Event CRUD / Hub / Settings flow. **Your job is to independently verify the fixes, AND audit the changed code for quality, data-modeling/retrieval correctness, component reuse, and core React principles** — then write all findings to a file for human review.

### Files changed this session (the audit surface)
- `app/events/[id]/page.tsx` — Event Hub index (server component). Was redirecting to /home; rewritten to read `public.event_hub_summary` view + a separate `config.event_sub_types` query (joined in JS) instead of an unsupported cross-schema PostgREST embed.
- `app/api/events/[id]/route.ts` — `GET` (same embed fix) **plus new `PUT` (edit) and `DELETE` (soft-delete)**.
- `app/api/events/route.ts` — dashboard `GET` (same cross-schema embed fix for `config.event_types`).
- `app/events/[id]/settings/page.tsx` + **new** `app/events/[id]/settings/GeneralSettingsForm.tsx` — General settings made interactive (Save → PUT, Delete → confirm modal → DELETE, partner-name binding from `event_details`).
- `lib/validations/events.ts` — added `updateEventSchema`.
- `components/ui/WizardStepper.tsx` — added React `key` to the steps map.

### How to run
- Dev server may already be running on **http://localhost:3001**. If not: `npm run dev -- -p 3001` (a copy of `.env.local` with Supabase URL + publishable key is required; **R2 keys are NOT present** in this env — see §6).
- Dev login: phone **9999999999**, OTP **123456** (test account). After login you land on `/home`.

---

## 1. Functional regression (verify the fixes actually work)

Drive a real browser. For each, record PASS/FAIL + evidence (screenshot, network status, console).

1. **Create flow** — `/events/create`: select Wedding → fill Partner 1/2, guests, venue → pick ceremonies → Confirm & launch. Expect `POST /api/events` → **201**, redirect to the event page.
2. **Hub index renders (was the P1 bug)** — after create (or visit `/events/<id>`): page must **render** (hero + "Manage your event" tool grid), **NOT** redirect to `/home`. Confirm the sub-event milestone names + icons show real values (e.g. "Wedding Ceremony", "Reception"), sourced correctly.
3. **Hub for a bad id** — visit `/events/<random-uuid>`: must show a clean **not-found** (`notFound()`), **NOT** a silent redirect to /home, and **NOT** a 500.
4. **Settings binding** — `/events/<id>/settings`: Event name, Partner one, Partner two, Venue must be **pre-filled** from the created event (partner names come from `events.event_details`).
5. **Edit/Save** — change the event name + a partner name → Save. Expect `PUT /api/events/<id>` → **200**, value **persists** across reload. Confirm empty-string inputs persist as `null`, not `""`.
6. **Delete** — Danger zone → Delete event → **confirm modal** must appear (cancel = no-op) → confirm → `DELETE /api/events/<id>` → **200** → redirect to `/home` → event **gone** from the dashboard. Verify it is a **soft delete** (still in DB with `deleted_at` set), not a hard delete, if you can query.
7. **Dashboard** — `/home` shows the event card with guest count + planning progress; the event **type/name** must not regress to a generic placeholder.
8. **Wizard console** — `/events/create` must log **no React `key` warning** (previously `WizardStepper` warned).

---

## 2. Code-quality audit (the changed files)

Check and report violations:
- **TypeScript strict**: no `any`, no unsafe casts beyond what's justified; **explicit return types on exported/public functions** (project rule); no `@ts-ignore` without reason.
- **Error handling**: every Supabase call **destructures and handles `error`** — the root cause of the original bug was `const { data } =` swallowing `error`. Flag ANY remaining query that ignores `error`. API routes return correct status codes (401 unauth, 404 not-found, 400 bad-body, 500 unexpected) and never leak raw errors to the client.
- **Console hygiene**: no leftover `console.log`; server-side `console.error` on failures is OK.
- **Naming conventions**: components PascalCase, functions camelCase, DB columns snake_case, dirs kebab-case.
- **Dead code / unused imports** in the changed files.
- **Try/catch + NextResponse** pattern in API routes (project convention).
- **Validation**: request bodies validated with Zod before use; `updateEventSchema` is sound (optional fields, sensible bounds).

---

## 3. Data-modeling & retrieval-standards audit (most important)

Validate the queries against Evenzi's data-model rules (`docs/data-model/DATA-MODEL.md`, `docs/data-model/ERD.md`) and the live schema (`lib/supabase/database.types.ts`):

- **No cross-schema PostgREST embeds.** `public` tables (`events`, `event_sub_events`) **must not** embed `config.*` tables (`event_types`, `event_sub_types`) via the `select('… config_table(…)')` join syntax — PostgREST can't resolve it (returns `PGRST200`). The correct pattern is `.schema('config').from(...)` direct access + a JS join. **Audit every changed query** and flag any remaining cross-schema embed (in the 3 route/page files AND anywhere else you grep in the repo — there may be more in `guests/`, `media/`, `planning/`, `journey/`, `website/` pages).
- **Views for aggregates.** Hub stats should come from `public.event_hub_summary` (security_invoker view), not hand-rolled multi-table joins. Confirm the columns read actually exist on that view.
- **RLS-as-the-filter.** Queries rely on the `events_owner_all` RLS policy (`auth.uid() = user_id`) for owner scoping instead of `.eq('user_id', …)`. Confirm this is intentional and safe for **every** read/write of `events` (SELECT/UPDATE/DELETE). Flag any write that could affect a non-owned row. Note the known limitation: collaborators are not yet covered (deferred `can_access_event()` cutover) — confirm, don't "fix".
- **Soft delete.** All reads of `events` must filter `.is('deleted_at', null)`. `DELETE` must set `deleted_at = now()`, never hard-delete. Flag any read that forgets the filter or any hard delete.
- **Empty-string → null coercion (D44).** Writes that go into `event_details` / nullable text must coerce `''` → `null`. Verify both the PUT route and the settings form do this.
- **jsonb `event_details` handling.** PUT must read-merge-write the jsonb (partial update), not clobber it. Confirm partner keys are consistent end-to-end: the wizard writes them, settings reads/writes them, and they match (`partner_1_name` / `partner_2_name`).
- **Column-name accuracy.** Cross-check field names used in code against the live schema: `event_sub_type_id` (not `sub_event_type_id`), `event_date`/`start_time`/`end_time`, `config.event_types.field_schema` (not `form_schema`), no `has_sub_events`.

---

## 4. Component-reuse & design-system audit

Per the **Reuse-Before-Create** rule (`CLAUDE.md`) and `designs/components.html` + `designs/shell.css`:
- The new `GeneralSettingsForm` must **reuse existing shell primitives** — confirm the confirm modal uses `.modal-confirm-cautionary` (the documented irreversible-action pattern), toasts use the canonical `.bc-toast` state class, buttons use `.btn-pill` + the `.is-loading`/`aria-busy` pattern, inputs use the existing `FormGroup`/`FormInput`. **Flag any newly-invented primitive that duplicates an existing one's job** (review-blocking per project rules).
- Note the toast caveat the review flagged: `app/auth/page.tsx` toggles `is-active` (no matching CSS) while the form uses `is-show` (the real one). Verify the form's toast actually animates/visible, and flag the `auth` inconsistency separately.
- If any new shared primitive was genuinely added, it should be in `designs/components.html` — flag catalog-backfill debt.

---

## 5. React / Next.js principles

- **Server vs client boundary**: `"use client"` only where interactivity is needed. Settings page should stay a server component for the fetch, with the interactive form as a client child. Flag over-/under-use of `"use client"`.
- **Keys**: list renders have stable keys (verify the WizardStepper fix; scan changed files for other keyless maps).
- **Hooks rules**: no conditional hooks; effects have correct deps; no state updates after unmount.
- **Controlled inputs**: form fields are controlled with sane initial values; no React "uncontrolled→controlled" warnings.
- **Accessibility**: the confirm modal traps focus, closes on **Esc** and backdrop click, returns focus to the trigger; Delete/Save have accessible names + busy state; the modal uses `role="alertdialog"`. Tab order is logical.
- **Hydration**: no hydration-mismatch warnings in console on any tested page.
- **Loading/empty/error states**: Save/Delete show pending state; dashboard empty state renders; hub bad-id renders not-found.

---

## 6. Out-of-scope / cannot-test (note, don't fail)
- **Cover image upload** (`/api/events/cover`) and **media proxy** (`/api/media/[...key]`) require **R2 credentials** absent from this env. Do a **static read** of those files for code quality only; mark runtime tests **SKIPPED — R2 env absent**.
- Known pre-existing items (already noted by review — confirm, don't fix): (a) hub hero SVG uses `transform-origin` instead of React's `transformOrigin` (DOM warning); (b) `__tests__/lib/validations/events.test.ts` is stale (`field`→`key` rename from commit `77f0385`) — the unit-test suite is red because of it. Run `npx tsc --noEmit` and `npm run test:run` and report the exact failures so we can separate pre-existing from new.

---

## 7. Responsive & cross-cutting
- Test the hub, settings, and create wizard at **360 / 390 / 768 / 1024 / 1440** px. No horizontal scroll, no clipped content, touch targets ≥ 44px on mobile widths.
- Light/dark toggle works on the tested pages.
- No dead links among the changed surfaces.

---

## 8. Deliverable — write findings to a file

Create **`docs/qa/event-crud-hub-findings.md`** (create the `docs/qa/` dir if needed). Use this structure:

```
# Findings — Event CRUD + Hub + Settings (Antigravity, 2026-06-22)

## Summary
- Sections run: <list> · Total findings: <n> (Blocker <n> / High <n> / Medium <n> / Low <n>)
- Overall: <PASS / PASS-WITH-ISSUES / FAIL>

## 1. Functional regression
| # | Scenario | Result | Evidence |
... one row per §1 step, plus any extra you ran ...

## 2. Code quality
- [SEVERITY] file:line — finding — why it matters — suggested fix

## 3. Data modeling & retrieval   <-- give this the most detail
- [SEVERITY] file:line — finding — which rule (cross-schema embed / RLS / soft-delete / D44 / view / column name) — suggested fix
- Repo-wide grep results: any OTHER cross-schema embeds found outside the changed files (list file:line)

## 4. Component reuse
- reused primitives confirmed: <list> · duplicated/invented primitives: <list> · catalog debt: <list>

## 5. React / Next.js principles
- [SEVERITY] finding ...

## 6. Skipped / pre-existing
- R2-dependent tests skipped; tsc + test:run output (pre-existing vs new)

## 7. Responsive & a11y
- per-breakpoint notes; a11y (focus trap, Esc, names) results

## Appendix
- exact commands run, screenshots saved (paths), network statuses observed
```

Severity scale: **Blocker** (breaks a core flow / data-integrity / security), **High** (wrong behavior or standard violation, user-visible), **Medium** (quality/maintainability), **Low** (cosmetic/nit). For each finding give `file:line`, what's wrong, why, and a concrete fix. Be specific and evidence-based — no vague "could be cleaner". Do not edit app code; only create the findings file.
