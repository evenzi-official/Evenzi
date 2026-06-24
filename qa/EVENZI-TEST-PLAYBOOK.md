# Evenzi Test Playbook (Antigravity) — reusable

> **The standing test prompt for Evenzi.** To run a pass, tell Antigravity:
>
> > *"Read `qa/EVENZI-TEST-PLAYBOOK.md`. Test **\<your target\>**. Write findings to `qa/\<name\>-findings.md`."*
>
> The runner applies every relevant dimension in **Part B** to the target, using the scope + project facts in **Part A** and the gotchas in **Part C**, and writes the report per **Part D**. **Adopt the expert personas in the Part A agent roster** — lead with the QA/`test_engineer` persona and bring in `code_reviewer`, `data_modeller`, `security_expert`, `ui_ux_designer` per dimension (run them as parallel subagents if your tool supports it).
>
> **Test + report only — never modify application code.** Separate *new* issues from *pre-existing*. Be specific and evidence-based — **every finding needs a `file:line`/route, a screenshot, and repro steps** (see Part A "Evidence"). No vague "could be cleaner".

---

## Part A — Project facts & SCOPE (reusable, read every run)

### What this app is
Evenzi — wedding/event planning SaaS. **Host-only MVP.** A host signs up, creates an event, and manages it from dashboards.

### ⛳ Screens IN SCOPE (these are the only ones being actively built — test these fully)
1. **Login / Registration** — phone OTP + Google OAuth + role selection.
2. **Event creation** — the 4-step create wizard (+ success).
3. **User dashboard** — `/home`, the host's list of events ("Your Events").
4. **Event dashboard** — `/events/<id>`, the event hub / control surface.

### 🚫 Screens OUT OF SCOPE (not worked on yet — do NOT functional-test)
Everything else: event **settings** sub-pages (general/website/admins/guest-list/registry/billing — except where a specific run targets one), **guests**, **invitations**, **planning**, **media**, **website/digital-presence**, **journey**. These are scaffolds/placeholders. **Smoke only** (does the route load without crashing?) and flag if linked from an in-scope screen, but do not deep-test them or file functional bugs against them. If a run's TARGET explicitly names one, override this and test it.

### Backend model (what the in-scope screens talk to)
- **Tables / data → Supabase Postgres.** Schemas: `config.*` (catalogs/dimension tables), `public.*` (live data + views), `auth.*` (Supabase Auth). Project `smjkbmkxweevqpvygabe`. Generated types: `lib/supabase/database.types.ts`. Reads/writes are raw `@supabase/supabase-js` (no ORM). Auth = Supabase phone OTP + Google OAuth; route protection in `middleware.ts`.
- **Files / media → Cloudflare R2** (orchestrated by the app). Cover images and any media upload go **direct/proxied to R2**, with a public bucket + signed/proxied serving. Helpers in `lib/storage/*`; routes like `/api/events/cover` (upload) and `/api/media/[...key]` (serve). **R2 env keys are usually ABSENT locally** — when absent, storage paths can't run end-to-end: **static-audit** the code and mark runtime **SKIPPED — R2 env absent**. When R2 keys ARE present, test upload → store → serve → (and cleanup on delete) end-to-end.

### Run it
- **App server: http://localhost:3001** (`npm run dev -- -p 3001`). Needs `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (+ R2 keys if testing storage).
- **Designs server: http://localhost:4000** (`npm run design` — serves `designs/` over HTTP). Use this to view design prototypes for side-by-side comparison. **Open designs via this URL (e.g. `http://localhost:4000/pages/create-event/step-1-type.html`, `http://localhost:4000/index.html`) — NEVER `file://`** (sandboxed browsers block the file scheme; that is what stops a browser pass). Start BOTH servers before the browser dimensions.
- Dev login: phone **9999999999**, OTP **123456** → lands on `/home`.

