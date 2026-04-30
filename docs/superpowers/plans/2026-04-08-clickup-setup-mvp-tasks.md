# ClickUp Setup & MVP Phase 1 Task Creation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up ClickUp workspace with Ideas list, tags, and create all MVP Phase 1 feature tasks using the approved template structure — including retroactive tracking of already-completed work.

**Architecture:** All work is ClickUp API operations via MCP tools. No code changes. Tasks follow the 3-level hierarchy: Feature → Components → Dev Phases. Each feature gets the full template treatment from the design spec.

**Tech Stack:** ClickUp MCP tools, markdown task descriptions

---

## Task 1: Create Ideas List & Tags

**What:** Add the "Ideas" list to the Product space and create all workflow tags.

- [ ] **Step 1: Create the Ideas list in Product space**

Use `clickup_create_list` with:
- name: "Ideas"
- space_name: "Product"
- content: "Raw feature ideas and brainstorms. When refined with scope + user stories, promote to Backlog."

- [ ] **Step 2: Create workflow tags by adding them to a temporary task**

ClickUp tags must exist on a task first. Create tags by adding them to any existing task, then removing. Tags needed:
- `mvp-phase-1`
- `feature`
- `component`
- `phase:spec`
- `phase:data-model`
- `phase:ui-ux`
- `phase:frontend`
- `phase:backend`
- `phase:qa`
- `phase:integration`
- `phase:docs`
- `phase:release`
- `approval-gate`
- `claude-code`
- `done`
- `in-progress`

Use `clickup_add_tag_to_task` on an existing backlog task to create each tag in the space, then `clickup_remove_tag_from_task` to clean up.

- [ ] **Step 3: Verify Ideas list and tags exist**

Use `clickup_get_workspace_hierarchy` and `clickup_search` to confirm.

---

## Task 2: Update Existing Completed Work — Auth & Infrastructure

**What:** Update existing tasks to reflect current status. Auth is DONE. Mark completed tasks accurately.

- [ ] **Step 1: Update "Fix Vercel deployment errors" task (86d2jmkn4)**

Use `clickup_update_task`:
- status: "in progress" (pre-existing issue, not resolved)
- Add tag: `mvp-phase-1`

- [ ] **Step 2: Update "Fix Google Login" task (86d2jme5c)**

Use `clickup_update_task`:
- status: "backlog"
- Add tag: `mvp-phase-1`
- Add comment: "Google OAuth callback is functional. Need to verify this is still an issue."

- [ ] **Step 3: Update infrastructure tasks that are already done**

Update "Set up environment variables for all services" (86d2jmkrg):
- status: "done"
- Add comment: ".env.local configured with Supabase, LLM providers, ClickUp, Resend credentials"

- [ ] **Step 4: Clean up duplicate/stale tasks**

Review existing tasks in Frontend, Backend, Database lists. Many are high-level placeholders that will be replaced by the new template-based feature tasks. Add comment to each: "Replaced by structured feature task [link]" and move to backlog or close as appropriate. Do NOT delete — just mark as superseded.

---

## Task 3: Create Feature — Auth & Role Selection

**What:** Create the full feature task hierarchy for Auth. Most of this is DONE, so tasks get marked accordingly.

- [ ] **Step 1: Create parent feature task**

Use `clickup_create_task` in Backlog list (901614372136):
- name: "Feature: Auth & Role Selection"
- tags: ["feature", "mvp-phase-1"]
- priority: "urgent"
- status: "in progress"
- markdown_description: Feature template filled with:

