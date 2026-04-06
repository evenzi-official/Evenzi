# Agent Runner — Design Spec

**Date:** 2026-04-06
**Status:** Draft
**Branch:** TBD (will be created from `Dev-Vibe`)

---

## Overview

A lightweight local agent runner that chains multi-LLM agent outputs to automate feature development for Evenzi. Uses existing `ai/` folder for agent behavior definitions and `lib/llm/` for model routing. Triggered via npm script or ClickUp webhook.

The runner receives fully-formed input (feature description with requirements) and executes a pipeline of agents — no conversation phase in the runner itself. Conversation and requirements gathering happens upstream (in ClickUp or manually before invoking the npm script).

**Current goal:** Automate Evenzi feature development.
**Future goal:** Extract into a general-purpose pipeline runner (AMC).

---

## 1. Git Housekeeping

### 1.1 Park Full AMC on `Dev-AMC`

Create `Dev-AMC` branch from `Dev-Vibe` to preserve all AMC dashboard code:
- `app/(amc)/` — dashboard UI (layout, overview, projects pages)
- `app/api/amc/` — REST API routes (projects, agents, webhooks)
- `components/amc/` — sidebar nav, status badge
- `lib/amc/db/` — Supabase CRUD queries
- `lib/amc/utils/webhook.ts` + `webhook.test.ts` — HMAC webhook utilities
- `lib/amc/types/index.ts` — full AMC type definitions
- `docs/amc/` — collaborator onboarding guide

### 1.2 Clean `Dev-Vibe`

Remove AMC-specific code. Keep and relocate LLM infrastructure:

**Delete from `Dev-Vibe`:**
- `app/(amc)/` (entire route group)
- `app/api/amc/` (all API routes + tests)
- `components/amc/` (all components)
- `lib/amc/db/` (queries + migrations)
- `lib/amc/utils/webhook.ts` + `webhook.test.ts`
- `lib/amc/types/index.ts` (full version — replaced by slim version)
- `docs/amc/`

**Relocate (rename path, no code changes needed):**
- `lib/amc/llm/router.ts` → `lib/llm/router.ts`
- `lib/amc/llm/router.test.ts` → `lib/llm/router.test.ts`
- `lib/amc/llm/defaults.ts` → `lib/llm/defaults.ts`
- `lib/amc/utils/tokens.ts` → `lib/llm/tokens.ts`
- `lib/amc/utils/tokens.test.ts` → `lib/llm/tokens.test.ts`

**Update imports** in relocated files:
- `router.ts` imports `estimateCost` from `../utils/tokens` → `./tokens`
- `router.ts` imports types from `../types` → `./types`
- Create slim `lib/llm/types.ts` with only `AgentProvider` and `LLMResult` (extracted from the full AMC types)

### 1.3 Supabase Cleanup

Drop all 9 `mc_`-prefixed tables from the Supabase project (`smjkbmkxweevqpvygabe`):
- `mc_projects`
- `mc_agents`
- `mc_pipelines`
- `mc_runs`
- `mc_run_stages`
- `mc_tasks`
- `mc_artifacts`
- `mc_events`
- `mc_memory_entries`

Also drop associated indexes, triggers, and RLS policies.

The migration SQL for creating these tables is preserved in `Dev-AMC` at `lib/amc/db/migrations/001_amc_schema.sql`.

---

## 2. `ai/` Folder Cleanup

### 2.1 Remove

| Directory | Reason |
|-----------|--------|
| `ai/context/` | Static docs, already in CLAUDE.md |
| `ai/memory/` | Manual notes, not agent behavior |
| `ai/features/` | Feature specs come from ClickUp/templates, not part of runner |
| `ai/workflows/` | Human-oriented, overlaps with pipelines |
| `ai/prompts/` | Replaced by structured agent specs |
| `ai/handoffs/` | Replaced by pipeline step definitions |

### 2.2 Keep and Rewrite

**Final structure:**
```
ai/
  agents/          # 14 agent definitions with frontmatter
  pipelines/       # 4 pipeline definitions with step format
  system/          # 1 shared rules file
```

### 2.3 Agent File Format

Each agent file uses YAML frontmatter + markdown body:

```markdown
---
role: backend_engineer
name: Backend Engineer
provider: anthropic
model: claude-sonnet-4-6
token_budget: 4096
output_format: markdown
---

[System prompt as markdown — responsibilities, rules, output structure]
```

**Frontmatter fields:**
- `role` — matches key in `defaults.ts`, used by loader to wire up model
- `name` — human-readable display name
- `provider` — default provider (anthropic | openai | google | groq | ollama)
- `model` — default model ID
- `token_budget` — max output tokens for this agent
- `output_format` — `markdown` | `json` | `code`

**The markdown body** becomes the system prompt passed to `runAgentLLM()`. It should include the agent's responsibilities, rules, and expected output structure.

### 2.4 Agent Roster

| File | Role | Provider | Model |
|------|------|----------|-------|
| `system_checker.md` | system_checker | anthropic | claude-haiku-4-5 |
| `product_manager.md` | product_manager | anthropic | claude-opus-4-6 |
| `tech_lead.md` | tech_lead | anthropic | claude-opus-4-6 |
| `data_modeller.md` | data_modelling | anthropic | claude-sonnet-4-6 |
| `task_planner.md` | task_planner | openai | gpt-4o-mini |
| `task_distributor.md` | task_distributor | openai | gpt-4o-mini |
| `backend_engineer.md` | backend_engineer | anthropic | claude-sonnet-4-6 |
| `frontend_engineer.md` | frontend_engineer | anthropic | claude-sonnet-4-6 |
| `fullstack_engineer.md` | fullstack_engineer | anthropic | claude-sonnet-4-6 |
| `code_reviewer.md` | code_reviewer | anthropic | claude-opus-4-6 |
| `security_expert.md` | security_expert | anthropic | claude-opus-4-6 |
| `qa_engineer.md` | qa_engineer | google | gemini-2.0-flash |
| `devops_engineer.md` | devops_engineer | anthropic | claude-sonnet-4-6 |
| `token_monitor.md` | token_monitor | anthropic | claude-haiku-4-5 |

### 2.5 Pipeline File Format

```markdown
---
name: feature
description: Full feature development pipeline
priority_default: normal
---

## Steps

### 1. system_guard
agent: system_checker
input: env_check
gate: hard
description: Verify environment is ready

### 2. spec
agent: product_manager
input: user_request
description: Analyze requirements and produce feature specification

### 3. design
agent: tech_lead
input: user_request + step.spec
description: Convert spec into technical architecture
```

**Step fields:**
- `agent` — matches a `role` in `ai/agents/`
- `input` — what context the agent receives:
  - `user_request` — the original feature description
  - `env_check` — environment validation (special case for system guard)
  - `step.<name>` — output from a previous step
  - `+` — concatenation of multiple inputs
- `gate` (optional):
  - `hard` — pipeline aborts if step fails
  - `approval` — pause and wait for user confirmation before proceeding
- `description` — human-readable purpose of this step

### 2.6 Pipeline Definitions

**feature.md** — 9 steps:
1. `system_guard` (system_checker, gate: hard)
2. `spec` (product_manager)
3. `design` (tech_lead)
4. `plan` (task_planner)
5. `approve` (gate: approval)
6. `backend` (backend_engineer)
7. `frontend` (frontend_engineer)
8. `review` (code_reviewer)
9. `qa` (qa_engineer)

**bug.md** — 7 steps:
1. `system_guard` (system_checker, gate: hard)
2. `analysis` (tech_lead — root cause analysis)
3. `plan` (task_planner)
4. `approve` (gate: approval)
5. `fix` (fullstack_engineer)
6. `review` (code_reviewer)
7. `qa` (qa_engineer)

**enhancement.md** — 8 steps:
1. `system_guard` (system_checker, gate: hard)
2. `impact` (tech_lead — impact analysis)
3. `design` (tech_lead)
4. `plan` (task_planner)
5. `approve` (gate: approval)
6. `implement` (fullstack_engineer)
7. `review` (code_reviewer)
8. `qa` (qa_engineer)

**system_guard.md** — standalone, 1 step:
1. `check` (system_checker, gate: hard)

Used as an importable pre-check by other pipelines.

---

## 3. Runner Architecture

### 3.1 File Structure