### Designs are the spec — find the matching design yourself
Built pages must match the prototypes in **`designs/`**. **Do NOT rely on a hardcoded map — discover the design file for whatever screen you're testing:**
1. Derive the screen's **slug** from its route (e.g. `/events/create` → `create-event`; `/home` → the host dashboard; `/auth` → `auth`; `/events/<id>` → the event control/dashboard).
2. Find the file path (read-only, via your file tools / `grep`/`ls`) in this order: **`designs/pages/<slug>/*.html`** → **`designs/<slug>.html`** → **`designs/index.html`** (top-level = host dashboard) → else **grep `designs/**/*.html`** for a `<title>`/heading/route matching the screen. Then **VIEW it in the browser over HTTP** at `http://localhost:4000/<path-relative-to-designs>` (designs server) — **never `file://`**.
3. A multi-step flow → multiple files (e.g. a wizard → `designs/pages/<slug>/step-*.html` + `success.html`).
4. **Record the design file(s) you matched** in your findings (so the mapping is reproducible). If no design exists for an in-scope screen, that itself is a finding ("missing design") — don't silently skip the comparison.

Designs are **wireframe-level intent** — layout, sections, states, hierarchy, copy, component choices must match; exact pixels are not binding. Shared UI primitives live in `designs/components.html` + `designs/shell.css`.

### Standards live in
`CLAUDE.md` (conventions, Reuse-Before-Create) · `docs/data-model/DATA-MODEL.md` + `ERD.md` (canonical schema, RLS, decisions) · `docs/data-model/FE-INTEGRATION.md` · `designs/components.html` + `designs/shell.css` (component catalog) · `.agents/rules/evenzi-testing.md` (your role-book) · `docs/cursor/build-docs/*` (per-feature specs, if one matches the target).

### Agent roster — adopt the right persona per dimension
This project keeps expert role-books in **`ai/agents/`**. Before running a dimension, **read the mapped role-book and adopt that persona's checklist + standards** (it's richer than the one-liners here). If your tool supports subagents, **run them as parallel subagents (one persona per dimension group) and consolidate** into one findings file; otherwise sequence through the personas yourself.

| Dimensions | Persona role-book |
|---|---|
| D1 Functional · D2 Design fidelity · D7 Accessibility · D8 Responsive · D10 Build/test health | `ai/agents/test_engineer.md` (**QA — lead**) |
| D2 design-system judgement · D5 Component reuse | `ai/agents/ui_ux_designer.md` |
| D3 Code quality · D6 React/Next | `ai/agents/code_reviewer.md` |
| D4 Data modeling, retrieval & storage | `ai/agents/data_modeller.md` |
| D9 Security | `ai/agents/security_expert.md` |

(Browser contention: only ONE persona drives the live browser at a time — the QA/test_engineer owns it; the rest are static audits and can run in parallel.)

### Evidence & screenshots (best-effort, never a blocker)
- **Capture a screenshot for each finding when you can.** Save to **`qa/_shots/<target-slug>/`** (a relative path inside the repo workspace — always writable) with descriptive names (e.g. `event-dashboard-hero-missing-countdown.png`). For design-fidelity gaps, capture **both** the built page (`:3001`) and the design (`:4000`).
- **If your environment cannot save image files, DO NOT skip the test.** Capture to your allowed artifacts area and reference it, or describe the visual evidence precisely (element, state, breakpoint, what differs) — the **browser dimensions (D1/D2/D7/D8) are mandatory and must run regardless of screenshot ability.** A blocked screenshot is a Low note in "Skipped/environment", not a reason to mark a whole dimension BLOCKED.
- Reference the screenshot path (or the inline description) on the finding line.
- **Verify before filing** — reproduce an issue at least once and confirm it's real (not a stale cache/HMR artifact). Prefer false-negatives over noise.

### Test-data hygiene & login
- Use the dev test account (phone **9999999999** / OTP **123456**). If OTP login fails (Twilio not configured in this env), say so and fall back to Google OAuth or an existing seeded session; if neither works, report "blocked: cannot authenticate" rather than skipping silently.
- Creating data is fine for testing, but **clean up**: soft-delete any test events you create (via the Delete flow or note them) so you don't pollute the dev DB. Never delete data you didn't create.

---

## How to scope a run (the TARGET)

Operator supplies the TARGET in their message, or fills this block. If it names a screen, infer files/routes/flows and **locate the design yourself** (see "find the matching design" above); if it names files, infer the flows. Apply the dimensions that fit.

