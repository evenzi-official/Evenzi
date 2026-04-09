# Event CRUD (4-Step Creation Wizard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 4-step event creation wizard, onboarding success screen, and update the host dashboard to display real event cards from the database.

**Architecture:** Next.js App Router pages for wizard and success screen. React Context + useReducer for wizard state management. Supabase PostgreSQL for 5 new tables with RLS + an RPC function for atomic event creation. Next.js API routes for event operations. Zod for validation on both client and server.

**Tech Stack:** Next.js 14 (App Router), TypeScript, React 18, Tailwind CSS 4, Supabase (PostgreSQL + Auth), Zod, Vitest

**Spec:** `docs/superpowers/specs/2026-04-09-event-crud-design.md`

**Review Status:** Approved — 2026-04-09
**Reviewed by:** Tech Lead, Security Expert, Data Modeller, Frontend Engineer

**Design References:**
- Figma: [HOST ONBOARDING section](https://www.figma.com/design/LjoTKwL7pkpYVnAW6hr4s8/Evenzi?node-id=27-1015)
- Stitch: [Evenzi UI 1.0](https://stitch.withgoogle.com/projects/3859360114226566614) — updated Step 3, Success screen

---

## Review History

All 23 findings (3 critical, 12 important, 8 suggestions) from the multi-agent plan review have been incorporated:

| ID | Fix Applied |
|----|-------------|
| C1 | Event creation wrapped in Supabase RPC for atomic insert (Task 2 + Task 5) |
| C2 | API returns all event types (enabled + disabled). Step1 renders from `enabled` flag (Task 4 + Task 7) |
| C3 | `WizardState.selectedSubEvents` now includes `name` and `iconName` fields (Task 6 + Task 10) |
| I1 | Host-role check added to middleware for `/events/*` routes (Task 13) |
| I2 | `sub_event_types` now has `updated_at` column + trigger (Task 2) |
| I3 | `event_metadata` now has `updated_at` column + trigger (Task 2) |
| I4 | UUID validation on `typeId` path param in sub-events API (Task 4) |
| I5 | `subEvents` array capped at `.max(50)` in createEventSchema (Task 1) |
| I6 | Metadata values capped at `.max(500)` in createEventSchema (Task 1) |
| I7 | Metadata key count limited to 20 via `.refine()` (Task 1) |
| I8 | `POST /api/events` checks `enabled: true` on event type lookup (Task 5) |
| I9 | URL sync simplified — URL is source of truth, no bidirectional effects (Task 7) |
| I10 | `EventTypeCard` uses semantic `<button>` with keyboard/a11y support (Task 7) |
| I11 | Home page converted to server component + thin client `EventsGrid` (Task 12) |
| I12 | `EventTypeCard` ring color uses Tailwind CSS variable approach (Task 7) |
| S1 | `generateEventName` handles empty/whitespace names with fallback (Task 5) |
| S2 | Index added on `event_sub_events(sub_event_type_id)` (Task 2) |
| S3 | Guest capacity field added to Step2 UI (Task 8) |
| S4 | `createEventSchema` metadata validation aligned with `step2Schema` — uses `.min(1)` (Task 1) |
| S5 | Auto-select defaults uses batch `SET_DEFAULT_SUB_EVENTS` action (Task 6 + Task 9) |
| S6 | Copyright year corrected to 2026 (Task 7) |
| S7 | `sub_event_types` FK changed to `ON DELETE RESTRICT` (Task 2) |
| S8 | Migration checks for existing `update_updated_at()` function with `CREATE OR REPLACE` (Task 2) |

---

## File Structure

### New Files

```
# Types & validation
lib/types/events.ts                         — TypeScript types for events, event_types, sub_events, metadata
lib/validations/events.ts                   — Zod schemas for wizard steps and API payloads

# API routes
app/api/event-types/route.ts                — GET all event types (enabled + disabled)
app/api/event-types/[typeId]/sub-events/route.ts — GET sub-event types for a type
app/api/events/route.ts                     — POST create event, GET list user events
app/api/events/[id]/route.ts                — GET event details

# Wizard pages & components
app/events/create/page.tsx                  — Wizard shell page
lib/contexts/WizardContext.tsx               — React Context + useReducer for wizard state
app/events/create/components/WizardProgress.tsx     — Progress bar component
app/events/create/components/Step1EventType.tsx     — Event type selection
app/events/create/components/EventTypeCard.tsx      — Individual type card (accessible button)
app/events/create/components/Step2BasicDetails.tsx  — Dynamic form with guest capacity
app/events/create/components/Step3SubEvents.tsx     — Sub-event selection
app/events/create/components/SubEventCard.tsx       — Toggle-selectable sub-event card
app/events/create/components/Step4ReviewConfirm.tsx — Review summary with resolved names

# Success screen
app/events/[id]/success/page.tsx            — Onboarding success page

# Event placeholder (until dashboard feature is built)
app/events/[id]/page.tsx                    — Minimal event placeholder page

# Dashboard components
app/home/page.tsx                           — Server component (data fetch)
app/home/EventsGrid.tsx                     — Client component (interactivity)

# Tests
__tests__/lib/validations/events.test.ts    — Zod schema tests
__tests__/api/event-types/route.test.ts     — Event types API tests
__tests__/api/events/route.test.ts          — Events API tests (create + list)
__tests__/api/events/[id]/route.test.ts     — Event detail API tests
__tests__/lib/contexts/WizardContext.test.ts — Wizard reducer tests
```

### Modified Files

```
lib/supabase/middleware.ts                  — Add host-role check for /events/* routes
```

---

## Task Overview

| Task | Description | Depends On |
|------|-------------|------------|
| 1 | Types & Zod validation schemas | — |
| 2 | Database migration: tables, RLS, triggers, indexes, RPC | — |
| 3 | Database migration: seed data | 2 |
| 4 | API: GET event types (all) + GET sub-event types | 1, 2, 3 |
| 5 | API: POST create event (via RPC) + GET list events + GET event by ID | 1, 2 |
| 6 | Wizard state: React Context + useReducer | 1 |
| 7 | Wizard UI: WizardProgress + Step1EventType + WizardShell | 6, 4 |
| 8 | Wizard UI: Step2BasicDetails (with guest capacity) | 6 |
| 9 | Wizard UI: Step3SubEvents (with batch default selection) | 6, 4 |
| 10 | Wizard UI: Step4ReviewConfirm + form submission (with resolved names) | 6, 5 |
| 11 | Success screen | 5 |
| 12 | Host Dashboard — server component with real event cards | 5 |
| 13 | Middleware host-role check + event placeholder page | — |
| 14 | Integration testing | All |

**Parallel opportunities:** Tasks 1-2 are independent foundations. Tasks 4+5 can run in parallel. Tasks 7, 8, 9 can run in parallel once Task 6 is done. Task 13 is independent.

---

## Task 1: Types & Zod Validation Schemas

**Files:**
- Create: `lib/types/events.ts`
- Create: `lib/validations/events.ts`
- Create: `__tests__/lib/validations/events.test.ts`

- [ ] **Step 1: Write types file**

```typescript
// lib/types/events.ts

// --- Form schema field definition (stored in event_types.form_schema) ---
export interface FormSchemaField {
  field: string
  label: string
  type: 'text' | 'number' | 'date' | 'select'
  required: boolean
  placeholder?: string
  options?: string[] // for select type
}

// --- Event Types (dimension table) ---
export interface EventType {
  id: string
  name: string
  slug: string
  description: string | null
  iconName: string | null
  imageUrl: string | null
  enabled: boolean
  hasSubEvents: boolean
  formSchema: FormSchemaField[]
  features: string[]
  displayOrder: number
}

// --- Sub-Event Types (dimension table) ---
export interface SubEventType {
  id: string
  name: string
  slug: string
  iconName: string | null
  displayOrder: number
  isDefault: boolean
}

// --- Event (fact table) ---
export interface Event {
  id: string
  userId: string
  eventTypeId: string
  name: string | null
  primaryDate: string | null
  primaryVenue: string | null
  guestCapacity: number | null
  coverImageUrl: string | null
  description: string | null
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createdAt: string
  updatedAt: string
}

// --- Event with relations (for API responses) ---
export interface EventWithDetails extends Omit<Event, 'userId' | 'eventTypeId'> {
  eventType: Pick<EventType, 'id' | 'name' | 'slug' | 'iconName' | 'hasSubEvents'>
  metadata: Record<string, string>
  subEvents: EventSubEvent[]
}

export interface EventListItem {
  id: string
  name: string | null
  eventType: Pick<EventType, 'name' | 'slug' | 'iconName'>
  primaryDate: string | null
  primaryVenue: string | null
  guestCapacity: number | null
  coverImageUrl: string | null
  status: string
  subEventCount: number
  createdAt: string
}

// --- Event Sub-Events ---
export interface EventSubEvent {
  id: string
  name: string
  iconName: string | null
  date: string | null
  time: string | null
  venue: string | null
  status: 'tbc' | 'confirmed' | 'cancelled'
}

// --- Selected sub-event in wizard state (includes name for display) ---
export interface SelectedSubEvent {
  subEventTypeId: string | null
  customName: string | null
  name: string        // display name (resolved from type or custom)
  iconName: string | null
}

// --- API request types ---
export interface CreateEventPayload {
  eventTypeId: string
  metadata: Record<string, string>
  primaryDate?: string | null
  primaryVenue?: string | null
  guestCapacity?: number | null
  subEvents: {
    subEventTypeId?: string | null
    customName?: string | null
  }[]
}

// --- DB row types (snake_case from Supabase) ---
export interface EventTypeRow {
  id: string
  name: string
  slug: string
  description: string | null
  icon_name: string | null
  image_url: string | null
  enabled: boolean
  has_sub_events: boolean
  form_schema: FormSchemaField[]
  features: string[]
  display_order: number
  created_at: string
  updated_at: string
}

export interface SubEventTypeRow {
  id: string
  event_type_id: string
  name: string
  slug: string
  icon_name: string | null
  display_order: number
  is_default: boolean
  created_at: string
}

export interface EventRow {
  id: string
  user_id: string
  event_type_id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface EventMetadataRow {
  id: string
  event_id: string
  key: string
  value: string | null
}

export interface EventSubEventRow {
  id: string
  event_id: string
  sub_event_type_id: string | null
  custom_name: string | null
  date: string | null
  time: string | null
  venue: string | null
  status: string
  display_order: number
  created_at: string
  updated_at: string
}

// --- Row-to-type mappers ---
export function mapEventTypeRow(row: EventTypeRow): EventType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    iconName: row.icon_name,
    imageUrl: row.image_url,
    enabled: row.enabled,
    hasSubEvents: row.has_sub_events,
    formSchema: row.form_schema,
    features: row.features,
    displayOrder: row.display_order,
  }
}

export function mapSubEventTypeRow(row: SubEventTypeRow): SubEventType {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    iconName: row.icon_name,
    displayOrder: row.display_order,
    isDefault: row.is_default,
  }
}
```

- [ ] **Step 2: Write Zod validation schemas**

```typescript
// lib/validations/events.ts
import { z } from 'zod'

// Step 1: event type must be selected
export const step1Schema = z.object({
  eventTypeId: z.string().uuid('Select an event type'),
})

// Step 2: dynamic metadata fields required, common fields optional
export const step2Schema = z.object({
  metadata: z.record(z.string().min(1, 'This field is required')),
  primaryDate: z.string().nullable().optional(),
  primaryVenue: z.string().nullable().optional(),
  guestCapacity: z.coerce.number().int().positive().nullable().optional(),
})

// Step 3: at least one sub-event selected
export const step3Schema = z.object({
  selectedSubEvents: z
    .array(
      z.object({
        subEventTypeId: z.string().uuid().nullable(),
        customName: z.string().min(1).nullable(),
        name: z.string(),
        iconName: z.string().nullable(),
      })
    )
    .min(1, 'Select at least one sub-event'),
})

// Full create event API payload — [I5] max 50 sub-events, [I6] max 500 char values, [I7] max 20 keys, [S4] min(1) aligned
export const createEventSchema = z.object({
  eventTypeId: z.string().uuid(),
  metadata: z
    .record(z.string().min(1).max(500))
    .refine((obj) => Object.keys(obj).length <= 20, 'Too many metadata fields (max 20)'),
  primaryDate: z.string().date().nullable().optional(),
  primaryVenue: z.string().max(500).nullable().optional(),
  guestCapacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
  subEvents: z
    .array(
      z
        .object({
          subEventTypeId: z.string().uuid().nullable().optional(),
          customName: z.string().min(1).max(100).nullable().optional(),
        })
        .refine(
          (data) => data.subEventTypeId != null || data.customName != null,
          'Sub-event must have either a type ID or custom name'
        )
    )
    .max(50, 'Too many sub-events (max 50)'),
})

export type Step1Data = z.infer<typeof step1Schema>
export type Step2Data = z.infer<typeof step2Schema>
export type Step3Data = z.infer<typeof step3Schema>
export type CreateEventData = z.infer<typeof createEventSchema>

/**
 * Validate Step 2 dynamic fields against the event type's form_schema.
 * Returns array of field-level errors, or empty array if valid.
 */
export function validateDynamicFields(
  metadata: Record<string, string>,
  formSchema: { field: string; label: string; required: boolean }[]
): { field: string; message: string }[] {
  const errors: { field: string; message: string }[] = []
  for (const fieldDef of formSchema) {
    if (fieldDef.required) {
      const value = metadata[fieldDef.field]
      if (!value || value.trim() === '') {
        errors.push({ field: fieldDef.field, message: `${fieldDef.label} is required` })
      }
    }
  }
  return errors
}
```

- [ ] **Step 3: Write validation tests**

```typescript
// __tests__/lib/validations/events.test.ts
import { describe, it, expect } from 'vitest'
import {
  step1Schema,
  step2Schema,
  step3Schema,
  createEventSchema,
  validateDynamicFields,
} from '@/lib/validations/events'

describe('step1Schema', () => {
  it('accepts valid event type ID', () => {
    const result = step1Schema.safeParse({ eventTypeId: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(true)
  })

  it('rejects missing event type', () => {
    const result = step1Schema.safeParse({ eventTypeId: '' })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID event type', () => {
    const result = step1Schema.safeParse({ eventTypeId: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })
})

describe('step2Schema', () => {
  it('accepts valid data with all fields', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      primaryDate: '2026-12-14',
      primaryVenue: 'The Grand Oberoi, Udaipur',
      guestCapacity: 350,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal data (optional common fields omitted)', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty required metadata value', () => {
    const result = step2Schema.safeParse({
      metadata: { partner_1_name: '' },
    })
    expect(result.success).toBe(false)
  })
})

describe('step3Schema', () => {
  it('accepts at least one sub-event with name', () => {
    const result = step3Schema.safeParse({
      selectedSubEvents: [{ subEventTypeId: '550e8400-e29b-41d4-a716-446655440000', customName: null, name: 'Mehendi', iconName: 'palette' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts custom sub-event', () => {
    const result = step3Schema.safeParse({
      selectedSubEvents: [{ subEventTypeId: null, customName: 'After Party', name: 'After Party', iconName: null }],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty sub-event list', () => {
    const result = step3Schema.safeParse({ selectedSubEvents: [] })
    expect(result.success).toBe(false)
  })
})

describe('createEventSchema', () => {
  it('accepts full valid payload', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      primaryDate: '2026-12-14',
      primaryVenue: 'Udaipur',
      guestCapacity: 350,
      subEvents: [
        { subEventTypeId: '550e8400-e29b-41d4-a716-446655440001', customName: null },
        { subEventTypeId: null, customName: 'After Party' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('rejects sub-event with neither type ID nor custom name', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {},
      subEvents: [{ subEventTypeId: null, customName: null }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 50 sub-events [I5]', () => {
    const subEvents = Array.from({ length: 51 }, (_, i) => ({
      subEventTypeId: `550e8400-e29b-41d4-a716-44665544${String(i).padStart(4, '0')}`,
    }))
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: {},
      subEvents,
    })
    expect(result.success).toBe(false)
  })

  it('rejects metadata value exceeding 500 chars [I6]', () => {
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata: { partner_1_name: 'A'.repeat(501) },
      subEvents: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 20 metadata keys [I7]', () => {
    const metadata: Record<string, string> = {}
    for (let i = 0; i < 21; i++) metadata[`field_${i}`] = 'value'
    const result = createEventSchema.safeParse({
      eventTypeId: '550e8400-e29b-41d4-a716-446655440000',
      metadata,
      subEvents: [],
    })
    expect(result.success).toBe(false)
  })
})

describe('validateDynamicFields', () => {
  const weddingSchema = [
    { field: 'partner_1_name', label: 'Partner 1 Name', required: true },
    { field: 'partner_2_name', label: 'Partner 2 Name', required: true },
  ]

  it('returns no errors when all required fields are filled', () => {
    const errors = validateDynamicFields(
      { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
      weddingSchema
    )
    expect(errors).toEqual([])
  })

  it('returns errors for missing required fields', () => {
    const errors = validateDynamicFields({ partner_1_name: 'Aarav' }, weddingSchema)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('partner_2_name')
  })

  it('returns errors for empty string values', () => {
    const errors = validateDynamicFields(
      { partner_1_name: '', partner_2_name: '  ' },
      weddingSchema
    )
    expect(errors).toHaveLength(2)
  })
})
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/lib/validations/events.test.ts`
Expected: All 14 tests PASS

- [ ] **Step 5: Commit**

```bash
git add lib/types/events.ts lib/validations/events.ts __tests__/lib/validations/events.test.ts
git commit -m "feat(events): add types and Zod validation schemas for event CRUD"
```

---

## Task 2: Database Migration — Tables, RLS, Triggers, Indexes, RPC

**Files:**
- Run via Supabase MCP: `apply_migration`

**Note:** The `update_updated_at()` function may already exist from the `user_profiles` migration [S8]. Using `CREATE OR REPLACE` ensures it works whether or not the function exists.

- [ ] **Step 1: Verify existing function**

Run: `execute_sql` with `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'update_updated_at';`
Note the result — if it exists, `CREATE OR REPLACE` will safely overwrite with identical body.

- [ ] **Step 2: Apply migration for dimension tables**

Use Supabase MCP `apply_migration` with project ID `smjkbmkxweevqpvygabe`:

```sql
-- Migration: create_event_dimension_tables

-- Trigger function (CREATE OR REPLACE is safe if already exists) [S8]
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Available event types (admin-managed via Admin Panel)
CREATE TABLE event_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text UNIQUE NOT NULL,
  description     text,
  icon_name       text,
  image_url       text,
  enabled         boolean NOT NULL DEFAULT false,
  has_sub_events  boolean NOT NULL DEFAULT false,
  form_schema     jsonb NOT NULL DEFAULT '[]'::jsonb,
  features        jsonb NOT NULL DEFAULT '[]'::jsonb,
  display_order   int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Available sub-event types per event type [I2: added updated_at] [S7: ON DELETE RESTRICT]
CREATE TABLE sub_event_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type_id   uuid NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
  name            text NOT NULL,
  slug            text NOT NULL,
  icon_name       text,
  display_order   int NOT NULL DEFAULT 0,
  is_default      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_type_id, slug)
);

-- RLS: public read for dimension tables
ALTER TABLE event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read event types" ON event_types FOR SELECT USING (true);

ALTER TABLE sub_event_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read sub-event types" ON sub_event_types FOR SELECT USING (true);

-- Indexes
CREATE INDEX idx_event_types_enabled ON event_types(enabled);
CREATE INDEX idx_sub_event_types_event_type_id ON sub_event_types(event_type_id);

-- Triggers
CREATE TRIGGER event_types_updated_at BEFORE UPDATE ON event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER sub_event_types_updated_at BEFORE UPDATE ON sub_event_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 3: Apply migration for fact tables**

```sql
-- Migration: create_event_fact_tables

-- Core event record
CREATE TABLE events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type_id   uuid NOT NULL REFERENCES event_types(id) ON DELETE RESTRICT,
  name            text,
  primary_date    date,
  primary_venue   text,
  guest_capacity  int,
  cover_image_url text,
  description     text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Type-specific metadata (key-value pairs) [I3: added updated_at]
CREATE TABLE event_metadata (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  key             text NOT NULL,
  value           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, key)
);

-- User's selected sub-events for an event
CREATE TABLE event_sub_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  sub_event_type_id uuid REFERENCES sub_event_types(id),
  custom_name       text,
  date              date,
  time              time,
  venue             text,
  status            text NOT NULL DEFAULT 'tbc' CHECK (status IN ('tbc', 'confirmed', 'cancelled')),
  display_order     int NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CHECK (sub_event_type_id IS NOT NULL OR custom_name IS NOT NULL)
);

