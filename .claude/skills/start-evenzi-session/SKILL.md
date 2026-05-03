---
name: start-evenzi-session
description: Evenzi-specific session opener — asks "Who's using?" (Abhijith / Dheeraj), branches the flow accordingly. Replaces the generic start-session skill on this project. Handles team-aware context loading, ClickUp sync (Abhijith only), Dheeraj→Abhijith progress sync with approval gate, sprint-log entries, and digest regeneration.
---

# Start Evenzi Session

Project skill that replaces `/start-session` on Evenzi. Always invoke this on this project.

## Why this exists

Evenzi is a 2-person team:
- **Abhijith (278583396)** — Product/PM, Spec, Data Modeling, Backend, Design, Reviews. **Full ClickUp read/write.**
- **Dheeraj (100996803)** — Frontend, Component QA, Integration. **No ClickUp seat.** Works off a markdown digest in `docs/sprint/sprint-N/dheeraj.md` and writes session output to `dheeraj-progress.md`.

The two have different start-of-session needs, and Dheeraj's progress only flows into ClickUp through Abhijith via an approval gate.

See memory: `project_team_split.md`, `project_dheeraj_no_clickup.md`.

## Steps

### 1. Verify worktree source branch

```bash
git merge-base --is-ancestor Dev-Vibe HEAD
```

If not based on `Dev-Vibe`: exit the worktree, switch to `Dev-Vibe`, pull, and create a new worktree from it.

### 2. Initialize superpowers

Invoke `superpowers:using-superpowers` early so all skills are available.

### 3. Ask: who's using?

Use `AskUserQuestion`:

- **Q:** "Who's starting this session?"
- **Options:**
  - **Abhijith** — full ClickUp + PM + spec/backend/database/design path
  - **Dheeraj** — frontend/QA path (no ClickUp; reads sprint digest)

Branch the rest of the flow on the answer. Persist the choice in your context for the rest of the session.

### 4. Resolve the active sprint

Look at `docs/sprint/README.md` — it points to the active sprint folder (e.g. `sprint-1/`). If `README.md` is missing, look for the highest-numbered `docs/sprint/sprint-N/` folder. If none exists at all, prompt the user to confirm the sprint name and create it.

### 5a. Path: Abhijith

#### 5a.1 Read project context (parallel)
- `CLAUDE.md`
- `docs/NEXT-SESSION.md`
- `docs/PROJECT.md` (only if relevant to chosen path)
- `docs/ONBOARDING.md` (only if onboarding-relevant)

#### 5a.2 Sync Dheeraj's progress into ClickUp (approval-gated)

Invoke `/clickup-pm` with mode `sync-dheeraj-progress`. It will:
1. Read un-synced entries from `docs/sprint/sprint-N/dheeraj-progress.md` (anything outside the `## Synced` section).
2. **Show full verbatim readout to Abhijith FIRST** — per task, no summarization that drops detail.
3. `AskUserQuestion` per entry (or per batch if small): **Approve / Modify / Skip**.
4. On Approve → write status updates + comments to ClickUp (comment prefix: `From Dheeraj — [date]`).
5. On Modify → ask Abhijith for the corrected status/comment, then sync.
6. On Skip → leave un-synced (re-appears next session).
7. Move synced entries into `## Synced` with `### Synced YYYY-MM-DD HH:MM` heading.

#### 5a.3 Pull ClickUp state
Invoke `/clickup-pm` with mode `session-start` — fetches in-progress, ready, and approval-gate tasks.

#### 5a.4 Regenerate sprint digests
Invoke `/clickup-pm` with mode `regenerate-digests` — overwrites `docs/sprint/sprint-N/abhijith.md` and `dheeraj.md` from current ClickUp state. Format defined in clickup-pm SKILL.

#### 5a.5 Append session-start log entry

Append to `docs/sprint/sprint-N/abhijith-log.md` (create if missing). Group by date — if today's `## YYYY-MM-DD` heading already exists, add the bullet under it; otherwise create a new H2.

```
## YYYY-MM-DD
- **Start** HH:MM — picking up: <task names if known>; Dheeraj sync: <N synced / nothing to sync / N skipped>
```

#### 5a.6 Brief and choose path

