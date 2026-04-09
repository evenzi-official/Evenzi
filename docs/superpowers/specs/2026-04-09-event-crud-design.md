# Event CRUD (4-Step Creation Wizard) — Design Spec

> **Feature:** Event CRUD (5-Step Creation Wizard)
> **ClickUp Task:** [86d2jwz3x](https://app.clickup.com/t/86d2jwz3x)
> **Date:** 2026-04-09
> **Status:** Design approved, ready for implementation planning

---

## 1. Summary

Hosts create events through a guided 4-step wizard (Event Type → Basic Details → Sub-Events → Review & Confirm). After creation, a success screen confirms the event and redirects to the Host Dashboard where the new event appears as a card.

Edit, delete, and event management are separate features (Event Settings and Event Management Dashboard).

---

## 2. User Stories

- As a host, I want to create a wedding event step-by-step so the process isn't overwhelming
- As a host, I want to select sub-events (ceremony, reception, etc.) so I can organize my wedding
- As a host, I want to review all details before confirming so I don't make mistakes
- As a host, I want to see my created events on the dashboard so I can manage them

---

## 3. Scope

### In Scope

- 4-step creation wizard with progress indicator
- Step 1: Event type selection (Wedding active, others "Coming Soon")
- Step 2: Basic details with dynamic fields per event type
- Step 3: Sub-event selection (conditional — only for types with sub-events)
- Step 4: Review & confirm summary
- Onboarding success screen ("You're All Set!")
- Host Dashboard update — real event cards from database (replaces placeholder)
- Database schema: 5 tables (event_types, sub_event_types, events, event_metadata, event_sub_events)
- API routes: create event, list events, get event, get event types, get sub-event types
- Seed data: Wedding (enabled) + 5 disabled types + 7 wedding sub-event types
- Zod validation schemas for wizard steps and API payloads

### Out of Scope

- Event Management Dashboard (separate feature — designs not ready)
- Event Settings page (separate feature — edit/delete live there)
- Template Selection step (deferred to Digital Presence feature)
- Edit event flow (lives in Event Settings > General Settings)
- Delete event flow (lives in Event Settings > Danger Zone)
- Event sharing/collaboration
- Event duplication
- Cover image upload (requires Supabase Storage setup — deferred)

---

## 4. Wizard Flow

```
Step 1: Event Type Selection (25%)
  ↓ select type
Step 2: Basic Details (50%)
  ↓ fill form
Step 3: Sub-Event Selection (75%)  ← conditional, skipped if type has no sub-events
  ↓ select sub-events
Step 4: Review & Confirm (100%)
  ↓ confirm
Success Screen → "Go to Dashboard" → /home
```

### Step 1 — Event Type Selection

- **Mandatory** — user must select a type to proceed
- Progress: "Step 1 of 4: Event Type" — 25%
- Heading: "What type of event are you planning?"
- Subtitle: "Select the category that best fits your needs to setup your workspace."
- Event type cards in a grid (2x3 on desktop, stacked on mobile)
- **Active card (Wedding):** Full image, description, feature bullet list (Guest Management, Budget Tracking, Vendor Portal), "Select →" CTA button
- **Disabled cards:** Icon + name + "COMING SOON" badge, not clickable, muted styling
- No "Skip for now" — mandatory selection
- Footer: copyright + Help & Support, Privacy Policy, Terms of Service

### Step 2 — Basic Details

- Progress: "Step 2 of 4: Basic Details" — 50%
- Heading: "Basic Details"
- Subtitle: "Please provide the essential information for your event."
- Card container with settings icon at top
- **Dynamic fields** (mandatory, driven by `event_types.form_schema`):
  - Wedding: Partner 1 Name (text), Partner 2 Name (text)
  - Future types define their own fields
- **Common fields** (optional during creation, prompted post-creation):
  - Primary Event Date (date picker) — helper: "Date can be adjusted later if needed"
  - Primary Venue / City (text input with location icon)
  - Guest Capacity (number input — not in Figma but useful)
- "Continue to Next Step" CTA button
- "Back" link

### Step 3 — Sub-Event Selection

- **Conditional** — only shown if `event_type.has_sub_events === true`
- If event type has no sub-events (e.g., Birthday), skip directly to Step 4
  - Progress bar adjusts: shows "Step 3 of 3" for 3-step flow
- Progress: "Step 3 of 4: Sub-Events" — 75%
- Heading: "Sub-Event Selection"
- Subtitle: "Select the sub-events you are hosting for the wedding."
- Grid of selectable cards (3x3 on desktop):
  - Each card: icon + name, toggle-selectable (checkbox behavior)
  - Wedding sub-events: Haldi, Mehendi, Sangeet, Wedding Ceremony, Reception, Cocktail Party, Post-Wedding Brunch
  - "Add Custom Event" card: opens inline text input for custom name
- No date/time/venue fields — those are set post-creation from Event Management Dashboard
- "Continue to Review" CTA button (not "Create Event" — there's a review step)
- "← Back" link

### Step 4 — Review & Confirm

- Progress: "Step 4 of 4: Review & Confirm" — 100% (or "Step 3 of 3" if sub-events were skipped)
- Heading: "Review Your Event Details"
- **Basic Details section** with EDIT link (navigates back to Step 2):
  - Partner names (dynamic per type)
  - Date (or "Not set" if blank)
  - Venue (or "Not set" if blank)
- **Selected Sub-Events section** with EDIT link (navigates back to Step 3):
  - Grid of selected sub-events with icons
  - Each shows name only (no dates — TBC until set post-creation)
  - Only shown if sub-events were selected
- **Stats row:** Total Events Selected: X Events, Guest Capacity: Y Guests (or "Not set")
- **Info banner:** "You can add more sub-events or change details anytime from your dashboard after launching."
- "CONFIRM & LAUNCH DASHBOARD 🚀" CTA button
- "← Back to Sub-Events" link (or "← Back to Details" if sub-events were skipped)

---

## 5. Success Screen

- Route: `/events/[id]/success`
- **Hero:** "You're All Set!" with event-type-specific subtitle ("Your wedding dashboard is ready for you")
- **Quick action cards:** Days countdown to event (if date set), suggested next steps
- **"Go to Dashboard →"** CTA button → redirects to `/home`
- Celebratory visual/animation (confetti or decorative illustration)
- Footer: copyright + links

---

## 6. Host Dashboard Update

The existing `/home` page needs to be updated from placeholder content to show real event data.

### With Events (Normal State)

- Hero section: "Ready to plan your next big celebration?" with "Create New Event" CTA
- "Your Events" section: grid of event cards
- **Event card shows:**
  - Cover image (or gradient placeholder based on event type)
  - Event name (auto-generated from partner names for wedding: "Aarav & Ishani's Wedding")
  - Primary date (or "Date not set")
  - Primary venue (or "Venue not set")
  - Sub-event count badge (e.g., "4 events")
  - Click → `/events/[id]` (placeholder page showing event name + "Event Management Dashboard coming soon" until that feature is built)

### Empty State (No Events)

- Prominent "Create Your First Event" CTA (matches current design)
- Illustration/visual encouraging event creation
- Brief value proposition text

### Incomplete Setup Prompt

- If an event has missing date or venue, show a subtle indicator on the card (e.g., "Setup incomplete" badge)
- Dashboard-level banner: "Complete your event setup" linking to the event

---

## 7. Database Schema

### Approach: Relational with typed metadata (Approach B)

All dimension/lookup tables (event_types, sub_event_types) are admin-managed via the Admin Panel. For MVP, seed data is inserted via migration.

```sql
-- ============================================================
-- DIMENSION TABLES (Admin Panel manages CRUD for these)
-- ============================================================

-- Available event types
CREATE TABLE event_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,                    -- "Wedding"
  slug            text UNIQUE NOT NULL,             -- "wedding"
  description     text,                             -- Card description for Step 1
  icon_name       text,                             -- Icon identifier for frontend
  image_url       text,                             -- Card image for Step 1
  enabled         boolean NOT NULL DEFAULT false,   -- Controls visibility in wizard
  has_sub_events  boolean NOT NULL DEFAULT false,   -- Whether Step 3 is shown
  form_schema     jsonb NOT NULL DEFAULT '[]',      -- Dynamic fields for Step 2
  features        jsonb NOT NULL DEFAULT '[]',      -- Feature bullets on type card
  display_order   int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Available sub-event types per event type
CREATE TABLE sub_event_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id   uuid NOT NULL REFERENCES event_types(id) ON DELETE CASCADE,
  name            text NOT NULL,                    -- "Mehendi"
  slug            text NOT NULL,                    -- "mehendi"
  icon_name       text,                             -- Icon identifier
  display_order   int NOT NULL DEFAULT 0,
  is_default      boolean NOT NULL DEFAULT false,   -- Pre-selected when type chosen
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_type_id, slug)
);

-- ============================================================
-- FACT TABLES (User data, RLS-protected)
-- ============================================================

-- Core event record
CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type_id   uuid NOT NULL REFERENCES event_types(id),
  name            text,                             -- Display name (auto-generated or user-set)
  primary_date    date,                             -- Optional during creation
  primary_venue   text,                             -- Optional during creation
  guest_capacity  int,
  cover_image_url text,
  description     text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Type-specific metadata (key-value pairs)
CREATE TABLE event_metadata (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  key             text NOT NULL,                    -- "partner_1_name", "partner_2_name"
  value           text,
  UNIQUE(event_id, key)
);

-- User's selected sub-events for an event
CREATE TABLE event_sub_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sub_event_type_id uuid REFERENCES sub_event_types(id),  -- NULL for custom sub-events
  custom_name       text,                           -- For "Add Custom Event" entries
  date              date,                           -- Nullable, set post-creation
  time              time,                           -- Nullable, set post-creation
  venue             text,                           -- Nullable, set post-creation
  status            text NOT NULL DEFAULT 'tbc' CHECK (status IN ('tbc', 'confirmed', 'cancelled')),
  display_order     int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (sub_event_type_id IS NOT NULL OR custom_name IS NOT NULL)
);
```

### Row-Level Security

```sql
-- events: users can only access their own events
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- event_metadata: access through event ownership
ALTER TABLE event_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event metadata" ON event_metadata
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_metadata.event_id AND events.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_metadata.event_id AND events.user_id = auth.uid())
  );

-- event_sub_events: access through event ownership
ALTER TABLE event_sub_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event sub-events" ON event_sub_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_sub_events.event_id AND events.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_sub_events.event_id AND events.user_id = auth.uid())
  );

-- Dimension tables: public read, no public write
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read event types" ON event_types
  FOR SELECT USING (true);

ALTER TABLE sub_event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sub-event types" ON sub_event_types
  FOR SELECT USING (true);
```

### Triggers

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_sub_events_updated_at BEFORE UPDATE ON event_sub_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_types_updated_at BEFORE UPDATE ON event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Indexes

```sql
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type_id ON events(event_type_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_metadata_event_id ON event_metadata(event_id);
CREATE INDEX idx_event_sub_events_event_id ON event_sub_events(event_id);
CREATE INDEX idx_sub_event_types_event_type_id ON sub_event_types(event_type_id);
CREATE INDEX idx_event_types_enabled ON event_types(enabled);
```

---

## 8. Seed Data (MVP)

### Event Types

| name | slug | enabled | has_sub_events | form_schema |
|------|------|---------|----------------|-------------|
| Wedding | wedding | true | true | `[{"field":"partner_1_name","label":"Partner 1 Name","type":"text","required":true,"placeholder":"First Name"},{"field":"partner_2_name","label":"Partner 2 Name","type":"text","required":true,"placeholder":"First Name"}]` |
| Birthday | birthday | false | false | `[{"field":"celebrant_name","label":"Celebrant Name","type":"text","required":true,"placeholder":"Who's the birthday for?"}]` |
| Anniversary | anniversary | false | false | `[{"field":"partner_1_name","label":"Partner 1 Name","type":"text","required":true},{"field":"partner_2_name","label":"Partner 2 Name","type":"text","required":true}]` |
| Corporate Event | corporate | false | true | `[{"field":"organization_name","label":"Organization Name","type":"text","required":true}]` |
| Baby Shower | baby-shower | false | false | `[{"field":"parent_names","label":"Parent Name(s)","type":"text","required":true}]` |
| Other | other | false | false | `[]` |

### Wedding Sub-Event Types

| name | slug | icon_name | display_order | is_default |
|------|------|-----------|---------------|------------|
| Haldi | haldi | sparkles | 1 | false |
| Mehendi | mehendi | palette | 2 | false |
| Sangeet | sangeet | music | 3 | false |
| Wedding Ceremony | wedding-ceremony | heart | 4 | true |
| Reception | reception | utensils | 5 | true |
| Cocktail Party | cocktail-party | wine | 6 | false |
| Post-Wedding Brunch | post-wedding-brunch | coffee | 7 | false |

### Features (Wedding card)

```json
["Guest Management", "Budget Tracking", "Vendor Portal"]
```

---

## 9. API Routes

### `GET /api/event-types`

Returns enabled event types for the wizard.

```typescript
// Response
{
  eventTypes: {
    id: string
    name: string
    slug: string
    description: string
    iconName: string
    imageUrl: string | null
    hasSubEvents: boolean
    formSchema: FormField[]
    features: string[]
    displayOrder: number
  }[]
}
```

### `GET /api/event-types/[typeId]/sub-events`

Returns sub-event types for a given event type.

```typescript
// Response
{
  subEventTypes: {
    id: string
    name: string
    slug: string
    iconName: string
    displayOrder: number
    isDefault: boolean
  }[]
}
```

### `POST /api/events`

Creates a new event with metadata and sub-events in a single transaction.

```typescript
// Request body
{
  eventTypeId: string
  metadata: Record<string, string>     // { partner_1_name: "Aarav", partner_2_name: "Ishani" }
  primaryDate?: string                 // ISO date
  primaryVenue?: string
  guestCapacity?: number
  subEvents: {
    subEventTypeId?: string            // null for custom
    customName?: string                // for custom sub-events
  }[]
}

// Response
{
  event: {
    id: string
    name: string                       // Auto-generated: "Aarav & Ishani's Wedding"
    status: string
    createdAt: string
  }
}
```

**Auto-name generation:** For Wedding type, auto-generate event name as "[Partner 1] & [Partner 2]'s Wedding". For other types, use "[Event Type Name]" or let user set it.

### `GET /api/events`

Lists current user's events for the dashboard.

```typescript
// Response
{
  events: {
    id: string
    name: string
    eventType: { name: string, slug: string, iconName: string }
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    coverImageUrl: string | null
    status: string
    subEventCount: number
    createdAt: string
  }[]
}
```

### `GET /api/events/[id]`

Gets full event details (for success screen and future dashboard).

```typescript
// Response
{
  event: {
    id: string
    name: string
    eventType: { id: string, name: string, slug: string, hasSubEvents: boolean }
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    coverImageUrl: string | null
    description: string | null
    status: string
    metadata: Record<string, string>
    subEvents: {
      id: string
      name: string              // sub_event_type.name or custom_name
      iconName: string | null
      date: string | null
      time: string | null
      venue: string | null
      status: string
    }[]
    createdAt: string
    updatedAt: string
  }
}
```

---

## 10. Component Architecture

### Routes

```
app/events/create/page.tsx              → WizardShell (client component)
app/events/[id]/success/page.tsx        → OnboardingSuccess (server component)
app/home/page.tsx                       → Updated Host Dashboard (real data)
```

### Wizard Components

```
WizardShell (client)
  ├── WizardProvider (React Context + useReducer)
  ├── WizardProgress             → Step indicator bar with percentage
  ├── Step1EventType             → Event type cards grid
  │     └── EventTypeCard        → Individual type card (active/disabled states)
  ├── Step2BasicDetails          → Dynamic form
  │     ├── DynamicField         → Renders field from form_schema
  │     └── CommonFields         → Date picker, venue input, guest capacity
  ├── Step3SubEvents             → Sub-event selection grid (conditional)
  │     ├── SubEventCard         → Toggle-selectable card
  │     └── AddCustomSubEvent    → Inline text input for custom entries
  └── Step4ReviewConfirm         → Summary with edit links
        ├── ReviewSection        → Grouped section with EDIT link
        └── StatsRow             → Total sub-events, guest capacity
```

### Wizard State

```typescript
interface WizardState {
  currentStep: number
  totalSteps: number                    // 4 or 3 depending on has_sub_events
  eventType: EventType | null
  basicDetails: {
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    metadata: Record<string, string>    // type-specific fields
  }
  selectedSubEvents: {
    subEventTypeId: string | null       // null for custom
    customName: string | null
  }[]
}

type WizardAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_BASIC_DETAILS'; payload: WizardState['basicDetails'] }
  | { type: 'TOGGLE_SUB_EVENT'; payload: { subEventTypeId: string } }
  | { type: 'ADD_CUSTOM_SUB_EVENT'; payload: { name: string } }
  | { type: 'REMOVE_CUSTOM_SUB_EVENT'; payload: { index: number } }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' }
```

### Validation (Zod)

```typescript
// Step 1: must have event type selected
const step1Schema = z.object({
  eventType: z.object({ id: z.string().uuid() }).nullable().refine(v => v !== null, "Select an event type")
})

// Step 2: dynamic fields are required, common fields optional
const step2Schema = z.object({
  metadata: z.record(z.string()),       // validated against form_schema at runtime
  primaryDate: z.string().nullable(),
  primaryVenue: z.string().nullable(),
  guestCapacity: z.number().positive().nullable(),
})

// Step 3: at least one sub-event (if step is shown)
const step3Schema = z.object({
  selectedSubEvents: z.array(z.object({
    subEventTypeId: z.string().uuid().nullable(),
    customName: z.string().nullable(),
  })).min(1, "Select at least one sub-event")
})

// API create payload
const createEventSchema = z.object({
  eventTypeId: z.string().uuid(),
  metadata: z.record(z.string()),
  primaryDate: z.string().date().nullable().optional(),
  primaryVenue: z.string().nullable().optional(),
  guestCapacity: z.number().positive().nullable().optional(),
  subEvents: z.array(z.object({
    subEventTypeId: z.string().uuid().nullable(),
    customName: z.string().nullable(),
  })),
})
```

---

## 11. UX Behaviors

### Wizard Navigation

- Progress bar shows "Step X of Y" with percentage
- Y is 4 for types with sub-events, 3 for types without
- Back button on every step except Step 1
- Step validation before advancing — can't proceed with empty required fields
- Back navigation preserves all data (state in context)
- URL query param `?step=N` tracks current step for browser back/forward
- Browser back button works naturally

### Step 3 Conditional Logic

- After Step 2, check `eventType.hasSubEvents`
- If `true` → show Step 3, progress shows "Step 3 of 4"
- If `false` → skip to Review, progress shows "Step 3 of 3"
- The Review step always says "100% COMPLETE"

### Event Name Auto-Generation

- **Wedding:** "[Partner 1] & [Partner 2]'s Wedding"
- **Birthday:** "[Celebrant]'s Birthday"
- **Corporate:** "[Organization] Event"
- **Other / fallback:** "[Event Type] Event"
- User can later rename from Event Settings (not in this feature's scope)

### Host Dashboard Event Cards

- Show real events from `/api/events` (replaces current placeholder)
- Cards link to `/events/[id]` — for now, this shows a minimal "Event created" page or redirects to `/home` (until Event Management Dashboard is built)
- "Create New Event" button → `/events/create`
- Events sorted by created_at descending (newest first)
- Incomplete events show a subtle "Setup incomplete" indicator if date or venue is missing

### Error Handling

- Network errors during submit: show toast, preserve wizard state, allow retry
- Validation errors: highlight fields, show inline error messages
- Auth errors: redirect to `/auth`
- Duplicate event detection: not needed for MVP (users can create multiple events)

---

## 12. Design References

### Figma

- **File:** [Evenzi](https://www.figma.com/design/LjoTKwL7pkpYVnAW6hr4s8/Evenzi?node-id=27-1015)
- **Section:** HOST ONBOARDING
- **Screens:** Step 1 (Event Type Selection), Step 2 (Basic Details), Step 3 (Sub-Event Selection — Updated), Step 4 (Review & Confirm — labeled Step 5 in Figma), Onboarding Success

### Stitch

- **Project:** [Evenzi UI 1.0](https://stitch.withgoogle.com/projects/3859360114226566614)
- **Sections:** Host Management Dashboard (Overview), Event Settings (6 tabs — separate feature)
- **Note:** Step 3 has updated designs in Stitch (to be referenced during implementation)

### Key Design Observations

- Figma progress bar is inconsistent: Steps 1-4 show "of 4", Step 5 shows "of 5"
- **Spec decision:** We use 4 steps (template deferred), progress shows "of 4" or "of 3" depending on sub-event support
- Step 3 in Figma shows "Create Event" as the CTA — we change this to "Continue to Review" since there's a Review step
- The "Evenzi" branding in the top-left of wizard screens uses the Figma design (dark logo on white)

---

## 13. Acceptance Criteria

1. User can complete the full 4-step wizard and create a Wedding event
2. Wizard validates required fields before step advancement
3. Wizard preserves state when navigating back/forward between steps
4. Event type cards show Wedding as active, others as "Coming Soon"
5. Dynamic form fields render correctly based on event type's form_schema
6. Sub-event selection allows toggling predefined types and adding custom entries
7. Review step displays all entered data with working EDIT links
8. Confirming creates the event, metadata, and sub-events in a single transaction
9. Success screen shows "You're All Set!" with event-type-specific message
10. "Go to Dashboard" redirects to `/home`
11. Host Dashboard displays real event cards from the database
12. Empty state shows "Create Your First Event" CTA
13. Event cards show name, date, venue, and sub-event count
14. Events with missing date/venue show "Setup incomplete" indicator
15. All tables have RLS policies — users can only access their own data
16. Dimension tables (event_types, sub_event_types) are publicly readable

---

## 14. Technical Notes

- **State management:** React Context + useReducer (no external state library)
- **Form validation:** Zod schemas, validated on step navigation and API submission
- **API pattern:** Next.js App Router API routes under `/api/events/` and `/api/event-types/`
- **Database:** Supabase PostgreSQL with RLS, server-side client for API routes
- **Styling:** Tailwind CSS utility classes, mobile-first responsive
- **No component library dependency:** This feature uses basic HTML elements + Tailwind. Reusable components will be extracted to the Component Library feature later.
- **Dimension tables are admin-managed:** event_types and sub_event_types are seeded via migration for MVP but designed for full CRUD via the Admin Panel.

---

## 15. Dependencies

| Dependency | Status | Impact |
|------------|--------|--------|
| Auth & Role Selection | DONE | User must be logged in to create events |
| Supabase project | LIVE | Database + Auth |
| Component Library | NOT STARTED | Not a blocker — we use plain Tailwind for MVP |
| Supabase Storage | NOT SET UP | Cover image upload deferred |

---

## 16. Future Enhancements (Not in This Spec)

- Cover image upload in wizard (requires Supabase Storage)
- Template Selection step (when Digital Presence is built)
- Multi-event support on dashboard (event switcher dropdown)
- Event duplication
- Draft auto-save (save wizard progress to localStorage)
- Event sharing / collaboration (multi-host) — Stitch has "Manage Admins" design with Owner/Editor/Viewer roles, email invites, and status tracking. Build as part of Event Settings > Admins feature. Will need `event_collaborators` table + RLS updates.
