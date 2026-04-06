# CLAUDE.md - Evenzi Project Guide

## Project Overview

Evenzi is an early-stage wedding/event planning SaaS platform. Users create events, manage invitations, track RSVPs, and organize wedding-related tasks and budgeting.

**Current Status:** v0.1 — Auth is live. Agent Runner is built. Evenzi core features (events, invitations, budgeting) are planned but not yet built.

---

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18.3.1 + Tailwind CSS 4
- **Auth & Database:** Supabase (PostgreSQL) via `@supabase/ssr` and `@supabase/supabase-js`
- **Deployment:** Vercel
- **Testing:** Vitest (node environment, `vitest.config.ts`)
- **LLM Routing:** Vercel AI SDK (`ai` package) — multi-provider (Anthropic, OpenAI, Google, Groq, Ollama)
- **Email:** Resend (`resend` package) — runner notifications
- **ClickUp:** REST API integration — task intake and pipeline triggers

## Commands

```bash
npm run dev            # Start dev server on localhost:3000
npm run build          # Production build
npm start              # Start production server
npm run lint           # Run ESLint
npm run test           # Run Vitest (watch mode)
npm run test:run       # Run Vitest once (CI)
npm run agent          # Run agent pipeline (see Agent Runner below)
npm run agent:intake   # Start conversational intake session
```

---

## Project Structure

```
app/                        # Next.js App Router pages
  auth/                     # Login/signup (Phone OTP, Google OAuth)
  auth/callback/            # OAuth callback handler
  home/                     # Post-login dashboard
  api/auth/verify/          # Session verification endpoint
  api/runner/webhook/       # ClickUp webhook → pipeline trigger

ai/                         # Agent & pipeline definitions (markdown + YAML frontmatter)
  agents/                   # 15 agent specs (system_checker, product_manager, etc.)
  pipelines/                # 4 pipeline definitions (feature, bug, enhancement, system_guard)
  system/agent_rules.md     # Shared base prompt for all agents

lib/supabase/               # Supabase client utilities
  client.ts                 # Browser-side client
  server.ts                 # Server-side client
  middleware.ts             # Session refresh + route protection

lib/llm/                    # Multi-provider LLM infrastructure
  router.ts                 # Vercel AI SDK — routes to Anthropic/OpenAI/Google/Groq/Ollama
  defaults.ts               # Default model per agent role
  tokens.ts                 # Cost estimation for 15+ models
  types.ts                  # AgentProvider, LLMResult types

lib/runner/                 # Agent pipeline runner
  types.ts                  # All runner types (RunConfig, RunLog, StepResult, etc.)
  loader.ts                 # Parses YAML-frontmatter markdown into AgentDefinition/PipelineDefinition
  logger.ts                 # Stdout progress logging + JSON run log persistence
  monitor.ts                # Token usage tracking + budget enforcement
  notify.ts                 # Email notifications via Resend (run summaries, budget alerts, approvals)
  clickup.ts                # ClickUp API integration (task fetch, comments, status updates)
  executor.ts               # Pipeline orchestrator — step chaining, approval gates, budget checks
  intake.ts                 # Conversational requirements gathering via CLI

scripts/                    # CLI entry points
  run-agent.ts              # npm run agent — execute a pipeline
  run-intake.ts             # npm run agent:intake — conversational intake

docs/superpowers/
  specs/2026-04-06-agent-runner-design.md         # Agent runner design spec
  plans/2026-04-06-agent-runner-implementation.md  # Implementation plan (14 tasks)

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
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxx   # optional — used by qa_engineer
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

## Agent Runner

> A lightweight multi-LLM pipeline runner that chains agent outputs to automate Evenzi feature development.

### How It Works

1. **Input** — Feature request via CLI (`npm run agent`), conversational intake (`npm run agent:intake`), or ClickUp webhook
2. **Pipeline** — Loads a pipeline definition from `ai/pipelines/` (e.g., `feature.md` has 9 steps)
3. **Execution** — Each step runs an agent (loaded from `ai/agents/`) through the LLM router, passing accumulated context
4. **Budget** — Token monitor enforces per-step and per-run budget limits based on priority tier
5. **Output** — Results logged to `.runner/runs/`, posted as ClickUp comments, emailed via Resend

### CLI Usage

```bash
# Run a feature pipeline with inline input
npm run agent -- --input "Build event invitations with RSVP tracking"

# Run from a file
npm run agent -- --file ./features/invitations.md

# Run from a ClickUp task
npm run agent -- --clickup TASK_ID

# Options
npm run agent -- --input "..." --pipeline bug --priority high --no-budget-limit

