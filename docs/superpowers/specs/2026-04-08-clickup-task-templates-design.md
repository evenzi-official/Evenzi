# ClickUp Task Templates & MVP Sprint Planning — Design Spec

**Date:** 2026-04-08
**Status:** Draft
**Author:** Claude Code (PM mode)

---

## 1. Overview

Define a structured task template system for Evenzi's ClickUp workspace that supports end-to-end feature development using Claude Code as the implementer. Templates enforce approval gates at each phase, ensuring quality control before proceeding.

### Goals
- Standardized task structure for all feature work
- Approval gates after every dev phase (user validates AI output)
- Templates that give Claude Code enough context to work without ambiguity
- ClickUp workspace restructured to support ideas → backlog → active development flow
- MVP Phase 1 scoped and ready for sprint planning

---

## 2. MVP Phase 1 Scope

**Target:** Host-only, one complete end-to-end event flow.

### Features In Scope
| Feature | Description | Design Status |
|---------|-------------|---------------|
| Auth + Role Selection | Phone OTP + Google OAuth, Host path only (Vendor deferred) | Designed in Stitch |
| Event CRUD | 5-step wizard: Type → Details → Sub-Events → Template → Review | Designed in Stitch |
| Host Dashboard | "Your Events" grid with event cards, hero CTA | Designed in Stitch |
| Guest Management & RSVP | Add/edit/delete guests, track RSVP status | Designed in Stitch |
| Digital Invitations | Send invitations via WhatsApp | Needs design refinement |
| Planning Tools | Checklist, budget/expense tracker | Designed in Stitch |
| Media & Memories | Photo gallery/upload | Designed in Stitch |
| Digital Presence | Event website from template selection | Designed in Stitch |

### Explicitly Out of Scope (MVP)
- Vendor role and vendor-side flows
- AI Photo Finder
- Real-time features (live RSVP updates, presence)
- Event Discovery / Search
- Analytics & Insights dashboard
- Multi-language support

---

## 3. ClickUp Workspace Structure

### Current Structure
```
Product (Space)
  ├── Development (Folder)
  │     ├── Frontend
  │     ├── Backend
  │     ├── Database
  │     └── DevOps
  ├── Design
  ├── Backlog
  ├── QA & Bugs
  ├── Architecture & Configuration
  └── Documentation
```

### Proposed Addition
Add an **Ideas** list under the Product space for raw, unrefined feature ideas. The flow becomes:

```
Ideas (raw thoughts, one-liners)
  ↓ (when refined with scope + user stories)
Backlog (prioritized, ready for sprint planning)
  ↓ (when picked for a sprint)
Development Folder (Frontend / Backend / Database / DevOps)
```

The existing Backlog list becomes the "refined and ready" queue. Ideas is the upstream capture list.

---

## 4. Task Hierarchy

```
📦 Feature (Parent Task)                    — lives in Backlog, moves to relevant list when active
  │
  ├── 📋 Spec & Architecture               — Feature-level phase
  │     └── [APPROVAL GATE]
  ├── 📐 Data Modeling & Schema Design      — Feature-level phase
  │     └── [APPROVAL GATE]
  │
  ├── 🧩 Component A (Subtask)
  │     ├── 🎨 UI/UX Design                → [APPROVAL GATE]
  │     ├── 💻 Frontend Dev                 → [APPROVAL GATE]
  │     ├── ⚙️ Backend Dev                  → [APPROVAL GATE]
  │     └── ✅ Component QA                 → [APPROVAL GATE]
  │
  ├── 🧩 Component B (Subtask)
  │     ├── 🎨 → 💻 → ⚙️ → ✅             (same phases)
  │
  ├── 🔗 Integration Testing               — Feature-level phase
  │     └── [APPROVAL GATE]
  ├── 📝 Feature Documentation              — Feature-level phase
  │     └── [APPROVAL GATE]
  └── 🚀 Release & Deployment              — Feature-level phase
        └── [APPROVAL GATE]
```

**3 Levels:** Feature → Components → Dev Phases

**Approval Gates:** After every phase, the user validates output before the next phase starts. This is critical when Claude Code is the implementer.