```
TARGET (fill per run)
- Screen(s):        e.g. Event creation  |  Event dashboard
- Changed files:    <paths, or "git diff --name-only origin/Dev-Vibe...HEAD">
- Flows to walk:    <e.g. select type → details → celebrations → review → launch>
- Routes / URLs:    <e.g. /events/create>
- Design file(s):   <leave blank — you discover + record these per "find the matching design">
- Findings file:    qa/<slug>-findings.md
- Focus (optional): <e.g. "design-fidelity + data-modeling only">
```

Default if no TARGET: test **all in-scope screens**, full dimensions, discovering each design; everything changed vs `origin/Dev-Vibe`.

---

## Part B — Test dimensions (apply each that fits)

### D1. Functional / regression
Walk every in-scope flow in a real browser. Per step record **PASS/FAIL + evidence** (screenshot, `METHOD /path → status`, console). Cover happy path **and** edges: empty state, not-found (bad id → clean not-found, not a silent redirect, not 500), unauthorized, validation errors, long/large content, duplicate actions (double-submit, second delete). No dead links among in-scope surfaces.

### D2. Design fidelity (match the build to `designs/`)
**First locate the design file yourself** (per "find the matching design" in Part A) and record which file(s) you matched. Then open the app page **side-by-side** with its design and compare:
- **Structure & sections** present and in the right order; nothing from the design missing, nothing extra unexplained.
- **States** the design specifies (default/hover/active/focus/disabled/loading/empty/error) exist in the build.
- **Hierarchy, copy, iconography, component choices** match the design intent (a design `.seg`/modal/card should be the same primitive in the build).
- **Flow** matches (step order, what each CTA does, where it navigates).
- Pixel-exactness is **not** required — flag *intent* mismatches (missing section, wrong control, wrong state, broken hierarchy), not 2px nudges. Record design-vs-build screenshots for each gap.

### D3. Code quality
TS **strict** (no `any`, explicit return types on exported fns, no unjustified casts / `@ts-ignore`); **every Supabase call destructures and handles `error`** (recurring bug: `const { data } =` swallowing `error`); API routes use `try/catch` + `NextResponse`, correct codes (401/404/400/500), no raw-error leakage; no stray `console.log`; no dead code / unused imports; Zod-validated request bodies; naming conventions (PascalCase / camelCase / snake_case columns / kebab-case dirs).

