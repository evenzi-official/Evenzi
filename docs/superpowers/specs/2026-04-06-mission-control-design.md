# Agentic Mission Control (AMC) v1 — Design Specification

**Date:** 2026-04-06
**Status:** Draft
**Scope:** Modular agent orchestration & monitoring platform (inside Evenzi repo, extractable later)

---

## 1. Overview

Agentic Mission Control (AMC) is a modular web application for monitoring and managing AI agent workflows. It lives inside the Evenzi repo at `app/(amc)/` as a self-contained module with its own DB tables, API routes, and UI — but is architected so it can be extracted into its own repo with minimal effort.

### Goals

- Provide a centralized dashboard for managing AI agent pipelines across multiple projects
- Track agent execution, token usage, artifacts, and task progress in real-time
- Be fully modular — all AMC code lives under dedicated directories with no hard dependencies on Evenzi-specific code
- Support the 13-stage agent pipeline (System Checker through DevOps Engineer) and custom pipelines
- Extractable: can be moved to its own repo by copying the module directories + running DB migrations

### Non-Goals (v1)

- Calendar module (v2)
- Factory module (v2)
- Built-in code execution or sandboxing — agents run externally, AMC monitors them
- Multi-tenant user management — v1 is single-user with Supabase Auth (email/password), team support is v2

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18 + Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Deployment | Vercel |
| CLI Tool | Node.js (npm package) |
| **Multi-LLM** | **Vercel AI SDK (`ai` package)** |

### Multi-LLM Support

AMC uses the **Vercel AI SDK** to support any LLM provider. Each agent has a configurable `model_id` field — the pipeline router picks the right model based on task weight and cost. Heavy reasoning tasks use Claude Opus; simple tasks use cheaper/faster models.

**Supported providers out-of-the-box:**

| Provider | Package | Good for |
|----------|---------|----------|
| Anthropic (Claude) | `@ai-sdk/anthropic` | Complex reasoning, code review, security |
| OpenAI (GPT) | `@ai-sdk/openai` | Task routing, classification, simple generation |
| Google (Gemini) | `@ai-sdk/google` | Fast summarisation, QA test generation |
| Mistral | `@ai-sdk/mistral` | Cost-efficient code generation |
| Groq | `@ai-sdk/groq` | Ultra-fast inference for lightweight agents |
| Ollama (local) | `ollama-ai-provider` | Offline/private tasks, no API cost |

**Default model routing per pipeline stage:**

| Agent | Default Model | Rationale |
|-------|--------------|-----------|
| System Checker | `claude-haiku-4-5` | Fast env checks, no deep reasoning needed |
| Product Manager | `claude-opus-4-6` | Deep spec writing, requirement analysis |
| Tech Lead | `claude-opus-4-6` | Architecture decisions, critical thinking |
| Data Modelling | `claude-sonnet-4-6` | Structured schema generation |
| Task Planner | `gpt-4o-mini` | Simple list/task generation, very cheap |
| Task Distributor | `gpt-4o-mini` | Routing logic, no creativity needed |
| Backend Engineer | `claude-sonnet-4-6` | Code generation with context |
| Frontend Engineer | `claude-sonnet-4-6` | Code generation with context |
| Fullstack Engineer | `claude-sonnet-4-6` | Code generation with context |
| Code Reviewer | `claude-opus-4-6` | Deep multi-file analysis |
| Security Expert | `claude-opus-4-6` | Critical vulnerability analysis |
| QA Engineer | `gemini-2.0-flash` | Fast test case generation |
| DevOps Engineer | `claude-sonnet-4-6` | Config and script generation |
| Token Monitor | `claude-haiku-4-5` | Lightweight, runs constantly |