**Dependencies:**
- Spec & Architecture must be approved before any component work
- Data Modeling must be approved before any Backend or Frontend dev
- Within a component: UI/UX → Frontend → Backend → QA (sequential)
- Components can run in parallel (separate Claude Code sessions)
- Integration Testing only after all components complete
- Documentation can run parallel to Integration Testing
- Release only after both Integration Testing and Documentation approved

---

## 5. Templates

### 5.1 Feature Definition (Parent Task)

```markdown
## 📦 Feature: [Feature Name]

### Summary
One paragraph describing what this feature does and why it matters to users.

### User Stories
- As a [host/guest], I want to [action] so that [outcome]
- As a [host/guest], I want to [action] so that [outcome]

### Scope
**In Scope:**
- [ ] Bullet list of what's included

**Out of Scope:**
- What's explicitly NOT part of this feature

### Components Breakdown
| Component | Description | Priority |
|-----------|-------------|----------|
| Guest List | CRUD for managing guests | P0 |
| RSVP Tracking | Track responses | P0 |
| Invitation Sending | WhatsApp integration | P1 |

### Success Metrics
- What measurable outcomes define "done" for this feature
- e.g., "Host can invite 50+ guests and track all RSVPs from one screen"

### Design References
- Stitch: [link]
- Figma: [link]
- Screenshots: [attached]

### Dependencies
- Other features this depends on (e.g., "Requires Event CRUD to be complete")
- External services (e.g., WhatsApp API, Supabase Storage)

### Estimated Complexity
- T-shirt size: S / M / L / XL
- Estimated components: [count]
- Risk factors: [any unknowns]

### Acceptance Criteria (Feature-Level)
- [ ] End-to-end flow works: [describe the full user journey]
- [ ] All components integrated and functional
- [ ] No P0 bugs remaining
- [ ] Feature documentation complete

### Approval Gate
- **Approver:** [You]
- **What to validate:** Feature scope is clear, components are correctly identified, no missing user stories
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.2 Component (Subtask of Feature)

```markdown
## 🧩 Component: [Component Name]

### Parent Feature
- Feature: [link to parent task]
- Feature Spec: [link to spec document]

### Description
What this component does within the larger feature. One paragraph.

### User Flow
1. User does X
2. System responds with Y
3. User sees Z

### Pages / Routes Affected
- `/path/to/page` — what happens here
- `/api/endpoint` — what this handles

### Data Entities Involved
- `table_name` — which columns this component reads/writes
- Relationships to other tables

### Design Reference
- Screen: [Stitch/Figma link to specific screen]
- Interactions: [any animations, transitions, hover states]

### Acceptance Criteria
- [ ] Specific, testable requirement
- [ ] Specific, testable requirement
- [ ] Specific, testable requirement

### Test Cases
| # | Scenario | Input | Expected Output |
|---|----------|-------|-----------------|
| 1 | Happy path | Valid guest data | Guest added, list updates |
| 2 | Edge case | Duplicate email | Error shown, no duplicate |
| 3 | Error state | Network failure | Retry prompt shown |

### Dependencies
- Components this depends on: [list]
- Components that depend on this: [list]

### Dev Phase Sequence
1. 🎨 UI/UX Design → [APPROVAL]
2. 💻 Frontend Dev → [APPROVAL]
3. ⚙️ Backend Dev → [APPROVAL]
4. ✅ Component QA → [APPROVAL]

### Notes for Claude Code
- Relevant existing files: [paths]
- Patterns to follow: [reference existing similar code]
- Constraints: [performance, accessibility, etc.]
```

### 5.3 Spec & Architecture (Feature-Level Phase)

```markdown
## 📋 Spec & Architecture: [Feature Name]

### Parent Feature
- Feature: [link to parent task]

### Technical Approach
High-level architecture decision for this feature.
- Pattern: [e.g., Server Components + API routes, or full client-side with React Query]
- State management: [e.g., URL params, React state, Supabase realtime]
- Auth considerations: [which routes need protection, RLS implications]

### Page & Route Map
| Route | Type | Purpose | Auth Required |
|-------|------|---------|---------------|
| `/events/[id]/guests` | Page (Server) | Guest list view | Yes |
| `/api/events/[id]/guests` | API Route | CRUD operations | Yes |
| `/invite/[token]` | Page (Public) | RSVP response page | No |

