# Platform Truth Audit — Stage 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a full local platform truth audit (schema, API, Playwright E2E incl. all collab roles, design↔React, code health) and produce ranked P0/P1 + prod-risk + design Q&A without shipping product fixes.

**Architecture:** Parallel agent waves W0–W6 against `localhost:3000` + live Supabase. Account A = phone test OTP; Account B = service-role minted confirmed-email user. Findings merge into `docs/ops/v0-readiness.html` and a findings ledger.

**Tech Stack:** Next.js 14, Playwright, Vitest, Supabase Admin API, Cursor Task subagents + `ai/agents/*` prompts.

## Global Constraints

- **No product code fixes in Stage 1** — findings only (harness/scripts/docs OK).
- **Canonical status seed:** `docs/ops/v0-readiness.html` — update it; do not invent a competing ClickUp status.
- **Auth A:** phone `9999999999` / OTP `123456`.
- **Auth B:** service-role create; email must be confirmed (required for in-app invite accept).
- **Collab roles (all required):** `co-host`, `planner`, `photographer`, `viewer`.
- **Disposable data prefix:** event names / emails / tags start with `e2e-` or `e2e.` — **keep until founder reviews**, then delete only on explicit go-ahead (no auto-cleanup).
- **No commits** during Stage 1 unless founder asks.
- **Design divergence:** React + specs/plans/memory win; undocumented → Q&A queue.
- **ClickUp:** do not update.
- **Resend:** keys deferred — email invite path is best-effort; in-app Accept/Decline is the primary collab assertion.

---

### Task 0: W0 Setup — accounts, event fixture, storageState

**Files:**
- Create: `scripts/e2e/w0-setup.ts`
- Create: `tests/.auth/user-a.json` (gitignored storageState)
- Create: `tests/.auth/user-b.json` (gitignored storageState)
- Create: `docs/testing/2026-08-07-platform-truth-audit-findings.md` (empty ledger skeleton)
- Modify: `.gitignore` if `tests/.auth/` not ignored

