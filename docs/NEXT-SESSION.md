# Next Session — Pick Up Here

> Use `/start-evenzi-session` to begin (asks Abhijith / Dheeraj, then branches). It reads this file, pulls ClickUp status, and asks what to work on.

---

## Progress Tracker

### Full Document Suite (DONE — 2026-04-16)
- [x] Foundation docs (F1–F6 + Indian Events Dictionary) — `docs/foundation/`
- [x] Feature overviews for all 13 MVP modules — `docs/features/overviews/`
- [x] Ops docs (Platform Policies + Support Best Practices) — `docs/ops/`
- [x] Marketing docs (Brand Guidelines + Product Positioning) — `docs/marketing/`
- [x] PPT Script (investor + stakeholder) — `docs/presentations/`
- [x] Investor/User/Vendor Q&A scrutiny session — gaps identified and corrected
- [x] Open decisions documented — `docs/foundation/open-decisions.md`
- [ ] **5 open decisions need team discussion** — see `docs/foundation/open-decisions.md`
- [ ] **Share doc suite with Admin & Ops and Marketing & Branding teams via Google Drive**
- [ ] **Abhijith to fill 5 placeholders in `evenzi-ppt-script.docx` before presenting**

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
- [x] **Fix Vercel Deployment (S — DONE)** — Live at evenzi.vercel.app
- [ ] Reusable Component Library (L — unblocks all UI work)
- [x] **Auth & Role Selection (M — DONE)** — Google OAuth, phone OTP, role selection, middleware routing, user_profiles table, auth-routing fix landed
- [ ] Profile Completion Gate — dashboard prompt for incomplete profiles (depends on User Settings)
- [x] **Event CRUD — 4-Step Wizard (XL — IN REVIEW)** — Spec done, 14 tasks implemented, 65 tests, E2E verified, revamp delivered, UI polish enhancement closed. Awaiting feature-level review.
- [x] **Host Dashboard (M — IN REVIEW)** — Server component with real event cards, hero CTA, empty state. Awaiting review.
- [ ] **Landing Section (L — IN PROGRESS)** — Subtask hierarchy in place (9 components). Static pages (Home, Layout, Legal) intentionally skip Backend Dev per JSON-config content architecture.
- [x] **Support Chatbot (MVP — PLANNED, not implemented)** — Spec + plan + multi-agent review + ClickUp hierarchy done. Blocked on Figma. Feature task: `86d2n3jxv`. See spec `2026-04-14-chatbot-design.md` and plan `2026-04-14-chatbot-implementation.md`.
- [ ] Event Management Hub (M — central navigation for event features)
- [ ] Guest Management & RSVP (L)
- [ ] Digital Invitations — WhatsApp (M)
- [ ] Planning Tools — Checklist & Budget (L)
- [ ] Media & Memories — Photo Gallery (M)
- [ ] Digital Presence — Event Website (L)
- [ ] Event Settings (M)
- [ ] User Settings (M)
- [ ] Admin Module (L — developer monitoring panel)

---

## Context

**Event CRUD is functionally complete.** Full 4-step wizard (Type → Details → Sub-Events → Review), success screen, dashboard with real event cards, all working end-to-end. Vercel deployment is live at evenzi.vercel.app.