### API Contracts
```
POST /api/events/[id]/guests
Body: { name: string, email?: string, phone: string }
Response: { id: string, status: "invited" }
Errors: 400 (validation), 401 (unauth), 409 (duplicate)
```

### Component Architecture
```
EventGuestsPage (Server Component)
  ├── GuestListHeader (Client - search, filters, add button)
  ├── GuestTable (Client - sortable, selectable)
  │     └── GuestRow (Client - inline edit, status badge)
  ├── AddGuestModal (Client - form with validation)
  └── RSVPSummaryCard (Server - stats)
```

### Third-Party Integrations
- Service: [e.g., WhatsApp Business API]
- Purpose: [what it's used for]
- Auth method: [API key, OAuth, etc.]
- Rate limits / constraints: [if any]

### Performance Considerations
- Expected data scale: [e.g., up to 500 guests per event]
- Pagination strategy: [if needed]
- Caching approach: [if needed]

### Acceptance Criteria
- [ ] All routes and API contracts defined
- [ ] Component tree covers all UI states (loading, empty, error, populated)
- [ ] Auth and RLS strategy documented
- [ ] No unresolved technical decisions

### Approval Gate
- **Approver:** [You]
- **What to validate:** Technical approach is sound, no missing routes/endpoints, component tree makes sense against the designs
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.4 Data Modeling & Schema Design (Feature-Level Phase)

```markdown
## 📐 Data Modeling: [Feature Name]

### Parent Feature
- Feature: [link to parent task]
- Spec: [link to spec & architecture task]

### Entity Relationship Overview
Describe relationships in plain language:
- One event has many guests
- One guest has one RSVP response per event
- Guests can belong to sub-events (ceremony, reception, etc.)

### Schema Definition
| Table | Column | Type | Constraints | Notes |
|-------|--------|------|-------------|-------|
| `guests` | `id` | uuid | PK, default gen_random_uuid() | |
| `guests` | `event_id` | uuid | FK → events.id, NOT NULL | |
| `guests` | `name` | text | NOT NULL | |
| `guests` | `phone` | text | NOT NULL | For WhatsApp invites |
| `guests` | `email` | text | nullable | Optional |
| `guests` | `rsvp_status` | text | default 'pending' | pending/yes/no/maybe |
| `guests` | `created_at` | timestamptz | default now() | |

### Indexes
| Table | Index | Columns | Type | Reason |
|-------|-------|---------|------|--------|
| `guests` | `idx_guests_event` | `event_id` | btree | Filter by event |
| `guests` | `idx_guests_phone_event` | `phone, event_id` | unique | No duplicate guests |

### Row-Level Security (RLS)
| Table | Policy Name | Operation | Rule |
|-------|------------|-----------|------|
| `guests` | `guests_select_own` | SELECT | `event_id IN (SELECT id FROM events WHERE host_id = auth.uid())` |
| `guests` | `guests_insert_own` | INSERT | Same as above |
| `guests` | `guests_update_own` | UPDATE | Same as above |
| `guests` | `guests_delete_own` | DELETE | Same as above |

### Migration SQL
```sql
-- Migration: create_guests_table
CREATE TABLE guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ...
);

ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY guests_select_own ON guests
  FOR SELECT USING (event_id IN (
    SELECT id FROM events WHERE host_id = auth.uid()
  ));
```

### Seed Data (for development)
- Describe test data needed for dev/testing

### Acceptance Criteria
- [ ] All tables defined with correct types and constraints
- [ ] Foreign keys and cascades are correct
- [ ] RLS policies cover all CRUD operations
- [ ] No data can leak between users (RLS verified)
- [ ] Indexes support expected query patterns
- [ ] Migration SQL is reversible

### Approval Gate
- **Approver:** [You]
- **What to validate:** Schema matches the spec, RLS is airtight, no missing columns for planned features
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.5 UI/UX Design (Component Phase)

```markdown
## 🎨 UI/UX Design: [Component Name]

### Parent
- Feature: [link to parent feature]
- Component: [link to parent component]

### Design Source
- Stitch: [link to specific screen]
- Figma: [link if available]
- Screenshots: [attached if no link]