```markdown
## 📦 Feature: Auth & Role Selection

### Summary
Users can create an account (Phone OTP or Google OAuth), log in, and select their role as Host/Event Owner. Vendor role is deferred post-MVP.

### User Stories
- As a new user, I want to sign up with my phone number so I can create an account quickly
- As a returning user, I want to log in with Google so I can access my events without remembering a password
- As a new user, I want to select my role (Host) so the platform is personalized for my needs

### Scope
**In Scope:**
- [x] Phone OTP signup/login (India +91)
- [x] Google OAuth signup/login
- [x] Session management and route protection
- [ ] Role selection screen (Host only for MVP)
- [ ] Post-role-selection redirect to dashboard

**Out of Scope:**
- Vendor role and vendor flows
- Email/password auth
- Multi-factor authentication

### Components Breakdown
| Component | Description | Priority | Status |
|-----------|-------------|----------|--------|
| Phone OTP Auth | Sign up and login via phone | P0 | DONE |
| Google OAuth | Sign up and login via Google | P0 | DONE |
| Session Management | Middleware, route protection | P0 | DONE |
| Role Selection | Host/Vendor selection screen | P0 | NOT STARTED |

### Success Metrics
- User can sign up, log in, and reach the dashboard in under 30 seconds
- Session persists across page refreshes
- Protected routes redirect unauthenticated users

### Design References
- Stitch: Login/Sign Up screens (multiple variants designed)
- Stitch: Role Selection screens (3 design variants)

### Dependencies
- Supabase Auth configured (DONE)
- Twilio for production Phone OTP (NOT configured)

### Estimated Complexity
- T-shirt size: M
- Estimated components: 4
- Risk: Twilio setup for production phone auth

### Acceptance Criteria (Feature-Level)
- [x] User can sign up with phone OTP
- [x] User can sign up with Google OAuth
- [x] Sessions are managed and routes protected
- [ ] Role selection screen works and persists choice
- [ ] Full flow: landing → auth → role select → dashboard
```

- [ ] **Step 2: Create component subtasks**

Create 4 component subtasks under the feature task:

**Component: Phone OTP Auth** (status: done)
- name: "Component: Phone OTP Authentication"
- parent: [feature task id]
- status: "done"
- tags: ["component", "mvp-phase-1", "done"]
- markdown_description: Component template with status note "Fully implemented in app/auth/page.tsx"

**Component: Google OAuth** (status: done)
- name: "Component: Google OAuth"
- parent: [feature task id]
- status: "done"
- tags: ["component", "mvp-phase-1", "done"]
- markdown_description: Component template with status note "Fully implemented. Callback at app/auth/callback/route.ts"

**Component: Session Management** (status: done)
- name: "Component: Session Management & Route Protection"
- parent: [feature task id]
- status: "done"
- tags: ["component", "mvp-phase-1", "done"]
- markdown_description: Component template with status note "middleware.ts + lib/supabase/ fully functional"

**Component: Role Selection** (status: to do)
- name: "Component: Role Selection Screen"
- parent: [feature task id]
- status: "to do"
- tags: ["component", "mvp-phase-1", "claude-code"]
- priority: "high"
- markdown_description: Full component template

- [ ] **Step 3: Create dev phase subtasks for Role Selection component**

Under "Component: Role Selection Screen", create:

1. "UI/UX Design: Role Selection" — tags: ["phase:ui-ux", "approval-gate", "claude-code"]
   Status: to do. Design exists in Stitch (3 variants). Task is to finalize which variant and document states.

2. "Frontend Dev: Role Selection" — tags: ["phase:frontend", "approval-gate", "claude-code"]
   Status: backlog. Depends on UI/UX approval.

3. "Backend Dev: Role Selection" — tags: ["phase:backend", "approval-gate", "claude-code"]
   Status: backlog. Needs DB column for user role + API endpoint.

4. "Component QA: Role Selection" — tags: ["phase:qa", "approval-gate"]
   Status: backlog.

Each with full phase-specific template content.

---

## Task 4: Create Feature — Host Dashboard

**What:** Full feature task hierarchy for the Host Dashboard.

- [ ] **Step 1: Create parent feature task**

Use `clickup_create_task` in Backlog list:
- name: "Feature: Host Dashboard"
- tags: ["feature", "mvp-phase-1"]
- priority: "urgent"
- markdown_description:

```markdown
## 📦 Feature: Host Dashboard

### Summary
The main landing page after login. Shows the user's events in a grid/card layout with a hero CTA to create a new event. This is the central hub for event management.

### User Stories
- As a host, I want to see all my events at a glance so I can quickly access any event
- As a host, I want to create a new event from the dashboard so I can get started quickly
- As a host with no events, I want to see a clear CTA so I know how to get started

### Scope
**In Scope:**
- [ ] Event cards grid showing user's events
- [ ] Hero section with "Create New Event" CTA
- [ ] Empty state for new users (no events yet)
- [ ] Navigation/sidebar
- [ ] Event card showing: cover image, title, date, guest count, RSVP stats

**Out of Scope:**
- Event search/filtering (post-MVP)
- Notifications center
- Analytics widgets

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Dashboard Layout | Sidebar + main content area | P0 |
| Event Cards Grid | Grid of event summary cards | P0 |
| Hero/CTA Section | "Ready to plan?" banner with create button | P0 |
| Empty State | First-time user experience | P1 |

### Design References
- Stitch: Host Management Dashboard (2 variants — dark and light)

### Dependencies
- Auth & Role Selection feature (in progress)
- Event CRUD feature (for real event data)

### Estimated Complexity
- T-shirt size: M
- Estimated components: 4

### Acceptance Criteria (Feature-Level)
- [ ] Dashboard loads after login with user's events
- [ ] Event cards display correct data
- [ ] Empty state shown for new users
- [ ] "Create Event" CTA navigates to event creation wizard
- [ ] Mobile responsive
```