### D4. Data modeling, retrieval & storage  ← **highest-value**
Validate queries vs `DATA-MODEL.md`/`ERD.md` + live schema (`database.types.ts`). See **Part C** for the traps.
- **No cross-schema PostgREST embeds** (`public` table embedding `config.*` → `PGRST200`). Use `.schema('config')` + JS join. **Grep the whole repo.**
- **Views** for aggregates/safe projections (`event_hub_summary`, `*_settings_view`); confirm read columns exist.
- **RLS as the filter** (`auth.uid() = user_id`) — safe for every SELECT/UPDATE/DELETE; flag writes that could touch non-owned rows. (Collaborator coverage deferred — confirm, don't fix.)
- **Soft delete** (`deleted_at` filtered on reads, set on delete; never hard-delete).
- **Empty-string → null coercion (D44)** into nullable text / jsonb.
- **jsonb `event_details`** partial updates read-merge-write, never clobber; keys consistent writer↔reader.
- **Column-name accuracy** vs live schema (Part C list).
- **R2 storage orchestration:** uploads land in the right bucket with namespaced keys; serving uses the proxy/signed path; no secrets in client; (ideally) orphaned objects cleaned on delete. Mark **SKIPPED — R2 env absent** when keys missing, but still static-audit the code.
- **Secrets never read back** (e.g. `website_password_hash` never in any select/view).

### D5. Component reuse & design system
Per **Reuse-Before-Create**: new UI reuses shell primitives from `designs/components.html` + `shell.css` (modals, toasts, `.btn-pill`, inputs, `.seg`, skeletons). **Flag any invented primitive duplicating an existing one's job** (review-blocking). Confirm correct state classes (toast `.is-show`, modal `.is-open`, button `.is-loading`/`aria-busy`). New shared primitive not in `components.html` → catalog-debt flag.

### D6. React / Next.js principles
`"use client"` only where needed (fetch stays server-side where possible); stable **keys** on lists; hooks rules (no conditional hooks, correct deps, no setState-after-unmount); controlled inputs; **no hydration mismatches**; loading/empty/error states present.

### D7. Accessibility
Keyboard (logical Tab order; Enter/Space activate; **Esc** closes overlays; focus returns to trigger; modals trap focus, `role=dialog`/`alertdialog`); accessible names on all controls (icon-only buttons labelled); contrast + visible focus; no hover-only affordances on touch.

### D8. Responsive & theming
Test at **360 / 390 / 414 / 768 / 1024 / 1440** px: no horizontal scroll, no clipped content, touch targets ≥ **44px** on mobile. Light/dark toggle works on every tested page.

### D9. Security
Every API route checks auth (`getUser()` → 401) before work; ownership enforced (RLS and/or explicit); inputs validated; no string-concat SQL; no secrets/keys in client bundles, responses, or logs; soft-deleted/unauthorized rows never returned.

### D10. Build & test health
Run `npx tsc --noEmit`, `npm run test:run`, `npm run lint`; report exact failures and **classify pre-existing vs introduced by the TARGET** (use `git diff`/`git blame`).

---

## Part C — Evenzi data-model gotchas (recurring traps)

1. **Cross-schema embed = `PGRST200`.** Never embed `config.*` (`event_types`, `event_sub_types`, …) from a `public` table. Use `.schema('config')` + JS join. (Single-level AND nested both fail.)
2. **Renamed/removed columns** (stale-code source):
   - `config.event_types.form_schema` → **`field_schema`**; `has_sub_events` → **removed**.
   - `event_sub_events.sub_event_type_id` → **`event_sub_type_id`**; `date`/`time` → **`event_date`/`start_time`/`end_time`**.
   - `FormSchemaField.field` → **`key`** (watch `validateDynamicFields` + its test).
   - **`event_metadata` table dropped** — variable fields live in **`events.event_details`** (jsonb).
3. **Soft delete:** `events.deleted_at` — filter on reads, set on delete.
4. **RLS:** `events_owner_all` = owner-only (`auth.uid() = user_id`); collaborators deferred; `created_by` ≠ `user_id`.
5. **Catalogs in `config`,** reached with `.schema('config')` (direct only — not embeds).
6. **Settings views** (`event_*_settings_view`) are `security_invoker`, anon-revoked, exclude `website_password_hash`, compute fields (`effective_max_plus_ones`, `website_days_remaining`). Read view, write raw table.
7. **`create_event_with_details` RPC** seeds children in one transaction — on create, expect sub-events/tasks/budget/tags/album-presets.
8. **R2 keys** are namespaced (e.g. `event-covers/<user>/…`); public bucket served via proxy/`r2.dev`; no creds client-side.

(Keep this list current as the schema evolves — highest-leverage part of the playbook.)

---

## Part D — Deliverable: the findings file

Create the findings file named in the TARGET (default `qa/<slug>-findings.md`). Stamp the **real run date**.

```
# Findings — <TARGET> (<YYYY-MM-DD>)

## Summary
- Personas used: <which ai/agents role-books> · Dimensions run: <list>
- Findings: <n> (Blocker <n>/High <n>/Medium <n>/Low <n>) · Overall: PASS / PASS-WITH-ISSUES / FAIL
- Designs matched: <screen → design file you discovered>

## D1 Functional   | table: # / scenario / result / evidence(screenshot path, METHOD /path→status)
## D2 Design fidelity   | per screen: matched design file → build, gaps (built vs design screenshots)
## D3 Code quality
## D4 Data modeling, retrieval & storage   ← most detail; include repo-wide cross-schema-embed grep
## D5 Component reuse   ## D6 React/Next   ## D7 Accessibility
## D8 Responsive & theming   ## D9 Security   ## D10 Build & test health
## Skipped / environment   (R2 SKIPs, out-of-scope screens not deep-tested, auth blockers)
## Appendix   (commands run, all screenshot paths under qa/_shots/, network statuses)
```

**Finding line format:** `[SEVERITY] file:line (or screen+breakpoint) — what's wrong — why it matters — concrete fix — repro: <steps> — shot: qa/_shots/<slug>/<name>.png`

**Severity:** **Blocker** (breaks a core flow / data-integrity / security), **High** (wrong behavior or standard/design violation, user-visible), **Medium** (quality/maintainability), **Low** (cosmetic/nit). **Do not edit app code — only create the findings file (+ screenshots).**
