# CLAUDE.md - Evenzi Project Guide

## Project Overview

Evenzi is an early-stage wedding/event planning SaaS platform. Users create events, manage invitations, track RSVPs, and organize wedding-related tasks and budgeting.

**Current Status:** v0.1 — Auth & Role Selection complete (Phone OTP + Google OAuth + Role Selection page). Agent Runner is parked. MVP Phase 1 implementation in progress.

---

## Communication Mode

**Terse in inline 1:1 chat, full plain-English in every persisted/team-facing artifact.** In direct chat with the user, lead with the answer, drop filler/hedging/restating, prefer tables over prose — to cut output tokens. This NEVER applies to ClickUp tickets, commit/PR bodies, specs, plans, test plans, spec-kit files, council/subagent prompts, or verbatim approval-gate readouts (e.g. Dheeraj→Abhijith sync) — those stay full and detailed; the "verbatim, no detail dropped" rule always wins. Terse ≠ sloppy: keep technical precision and `file:line`/markdown-link formatting. Override: "explain in full" / "go deep" → full for that answer. Full spec + rationale: `~/.claude/projects/-Users-xcalider-Documents-Projects-Evenzi/memory/feedback_terse_inline_chat.md`.

**WhatsApp messages use WhatsApp syntax, not markdown.** When asked to draft a WhatsApp message (e.g. to Dheeraj), format with WhatsApp markup: `*bold*` (single asterisk), `_italic_` (underscore), `~strikethrough~`, ` ```monospace``` `, `` `inline code` ``, bullets `* ` / `- `, numbered `1. `, quote `> `. No headings or tables (they don't render) — use `*bold*` emphasis lines + bullets. Markdown's `**bold**` shows literal asterisks in WhatsApp, so switch syntax for the whole draft. Memory: `feedback_whatsapp_formatting.md`.

---

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18.3.1 + Tailwind CSS 4
- **Auth & Database:** Supabase (PostgreSQL) via `@supabase/ssr` and `@supabase/supabase-js`
- **Deployment:** Vercel
- **Testing:** Vitest (node environment, `vitest.config.ts`)
- **LLM Routing:** Vercel AI SDK (`ai` package) — multi-provider (Anthropic, OpenAI, Google, Groq, Ollama)
- **Email:** Resend (`resend` package) — notifications
- **ClickUp:** REST API integration — task intake and pipeline triggers

---

## Project Connectors (MCP)

This project uses these specific accounts/workspaces. When multiple are available across MCPs, **always use these — never default to the first one listed**. If unsure, ask before acting.

| Tool | Identifier | Purpose |
|------|-----------|---------|
| **ClickUp** | Workspace `90161512057` → Product space `90166506901` | Task intake & pipeline. See [docs/clickup/WORKSPACE.md](docs/clickup/WORKSPACE.md) for all list IDs. |
| **Supabase** | Project `smjkbmkxweevqpvygabe` (region `ap-northeast-1`) | Auth + DB |
| **Vercel** | Team `evenzi` / Project `evenzi` (`prj_dXWmfgGtBOJDsBO18BOmcNxfwwoX`) | Deployments → `evenzi.vercel.app` |
| **Figma** | File key `LjoTKwL7pkpYVnAW6hr4s8` ([Evenzi](https://www.figma.com/design/LjoTKwL7pkpYVnAW6hr4s8/Evenzi)) | **Locked / hand-off ready** designs (canonical source) |
| **Stitch** | Project `3859360114226566614` | **Active design workshop** — drafts before promotion to Figma |

**Design source-of-truth rule:** when implementing a component, prefer **Figma**. Fall back to **Stitch** only if the screen isn't in Figma yet.

## Commands

```bash
npm run dev            # Start Next.js dev server on localhost:3000
npm run design         # Start live-server for designs/ on localhost:4000 (LAN — mobile-testable)
npm run build          # Production build
npm start              # Start production server
npm run lint           # Run ESLint
npm run test           # Run Vitest (watch mode)
npm run test:run       # Run Vitest once (CI)
npm run sys-check      # Run real environment validation (no LLM cost)
```

---

## Project Structure

```
app/                        # Next.js App Router pages
  auth/                     # Login/signup (Phone OTP, Google OAuth)
  auth/callback/            # OAuth callback handler
  home/                     # Post-login dashboard
  api/auth/verify/          # Session verification endpoint

ai/                         # Agent knowledge base & pipeline reference (markdown + YAML frontmatter)
  agents/                   # 11 enriched agent specs (knowledge base for Claude Code sessions)
  pipelines/                # 4 pipeline definitions (feature, bug, enhancement, system_guard)
  system/agent_rules.md     # Shared coding standards

lib/supabase/               # Supabase client utilities
  client.ts                 # Browser-side client
  server.ts                 # Server-side client
  middleware.ts             # Session refresh + route protection

lib/runner/                 # Parked utilities (sys-check, logger) — see Dev-Runner branch

scripts/
  run-sys-check.ts          # npm run sys-check — real environment validation

docs/superpowers/
  specs/                    # Design specs
  plans/                    # Implementation plans

middleware.ts               # Next.js middleware entry point
vitest.config.ts            # Vitest config (node env, @ alias)
```

---

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<supabase-anon-key>

# LLM Providers (at least one required)
ANTHROPIC_API_KEY=sk-ant-xxxx           # primary provider
OPENAI_API_KEY=sk-proj-xxxx             # optional — used by task_planner, task_distributor
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxx   # optional — used by test_engineer
GROQ_API_KEY=gsk_xxxx                   # optional
OLLAMA_BASE_URL=http://localhost:11434/api  # optional, local only

# ClickUp Integration (required for webhook/intake flows)
CLICKUP_API_TOKEN=pk_xxxx               # ClickUp personal API token
CLICKUP_WEBHOOK_SECRET=<secret>         # HMAC signing for webhook verification
CLICKUP_DEFAULT_LIST_ID=<list-id>       # Default list for intake-created tasks
RUNNER_CLICKUP_ASSIGNEE_ID=<user-id>    # User ID for approval gate assignment

# Email Notifications (optional)
RESEND_API_KEY=re_xxxx                  # Resend API key
RUNNER_ALERT_EMAIL=you@example.com      # Where to send alerts
RUNNER_EMAIL_ON_COMPLETE=true           # Send email after each run
RUNNER_EMAIL_ON_ALERT=true              # Send email on budget alerts + approval gates
```

---

## Architecture & Patterns

### Authentication
- Supabase Auth with Phone OTP and Google OAuth
- Middleware (`middleware.ts`) refreshes sessions and protects routes
- Public paths: `/`, `/auth`, `/auth/*`, `/api/*`, `/_next/*`
- Protected paths redirect unauthenticated users to `/auth`

### Supabase Client Usage
- **Browser:** use `createBrowserClient()` from `lib/supabase/client.ts`
- **Server components/API routes:** use `createClient()` from `lib/supabase/server.ts`
- Never add logic between `createServerClient()` and `supabase.auth.getUser()` in middleware

### Path Alias
- `@/*` maps to the project root (configured in `tsconfig.json`)

---

## Development Workflow

> Features are built using the superpowers plugin workflow (brainstorm → plan → implement → review), guided by enriched agent prompts in `ai/agents/`.

### Delegation Gate (BEFORE any development) — RULE

**Before writing/building/testing anything, stop and route the work to the cheapest competent executor — default to delegating, reserve Claude's tokens for judgment.** Claude (the expensive context) should plan, diagnose, write specs/build-docs, review, and gate quality — not do mechanical building or testing that Cursor or Antigravity can do under supervision.

| Executor | Owns | Use for |
|---|---|---|
| **Cursor** | building / implementation (from a Claude build-doc) | feature builds, migrations, mechanical multi-file edits |
| **Antigravity** | automated testing | a11y / responsive / regression test passes |
| **Claude (me)** | planning · spec & build-doc authoring · root-cause diagnosis · **review + quality gates** · small surgical fixes only when delegation overhead > the fix | judgment, not typing |

- **The gate:** at the start of any dev task, ask "can Cursor build this / Antigravity test this under my review?" If yes → write the build-doc and delegate. Do it inline ONLY when it's trivial/surgical or needs live conversation context.
- **When the executor isn't obvious, ASK the founder** before proceeding.
- Claude always keeps the **review gate** — delegated work comes back for a Claude (Playwright/spec) review before it's considered done or pushed.
- **Why:** save Claude token usage; maximize parallel throughput across editors.

### How It Works

1. **Plan in ClickUp** — Create a feature task using templates from `docs/clickup/TEMPLATES.md` (see `docs/clickup/` for all ClickUp docs)
2. **New Claude Code session** — Paste ClickUp task details, invoke superpowers brainstorming
3. **Superpowers workflow** — brainstorm → write-plan → subagent-driven-development → code-review
4. **Agent knowledge** — At each stage, Claude Code references `ai/agents/` for role-specific checklists and patterns
5. **Approval gates** — After each dev phase, user validates output before next phase starts

### Council Gates (Multi-Agent Cross-Validation)

For non-trivial work, the `council` skill (`.claude/skills/council/SKILL.md`) auto-invokes at three checkpoints. It dispatches a contextual roster of domain experts (Tech Lead, Frontend, Backend, Security, Data Modeller, QA, etc.) drawn from `ai/agents/`, runs a debate round where they cross-validate each other's findings, and resolves disagreements via a Tech Lead arbiter ruling.

| Checkpoint | Mode | Roster size | Skip if trivial? |
|---|---|---|---|
| After plan written, before implementation | `/council plan <path>` | 3–5 agents | <3 tasks, no schema/auth/API |
| After design spec written, before frontend dev | `/council design <path-or-desc>` | 3–5 agents | Cosmetic tweak on existing component only |
| After implementation, before commit | `/council code` | 3–5 agents | <50 LOC + no auth/schema/API/middleware touched |
| When debugging starts (non-trivial bug) | `/council bug <description>` | 3–5 agents | Typo, known-trivial revert |

**Design mode caveat:** subagents can't see Figma/Stitch images. Pass a written spec or description — the council reviews intent, structure, states, and design-system fit, not pixels.

Council supersedes the lighter `plan-review` skill for non-trivial plans — `plan-review` stays available for quick single-round passes. The triviality skip is automatic (Phase 0 of the skill); critical findings block the next phase until addressed.

**Cost:** a 5-agent council ≈ 11 subagent dispatches per checkpoint (5 critique + 5 debate + 1 arbiter). Use the skip and roster cap (5) — don't expand both.

### Parallel Subagents (Standard Practice)

**Always prefer parallel execution.** When 2+ tasks are independent (no shared state or sequential dependency), dispatch them as parallel subagents using the `superpowers:dispatching-parallel-agents` skill.

**When to parallelize:**
- Multiple ClickUp tasks (create, update, delete) — batch them
- Independent file reads/writes across different parts of the codebase
- Frontend + Backend dev on different components
- Multiple component brainstorms/plans that don't depend on each other
- Running tests while writing docs

**When NOT to parallelize:**
- Tasks that depend on each other's output
- Schema changes that affect multiple components
- Anything requiring approval gates between steps

### Task Templates & Hierarchy

Features follow a 3-level hierarchy with approval gates after every phase:

```
📦 Feature (Parent Task)
  ├── 📋 Spec & Architecture           → [APPROVAL]
  ├── 📐 Data Modeling & Schema Design  → [APPROVAL]
  ├── 🧩 Component A (Subtask)
  │     ├── 🎨 UI/UX Design            → [APPROVAL]
  │     ├── 💻 Frontend Dev             → [APPROVAL]
  │     ├── ⚙️ Backend Dev              → [APPROVAL]
  │     └── ✅ Component QA             → [APPROVAL]
  ├── 🔗 Integration Testing            → [APPROVAL]
  ├── 📝 Feature Documentation          → [APPROVAL]
  └── 🚀 Release & Deployment
```

11 task templates are defined in `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`.

### ClickUp Workspace Structure

```
Product (Space)
  ├── Ideas              — Raw feature ideas, unrefined
  ├── Backlog            — Refined, prioritized, ready for sprint
  ├── Development/
  │     ├── Frontend
  │     ├── Backend
  │     ├── Database
  │     └── DevOps
  ├── Design
  ├── QA & Bugs
  ├── Architecture & Configuration
  └── Documentation
```

**Tags:** `mvp-phase-1`, `feature`, `component`, `phase:spec`, `phase:data-model`, `phase:ui-ux`, `phase:frontend`, `phase:backend`, `phase:qa`, `phase:integration`, `phase:docs`, `phase:release`, `approval-gate`, `claude-code`

**Flow:** Ideas → Backlog (when refined) → Development lists (when picked for sprint)

### System Check

Run `npm run sys-check` before starting work to validate the environment (Supabase, API keys, ClickUp, node_modules). Zero LLM cost, ~500ms.

### Pipeline Reference

The `ai/pipelines/` files define the ideal step order for different work types. These serve as reference for structuring work, not as automated executors:

| Pipeline | Steps | Use Case |
|----------|-------|----------|
| `feature` | guard → spec → design → plan → approve → backend → frontend → review → qa | New features |
| `bug` | guard → analysis → plan → approve → fix → review → qa | Bug fixes |
| `enhancement` | guard → impact → design → plan → approve → implement → review → qa | Improvements |

### Modifying Agent Knowledge

Agent definitions live in `ai/agents/<role>.md` with YAML frontmatter. To improve an agent's knowledge, edit the prompt body below the frontmatter. Changes are picked up when Claude Code reads the file.

**Self-evolution via `agent-evolve`:** Each agent file has a `## Learnings` section (starts empty). The `agent-evolve` skill (`.claude/skills/agent-evolve/SKILL.md`) auto-captures non-obvious, validated, role-specific, actionable learnings from sessions and appends them — with user approval — to the relevant agent's section. Hard cap of 8 entries per agent; oldest/weakest demoted to `ai/agents/_archived_learnings.md` on overflow. The skill fires on learning signals during work and as a batch step inside `/end-evenzi-session`. Generic best-practices and cross-cutting rules are routed to `CLAUDE.md` or memory instead — agent files only get insights that change THAT agent's future critiques.

Key enriched agents:
- `frontend_engineer.md` — design thinking, typography, color, motion, anti-patterns (from frontend-design plugin)
- `code_reviewer.md` — confidence scoring, false positive filtering, multi-perspective review (from code-review plugin)
- `security_expert.md` — 9 vulnerability patterns, defense-in-depth, Next.js security (from security-guidance plugin)
- `ui_ux_designer.md` — Evenzi-specific design role book: two-user split, free-tier-feels-paid, WhatsApp-aware, component reuse, content-length resilience, code quality in `designs/`. Evolves freely with new patterns learned per pass.

### Parked: Automated Runner

The full multi-LLM automated runner (executor, LLM router, budget monitor, ClickUp webhook, email notifications) is preserved on the `Dev-Runner` branch. It can be revived if external LLM API keys become available.

---

## Branching Strategy

- **`main`** — Production branch, connected to Vercel. Only receives merges from `Dev-Vibe` when ready to deploy.
- **`Dev-Vibe`** — Working main branch. All feature branches are created from and merged back to `Dev-Vibe`.
- **`Dev-Runner`** — Parked branch preserving the full automated multi-LLM pipeline runner (executor, LLM router, budget monitor, ClickUp webhook, email notifications). Will be revived when external API keys are available.
- **`Dev-AMC`** — Parked branch preserving the full AMC dashboard code (Phase 1). Will be revived later for the general-purpose pipeline monitoring UI.
- **Feature branches** — Created from `Dev-Vibe`, named descriptively (e.g., `feature/agent-runner`).

---

## Coding Conventions

### Component Reuse (Reuse Before Create) — RULE

**Before building any component, pattern, or primitive, search for an existing one that does the same JOB — by purpose, not by name.** If one exists, reuse it (as-is) or extend it via a modifier; **never fork a parallel component that duplicates an existing one's job.** (This is exactly how `.nav-tabs` and `.pill-tab` both came to exist as two controls for the same view-switcher — a defect later unified into `.seg`.)

- **The catalog is the source of truth:** `designs/components.html` + `designs/shared/shell.css` for UI; `ai/` for agent/pipeline knowledge. Check it first and cite the primitive you're reusing.
- **Keep the catalog current:** any new shared primitive MUST be added to `designs/components.html` in the same change. An uncataloged primitive can't be found, so the next person rebuilds it — which is the whole failure `components.html` exists to prevent. Catalog-backfill debt directly causes reinvention.
- **A same-purpose duplicate is a review-blocking defect**, not polish. Three rungs only: reuse-as-is → modifier-extend → new (new only when nothing serves the purpose).

### Naming
- **Directories:** kebab-case (`event-management`)
- **Components:** PascalCase (`EventCard.tsx`)
- **Utilities/functions:** camelCase (`getUserEvents`)
- **Constants:** UPPER_CASE (`MAX_RETRY_COUNT`)
- **Database tables/columns:** snake_case (`event_id`, `created_at`)

### Components
- Use `"use client"` directive only when client-side interactivity is needed
- Prefer server components for data fetching
- Functional components with hooks, no class components

### API Routes
- Use plural nouns for endpoints (`/api/events`)
- Handle errors with try-catch and return `NextResponse`

### Styling
- Tailwind CSS utility classes only (no CSS modules)
- Mobile-first responsive design

### TypeScript
- Strict mode is enabled; avoid `any`
- Export explicit return types on all public functions

---

## Database

- PostgreSQL via Supabase (no ORM, raw Supabase client queries)
- Auth tables managed by Supabase Auth
- Supabase project ID: `smjkbmkxweevqpvygabe` (region: ap-northeast-1)
- Evenzi app tables (not yet built): `events`, `invitations`, `expenses`, `tasks`

---

## Important Notes

- Test phone number for dev: `9999999999` with OTP `123456` (phone OTP requires Twilio configured in Supabase)
- Phone auth is configured for India region (+91 prefix)
- The `ai/` directory contains agent and pipeline definitions used as knowledge base for Claude Code sessions
- AMC dashboard code is parked on `Dev-AMC` branch — will be revived as a general-purpose pipeline monitor
- Vercel deployments are currently in ERROR state (pre-existing issue)

### MVP Phase 1 — In Progress

**Goal:** Host-only, one complete end-to-end event flow.

**Sprint 1 (Active):**

| Feature | Priority | Status | Subtasks |
|---------|----------|--------|----------|
| Fix Vercel Deployment | P0 | DONE — live at evenzi.vercel.app | 0 |
| Auth & Role Selection | P0 | DONE | 10 |
| Event CRUD (4-Step Wizard) | P0 | **DONE** — Create flow live; Edit & Delete FE+BE live (`GeneralSettingsForm.tsx` wires `PUT`/`DELETE` on `app/api/events/[id]`, incl. delete-confirm modal). Verified against repo 2026-07-30 — docs previously said "in progress" | 45 |
| Host Dashboard | P0 | In Review (revamp landed) | 21 |
| Landing Section (Marketing Site) | P2 | In Progress | 13 |
| Reusable Component Library | P0 | DONE — achieved via React composition as components are built (Dheeraj), not a standalone library artifact | 28 |

**Backlog:**

| Feature | Priority | Status | Subtasks |
|---------|----------|--------|----------|
| Event Management Hub | P0 | **DONE** — `app/events/[id]/page.tsx` (544 lines) live, real Supabase queries (sub-events, `event_hub_summary` view), links out to invitations/guests/planning/journey/website. Corrected 2026-07-30 — docs previously said "FE/app not started" | 16 |
| Guest Management & RSVP | P1 | **DONE** — data model + 6 API routes + FE all live (`app/events/[id]/guests`, list/stats/toolbar/filters/sort, add/edit/remove, RSVP setter, functions + zero-assigned banner, tag combobox + manager, real CSV import with validation gate, bulk tag/assign/delete; Send-invites intentionally inert pending a WhatsApp planning session). Tested at 6 breakpoints. See `docs/superpowers/specs/2026-07-29-guest-management-design.md` §11 | 25 |
| Event Settings | P1 | **DONE** — data model + backend (4 API routes) + FE all live (`app/settings`, 5 tabs w/ real DB round-trips, commit `a8df148`) | 20 |
| User Settings | P1 | **DONE** — `/settings` live with 4 working sections (Profile w/ avatar upload → R2, Security = connected SSO/phone methods, Notification prefs, Account sign-out), 3 API routes, all reading/writing `user_profiles` + `user_preferences`. Settings icon added to shared `FloatingNav`; logout removed from nav everywhere. Tested at 6 breakpoints. Commits `8632cbd`..`0e50a4c` | 20 |
| Planning Tools (Checklist + Budget) | P2 | **DONE** — backend-wiring pass complete + live-verified 2026-07-30. 7 new API routes (`app/api/events/[id]/planning/*`), `page.tsx` real server-side fetch, `PlanningClient.tsx` fully wired. 9-task subagent-driven build, every task reviewed (2 needed a fix+re-review cycle: task-route not-found/error-handling, missing optimistic-update rollback). Antigravity live-verified task create/budget/expense/duplicate-type-rejection against the real DB, plus bulk actions + validation + receipt stub visually at mobile/desktop (`qa/planning-test-report.md`). Task edit/delete/toggle-done was not separately UI-clicked (API-only + 2 code reviews) — accepted as low-risk, not re-verified live given the logic was already reviewed twice. Typecheck + lint clean. | 15 |
| Media & Memories (Photo Gallery) | P2 | Data model LIVE on dev (`media_01-06`); **FE UI built** (`app/events/[id]/media`, 1341-line `MediaClient.tsx`, Photos/Videos/Albums) **but not wired** — storage-quota meter is a hardcoded mock, `app/api/media/[...key]` only has `GET` (serve), no upload endpoint yet. Corrected 2026-07-30 | 25 |
| Digital Presence (Event Website) | P2 | **Data model DONE, fully LIVE (2026-07-31)** — Wave 1 (`website_01`–`website_11`, host editor) + Wave 2a (`website_12`–`website_16`, public payload) + Wave 2b (`website_17`–`website_20`, guest lookup/session/RSVP) all council-reviewed and applied, see `DATA-MODEL.md` D49–D51. React pages are still static mocks on both sides — host editor (`app/events/[id]/website/*`) and the public guest site (`app/e/[slug]/*`, doesn't exist yet). Dheeraj has both wiring briefs: `docs/sprint/sprint-1/handoff-website-wave1.md` (host editor) and `handoff-website-wave2.md` (public API routes — blocked on an `events.slug` generator, which doesn't exist anywhere yet). Two open decisions still need founder sign-off: Story/Q&A page tier (spec §1), `x-forwarded-for` gateway-trust verification (spec §6b.3). | Partial |
| Admin Module (Developer Panel) | P2 | Not Started | 15 |
| Digital Invitations (WhatsApp) | P3 | Data model LIVE on dev (`inv_01-06`); **scope = invitation CARD designer** (personalizer). WhatsApp send + status tracking stays in Guest Mgmt (already done there). **FE UI built** (`app/events/[id]/invitations`, 576-line `InvitationsClient.tsx`, 7 templates, editable slots) **but not persisted anywhere** — no `fetch`, no `localStorage`; the "Saved" autosave indicator is cosmetic only. `app/wedding-invitation-temp-1` remains a separate, unrelated design-test page. Corrected 2026-07-30 — docs previously said "FE/app not started" | 0 |
| Support Chatbot (FAQ + Admin + Escalation) | P1 | Planned (unblocked — build from design system) | 30 |

**Out of scope for MVP:** Vendor role, AI Photo Finder, real-time features, event discovery/search, analytics.

**Design status:** Most screens designed in Google Stitch, some in Figma. Stitch project: `https://stitch.withgoogle.com/projects/3859360114226566614`

### What's Next (Post-MVP)
- **Vendor Role:** Full vendor-side flows (separate scope)
- **AMC Revival:** Convert parked AMC into a general-purpose pipeline monitoring dashboard
- **Runner Enhancements:** Live run streaming, token usage alerts, checkpoint approval UI
