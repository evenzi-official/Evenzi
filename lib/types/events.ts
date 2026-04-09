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