### Screen Inventory
| Screen / State | Description | Design Ready? |
|----------------|-------------|---------------|
| Default view | Guest list with data | ✅ |
| Empty state | No guests added yet | ❌ Needs design |
| Loading state | Skeleton/spinner | ❌ Needs design |
| Error state | Failed to load | ❌ Needs design |
| Mobile (375px) | Responsive layout | ✅ |

### Interaction Specs
- **Add Guest:** Button opens modal with form
- **Edit Guest:** Inline edit or modal (specify which)
- **Delete Guest:** Confirmation dialog before delete
- **Sort/Filter:** [describe interactions]

### UI Components Needed
| Component | New or Existing | Notes |
|-----------|----------------|-------|
| GuestTable | New | Sortable columns |
| AddGuestModal | New | Form with validation |
| StatusBadge | Existing (reuse) | pending/yes/no/maybe variants |

### Design Tokens / Style Notes
- Colors: [any feature-specific colors, e.g., RSVP status colors]
- Typography: [any callouts]
- Spacing: [any specific requirements]
- Animation: [transitions, hover effects]

### Responsive Breakpoints
| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 640px) | Stack layout, cards instead of table |
| Tablet (640-1024px) | Compact table |
| Desktop (> 1024px) | Full table with all columns |

### Accessibility Requirements
- [ ] All interactive elements keyboard navigable
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader labels on icons/buttons
- [ ] Focus management in modals

### Acceptance Criteria
- [ ] All screen states designed (default, empty, loading, error)
- [ ] Mobile and desktop layouts defined
- [ ] Interaction patterns documented
- [ ] Component list identified (new vs reuse)

### Approval Gate
- **Approver:** [You]
- **What to validate:** Designs match Stitch/Figma, all states covered, responsive approach makes sense
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.6 Frontend Development (Component Phase)

```markdown
## 💻 Frontend Dev: [Component Name]

### Parent
- Feature: [link to parent feature]
- Component: [link to parent component]
- UI/UX Design: [link to approved design task]
- Data Model: [link to approved schema]

### Pages / Routes
| Route | File Path | Component Type | Notes |
|-------|-----------|---------------|-------|
| `/events/[id]/guests` | `app/events/[id]/guests/page.tsx` | Server Component | Fetches initial data |

### Component Tree
```
GuestsPage (Server)
  ├── GuestListHeader (Client)
  │     ├── SearchInput
  │     └── AddGuestButton → opens AddGuestModal
  ├── GuestTable (Client)
  │     └── GuestRow
  │           ├── StatusBadge
  │           └── ActionMenu (edit, delete)
  └── AddGuestModal (Client)
        └── GuestForm (validated with Zod)
```

### State Management
- **Server state:** Supabase queries in server components
- **Client state:** [React state / URL params / etc.]
- **Optimistic updates:** [Yes/No, for which actions]

### API Integration
| Action | Endpoint | Method | Request | Response |
|--------|----------|--------|---------|----------|
| List guests | `/api/events/[id]/guests` | GET | query params | Guest[] |
| Add guest | `/api/events/[id]/guests` | POST | GuestInput | Guest |
| Update guest | `/api/events/[id]/guests/[gid]` | PATCH | Partial<Guest> | Guest |
| Delete guest | `/api/events/[id]/guests/[gid]` | DELETE | - | 204 |

### Validation (Zod Schemas)
- Input validation schema for forms
- Response validation if needed

### Error Handling
| Scenario | UI Behavior |
|----------|-------------|
| Network error | Toast notification + retry option |
| Validation error | Inline field errors |
| 401 Unauthorized | Redirect to /auth |
| 404 Not found | Show "event not found" page |

### Files to Create / Modify
| File | Action | Purpose |
|------|--------|---------|
| `app/events/[id]/guests/page.tsx` | Create | Page component |
| `components/guests/GuestTable.tsx` | Create | Table component |
| `components/guests/AddGuestModal.tsx` | Create | Modal form |
| `lib/validations/guest.ts` | Create | Zod schemas |

### Acceptance Criteria
- [ ] All pages render correctly with real data
- [ ] Forms validate input before submission
- [ ] Loading, empty, and error states implemented
- [ ] Mobile responsive per design specs
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] Follows existing code patterns in the project

### Test Cases
| # | Scenario | Expected |
|---|----------|----------|
| 1 | Page loads with guests | Table renders with data |
| 2 | Add guest with valid data | Modal closes, guest appears in list |
| 3 | Add guest with invalid phone | Inline error shown |
| 4 | Delete guest | Confirmation → guest removed |
| 5 | Empty event (no guests) | Empty state UI shown |

### Notes for Claude Code
- Existing patterns to follow: [reference similar pages in codebase]
- Use `createClient()` from `lib/supabase/server.ts` for server components
- Use `createBrowserClient()` from `lib/supabase/client.ts` for client components
- Tailwind only, no CSS modules
- `"use client"` only where needed

### Approval Gate
- **Approver:** [You]
- **What to validate:** UI matches designs, forms work, states handled, code quality
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.7 Backend Development (Component Phase)

```markdown
## ⚙️ Backend Dev: [Component Name]

