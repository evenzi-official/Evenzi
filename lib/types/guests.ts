export interface RsvpStatusOption {
  id: string
  slug: 'pending' | 'confirmed' | 'declined' | 'maybe'
  name: string
  iconName: string
  category: string
}

export interface SubEventOption {
  id: string
  label: string
}

export interface GuestTagOption {
  id: string
  name: string
  isCustom: boolean
}

export interface GuestRow {
  id: string
  name: string
  phone: string
  email: string | null
  rsvpStatusId: string
  invited: boolean
  partySize: number
  notes: string | null
  subEventIds: string[]
  tagIds: string[]
  createdAt: string
}

export interface GuestManagementInitialData {
  eventId: string
  eventName: string
  guests: GuestRow[]
  rsvpStatuses: RsvpStatusOption[]
  subEvents: SubEventOption[]
  tags: GuestTagOption[]
}