All model assignments are overridable per-project in the AMC dashboard — the defaults are cost-optimised starting points, not rules.

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────┐
│        AGENTIC MISSION CONTROL (Next.js Module)       │
│                                                       │
│  ┌─────────┬──────────┬────────┬─────────┬─────────┐ │
│  │ Kanban  │  Agents  │  Team  │ Memory  │  Docs   │ │
│  └────┬────┴────┬─────┴───┬────┴────┬────┴────┬────┘ │
│       └─────────┴─────────┴─────────┴─────────┘      │
│                    Supabase PostgreSQL                 │
│                    Next.js API Routes (/api/amc/*)     │
└────────────────────────┬─────────────────────────────┘
                         │ REST API + webhooks
            ┌────────────┼────────────┐
            ▼            ▼            ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Project A│ │ Project B│ │ Project C│
      │ amc-cli  │ │ amc-cli  │ │ amc-cli  │
      └──────────┘ └──────────┘ └──────────┘
```

### Core Concepts

- **Projects** — registered repositories that AMC tracks
- **Agents** — defined roles that execute pipeline stages (global or project-specific)
- **Pipelines** — ordered sequences of agent stages
- **Runs** — individual pipeline executions (e.g., "implement budgeting feature")
- **Run Stages** — each agent's execution within a run
- **Tasks** — work items generated by the pipeline or created manually
- **Artifacts** — documents and code produced by agents during runs
- **Events** — real-time activity stream from CLI plugins via webhook
- **Memory Entries** — journal records of decisions, observations, and milestones

### Integration Model

Projects connect to AMC via a CLI plugin (`amc-cli`). The CLI:

1. Registers the project with AMC (generates a webhook secret)
2. Sends events to AMC's webhook API during agent execution
3. Syncs agent configuration bidirectionally (local `ai/agents/` files <-> AMC DB)

Communication is one-way push (CLI -> AMC) for events, and bidirectional for agent config sync.

---

## 4. Modules

### 4.1 Kanban Board

A project-aware task management board with drag-and-drop.

**Features:**
- Configurable columns per project (default: Backlog, In Progress, Review, Done)
- Cards represent tasks — either pipeline-generated or manually created
- Card metadata: assigned agent, status, priority, linked artifacts, token cost
- Filters: by project, agent, status, date range, priority
- Cross-project view: see tasks from all projects on one board
- Drag-and-drop to update task status

**UI Structure:**
- Project selector dropdown at top
- Column headers with task counts
- Task cards showing: title, agent badge, priority indicator, token cost
- Card click opens detail panel with full description, artifacts, history

### 4.2 Agents

Live monitoring, configuration, and execution history for all agents.

**Sub-views:**

**Registry:** List of all defined agent roles
- Global agents (available to all projects) vs project-specific agents
- Shows: name, role, pipeline position, total runs, avg token usage
- Create/edit/delete agent definitions

**Config Editor:** Visual editor for each agent
- Prompt text editor with syntax highlighting
- Role description, capabilities (as checkboxes/tags)
- Pipeline position (drag to reorder)
- Token budget limit per execution
- Changes synced to project's `ai/agents/` via CLI

**Live Monitor:** Real-time view during pipeline execution
- Shows which agent is currently active (highlighted in pipeline visualization)
- Streaming output from the active agent
- Progress indicator (stage X of Y)
- Pause/resume/abort controls at checkpoint stages
- Token usage meter (current run vs budget)

**Execution History:** Full audit trail
- Table view: date, agent, run, tokens, duration, status
- Click to expand: full input, output, errors
- Token usage charts (daily, weekly, per-agent)
- Alert configuration: set thresholds for token usage per agent or per run

### 4.3 Team

Visual representation of agent hierarchy and pipeline structure.

**Features:**
- Org chart / tree view showing pipeline flow
- Sub-agent mapping: if an agent spawns sub-agents, show nested hierarchy
- Role cards: click any agent node to see config, recent runs, stats
- Pipeline builder: drag-and-drop to create or modify pipeline stage order
- Support multiple named pipelines (feature, bug, enhancement, custom)
- Visual indicators: green (idle), blue (running), red (failed), yellow (paused)

### 4.4 Memory

Chronological journal of all agent activity across projects.

**Features:**
- Timeline view: scrollable feed of all events, newest first
- Per-project filter: show only one project's history
- Entry types: decision, observation, error, milestone, artifact_created
- Decision log: extracted key decisions made by PM, Tech Lead, etc.
- Full-text search across all memory entries
- Auto-tagging: by agent, project, run, entry type
- Manual annotations: add notes to any memory entry
- Export: download memory as markdown or JSON

### 4.5 Docs

Document management for all artifacts produced by the pipeline.

**Features:**
- Tree navigation: Project -> Run -> Stage -> Artifacts
- Artifact types: PM spec, tech design, task plan, data model, code review, QA report, security audit
- Inline markdown preview with syntax highlighting for code blocks
- Version history: track changes to artifacts across pipeline iterations
- Linked context: each doc shows which agent created it, which run, which task
- Search: full-text search across all artifacts
- Download: export individual artifacts or full run documentation bundle

---

## 5. Data Model

### 5.1 Tables

```sql
-- All AMC tables prefixed with mc_ for namespace isolation

-- Projects registered with AMC
CREATE TABLE mc_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  repo_url TEXT,
  description TEXT,
  webhook_secret TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agent role definitions (global or project-specific)
CREATE TABLE mc_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  prompt TEXT,
  capabilities JSONB DEFAULT '[]',
  pipeline_order INTEGER,
  token_budget INTEGER,
  -- Multi-LLM support: each agent can use a different model/provider
  provider TEXT DEFAULT 'anthropic'
    CHECK (provider IN ('anthropic', 'openai', 'google', 'mistral', 'groq', 'ollama', 'custom')),
  model_id TEXT DEFAULT 'claude-sonnet-4-6', -- Vercel AI SDK model string
  project_id UUID REFERENCES mc_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Named pipeline configurations
CREATE TABLE mc_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stages JSONB NOT NULL, -- ordered array of {agent_id, config}
  project_id UUID REFERENCES mc_projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pipeline execution runs
CREATE TABLE mc_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES mc_pipelines(id),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  trigger_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'aborted')),
  current_stage INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  checkpoint_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual agent execution within a run
CREATE TABLE mc_run_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES mc_runs(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES mc_agents(id),
  stage_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
  input JSONB,
  output JSONB,
  tokens_used INTEGER DEFAULT 0,
  -- Track exactly which model/provider was used for this execution
  provider TEXT,
  model_id TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost_usd NUMERIC(10, 6) DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Kanban tasks
CREATE TABLE mc_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog'
    CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  assigned_agent_id UUID REFERENCES mc_agents(id),
  priority TEXT DEFAULT 'normal'
    CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Documents/artifacts produced by agents
CREATE TABLE mc_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_stage_id UUID REFERENCES mc_run_stages(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL
    CHECK (type IN ('spec', 'design', 'plan', 'data_model', 'code', 'review', 'qa_report', 'security_audit', 'other')),
  title TEXT NOT NULL,
  content TEXT,
  metadata JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Real-time event stream from CLI
CREATE TABLE mc_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES mc_agents(id),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Journal/memory entries
CREATE TABLE mc_memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES mc_projects(id) ON DELETE CASCADE,
  run_id UUID REFERENCES mc_runs(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES mc_agents(id),
  type TEXT NOT NULL
    CHECK (type IN ('decision', 'observation', 'error', 'milestone', 'note')),
  title TEXT NOT NULL,
  content TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.2 Row Level Security

All tables will have RLS enabled. For v1 (single-user/small team), policies will be based on Supabase auth user. Multi-tenant support will be added in v2 if needed.

### 5.3 Indexes

```sql
CREATE INDEX idx_mc_events_project_created ON mc_events(project_id, created_at DESC);
CREATE INDEX idx_mc_events_run ON mc_events(run_id);
CREATE INDEX idx_mc_run_stages_run ON mc_run_stages(run_id);
CREATE INDEX idx_mc_tasks_project_status ON mc_tasks(project_id, status);
CREATE INDEX idx_mc_artifacts_project ON mc_artifacts(project_id);
CREATE INDEX idx_mc_artifacts_run_stage ON mc_artifacts(run_stage_id);
CREATE INDEX idx_mc_memory_project_created ON mc_memory_entries(project_id, created_at DESC);
CREATE INDEX idx_mc_memory_tags ON mc_memory_entries USING GIN(tags);
CREATE INDEX idx_mc_agents_project ON mc_agents(project_id);
```

---

## 6. CLI Plugin (`amc-cli`)

### 6.1 Overview

`amc-cli` is a lightweight Node.js npm package installed in consumer projects. It handles project registration, agent sync, and event reporting.

### 6.2 Commands

```bash
# Setup
npx amc-cli init                   # Register project with AMC
                                   # Prompts for AMC URL, generates webhook secret
                                   # Creates .amc-config.json in project root

# Agent Management
npx amc-cli push-agents            # Upload local ai/agents/ files to AMC
npx amc-cli pull-agents            # Download agent configs from AMC to local
npx amc-cli list-agents            # Show all agents registered for this project

# Pipeline Operations
npx amc-cli run <pipeline-name>    # Trigger a pipeline run
npx amc-cli status                 # Show current run status
npx amc-cli approve                # Approve a checkpoint pause
npx amc-cli abort                  # Abort current run

# Reporting
npx amc-cli report <event-type>    # Manually send an event to AMC
npx amc-cli tokens                 # Show token usage summary for this project
```

### 6.3 Configuration File

Created by `amc-cli init` at `.amc-config.json`:

```json
{
  "amcUrl": "https://your-app.vercel.app",
  "projectId": "uuid-here",
  "webhookSecret": "generated-secret",
  "agentsDir": "ai/agents",
  "autoReport": true
}
```

### 6.4 Event Types

Events sent via POST to `/api/amc/webhooks/events`:

| Event | Payload |
|-------|---------|
| `agent.started` | `{ runId, agentId, stageOrder, input }` |
| `agent.progress` | `{ runId, agentId, message, tokensUsed }` |
| `agent.completed` | `{ runId, agentId, output, tokensUsed, durationMs }` |
| `agent.failed` | `{ runId, agentId, error, tokensUsed }` |
| `artifact.created` | `{ runId, agentId, type, title, content }` |
| `task.created` | `{ runId, title, description, priority, assignedAgentId }` |
| `task.updated` | `{ taskId, status, metadata }` |
| `run.started` | `{ runId, pipelineId, trigger }` |
| `run.checkpoint` | `{ runId, stageOrder, checkpointData }` |
| `run.completed` | `{ runId, totalTokens }` |
| `run.failed` | `{ runId, error }` |
| `token.usage` | `{ runId, agentId, inputTokens, outputTokens, totalTokens }` |
| `memory.created` | `{ type, title, content, tags }` |

### 6.5 Authentication

Each webhook request includes:
- `X-AMC-Project-Id` header: the project UUID
- `X-AMC-Signature` header: HMAC-SHA256 of request body using webhook secret

---

## 7. API Routes

### 7.1 Project Management

```
POST   /api/amc/projects                # Register a new project
GET    /api/amc/projects                # List all projects
GET    /api/amc/projects/:id            # Get project details with stats
PATCH  /api/amc/projects/:id            # Update project settings
DELETE /api/amc/projects/:id            # Remove a project
```

### 7.2 Webhook Receiver

```
POST   /api/amc/webhooks/events         # Receive events from CLI
                                        # Validates signature, routes to handlers
```

### 7.3 Agent Management

```
GET    /api/amc/agents                  # List agents (filter: ?project_id=)
POST   /api/amc/agents                  # Create agent definition
GET    /api/amc/agents/:id              # Get agent details
PATCH  /api/amc/agents/:id              # Update agent config
DELETE /api/amc/agents/:id              # Delete agent
GET    /api/amc/agents/:id/history      # Agent execution history
GET    /api/amc/agents/:id/stats        # Token usage, avg duration, success rate
```

### 7.4 Pipeline & Run Management

```
GET    /api/amc/pipelines               # List pipelines
POST   /api/amc/pipelines               # Create pipeline
PATCH  /api/amc/pipelines/:id           # Update pipeline stages

POST   /api/amc/runs                    # Create/start a pipeline run
GET    /api/amc/runs                    # List runs (filter: ?project_id=, ?status=)
GET    /api/amc/runs/:id                # Get run details + all stages
PATCH  /api/amc/runs/:id/checkpoint     # Approve or reject a checkpoint
POST   /api/amc/runs/:id/abort          # Abort a running pipeline
```

### 7.5 Tasks (Kanban)

```
GET    /api/amc/tasks                   # List tasks (filter: ?project_id=, ?status=)
POST   /api/amc/tasks                   # Create task manually
PATCH  /api/amc/tasks/:id              # Update task (status, assignment, priority)
DELETE /api/amc/tasks/:id              # Delete task
```

### 7.6 Artifacts & Memory

```
GET    /api/amc/artifacts               # List artifacts (filter: ?project_id=, ?run_id=)
GET    /api/amc/artifacts/:id           # Get artifact content
GET    /api/amc/memory                  # Query memory entries (filter, search, tags)
POST   /api/amc/memory                  # Create manual memory entry
```

---

## 8. Project Structure (Modular Inside Evenzi)

AMC is fully self-contained under dedicated directories:

```
lib/amc/                         # All AMC business logic (extractable core)
  types/
    index.ts                     # All AMC TypeScript types/interfaces
  db/
    queries.ts                   # All Supabase query functions
    migrations/                  # SQL migration files for AMC tables
  utils/
    webhook.ts                   # Webhook signature validation
    tokens.ts                    # Token usage calculations
  hooks/
    use-kanban.ts                # Client hooks for kanban state
    use-agents.ts                # Client hooks for agent data
    use-runs.ts                  # Client hooks for run monitoring

app/(amc)/                       # AMC route group (no URL prefix impact)
  layout.tsx                     # AMC-specific layout with sidebar nav
  amc/                           # URL prefix: /amc/*
    page.tsx                     # Dashboard overview
    projects/
      page.tsx                   # Project list
      [id]/
        page.tsx                 # Project detail
    kanban/
      page.tsx                   # Kanban board
    agents/
      page.tsx                   # Agent registry
      [id]/
        page.tsx                 # Agent detail + config editor
    team/
      page.tsx                   # Pipeline viz + org chart
    memory/
      page.tsx                   # Timeline/journal
    docs/
      page.tsx                   # Artifact browser
      [id]/
        page.tsx                 # Artifact view
    runs/
      [id]/
        page.tsx                 # Run detail + live monitor

app/api/amc/                     # AMC API routes (prefixed /api/amc/*)
  projects/                      # Project CRUD
  webhooks/events/               # Webhook receiver
  agents/                        # Agent CRUD + history
  pipelines/                     # Pipeline CRUD
  runs/                          # Run management
  tasks/                         # Task CRUD
  artifacts/                     # Artifact queries
  memory/                        # Memory queries

components/amc/                  # AMC-specific UI components
  kanban/
    board.tsx
    column.tsx
    card.tsx
  agents/
    agent-card.tsx
    config-editor.tsx
    live-monitor.tsx
    token-chart.tsx
  team/
    pipeline-graph.tsx
    agent-node.tsx
  memory/
    timeline.tsx
    entry-card.tsx
  docs/
    doc-tree.tsx
    artifact-viewer.tsx
  shared/
    project-selector.tsx
    status-badge.tsx
    sidebar-nav.tsx
```

### Extraction Strategy

To extract AMC into its own repo later:
1. Copy `lib/amc/`, `app/(amc)/`, `app/api/amc/`, `components/amc/`
2. Run the SQL migrations from `lib/amc/db/migrations/`
3. Update import paths (only `lib/supabase/` needs replacing with its own Supabase client)
4. The only shared dependency is Supabase client creation — everything else is self-contained

### Isolation Rules
- AMC code NEVER imports from Evenzi-specific directories (`app/home/`, `app/auth/`, etc.)
- AMC uses its own types defined in `lib/amc/types/`
- AMC tables are prefixed with `mc_` to avoid conflicts (e.g., `mc_projects`, `mc_agents`)
- The Supabase client is the only shared utility (imported from `lib/supabase/`)

---

## 9. Token Monitoring

Built into the Agents module, not a separate module.

**Per-execution tracking:**
- Every `run_stages` record stores `tokens_used`
- Every `runs` record accumulates `total_tokens`
- Events include `token.usage` with input/output breakdown

**Alert system:**
- Each agent has an optional `token_budget` field
- When a stage exceeds its agent's budget, AMC flags the event
- Dashboard shows: daily token usage chart, per-agent breakdown, cost estimates
- Configurable alert thresholds at project and agent level

---

## 10. Human-in-the-Loop Checkpoints

Pipeline runs pause at configured checkpoint stages for human approval.

**Default checkpoints (3):**
1. After Product Manager (approve the spec before architecture)
2. After Tech Lead (approve the design before task breakdown)
3. After Code Reviewer (approve before security/QA/deploy)

**Checkpoint flow:**
1. Agent completes its stage
2. CLI sends `run.checkpoint` event
3. AMC sets run status to `paused`
4. Dashboard shows notification with "Approve" / "Reject" / "Revise" buttons
5. User reviews the stage output (artifact) and decides
6. On approve: run continues to next stage
7. On reject: run status set to `failed` with reason
8. On revise: stage re-runs with user's feedback appended to input

---

## 11. Implementation Priority

### Phase 1: Foundation
1. Project setup (Next.js, Supabase, Tailwind)
2. Install Vercel AI SDK + provider packages (`ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`)
3. Build `lib/amc/llm/router.ts` — model router that maps agent → provider/model
4. Database schema (all tables including `provider`/`model_id` fields, RLS, indexes)
5. Auth (Supabase Auth — email/password for v1)
6. API routes: projects, agents (CRUD)
7. Webhook receiver with signature validation
8. CLI plugin: init, push-agents, pull-agents

### Phase 2: Core Modules
7. Kanban board UI (drag-and-drop, filters)
8. Agent registry + config editor UI
9. Pipeline visualization (Team module)
10. API routes: runs, tasks, artifacts, memory

### Phase 3: Live Features
11. Live run monitor (streaming agent output)
12. Memory timeline UI
13. Docs browser UI
14. Token usage dashboard + alerts
15. Checkpoint approval UI

### Phase 4: Polish
16. Cross-project dashboard (overview stats)
17. Search across all modules
18. Export/download capabilities
19. Mobile responsiveness
20. CLI: run, status, approve, abort commands