- [ ] **Step 2: Create Spec & Architecture subtask**

- name: "Spec & Architecture: Host Dashboard"
- parent: [feature task id]
- tags: ["phase:spec", "approval-gate", "claude-code"]
- status: "to do"
- Full spec template

- [ ] **Step 3: Create component subtasks**

4 components: Dashboard Layout, Event Cards Grid, Hero/CTA Section, Empty State.
Each with full component template.

- [ ] **Step 4: Create dev phase subtasks for each component**

Each component gets: UI/UX Design → Frontend Dev → Component QA
(No Backend Dev for dashboard — it reads from Event CRUD APIs)

---

## Task 5: Create Feature — Event CRUD (5-Step Wizard)

**What:** The core event creation and management feature.

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Event CRUD (5-Step Creation Wizard)"
- tags: ["feature", "mvp-phase-1"]
- priority: "urgent"
- markdown_description:

```markdown
## 📦 Feature: Event CRUD (5-Step Creation Wizard)

### Summary
Hosts can create events through a 5-step wizard (Event Type → Basic Details → Sub-Events → Template Selection → Review & Confirm), view event details, edit events, and delete events.

### User Stories
- As a host, I want to create a wedding event step-by-step so the process isn't overwhelming
- As a host, I want to select sub-events (ceremony, reception, etc.) so I can organize my wedding
- As a host, I want to choose a website template so my event has a digital presence
- As a host, I want to review all details before confirming so I don't make mistakes
- As a host, I want to edit my event after creation so I can update details as plans change

### Scope
**In Scope:**
- [ ] 5-step creation wizard with progress indicator
- [ ] Step 1: Event type selection (Wedding, Birthday, Corporate, etc.)
- [ ] Step 2: Basic details (name, date, venue, description)
- [ ] Step 3: Sub-event selection (ceremony, reception, mehendi, etc.)
- [ ] Step 4: Website template selection
- [ ] Step 5: Review & confirm
- [ ] Event detail view
- [ ] Event edit (re-enter wizard with pre-filled data)
- [ ] Event delete with confirmation

**Out of Scope:**
- Event sharing/collaboration
- Event duplication
- Event templates (pre-built event configurations)

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Wizard Shell | Progress bar, step navigation, shared state | P0 |
| Step 1: Event Type | Type cards with images | P0 |
| Step 2: Basic Details | Form with date picker, location, etc. | P0 |
| Step 3: Sub-Events | Selectable sub-event cards | P0 |
| Step 4: Template Selection | Website template gallery | P1 |
| Step 5: Review & Confirm | Summary with edit links per section | P0 |
| Event Detail View | Read-only event page | P0 |
| Event Edit | Re-enter wizard with data | P1 |

### Design References
- Stitch: 5-step wizard screens (all steps designed)

### Dependencies
- Database schema for events, sub_events tables
- Auth (user must be logged in)
- Supabase Storage for event cover images

### Estimated Complexity
- T-shirt size: XL
- Estimated components: 8
- Risk: Wizard state management across 5 steps

### Acceptance Criteria (Feature-Level)
- [ ] User can complete full 5-step wizard and create an event
- [ ] Event appears on dashboard after creation
- [ ] User can view event details
- [ ] User can edit event (returns to wizard with data)
- [ ] User can delete event with confirmation
- [ ] Wizard preserves state when navigating back/forward between steps
```

- [ ] **Step 2: Create Spec & Architecture subtask**
- [ ] **Step 3: Create Data Modeling subtask**

Core tables: `events`, `event_types`, `sub_events`, `event_sub_events` (junction), `website_templates`

- [ ] **Step 4: Create component subtasks (8 components)**
- [ ] **Step 5: Create dev phase subtasks for each component**
- [ ] **Step 6: Create Integration Testing subtask**
- [ ] **Step 7: Create Feature Documentation subtask**
- [ ] **Step 8: Create Release & Deployment subtask**

---

## Task 6: Create Feature — Guest Management & RSVP

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Guest Management & RSVP"
- tags: ["feature", "mvp-phase-1"]
- priority: "high"
- markdown_description:

