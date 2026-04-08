# Pending ClickUp Tasks

> Tasks to create when ClickUp connector recovers. Delete entries after creating.

---

## 1. Profile Completion Gate — dashboard prompt for incomplete profiles

**List:** Backlog (901614372136)
**Priority:** High
**Tags:** mvp-phase-1, phase:frontend, claude-code

**Description:**

DB migration already applied (email, phone, auth_provider columns added to user_profiles). Phone users now get `display_name = NULL` instead of their phone number.

**What needs building:**
- Dashboard shows "Complete your profile" banner/modal when `display_name IS NULL`
- User cannot interact with dashboard actions until profile is complete
- Banner links to `/settings/profile` (User Settings page — task `86d2k1m04`)
- Once `display_name` is set, banner disappears and dashboard is fully interactive
- Gate logic: `display_name IS NOT NULL`

**Dependencies:**
- Depends on: User Auth & Role Selection (DONE)
- Depends on: User Settings feature (`86d2k1m04`) for the actual profile edit form
- The gate/prompt can be built before User Settings — just show the banner with a disabled link until settings page exists

---

## 2. Update subtask statuses for Auth & Role Selection (86d2jwz1h)

All subtasks need status set to "done":
- `86d2k1mmu` — Data Modeling
- `86d2k1muc` — Component: Role Selection
- `86d2k1n2h` — UI/UX Design
- `86d2k1ndm` — Frontend Dev
- `86d2k1n3p` — Backend Dev
- `86d2k1n3x` — Component QA
- `86d2k1mmz` — Integration Testing
- `86d2k1mn9` — Documentation

Also update parent task `86d2jwz1h` status to "done".
