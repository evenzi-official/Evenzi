# Evenzi — Developer Onboarding

Welcome to Evenzi! This guide gets you from zero to running the agent pipeline in under 10 minutes.

---

## 1. Prerequisites

- **Node.js** v20+ (we use v23.11)
- **npm** (comes with Node)
- **Git**
- A **Supabase** account (free tier works)
- At least one **LLM API key** (Anthropic recommended)

---

## 2. Clone & Install

```bash
git clone https://github.com/evenzi-official/Evenzi.git
cd Evenzi
git checkout Dev-Vibe
npm install
```

---

## 3. Environment Setup

Copy the example and fill in your keys:

```bash
cp .env.example .env.local   # if .env.example exists, otherwise create .env.local
```

**Minimum required:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://smjkbmkxweevqpvygabe.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>

# At least one LLM provider
ANTHROPIC_API_KEY=sk-ant-xxxx
```

**For full runner functionality (optional):**
```bash
# Additional LLM providers (used by specific agents)
OPENAI_API_KEY=sk-proj-xxxx             # task_planner, task_distributor
GOOGLE_GENERATIVE_AI_API_KEY=AIzaxxxx   # qa_engineer

# ClickUp integration
CLICKUP_API_TOKEN=pk_xxxx
CLICKUP_WEBHOOK_SECRET=<your-secret>
CLICKUP_DEFAULT_LIST_ID=<list-id>
RUNNER_CLICKUP_ASSIGNEE_ID=<user-id>

# Email notifications
RESEND_API_KEY=re_xxxx
RUNNER_ALERT_EMAIL=you@example.com
RUNNER_EMAIL_ON_COMPLETE=true
RUNNER_EMAIL_ON_ALERT=true
```

---

## 4. Verify Setup

```bash
# Run the real environment check (no LLM cost)
npm run sys-check

# Run the test suite
npm run test:run

# Start the dev server
npm run dev
# Visit http://localhost:3000
```

`sys-check` validates Supabase connectivity, LLM API keys, ClickUp token, node_modules, and optional services (Ollama, Resend). Fix any required checks before running pipelines.

Expected: sys-check PASS, 55 tests passing, dev server on port 3000.

---

## 5. Project Architecture

```
Evenzi/
├── app/                  # Next.js pages + API routes
├── ai/                   # Agent & pipeline definitions (markdown)
│   ├── agents/           # 15 agent role specs
│   ├── pipelines/        # 4 pipeline configs (feature, bug, enhancement, system_guard)
│   └── system/           # Shared base prompt
├── lib/
│   ├── supabase/         # Supabase client helpers
│   ├── llm/              # Multi-provider LLM router
│   └── runner/           # Pipeline executor, loader, monitor, etc.
├── scripts/              # CLI entry points (run-agent.ts, run-intake.ts, run-sys-check.ts)
└── docs/                 # Specs, plans, this file
```

---

## 6. Using the Agent Runner

The runner chains multiple LLM agents to automate feature development. Each agent has a specific role (product manager, tech lead, engineer, reviewer, etc.) and uses the best model for that role.

### Quick Start

```bash
# Run a feature pipeline
npm run agent -- --input "Add guest meal preference selection to event pages"

# Run a bug fix pipeline
npm run agent -- --input "RSVP count shows wrong number" --pipeline bug

# Conversational intake (gathers requirements via Q&A, creates ClickUp task)
npm run agent:intake
```

### What Happens During a Run

1. **System Guard** — Real environment validation (Supabase, API keys, ClickUp, node_modules — no LLM cost)
2. **Analysis/Spec** — Product manager or tech lead analyzes the request
3. **Design** — Tech lead creates technical architecture
4. **Planning** — Task planner breaks work into implementation tasks
5. **Approval Gate** — You review the plan (CLI: y/n prompt; ClickUp: task status change)
6. **Implementation** — Engineers generate code (backend, frontend, or fullstack)
7. **Review** — Code reviewer checks for quality and security
8. **QA** — QA engineer generates test cases

### Budget Tiers

Every run has a budget. Default is `normal` ($2.00 per run, $0.50 per step).

| Flag | Budget |
|------|--------|
| `--priority low` | $1.00/run |
| `--priority normal` | $2.00/run (default) |
| `--priority high` | $5.00/run |
| `--priority urgent` | $10.00/run |
| `--no-budget-limit` | Unlimited |

### Run Logs

Every run saves a JSON log to `.runner/runs/<timestamp>.json` containing all steps, tokens, costs, and outputs.

---

## 7. Modifying Agents

Agent definitions are plain markdown files with YAML frontmatter in `ai/agents/`. To change an agent's model, budget, or behavior:

1. Open `ai/agents/<role>.md`
2. Edit the frontmatter (provider, model, token_budget) or the prompt body
3. The runner picks up changes on next run — no rebuild needed

To add a new agent:
1. Create `ai/agents/<new_role>.md` with the standard frontmatter
2. Reference it in a pipeline step: `agent: new_role`

---

## 8. ClickUp Integration

The automated flow:

1. **Intake agent** gathers requirements conversationally → creates ClickUp task with `run-agent` tag
2. **Webhook** fires when task status/tags change → triggers pipeline
3. **Pipeline runs** → posts results as ClickUp comments
4. **Approval gate** → changes task status to "Awaiting Approval", assigns to you
5. **You approve** (change status to "Approved") → webhook resumes pipeline

To set up the webhook, register `https://your-domain.com/api/runner/webhook` in ClickUp workspace settings.

---

## 9. Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full project guide (you're reading a companion to this) |
| `lib/llm/router.ts` | Multi-provider LLM routing via Vercel AI SDK |
| `lib/llm/defaults.ts` | Which model each agent role uses by default |
| `lib/llm/tokens.ts` | Token cost estimation for 15+ models |
| `lib/runner/sys-check.ts` | Real environment validation (no LLM) |
| `lib/runner/executor.ts` | Core pipeline execution engine |
| `lib/runner/loader.ts` | Parses ai/ markdown files into typed definitions |
| `lib/runner/monitor.ts` | Token budget tracking and enforcement |
| `lib/runner/clickup.ts` | ClickUp API integration |
| `lib/runner/notify.ts` | Email notifications via Resend |
| `app/api/runner/webhook/route.ts` | ClickUp webhook endpoint |

---

## 10. Branching

- **`Dev-Vibe`** is the working main branch — create feature branches from here
- **`main`** is production — only updated from Dev-Vibe when deploying to Vercel
- **`Dev-AMC`** has the parked AMC dashboard code (future: general-purpose pipeline monitor)

```bash
# Start a new feature
git checkout Dev-Vibe
git checkout -b feature/my-feature

# When done, merge back
git checkout Dev-Vibe
git merge feature/my-feature
```

---

## 11. Testing

```bash
npm run test:run   # Run once
npm run test       # Watch mode
```

Tests use Vitest with node environment. Test files live next to source: `lib/runner/loader.ts` → `lib/runner/loader.test.ts`.

Current coverage: 55 tests across 9 test files (LLM router, token costs, loader, logger, monitor, notify, clickup, executor, sys-check).

---

## Questions?

- Check `CLAUDE.md` for detailed architecture docs
- Check `docs/superpowers/specs/2026-04-06-agent-runner-design.md` for the full design spec
- Check `docs/superpowers/plans/2026-04-06-agent-runner-implementation.md` for the implementation plan