-- RLS policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own events" ON events
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

ALTER TABLE event_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event metadata" ON event_metadata
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_metadata.event_id AND events.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_metadata.event_id AND events.user_id = auth.uid())
  );

ALTER TABLE event_sub_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own event sub-events" ON event_sub_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_sub_events.event_id AND events.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_sub_events.event_id AND events.user_id = auth.uid())
  );

-- Indexes [S2: added sub_event_type_id index]
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event_type_id ON events(event_type_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_event_metadata_event_id ON event_metadata(event_id);
CREATE INDEX idx_event_sub_events_event_id ON event_sub_events(event_id);
CREATE INDEX idx_event_sub_events_sub_event_type_id ON event_sub_events(sub_event_type_id);

-- Triggers [I3: event_metadata trigger added]
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_metadata_updated_at BEFORE UPDATE ON event_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_sub_events_updated_at BEFORE UPDATE ON event_sub_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 4: Apply migration for RPC function [C1 — atomic event creation]**

```sql
-- Migration: create_event_rpc

-- Atomic event creation: inserts event + metadata + sub-events in one transaction
CREATE OR REPLACE FUNCTION create_event_with_details(
  p_user_id uuid,
  p_event_type_id uuid,
  p_name text,
  p_primary_date date DEFAULT NULL,
  p_primary_venue text DEFAULT NULL,
  p_guest_capacity int DEFAULT NULL,
  p_metadata jsonb DEFAULT '[]'::jsonb,
  p_sub_events jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_meta jsonb;
  v_sub jsonb;
BEGIN
  -- Insert event
  INSERT INTO events (user_id, event_type_id, name, primary_date, primary_venue, guest_capacity, status)
  VALUES (p_user_id, p_event_type_id, p_name, p_primary_date, p_primary_venue, p_guest_capacity, 'active')
  RETURNING id INTO v_event_id;

  -- Insert metadata entries
  FOR v_meta IN SELECT * FROM jsonb_array_elements(p_metadata)
  LOOP
    INSERT INTO event_metadata (event_id, key, value)
    VALUES (v_event_id, v_meta->>'key', v_meta->>'value');
  END LOOP;

  -- Insert sub-events
  FOR v_sub IN SELECT * FROM jsonb_array_elements(p_sub_events)
  LOOP
    INSERT INTO event_sub_events (event_id, sub_event_type_id, custom_name, display_order)
    VALUES (
      v_event_id,
      CASE WHEN v_sub->>'sub_event_type_id' = '' THEN NULL ELSE (v_sub->>'sub_event_type_id')::uuid END,
      NULLIF(v_sub->>'custom_name', ''),
      COALESCE((v_sub->>'display_order')::int, 0)
    );
  END LOOP;

  RETURN v_event_id;
END;
$$;
```

- [ ] **Step 5: Verify tables and RPC exist**

Run: `execute_sql` with `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'event%' ORDER BY table_name;`
Expected: event_metadata, event_sub_events, event_types, events, sub_event_types

Run: `execute_sql` with `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_name = 'create_event_with_details';`
Expected: 1 row

- [ ] **Step 6: Commit**

```bash
git commit --allow-empty -m "feat(db): create event tables with RLS, triggers, indexes, and atomic creation RPC"
```

---

## Task 3: Database Migration — Seed Data

**Files:**
- Run via Supabase MCP: `apply_migration`

- [ ] **Step 1: Seed event types**

```sql
-- Migration: seed_event_types

INSERT INTO event_types (name, slug, description, icon_name, image_url, enabled, has_sub_events, form_schema, features, display_order) VALUES
  ('Wedding', 'wedding', 'Full suite of planning tools including guest lists, vendor management, seating charts, and timeline creation.', 'heart', NULL, true, true,
   '[{"field":"partner_1_name","label":"Partner 1 Name","type":"text","required":true,"placeholder":"First Name"},{"field":"partner_2_name","label":"Partner 2 Name","type":"text","required":true,"placeholder":"First Name"}]'::jsonb,
   '["Guest Management", "Budget Tracking", "Vendor Portal"]'::jsonb, 1),
  ('Birthday', 'birthday', 'Plan the perfect birthday celebration with invitations, RSVPs, and party planning tools.', 'cake', NULL, false, false,
   '[{"field":"celebrant_name","label":"Celebrant Name","type":"text","required":true,"placeholder":"Who''s the birthday for?"}]'::jsonb,
   '["Guest Management", "Budget Tracking"]'::jsonb, 2),
  ('Anniversary', 'anniversary', 'Celebrate your milestone with a beautifully organized anniversary event.', 'gem', NULL, false, false,
   '[{"field":"partner_1_name","label":"Partner 1 Name","type":"text","required":true},{"field":"partner_2_name","label":"Partner 2 Name","type":"text","required":true}]'::jsonb,
   '["Guest Management", "Budget Tracking"]'::jsonb, 3),
  ('Corporate Event', 'corporate', 'Professional event management for conferences, team events, and corporate gatherings.', 'briefcase', NULL, false, true,
   '[{"field":"organization_name","label":"Organization Name","type":"text","required":true}]'::jsonb,
   '["Guest Management", "Budget Tracking"]'::jsonb, 4),
  ('Baby Shower', 'baby-shower', 'Plan a wonderful baby shower with gift registries, games, and guest management.', 'baby', NULL, false, false,
   '[{"field":"parent_names","label":"Parent Name(s)","type":"text","required":true}]'::jsonb,
   '["Guest Management", "Budget Tracking"]'::jsonb, 5),
  ('Other', 'other', 'Create any type of event with our flexible planning tools.', 'calendar', NULL, false, false,
   '[]'::jsonb,
   '["Guest Management"]'::jsonb, 6);
```

- [ ] **Step 2: Seed wedding sub-event types**

```sql
-- Migration: seed_wedding_sub_event_types

INSERT INTO sub_event_types (event_type_id, name, slug, icon_name, display_order, is_default)
SELECT et.id, s.name, s.slug, s.icon_name, s.display_order, s.is_default
FROM event_types et
CROSS JOIN (VALUES
  ('Haldi', 'haldi', 'sparkles', 1, false),
  ('Mehendi', 'mehendi', 'palette', 2, false),
  ('Sangeet', 'sangeet', 'music', 3, false),
  ('Wedding Ceremony', 'wedding-ceremony', 'heart', 4, true),
  ('Reception', 'reception', 'utensils', 5, true),
  ('Cocktail Party', 'cocktail-party', 'wine', 6, false),
  ('Post-Wedding Brunch', 'post-wedding-brunch', 'coffee', 7, false)
) AS s(name, slug, icon_name, display_order, is_default)
WHERE et.slug = 'wedding';
```

- [ ] **Step 3: Verify seed data**

Run: `execute_sql` with `SELECT name, slug, enabled FROM event_types ORDER BY display_order;`
Expected: 6 rows — Wedding (enabled=true), rest (enabled=false)

Run: `execute_sql` with `SELECT set.name FROM sub_event_types set JOIN event_types et ON et.id = set.event_type_id WHERE et.slug = 'wedding' ORDER BY set.display_order;`
Expected: 7 rows

- [ ] **Step 4: Commit**

```bash
git commit --allow-empty -m "feat(db): seed event types and wedding sub-event types"
```

---

## Task 4: API — Event Types & Sub-Event Types

**Files:**
- Create: `app/api/event-types/route.ts`
- Create: `app/api/event-types/[typeId]/sub-events/route.ts`
- Create: `__tests__/api/event-types/route.test.ts`

- [ ] **Step 1: Write event types API test**

```typescript
// __tests__/api/event-types/route.test.ts
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('GET /api/event-types', () => {
  it('returns all event types sorted by display_order [C2]', async () => {
    const mockTypes = [
      {
        id: 'type-1', name: 'Wedding', slug: 'wedding', description: 'desc',
        icon_name: 'heart', image_url: null, enabled: true, has_sub_events: true,
        form_schema: [], features: ['Guest Management'], display_order: 1,
      },
      {
        id: 'type-2', name: 'Birthday', slug: 'birthday', description: 'desc',
        icon_name: 'cake', image_url: null, enabled: false, has_sub_events: false,
        form_schema: [], features: [], display_order: 2,
      },
    ]

    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockTypes, error: null }),
        }),
      }),
    } as any)

    const { GET } = await import('@/app/api/event-types/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.eventTypes).toHaveLength(2)
    expect(json.eventTypes[0].enabled).toBe(true)
    expect(json.eventTypes[1].enabled).toBe(false)
  })
})
```

- [ ] **Step 2: Write event types API route [C2 — returns ALL types]**

```typescript
// app/api/event-types/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mapEventTypeRow } from '@/lib/types/events'
import type { EventTypeRow } from '@/lib/types/events'

export async function GET() {
  try {
    const supabase = await createClient()

    // [C2] Return ALL event types (enabled + disabled). UI renders enabled/disabled from the flag.
    const { data, error } = await supabase
      .from('event_types')
      .select('*')
      .order('display_order')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch event types' }, { status: 500 })
    }

    const eventTypes = (data as EventTypeRow[]).map(mapEventTypeRow)
    return NextResponse.json({ eventTypes })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write sub-event types API route [I4 — UUID validation on typeId]**

```typescript
// app/api/event-types/[typeId]/sub-events/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { mapSubEventTypeRow } from '@/lib/types/events'
import type { SubEventTypeRow } from '@/lib/types/events'
import { z } from 'zod'

const paramsSchema = z.object({ typeId: z.string().uuid() })

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ typeId: string }> }
) {
  try {
    const { typeId } = await params

    // [I4] Validate UUID format
    const parsed = paramsSchema.safeParse({ typeId })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event type ID' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('sub_event_types')
      .select('*')
      .eq('event_type_id', typeId)
      .order('display_order')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sub-event types' }, { status: 500 })
    }

    const subEventTypes = (data as SubEventTypeRow[]).map(mapSubEventTypeRow)
    return NextResponse.json({ subEventTypes })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/api/event-types/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/event-types/ __tests__/api/event-types/
git commit -m "feat(api): add GET event-types (all) and sub-event-types endpoints"
```

---

## Task 5: API — Create Event (via RPC), List Events, Get Event

**Files:**
- Create: `app/api/events/route.ts`
- Create: `app/api/events/[id]/route.ts`
- Create: `__tests__/api/events/route.test.ts`

- [ ] **Step 1: Write events API tests**

```typescript
// __tests__/api/events/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

describe('POST /api/events', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('rejects unauthenticated requests', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any)

    const { POST } = await import('@/app/api/events/route')
    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId: 'type-1', metadata: {}, subEvents: [] }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('rejects invalid payload', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
    } as any)

    const { POST } = await import('@/app/api/events/route')
    const request = new Request('http://localhost/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventTypeId: 'not-a-uuid' }),
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })
})