### Parent
- Feature: [link to parent feature]
- Component: [link to parent component]
- Data Model: [link to approved schema]
- Spec: [link to spec & architecture]

### API Endpoints
#### `POST /api/events/[id]/guests`
**Purpose:** Add a new guest to an event

**Auth:** Required (Supabase session)

**Request:**
```json
{
  "name": "string (required)",
  "phone": "string (required, +91 format)",
  "email": "string (optional)",
  "sub_events": ["string[] (optional, sub-event IDs)"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Priya Sharma",
  "phone": "+919876543210",
  "rsvp_status": "pending",
  "created_at": "ISO timestamp"
}
```

**Errors:**
| Code | Condition | Response Body |
|------|-----------|--------------|
| 400 | Validation fails | `{ error: "Phone number is required" }` |
| 401 | No session | `{ error: "Unauthorized" }` |
| 403 | Not event owner | `{ error: "Forbidden" }` |
| 409 | Duplicate phone+event | `{ error: "Guest already exists" }` |

*(Repeat for each endpoint)*

### Validation Rules (Zod)
```typescript
const createGuestSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().regex(/^\+91\d{10}$/),
  email: z.string().email().optional(),
});
```

### Authorization Logic
- Verify user owns the event before any operation
- Use Supabase RLS as primary guard + API-level check as defense-in-depth

### Database Queries
- List: `SELECT * FROM guests WHERE event_id = $1 ORDER BY created_at`
- Insert: `INSERT INTO guests (event_id, name, phone, email) VALUES (...)`
- Update: `UPDATE guests SET ... WHERE id = $1 AND event_id = $2`
- Delete: `DELETE FROM guests WHERE id = $1 AND event_id = $2`

### External Service Integration
- Service: [e.g., WhatsApp Business API]
- When triggered: [e.g., on invitation send]
- Error handling: [what if the service is down]

### Files to Create / Modify
| File | Action | Purpose |
|------|--------|---------|
| `app/api/events/[id]/guests/route.ts` | Create | GET + POST handlers |
| `app/api/events/[id]/guests/[guestId]/route.ts` | Create | PATCH + DELETE |
| `lib/validations/guest.ts` | Modify | Add server-side schemas |

### Acceptance Criteria
- [ ] All endpoints return correct status codes
- [ ] Validation rejects invalid input with clear messages
- [ ] Unauthorized access returns 401/403
- [ ] RLS prevents cross-user data access
- [ ] No SQL injection vectors (parameterized queries only)
- [ ] Error responses follow consistent format

### Test Cases
| # | Scenario | Method | Expected |
|---|----------|--------|----------|
| 1 | Create valid guest | POST | 201 + guest object |
| 2 | Create without auth | POST | 401 |
| 3 | Create on other user's event | POST | 403 |
| 4 | Create duplicate phone | POST | 409 |
| 5 | List guests | GET | 200 + array |
| 6 | Delete guest | DELETE | 204 |

### Notes for Claude Code
- Use `createClient()` from `lib/supabase/server.ts`
- Return `NextResponse.json()` for all responses
- Always wrap in try-catch with proper error responses
- Follow existing API route patterns in `app/api/`