**Interfaces:**
- Consumes: `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- Produces: `E2E_EVENT_ID`, Account B email `e2e.collab.b@evenzi.test` (or similar), storageState paths, findings ledger path

- [ ] **Step 1: Confirm founder permissions** (see checklist in chat / findings header) — do not create users until OK on live DB writes.

- [ ] **Step 2: Ensure `tests/.auth/` is gitignored**

```bash
grep -q 'tests/.auth' .gitignore || echo 'tests/.auth/' >> .gitignore
mkdir -p tests/.auth scripts/e2e
```

- [ ] **Step 3: Write `scripts/e2e/w0-setup.ts`**

Script responsibilities:
1. Load dotenv from `.env.local`
2. Create or upsert Account B via `supabase.auth.admin.createUser({ email, email_confirm: true, password })`
3. Ensure `user_profiles.role_slug = 'host'` (or whatever role-selection requires) for A and B so `/events` is reachable
4. Sign in A via Playwright phone OTP → save `tests/.auth/user-a.json`
5. Sign in B via `signInWithPassword` + inject session cookies for Next.js SSR (match `@supabase/ssr` cookie names) → save `tests/.auth/user-b.json`
6. As A, create event named `e2e-truth-audit` via UI or `create_event_with_details` RPC; print `E2E_EVENT_ID`
7. Write `scripts/e2e/w0-env.json` with `{ eventId, accountBEmail, createdAt }` (gitignored)

- [ ] **Step 4: Run setup**

```bash
npx tsx scripts/e2e/w0-setup.ts
```

Expected: prints Account B id/email, event id, both storageState paths exist.

- [ ] **Step 5: Smoke both sessions**

```bash
npx playwright test tests/w0-smoke.spec.ts --reporter=line
```

Smoke spec: A opens `/home`; B opens `/home` (no event yet). Both 200, logged in.

- [ ] **Step 6: Init findings ledger** with sections P0 / P1 / P2 / Prod-risk / Design Q&A / Code health.

---

### Task 1: W1 Schema inventory

**Files:**
- Create: `docs/testing/audit-2026-08-07/w1-schema.md`

**Agents:** `data_modeller`

- [ ] **Step 1:** Via Supabase MCP `list_tables` + `execute_sql` inventory public/config tables, key RPCs (`list_my_pending_invites`, `accept_event_invite`, `can_read_event`, `can_write_event`, notify helpers).
- [ ] **Step 2:** Diff against `docs/data-model/DATA-MODEL.md` version header + decision log; note missing D-entries for collab invite / push / tiered permissions.
- [ ] **Step 3:** Append schema findings to ledger (severity tagged).

---

### Task 2: W2 API + Vitest + security spot-check

**Files:**
- Create: `docs/testing/audit-2026-08-07/w2-api.md`

**Agents:** `backend_engineer`, `test_engineer`, `security_expert` (parallel)

- [ ] **Step 1:** Enumerate `app/api/**/route.ts`; mark covered by `__tests__/**` vs uncovered.
- [ ] **Step 2:** Run `npm run test:run` ; capture failures as findings.
- [ ] **Step 3:** Manual/code IDOR review on event-scoped routes + public `app/api/e/**`.
- [ ] **Step 4:** Collab API matrix — invite/accept/decline/list for each role (Vitest and/or scripted fetch with A/B sessions).

---

### Task 3: W3 Playwright host + collab matrix

**Files:**
- Create: `tests/platform-truth/*.spec.ts`
- Create: `docs/testing/audit-2026-08-07/w3-e2e.md`

**Agents:** `test_engineer`

- [ ] **Step 1:** Host journey specs (reuse `tests/.auth/user-a.json`) covering shipped MVP routes listed in readiness HTML.
- [ ] **Step 2:** Collab matrix spec — for each role in `['co-host','planner','photographer','viewer']`:
  1. A invites B email with that role on `E2E_EVENT_ID`
  2. B sees pending on Collaborations + bell
  3. Accept once; assert active + capability boundaries (planner cannot open billing write; photographer media-only; viewer read-only)
  4. Cleanup: remove collab / decline path tested on a separate invite
- [ ] **Step 3:** Record failures as P0/P1 in ledger.

---

### Task 4: W4 Design ↔ React map

**Files:**
- Create: `docs/testing/audit-2026-08-07/w4-design-react.md`

**Agents:** `ui_ux_designer`, `frontend_engineer`

- [ ] **Step 1:** Inventory `designs/pages/**/*.html` (exclude vendor/guest-site asset trees noise; include sapphire guest templates as product surface).
- [ ] **Step 2:** Map each to React route or **MISSING**.
- [ ] **Step 3:** Primary CTA click-through on mapped pages (local).
- [ ] **Step 4:** Classify gaps: intentional (cite doc) | Q&A | P1 missing screen | P2 polish.

---

### Task 5: W5 Code health

**Files:**
- Create: `docs/testing/audit-2026-08-07/w5-code-health.md`

**Agents:** `code_reviewer`, `security_expert`, `tech_lead`

- [ ] **Step 1:** Dead/unreachable: `href="#"`, buttons without handlers, cosmetic autosave (invitations), billing Upgrade.
- [ ] **Step 2:** Hardcoded vs dynamic: plan limits, URLs (`evenzi.app`), feature flags, settings toggles with no readers.
- [ ] **Step 3:** Security patterns from `ai/agents/security_expert.md`.
- [ ] **Step 4:** Duplicate UI primitives vs `designs/components.html` / shell.

---

### Task 6: W6 Rollup

**Files:**
- Modify: `docs/ops/v0-readiness.html`
- Create: `docs/session-reports/2026-08-07-platform-truth-audit-session-report.md`
- Modify: `docs/NEXT-SESSION.md`
- Modify: findings ledger (final ranks)

**Agents:** `tech_lead`, `product_manager`

- [ ] **Step 1:** Dedupe findings; assign final P0/P1/P2 + prod-risk.
- [ ] **Step 2:** Update readiness HTML overview counts + critical cards + stale notes (collab merge, website password findings).
- [ ] **Step 3:** Write session report; propose Stage 2 fix order (one plan per P0 batch).
- [ ] **Step 4:** Present P0/P1 to founder — **stop** (no fixes until sign-off).

---

## Execution notes

- Prefer **parallel Task subagents** within a wave; serialize only on shared fixtures (`E2E_EVENT_ID`, storageState).
- If Account A phone OTP fails: stop and ask founder (Twilio not configured — test OTP must be enabled in Supabase Auth).
- If Account B email domain blocked: use `e2e.collab.b+audit@gmail.com` only if founder provides a real inbox; prefer `*.evenzi.test` + admin confirm.
- Prod-risk list is **authored** in Stage 1 but **executed** only after founder schedules the testing/prod pass.
