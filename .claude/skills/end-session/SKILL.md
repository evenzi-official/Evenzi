---
name: end-session
description: End-of-session workflow — update ClickUp tasks, generate session report, update docs, commit, push to Dev-Vibe, clear worktree
---

# End Session Workflow

Run this when wrapping up a Claude Code session. This handles all cleanup so nothing is lost.

## Steps

### 1. Review what changed this session

- Run `git status` and `git log` to see all uncommitted changes and commits made this session
- Identify what features were worked on, what was completed, what's next
- Note which ClickUp tasks were actively worked on during this session

### 2. Update ClickUp tasks

Invoke `/clickup-pm` with mode `session-end`. Provide:
- List of task IDs worked on this session
- Summary of what was done per task
- Current state and next steps per task

The skill handles all status transitions, session summary comments, subtask updates, and parent task rollups.

### 3. Generate session report

Invoke `/session-report`. It will:
- Summarize work accomplished (files, tasks, phases)
- Estimate token usage by phase
- List issues discovered and tasks created
- Provide optimization suggestions for future sessions
- Save report to `docs/session-reports/[date]-session-report.md`

### 4. Update ClickUp docs (if workspace structure changed)

If this session created new features, lists, or changed dependencies, invoke `/clickup-pm` to update:
- `docs/clickup/WORKSPACE.md` — new IDs, status changes
- `docs/clickup/DEPENDENCIES.md` — dependency or sprint order changes

**Rule:** If ClickUp structure didn't change, skip this step.

### 5. Update project docs (only if session work makes them stale)

Check each doc and update ONLY sections that are affected by this session's work:

**`CLAUDE.md`:**
- MVP Phase 1 status table (mark features as done/in-progress if status changed)
- Project structure (if new directories or files were added)
- Tech stack (if new dependencies were added)
- Any other section that's now stale

**`docs/PROJECT.md`:**
- Feature status/descriptions (if features were built or refined)
- Database schema (if tables were created or modified)
- Project History timeline (add a new row for today's work)
- Design assets (if new screens were designed)

**`docs/ONBOARDING.md`:**
- Setup steps (if env vars or dependencies changed)
- Key files reference (if important new files were created)
- Architecture (if project structure changed)

**`docs/NEXT-SESSION.md`:**
- Check off completed items in the Progress Tracker
- Update "Context" section with current state
- Update next steps based on what was accomplished
- Add any new tasks discovered during the session

**Rule:** If nothing relevant changed for a doc, don't touch it. Don't make cosmetic edits.

### 6. Commit all uncommitted changes

```bash
git add <relevant files>
git commit -m "docs: end-of-session update — <brief summary of what changed>"
```

Include the session report in the commit.

### 7. Push and merge to Dev-Vibe

```bash
# Push current worktree branch
git push origin <current-branch>

# Switch to Dev-Vibe and merge
git checkout Dev-Vibe
git merge <current-branch> --no-edit

# Push Dev-Vibe
git push origin Dev-Vibe
```

If there are merge conflicts, stop and ask the user how to resolve them. Do NOT force push.

### 8. Clean up worktree

Use `ExitWorktree` with action "remove" to clean up the worktree.

If the worktree has uncommitted changes, the tool will refuse — go back to step 6 and commit first.

### 9. Confirm completion

Tell the user:
- What ClickUp tasks were updated (status changes + comments added)
- Session report highlights (token usage, key metrics)
- What docs were updated
- What was pushed to Dev-Vibe
- What's next for the following session (from NEXT-SESSION.md)
