# Next Session — Pick Up Here

> Paste this into a new Claude Code session to resume MVP sprint planning.
> Read `docs/PROJECT.md` for full feature context if needed.

---

## Progress Tracker

### Phase 1: ClickUp Setup (DONE)
- [x] Create Ideas list in Product space
- [x] Create workflow tags and assign to all existing tasks
- [x] Retroactive tracking — mark completed work (auth, designs, env vars)
- [x] Move post-MVP tasks to Ideas list
- [x] Update CLAUDE.md, ONBOARDING.md, PROJECT.md

### Phase 2: Feature Task Creation (DONE)
- [x] Create feature parent task: Auth & Role Selection (86d2jwz1h)
- [x] Create feature parent task: Reusable Component Library (86d2jwz25)
- [x] Create feature parent task: Event CRUD (5-Step Wizard) (86d2jwz3x)
- [x] Create feature parent task: Host Dashboard (86d2jwz6v)
- [x] Create feature parent task: Guest Management & RSVP (86d2jwz90)
- [x] Create feature parent task: Digital Invitations (WhatsApp) (86d2jwza1)
- [x] Create feature parent task: Planning Tools (Checklist & Budget) (86d2jwzck)
- [x] Create feature parent task: Media & Memories (Photo Gallery) (86d2jwzdk)
- [x] Create feature parent task: Digital Presence (Event Website) (86d2jwzge)
- [x] Set feature dependencies in ClickUp

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

ClickUp workspace is fully set up: Ideas list, workflow tags, retroactive tracking, and all 9 feature parent tasks created with descriptions and dependencies. `/start-session` and `/end-session` skills are available. All docs up to date as of 2026-04-08.

## How To Resume

### Step 1: Pick a Feature for Implementation

Use `/start-session` to pull ClickUp status and choose what to work on. Feature parent tasks exist in Backlog — next step is to create component subtasks and dev phase subtasks for the chosen feature.

**Recommended first feature:** Reusable Component Library (86d2jwz25) — blocks all other features.

### Step 2: Create Component Subtasks

For the chosen feature, create component subtasks under the parent task using the Component template from `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`. Then create dev phase subtasks (UI/UX → Frontend → Backend → QA) under each component.

### Step 3: Start Implementation

For each component: use superpowers workflow (brainstorm → plan → subagent-driven-development → code-review).

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/PROJECT.md` | Living project overview — what Evenzi is, all features explained |
| `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md` | 11 task templates + ClickUp structure |
| `docs/superpowers/plans/2026-04-08-clickup-setup-mvp-tasks.md` | Full implementation plan with feature descriptions |
| `CLAUDE.md` | Project guide with MVP table, task hierarchy, ClickUp tags |
| `docs/ONBOARDING.md` | Developer onboarding |

## ClickUp IDs

| Resource | ID |
|----------|----|
| Product space | 90166506901 |
| Ideas list | 901614379769 |
| Backlog list | 901614372136 |
| Frontend list | 901614372123 |
| Backend list | 901614372124 |
| Database list | 901614372125 |
| DevOps list | 901614372126 |
| Design list | 901613884694 |
| QA & Bugs list | 901614372142 |
| Fix Vercel task | 86d2jmkn4 |
| Fix Google Login task | 86d2jme5c |
| Feature: Auth & Role Selection | 86d2jwz1h |
| Feature: Reusable Component Library | 86d2jwz25 |
| Feature: Event CRUD (5-Step Wizard) | 86d2jwz3x |
| Feature: Host Dashboard | 86d2jwz6v |
| Feature: Guest Management & RSVP | 86d2jwz90 |
| Feature: Digital Invitations (WhatsApp) | 86d2jwza1 |
| Feature: Planning Tools (Checklist & Budget) | 86d2jwzck |
| Feature: Media & Memories (Photo Gallery) | 86d2jwzdk |
| Feature: Digital Presence (Event Website) | 86d2jwzge |