```markdown
## 📦 Feature: Guest Management & RSVP

### Summary
Hosts can manage their guest list, track RSVPs, and view guest statistics. Guests can respond to invitations with yes/no/maybe.

### User Stories
- As a host, I want to add guests to my event so I can track who's invited
- As a host, I want to see RSVP statistics so I know how many people are coming
- As a host, I want to filter/search my guest list so I can find specific guests quickly
- As a guest, I want to RSVP to an event so the host knows I'm coming

### Scope
**In Scope:**
- [ ] Guest list CRUD (add, edit, remove guests)
- [ ] RSVP status tracking (pending, yes, no, maybe)
- [ ] RSVP statistics dashboard (counts, percentages)
- [ ] Guest search and filtering
- [ ] Public RSVP response page (guest-facing)
- [ ] Bulk guest import (CSV)

**Out of Scope:**
- Seating arrangements
- Meal preferences
- Plus-one management
- Guest grouping by sub-event (post-MVP enhancement)

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Guest List Table | Sortable, searchable guest table | P0 |
| Add/Edit Guest | Modal form for guest details | P0 |
| RSVP Stats Card | Summary statistics widget | P0 |
| Public RSVP Page | Guest-facing response page | P0 |
| Bulk Import | CSV upload for guest list | P1 |

### Design References
- Stitch: Guest Management dashboard view
- Stitch: RSVP statistics (154 guests, 65% bar)

### Dependencies
- Event CRUD (guests belong to events)
- Database schema for guests, rsvp_responses

### Estimated Complexity
- T-shirt size: L
- Estimated components: 5

### Acceptance Criteria (Feature-Level)
- [ ] Host can add, edit, delete guests
- [ ] RSVP stats update in real-time as guests respond
- [ ] Public RSVP page works without authentication
- [ ] Guest list supports search and filtering
```

- [ ] **Step 2: Create Spec & Architecture subtask**
- [ ] **Step 3: Create Data Modeling subtask**

Tables: `guests`, `rsvp_responses`

- [ ] **Step 4: Create component subtasks (5 components)**
- [ ] **Step 5: Create dev phase subtasks for each component**
- [ ] **Step 6: Create Integration Testing, Docs, Release subtasks**

---

## Task 7: Create Feature — Digital Invitations (WhatsApp)

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Digital Invitations via WhatsApp"
- tags: ["feature", "mvp-phase-1"]
- priority: "high"
- markdown_description:

```markdown
## 📦 Feature: Digital Invitations via WhatsApp

### Summary
Hosts can send digital invitations to guests via WhatsApp. Each invitation contains a link to the event details and RSVP page.

### User Stories
- As a host, I want to send invitations via WhatsApp so my guests receive them instantly
- As a host, I want to track which invitations were sent so I know who hasn't been invited yet
- As a guest, I want to receive a beautiful invitation link on WhatsApp so I can RSVP easily

### Scope
**In Scope:**
- [ ] Send invitation to individual guest via WhatsApp
- [ ] Bulk send invitations to all uninvited guests
- [ ] Invitation status tracking (sent, delivered, opened)
- [ ] Invitation link with event details + RSVP
- [ ] Re-send invitation option

**Out of Scope:**
- Custom invitation templates/designs
- Email invitations (post-MVP)
- SMS invitations
- Scheduled/timed sends

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Send Invitation | WhatsApp send flow per guest | P0 |
| Invitation Status | Track sent/pending status | P0 |
| Bulk Send | Send to multiple guests at once | P1 |
| Invitation Preview | Preview what guest will see | P1 |

### Dependencies
- Guest Management (guests must exist to invite)
- WhatsApp Business API or WhatsApp Web deep links
- Public RSVP page (from Guest Management feature)

### Estimated Complexity
- T-shirt size: M
- Estimated components: 4
- Risk: WhatsApp API integration complexity, rate limits
```

- [ ] **Step 2-6: Create full subtask hierarchy (spec, data model, components, phases)**

---

## Task 8: Create Feature — Planning Tools (Checklist & Budget)

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Planning Tools (Checklist & Budget Tracker)"
- tags: ["feature", "mvp-phase-1"]
- priority: "normal"
- markdown_description:

