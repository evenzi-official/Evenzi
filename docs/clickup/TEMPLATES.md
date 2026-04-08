# Evenzi — Task Templates Reference

> This is the living template guide for ClickUp tasks. Claude Code references this when creating tasks during brainstorm/plan phases. Update whenever the process evolves.
>
> **Usage:** When starting a feature, Claude Code reads this file, creates tasks using the appropriate template, and populates with feature-specific content generated during superpowers workflow.

---

## Task Hierarchy    

```
Feature Parent (Backlog)
  ├── Spec & Architecture           → [APPROVAL GATE]
  ├── Data Modeling & Schema        → [APPROVAL GATE]
  ├── Component A (subtask)
  │     ├── UI/UX Design            → [APPROVAL GATE]
  │     ├── Frontend Dev            → [APPROVAL GATE]
  │     ├── Backend Dev             → [APPROVAL GATE]
  │     └── Component QA            → [APPROVAL GATE]
  ├── Component B...
  ├── Integration Testing           → [APPROVAL GATE]
  ├── Documentation                 → [APPROVAL GATE]
  └── Release & Deployment          → [APPROVAL GATE]
```

**3 Levels:** Feature → Components → Dev Phases

**Dependencies:**

- Spec must be approved before any component work
- Data Model must be approved before Backend or Frontend dev
- Within a component: UI/UX → Frontend → Backend → QA (sequential)
- Components can run in parallel (separate sessions)
- Integration Testing after all components complete
- Documentation can parallel Integration Testing
- Release after both Integration Testing and Documentation approved

---

## Tags


| Tag                 | Use On                      |
| ------------------- | --------------------------- |
| `mvp-phase-1`       | All MVP tasks               |
| `feature`           | Feature parent tasks        |
| `component`         | Component subtasks          |
| `phase:spec`        | Spec & Architecture         |
| `phase:data-model`  | Data Modeling               |
| `phase:ui-ux`       | UI/UX Design                |
| `phase:frontend`    | Frontend Dev                |
| `phase:backend`     | Backend Dev                 |
| `phase:qa`          | Component QA                |
| `phase:integration` | Integration Testing         |
| `phase:docs`        | Documentation               |
| `phase:release`     | Release & Deployment        |
| `approval-gate`     | Any task requiring approval |
| `claude-code`       | Implemented by Claude Code  |


---

## Template 1: Feature Parent

**Name format:** `Feature: [Feature Name]`
**Tags:** `feature`, `mvp-phase-1`
**List:** Backlog

```markdown
## Summary
[One paragraph — what this feature does and why it matters]

## User Stories
- As a [host/guest], I want to [action] so that [outcome]

## Scope
**In Scope:**
- [ ] ...

**Out of Scope:**
- ...

## Components
| Component | Description | Priority |
|-----------|-------------|----------|
| [Name] | [What it does] | P0/P1/P2 |

## Success Metrics
- [What "done" looks like end-to-end]

## Design References
- Stitch: [link]
- Figma: [link]

## Dependencies
- Features: [what must be done first]
- Services: [external APIs, Supabase Storage, etc.]

## Complexity
- Size: S / M / L / XL
- Components: [count]
- Risk: [unknowns]

## Acceptance Criteria
- [ ] End-to-end flow works: [describe journey]
- [ ] All components integrated
- [ ] No P0 bugs remaining
- [ ] Documentation complete
```

---

## Template 2: Spec & Architecture

**Name format:** `Spec & Architecture: [Feature Name]`
**Tags:** `phase:spec`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## Technical Approach
- Pattern: [Server Components + API routes / client-side / etc.]
- State management: [URL params / React state / Supabase realtime]
- Auth: [which routes need protection, RLS implications]

## Route Map
| Route | Type | Purpose | Auth |
|-------|------|---------|------|
| `/path` | Page (Server) | [purpose] | Yes/No |
| `/api/path` | API Route | [purpose] | Yes/No |

