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
  agents/                   # 15 enriched agent specs (knowledge base for Claude Code sessions)
  pipelines/                # 4 pipeline definitions (feature, bug, enhancement, system_guard)
  system/agent_rules.md     # Shared coding standards

lib/supabase/               # Supabase client utilities
  client.ts                 # Browser-side client
  server.ts                 # Server-side client
  middleware.ts             # Session refresh + route protection

lib/runner/                 # Utilities (sys-check, logger)
  sys-check.ts              # Real environment validation (Supabase, LLM keys, ClickUp, node_modules)
  types.ts                  # Shared types (StepResult, RunLog)
  logger.ts                 # Stdout progress logging + JSON log persistence

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

## Development Workflow

> Features are built using the superpowers plugin workflow (brainstorm → plan → implement → review), guided by enriched agent prompts in `ai/agents/`.

### How It Works

1. **Plan in ClickUp** — Create a task with requirements in ClickUp
2. **New Claude Code session** — Paste ClickUp task details, invoke superpowers brainstorming
3. **Superpowers workflow** — brainstorm → write-plan → subagent-driven-development → code-review
4. **Agent knowledge** — At each stage, Claude Code references `ai/agents/` for role-specific checklists and patterns

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

Key enriched agents:
- `frontend_engineer.md` — design thinking, typography, color, motion, anti-patterns (from frontend-design plugin)
- `code_reviewer.md` — confidence scoring, false positive filtering, multi-perspective review (from code-review plugin)
- `security_expert.md` — 9 vulnerability patterns, defense-in-depth, Next.js security (from security-guidance plugin)

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
