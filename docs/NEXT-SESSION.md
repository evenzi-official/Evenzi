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

### Phase 2: Feature Task Creation (MOSTLY DONE)
- [x] Create 9 feature parent tasks with descriptions and dependencies
- [x] Set feature dependencies in ClickUp
- [x] Clean up standalone tasks (deleted 32 flat tasks that didn't fit hierarchy)
- [x] Create `docs/clickup/` folder with 5 reference docs (TEMPLATES, GUIDELINES, WORKSPACE, INTAKE, DEPENDENCIES)
- [x] Add parallel subagent instructions to CLAUDE.md and start-session skill
- [x] Expand to 14 feature parents (added Landing, Admin, Event Mgmt Hub, Event Settings, User Settings)
- [x] Create full subtask hierarchy — 237 tasks across 10 features (Batches 1-3)
- [ ] **Batch 4 — remaining subtasks needed for:** Landing Section (86d2k1kwh), Admin Module (86d2k1kye), Digital Invitations (86d2jwza1), Digital Presence (86d2jwzge — partial, 1 component exists)
- [x] Sprint ClickApp enabled on all spaces

### Phase 2.5: Sprint Setup (NOT STARTED)
- [ ] Create Sprint 1 and assign features (Fix Vercel, Component Library, Auth)
- [ ] Create Sprint 2+ and assign remaining features per dependency order

### Phase 3: Implementation (IN PROGRESS)
- [ ] Fix Vercel Deployment (S — unblocks production)
- [ ] Reusable Component Library (L — unblocks all UI work)
- [x] **Auth & Role Selection (M — DONE)** — Google OAuth fixed, Role Selection page built, middleware routing, user_profiles table
- [ ] Profile Completion Gate — dashboard prompt for incomplete profiles (depends on User Settings)
- [ ] Event CRUD — 5-Step Wizard (XL — core feature)
- [ ] Host Dashboard (M — needs Event CRUD data)
- [ ] Event Management Hub (M — central navigation for event features)
- [ ] Guest Management & RSVP (L)
- [ ] Digital Invitations — WhatsApp (M)
- [ ] Planning Tools — Checklist & Budget (L)
- [ ] Media & Memories — Photo Gallery (M)
- [ ] Digital Presence — Event Website (L)
- [ ] Event Settings (M)
- [ ] User Settings (M)
- [ ] Landing Section (L — marketing site)
- [ ] Admin Module (L — developer monitoring panel)

---

## Context

**Auth & Role Selection is DONE.** All 10 implementation tasks completed, Google OAuth and Phone OTP verified end-to-end in Chrome.

**What was built this session (2026-04-08):**
- `user_profiles` table with triggers (auto-create, updated_at, role immutability) + RLS
- Added email, phone, auth_provider columns (second migration)
- Phone users get NULL display_name (not phone number)
- Role Selection page at `/auth/role-selection` (Host active, Vendor "Coming Soon")
- Middleware role-based routing (no-role → role-selection, has-role → dashboard)
- Fixed Google OAuth PKCE (upgraded @supabase/ssr 0.1.0 → 0.10.0)
- Fixed OAuth callback open redirect vulnerability
- Updated auth page (Evenzi branding, separate loading states, footer, cleaned types/logs)
- Updated home page (Evenzi branding, removed redundant auth check, brand tokens)
- Brand CSS tokens in globals.css + BRAND-GUIDELINES.md template
- Frontend engineer agent: added Component Reusability section
- 22 automated tests passing, lint clean (our changes)

**ClickUp state:**
- Auth & Role Selection subtasks: all DONE (need status update — see `docs/clickup/PENDING-TASKS.md`)
- Profile Completion Gate task needs creating (saved in PENDING-TASKS.md)
- ClickUp connector was rate-limited — pending tasks saved locally

**Database (Supabase):**
- `user_profiles` table: id, role, display_name, avatar_url, onboarding_completed, email, phone, auth_provider, created_at, updated_at
- 3 users exist: 1 phone (display_name NULL), 2 Google (names populated)
- RLS enabled, role immutability trigger active

## How To Resume

### Immediate Next Steps

1. **Create pending ClickUp tasks** from `docs/clickup/PENDING-TASKS.md` (Profile Completion Gate + update Auth subtask statuses)
2. **Pick next feature** — recommended order:
   - Fix Vercel Deployment (P0, unblocks production)
   - Reusable Component Library (P0, unblocks all UI work)
   - Event CRUD 5-Step Wizard (P0, core feature, includes host onboarding)
3. **Phone OTP config:** Test phone number configured in Supabase dashboard (919999999999=123456, valid until June 30 2026)

### Known gaps (not blockers)
- Phone users have no display_name — needs Profile Completion Gate + User Settings page
- Brand guidelines are placeholder — colors/fonts not finalized
- Vercel deployments still in ERROR state (pre-existing)

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md` | Design spec (reviewed by 3 agents) |
| `docs/superpowers/plans/2026-04-08-auth-role-selection.md` | Implementation plan (10 tasks) |
| `docs/BRAND-GUIDELINES.md` | Brand token template (placeholder values) |
| `docs/clickup/PENDING-TASKS.md` | ClickUp tasks to create (connector was down) |
| `docs/clickup/TEMPLATES.md` | 11 task templates for ClickUp |
| `docs/clickup/WORKSPACE.md` | All ClickUp IDs, workspace structure |
| `docs/PROJECT.md` | Full feature descriptions, DB plans |
| `CLAUDE.md` | Project guide, conventions, parallel subagents |
