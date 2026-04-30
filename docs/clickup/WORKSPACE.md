# ClickUp Workspace — Quick Reference

> Evenzi ClickUp workspace IDs and structure for Claude Code sessions.

---

## Workspace Structure

```
Product (Space: 90166506901)
  ├── Ideas (List: 901614379769)
  ├── Backlog (List: 901614372136)
  ├── Development (Folder: 90169191482)
  │     ├── Frontend (List: 901614372123)
  │     ├── Backend (List: 901614372124)
  │     ├── Database (List: 901614372125)
  │     ├── DevOps (List: 901614372126)
  │     └── Active Sprint (List: 901614390914)
  ├── Design (List: 901613884694)
  ├── QA & Bugs (List: 901614372142)
  ├── Architecture & Configuration (List: 901614372190)
  └── Documentation (List: 901614372331)

Growth & Marketing (Space: 90166506977)
  ├── Branding (List: 901613958817)          — Wasith leads, Abhijith reviews
  ├── Market Research (List: 901614460862)   — Cyril leads
  ├── Content & Social Media (List: 901614372137) — Wasith leads
  ├── Go-to-Market (List: 901613958976)      — Cyril leads
  └── Analytics (List: 901614372138)         — Cyril leads

Operations & Admin (Space: 90166506980)
  ├── SWOT Analysis (List: 901613960293)     — Brindo & Sreelekshmy
  ├── Policies & Terms (List: 901613884664)  — Brindo & Sreelekshmy
  ├── Finance (List: 901614372139)           — Brindo & Sreelekshmy
  ├── Internal Processes (List: 901614460865) — Brindo & Sreelekshmy
  └── HR & Team (List: 901614460867)         — Brindo & Sreelekshmy
```

---

## Feature Parent Tasks (MVP Phase 1)

### Active Sprint (Sprint 1)

| Feature | ID | Priority | Status | Subtasks |
|---------|-----|----------|--------|----------|
| User Auth & Role Selection | 86d2jwz1h | Urgent | In Progress | 10 |
| Reusable Component Library | 86d2jwz25 | Urgent | Backlog | 28 |
| Fix Vercel Deployment | 86d2jmkn4 | Urgent | Backlog | 0 |

### Backlog

| Feature | ID | Priority | Status | Subtasks |
|---------|-----|----------|--------|----------|
| Event CRUD (5-Step Wizard) | 86d2jwz3x | Urgent | Backlog | 45 |
| Host Dashboard | 86d2jwz6v | Urgent | Backlog | 21 |
| Event Management Hub | 86d2k1kz1 | Urgent | Backlog | 16 |
| Guest Management & RSVP | 86d2jwz90 | High | Backlog | 25 |
| Event Settings | 86d2k1kzq | High | Backlog | 20 |
| User Settings | 86d2k1m04 | High | Backlog | 20 |
| Planning Tools (Checklist & Budget) | 86d2jwzck | Normal | Backlog | 15 |
| Media & Memories (Photo Gallery) | 86d2jwzdk | Normal | Backlog | 25 |
| Digital Presence (Event Website) | 86d2jwzge | Normal | Backlog | Partial |
| Landing Section (Marketing Site) | 86d2k1kwh | Normal | Backlog | 0 |
| Admin Module (Full Admin Panel) | 86d2k1kye | Normal | Backlog | 0 |
| Digital Invitations (WhatsApp) | 86d2jwza1 | Low | Backlog | 0 |

**Note:** Landing, Admin, Digital Invitations, and Digital Presence still need subtasks (Batch 4 — see NEXT-SESSION.md).

---

## Other Notable Tasks

| Task | ID | List | Status |
|------|-----|------|--------|
| Landing Design | 86d2dfg0d | Design | Backlog |

---

## Task Flow

```
Ideas → Backlog (when refined) → Active Sprint (when picked for sprint) → Done
```

---

## Where Tasks Live

| Task Type | Location |
|-----------|----------|
| Sprint-active features | Active Sprint (901614390914) |
| Feature parents (not yet sprint) | Backlog (901614372136) |
| Subtasks | Under parents (ClickUp nests automatically) |
| Cross-cutting standalone | Relevant Development list (DevOps, QA, etc.) |
| Design tasks | Design (901613884694) |
| Documentation tasks | Documentation (901614372331) |

---

## Team Members

| Name | ID | Space | Role |
|------|-----|-------|------|
| Abhijith Pramod | 278583396 | All (Owner) | Project owner, reviewer, requirements |
| Dheeraj P Girish | 100996803 | Product | Frontend, Backend, QA, Integration |
| Cyril V Mathew | 101001575 | Growth & Marketing | Sales, go-to-market, market research, analytics |
| Abdul Wasith | 258600539 | Growth & Marketing | Branding, logo, content, social media |
| Brindo Sylen | 100999588 | Operations & Admin | Ops, finance, legal |
| Sreelekshmy M | 100999589 | Operations & Admin | Ops, HR, internal processes |

---

## Quick Reference for Claude Code

| Need | How |
|------|-----|
| Active Sprint list | `901614390914` |
| Backlog list | `901614372136` |
| See full task hierarchy | `clickup_get_task` with `subtasks: true` |
| See all MVP work | `clickup_filter_tasks` with tag `mvp-phase-1` |
| See sprint tasks | `clickup_filter_tasks` with list_ids `["901614390914"]` |
| Task creation templates | `docs/clickup/TEMPLATES.md` |
| Task rules & guidelines | `docs/clickup/GUIDELINES.md` |
