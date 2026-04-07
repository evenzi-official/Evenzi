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

### Phase 2: Feature Task Creation (NEXT)
- [ ] Create feature parent task: Auth & Role Selection
- [ ] Create feature parent task: Reusable Component Library
- [ ] Create feature parent task: Event CRUD (5-Step Wizard)
- [ ] Create feature parent task: Host Dashboard
- [ ] Create feature parent task: Guest Management & RSVP
- [ ] Create feature parent task: Digital Invitations (WhatsApp)
- [ ] Create feature parent task: Planning Tools (Checklist & Budget)
- [ ] Create feature parent task: Media & Memories (Photo Gallery)
- [ ] Create feature parent task: Digital Presence (Event Website)
- [ ] Set feature dependencies in ClickUp

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

ClickUp workspace is set up with Ideas list, workflow tags, and retroactive tracking. 11 task templates are designed. No feature parent tasks created yet in ClickUp.

## How To Resume

### Step 1: Create Feature Parent Tasks in ClickUp

Create these as parent tasks in the Backlog list using the Feature Definition template from `docs/superpowers/specs/2026-04-08-clickup-task-templates-design.md`:

1. **Feature: Auth & Role Selection** — 75% done, Role Selection screen remaining
2. **Feature: Reusable Component Library** — foundation, blocks everything else
3. **Feature: Event CRUD (5-Step Wizard)** — core feature, XL size
4. **Feature: Host Dashboard** — shell exists, needs real data
5. **Feature: Guest Management & RSVP** — depends on Event CRUD
6. **Feature: Digital Invitations (WhatsApp)** — depends on Guest Management
7. **Feature: Planning Tools (Checklist & Budget)** — depends on Event CRUD
8. **Feature: Media & Memories (Photo Gallery)** — depends on Event CRUD
9. **Feature: Digital Presence (Event Website)** — depends on Event CRUD + Media

Full descriptions for each are in `docs/superpowers/plans/2026-04-08-clickup-setup-mvp-tasks.md` (Tasks 3-12).

### Step 2: Set Feature Dependencies

Once parent tasks exist:
- Component Library → blocks → all features
- Fix Vercel → blocks → all releases
- Auth → blocks → Dashboard
- Event CRUD → blocks → Guest, Planning, Media, Website
- Guest Management → blocks → Digital Invitations

### Step 3: Pick First Feature for Implementation

For each feature picked: create component subtasks → create dev phase subtasks → start implementation using superpowers workflow (brainstorm → plan → subagent-driven-development → code-review).

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