Brief Abhijith with:
- **Last session:** From `NEXT-SESSION.md` and his own `abhijith-log.md` last entries.
- **In progress:** From ClickUp (`session-start` result).
- **Awaiting review:** Tasks Dheeraj just pushed (now visible after sync).
- **Ready to pick up:** From the `dheeraj.md` digest (work he can unblock by completing spec/backend/data) and his own `abhijith.md` digest.
- **Blockers:** Anything blocked.

Then `AskUserQuestion` with paths:

| Path | Description |
|------|-------------|
| **Work on a ClickUp task** | Pick from sprint/backlog, full superpowers workflow |
| **Review Dheeraj's work** | Walk through tasks Dheeraj pushed for review, sign off or revise |
| **Fix a bug** | Describe → file in QA & Bugs via `/clickup-pm` → debug → fix → verify |
| **ClickUp task management** | Sprint planning, task CRUD, dependencies — handled by `/clickup-pm` |
| **Design / brainstorm** | `superpowers:brainstorming` → spec doc, no implementation |
| **Codebase maintenance** | Refactor, cleanup, dependency updates |
| **Review / explore** | Read code, understand a system |

### 5b. Path: Dheeraj

#### 5b.1 Read context (parallel)
- `CLAUDE.md` (Coding Conventions section)
- `docs/sprint/sprint-N/dheeraj.md` — his current queue
- `docs/sprint/sprint-N/abhijith.md` — Abhijith's progress on dependencies he's waiting on (read-only, for awareness)
- `docs/sprint/sprint-N/dheeraj-progress.md` — his last entries (un-synced + recent synced)

If `dheeraj.md` doesn't exist, tell Dheeraj clearly: *"No sprint digest at `docs/sprint/sprint-N/dheeraj.md`. Ask Abhijith to publish one before starting."* and stop.

#### 5b.2 Skip ClickUp entirely

Do **NOT** invoke `/clickup-pm`. Any ClickUp call from this branch is a bug. Dheeraj has no ClickUp access.

#### 5b.3 Append session-start log entry

Append to `docs/sprint/sprint-N/dheeraj-log.md` (create if missing). Group by date.

```
## YYYY-MM-DD
- **Start** HH:MM — picking up: <task names from digest>; notes: <anything relevant>
```

#### 5b.4 Brief and ask what he's working on

Brief Dheeraj with:
- **His sprint queue** (from `dheeraj.md`): in progress, to do, in review (waiting on Abhijith), blocked.
- **Abhijith's recent activity** that may unblock him (read from `abhijith.md` + last `abhijith-log.md` entry).
- **Acceptance criteria** for the top task in his queue (pulled from the digest).
- **His last session's notes** (from `dheeraj-progress.md`).

Then `AskUserQuestion`:

- **Q:** "What are you working on today?"
- Options derived from his digest:
  - **Continue current frontend task** (each in-progress component as an option)
  - **Pick up next frontend task** (each "to do" component in his digest)
  - **Component QA** (any component awaiting QA in his digest)
  - **Integration testing** (cross-component tests for completed features)
  - **Bug fix** (frontend bug — note on it, no ClickUp call)
  - **Codebase exploration** (read code, understand a system)

### 6. Execute the chosen path

- **Abhijith:** Full superpowers feature workflow (`brainstorming → writing-plans → /plan-review → executing-plans → requesting-code-review → verification-before-completion`). All ClickUp orchestration via `/clickup-pm`.
- **Dheeraj:** `superpowers:test-driven-development`, `systematic-debugging`, `requesting-code-review`, `verification-before-completion`. Track work in his head + `dheeraj-progress.md` at session end. **Never invoke `/clickup-pm`. Never edit `abhijith.md`. Never set ClickUp statuses.**

### 7. Parallel execution reminder

Always dispatch parallel subagents for independent tasks via `superpowers:dispatching-parallel-agents` — multiple ClickUp ops, independent file reads/writes, frontend + backend on separate components, tests + docs.

## Rules

1. **Always ask "Who's using?" first** — never assume.
2. **Dheeraj path never touches ClickUp** — even read-only calls.
3. **Dheeraj's progress only flows into ClickUp through Abhijith's approval gate** — verbatim readout, then Approve/Modify/Skip per entry.
4. **Sprint folder discovery:** prefer `docs/sprint/README.md` pointer; fall back to highest-numbered folder.
5. **Sprint-log files are append-only** and grouped by date — never rewrite past entries; never reorder.
6. **Digest files are derived state** — overwriting on regenerate is fine.
7. **Date and time:** use the user's local clock (24-hour format). If the date isn't certain, ask.

Begin work.
