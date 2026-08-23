import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { InvitationsClient } from './InvitationsClient'
import { getAppBaseUrl } from '@/lib/url'
import { fetchDefaultCard } from '@/lib/invitations/card'
import { buildTemplateMaps, slugForTemplateId } from '@/lib/invitations/templates'

export default async function InvitationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug, primary_date, primary_venue')
    .eq('id', id)
    .single()

  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const defaultData = {
    eyebrow: 'Together with their families',
    couple: eventName,
    invite: 'request the pleasure of your company at the celebration of their wedding',
    date: event.primary_date ?? 'Add a date',
    time: 'Add a time',
    venue: event.primary_venue ?? 'Add a venue',
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