describe('GET /api/events', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('rejects unauthenticated requests', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as any)

    const { GET } = await import('@/app/api/events/route')
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns empty array when user has no events', async () => {
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }) },
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    } as any)

    const { GET } = await import('@/app/api/events/route')
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.events).toEqual([])
  })
})
```

- [ ] **Step 2: Write events API route (POST via RPC + GET list) [C1, I8, S1]**

```typescript
// app/api/events/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createEventSchema } from '@/lib/validations/events'

/**
 * Generate event display name from metadata and event type.
 * [S1] Handles empty/whitespace names gracefully with fallbacks.
 */
function generateEventName(
  eventTypeSlug: string,
  eventTypeName: string,
  metadata: Record<string, string>
): string {
  const clean = (val: string | undefined) => val?.trim() || ''

  switch (eventTypeSlug) {
    case 'wedding':
    case 'anniversary': {
      const p1 = clean(metadata.partner_1_name)
      const p2 = clean(metadata.partner_2_name)
      if (p1 && p2) return `${p1} & ${p2}'s ${eventTypeName}`
      if (p1) return `${p1}'s ${eventTypeName}`
      return `My ${eventTypeName}`
    }
    case 'birthday': {
      const name = clean(metadata.celebrant_name)
      return name ? `${name}'s Birthday` : 'My Birthday'
    }
    case 'corporate': {
      const org = clean(metadata.organization_name)
      return org ? `${org} Event` : 'Corporate Event'
    }
    default:
      return `My ${eventTypeName}`
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { eventTypeId, metadata, primaryDate, primaryVenue, guestCapacity, subEvents } = parsed.data

    // Fetch event type for name generation + [I8] verify enabled
    const { data: eventType, error: typeError } = await supabase
      .from('event_types')
      .select('name, slug, enabled')
      .eq('id', eventTypeId)
      .eq('enabled', true)
      .single()

    if (typeError || !eventType) {
      return NextResponse.json({ error: 'Invalid or disabled event type' }, { status: 400 })
    }

    const eventName = generateEventName(eventType.slug, eventType.name, metadata)

    // [C1] Atomic creation via RPC — all inserts in one transaction
    const metadataArray = Object.entries(metadata).map(([key, value]) => ({ key, value }))
    const subEventsArray = subEvents.map((se, index) => ({
      sub_event_type_id: se.subEventTypeId || '',
      custom_name: se.customName || '',
      display_order: index,
    }))

    const { data: eventId, error: rpcError } = await supabase.rpc('create_event_with_details', {
      p_user_id: user.id,
      p_event_type_id: eventTypeId,
      p_name: eventName,
      p_primary_date: primaryDate || null,
      p_primary_venue: primaryVenue || null,
      p_guest_capacity: guestCapacity || null,
      p_metadata: JSON.stringify(metadataArray),
      p_sub_events: JSON.stringify(subEventsArray),
    })

    if (rpcError || !eventId) {
      console.error('RPC create_event_with_details failed:', rpcError)
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
    }

    return NextResponse.json({
      event: { id: eventId, name: eventName, status: 'active', createdAt: new Date().toISOString() },
    }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// --- Typed interface for Supabase joined query result ---
interface EventListRow {
  id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  status: string
  created_at: string
  event_types: { name: string; slug: string; icon_name: string | null } | null
  event_sub_events: { id: string }[] | null
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('events')
      .select(`
        id, name, primary_date, primary_venue, guest_capacity,
        cover_image_url, status, created_at,
        event_types ( name, slug, icon_name ),
        event_sub_events ( id )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const events = ((data || []) as EventListRow[]).map((row) => ({
      id: row.id,
      name: row.name,
      eventType: {
        name: row.event_types?.name || 'Event',
        slug: row.event_types?.slug || 'other',
        iconName: row.event_types?.icon_name || null,
      },
      primaryDate: row.primary_date,
      primaryVenue: row.primary_venue,
      guestCapacity: row.guest_capacity,
      coverImageUrl: row.cover_image_url,
      status: row.status,
      subEventCount: row.event_sub_events?.length || 0,
      createdAt: row.created_at,
    }))

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 3: Write event detail API route**

```typescript
// app/api/events/[id]/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const paramsSchema = z.object({ id: z.string().uuid() })

// --- Typed interfaces for joined query results ---
interface EventDetailRow {
  id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  description: string | null
  status: string
  created_at: string
  updated_at: string
  event_types: {
    id: string; name: string; slug: string;
    icon_name: string | null; has_sub_events: boolean
  } | null
}

interface SubEventDetailRow {
  id: string
  custom_name: string | null
  date: string | null
  time: string | null
  venue: string | null
  status: string
  display_order: number
  sub_event_types: { name: string; icon_name: string | null } | null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parsed = paramsSchema.safeParse({ id })
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select(`
        id, name, primary_date, primary_venue, guest_capacity,
        cover_image_url, description, status, created_at, updated_at,
        event_types ( id, name, slug, icon_name, has_sub_events )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    const typedEvent = event as EventDetailRow

    // Fetch metadata
    const { data: metadataRows } = await supabase
      .from('event_metadata')
      .select('key, value')
      .eq('event_id', id)

    const metadata: Record<string, string> = {}
    for (const row of metadataRows || []) {
      if (row.value != null) metadata[row.key] = row.value
    }

    // Fetch sub-events with type info
    const { data: subEventRows } = await supabase
      .from('event_sub_events')
      .select(`
        id, custom_name, date, time, venue, status, display_order,
        sub_event_types ( name, icon_name )
      `)
      .eq('event_id', id)
      .order('display_order')

    const subEvents = ((subEventRows || []) as SubEventDetailRow[]).map((row) => ({
      id: row.id,
      name: row.sub_event_types?.name || row.custom_name || 'Custom Event',
      iconName: row.sub_event_types?.icon_name || null,
      date: row.date,
      time: row.time,
      venue: row.venue,
      status: row.status,
    }))

    return NextResponse.json({
      event: {
        id: typedEvent.id,
        name: typedEvent.name,
        eventType: typedEvent.event_types ? {
          id: typedEvent.event_types.id,
          name: typedEvent.event_types.name,
          slug: typedEvent.event_types.slug,
          iconName: typedEvent.event_types.icon_name,
          hasSubEvents: typedEvent.event_types.has_sub_events,
        } : null,
        primaryDate: typedEvent.primary_date,
        primaryVenue: typedEvent.primary_venue,
        guestCapacity: typedEvent.guest_capacity,
        coverImageUrl: typedEvent.cover_image_url,
        description: typedEvent.description,
        status: typedEvent.status,
        metadata,
        subEvents,
        createdAt: typedEvent.created_at,
        updatedAt: typedEvent.updated_at,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run __tests__/api/events/`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/events/ __tests__/api/events/
git commit -m "feat(api): add atomic event creation via RPC, list events, and event detail endpoints"
```

---

## Task 6: Wizard State — React Context + useReducer

**Files:**
- Create: `lib/contexts/WizardContext.tsx`
- Create: `__tests__/lib/contexts/WizardContext.test.ts`

- [ ] **Step 1: Write wizard reducer test [C3, S5 — includes name in state, batch defaults action]**

```typescript
// __tests__/lib/contexts/WizardContext.test.ts
import { describe, it, expect } from 'vitest'
import { wizardReducer, initialWizardState } from '@/lib/contexts/WizardContext'

describe('wizardReducer', () => {
  it('sets event type and resets downstream state', () => {
    const eventType = { id: 'type-1', name: 'Wedding', slug: 'wedding', hasSubEvents: true } as any
    const state = wizardReducer(initialWizardState, { type: 'SET_EVENT_TYPE', payload: eventType })
    expect(state.eventType).toEqual(eventType)
    expect(state.totalSteps).toBe(4)
  })

  it('sets totalSteps to 3 when event type has no sub-events', () => {
    const eventType = { id: 'type-2', name: 'Birthday', slug: 'birthday', hasSubEvents: false } as any
    const state = wizardReducer(initialWizardState, { type: 'SET_EVENT_TYPE', payload: eventType })
    expect(state.totalSteps).toBe(3)
  })

  it('sets basic details', () => {
    const details = {
      primaryDate: '2026-12-14', primaryVenue: 'Udaipur',
      guestCapacity: 350, metadata: { partner_1_name: 'Aarav', partner_2_name: 'Ishani' },
    }
    const state = wizardReducer(initialWizardState, { type: 'SET_BASIC_DETAILS', payload: details })
    expect(state.basicDetails).toEqual(details)
  })

  it('toggles sub-event on with name [C3]', () => {
    const state = wizardReducer(initialWizardState, {
      type: 'TOGGLE_SUB_EVENT',
      payload: { subEventTypeId: 'sub-1', name: 'Mehendi', iconName: 'palette' },
    })
    expect(state.selectedSubEvents).toHaveLength(1)
    expect(state.selectedSubEvents[0].name).toBe('Mehendi')
    expect(state.selectedSubEvents[0].iconName).toBe('palette')
  })

  it('toggles sub-event off', () => {
    const stateWithSub = {
      ...initialWizardState,
      selectedSubEvents: [{ subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'palette' }],
    }
    const state = wizardReducer(stateWithSub, {
      type: 'TOGGLE_SUB_EVENT',
      payload: { subEventTypeId: 'sub-1', name: 'Mehendi', iconName: 'palette' },
    })
    expect(state.selectedSubEvents).toHaveLength(0)
  })

  it('adds custom sub-event with name [C3]', () => {
    const state = wizardReducer(initialWizardState, {
      type: 'ADD_CUSTOM_SUB_EVENT',
      payload: { name: 'After Party' },
    })
    expect(state.selectedSubEvents).toHaveLength(1)
    expect(state.selectedSubEvents[0].customName).toBe('After Party')
    expect(state.selectedSubEvents[0].name).toBe('After Party')
    expect(state.selectedSubEvents[0].subEventTypeId).toBeNull()
  })

  it('removes custom sub-event by index', () => {
    const stateWithCustom = {
      ...initialWizardState,
      selectedSubEvents: [
        { subEventTypeId: 'sub-1', customName: null, name: 'Mehendi', iconName: 'palette' },
        { subEventTypeId: null, customName: 'After Party', name: 'After Party', iconName: null },
      ],
    }
    const state = wizardReducer(stateWithCustom, { type: 'REMOVE_CUSTOM_SUB_EVENT', payload: { index: 1 } })
    expect(state.selectedSubEvents).toHaveLength(1)
  })

  it('sets default sub-events in batch [S5]', () => {
    const defaults = [
      { subEventTypeId: 'sub-4', customName: null, name: 'Wedding Ceremony', iconName: 'heart' },
      { subEventTypeId: 'sub-5', customName: null, name: 'Reception', iconName: 'utensils' },
    ]
    const state = wizardReducer(initialWizardState, { type: 'SET_DEFAULT_SUB_EVENTS', payload: defaults })
    expect(state.selectedSubEvents).toHaveLength(2)
    expect(state.selectedSubEvents[0].name).toBe('Wedding Ceremony')
  })

  it('navigates to step', () => {
    const state = wizardReducer(initialWizardState, { type: 'GO_TO_STEP', payload: 3 })
    expect(state.currentStep).toBe(3)
  })

  it('resets to initial state', () => {
    const modified = { ...initialWizardState, currentStep: 3, eventType: { id: 'x' } as any }
    const state = wizardReducer(modified, { type: 'RESET' })
    expect(state).toEqual(initialWizardState)
  })
})
```

- [ ] **Step 2: Write wizard context and reducer [C3, S5]**

```tsx
// lib/contexts/WizardContext.tsx
'use client'

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from 'react'
import type { EventType, SelectedSubEvent } from '@/lib/types/events'

// --- State ---
export interface WizardState {
  currentStep: number
  totalSteps: number
  eventType: EventType | null
  basicDetails: {
    primaryDate: string | null
    primaryVenue: string | null
    guestCapacity: number | null
    metadata: Record<string, string>
  }
  selectedSubEvents: SelectedSubEvent[]
}

export const initialWizardState: WizardState = {
  currentStep: 1,
  totalSteps: 4,
  eventType: null,
  basicDetails: {
    primaryDate: null,
    primaryVenue: null,
    guestCapacity: null,
    metadata: {},
  },
  selectedSubEvents: [],
}

// --- Actions [C3: name/iconName in toggle, S5: batch defaults] ---
export type WizardAction =
  | { type: 'SET_EVENT_TYPE'; payload: EventType }
  | { type: 'SET_BASIC_DETAILS'; payload: WizardState['basicDetails'] }
  | { type: 'TOGGLE_SUB_EVENT'; payload: { subEventTypeId: string; name: string; iconName: string | null } }
  | { type: 'ADD_CUSTOM_SUB_EVENT'; payload: { name: string } }
  | { type: 'REMOVE_CUSTOM_SUB_EVENT'; payload: { index: number } }
  | { type: 'SET_DEFAULT_SUB_EVENTS'; payload: SelectedSubEvent[] }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'RESET' }

// --- Reducer ---
export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_EVENT_TYPE':
      return {
        ...initialWizardState,
        eventType: action.payload,
        totalSteps: action.payload.hasSubEvents ? 4 : 3,
      }

    case 'SET_BASIC_DETAILS':
      return { ...state, basicDetails: action.payload }

    case 'TOGGLE_SUB_EVENT': {
      const { subEventTypeId, name, iconName } = action.payload
      const exists = state.selectedSubEvents.some((se) => se.subEventTypeId === subEventTypeId)
      const selectedSubEvents = exists
        ? state.selectedSubEvents.filter((se) => se.subEventTypeId !== subEventTypeId)
        : [...state.selectedSubEvents, { subEventTypeId, customName: null, name, iconName }]
      return { ...state, selectedSubEvents }
    }

    case 'ADD_CUSTOM_SUB_EVENT':
      return {
        ...state,
        selectedSubEvents: [
          ...state.selectedSubEvents,
          { subEventTypeId: null, customName: action.payload.name, name: action.payload.name, iconName: null },
        ],
      }

    case 'REMOVE_CUSTOM_SUB_EVENT':
      return {
        ...state,
        selectedSubEvents: state.selectedSubEvents.filter((_, i) => i !== action.payload.index),
      }

    case 'SET_DEFAULT_SUB_EVENTS':
      return {
        ...state,
        selectedSubEvents: state.selectedSubEvents.length === 0 ? action.payload : state.selectedSubEvents,
      }

    case 'GO_TO_STEP':
      return { ...state, currentStep: action.payload }

    case 'RESET':
      return initialWizardState

    default:
      return state
  }
}

// --- Context ---
const WizardContext = createContext<{
  state: WizardState
  dispatch: Dispatch<WizardAction>
} | null>(null)

export function WizardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState)
  return <WizardContext.Provider value={{ state, dispatch }}>{children}</WizardContext.Provider>
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider')
  }
  return context
}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run __tests__/lib/contexts/WizardContext.test.ts`
Expected: All 10 tests PASS

- [ ] **Step 4: Commit**

```bash
git add lib/contexts/WizardContext.tsx __tests__/lib/contexts/WizardContext.test.ts
git commit -m "feat(wizard): add WizardContext with reducer — includes sub-event names and batch defaults"
```

---

## Task 7: Wizard UI — WizardProgress + Step1EventType + WizardShell

**Files:**
- Create: `app/events/create/page.tsx`
- Create: `app/events/create/components/WizardProgress.tsx`
- Create: `app/events/create/components/Step1EventType.tsx`
- Create: `app/events/create/components/EventTypeCard.tsx`

**Fixes applied:** [C2] all types from API, [I9] URL as source of truth, [I10] accessible button, [I12] ring color via Tailwind variable, [S6] copyright 2026

- [ ] **Step 1: Create WizardProgress component**

```tsx
// app/events/create/components/WizardProgress.tsx
'use client'

import { useWizard } from '@/lib/contexts/WizardContext'

const STEP_LABELS: Record<number, string> = {
  1: 'Event Type',
  2: 'Basic Details',
  3: 'Sub-Events',
  4: 'Review & Confirm',
}

function getStepLabel(step: number, totalSteps: number): string {
  // When totalSteps is 3 (no sub-events), step 3 is Review
  if (totalSteps === 3 && step === 3) return 'Review & Confirm'
  return STEP_LABELS[step] || ''
}

export default function WizardProgress() {
  const { state } = useWizard()
  const { currentStep, totalSteps } = state
  const percentage = Math.round((currentStep / totalSteps) * 100)
  const label = getStepLabel(currentStep, totalSteps)

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}>
          Step {currentStep} of {totalSteps}: {label}
        </span>
        <span className="text-xs font-medium"
          style={{ color: 'var(--color-text-secondary)' }}>
          {percentage}%
        </span>
      </div>
      <div className="w-full h-1 rounded-full" style={{ background: 'var(--color-border)' }}>
        <div
          className="h-1 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%`, background: 'var(--color-text-primary)' }}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create EventTypeCard component [I10, I12]**

```tsx
// app/events/create/components/EventTypeCard.tsx
'use client'

import type { EventType } from '@/lib/types/events'

interface EventTypeCardProps {
  eventType: EventType
  isSelected: boolean
  onSelect: (eventType: EventType) => void
}

const ICON_MAP: Record<string, string> = {
  heart: '💍', cake: '🎂', gem: '💎', briefcase: '💼', baby: '👶', calendar: '📅',
}

export default function EventTypeCard({ eventType, isSelected, onSelect }: EventTypeCardProps) {
  if (!eventType.enabled) {
    // [I10] Disabled card — div is fine since it's not interactive
    return (
      <div
        className="relative rounded-xl border p-6 text-center opacity-50 cursor-not-allowed"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-card)' }}
        aria-disabled="true"
      >
        <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
          Coming Soon
        </span>
        <div className="text-3xl mb-3 opacity-40">{ICON_MAP[eventType.iconName || ''] || '📅'}</div>
        <p className="font-medium text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {eventType.name}
        </p>
      </div>
    )
  }

  // [I10] Active card — semantic <button> with keyboard support
  return (
    <button
      type="button"
      onClick={() => onSelect(eventType)}
      aria-label={`Select ${eventType.name}`}
      aria-pressed={isSelected}
      className={`relative rounded-xl border overflow-hidden text-left w-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        isSelected
          ? 'ring-2 ring-offset-2 [--tw-ring-color:var(--color-text-primary)]'
          : 'hover:shadow-md'
      }`}
      style={{
        borderColor: isSelected ? 'var(--color-text-primary)' : 'var(--color-border)',
        background: 'var(--color-bg-card)',
      }}
    >
      {/* Image or placeholder */}
      <div className="w-full h-40 flex items-center justify-center"
        style={{ background: 'var(--color-border)' }}>
        <span className="text-5xl">{ICON_MAP[eventType.iconName || ''] || '📅'}</span>
      </div>

      {isSelected && (
        <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
          style={{ background: 'var(--color-text-primary)' }}>
          Recommended
        </span>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {eventType.name}
        </h3>
        {eventType.description && (
          <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            {eventType.description}
          </p>
        )}
        {eventType.features.length > 0 && (
          <ul className="space-y-1 mb-4">
            {eventType.features.map((feature) => (
              <li key={feature} className="text-xs flex items-center gap-2"
                style={{ color: 'var(--color-text-secondary)' }}>
                <span>&#10022;</span> {feature}
              </li>
            ))}
          </ul>
        )}
        <span
          className="block w-full py-2.5 rounded-lg font-medium text-sm text-white text-center"
          style={{ background: 'var(--color-text-primary)' }}
        >
          Select &rarr;
        </span>
      </div>
    </button>
  )
}
```

