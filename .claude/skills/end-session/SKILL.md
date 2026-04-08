---
name: end-session
description: End-of-session workflow — update docs, commit, push to Dev-Vibe, clear worktree
---

# End Session Workflow

Run this when wrapping up a Claude Code session. This handles all cleanup so nothing is lost.

## Steps

### 1. Review what changed this session

- Run `git status` and `git log` to see all uncommitted changes and commits made this session
- Identify what features were worked on, what was completed, what's next
- Note which ClickUp tasks were actively worked on during this session

### 2. Update ClickUp tasks

For every ClickUp task that was worked on this session:

**Update task status:**
- If work is complete and ready for review → set status to `in review`
- If work is partially done and will continue → keep status as `in progress`
- If work is blocked → set status to `blocked` and note the blocker
- If a phase was approved during the session → set status to `approved` or `done`

**Add a session summary comment** to each task worked on:

```
📝 Session Update — [date]

**What was done:**
- [Bullet points of actual work completed]

**Current state:**
- [Where this task stands now]

**Next steps:**
- [What remains to be done]

**Blockers (if any):**
- [What's preventing progress]
```

**Update subtask statuses** if individual dev phases were completed (e.g., if Frontend Dev was finished, mark it accordingly).

### 3. Update ClickUp docs (if workspace structure changed)

Check and update ONLY if this session changed ClickUp structure:

**`docs/clickup/WORKSPACE.md`:**
- New feature parent IDs (if features were created)
- New list/folder IDs (if workspace structure changed)
- Task status updates in the feature table

**`docs/clickup/DEPENDENCIES.md`:**
- Dependency changes (if new features were added or dependencies shifted)
- Sprint order updates (if priorities changed)

**Rule:** If ClickUp structure didn't change, don't touch these files.

### 4. Update project docs (only if session work makes them stale)

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

### 5. Commit all uncommitted changes

```bash
git add <relevant files>
git commit -m "docs: end-of-session update — <brief summary of what changed>"
```

### 6. Push and merge to Dev-Vibe

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

### 7. Clean up worktree

Use `ExitWorktree` with action "remove" to clean up the worktree.

If the worktree has uncommitted changes, the tool will refuse — go back to step 5 and commit first.

### 8. Confirm completion

Tell the user:
- What ClickUp tasks were updated (status changes + comments added)
- What docs were updated
- What was pushed to Dev-Vibe
- What's next for the following session (from NEXT-SESSION.md)
