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

### 1. Fetch remote, then verify worktree source branch

**Always `git fetch` FIRST.** Both Abhijith and Dheeraj now push to remote, so local refs (`Dev-Vibe`, `Dev-Vibe-Testing`, feature branches) go stale between sessions. Fetching before any branch comparison/ancestry check avoids reasoning about an out-of-date tree and missing the other person's just-pushed work. Unconditional — runs on both the Abhijith and Dheeraj paths.

```bash
git fetch --all --prune
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
| **Design next page** | Pure HTML/CSS/JS design work in `designs/`. No superpowers. Plan → build → test, reuses `shell.css`/`shell.js`, mobile-first, UI/UX agent throughout |
| **Generate a build kit (`/spec-kit`)** | Multi-editor workflow planning front-door. `/spec-kit <page>` reads overview + shell + brand → drafts spec → open Qs → `/council design` (codex opt-in) → writes the 7-file kit into `designs/pages/<page>/` for Cursor to build + Antigravity to test. See `docs/specs/_WORKFLOW-TODO.md`. |
| **Codebase maintenance** | Refactor, cleanup, dependency updates |
| **Review / explore** | Read code, understand a system |

#### 5a.6.1 Start the right dev server

After the path is chosen, start the appropriate server in background — but only if it isn't already running. Use Bash with `run_in_background: true` and surface the URL to Abhijith.

| Path                        | Server           | Port | Notes |
|-----------------------------|------------------|------|-------|
| Design next page            | `npm run design` | 4000 | Handled in 5a.7.1 — skip here |
| Generate a build kit (`/spec-kit`) | `npm run design` | 4000 | Optional — only if you want to eyeball the existing page while planning; the kit write itself needs no server |
| Work on a ClickUp task      | `npm run dev`    | 3000 | |
| Review Dheeraj's work       | `npm run dev`    | 3000 | |
| Fix a bug                   | `npm run dev`    | 3000 | |
| Codebase maintenance        | `npm run dev`    | 3000 | Only if change is verifiable in browser |
| ClickUp task management     | none             | —    | |
| Design / brainstorm         | none             | —    | |
| Review / explore            | none             | —    | |

#### 5a.7 Path: Design next page

**No superpowers.** Pure design work — HTML/CSS/JS in `designs/`, mobile-web target. Pages are built as static prototypes that get converted to React later.

##### 5a.7.1 Initialize

1. **Start the design server FIRST — before anything else on this path.** Run `npm run design` in background (live-server on :4000, host `0.0.0.0` so the LAN URL is reachable from Abhijith's phone). Wait until port 4000 is listening, then surface both the local (`http://localhost:4000`) and LAN (`http://<lan-ip>:4000`) URLs to Abhijith.
   - **Dependency resilience:** the `design` script uses `npx --yes live-server@^1.2.2 …`, so it works even in a fresh worktree where `node_modules` is empty (no full `npm install` needed). `npx` uses the local install if present, otherwise fetches `live-server` on first run. If the server still fails to bind :4000, check the background task output before retrying — do not loop blindly.
2. Invoke the `ui-ux-pro-max` skill.
3. Read in parallel: `designs/shell.css`, `designs/shell.js`, `designs/components.html`, `docs/BRAND-GUIDELINES.md`, and the file listing of `designs/` (titles of every existing `*.html`).
4. Invoke the UI/UX agent (`ai/agents/ui_ux_designer.md`) as the design partner for this session — it participates in plan review, build review, and test review. If the agent file doesn't exist yet, surface that to Abhijith and proceed without it (agent creation is a separate task).

`docs/BRAND-GUIDELINES.md` is the source of truth for brand decisions.

##### 5a.7.2 Plan phase (required, before any markup)

For the page Abhijith wants to design:

1. Ask which page/screen and the user goal of that screen.
2. Ask if there's a Figma/Stitch reference. If yes, read it as a **wireframe-level reference only** — colors, spacing, exact layout are NOT binding. Free to design beyond it.
3. List every UI element the page needs.
4. For each element, check `designs/components.html` + `shell.css` for an existing component. Categorize:
   - **Reuse as-is** → cite component name from shell
   - **Reuse with variation** → extend via modifier class in `shell.css`, no fork
   - **New, generic** → add to `shell.css` / `shell.js`
   - **New, page-specific** → add to `<page>.css` / `<page>.js`
5. Write the plan to `designs/_plans/<page>-plan.md` (create folder if missing).
6. Have the UI/UX agent review the plan — it flags missing states, accessibility concerns, mobile ergonomics, hierarchy issues. Address or document deferrals before plan sign-off.
7. Get Abhijith's sign-off on the plan before writing any markup.

##### 5a.7.3 Build phase