```
lib/runner/
  executor.ts       # Pipeline orchestration — loads pipeline, iterates steps, chains outputs
  loader.ts         # Parses ai/agents/*.md and ai/pipelines/*.md into typed configs
  logger.ts         # Stdout progress + JSON run logs to .runner/runs/
  monitor.ts        # Token estimation, live tracking, budget enforcement
  notify.ts         # Email notifications (run summaries + budget alerts)
  clickup.ts        # Fetch ClickUp task details, post results back as comments
  types.ts          # RunConfig, StepResult, PipelineDefinition, AgentDefinition, etc.

scripts/
  run-agent.ts      # npm script entry point

app/api/runner/
  webhook/route.ts  # ClickUp webhook receiver
```

### 3.2 Core Types (`lib/runner/types.ts`)

```typescript
interface AgentDefinition {
  role: string
  name: string
  provider: AgentProvider
  model: string
  tokenBudget: number
  outputFormat: 'markdown' | 'json' | 'code'
  systemPrompt: string       // parsed from markdown body
}

interface PipelineStep {
  name: string
  agent: string              // role name, maps to AgentDefinition
  input: string[]            // ['user_request', 'step.spec', 'step.design']
  gate?: 'hard' | 'approval'
  description: string
}

interface PipelineDefinition {
  name: string
  description: string
  priorityDefault: BudgetTier
  steps: PipelineStep[]
}

interface StepResult {
  stepName: string
  agentRole: string
  model: string
  provider: string
  output: string
  inputTokens: number
  outputTokens: number
  estimatedCostUsd: number
  durationMs: number
  status: 'completed' | 'failed' | 'skipped'
  error?: string
}

type BudgetTier = 'low' | 'normal' | 'high' | 'urgent' | 'override'

interface RunConfig {
  pipeline: string           // pipeline name (feature, bug, enhancement)
  input: string              // feature description / requirements
  priority: BudgetTier       // defaults to 'normal'
  source: 'cli' | 'clickup'
  clickupTaskId?: string
  noBudgetLimit?: boolean    // override flag
}

interface RunLog {
  id: string                 // timestamp-based
  config: RunConfig
  steps: StepResult[]
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  totalDurationMs: number
  status: 'completed' | 'failed' | 'aborted' | 'budget_exceeded'
  startedAt: string
  completedAt: string
}
```

### 3.3 Executor (`lib/runner/executor.ts`)

Responsibilities:
1. Load pipeline definition via `loader.ts`
2. Load all referenced agent definitions via `loader.ts`
3. Run token monitor pre-estimation
4. Iterate steps in order:
   - Resolve `input` references (replace `step.<name>` with actual output from that step)
   - Look up agent definition by role
   - Call `runAgentLLM()` from `lib/llm/router.ts`
   - Record `StepResult` via `monitor.ts`
   - Check budget via `monitor.ts` — pause or abort if exceeded
   - Handle gates: `hard` → abort on failure, `approval` → pause for user input (CLI: stdin y/n prompt; ClickUp: post plan as comment, wait for task status change to "Approved")
5. After all steps: call `logger.ts` to write run log, call `notify.ts` to send email

**Context accumulation:** Each step receives the original user request + all previous step outputs. The executor builds a context string:

```
## Original Request
{user_request}

## Step 1: Spec (Product Manager)
{step.spec output}

## Step 2: Design (Tech Lead)
{step.design output}
```

This full context is passed as the `context` parameter to `runAgentLLM()`, while the step-specific input mapping determines the `userPrompt`.

### 3.4 Loader (`lib/runner/loader.ts`)

Parses markdown files with YAML frontmatter:

- **Agent loading:** Reads `ai/agents/<role>.md`, extracts frontmatter into `AgentDefinition`, markdown body becomes `systemPrompt`. Falls back to `defaults.ts` if frontmatter is missing provider/model.
- **Pipeline loading:** Reads `ai/pipelines/<name>.md`, parses step blocks using heading + field pattern (### N. name / agent: / input: / gate: / description:).

### 3.5 Logger (`lib/runner/logger.ts`)

**Stdout output** during execution:
```
[runner] Pipeline: feature | Priority: normal | Budget: $2.00
[runner] Step 1/9: system_guard (system_checker → claude-haiku-4-5)
[runner]   ✓ 142 tokens | $0.00 | 1.2s
[runner] Step 2/9: spec (product_manager → claude-opus-4-6)
[runner]   ✓ 3,847 tokens | $0.12 | 8.4s
[runner] Running total: $0.12 / $2.00
...
[runner] Complete: 9 steps | 24,531 tokens | $0.87 | 42.3s
[runner] Log saved: .runner/runs/2026-04-06T14-30-00.json
```

**JSON run log** written to `.runner/runs/<timestamp>.json` — full `RunLog` object.

### 3.6 Clickup Integration (`lib/runner/clickup.ts`)

**Fetching task data:**
- Uses ClickUp API to get task by ID: title, description, custom fields, comments, priority, tags
- Formats into a `RunConfig`:
  - `input` = task description + relevant comments
  - `priority` = mapped from ClickUp priority (urgent/high/normal/low)
  - `pipeline` = determined by task type tag (`feature`, `bug`, `enhancement`) or defaults to `feature`
  - `noBudgetLimit` = true if task has `budget-override` tag

**Posting results back:**
- After pipeline completes, posts a structured comment on the ClickUp task with:
  - Summary of what each agent produced
  - Token usage breakdown
  - Total cost
  - Links to generated files (if any)

**ClickUp API auth:**
- Uses `CLICKUP_API_TOKEN` env var (personal API token)
- Alternatively, configured via the ClickUp MCP connector already available in this environment

### 3.7 Webhook Route (`app/api/runner/webhook/route.ts`)

Receives ClickUp task webhooks:
- Validates webhook signature
- Extracts task ID from payload
- Calls `clickup.ts` to fetch full task data
- Calls `executor.ts` to run the pipeline
- Posts results back to ClickUp via `clickup.ts`

**Webhook triggers on:**
- Task moved to a specific status (e.g., "Ready for Agent")
- Task tagged with `run-agent`

---

## 4. Token Monitoring System

### 4.1 Budget Tiers

| Priority | Per-run budget | Per-step budget |
|----------|---------------|-----------------|
| low | $1.00 | $0.25 |
| normal (default) | $2.00 | $0.50 |
| high | $5.00 | $1.50 |
| urgent | $10.00 | $3.00 |
| override | unlimited | unlimited |

Default for all runs: `normal`.

### 4.2 Pre-execution Estimation (`monitor.ts`)

Before the pipeline runs:
1. Token Monitor agent (Haiku) analyzes the input + pipeline definition
2. Estimates tokens per step based on: input size, model context window, historical averages from past run logs
3. Calculates estimated total cost using `lib/llm/tokens.ts` pricing
4. If estimated cost > run budget:
   - **CLI:** Print warning, suggest splitting/reducing, prompt for confirmation
   - **ClickUp:** Post comment with estimate + suggestion, set task status to "Budget Review"

### 4.3 Live Tracking (`monitor.ts`)

After each step:
1. Record actual tokens + cost
2. Compare actual vs. estimated for this step
3. Update running total
4. **Step budget check:** If step cost > per-step budget → alert (email if configured), pause execution, ask to continue or abort
5. **Run budget check:** If cumulative cost > per-run budget → hard stop (unless `noBudgetLimit`)

### 4.4 Alert Thresholds with Override

When `noBudgetLimit` is true or priority is `override`:
- Execution never pauses or stops for budget reasons
- Still tracks everything
- Sends alert email at tier crossings: $2, $5, $10, $20
- Final report includes a "budget would have been exceeded" note

### 4.5 Email Notifications (`notify.ts`)

| Event | Email content |
|-------|--------------|
| Run completes | Pipeline name, total tokens, cost per step, cost per provider, total cost, duration |
| Step exceeds budget | Which step, which agent/model, actual vs budget, option to abort |
| Run exceeds budget | Cumulative total, where it stopped, suggestion to split |
| Tier crossing (override mode) | Current spend, which tier crossed |

**Configuration (env vars):**
```
RUNNER_BUDGET_PER_RUN=2.00
RUNNER_BUDGET_PER_STEP=0.50
RUNNER_ALERT_EMAIL=user@example.com
RUNNER_EMAIL_ON_COMPLETE=true
RUNNER_EMAIL_ON_ALERT=true
RUNNER_EMAIL_PROVIDER=resend          # resend | smtp
RESEND_API_KEY=re_xxxx                # if using Resend
```

---

## 5. Entry Points

### 5.1 npm Script (`scripts/run-agent.ts`)

**Usage:**
```bash
# Run with a feature template
npm run agent -- --pipeline feature --input "Build event invitations system with RSVP tracking"

# Run from a template file
npm run agent -- --pipeline feature --file ./features/invitations.md

# Run from ClickUp task
npm run agent -- --clickup TASK_ID

# Override budget
npm run agent -- --pipeline feature --input "..." --no-budget-limit

# Set priority
npm run agent -- --pipeline feature --input "..." --priority high
```

**Defaults:**
- `--pipeline`: feature
- `--priority`: normal
- `--no-budget-limit`: false

### 5.2 ClickUp Webhook (`app/api/runner/webhook/route.ts`)

**Setup:**
1. Configure ClickUp webhook to POST to `https://<domain>/api/runner/webhook`
2. Set `CLICKUP_WEBHOOK_SECRET` env var for signature validation
3. Configure trigger: task status changed to "Ready for Agent" or tag `run-agent` added

**Payload processing:**
1. Validate signature
2. Extract task ID
3. Fetch full task via ClickUp API
4. Map to `RunConfig`
5. Execute pipeline
6. Post results to task as comment

---

## 6. Environment Variables

### Required
```bash
# At least one LLM provider
ANTHROPIC_API_KEY=sk-ant-xxxx

# Runner config
RUNNER_ALERT_EMAIL=user@example.com
```

### Optional LLM Providers
```bash
OPENAI_API_KEY=sk-proj-xxxx
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxx
GROQ_API_KEY=gsk_xxxx
OLLAMA_BASE_URL=http://localhost:11434/api
```

### Optional Runner Config
```bash
RUNNER_BUDGET_PER_RUN=2.00            # default: 2.00
RUNNER_BUDGET_PER_STEP=0.50           # default: 0.50
RUNNER_EMAIL_ON_COMPLETE=true         # default: true
RUNNER_EMAIL_ON_ALERT=true            # default: true
RUNNER_EMAIL_PROVIDER=resend          # default: resend
RESEND_API_KEY=re_xxxx                # required if email enabled
```

### ClickUp Integration
```bash
CLICKUP_API_TOKEN=pk_xxxx             # personal API token
CLICKUP_WEBHOOK_SECRET=xxxx           # webhook signature validation
```

---

## 7. File Tree Summary

After all cleanup and new code:

```
ai/
  agents/                    # 14 agent definitions (frontmatter + system prompt)
    system_checker.md
    product_manager.md
    tech_lead.md
    data_modeller.md
    task_planner.md
    task_distributor.md
    backend_engineer.md
    frontend_engineer.md
    fullstack_engineer.md
    code_reviewer.md
    security_expert.md
    qa_engineer.md
    devops_engineer.md
    token_monitor.md
    intake_agent.md
  pipelines/                 # 4 pipeline definitions (step format)
    feature.md
    bug.md
    enhancement.md
    system_guard.md
  system/
    agent_rules.md           # shared base prompt for all agents

lib/llm/                     # relocated from lib/amc/llm/
  router.ts                  # multi-provider model routing (Vercel AI SDK)
  router.test.ts
  defaults.ts                # role → provider/model mapping
  tokens.ts                  # cost estimation for 15+ models
  tokens.test.ts
  types.ts                   # AgentProvider, LLMResult (slim)

lib/runner/                  # NEW — pipeline runner
  executor.ts                # pipeline orchestration + step chaining
  loader.ts                  # parse agent/pipeline markdown into typed configs
  logger.ts                  # stdout progress + JSON run logs
  monitor.ts                 # token estimation, live tracking, budget enforcement
  notify.ts                  # email notifications
  clickup.ts                 # ClickUp task fetch + result posting
  intake.ts                  # Conversational intake loop + task creation
  types.ts                   # RunConfig, StepResult, PipelineDefinition, etc.

scripts/
  run-agent.ts               # Pipeline runner entry point
  run-intake.ts              # Intake conversation entry point

app/api/runner/
  webhook/route.ts           # ClickUp webhook receiver

.runner/
  runs/                      # JSON run logs (gitignored)
```

---

## 8. Intake Skill — Conversational Task Creation

90% of tasks will be created via this automated flow. The user describes what they want, an intake agent asks questions, and a fully-formed ClickUp task is created — which then triggers the runner pipeline.

### 8.1 Full Automated Flow

```
User: "I need an invitations system with RSVP tracking"
  → Intake skill activates (conversational)
  → Product Manager agent asks clarifying questions one at a time:
     - What's the scope? (invite via email, SMS, link?)
     - What RSVP states? (yes, no, maybe, plus-one?)
     - Any deadline/expiry on invitations?
     - Which existing pages does this connect to?
  → User answers each question
  → Agent summarizes requirements + proposes pipeline type (feature/bug/enhancement)
  → User confirms
  → Agent creates ClickUp task with:
     - Structured title
     - Full requirements in description
     - Pipeline type tag (feature/bug/enhancement)
     - Priority from conversation context
     - Status: "Ready for Agent"
  → ClickUp webhook fires
  → Runner picks up and executes the pipeline
```

### 8.2 Intake Agent

A new agent added to the roster:

| File | Role | Provider | Model |
|------|------|----------|-------|
| `intake_agent.md` | intake_agent | anthropic | claude-sonnet-4-6 |

The intake agent uses the Product Manager's domain knowledge but is specifically tuned for:
- Asking one question at a time (not overwhelming)
- Knowing when it has enough info to create a task (not over-asking)
- Structuring the output as a ClickUp-ready task payload
- Suggesting the right pipeline type based on what the user described

### 8.3 Skill Trigger

Invoked as an npm script or could be wired as a Claude Code skill:

```bash
# Start intake conversation
npm run agent:intake

# Start with initial idea
npm run agent:intake -- "Add invitations system with RSVP tracking"
```

The skill:
1. Loads the intake agent definition from `ai/agents/intake_agent.md`
2. Runs a conversational loop (stdin/stdout):
   - Agent asks a question → user answers → agent asks next question
   - Agent decides when it has enough info (typically 3-6 questions)
3. Presents a summary for user confirmation
4. Creates the ClickUp task via `lib/runner/clickup.ts`
5. Optionally triggers the runner immediately (or lets the webhook handle it)

### 8.4 Intake Output → ClickUp Task

The intake agent produces a structured payload:

```typescript
interface IntakeResult {
  title: string              // e.g., "Event Invitations with RSVP Tracking"
  description: string        // full requirements markdown
  pipeline: string           // feature | bug | enhancement
  priority: BudgetTier       // inferred from conversation
  tags: string[]             // e.g., ['feature', 'run-agent']
  acceptanceCriteria: string[] // bullet points of "done when..."
}
```

This maps directly to a ClickUp task creation call. The description includes all gathered requirements in a structured format the runner's PM/Tech Lead agents can consume.

### 8.5 Manual Override

For the 10% of tasks created manually, the flow is unchanged:
- Create task in ClickUp yourself
- Add requirements to description
- Tag with pipeline type + `run-agent`
- Move to "Ready for Agent" status

### 8.6 Updated File Structure

```
lib/runner/
  ...existing files...
  intake.ts          # Conversational intake loop + ClickUp task creation

scripts/
  run-agent.ts       # Pipeline runner entry point
  run-intake.ts      # Intake conversation entry point

ai/agents/
  ...existing 14 agents...
  intake_agent.md    # Intake conversation agent definition
```

---

## 9. Future: AMC General-Purpose Extraction

When Evenzi reaches a stable state, the path to general-purpose AMC:

1. Lift `lib/runner/` + `lib/llm/` + `ai/` into a standalone package
2. Merge `Dev-AMC` branch to add back the dashboard UI, API routes, and Supabase persistence
3. Replace local JSON logs with Supabase-backed run history
4. Add web UI for run monitoring, agent config editing, pipeline visualization
5. Publish as `amc-cli` npm package

The runner is designed for this extraction — it has no Evenzi-specific imports, only reads from `ai/` (portable) and `lib/llm/` (portable).
