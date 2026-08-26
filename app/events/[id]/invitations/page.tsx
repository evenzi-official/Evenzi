import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { InvitationsClient } from './InvitationsClient'
import { getAppBaseUrl } from '@/lib/url'
import { fetchDefaultCard } from '@/lib/invitations/card'
import { buildTemplateMaps, slugForTemplateId } from '@/lib/invitations/templates'

// Format a stored ISO date (YYYY-MM-DD) into an invitation-style date, e.g.
// "September 17, 2026". Returns null for a missing/unparseable value so the
// caller can fall back to the "Add a date" placeholder.
function formatInviteDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug, primary_date, primary_venue, event_details')
    .eq('id', id)
    .single()

  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  // Pre-fill the card from event data the host has already entered. The couple
  // line prefers the two partner names ("Alice & John") over the raw event name
  // ("Alice & John Wedding"); date is formatted for an invitation; venue falls
  // back to the city. Any of these stays editable and is only a seed — a saved
  // slot value always wins downstream.
  const details = (event.event_details ?? {}) as Record<string, string | null>
  const partnerOne = details.partner_1_name?.trim()
  const partnerTwo = details.partner_2_name?.trim()
  const couple = partnerOne && partnerTwo
    ? `${partnerOne} & ${partnerTwo}`
    : (partnerOne || partnerTwo || eventName)

  const defaultData = {
    eyebrow: 'Together with their families',
    couple,
    invite: 'request the pleasure of your company at the celebration of their wedding',
    date: formatInviteDate(event.primary_date) ?? 'Add a date',
    time: 'Add a time',
    venue: event.primary_venue?.trim() || details.city?.trim() || 'Add a venue',
    message: 'Reception to follow',
  }

  const sitePath = event.slug ? `/e/${event.slug}` : `/e/${id}`
  const rsvpUrl = `${getAppBaseUrl()}${sitePath}`

  const savedCardRaw = await fetchDefaultCard(supabase, id) as unknown as {
    id: string
    template_id: string | null
    is_custom: boolean
    slot_eyebrow: string | null
    slot_couple: string | null
    slot_invite: string | null
    slot_date: string | null
    slot_time: string | null
    slot_venue: string | null
    slot_message: string | null
    slot_sizes: Record<string, string> | null
    card_upload_key: string | null
    photo_bg_key: string | null
  } | null
  const { data: templateRows } = await supabase
    .schema('config').from('invitation_templates').select('id, slug').eq('enabled', true)
  const { bySlug, bySlugReverse } = buildTemplateMaps(templateRows ?? [])

  const savedCard = savedCardRaw ? {
    isCustom: savedCardRaw.is_custom,
    templateSlug: savedCardRaw.template_id ? slugForTemplateId(savedCardRaw.template_id, bySlugReverse) : null,
    cardUploadKey: savedCardRaw.card_upload_key,
    photoBgKey: savedCardRaw.photo_bg_key,
    slots: {
      eyebrow: savedCardRaw.slot_eyebrow ?? defaultData.eyebrow,
      couple:  savedCardRaw.slot_couple  ?? defaultData.couple,
      invite:  savedCardRaw.slot_invite  ?? defaultData.invite,
      date:    savedCardRaw.slot_date    ?? defaultData.date,
      time:    savedCardRaw.slot_time    ?? defaultData.time,
      venue:   savedCardRaw.slot_venue   ?? defaultData.venue,
      message: savedCardRaw.slot_message ?? defaultData.message,
    },
    slotSizes: (savedCardRaw.slot_sizes ?? {}) as Record<string, 's' | 'm' | 'l'>,
  } : null

  return (
    <div data-page="invitations">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'INVITATIONS' },
        ]}
        backHref={`/events/${id}`}
      />
      <main className="page-band pt-10 pb-24" id="inv-main">
        <InvitationsClient
          eventId={id}
          eventName={eventName}
          defaultData={defaultData}
          rsvpUrl={rsvpUrl}
          savedCard={savedCard}
          templateSlugToId={bySlug}
        />
      </main>
      <PageFooter />
    </div>
  )
}