- Create `designs/<page>.html`, `designs/<page>.css` (if any page-specific styles), `designs/<page>.js` (if any page-specific behavior).
- **No inline CSS or JS. Ever.** Everything in its own file: generic → `shell.*`, page-specific → `<page>.*`.
- Mobile-first: viewport meta, touch targets ≥44px, no hover-only interactions, `env(safe-area-inset-*)` on fixed chrome, design at 360px first then scale up.
- After each major component or section is built, run a quick UI/UX agent pass on that increment. Don't wait for the full page to be done — catch issues early.

##### 5a.7.4 Test phase (required, before closing)

Every page goes through testing before it's considered done. The UI/UX agent leads this phase as a parallel reviewer. If the agent doesn't exist yet, run the checks manually but call it out.

Test matrix — go through ALL of these:

1. **Component-level**
   - Every interactive element renders in all visual states (default / hover / active / focus / disabled / loading / error / empty).
   - Reused shell components inherit shell tokens correctly (no overrides unless intentional via modifier class).

2. **Interaction**
   - Every button, link, toggle, tab, dropdown, modal trigger fires.
   - Keyboard: Tab order is logical; Enter/Space activate focused controls; Esc closes overlays.
   - No dead links — every `<a href>` either navigates to an existing `designs/*.html` page or is explicitly marked `href="#"` with a comment.

3. **Responsiveness** — test at:
   - 360px (small phone), 390px (iPhone), 414px (large phone)
   - 768px (tablet), 1024px (small laptop), 1440px (desktop)
   - No horizontal scroll on any width. No clipped content. Touch targets ≥44px on mobile widths.

4. **Cross-page**
   - Navigation links from this page lead where they should.
   - Back-chip / breadcrumb behaves consistently with sibling pages.
   - Light/dark toggle works on this page (if the shell exposes it).

5. **Mobile device test (manual)**
   - Abhijith opens the page on his phone via the LAN URL printed by live-server. Walks through the full flow.
   - Report findings; iterate.

6. **UI/UX agent review**
   - Invoke the UI/UX agent with the page URL + plan doc. Agent returns a critique covering visual consistency with shell, hierarchy, motion, accessibility, mobile ergonomics. Address findings or document deferrals in the plan doc.

Do NOT mark a page done until every row above is checked.

##### 5a.7.5 Closing

- Update `designs/components.html` if any new shared components landed.
- Append the page summary + decisions to `designs/_plans/<page>-plan.md` under `## Built` heading (what shipped, what was deferred).
- No ClickUp updates from this path — design is pre-task; ticket-tracking happens when handed off to frontend dev.

##### Rules for the design path

1. **Reuse before create.** Always read `shell.css` + `components.html` first. Existing component matches the need? Use it.
2. **Generic → shell. Page-specific → `<page>.*`.** No exceptions.
3. **No inline CSS/JS.** Separate files only.
4. **`docs/BRAND-GUIDELINES.md` is the brand source of truth.**
5. **Plan, then build, then test.** No markup before plan sign-off. No "done" without test phase passing.
6. **Figma is wireframe-level.** Liberty to design beyond it.
7. **Mobile is the primary target.** Test on phone after each meaningful change.
8. **UI/UX agent participates in plan, build, and test phases.** Not optional once the agent exists.

### 5b. Path: Dheeraj

#### 5b.1 Read context (parallel)
- `CLAUDE.md` (Coding Conventions section)
- `docs/sprint/sprint-N/dheeraj.md` — his current queue
- `docs/sprint/sprint-N/abhijith.md` — Abhijith's progress on dependencies he's waiting on (read-only, for awareness)
- `docs/sprint/sprint-N/dheeraj-progress.md` — his last entries (un-synced + recent synced)

If `dheeraj.md` doesn't exist, tell Dheeraj clearly: *"No sprint digest at `docs/sprint/sprint-N/dheeraj.md`. Ask Abhijith to publish one before starting."* and stop.

#### 5b.2 Skip ClickUp entirely

Do **NOT** invoke `/clickup-pm`. Any ClickUp call from this branch is a bug. Dheeraj has no ClickUp access.

#### 5b.2.1 Start dev server

Dheeraj is always on frontend. Start `npm run dev` in background (port 3000) at session start, unless it's already running. Use Bash with `run_in_background: true`. Surface the URL to Dheeraj.

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
8. **Dev server starts with the path** — design path → `npm run design` (:4000); code paths (work on task, review Dheeraj, fix bug, codebase maintenance if browser-verifiable) → `npm run dev` (:3000); pure-PM/brainstorm/explore paths → none. Dheeraj always gets `npm run dev`. Servers are stopped at session end (see end-evenzi-session 4a.7 / Rule 8).

Begin work.
