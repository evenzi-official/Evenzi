import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { GuestManagementClient } from './GuestManagementClient'
import { uuidSchema } from '@/lib/validations/guests'
import type {
  GuestManagementInitialData,
  GuestRow,
  GuestTagOption,
  RsvpStatusOption,
  SubEventOption,
} from '@/lib/types/guests'

export default async function GuestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!uuidSchema.safeParse(id).success) redirect('/home')

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [
    { data: guestRows },
    { data: subEventLinkRows },
    { data: tagLinkRows },
    { data: subEventRows },
    { data: tagRows },
    { data: statusRows },
  ] = await Promise.all([
    supabase.from('event_guests')
      .select('id, name, phone, email, rsvp_status_id, invited, party_size, notes, created_at')
      .eq('event_id', id)
      .order('name', { ascending: true }),
    supabase.from('event_guest_sub_events').select('guest_id, sub_event_id').eq('event_id', id),
    supabase.from('event_guest_tag_links').select('guest_id, tag_id').eq('event_id', id),
    supabase.from('event_sub_events').select('id, custom_name, event_sub_type_id').eq('event_id', id).order('display_order', { ascending: true }),
    supabase.from('event_guest_tags').select('id, name, is_custom').eq('event_id', id).order('display_order', { ascending: true }),
    supabase.schema('config').from('rsvp_statuses').select('id, slug, name, icon_name, category').order('display_order', { ascending: true }),
  ])

  // Resolve sub-event display names off the config catalog — same two-step
  // pattern as app/events/[id]/page.tsx (cross-schema embeds aren't available).
  const typeIds = Array.from(
    new Set((subEventRows ?? []).map((se) => se.event_sub_type_id).filter((t): t is string => t != null))
  )
  const typeNamesById: Record<string, string> = {}
  if (typeIds.length > 0) {
    const { data: typeRows } = await supabase.schema('config').from('event_sub_types').select('id, name').in('id', typeIds)
    for (const t of typeRows ?? []) typeNamesById[t.id] = t.name
  }
  const subEvents: SubEventOption[] = (subEventRows ?? []).map((se) => ({
    id: se.id,
    label: se.custom_name ?? (se.event_sub_type_id ? typeNamesById[se.event_sub_type_id] ?? 'Function' : 'Function'),
  }))

  const subEventsByGuest: Record<string, string[]> = {}
  for (const row of subEventLinkRows ?? []) {
    (subEventsByGuest[row.guest_id] ??= []).push(row.sub_event_id)
  }
  const tagsByGuest: Record<string, string[]> = {}
  for (const row of tagLinkRows ?? []) {
    (tagsByGuest[row.guest_id] ??= []).push(row.tag_id)
  }

  const guests: GuestRow[] = (guestRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    email: g.email,
    rsvpStatusId: g.rsvp_status_id,
    invited: g.invited,
    partySize: g.party_size,
    notes: g.notes,
    subEventIds: subEventsByGuest[g.id] ?? [],
    tagIds: tagsByGuest[g.id] ?? [],
    createdAt: g.created_at,
  }))

  const rsvpStatuses: RsvpStatusOption[] = (statusRows ?? []).map((s) => ({
    id: s.id,
    slug: s.slug as RsvpStatusOption['slug'],
    name: s.name,
    iconName: s.icon_name ?? 'help',
    category: s.category,
  }))

  const tags: GuestTagOption[] = (tagRows ?? []).map((t) => ({ id: t.id, name: t.name, isCustom: t.is_custom }))

  const initialData: GuestManagementInitialData = { eventId: id, eventName, guests, rsvpStatuses, subEvents, tags }

  return (
    <div data-page="guests">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'GUESTS' },
        ]}
        backHref={`/events/${id}`}
      />
      <GuestManagementClient initialData={initialData} />
      <PageFooter />
    </div>
  )
}
