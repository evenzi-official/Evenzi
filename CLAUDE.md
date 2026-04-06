# CLAUDE.md - Evenzi Project Guide

## Project Overview

Evenzi is an early-stage wedding/event planning SaaS platform. Users create events, manage invitations, track RSVPs, and organize wedding-related tasks and budgeting.

**Current Status:** v0.1 — Auth is live. AMC Phase 1 is complete on branch `claude/loving-ellis`. Evenzi core features (events, invitations, budgeting) are planned but not yet built.

---

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **UI:** React 18.3.1 + Tailwind CSS 4
- **Auth & Database:** Supabase (PostgreSQL) via `@supabase/ssr` and `@supabase/supabase-js`
- **Deployment:** Vercel
- **Testing:** Vitest (node environment, `vitest.config.ts`)
- **LLM Routing:** Vercel AI SDK (`ai` package) — multi-provider

## Commands

```bash
npm run dev        # Start dev server on localhost:3000
npm run build      # Production build
npm start          # Start production server
npm run lint       # Run ESLint
npm run test       # Run Vitest (watch mode)
npm run test:run   # Run Vitest once (CI)
```

---

## Project Structure

```
app/                        # Next.js App Router pages
  auth/                     # Login/signup (Phone OTP, Google OAuth)
  auth/callback/            # OAuth callback handler
  home/                     # Post-login dashboard
  api/auth/verify/          # Session verification endpoint
  (amc)/                    # AMC route group (no URL prefix)
    layout.tsx              # AMC dark shell with sidebar
    amc/page.tsx            # /amc — Overview dashboard
    amc/projects/           # /amc/projects — Project list + detail
  api/amc/                  # AMC REST API routes
    projects/               # GET list, POST create, GET/PATCH/DELETE by id
    agents/                 # GET list, POST create, GET/PATCH/DELETE by id, GET stats
    webhooks/events/        # POST — webhook receiver (HMAC-verified)

lib/supabase/               # Supabase client utilities
  client.ts                 # Browser-side client
  server.ts                 # Server-side client
  middleware.ts             # Session refresh + route protection

lib/amc/                    # Agentic Mission Control — isolated module
  types/index.ts            # All AMC TypeScript interfaces
  db/queries.ts             # Supabase CRUD for projects + agents + stats
  db/migrations/            # SQL migration files
  llm/router.ts             # Vercel AI SDK multi-provider router
  llm/defaults.ts           # Default model per pipeline role
  utils/webhook.ts          # HMAC-SHA256 sign + verify
  utils/tokens.ts           # Cost estimation per model

components/amc/shared/      # Shared AMC UI components
  sidebar-nav.tsx           # Left nav with active-state highlighting
  status-badge.tsx          # Coloured status pill (pending/running/etc)

docs/superpowers/
  specs/2026-04-06-mission-control-design.md   # Full AMC design spec
  plans/2026-04-06-amc-phase1-foundation.md    # Phase 1 implementation plan
  amc/COLLABORATOR_ONBOARDING.md               # Team onboarding guide

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

# AMC Multi-LLM (add whichever providers you need)
ANTHROPIC_API_KEY=sk-ant-xxxx           # already set
OPENAI_API_KEY=sk-proj-xxxx             # optional
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxx   # optional, free tier available
GROQ_API_KEY=gsk_xxxx                   # optional, very generous free tier
OLLAMA_BASE_URL=http://localhost:11434/api  # optional, local only

# AMC Config
AMC_WEBHOOK_SIGNING_SECRET=change-this-in-production
```

---

## Architecture & Patterns

### Authentication
- Supabase Auth with Phone OTP and Google OAuth
- Middleware (`middleware.ts`) refreshes sessions and protects routes
- Public paths: `/`, `/auth`, `/auth/*`, `/api/*`, `/_next/*`, `/amc/*` (temporary for dev)
- Protected paths redirect unauthenticated users to `/auth`

### Supabase Client Usage
- **Browser:** use `createBrowserClient()` from `lib/supabase/client.ts`
- **Server components/API routes:** use `createClient()` from `lib/supabase/server.ts`
- Never add logic between `createServerClient()` and `supabase.auth.getUser()` in middleware

### Path Alias
- `@/*` maps to the project root (configured in `tsconfig.json`)

### AMC Isolation Rule
AMC code (`lib/amc/`, `app/(amc)/`, `app/api/amc/`, `components/amc/`) **never imports Evenzi-specific code**. It only imports from:
- `lib/supabase/` (shared client)
- `lib/amc/` (internal)
- `next/server`, `react`, third-party packages

This isolation means AMC can be extracted into its own repo by copying 4 directories + running the migration.

---

## AMC — Agentic Mission Control

