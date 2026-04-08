# ClickUp Workspace — Quick Reference

> Evenzi ClickUp workspace IDs and structure for Claude Code sessions.

---

## Workspace Structure

```
Product (Space: 90166506901)
  ├── Ideas (List: 901614379769)
  ├── Backlog (List: 901614372136)
  ├── Development (Folder)
  │     ├── Frontend (List: 901614372123)
  │     ├── Backend (List: 901614372124)
  │     ├── Database (List: 901614372125)
  │     └── DevOps (List: 901614372126)
  ├── Design (List: 901613884694)
  ├── QA & Bugs (List: 901614372142)
  ├── Architecture & Configuration (List: 901614372190)
  └── Documentation (List: 901614372331)
```

---

## Feature Parent Tasks (MVP Phase 1)

| Feature | ID | Priority | Status |
|---------|-----|----------|--------|
| Auth & Role Selection | 86d2jwz1h | Urgent | In Progress |
| Reusable Component Library | 86d2jwz25 | Urgent | Backlog |
| Event CRUD (5-Step Wizard) | 86d2jwz3x | Urgent | Backlog |
| Host Dashboard | 86d2jwz6v | Urgent | Backlog |
| Guest Management & RSVP | 86d2jwz90 | High | Backlog |
| Digital Invitations (WhatsApp) | 86d2jwza1 | High | Backlog |
| Planning Tools (Checklist & Budget) | 86d2jwzck | Normal | Backlog |
| Media & Memories (Photo Gallery) | 86d2jwzdk | Normal | Backlog |
| Digital Presence (Event Website) | 86d2jwzge | Normal | Backlog |

---

## Other Notable Tasks

| Task | ID | List | Status |
|------|-----|------|--------|
| Fix Vercel Deployment | 86d2jmkn4 | DevOps | In Progress |
| Landing Design | 86d2dfg0d | Design | Backlog |

---

## Task Flow

```
Ideas → Backlog (when refined) → Development lists (when sprint-active)
```

---

## Where Tasks Live

| Task Type | Location |
|-----------|----------|
| Feature parents | Backlog (901614372136) |
| Subtasks | Under parents in Backlog (ClickUp nests automatically) |
| Cross-cutting standalone | Relevant Development list (DevOps, QA, etc.) |
| Design tasks | Design (901613884694) |
| Documentation tasks | Documentation (901614372331) |

---

## Quick Reference for Claude Code

| Need | How |
|------|-----|
| Default list for feature work | Backlog (`901614372136`) |
| See full task hierarchy | `clickup_get_task` with `subtasks: true` |
| See all MVP work | `clickup_filter_tasks` with tag `mvp-phase-1` |
| Task creation templates | `docs/clickup/TEMPLATES.md` |
| Task rules & guidelines | `docs/clickup/GUIDELINES.md` |