```markdown
## 📦 Feature: Planning Tools (Checklist & Budget Tracker)

### Summary
Hosts can manage their event planning with a checklist of tasks and track their budget with expense logging.

### User Stories
- As a host, I want a checklist of planning tasks so I don't forget anything
- As a host, I want to track my expenses so I stay within budget
- As a host, I want to see budget vs actual spending so I know where I stand

### Scope
**In Scope:**
- [ ] Checklist with add/edit/delete/check items
- [ ] Pre-populated checklist templates (wedding, birthday)
- [ ] Budget overview (total budget, spent, remaining)
- [ ] Expense logging (amount, category, vendor, date)
- [ ] Budget categories (venue, catering, decoration, etc.)

**Out of Scope:**
- Vendor payment integration
- Receipt scanning
- Collaborative task assignment
- Timeline/Gantt view

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Checklist | Task list with CRUD and check/uncheck | P0 |
| Budget Overview | Summary card with totals | P0 |
| Expense List | Expense entries with CRUD | P0 |
| Category Breakdown | Spending by category chart | P1 |

### Design References
- Stitch: Planning Tools dashboard view (checklist + budget overview)
- Stitch: Budget section showing $5,000 / $8,234 / $65,234

### Dependencies
- Event CRUD (planning tools belong to events)

### Estimated Complexity
- T-shirt size: L
- Estimated components: 4
```

- [ ] **Step 2-6: Create full subtask hierarchy**

---

## Task 9: Create Feature — Media & Memories

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Media & Memories (Photo Gallery)"
- tags: ["feature", "mvp-phase-1"]
- priority: "normal"
- markdown_description:

```markdown
## 📦 Feature: Media & Memories (Photo Gallery)

### Summary
Hosts can upload photos to their event, organize them into albums, and share them with guests.

### User Stories
- As a host, I want to upload event photos so they're all in one place
- As a host, I want to organize photos into albums so they're easy to browse
- As a guest, I want to view event photos so I can relive the memories

### Scope
**In Scope:**
- [ ] Photo upload (single and multiple)
- [ ] Photo gallery grid view
- [ ] Album creation and management
- [ ] Photo viewer (lightbox)
- [ ] Recent uploads section

**Out of Scope:**
- AI Photo Finder (post-MVP)
- Video upload
- Photo editing/filters
- Guest photo upload (post-MVP)

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Photo Upload | Drag-and-drop + file picker | P0 |
| Photo Gallery | Grid of photos with lightbox | P0 |
| Album Management | Create/edit/delete albums | P1 |

### Design References
- Stitch: Media & Memories dashboard view
- Stitch: Photo Albums, Videos, Recent Uploads sections

### Dependencies
- Event CRUD
- Supabase Storage bucket for photos

### Estimated Complexity
- T-shirt size: M
- Estimated components: 3
```

- [ ] **Step 2-6: Create full subtask hierarchy**

---

## Task 10: Create Feature — Digital Presence (Event Website)

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Digital Presence (Event Website)"
- tags: ["feature", "mvp-phase-1"]
- priority: "normal"
- markdown_description:

```markdown
## 📦 Feature: Digital Presence (Event Website)

### Summary
Each event gets a public-facing website built from the template selected during event creation. The website shows event details, schedule, photos, and includes the RSVP link.

### User Stories
- As a host, I want my event to have a website so I can share it with everyone
- As a host, I want to customize my event website so it reflects my style
- As a guest, I want to visit the event website to see all details in one place

### Scope
**In Scope:**
- [ ] Public event website at `/e/[slug]` or `/events/[id]/website`
- [ ] Template-based rendering (from Step 4 of wizard)
- [ ] Event details display (date, venue, description)
- [ ] Sub-event schedule
- [ ] Photo gallery section
- [ ] RSVP button linking to response page
- [ ] Mobile-optimized design

**Out of Scope:**
- Custom domain mapping
- Website analytics
- Custom CSS/theme editing
- RSVP form embedded in website (links to separate page)

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Website Renderer | Renders event data with selected template | P0 |
| Template System | 3-4 pre-built templates | P0 |
| Website Preview | Preview in wizard Step 4 | P1 |

### Design References
- Stitch: Step 4 Template Selection screen
- Stitch: Digital Presence dashboard section

### Dependencies
- Event CRUD (event data source)
- Photo Gallery (photos section)
- Guest Management (RSVP link)

### Estimated Complexity
- T-shirt size: L
- Estimated components: 3
- Risk: Template system design, public URL routing
```

- [ ] **Step 2-6: Create full subtask hierarchy**

---

## Task 11: Create Feature — Reusable Component Library

**What:** This is a foundational task that all features depend on.

- [ ] **Step 1: Create parent feature task**