- [ ] **Step 3: Create Step1EventType component [C2 — all types from API]**

```tsx
// app/events/create/components/Step1EventType.tsx
'use client'

import { useEffect, useState } from 'react'
import { useWizard } from '@/lib/contexts/WizardContext'
import type { EventType } from '@/lib/types/events'
import EventTypeCard from './EventTypeCard'

export default function Step1EventType() {
  const { state, dispatch } = useWizard()
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEventTypes() {
      try {
        const res = await fetch('/api/event-types')
        if (!res.ok) throw new Error('Failed to fetch event types')
        const data = await res.json()
        // [C2] API returns all types (enabled + disabled). UI renders from enabled flag.
        setEventTypes(data.eventTypes)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchEventTypes()
  }, [])

  const handleSelect = (eventType: EventType) => {
    dispatch({ type: 'SET_EVENT_TYPE', payload: eventType })
    dispatch({ type: 'GO_TO_STEP', payload: 2 })
  }

  if (loading) {
    return <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>Loading event types...</div>
  }

  if (error) {
    return <div className="text-center py-12" style={{ color: 'var(--color-error)' }}>Failed to load event types. Please try again.</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          What type of event are you planning?
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Select the category that best fits your needs to setup your workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventTypes.map((et) => (
          <EventTypeCard
            key={et.id}
            eventType={et}
            isSelected={state.eventType?.id === et.id}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create WizardShell page [I9 — URL as source of truth, S6 — copyright 2026]**

```tsx
// app/events/create/page.tsx
'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useRef, Suspense } from 'react'
import { WizardProvider, useWizard } from '@/lib/contexts/WizardContext'
import WizardProgress from './components/WizardProgress'
import Step1EventType from './components/Step1EventType'