### Approval Gate
- **Approver:** [You]
- **What to validate:** Endpoints work via manual testing or Vitest, auth is enforced, error handling is solid
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.8 Component QA (Component Phase)

```markdown
## ✅ Component QA: [Component Name]

### Parent
- Feature: [link to parent feature]
- Component: [link to parent component]
- Frontend: [link to FE dev task]
- Backend: [link to BE dev task]

### Test Strategy
- **Unit tests:** Vitest for utility functions, validation schemas
- **Component tests:** React Testing Library for UI components
- **API tests:** Vitest for route handlers
- **Manual testing:** Browser walkthrough of all states

### Functional Test Cases
| # | Category | Scenario | Steps | Expected Result | Priority |
|---|----------|----------|-------|-----------------|----------|
| 1 | Happy path | Add a guest | Fill form → submit | Guest appears in list | P0 |
| 2 | Happy path | Edit guest name | Click edit → change → save | Name updates | P0 |
| 3 | Validation | Empty name field | Submit with empty name | Error shown | P0 |
| 4 | Auth | Access without login | Navigate directly to URL | Redirect to /auth | P0 |
| 5 | Edge case | 200+ guests | Load page with large dataset | Renders without lag | P1 |
| 6 | Error | API down | Disconnect network → try action | Error toast shown | P1 |
| 7 | Concurrency | Two tabs editing | Edit same guest in two tabs | No data corruption | P2 |

### UI Verification
- [ ] Matches Stitch/Figma designs
- [ ] All states render correctly (default, empty, loading, error)
- [ ] Mobile responsive (test at 375px)
- [ ] Keyboard navigation works
- [ ] No layout shifts on data load

### API Verification
- [ ] All endpoints return correct status codes
- [ ] Invalid input rejected with clear errors
- [ ] Auth enforced on all protected routes
- [ ] RLS verified (user A cannot see user B's data)

### Security Checks
- [ ] No XSS vectors in user-generated content
- [ ] No SQL injection (parameterized queries)
- [ ] Auth tokens not exposed in client code
- [ ] CORS configured correctly

### Bug Report Template (if bugs found)
```
**Bug:** [Short description]
**Severity:** P0 / P1 / P2
**Steps:** 1. ... 2. ... 3. ...
**Expected:** ...
**Actual:** ...
**Screenshot:** [if applicable]
```

### Acceptance Criteria
- [ ] All P0 test cases pass
- [ ] No P0 or P1 bugs remaining
- [ ] All P2 bugs documented (can ship with known P2s)
- [ ] Test files committed to repo

### Approval Gate
- **Approver:** [You]
- **What to validate:** Test results, no critical bugs, code coverage adequate
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.9 Integration Testing (Feature-Level Phase)

```markdown
## 🔗 Integration Testing: [Feature Name]

### Parent Feature
- Feature: [link to parent task]

### End-to-End Test Scenarios
| # | Scenario | Steps | Expected Result |
|---|----------|-------|-----------------|
| 1 | Full happy path | Create event → Add guests → Send invites → Guest RSVPs → Host sees update | All data flows correctly |
| 2 | Cross-component | Guest added via list → appears in RSVP stats | Stats reflect real data |
| 3 | Auth boundary | Unauthenticated user tries guest API | 401 returned |

### Cross-Component Verification
- [ ] Data flows correctly between [Component A] → [Component B]
- [ ] Shared state (if any) stays consistent
- [ ] Navigation between component pages works

### Edge Cases
- [ ] Empty states (no guests, no RSVPs)
- [ ] Large data (100+ guests)
- [ ] Concurrent operations (two tabs editing same event)

### Performance Check
- [ ] Page loads under [X]ms with [Y] records
- [ ] No N+1 queries in network tab
- [ ] Images/assets optimized

### Mobile Responsiveness
- [ ] All pages work on 375px width
- [ ] Touch targets are adequate
- [ ] No horizontal scroll

### Acceptance Criteria
- [ ] All E2E scenarios pass
- [ ] No P0 or P1 bugs found
- [ ] Performance within acceptable range
- [ ] Mobile experience is functional

### Approval Gate
- **Approver:** [You]
- **What to validate:** Feature works end-to-end, no broken flows, acceptable performance
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.10 Feature Documentation (Feature-Level Phase)

