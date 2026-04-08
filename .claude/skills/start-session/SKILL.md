---
name: start-session
description: Use at the start of every Claude Code session — ensures Dev-Vibe worktree, reads project docs, pulls ClickUp tasks, initializes superpowers
---

# Start Session Workflow

Run this at the beginning of every Claude Code session to get oriented and ready to work.

## Steps

### 1. Verify worktree source branch

Check if the current worktree was created from `Dev-Vibe`. If not:

```bash
# Check what branch the worktree is based on
git log --oneline -1 Dev-Vibe
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

### 3. Pull ClickUp status

Fetch current sprint state from ClickUp:

- Use `clickup_filter_tasks` with tags `["mvp-phase-1"]` and statuses `["in progress"]` to find active work
- Use `clickup_filter_tasks` with tags `["mvp-phase-1"]` and statuses `["to do"]` to find ready tasks
- Note any tasks with `approval-gate` tag that are waiting for user approval

### 4. Brief the user and ask what to work on

Give a concise summary:
- **Last session:** What was accomplished (from NEXT-SESSION.md)
- **Current state:** Where the project stands
- **In progress:** Any tasks already started in ClickUp
- **Ready to pick up:** Tasks in "to do" status
- **Blockers:** Any issues or approval gates pending

Then use `AskUserQuestion` to ask what they want to do this session:

**Option 1: "Pick a ClickUp task"** — Browse and select a specific task from ClickUp to work on
**Option 2: "Continue in-progress work"** — Pick up where we left off (show which task)
**Option 3: "ClickUp task management"** — Work on ClickUp tasks (create subtasks, set dependencies, organize sprint)
**Option 4: Other** — User specifies what they want

### 5. Set up the session based on choice

**If picking a ClickUp task:**
1. Fetch all actionable tasks using `clickup_filter_tasks`:
   - Active Sprint tasks (list ID from WORKSPACE.md)
   - In-progress tasks across all lists
   - Backlog feature parents
2. Present a structured list grouped by category:

   **🔥 Active Sprint:**
   - [task name] — [status] — [priority] — [assignee]

   **🚧 In Progress:**
   - [task name] — [status] — [list]

   **📋 Backlog Features:**
   - [task name] — [priority] — [subtask count]

3. Use `AskUserQuestion` with the tasks as options so the user can pick one
4. Once selected:
   - Fetch full task details with `clickup_get_task` (subtasks: true)
   - Show the task description, subtasks, and current progress
   - Identify the next uncompleted subtask or phase
   - Update the task status to `in progress` if not already
   - Add a comment: "🚀 Session started — working on this task"
   - Start the superpowers workflow (brainstorm → plan → implement)

**If continuing in-progress work:**
- Read the ClickUp task details (`clickup_get_task` with subtasks)
- Identify next uncompleted subtask or phase
- Start the superpowers workflow (brainstorm → plan → implement)

**If ClickUp task management:**
- Show current workspace state
- Ask what needs to be done (create tasks, set dependencies, update statuses, etc.)

### 6. Initialize superpowers

Invoke the `superpowers:using-superpowers` skill to activate the skill system for this session.

### 7. Parallel execution reminder

Remind yourself: **Always dispatch parallel subagents** for independent tasks. Use `superpowers:dispatching-parallel-agents` whenever 2+ tasks don't depend on each other. This includes:
- Multiple ClickUp operations (create/update/delete tasks)
- Independent file reads or writes
- Frontend + Backend on separate components
- Running tests while writing docs

Reference: `CLAUDE.md` → "Parallel Subagents" section, `docs/clickup/` for all ClickUp docs (TEMPLATES, GUIDELINES, WORKSPACE, INTAKE, DEPENDENCIES).

Begin work.