**What was done this session (2026-05-09 — design exploration, no ClickUp tasks):**
- Designed the **Event Management Hub / Event Control** screen end-to-end as a self-contained HTML/CSS/JS prototype at `designs/event-control.html` + `designs/hero-image.jpg`. Single source-of-truth for the per-event command center landing screen — replaces earlier Stitch drafts.
- Visual language locked: **Apple-style Liquid Glass** (themed light/dark tokens — black-tinted in light to avoid wash-out, white-tinted in dark for refraction), **Evenzi red brand** (`#BB0020` light / `#ee3f3a` dark), **Poppins** typography, claymorphism radii (24/16/9999px).
- Page composition: floating glass nav (logo + Dashboard/Website tabs + bell/theme/settings/avatar) → sticky breadcrumb → full-viewport hero (Anya & Kabir's wedding) with parallax bg image + interactive Quick Actions card + Venue/Date glass chips + 4-stat strip → "Our Journey" timeline snapshot (circular progress ring + featured "Catering menu finalisation" card + 7-step roadmap dots) → "Manage your event" 5-card bento (Guest mgmt, Invitations, Planning, Media, Website — uniform brand-red icons + numbered corners 01–05) → Up next checklist + Recent activity (both scrollable glass cards with mask-fade edges) → footer.
- Interactive layer: scroll-progress hairline at top, scroll-spy on tool rail, count-up stat numbers, progress-fill bars, IntersectionObserver-driven section reveals, mouse parallax on hero, theme persist via localStorage.
- Tested across 1280/768/375 × light/dark — all sections legible, glass elements hold up, no JS errors.
- Preview server config added to `.claude/launch.json` as `stitch-preview` (Python http.server on port 8770 from `designs/`). Original `nextjs-dev` config preserved.
- **Open follow-ups:** wire to real Next.js routes (links currently 404), add `manifest.webmanifest` for the PWA shortcut path, switch from Tailwind CDN to project Tailwind build when integrated.

**What was done previous session (2026-05-04):**
- Created `/start-evenzi-session` and `/end-evenzi-session` as **proper project skills** at `.claude/skills/start-evenzi-session/SKILL.md` and `.claude/skills/end-evenzi-session/SKILL.md`. Both ask "Who's using? (Abhijith / Dheeraj)" and branch the flow accordingly (Abhijith path = full ClickUp + Dev-Vibe; Dheeraj path = `dheeraj-progress.md` + feature branch only)
- Renamed-not-duplicated: deleted the original `.claude/skills/start-session/` and `.claude/skills/end-session/` (these were the generic ancestors; the Evenzi-specific upgrades replace them)
- Updated `.claude/skills/clickup-pm/SKILL.md` with two new modes: `sync-dheeraj-progress` (approval-gated read of un-synced entries from `dheeraj-progress.md`, push to ClickUp as comments + status updates, archive into `## Synced`) and `regenerate-digests` (overwrites per-user `abhijith.md` / `dheeraj.md` digests from current ClickUp state)
- Updated `.claude/skills/session-report/SKILL.md` references from `/end-session` → `/end-evenzi-session`
- Created `docs/sprint/README.md` — pointer to active sprint (none yet), folder layout spec, ownership matrix, append-only rules
- **Renamed `ai/agents/qa_engineer.md` → `ai/agents/test_engineer.md`** and enriched it: 3 modes (Planning / Execution / Maintenance), 10-row stack-and-coverage matrix (Vitest, Playwright, axe, Lighthouse, etc.), sad-path catalogue (auth/validation/DB/network/state/third-party/UI), test plan template that writes to `docs/test-plans/<slug>.md`, backlog of features needing backfill (Auth, Event CRUD, Host Dashboard)
- Updated all live references to the renamed agent: `ai/pipelines/feature.md`, `enhancement.md`, `bug.md`, `ai/agents/task_distributor.md` (6 places + sweet-spot row rewrite), `CLAUDE.md` (env var comment), `.claude/skills/plan-review/SKILL.md` (table + perspective bullets), `docs/foundation/team-structure.md`. Historical specs/plans (chatbot, agent-runner, mission-control) intentionally left unmodified
- Updated memory entries `project_team_split.md` and `project_dheeraj_no_clickup.md` to confirm the skills exist as files (not just references) and to instruct using `/start-evenzi-session` + `/end-evenzi-session` over the generic ancestors

**What was done previous session (2026-05-03):**
- ClickUp connection validated (workspace ID 90161512057, 3 spaces resolved)
- 6 ClickUp task transitions applied with comments:
  - Fix Vercel Deployment (`86d2jmkn4`) → done
  - UI Polish enhancement (`86d2kt2qj`) → done (revamp covered it)
  - Auth & Role Selection (`86d2jwz1h`) → already done, confirmation comment
  - Event CRUD wizard (`86d2jwz3x`) → review
  - Host Dashboard (`86d2jwz6v`) → review
  - Landing Section (`86d2k1kwh`) → in progress
- Three tasks moved from Backlog to Active Sprint to access `done`/`review` statuses
- Branch sync: force-pushed `origin/Dev-Vibe` to match `origin/Dev-Vibe-Testing` tip (`b5e4804`); the prior `078289d chore:testing main dev` commit was discarded
- Discovered + fixed status name mismatch: ClickUp uses `review` (not `in review`); GUIDELINES.md and clickup-pm/SKILL.md updated, also flagged that the Backlog list doesn't expose `done`/`review` statuses (must move to Active Sprint first)
- Installed `gh` CLI 2.92.0 via Homebrew to enable git auth from this environment

**What was done previous session (2026-04-16):**
- Created full Evenzi document suite: 50 files (25 .md + 25 .docx) across Foundation, Feature Overviews, Ops, Marketing, Presentations
- 9 parallel agents built the initial suite; 5 parallel agents refined it after a founder Q&A
- Q&A scrutinised docs from investor/user/vendor perspectives — 6 critical gaps fixed (vendor model, DPDP Act, event magazine, market sizing, PWA, guest accessibility)
- New: Indian Wedding & Events Dictionary (5 traditions, 33 sub-events, 26-term glossary)
- New: Open Decisions doc (5 decisions pending team discussion before external sharing)
- New: Session report saved to `docs/session-reports/2026-04-16-session-report.md`

**What was done previous session (2026-04-14):**
- Brainstormed + spec'd the Support Chatbot feature (MVP Phase 1)
- Wrote full implementation plan (34 tasks across Phase A/B/C)
- Multi-agent review: Tech Lead + Data Modeller + Security + Backend + Frontend + QA → 29 findings
- Revised plan with 20 fixes (6 critical + 14 important) as Revisions R1–R20
- Created ClickUp hierarchy: **Feature + 11 subtasks + 18 sub-subtasks = 30 tasks**, all dependencies set
- **Implementation intentionally deferred** — awaiting Figma designs for UI tasks
- Spec: `docs/superpowers/specs/2026-04-14-chatbot-design.md`
- Plan: `docs/superpowers/plans/2026-04-14-chatbot-implementation.md`
- Feature ClickUp task: `86d2n3jxv`

**Chatbot architecture at a glance:**
- RAG over Supabase pgvector with admin-editable FAQ
- Gemini 2.5 Flash primary + Groq Llama 3.1 8B fallback + keyword degradation (all free tier)
- Widget on most pages + `/help` page + `/admin/faq/*` CRUD + `/admin/tickets` list
- Resend email escalation for unresolved questions
- Zero paid API keys; graceful degradation when quota exhausted
- Admin analytics bot + guest-aware bot deferred to Phase 2+

**What was done previous session (2026-04-13):**
- ClickUp workspace planning: Growth & Marketing + Operations & Admin spaces restructured
- 3 list renames, 3 new lists, 32 milestone tasks created
- Full team roster documented (6 members across 3 spaces)
- Abhijith confirmed as project owner/reviewer across all spaces
- Design spec: `docs/superpowers/specs/2026-04-13-clickup-spaces-planning-design.md`

**What was built previous session (2026-04-10):**
- Design spec: `docs/superpowers/specs/2026-04-09-event-crud-design.md`
- Implementation plan: `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` (14 tasks, 23 review fixes)
- 4-agent plan review (Tech Lead, Security, Data Modeller, Frontend) — all findings addressed
- Database: 5 new tables (event_types, sub_event_types, events, event_metadata, event_sub_events) + atomic RPC
- Seed data: Wedding (enabled) + 5 disabled types + 7 wedding sub-event types
- API routes: GET event-types, GET sub-events, POST/GET events, GET event detail
- Types + Zod validation: 17 tests for schemas + validateDynamicFields
- Wizard state: React Context + useReducer with 11 tests
- 8 wizard components: Shell, Progress, Steps 1-4, EventTypeCard, SubEventCard
- Success screen (server component)
- Dashboard: converted to server component + client EventsGrid
- Middleware: host-role guard for /events routes
- Event placeholder page (until dashboard feature is built)
- Shared ICON_MAP utility (lib/utils/icons.ts)
- Enhancement task created for UI polish (86d2kt2qj)
- Full E2E test in Chrome, code review with all fixes applied
- 65/65 tests, build passes, 18 commits on worktree branch

**ClickUp state (after 2026-05-03):**
- Fix Vercel Deployment (86d2jmkn4) → done
- Auth & Role Selection (86d2jwz1h) → done
- UI Polish enhancement (86d2kt2qj) → done
- Event CRUD wizard (86d2jwz3x) → review (awaiting feature-level approval)
- Host Dashboard (86d2jwz6v) → review
- Landing Section (86d2k1kwh) → in progress
- Spec & Architecture: Event CRUD (86d2k1mq4) → done

**Database (Supabase):**
- `user_profiles` — existing (3 users)
- `event_types` — 6 rows (1 enabled: Wedding)
- `sub_event_types` — 7 rows (wedding sub-events)
- `events` — has test data from E2E (Aarav & Ishani's Wedding)
- `event_metadata` — partner name key-value pairs
- `event_sub_events` — 3 sub-events (Wedding Ceremony, Reception, Sangeet)
- `create_event_with_details` RPC — atomic insert with auth.uid()

## How To Resume

### Immediate Next Steps

1. **Team discussion on 5 open decisions** (`docs/foundation/open-decisions.md`) — pricing, free tier limits, magazine name, WhatsApp approach, vendor plan name
2. **Share document suite via Google Drive** — Admin & Ops and Marketing & Branding teams
3. **Abhijith fills PPT placeholders** — fund ask, bios, pricing limits, timeline, contact
4. **Review Event CRUD wizard + Host Dashboard** (`86d2jwz3x`, `86d2jwz6v` — both `review`) — sign off or send back with feedback. Approving unblocks Component QA / Integration Testing.
5. **Landing Section** (`86d2k1kwh` — `in progress`) — Spec & Architecture is the next phase to start (subtask `86d2k1n3d`).
6. **Event CRUD Data Modeling** (`86d2k1mqc`) — Spec is done, tables exist. Mark done or refine if schema changes are needed.
7. **Fix Success Screen redirect** — Server component may have cookie/auth issue. Test on Dev-Vibe directly.
8. **Agent enrichment (remaining Medium agents)** — backend_engineer, data_modeller, tech_lead, product_manager (test_engineer was enriched + renamed from qa_engineer on 2026-05-04)

### Known Issues
- Success screen redirects to /home instead of rendering (cookie issue)
- UI needs significant polish to match Figma (enhancement task created)
- Missing test for GET /api/events/[id] route
- Progress bar initially shows "Step 1 of 3" before type selection (totalSteps defaults to 4 but renders 3)
- Zod upgraded to v4 (was v3) — z.record() syntax changed

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `docs/superpowers/specs/2026-04-09-event-crud-design.md` | Event CRUD design spec (approved) |
| `docs/superpowers/plans/2026-04-09-event-crud-implementation.md` | Implementation plan (14 tasks, 23 review fixes) |
| `docs/superpowers/specs/2026-04-08-auth-role-selection-design.md` | Auth design spec |
| `docs/BRAND-GUIDELINES.md` | Brand token template (placeholder values) |
| `docs/clickup/WORKSPACE.md` | All ClickUp IDs, workspace structure |
| `docs/PROJECT.md` | Full feature descriptions, DB plans |
| `CLAUDE.md` | Project guide, conventions, parallel subagents |