```markdown
## 📝 Documentation: [Feature Name]

### Parent Feature
- Feature: [link to parent task]

### Documentation Deliverables

**API Documentation:**
- [ ] All endpoints documented with request/response examples
- [ ] Error codes and messages listed
- [ ] Auth requirements noted

**Schema Documentation:**
- [ ] Table definitions with column descriptions
- [ ] Relationship diagram or description
- [ ] RLS policy summary

**User-Facing Documentation:**
- [ ] Feature description for help docs / tooltips
- [ ] Any onboarding flows or first-time user guidance

**Developer Documentation:**
- [ ] How to extend this feature (adding new fields, etc.)
- [ ] Environment variables required
- [ ] Known limitations or tech debt

### References
- Spec: [link]
- Data Model: [link]
- Design: [Stitch/Figma link]

### Acceptance Criteria
- [ ] API docs are accurate against actual implementation
- [ ] Schema docs match current migration
- [ ] No undocumented endpoints or tables
- [ ] Project-level docs (Documentation list in ClickUp) updated

### Approval Gate
- **Approver:** [You]
- **What to validate:** Docs match implementation, nothing missing
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

### 5.11 Release & Deployment (Feature-Level Phase)

```markdown
## 🚀 Release: [Feature Name]

### Parent Feature
- Feature: [link to parent task]

### Pre-Release Checklist
- [ ] All component QA tasks approved
- [ ] Integration testing approved
- [ ] Feature documentation approved
- [ ] No open P0/P1 bugs for this feature
- [ ] Feature branch merged to Dev-Vibe
- [ ] Vercel preview deployment works

### Deployment Steps
1. Merge Dev-Vibe → main
2. Verify Vercel production build succeeds
3. Run Supabase migration on production (if any)
4. Smoke test on production URL

### Rollback Plan
- What to do if something breaks post-deploy
- Migration rollback SQL (if applicable)

### Post-Deploy Verification
- [ ] Production URL loads correctly
- [ ] Core user flow works (create → manage → invite)
- [ ] No console errors
- [ ] Auth flow works

### Acceptance Criteria
- [ ] Feature live on production
- [ ] Smoke test passed
- [ ] No regressions in existing features

### Approval Gate
- **Approver:** [You]
- **What to validate:** Production is stable, feature works as expected
- **Status:** ⏳ Pending / ✅ Approved / 🔄 Revision Needed
```

---

## 6. ClickUp Workflow

### Task Statuses (recommended)
| Status | Meaning |
|--------|---------|
| `backlog` | Defined but not started |
| `to do` | Picked for current sprint |
| `in progress` | Actively being worked on |
| `in review` | Approval gate — waiting for user validation |
| `approved` | Passed approval gate |
| `done` | Completed and verified |
| `blocked` | Waiting on dependency or external factor |

### Task Flow
```
backlog → to do → in progress → in review → approved → done
                                    ↓
                              (revision needed)
                                    ↓
                              in progress (rework)
```

### Tags (for filtering)
| Tag | Purpose |
|-----|---------|
| `mvp-phase-1` | MVP Phase 1 scope |
| `feature` | Feature parent task |
| `component` | Component subtask |
| `phase:spec` | Spec & Architecture phase |
| `phase:data-model` | Data Modeling phase |
| `phase:ui-ux` | UI/UX Design phase |
| `phase:frontend` | Frontend Dev phase |
| `phase:backend` | Backend Dev phase |
| `phase:qa` | QA phase |
| `phase:integration` | Integration Testing phase |
| `phase:docs` | Documentation phase |
| `phase:release` | Release & Deployment phase |
| `approval-gate` | Task requires approval before proceeding |
| `claude-code` | To be implemented by Claude Code |

---

## 7. Ideas List

A new "Ideas" list in the Product space for capturing raw feature ideas before they're refined.

### Ideas Task Template (lightweight)
```markdown
## 💡 Idea: [Short Title]

### What
One sentence describing the idea.

### Why
Why this would be valuable (user need, business case, or technical improvement).

### Notes
Any additional context, links, screenshots, or rough thoughts.

### Status
- [ ] Refined into feature task (link: ___)
```

Ideas get promoted to the Backlog when they have enough definition to become a Feature task.