## API Contracts
[For each endpoint:]
```

METHOD /api/path
Body: { field: type }
Response: { field: type }
Errors: 400 (validation), 401 (unauth), 403 (forbidden)

```

## Component Architecture
```

PageComponent (Server)
  ├── ChildA (Client)
  │     └── GrandchildA
  └── ChildB (Client)

```

## External Integrations
- Service: [name] — Purpose: [what] — Auth: [method]

## Performance
- Expected scale: [e.g., up to 500 records]
- Pagination: [if needed]
- Caching: [if needed]

## Acceptance Criteria
- [ ] All routes and API contracts defined
- [ ] Component tree covers all UI states
- [ ] Auth and RLS strategy documented
- [ ] No unresolved technical decisions

## Approval Gate
- Validate: Technical approach sound, no missing routes, component tree matches designs
- Status: Pending / Approved / Revision Needed
```

---

## Template 3: Data Modeling & Schema

**Name format:** `Data Modeling: [Feature Name]`
**Tags:** `phase:data-model`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## Relationships
- [Plain language: One event has many guests, etc.]

## Schema
| Table | Column | Type | Constraints | Notes |
|-------|--------|------|-------------|-------|
| `table` | `id` | uuid | PK, default gen_random_uuid() | |
| `table` | `col` | type | FK/NOT NULL/etc. | |

## Indexes
| Table | Columns | Type | Reason |
|-------|---------|------|--------|
| `table` | `col` | btree/unique | [why] |

## RLS Policies
| Table | Policy | Operation | Rule |
|-------|--------|-----------|------|
| `table` | `name` | SELECT/INSERT/UPDATE/DELETE | [SQL condition] |

## Migration SQL
```sql
-- Full migration SQL here
```

## Acceptance Criteria

- All tables defined with correct types
- Foreign keys and cascades correct
- RLS covers all CRUD operations
- No data leaks between users
- Indexes support query patterns
- Migration is reversible

## Approval Gate

- Validate: Schema matches spec, RLS is airtight, no missing columns
- Status: Pending / Approved / Revision Needed

```

---

## Template 4: Component

**Name format:** `Component: [Component Name]`
**Tags:** `component`, `claude-code`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## Description
[What this component does within the feature]

## User Flow
1. User does X
2. System responds with Y
3. User sees Z

## Routes Affected
- `/path` — [what happens]
- `/api/path` — [what this handles]

## Data Entities
- `table` — columns read/written

## Design Reference
- Screen: [Stitch/Figma link]
- Interactions: [animations, hover states]

## Acceptance Criteria
- [ ] [Specific, testable requirement]

## Test Cases
| # | Scenario | Input | Expected |
|---|----------|-------|----------|
| 1 | Happy path | [input] | [result] |
| 2 | Edge case | [input] | [result] |
| 3 | Error | [input] | [result] |

## Dependencies
- Depends on: [components]
- Blocks: [components]

## Dev Phases
1. UI/UX Design → [APPROVAL]
2. Frontend Dev → [APPROVAL]
3. Backend Dev → [APPROVAL]
4. Component QA → [APPROVAL]
```

---

## Template 5: UI/UX Design

**Name format:** `UI/UX Design: [Component Name]`
**Tags:** `phase:ui-ux`, `approval-gate`, `mvp-phase-1`
**Parent:** Component task

```markdown
## Design Source
- Stitch: [link]
- Figma: [link]

## Screen States
| State | Description | Designed? |
|-------|-------------|-----------|
| Default | [with data] | Yes/No |
| Empty | [no data yet] | Yes/No |
| Loading | [skeleton/spinner] | Yes/No |
| Error | [failed to load] | Yes/No |

## Interactions
- [Action]: [behavior — e.g., "Click Add opens modal"]

## Components Needed
| Component | New/Existing | Notes |
|-----------|-------------|-------|
| [Name] | New/Reuse | [details] |

## Responsive
| Breakpoint | Behavior |
|------------|----------|
| Mobile < 640px | [layout] |
| Tablet 640-1024px | [layout] |
| Desktop > 1024px | [layout] |

