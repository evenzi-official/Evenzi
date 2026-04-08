# Next Session — Pick Up Here

> Use `/start-session` to begin. It reads this file, pulls ClickUp status, and asks what to work on.

---

## Progress Tracker

### Phase 1: ClickUp Setup (DONE)
- [x] Create Ideas list in Product space
- [x] Create workflow tags and assign to all existing tasks
- [x] Retroactive tracking — mark completed work (auth, designs, env vars)
- [x] Move post-MVP tasks to Ideas list
- [x] Update CLAUDE.md, ONBOARDING.md, PROJECT.md

### Phase 2: Feature Task Creation (DONE)
- [x] Create 9 feature parent tasks with descriptions and dependencies
- [x] Set feature dependencies in ClickUp
- [x] Clean up standalone tasks (deleted 32 flat tasks that didn't fit hierarchy)
- [x] Create `docs/clickup/` folder with 5 reference docs (TEMPLATES, GUIDELINES, WORKSPACE, INTAKE, DEPENDENCIES)
- [x] Add parallel subagent instructions to CLAUDE.md and start-session skill

### Phase 3: Implementation (NOT STARTED)
- [ ] Fix Vercel Deployment (S — unblocks production)
- [ ] Reusable Component Library (L — unblocks all UI work)
- [ ] Auth & Role Selection (M — 75% done, Role Selection remaining)
- [ ] Event CRUD — 5-Step Wizard (XL — core feature)
- [ ] Host Dashboard (M — needs Event CRUD data)
- [ ] Guest Management & RSVP (L)
- [ ] Digital Invitations — WhatsApp (M)
- [ ] Planning Tools — Checklist & Budget (L)
- [ ] Media & Memories — Photo Gallery (M)
- [ ] Digital Presence — Event Website (L)

---

## Context

ClickUp has 9 feature parent tasks in Backlog (no subtasks yet — those get created during brainstorm/plan when we start each feature). All standalone dev tasks were deleted. A full `docs/clickup/` folder provides templates, guidelines, workspace IDs, intake process, and dependency map.

**ClickUp state:**
- 9 feature parents (Backlog) — intact with descriptions and dependencies
- Fix Vercel Deployment (DevOps) — in progress
- 7 done tasks (designs + env vars) — intact
- Landing design task — intact
- No subtasks exist yet — created per-feature during implementation

## How To Resume

### Step 1: Pick a Feature

Use `/start-session`. It pulls ClickUp status and presents options.

**Recommended first features (Sprint 1):**
- Reusable Component Library (86d2jwz25) — blocks all UI work
- Auth & Role Selection (86d2jwz1h) — 75% done, can parallel with Component Library

See `docs/clickup/DEPENDENCIES.md` for full sprint order.

### Step 2: Brainstorm & Create Subtasks

For the chosen feature:
1. Run superpowers brainstorm to discover components
2. Create subtasks using templates from `docs/clickup/TEMPLATES.md`
3. Follow guidelines in `docs/clickup/GUIDELINES.md`
4. Content gets populated from brainstorm/plan output (never generic placeholders)

### Step 3: Implement

For each component: superpowers workflow (brainstorm → plan → implement → review) with approval gates.

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/clickup/TEMPLATES.md` | 11 task templates for ClickUp |
| `docs/clickup/GUIDELINES.md` | Task creation rules, naming, statuses |
| `docs/clickup/WORKSPACE.md` | All ClickUp IDs, workspace structure |
| `docs/clickup/INTAKE.md` | Feature/bug/enhancement intake process |
| `docs/clickup/DEPENDENCIES.md` | Feature dependency map, sprint order |
| `docs/PROJECT.md` | Full feature descriptions, DB plans |
| `CLAUDE.md` | Project guide, conventions, parallel subagents |

## ClickUp IDs

Moved to `docs/clickup/WORKSPACE.md` — single source of truth for all IDs.