function WizardContent() {
  const { state, dispatch } = useWizard()
  const searchParams = useSearchParams()
  const router = useRouter()
  const lastSyncedStep = useRef(state.currentStep)

  // [I9] URL is source of truth — read step from URL on mount/change
  useEffect(() => {
    const stepParam = searchParams.get('step')
    if (stepParam) {
      const step = parseInt(stepParam, 10)
      if (step >= 1 && step <= state.totalSteps && step !== state.currentStep) {
        dispatch({ type: 'GO_TO_STEP', payload: step })
        lastSyncedStep.current = step
      }
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  // [I9] Update URL only when state changes from user interaction (not from URL sync)
  useEffect(() => {
    if (state.currentStep !== lastSyncedStep.current) {
      lastSyncedStep.current = state.currentStep
      router.replace(`/events/create?step=${state.currentStep}`, { scroll: false })
    }
  }, [state.currentStep, router])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="py-4 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="max-w-5xl mx-auto flex items-center">
          <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Evenzi</span>
        </div>
      </header>

      <div className="px-6 pt-8">
        <WizardProgress />
      </div>

      <main className="px-6 pb-16">
        {state.currentStep === 1 && <Step1EventType />}
        {state.currentStep === 2 && <div>Step 2 — built in Task 8</div>}
        {state.currentStep === 3 && state.eventType?.hasSubEvents && <div>Step 3 — built in Task 9</div>}
        {state.currentStep === state.totalSteps && state.currentStep > 2 && <div>Review — built in Task 10</div>}
      </main>

      {/* [S6] Copyright 2026 */}
      <footer className="py-6 px-6 border-t text-center text-xs"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
        &copy; 2026 Evenzi. All rights reserved. &middot; Help & Support &middot; Privacy Policy &middot; Terms of Service
      </footer>
    </div>
  )
}

export default function CreateEventPage() {
  return (
    <WizardProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <WizardContent />
      </Suspense>
    </WizardProvider>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/events/create/
git commit -m "feat(wizard): add WizardShell, WizardProgress, Step1EventType — accessible, data-driven"
```

---

## Task 8: Wizard UI — Step2BasicDetails [S3 — with guest capacity]

**Files:**
- Create: `app/events/create/components/Step2BasicDetails.tsx`

- [ ] **Step 1: Create Step2BasicDetails component**

Same as original plan but with guest capacity field added [S3]. Validates dynamic fields, saves state on back navigation.

The implementer should:
1. Build the component matching the Figma Step 2 design: card container, dynamic fields (Partner 1/2 for Wedding), common optional fields (date, venue, guest capacity)
2. Use `validateDynamicFields()` from `lib/validations/events.ts` before advancing
3. Save current form state to context on both Continue and Back
4. Navigate to Step 3 if `hasSubEvents`, else to Review (last step)
5. Include all 3 common fields: Primary Event Date, Primary Venue/City, Guest Capacity

- [ ] **Step 2: Wire into WizardShell**

Replace Step 2 placeholder in `app/events/create/page.tsx` with import + render.

- [ ] **Step 3: Commit**

```bash
git add app/events/create/components/Step2BasicDetails.tsx app/events/create/page.tsx
git commit -m "feat(wizard): add Step2BasicDetails with dynamic form fields, guest capacity, and validation"
```

---

## Task 9: Wizard UI — Step3SubEvents [S5 — batch default selection]

**Files:**
- Create: `app/events/create/components/Step3SubEvents.tsx`
- Create: `app/events/create/components/SubEventCard.tsx`

- [ ] **Step 1: Create SubEventCard component**

Toggle-selectable `<button>` with icon + name, selected/unselected states. Matching Figma Step 3.

- [ ] **Step 2: Create Step3SubEvents component [S5]**

Same structure as original but:
- [S5] Use `SET_DEFAULT_SUB_EVENTS` action for batch default selection instead of multiple `TOGGLE_SUB_EVENT` dispatches
- [C3] Pass `name` and `iconName` in `TOGGLE_SUB_EVENT` payload
- "Continue to Review" CTA (not "Create Event")
- Custom sub-event inline input with Add/Cancel

- [ ] **Step 3: Wire into WizardShell**

Replace Step 3 placeholder.

- [ ] **Step 4: Commit**

```bash
git add app/events/create/components/Step3SubEvents.tsx app/events/create/components/SubEventCard.tsx app/events/create/page.tsx
git commit -m "feat(wizard): add Step3SubEvents with batch defaults and named sub-events"
```

---

## Task 10: Wizard UI — Step4ReviewConfirm + Form Submission [C3 — resolved names]

**Files:**
- Create: `app/events/create/components/Step4ReviewConfirm.tsx`

- [ ] **Step 1: Create Step4ReviewConfirm component**

Key differences from original:
- [C3] Uses `se.name` and `se.iconName` from `WizardState.selectedSubEvents` to display sub-event names — no more "Sub-event" fallback
- Submits via `POST /api/events` (which calls RPC internally)
- EDIT links navigate back to correct steps
- Stats row shows sub-event count and guest capacity
- Info banner about post-creation editing

- [ ] **Step 2: Wire into WizardShell — final assembly**

Update `app/events/create/page.tsx`: import all 4 step components, remove all placeholders.

```tsx
import Step1EventType from './components/Step1EventType'
import Step2BasicDetails from './components/Step2BasicDetails'
import Step3SubEvents from './components/Step3SubEvents'
import Step4ReviewConfirm from './components/Step4ReviewConfirm'

// Render:
{state.currentStep === 1 && <Step1EventType />}
{state.currentStep === 2 && <Step2BasicDetails />}
{state.currentStep === 3 && state.eventType?.hasSubEvents && <Step3SubEvents />}
{state.currentStep === state.totalSteps && state.currentStep > 2 && <Step4ReviewConfirm />}
```

- [ ] **Step 3: Commit**

```bash
git add app/events/create/
git commit -m "feat(wizard): add Step4ReviewConfirm with resolved sub-event names and form submission"
```

---

## Task 11: Success Screen

**Files:**
- Create: `app/events/[id]/success/page.tsx`

- [ ] **Step 1: Create success screen**

Server component. Fetches event data, shows "You're All Set!" hero, quick action cards (days countdown, checklist, add guests), "Go to Dashboard" CTA linking to `/home`. Copyright 2026.

Key behavior: if `daysUntil` is null (no date set) or negative (past date), don't show the countdown card [S1 from Frontend review].

- [ ] **Step 2: Commit**

```bash
git add app/events/\[id\]/success/
git commit -m "feat: add onboarding success screen after event creation"
```

---

## Task 12: Host Dashboard — Server Component with Real Event Cards [I11]

**Files:**
- Modify: `app/home/page.tsx` — convert to server component
- Create: `app/home/EventsGrid.tsx` — client component for interactivity

- [ ] **Step 1: Create EventsGrid client component**

Thin client component that receives events as props and handles sign-out. Shows event cards grid or empty state.

```tsx
// app/home/EventsGrid.tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { EventListItem } from "@/lib/types/events";

interface EventsGridProps {
  events: EventListItem[];
  userDisplay: string;
}

export default function EventsGrid({ events, userDisplay }: EventsGridProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const isSetupIncomplete = (event: EventListItem) => !event.primaryDate || !event.primaryVenue;

  return (
    <>
      {/* Navigation */}
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 border-b"
        style={{ borderColor: "var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Evenzi</div>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{userDisplay}</div>
            <button onClick={handleSignOut} className="px-4 py-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: "var(--color-text-secondary)" }}>
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {events.length === 0 ? (
          <div className="max-w-4xl mx-auto text-center py-16">
            <h1 className="text-4xl sm:text-5xl font-bold mb-6" style={{ color: "var(--color-text-primary)" }}>
              Welcome to Evenzi!
            </h1>
            <p className="text-xl mb-12 max-w-2xl mx-auto" style={{ color: "var(--color-text-secondary)" }}>
              Start planning your perfect event.
            </p>
            <Link href="/events/create"
              className="inline-block px-8 py-4 font-semibold rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-lg text-white"
              style={{ background: "var(--color-primary)" }}>
              Create Your First Event
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>Your Events</h1>
                <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                  Ready to plan your next big celebration?
                </p>
              </div>
              <Link href="/events/create" className="px-5 py-2.5 rounded-lg font-medium text-sm text-white"
                style={{ background: "var(--color-text-primary)" }}>
                + Create New Event
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/events/${event.id}`}
                  className="rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-bg-card)" }}>
                  <div className="h-40 flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #1f2937, #374151)" }}>
                    <span className="text-4xl">{event.eventType.iconName === 'heart' ? '💍' : '📅'}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-base leading-tight" style={{ color: "var(--color-text-primary)" }}>
                        {event.name || `${event.eventType.name} Event`}
                      </h3>
                      {isSetupIncomplete(event) && (
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full whitespace-nowrap ml-2"
                          style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
                          Setup incomplete
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                      <p>&#128197; {event.primaryDate
                        ? new Date(event.primaryDate + 'T00:00:00').toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
                        : 'Date not set'}</p>
                      <p>&#128205; {event.primaryVenue || 'Venue not set'}</p>
                      {event.subEventCount > 0 && (
                        <p>&#127881; {event.subEventCount} sub-event{event.subEventCount > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 2: Rewrite home page as server component [I11]**

```tsx
// app/home/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EventsGrid from "./EventsGrid";
import type { EventListItem } from "@/lib/types/events";

interface EventListRow {
  id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_capacity: number | null
  cover_image_url: string | null
  status: string
  created_at: string
  event_types: { name: string; slug: string; icon_name: string | null } | null
  event_sub_events: { id: string }[] | null
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data } = await supabase
    .from("events")
    .select(`
      id, name, primary_date, primary_venue, guest_capacity,
      cover_image_url, status, created_at,
      event_types ( name, slug, icon_name ),
      event_sub_events ( id )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const events: EventListItem[] = ((data || []) as EventListRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    eventType: {
      name: row.event_types?.name || "Event",
      slug: row.event_types?.slug || "other",
      iconName: row.event_types?.icon_name || null,
    },
    primaryDate: row.primary_date,
    primaryVenue: row.primary_venue,
    guestCapacity: row.guest_capacity,
    coverImageUrl: row.cover_image_url,
    status: row.status,
    subEventCount: row.event_sub_events?.length || 0,
    createdAt: row.created_at,
  }));

  const userDisplay = user.email || user.phone || "User";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg-primary)" }}>
      <EventsGrid events={events} userDisplay={userDisplay} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/home/page.tsx app/home/EventsGrid.tsx
git commit -m "feat(dashboard): convert home to server component with real event cards from database"
```

---

## Task 13: Middleware Host-Role Check + Event Placeholder Page [I1]

**Files:**
- Modify: `lib/supabase/middleware.ts`
- Create: `app/events/[id]/page.tsx`

- [ ] **Step 1: Update middleware to add host-role check for /events routes [I1]**

Add a check: if user has a role that is NOT 'host' and tries to access `/events/*`, redirect to `/home`.

In `lib/supabase/middleware.ts`, after the existing role checks (around line 78), add:

```typescript
    // [I1] Host-only routes — vendors cannot access event creation/management
    if (hasRole && profile?.role !== 'host' && pathname.startsWith('/events')) {
      const url = request.nextUrl.clone()
      url.pathname = '/home'
      return NextResponse.redirect(url)
    }
```

- [ ] **Step 2: Create event placeholder page**

```tsx
// app/events/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth')

  const { data: event } = await supabase
    .from('events')
    .select('id, name, event_types ( name )')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!event) redirect('/home')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg-primary)' }}>
      <header className="py-4 px-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <Link href="/home" className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Evenzi
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            {event.name || 'Your Event'}
          </h1>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Event Management Dashboard coming soon.
          </p>
          <Link href="/home" className="text-sm font-medium underline" style={{ color: 'var(--color-text-secondary)' }}>
            &larr; Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/middleware.ts app/events/\[id\]/page.tsx
git commit -m "feat: add host-role middleware check for /events routes + event placeholder page"
```

---

## Task 14: Integration Testing

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests PASS (existing + new)

- [ ] **Step 2: Run lint**

Run: `npx next lint`
Expected: No errors

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors

- [ ] **Step 4: Manual smoke test (dev server)**

Run: `npm run dev`

Test flow:
1. Visit `http://localhost:3000` → landing page
2. Sign in → `/home` → empty state with "Create Your First Event"
3. Click CTA → `/events/create?step=1`
4. See all event types from DB: Wedding active, others "Coming Soon"
5. Select Wedding → Step 2
6. Fill Partner 1 + Partner 2 (required), optionally date/venue/capacity → Continue
7. Step 3: see sub-event cards (defaults pre-selected), toggle some, add custom → Continue to Review
8. Step 4: see review with correct partner names, sub-event names with icons, EDIT links work
9. Click "CONFIRM & LAUNCH DASHBOARD" → success screen
10. "Go to Dashboard" → `/home` with event card showing name, date, venue, sub-event count
11. Click event card → placeholder page
12. Verify incomplete setup badge if date/venue missing

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration testing fixes for event creation wizard"
```

---

## Summary

| Task | Description | Review Fixes |
|------|-------------|-------------|
| 1 | Types + Zod schemas | I5, I6, I7, S4 |
| 2 | DB migration: tables + RPC | C1, I2, I3, S2, S7, S8 |
| 3 | DB migration: seed data | — |
| 4 | API: event types (all) + sub-events | C2, I4 |
| 5 | API: events (atomic RPC) | C1, I8, S1 |
| 6 | Wizard state (Context) | C3, S5 |
| 7 | Wizard: Progress + Step 1 + Shell | C2, I9, I10, I12, S6 |
| 8 | Wizard: Step 2 | S3 |
| 9 | Wizard: Step 3 | S5 |
| 10 | Wizard: Step 4 + Submit | C3 |
| 11 | Success screen | — |
| 12 | Dashboard (server component) | I11 |
| 13 | Middleware + placeholder | I1 |
| 14 | Integration testing | All |

**Total:** ~25 new files, 24+ automated tests, 14 tasks, 23 review fixes incorporated