## Accessibility
- [ ] Keyboard navigable
- [ ] WCAG AA contrast
- [ ] Screen reader labels
- [ ] Focus management in modals

## Approval Gate
- Validate: Matches Stitch/Figma, all states covered, responsive defined
```

---

## Template 6: Frontend Dev

**Name format:** `Frontend Dev: [Component Name]`
**Tags:** `phase:frontend`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Component task

```markdown
## Routes
| Route | File Path | Type | Notes |
|-------|-----------|------|-------|
| `/path` | `app/path/page.tsx` | Server/Client | [notes] |

## Component Tree
```

Page (Server)
  ├── Header (Client)
  ├── MainContent (Client)
  └── Modal (Client)

```

## State Management
- Server: Supabase queries in server components
- Client: [React state / URL params / etc.]
- Optimistic updates: [Yes/No, which actions]

## API Integration
| Action | Endpoint | Method |
|--------|----------|--------|
| [action] | `/api/path` | GET/POST/PATCH/DELETE |

## Error Handling
| Scenario | Behavior |
|----------|----------|
| Network error | Toast + retry |
| Validation | Inline field errors |
| 401 | Redirect to /auth |

## Files to Create/Modify
| File | Action | Purpose |
|------|--------|---------|
| `app/path/page.tsx` | Create | Page |
| `components/Name.tsx` | Create | Component |

## Acceptance Criteria
- [ ] Renders with real data
- [ ] Forms validate input
- [ ] Loading/empty/error states implemented
- [ ] Mobile responsive
- [ ] `npm run build` passes
- [ ] Follows existing patterns

## Approval Gate
- Validate: UI matches designs, forms work, states handled, code quality
```

---

## Template 7: Backend Dev

**Name format:** `Backend Dev: [Component Name]`
**Tags:** `phase:backend`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Component task

```markdown
## Endpoints

### `METHOD /api/path`
**Purpose:** [what it does]
**Auth:** Required/Public

**Request:**
```json
{ "field": "type (required/optional)" }
```

**Response (2xx):**

```json
{ "field": "value" }
```

**Errors:**


| Code | Condition  | Response                    |
| ---- | ---------- | --------------------------- |
| 400  | Validation | `{ error: "message" }`      |
| 401  | No session | `{ error: "Unauthorized" }` |
| 403  | Not owner  | `{ error: "Forbidden" }`    |


[Repeat per endpoint]

## Validation (Zod)

```typescript
const schema = z.object({
  field: z.string().min(1),
});
```

## Auth Logic

- Verify user owns resource before any operation
- RLS as primary guard + API-level check as defense-in-depth

## Database Queries

- List: `SELECT ...`
- Insert: `INSERT ...`
- Update: `UPDATE ...`
- Delete: `DELETE ...`

## Files to Create/Modify


| File                    | Action | Purpose  |
| ----------------------- | ------ | -------- |
| `app/api/path/route.ts` | Create | Handlers |


## Acceptance Criteria

- Correct status codes
- Validation rejects invalid input
- Auth enforced (401/403)
- RLS prevents cross-user access
- No SQL injection
- Consistent error format

## Approval Gate

- Validate: Endpoints work, auth enforced, error handling solid

```

---

## Template 8: Component QA

**Name format:** `Component QA: [Component Name]`
**Tags:** `phase:qa`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Component task

```markdown
## Test Strategy
- Unit: Vitest for utils, validation
- Component: React Testing Library for UI
- API: Vitest for route handlers
- Manual: Browser walkthrough

## Test Cases
| # | Category | Scenario | Expected | Priority |
|---|----------|----------|----------|----------|
| 1 | Happy path | [scenario] | [result] | P0 |
| 2 | Validation | [scenario] | [result] | P0 |
| 3 | Auth | [scenario] | [result] | P0 |
| 4 | Edge case | [scenario] | [result] | P1 |

