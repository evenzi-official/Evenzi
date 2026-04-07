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
│   └── runner/           # Parked utilities (sys-check, logger) — see Dev-Runner branch
├── scripts/              # CLI entry points (run-sys-check.ts)
└── docs/                 # Specs, plans, this file
```

---

## 6. Development Workflow

Features are built using the **superpowers plugin workflow** in Claude Code, guided by enriched agent prompts in `ai/agents/`.

### How to Build a Feature

1. **Create a ClickUp feature task** using the template from `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`
2. **Break into components** — each component gets UI/UX → Frontend → Backend → QA subtasks
3. **Start a new Claude Code session** — paste the ClickUp task details
4. **Superpowers takes over** — brainstorm → write-plan → subagent-driven-development → code-review
5. **Approval gates** — after each dev phase, validate AI output before proceeding to next phase
6. **Agent knowledge** — Claude Code references `ai/agents/` for role-specific checklists at each stage

### Task Hierarchy

```
📦 Feature → 📋 Spec → 📐 Data Model → 🧩 Components → 🔗 Integration → 📝 Docs → 🚀 Release
                                            ↓
                                  🎨 UI/UX → 💻 FE → ⚙️ BE → ✅ QA
```

Each arrow represents an **approval gate** — user validates before next phase starts.

### Key Agent Knowledge Files

| File | Knowledge |
|------|-----------|
| `ai/agents/frontend_engineer.md` | Design thinking, typography, color, motion, anti-patterns |
| `ai/agents/code_reviewer.md` | Confidence scoring (0-100), false positive filtering |
| `ai/agents/security_expert.md` | 9 vulnerability patterns, defense-in-depth |
| `ai/agents/product_manager.md` | Requirements analysis, feature specification |
| `ai/agents/tech_lead.md` | Architecture decisions, system design |

### Modifying Agent Knowledge

Edit the prompt body in `ai/agents/<role>.md`. Changes are picked up when Claude Code reads the file — no rebuild needed.

---

## 7. Key Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE.md` | Full project guide |
| `ai/agents/*.md` | Enriched agent knowledge base (15 agents) |
| `ai/pipelines/*.md` | Pipeline step order reference |
| `ai/system/agent_rules.md` | Shared coding standards |

---

## 8. Branching

- **`Dev-Vibe`** is the working main branch — create feature branches from here
- **`main`** is production — only updated from Dev-Vibe when deploying to Vercel
- **`Dev-Runner`** has the parked automated multi-LLM runner (executor, LLM router, budget monitor, webhook, email)
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

## 9. Testing

```bash
npm run test:run   # Run once
npm run test       # Watch mode
```

Tests use Vitest with node environment. Test files live next to source files.

---

## 10. MVP Phase 1

**Goal:** Host-only, one complete end-to-end event flow — create event, manage guests, send invitations, track RSVPs, budget, photos, event website.

**Vendor role is deferred post-MVP.**

Key docs:
- Task templates & ClickUp structure: `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`
- MVP sprint plan: `docs/superpowers/plans/2026-04-08-clickup-setup-mvp-tasks.md`
- Design screens: Google Stitch project (link in CLAUDE.md)

---

## Questions?

- Check `CLAUDE.md` for detailed architecture docs
- Check `docs/superpowers/specs/` for design specs
- Check `docs/superpowers/plans/` for implementation plans