- name: "Feature: Reusable Component Library"
- tags: ["feature", "mvp-phase-1"]
- priority: "urgent"
- markdown_description:

```markdown
## 📦 Feature: Reusable Component Library

### Summary
A shared set of UI components used across all Evenzi features. Built once, used everywhere. This ensures visual consistency and speeds up feature development.

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Button | Primary, secondary, ghost, danger variants | P0 |
| Input / TextField | With label, error state, helper text | P0 |
| Modal / Dialog | Overlay with close, confirm actions | P0 |
| Card | Generic card container | P0 |
| Table | Sortable, paginated data table | P0 |
| Badge / Status | RSVP status, event status indicators | P0 |
| Toast / Notification | Success, error, info messages | P0 |
| Sidebar / Navigation | Main app navigation | P0 |
| Empty State | Illustration + CTA for empty pages | P1 |
| Loading Skeleton | Placeholder while data loads | P1 |
| Date Picker | For event dates, expense dates | P0 |
| File Upload | Drag-and-drop + file picker | P1 |

### Design References
- Stitch: Extract design tokens from all screens (colors, typography, spacing)

### Dependencies
- None (this is a foundation)

### Estimated Complexity
- T-shirt size: L
- Estimated components: 12
```

- [ ] **Step 2: Create component subtasks for each UI component**
- [ ] **Step 3: Create dev phase subtasks (UI/UX + Frontend + QA for each)**

---

## Task 12: Create Feature — Fix Vercel Deployment

**What:** This is a blocking infrastructure task.

- [ ] **Step 1: Update existing task (86d2jmkn4) with full template**

Use `clickup_update_task` on the existing "Fix Vercel deployment errors" task:
- tags: ["mvp-phase-1", "claude-code"]
- priority: "urgent"
- Update description with:

```markdown
## 📦 Feature: Fix Vercel Deployment

### Summary
Vercel deployments are currently in ERROR state. This must be resolved before any feature can go to production.

### Acceptance Criteria
- [ ] `npm run build` succeeds locally
- [ ] Vercel deployment succeeds
- [ ] Production URL loads without errors
- [ ] Auth flow works on production

### Components
| Component | Description | Priority |
|-----------|-------------|----------|
| Build Fix | Resolve build errors | P0 |
| Env Vars | Configure Vercel env vars | P0 |
| Smoke Test | Verify production works | P0 |
```

---

## Task 13: Move Existing Backlog Ideas to Ideas List

**What:** Move future/post-MVP tasks from Backlog to the new Ideas list.

- [ ] **Step 1: Move post-MVP tasks to Ideas list**

These tasks are post-MVP ideas. Use `clickup_move_task` to move them to the Ideas list:
- "Event Discovery / Search" (86d2jmkxc)
- "Event Website Builder" (86d2jmkx4) — replaced by Digital Presence feature
- "AI Photo Finder feature" (86d2jmkwu)
- "Real-time features (live RSVP updates, presence)" (86d2jmkyf)
- "Analytics & Event Insights dashboard" (86d2jmkyu)

- [ ] **Step 2: Add comments to moved tasks**

Add a comment to each: "Moved to Ideas — post-MVP. Will be refined and promoted when MVP Phase 1 is complete."

---

## Task 14: Set Feature Dependencies in ClickUp

**What:** Link features in the correct dependency order.

- [ ] **Step 1: Set up dependency chain**

Use `clickup_add_task_dependency`:

1. Component Library → blocks → all other features
2. Fix Vercel Deployment → blocks → all releases
3. Auth & Role Selection → blocks → Host Dashboard
4. Event CRUD → blocks → Guest Management, Planning Tools, Media, Digital Presence
5. Guest Management → blocks → Digital Invitations

---

## Summary: MVP Phase 1 Feature Priority Order

| Priority | Feature | Size | Status |
|----------|---------|------|--------|
| 1 | Fix Vercel Deployment | S | Blocked (pre-existing) |
| 2 | Reusable Component Library | L | Not Started |
| 3 | Auth & Role Selection | M | 75% Done (Role Selection remaining) |
| 4 | Event CRUD (5-Step Wizard) | XL | Not Started |
| 5 | Host Dashboard | M | Shell exists, needs real data |
| 6 | Guest Management & RSVP | L | Not Started |
| 7 | Digital Invitations (WhatsApp) | M | Not Started |
| 8 | Planning Tools (Checklist + Budget) | L | Not Started |
| 9 | Media & Memories (Photo Gallery) | M | Not Started |
| 10 | Digital Presence (Event Website) | L | Not Started |
