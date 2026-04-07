# Next Session — Pick Up Here

> Paste this into a new Claude Code session to resume MVP sprint planning.

## Context

ClickUp workspace is set up with Ideas list, workflow tags, and retroactive tracking. 11 task templates are designed. No feature parent tasks created yet.

## What To Do Next

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

**Recommended order:**
1. Fix Vercel Deployment (S — unblocks production)
2. Reusable Component Library (L — unblocks all UI work)
3. Auth & Role Selection (M — 75% done, quick win)
4. Event CRUD (XL — core feature, unblocks everything)
5. Host Dashboard (M — needs Event CRUD data)
6. Guest Management & RSVP (L)
7. Digital Invitations (M)
8. Planning Tools (L)
9. Media & Memories (M)
10. Digital Presence (L)

For each feature: create component subtasks → create dev phase subtasks → start implementation using superpowers workflow (brainstorm → plan → subagent-driven-development → code-review).

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