> A self-contained monitoring dashboard for multi-agent AI pipelines. Lives inside Evenzi but is fully extractable.

### What's Built (Phase 1 — `claude/loving-ellis`)

| Layer | What's done |
|-------|-------------|
| **Database** | 9 `mc_`-prefixed tables in Supabase with RLS, indexes, triggers |
| **Types** | Full TypeScript interfaces for all entities + webhook payloads |
| **LLM Router** | Vercel AI SDK — routes to Anthropic, OpenAI, Google, Groq, Ollama |
| **Webhook Utils** | HMAC-SHA256 sign/verify with constant-time comparison |
| **Token Utils** | Cost estimation for 15+ models across 5 providers |
| **DB Queries** | Full CRUD for projects + agents; stats aggregation |
| **API Routes** | `/api/amc/projects`, `/api/amc/agents`, `/api/amc/webhooks/events` |
| **UI Shell** | Dark sidebar, Overview page, Projects list, Project detail |
| **Tests** | 30 tests, 0 TypeScript errors |

### AMC Database Tables
All prefixed `mc_` — see `lib/amc/db/migrations/001_amc_schema.sql`:
- `mc_projects` — repos connected to AMC
- `mc_agents` — agent role definitions (global or project-specific)
- `mc_pipelines` — named pipeline configurations
- `mc_runs` — pipeline execution runs
- `mc_run_stages` — individual agent step results
- `mc_tasks` — Kanban tasks
- `mc_artifacts` — docs/code produced by agents
- `mc_events` — real-time event stream from CLI
- `mc_memory_entries` — decision journal

### Default Model Routing
| Role | Provider | Model |
|------|----------|-------|
| system_checker, token_monitor | Anthropic | claude-haiku-4-5 |
| product_manager, tech_lead, code_reviewer, security_expert | Anthropic | claude-opus-4-6 |
| backend/frontend/fullstack_engineer, devops, data_modelling | Anthropic | claude-sonnet-4-6 |
| task_planner, task_distributor | OpenAI | gpt-4o-mini |
| qa_engineer | Google | gemini-2.0-flash |

### What's Next (Phase 2)
- Kanban board with drag-and-drop
- Agents registry + config editor (change model/prompt per agent)
- Team pipeline visualization
- Live run monitor (streaming webhook events)

### What's Next (Phase 3)
- Memory timeline browser
- Docs/artifacts viewer
- Token usage alerts + budget enforcement
- Checkpoint approval UI (human-in-the-loop)

### What's Next (Phase 4)
- `amc-cli` npm package: `init`, `push-agents`, `pull-agents`, `report`, `tokens`, `run`, `status`, `approve`, `abort`

---

## Coding Conventions

### Naming
- **Directories:** kebab-case (`event-management`)
- **Components:** PascalCase (`EventCard.tsx`)
- **Utilities/functions:** camelCase (`getUserEvents`)
- **Constants:** UPPER_CASE (`MAX_RETRY_COUNT`)
- **Database tables/columns:** snake_case (`event_id`, `created_at`)
- **AMC tables:** `mc_` prefix (`mc_projects`, `mc_agents`)

### Components
- Use `"use client"` directive only when client-side interactivity is needed
- Prefer server components for data fetching
- Functional components with hooks, no class components

### API Routes
- Use plural nouns for endpoints (`/api/events`, `/api/amc/projects`)
- Handle errors with try-catch and return `NextResponse`
- AMC API routes all under `/api/amc/`

### Styling
- Tailwind CSS utility classes only (no CSS modules)
- Mobile-first responsive design
- AMC UI: dark theme (`bg-gray-950` sidebar, `bg-gray-900` main area)

### TypeScript
- Strict mode is enabled; avoid `any`
- All AMC types defined in `lib/amc/types/index.ts`
- Export explicit return types on all public functions

---

## Database

- PostgreSQL via Supabase (no ORM, raw Supabase client queries)
- Auth tables managed by Supabase Auth
- Supabase project ID: `smjkbmkxweevqpvygabe` (region: ap-northeast-1)
- AMC tables: see `lib/amc/db/migrations/001_amc_schema.sql`
- Evenzi app tables (not yet built): `events`, `invitations`, `expenses`, `tasks`

---

## Important Notes

- Test phone number for dev: `9999999999` with OTP `123456` (phone OTP requires Twilio configured in Supabase)
- Phone auth is configured for India region (+91 prefix)
- The `ai/` directory contains reference docs for AI-driven development (agent roles, workflows, feature specs)
- AMC branch: `claude/loving-ellis` — awaiting merge to `Dev-Vibe`
- Vercel deployments are currently in ERROR state (pre-existing issue, unrelated to AMC)
