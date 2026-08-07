# Platform Truth Audit — Design

| | |
|---|---|
| **Date** | 2026-08-07 |
| **Status** | Approved |
| **Owner** | Abhijith |
| **Canonical status seed** | [`docs/ops/v0-readiness.html`](../../ops/v0-readiness.html) |

## Goal

Establish the **real** project state of Evenzi MVP (local = code on `Dev-Vibe`, which matches `Dev-Vibe-Testing` tree). Stage 1 is **audit only** — no product fixes. Output ranked **P0/P1**, a separate **prod/env-risk** set for later, a **design-divergence Q&A queue**, and an updated readiness HTML.

Stage 2+ (separate plans per finding batch): fix P0 then P1 after founder sign-off.

## Locked decisions

| Decision | Choice |
|----------|--------|
| Outcome model | Audit → surface P0/P1 → plan & fix per batch |
| Stage 1 environment | **Local** (`localhost:3000` + live Supabase project) |
| Testing vs Dev-Vibe | Identical trees verified 2026-08-07 (`a5bf41ad`) — local code ≡ testing code |
| Auth | Account A = phone test OTP `9999999999` / `123456`; Account B = service-role minted user with **confirmed email** (no founder login required) |
| Collab | **Mandatory** 2-account E2E for all roles: `co-host`, `planner`, `photographer`, `viewer` |
| Design↔React | Structural + primary CTA interaction; **React + written decisions win**; undocumented drift → provisional pass → post-audit Q&A |
| Code health | Quality, security, dead/unreachable code, hardcoded vs dynamic, duplicate UI primitives |
| ClickUp | Skipped this pass |
| Approach | Parallel agent swarm (waves W0–W6) |

## Waves

### W0 — Setup (blocking)

- Confirm `:3000` healthy; Playwright + Vitest runnable
- Account A login works (phone OTP)
- Mint Account B (confirmed email) + Playwright `storageState`
- Create disposable `e2e-*` event(s); document cleanup rules
- Collect founder permissions so agents are not blocked mid-run

### W1 — Schema

- Live Supabase inventory vs `docs/data-model/DATA-MODEL.md` + SQL plans (incl. collab invite, push, permissions)
- Flag doc drift and missing decision-log entries

### W2 — API / backend

- Route matrix; run existing Vitest; expand gaps only as findings (no drive-by test authorship beyond audit harness)
- Authz / IDOR / RLS spot-checks; collab invite accept/decline APIs

### W3 — Playwright E2E

- Host journeys across shipped MVP surfaces (Auth, CRUD, Dashboard, Hub, Guests, Settings, Planning, Media, Website host+public, User Settings, Push UI)
- Collab matrix: invite each role → Collaborations Accept/Decline → bell path → capability boundaries per `lib/auth/eventAccess.ts`

### W4 — Design ↔ React

- Map `designs/pages/**` host screens ↔ `app/**` routes
- Intentional divergences (e.g. Website Pages as separate route): check specs/plans/memory first
- Undocumented: **Q&A queue**, not auto-P0

### W5 — Code health

- `code_reviewer` + `security_expert` + `tech_lead`
- Dead code, no-op CTAs, settings that save but nothing reads, hardcoded limits/URLs, security patterns (IDOR, secrets in client, open redirects)

### W6 — Rollup

- Merge → P0 / P1 / P2 + prod-risk set
- Refresh `docs/ops/v0-readiness.html`
- Session report under `docs/session-reports/`

## Severity

| Tier | Definition |
|------|------------|
| **P0** | Security hole, data loss/orphan risk, core flow broken, launch blocker |
| **P1** | Important feature broken/misleading (wrong permissions, dead primary CTA, settings unenforced) |
| **P2** | Polish, known stubs (billing upgrade), not-started modules (Admin, Chatbot) |
| **Prod-risk** | Env/ops only: VAPID/webhook/R2/Resend, `main` vs Testing, SW caching — tested **after** local Stage 1 |

## Out of scope (Stage 1)

Product code fixes · ClickUp · Claude.ai artifact republish · Building Admin/Chatbot · Real Twilio OTP · Pixel screenshot diffs · Production deploy changes

## Deliverables

1. This design doc (approved)
2. Stage 1 plan: `docs/superpowers/plans/2026-08-07-platform-truth-audit-stage1.md`
3. Findings ledger (P0/P1 + prod-risk + design Q&A)
4. Updated `docs/ops/v0-readiness.html`
5. Session report

## Agent roster

`tech_lead`, `product_manager`, `data_modeller`, `backend_engineer`, `frontend_engineer`, `test_engineer`, `security_expert`, `code_reviewer`, `ui_ux_designer`, `devops_engineer` (prod-risk list only in Stage 1; deep Vercel verify later)