# Conversational intake (creates ClickUp task)
npm run agent:intake
npm run agent:intake "I want to add guest meal preferences"
npm run agent:intake --list LIST_ID
```

### Pipelines

| Pipeline | Steps | Use Case |
|----------|-------|----------|
| `feature` | 9 steps (guard → spec → design → plan → approve → backend → frontend → review → qa) | New features |
| `bug` | 7 steps (guard → analysis → plan → approve → fix → review → qa) | Bug fixes |
| `enhancement` | 8 steps (guard → impact → design → plan → approve → implement → review → qa) | Improvements |
| `system_guard` | 1 step (environment check) | Standalone validation |

### Agent Roster

| Role | Provider | Model | Used In |
|------|----------|-------|---------|
| system_checker | Anthropic | claude-haiku-4-5 | All pipelines (step 1) |
| product_manager | Anthropic | claude-opus-4-6 | feature |
| tech_lead | Anthropic | claude-opus-4-6 | feature, bug, enhancement |
| backend_engineer | Anthropic | claude-sonnet-4-6 | feature |
| frontend_engineer | Anthropic | claude-sonnet-4-6 | feature |
| fullstack_engineer | Anthropic | claude-sonnet-4-6 | bug, enhancement |
| code_reviewer | Anthropic | claude-opus-4-6 | All pipelines |
| qa_engineer | Google | gemini-2.0-flash | All pipelines |
| data_modeller | Anthropic | claude-sonnet-4-6 | On-demand |
| task_planner | OpenAI | gpt-4o-mini | All pipelines |
| task_distributor | OpenAI | gpt-4o-mini | On-demand |
| security_expert | Anthropic | claude-opus-4-6 | On-demand |
| token_monitor | Anthropic | claude-haiku-4-5 | Pre-estimation |
| devops_engineer | Anthropic | claude-sonnet-4-6 | On-demand |
| intake_agent | Anthropic | claude-sonnet-4-6 | Intake conversation |

### Budget Tiers

| Tier | Per Run | Per Step | When |
|------|---------|----------|------|
| low | $1.00 | $0.25 | Minor tasks |
| normal | $2.00 | $0.50 | Default for all pipelines |
| high | $5.00 | $1.50 | Complex features |
| urgent | $10.00 | $3.00 | Critical fixes |
| override | Unlimited | Unlimited | Via `budget-override` tag or `--no-budget-limit` |

### Approval Gates

Every pipeline has an approval gate after the planning step. Behavior depends on source:
- **CLI:** Interactive y/n prompt in terminal
- **ClickUp:** Pipeline pauses, saves state to `.runner/pending/<taskId>.json`, updates ClickUp task status to "Awaiting Approval", assigns to `RUNNER_CLICKUP_ASSIGNEE_ID`, sends email. Resumes when task status changes to "Approved" (via webhook).

### ClickUp Webhook

The webhook route (`/api/runner/webhook`) listens for `taskStatusUpdated` and `taskTagUpdated` events. It:
- Verifies HMAC-SHA256 signature (if `CLICKUP_WEBHOOK_SECRET` is set)
- Maps ClickUp task → `RunConfig` (pipeline from tags, priority from ClickUp priority)
- Triggers pipeline execution asynchronously
- Posts results as task comments and updates task status

### Adding/Modifying Agents

Agent definitions live in `ai/agents/<role>.md` with YAML frontmatter:
```yaml
---
role: agent_role_name
name: Human Readable Name
provider: anthropic|openai|google|groq|ollama
model: model-id
token_budget: 4096
output_format: markdown|json|code
---

System prompt body goes here...
```

Pipeline definitions live in `ai/pipelines/<name>.md`:
```yaml
---
name: pipeline_name
description: What this pipeline does
priority_default: normal
---

## Steps

### 1. step_name
agent: agent_role
input: user_request + step.previous_step
gate: hard|approval  (optional)
description: What this step does
```

---

## Branching Strategy

- **`main`** — Production branch, connected to Vercel. Only receives merges from `Dev-Vibe` when ready to deploy.
- **`Dev-Vibe`** — Working main branch. All feature branches are created from and merged back to `Dev-Vibe`.
- **`Dev-AMC`** — Parked branch preserving the full AMC dashboard code (Phase 1). Will be revived later for the general-purpose pipeline monitoring UI.
- **Feature branches** — Created from `Dev-Vibe`, named descriptively (e.g., `feature/agent-runner`).

---

## Coding Conventions

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
- The `ai/` directory contains machine-readable agent and pipeline definitions used by the runner
- AMC dashboard code is parked on `Dev-AMC` branch — will be revived as a general-purpose pipeline monitor
- Vercel deployments are currently in ERROR state (pre-existing issue)
- `.runner/` directory (gitignored) stores run logs and pending approval states locally

### What's Next
- **Evenzi Core:** Events, invitations, RSVP tracking, budgeting — the actual product features
- **AMC Revival:** Convert parked AMC into a general-purpose pipeline monitoring dashboard
- **Runner Enhancements:** Live run streaming, token usage alerts, checkpoint approval UI
