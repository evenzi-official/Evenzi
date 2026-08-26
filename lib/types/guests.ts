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
  /** Public event-site slug — used to build the WhatsApp invite link (/e/[slug]). Null until the site exists. */
  eventSlug: string | null
  /** The host's saved default invitation message, pre-filled into each WhatsApp invite. */
  defaultGuestMessage: string | null
  /** Whether the public event site is currently offline — surfaces a non-blocking warning in the send flow. */
  siteOffline: boolean
}