## UI Verification
- [ ] Matches designs
- [ ] All states render (default, empty, loading, error)
- [ ] Mobile responsive (375px)
- [ ] Keyboard navigation
- [ ] No layout shifts

## API Verification
- [ ] Correct status codes
- [ ] Invalid input rejected
- [ ] Auth enforced
- [ ] RLS verified (cross-user test)

## Security
- [ ] No XSS in user content
- [ ] No SQL injection
- [ ] Auth tokens not exposed
- [ ] CORS configured

## Acceptance Criteria
- [ ] All P0 tests pass
- [ ] No P0/P1 bugs remaining
- [ ] P2 bugs documented
- [ ] Test files committed

## Approval Gate
- Validate: Test results, no critical bugs, adequate coverage
```

---

## Template 9: Integration Testing

**Name format:** `Integration Testing: [Feature Name]`
**Tags:** `phase:integration`, `approval-gate`, `claude-code`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## E2E Scenarios
| # | Scenario | Steps | Expected |
|---|----------|-------|----------|
| 1 | Full happy path | [step-by-step] | [result] |
| 2 | Cross-component | [step-by-step] | [result] |
| 3 | Auth boundary | [step-by-step] | [result] |

## Cross-Component Checks
- [ ] Data flows correctly between [A] → [B]
- [ ] Shared state stays consistent
- [ ] Navigation between pages works

## Performance
- [ ] Page loads under [X]ms with [Y] records
- [ ] No N+1 queries
- [ ] Assets optimized

## Mobile
- [ ] All pages work at 375px
- [ ] Touch targets adequate
- [ ] No horizontal scroll

## Acceptance Criteria
- [ ] All E2E scenarios pass
- [ ] No P0/P1 bugs
- [ ] Performance acceptable
- [ ] Mobile functional

## Approval Gate
- Validate: Feature works end-to-end, no broken flows
```

---

## Template 10: Documentation

**Name format:** `Documentation: [Feature Name]`
**Tags:** `phase:docs`, `approval-gate`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## Deliverables

**API Docs:**
- [ ] All endpoints with request/response examples
- [ ] Error codes listed
- [ ] Auth requirements noted

**Schema Docs:**
- [ ] Table definitions with descriptions
- [ ] Relationships documented
- [ ] RLS summary

**Developer Docs:**
- [ ] How to extend this feature
- [ ] Environment variables required
- [ ] Known limitations / tech debt

## Acceptance Criteria
- [ ] Docs match implementation
- [ ] No undocumented endpoints or tables
- [ ] Project-level docs updated

## Approval Gate
- Validate: Docs accurate, nothing missing
```

---

## Template 11: Release & Deployment

**Name format:** `Release: [Feature Name]`
**Tags:** `phase:release`, `approval-gate`, `mvp-phase-1`
**Parent:** Feature task

```markdown
## Pre-Release
- [ ] All component QA approved
- [ ] Integration testing approved
- [ ] Documentation approved
- [ ] No open P0/P1 bugs
- [ ] Feature branch merged to Dev-Vibe
- [ ] Vercel preview works

## Deploy Steps
1. Merge Dev-Vibe → main
2. Verify Vercel production build
3. Run Supabase migration (if any)
4. Smoke test production

## Rollback
- [What to do if something breaks]
- [Migration rollback SQL if applicable]

## Post-Deploy
- [ ] Production URL loads
- [ ] Core flow works
- [ ] No console errors
- [ ] Auth works

## Approval Gate
- Validate: Production stable, feature works as expected
```

---

## ClickUp Template Setup

To set up these as ClickUp templates:

1. **Go to any list** → Create a task manually using one of the templates above
2. **Click the task menu (⋯)** → "Save as Template"
3. **Name it** matching the template name (e.g., "Feature Parent", "Spec & Architecture")
4. **Repeat** for each template type you use frequently

When starting a new feature:

1. Create the Feature Parent task from template
2. Claude Code reads this file, creates subtasks using appropriate templates
3. Content gets populated during brainstorm → plan phases
4. Each task is filled with feature-specific details, not generic placeholders

