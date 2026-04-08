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

**Option 1: "Continue in-progress work"** — Pick up where we left off (show which task)
**Option 2: "Pick a feature to build"** — Show the feature parent tasks from Backlog and let user choose
**Option 3: "ClickUp task management"** — Work on ClickUp tasks (create subtasks, set dependencies, organize sprint)
**Option 4: Other** — User specifies what they want

### 5. Set up the session based on choice

**If continuing in-progress work:**
- Read the ClickUp task details (`clickup_get_task` with subtasks)
- Identify next uncompleted subtask or phase
- Start the superpowers workflow (brainstorm → plan → implement)

**If picking a feature:**
- List feature parent tasks from Backlog (tags: `["feature", "mvp-phase-1"]`)
- Show each with priority, dependency status, and completion %
- After user picks, read the full task description
- Check if feature has subtasks — if not, suggest creating them first
- If subtasks exist, identify the next one to work on
- Start the superpowers workflow

**If ClickUp task management:**
- Show current workspace state
- Ask what needs to be done (create tasks, set dependencies, update statuses, etc.)

### 6. Initialize superpowers

Invoke the `superpowers:using-superpowers` skill to activate the skill system for this session.

Begin work.
