---
name: start-session
description: Use at the start of every Claude Code session — ensures Dev-Vibe worktree, reads project docs, pulls ClickUp tasks, initializes superpowers, offers multiple work paths
---

# Start Session Workflow

Run this at the beginning of every Claude Code session to get oriented and ready to work.

## Steps

### 1. Verify worktree source branch

Check if the current worktree was created from `Dev-Vibe`. If not:

```bash
git merge-base --is-ancestor Dev-Vibe HEAD
```

If the worktree is NOT based on Dev-Vibe:
- Exit the current worktree (`ExitWorktree` with action "remove", discard if needed)
- Switch to `Dev-Vibe` branch: `git checkout Dev-Vibe`
- Pull latest: `git pull origin Dev-Vibe`
- Create a new worktree from Dev-Vibe using `EnterWorktree`

If already on Dev-Vibe-based worktree, continue.

### 2. Read project context

Read these files to understand current project state:

1. **`CLAUDE.md`** — Tech stack, commands, coding conventions, MVP status
2. **`docs/NEXT-SESSION.md`** — Progress tracker, what's next, where we left off
3. **`docs/PROJECT.md`** — Full feature descriptions, design status, database plans
4. **`docs/ONBOARDING.md`** — Setup instructions, key files, architecture

Focus on:
- What was completed last session (NEXT-SESSION.md progress tracker)
- What's the next task to pick up
- Any blockers or pre-requisites

### 3. Initialize superpowers

Invoke `superpowers:using-superpowers` to activate the skill system for this session. Do this early so all skills are available for every path.

### 4. Pull ClickUp status

Invoke `/clickup-pm` with mode `session-start`. It will:
- Fetch in-progress, ready, and approval-gate tasks
- Return a structured summary for briefing the user

### 5. Brief the user and choose a path

Give a concise summary:
- **Last session:** What was accomplished (from NEXT-SESSION.md)
- **Current state:** Where the project stands
- **In progress:** Any tasks already started in ClickUp
- **Ready to pick up:** Tasks in "to do" status
- **Blockers:** Any issues or approval gates pending

Then use `AskUserQuestion` to ask what they want to do this session:

| Path | Description |
|------|-------------|
| **Work on a ClickUp task** | Pick a task from sprint/backlog, go through full workflow |
| **Fix a bug** | Describe a bug, file it in ClickUp, debug and fix |
| **ClickUp task management** | Organize sprint, create tasks, move tasks, set dependencies |
| **Design / brainstorm** | Explore an idea or design a feature (no implementation) |
| **Codebase maintenance** | Refactor, cleanup, dependency updates, tech debt |
| **Review / explore** | Read code, review architecture, understand a system |
| **Other** | User describes what they need |

### 6. Execute the chosen path

**Work on a ClickUp task:**
1. Fetch all actionable tasks (Active Sprint, in-progress, backlog features)
2. Present a structured list grouped by category
3. Use `AskUserQuestion` with the tasks as options
4. Once selected, invoke `/clickup-pm` with mode `task-activate`
5. Start the superpowers feature workflow with council gates:
   ```
   superpowers:brainstorming → spec doc
   superpowers:writing-plans → implementation plan
   /council plan → multi-agent council + debate + arbiter (AUTO)
     ↳ /plan-review is the lightweight fallback if council skips (trivial change)
   superpowers:executing-plans → implementation
   /council code → multi-agent council before commit (AUTO)
   superpowers:requesting-code-review → code review (if council leaves open items)
   superpowers:verification-before-completion → verify
   ```
   If a design spec is produced along the way, `/council design` fires before frontend dev.
6. During implementation, `/clickup-pm` updates task statuses + comments throughout

**Fix a bug:**
1. Ask user to describe the bug
2. Invoke `/clickup-pm` to create bug in QA & Bugs list, link to affected feature
3. Invoke `/council bug` to dispatch a debug council (AUTO unless typo/trivial)
   ↳ The council's consolidated hypotheses become the starting point for diagnosis
4. Invoke `superpowers:systematic-debugging` to work through the leading hypothesis
5. Fix the bug
6. `/council code` before commit (AUTO unless trivial)
7. Invoke `superpowers:verification-before-completion` to verify
8. `/clickup-pm` updates bug task status

**ClickUp task management:**
- Invoke `/clickup-pm` — it handles all task CRUD, status updates, dependencies, assignments, sprint management
- No superpowers workflow needed

**Design / brainstorm:**
1. Invoke `superpowers:brainstorming` to explore the idea
2. Spec doc written to `docs/superpowers/specs/`
3. No implementation this session (unless user decides to continue)
4. No ClickUp task required upfront — create one after brainstorm if the idea solidifies

**Codebase maintenance:**
1. Identify what needs cleaning (user describes or explore codebase)
2. Make changes
3. Invoke `superpowers:requesting-code-review` to validate changes
4. Invoke `superpowers:verification-before-completion` to verify

**Review / explore:**
- Read code, understand architecture, answer questions
- No workflow needed — just exploration and discussion
- Use agents as reference (read `ai/agents/*.md`) for domain-specific perspectives

### 7. Parallel execution reminder

Remind yourself: **Always dispatch parallel subagents** for independent tasks. Use `superpowers:dispatching-parallel-agents` whenever 2+ tasks don't depend on each other. This includes:
- Multiple ClickUp operations (create/update/delete tasks)
- Independent file reads or writes
- Frontend + Backend on separate components
- Running tests while writing docs

Reference: `CLAUDE.md` → "Parallel Subagents" section, `docs/clickup/` for all ClickUp docs.

Begin work.
