---
name: end-evenzi-session
description: Evenzi-specific session closer — branches on who ran the session. Abhijith does full ClickUp sync + session report + doc updates + commit + merge to Dev-Vibe + worktree cleanup. Dheeraj writes a timestamped progress entry to dheeraj-progress.md (which Abhijith reads at his next session-start) and pushes to the feature branch only. Replaces the generic end-session skill on this project.
---

# End Evenzi Session

Project skill that replaces `/end-session` on Evenzi. Always invoke this on this project.

## Why this exists

Abhijith and Dheeraj have different end-of-session responsibilities. The split is enforced here so neither user accidentally crosses into the other's lane:

- **Abhijith** owns ClickUp + Dev-Vibe.
- **Dheeraj** owns his progress file + the feature branch.

See memory: `project_team_split.md`, `project_dheeraj_no_clickup.md`.

## Steps

### 1. Identify who ran the session

If `/start-evenzi-session` ran in this conversation, the user choice should already be in context. If not — or if you're unsure — `AskUserQuestion`:

- **Q:** "Who's wrapping up?"
- Options: **Abhijith** / **Dheeraj**

### 2. Review what changed

Both users:
- `git status` and `git log` to see uncommitted changes and commits this session
- Identify features/components touched
- Note tasks worked on (by clickup-id where known)

### 3. Resolve the active sprint

`docs/sprint/README.md` → pointer to active sprint folder. Fall back to highest-numbered `sprint-N/`.

### 4a. Path: Abhijith

#### 4a.1 Update ClickUp tasks
Invoke `/clickup-pm` with mode `session-end`. Provide:
- List of task IDs worked on
- Summary per task (what done, current state, next steps)

#### 4a.2 Generate session report
Invoke `/session-report` → saves to `docs/session-reports/YYYY-MM-DD-session-report.md`.

#### 4a.3 Update ClickUp docs (only if structure changed)
If new lists/features/dependencies — invoke `/clickup-pm` to update `docs/clickup/WORKSPACE.md` and `docs/clickup/DEPENDENCIES.md`.

#### 4a.4 Update project docs (only stale sections)
- `CLAUDE.md` → MVP status table, project structure, tech stack
- `docs/PROJECT.md` → feature status, DB schema, history
- `docs/ONBOARDING.md` → setup, key files, architecture
- `docs/NEXT-SESSION.md` → progress tracker, context, next steps

Touch only what's stale. No cosmetic edits.

#### 4a.5 Regenerate sprint digests
Invoke `/clickup-pm` with mode `regenerate-digests` — refreshes `docs/sprint/sprint-N/abhijith.md` and `dheeraj.md`.

#### 4a.6 Append session-end log entry

Append to `docs/sprint/sprint-N/abhijith-log.md` under today's date:

```
## YYYY-MM-DD
- **Start** HH:MM — <existing entry from session start>
- **End**   HH:MM — <one-line summary>; tasks updated: [list w/ statuses]; docs updated: [list]; report: docs/session-reports/YYYY-MM-DD-session-report.md; next: [what's queued]
```

If today's H2 doesn't exist yet (rare — should already exist from session start), create it.

#### 4a.7 Commit, push, merge to Dev-Vibe
```bash
git add <relevant files>
git commit -m "docs: end-of-session update — <brief summary>"
git push origin <current-branch>
git checkout Dev-Vibe
git merge <current-branch> --no-edit
git push origin Dev-Vibe
```

If merge conflicts: stop and ask Abhijith. **Never force push.**

#### 4a.8 Clean up worktree
`ExitWorktree` with action `remove`. If it refuses (uncommitted changes), go back to 4a.7.

#### 4a.9 Confirm

Tell Abhijith:
- ClickUp tasks updated (statuses + comments)
- Session report highlights (token usage, key metrics)
- Docs updated
- What was pushed to `Dev-Vibe`
- What's next from `NEXT-SESSION.md`

### 4b. Path: Dheeraj

**No ClickUp writes. No Dev-Vibe merge. No `/session-report`.**

#### 4b.1 Append progress entries to `dheeraj-progress.md`

Open `docs/sprint/sprint-N/dheeraj-progress.md` (create if missing — see "Initial scaffold" below). Append one block per task worked on, under today's `## YYYY-MM-DD` H2 (group together if multiple this session).

```
## YYYY-MM-DD
**Worked on:**
- <task name or ID> — <status: in progress | review | blocked | done> — <one-line what>
- <task name or ID> — <status> — <one-line what>

**Decisions:**
- <bullet, with reasoning>

**Issues found:**
- <bullet, with severity if bug>

**Files changed:**
- <key paths>

**Tests:**
- <what was tested, results>

**Notes:**
- <blockers, questions, asks for Abhijith>

**Push:** commit `<short-sha>` on `<branch>`
```

**Confirm with Dheeraj before writing** — show the draft per task, let him correct it.

#### 4b.2 Append session-end log entry

Append to `docs/sprint/sprint-N/dheeraj-log.md` under today's date:

```
## YYYY-MM-DD
- **Start** HH:MM — <existing entry from session start>
- **End**   HH:MM — <one-line summary>; tasks: [list]; entries written to dheeraj-progress.md: [task names]; notes: [anything Abhijith should see]
```

#### 4b.3 Commit and push (feature branch only)

```bash
git add docs/sprint/sprint-N/dheeraj-progress.md docs/sprint/sprint-N/dheeraj-log.md <code files Dheeraj edited>
git commit -m "frontend: <component or task> — <one-line summary>

Progress logged in docs/sprint/sprint-N/dheeraj-progress.md for Abhijith review."
git push origin <current-branch>
```

**Do NOT** check out Dev-Vibe. **Do NOT** merge. **Do NOT** push to Dev-Vibe. Abhijith reviews and merges.

#### 4b.4 Worktree cleanup
Only remove the worktree if Dheeraj explicitly confirms he's fully done with this branch. Otherwise leave it for the next session.

#### 4b.5 Confirm

Tell Dheeraj:
- Entries written to `dheeraj-progress.md` (one per task)
- Files committed and pushed to `origin/<branch>`
- Reminder: Abhijith will sync to ClickUp on his next session start

## Initial scaffold (first time a sprint folder is used)

If `dheeraj-progress.md` doesn't exist, create it with this header before appending:

```
# Dheeraj — Sprint N progress (session-by-session)

Written by Dheeraj at session end. Read by Abhijith at session start, who syncs entries to ClickUp via approval gate, then archives them under `## Synced`.

```

Same one-time-header treatment for `abhijith-log.md` and `dheeraj-log.md`:

```
# <User> — Sprint N log
```

## Rules

1. **Always identify the user first** — flows are completely different.
2. **Dheeraj never writes to ClickUp.** Not once. Not even read-only telemetry.
3. **Dheeraj never merges to Dev-Vibe.** His push lands on the feature branch.
4. **Dheeraj's `dheeraj-progress.md` is append-only.** The `## Synced` section is owned by `/start-evenzi-session` (Abhijith path).
5. **Sprint-log files are append-only.** Group by date.
6. **Confirm before destructive actions** — worktree removal, merge to Dev-Vibe. Never force push.
