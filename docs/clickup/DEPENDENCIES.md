# Evenzi MVP Phase 1 - Feature Dependency Map

> This document defines what blocks what in the MVP Phase 1 build order.
> Use it during sprint planning to ensure features are picked in the right sequence.

---

## 1. Dependency Graph

```
Fix Vercel Deployment (P0)
  └── blocks all production deploys

Reusable Component Library (P0)
  └── blocks ALL UI features below

Auth & Role Selection (P0, 75% done)
  └── blocks everything that needs authenticated users

Event CRUD - 5-Step Wizard (P0)
  ├── depends on: Component Library, Auth
  └── blocks: Host Dashboard, Guest Management, all downstream features

Host Dashboard (P0)
  ├── depends on: Component Library, Auth, Event CRUD
  └── blocks: nothing directly (but is the main entry point)

Guest Management & RSVP (P1)
  ├── depends on: Component Library, Auth, Event CRUD
  └── blocks: Digital Invitations

Digital Invitations - WhatsApp (P1)
  ├── depends on: Guest Management
  └── blocks: nothing

Planning Tools - Checklist & Budget (P2)
  ├── depends on: Component Library, Auth, Event CRUD
  └── blocks: nothing

Media & Memories - Photo Gallery (P2)
  ├── depends on: Component Library, Auth, Event CRUD, Supabase Storage
  └── blocks: Digital Presence (photo gallery section)

Digital Presence - Event Website (P2)
  ├── depends on: Component Library, Event CRUD, Media (for gallery)
  └── blocks: nothing
```

---

## 2. Recommended Build Order

| Sprint | Features | Rationale |
|--------|----------|-----------|
| Sprint 1 | Fix Vercel, Component Library, Auth (finish) | Unblock everything |
| Sprint 2 | Event CRUD (5-Step Wizard) | Core feature, unblocks dashboard + downstream |
| Sprint 3 | Host Dashboard, Guest Management | Main UX + guest flow |
| Sprint 4 | Digital Invitations, Planning Tools | Guest engagement + planning |
| Sprint 5 | Media & Memories, Digital Presence | Content + public pages |

---

## 3. Parallel Opportunities

| Can be parallel | Because |
|-----------------|---------|
| Component Library + Auth (finish) | Auth is backend-heavy, Component Lib is frontend-only |
| Host Dashboard + Guest Management | Both depend on Event CRUD but not on each other |
| Digital Invitations + Planning Tools | Independent features after Guest Mgmt |
| Media & Memories + Digital Presence (partial) | Gallery can start while website waits for it |

---

## 4. Cross-Cutting Dependencies

| Dependency | Needed By | Notes |
|------------|-----------|-------|
| Supabase Storage bucket | Media & Memories, User Profile (avatar) | Set up early in Sprint 1 |
| Core DB schema (events table) | Event CRUD, and everything downstream | Part of Event CRUD data modeling |
| WhatsApp API decision | Digital Invitations | Deep link vs Business API — decide in Sprint 2 |
| Twilio config | Auth (production) | Needed for production phone OTP |

---

## 5. How to Use This Doc

- Before starting a feature, check its dependencies are "done" or "approved"
- Use `clickup_get_task` on the dependency to verify status
- If a dependency is blocked, pick a feature that's unblocked
- Update this doc when dependencies change

---

## 6. References

- Feature task IDs: `docs/clickup/WORKSPACE.md`
- Task templates: `docs/clickup/TEMPLATES.md`
- Guidelines: `docs/clickup/GUIDELINES.md`
