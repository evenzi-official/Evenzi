# AMC — Collaborator Onboarding

> **New to this codebase?** Read this first. It covers what was built, why, how it's structured, and where to pick up next.

---

## What Is AMC?

**Agentic Mission Control (AMC)** is a self-contained monitoring dashboard for multi-agent AI pipelines. It lives inside the Evenzi repo but is architecturally isolated — it can be extracted into its own standalone project at any time.

**Think of it as:** Mission Control for AI agents. You register a project (e.g. Evenzi App), define an agent pipeline (System Checker → PM → Tech Lead → Engineers → QA), and AMC tracks every run, every token spent, every artifact produced, and every decision made.

---

## Quick Start

```bash
# 1. Clone and switch to the AMC branch
git checkout claude/loving-ellis

# 2. Install dependencies (already done, but just in case)
npm install

# 3. Set up environment variables
cp .env.local.example .env.local   # or copy from team secrets manager
# Required additions for AMC:
# ANTHROPIC_API_KEY=...
# GROQ_API_KEY=...         (free — get at console.groq.com)
# GOOGLE_GENERATIVE_AI_API_KEY=...  (free — get at aistudio.google.com)

# 4. Start the dev server
npm run dev

# 5. Visit AMC
open http://localhost:3000/amc
```

> **Note:** The `.env.local` file needs to be in the root of the repo (not inside the worktree directory if you're using git worktrees). The worktree has a symlink to the parent's `.env.local`.

---

## What Was Built — Phase 1

Phase 1 was completed on **2026-04-06**. Here's everything that was shipped:

### Database (Supabase, project `smjkbmkxweevqpvygabe`)

9 new tables, all prefixed `mc_` to avoid conflicts with Evenzi tables:

| Table | Purpose |
|-------|---------|
| `mc_projects` | Repos registered with AMC |
| `mc_agents` | Agent role definitions (global or per-project) |
| `mc_pipelines` | Named pipeline configurations |
| `mc_runs` | Execution instances of a pipeline |
| `mc_run_stages` | Individual agent step within a run (tokens, cost, output) |
| `mc_tasks` | Kanban tasks (backlog → in_progress → review → done) |
| `mc_artifacts` | Docs/code produced by agents (specs, plans, reviews) |
| `mc_events` | Real-time event stream pushed by `amc-cli` |
| `mc_memory_entries` | Decision journal (decisions, observations, milestones) |

Migration file: `lib/amc/db/migrations/001_amc_schema.sql`
- All tables have RLS enabled
- Indexes on high-query columns
- `updated_at` triggers on projects, agents, tasks

### TypeScript Types

`lib/amc/types/index.ts` — Single source of truth for all AMC types:
- Entity interfaces: `AMCProject`, `AMCAgent`, `AMCRun`, `AMCTask`, etc.
- Input types: `CreateProjectInput`, `UpdateAgentInput`, etc.
- Webhook payload union: `WebhookPayload` (discriminated union on `type` field)
- `LLMResult` — return type from `runAgentLLM`

### Multi-LLM Router

`lib/amc/llm/router.ts` — Built on **Vercel AI SDK**. One function, any provider:

```typescript
import { getModel, runAgentLLM } from '@/lib/amc/llm/router'

// Get a model instance
const model = getModel('groq', 'llama-3.3-70b-versatile')

// Run an agent (returns text + token counts + cost)
const result = await runAgentLLM(agent, userPrompt, contextString)
// result: { text, inputTokens, outputTokens, estimatedCostUsd }
```

**Supported providers:** Anthropic, OpenAI, Google, Groq, Ollama (local)

`lib/amc/llm/defaults.ts` — Default model per pipeline role. Examples:
- `product_manager` → `anthropic:claude-opus-4-6` (deep reasoning)
- `task_planner` → `openai:gpt-4o-mini` (cheap, fast)
- `qa_engineer` → `google:gemini-2.0-flash` (free tier)
- `system_checker` → `anthropic:claude-haiku-4-5` (lightweight)

### Webhook Utils

`lib/amc/utils/webhook.ts`:
```typescript
generateWebhookSecret()                         // → 64-char hex secret
signWebhookPayload(body, secret)               // → HMAC-SHA256 hex
verifyWebhookSignature(body, sig, secret)      // → boolean (constant-time)
```

### Token Cost Utils

`lib/amc/utils/tokens.ts`:
```typescript
estimateCost('claude-opus-4-6', 10000, 2000)  // → USD cost
formatCost(0.00042)                            // → "$0.4200m"
COST_PER_MILLION                               // pricing table for 15+ models
```

### Supabase Query Functions

`lib/amc/db/queries.ts` — All DB operations:
- Projects: `listProjects`, `getProject`, `createProject`, `updateProject`, `deleteProject`
- Agents: `listAgents(projectId?)`, `getAgent`, `createAgent`, `updateAgent`, `deleteAgent`
- Stats: `getAgentStats(id)` → `{ totalRuns, successfulRuns, totalTokens, totalCostUsd, avgDurationMs }`

### API Routes

All under `/api/amc/`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/amc/projects` | List all projects |
| POST | `/api/amc/projects` | Create project (auto-generates webhook_secret) |
| GET | `/api/amc/projects/:id` | Get single project |
| PATCH | `/api/amc/projects/:id` | Update project |
| DELETE | `/api/amc/projects/:id` | Delete project |
| GET | `/api/amc/agents?project_id=` | List agents (optional filter) |
| POST | `/api/amc/agents` | Create agent |
| GET | `/api/amc/agents/:id` | Get agent |
| PATCH | `/api/amc/agents/:id` | Update agent |
| DELETE | `/api/amc/agents/:id` | Delete agent |
| GET | `/api/amc/agents/:id/stats` | Token/run stats for an agent |
| POST | `/api/amc/webhooks/events` | Receive events from amc-cli |

### Webhook Receiver

`POST /api/amc/webhooks/events` — How `amc-cli` talks to AMC:
1. Reads `X-AMC-Project-Id` header
2. Reads `X-AMC-Signature` header (HMAC-SHA256 of body)
3. Looks up project + webhook secret from DB
4. Verifies signature
5. Persists event to `mc_events` table

### UI

Accessible at `http://localhost:3000/amc` (no auth required in dev — see middleware note below):

- **`/amc`** — Overview: stat cards (projects, active runs, agents), recent projects list
- **`/amc/projects`** — All registered projects with clickable cards
- **`/amc/projects/:id`** — Project detail: CLI setup config, 7-agent pipeline list with provider:model badges

**Sidebar nav:** Overview, Projects, Kanban, Agents, Team, Memory, Docs (Kanban onwards are stubs for Phase 2+)

### Tests

30 tests, all passing:
```bash
npm run test:run
```

| File | Tests |
|------|-------|
| `lib/amc/utils/webhook.test.ts` | 9 |
| `lib/amc/utils/tokens.test.ts` | 8 |
| `lib/amc/llm/router.test.ts` | 7 |
| `app/api/amc/webhooks/events/route.test.ts` | 3 |
| `app/api/amc/projects/route.test.ts` | 3 |

---

## Key Design Decisions

### Why Vercel AI SDK?
One unified interface for all LLM providers. `generateText()` works the same whether you're calling Anthropic, OpenAI, Groq, or Ollama. No provider-specific SDK sprawl.

### Why `mc_` table prefix?
Namespaces all AMC tables. Evenzi will have its own `events`, `tasks`, `users` etc. — the prefix prevents any collision and makes AMC trivially extractable.

### Why is AMC inside Evenzi?
Cost and speed of iteration. Once AMC is stable (Phase 3+), extraction = copy `lib/amc/`, `app/(amc)/`, `app/api/amc/`, `components/amc/` + run the migration in a fresh project.

### Isolation rule (IMPORTANT)
AMC code **never imports Evenzi-specific code**. If you're writing AMC code, your imports must only come from:
- `lib/supabase/` (shared Supabase client)
- `lib/amc/` (AMC internal)
- `next/server`, `react`, npm packages

Violating this makes AMC non-extractable. PRs that break isolation will be rejected.

---

## Dev Notes

### Auth bypass for AMC (dev only)
`lib/supabase/middleware.ts` has `/amc` in the public paths list. This is intentional for local development — remove it before going to production or add proper session checks.

### No Mistral SDK yet
`AgentProvider` type includes `'mistral'` but `@ai-sdk/mistral` isn't installed. The router falls back to `claude-sonnet-4-6` for `mistral` provider agents. Install `@ai-sdk/mistral` when you need it.

### Ollama is local-only
Ollama works great on your machine but won't work on Vercel deployments. For cloud deployments, use Groq instead (free tier, similar open models).

### Dev server path
The repo uses git worktrees. Node/npm aren't in PATH by default:
```bash
# Use full paths
/usr/local/bin/npm run dev
/usr/local/bin/npx vitest run
```
Or the launch.json handles this automatically via the Preview tool.

---

## What's Next

Pick up from Phase 2. The spec is at `docs/superpowers/specs/2026-04-06-mission-control-design.md`.

### Phase 2: Interaction Layer
- [ ] Kanban board (`/amc/kanban`) — drag-and-drop with `@dnd-kit`
- [ ] Agents registry (`/amc/agents`) — list, config editor, model/prompt override per project
- [ ] Team pipeline visualization (`/amc/team`) — pipeline flow diagram

### Phase 3: Monitoring Layer
- [ ] Live run monitor — streaming webhook events via SSE or Supabase Realtime
- [ ] Memory timeline (`/amc/memory`) — browsable decision journal
- [ ] Docs/artifacts viewer (`/amc/docs`)
- [ ] Token usage alerts + budget enforcement
- [ ] Checkpoint approval UI (human-in-the-loop pause/resume)

### Phase 4: CLI
- [ ] `amc-cli` npm package
  - `npx amc-cli init` — register project, generate webhook secret
  - `npx amc-cli push-agents` — sync agent configs from `ai/agents/` to AMC
  - `npx amc-cli report` — push run results
  - `npx amc-cli tokens` — show usage/cost
  - `npx amc-cli approve` / `abort` — checkpoint control

---

## File Reference

```
lib/amc/
  types/index.ts          ← START HERE — understand all data shapes
  llm/router.ts           ← how agents call LLMs
  llm/defaults.ts         ← which model each role uses by default
  db/queries.ts           ← all DB operations
  db/migrations/          ← SQL files (already applied to Supabase)
  utils/webhook.ts        ← HMAC utils
  utils/tokens.ts         ← cost estimation

app/(amc)/
  layout.tsx              ← dark shell with sidebar
  amc/page.tsx            ← overview dashboard
  amc/projects/           ← projects list + detail pages

app/api/amc/
  projects/               ← projects CRUD
  agents/                 ← agents CRUD + stats
  webhooks/events/        ← event ingestion endpoint

components/amc/shared/
  sidebar-nav.tsx         ← left nav
  status-badge.tsx        ← coloured status pill

docs/superpowers/
  specs/2026-04-06-mission-control-design.md   ← full AMC design decisions
  plans/2026-04-06-amc-phase1-foundation.md    ← Phase 1 step-by-step plan
```

---

## Questions?

- **AMC design rationale** → `docs/superpowers/specs/2026-04-06-mission-control-design.md`
- **Phase 1 detailed plan** → `docs/superpowers/plans/2026-04-06-amc-phase1-foundation.md`
- **Open LLM setup** → see the "Open LLM Setup Guide" section at the top of the Phase 1 plan
