import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'
import StoryEditor from './StoryEditor'
import WeddingPartyEditor from './WeddingPartyEditor'
import QAEditor from './QAEditor'
import TravelEditor from './TravelEditor'
import ScheduleEditor from './ScheduleEditor'
import SectionEditor, { SectionSeed } from './SectionEditor'

interface Params { params: Promise<{ id: string; pageId: string }> }

type ConfigPage = {
  id: string
  slug: string
  name: string
  icon_name: string | null
  tier: string
}

export default async function PageEditor({ params }: Params) {
  const { id, pageId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [pagesResult, configResult] = await Promise.all([
    supabase
      .from('event_website_pages')
      .select('id, page_id, is_visible, custom_title, display_order')
      .eq('event_id', id),
    supabase
      .schema('config')
      .from('website_pages')
      .select('id, slug, name, icon_name, tier') as unknown as Promise<{ data: ConfigPage[] | null; error: unknown }>,
  ])

  const configMap = new Map<string, ConfigPage>()
  if (configResult.data) {
    for (const p of configResult.data) configMap.set(p.id, p)
  }

  const pageRow = (pagesResult.data ?? []).find((p) => {
    const cfg = configMap.get(p.page_id)
    return cfg?.slug === pageId
  })

  if (!pageRow) redirect(`/events/${id}/website/edit`)

  const cfg = configMap.get(pageRow.page_id)
  const pageLabel = pageRow.custom_title ?? cfg?.name ?? pageId
  const pageStatus: 'live' | 'draft' = pageRow.is_visible ? 'live' : 'draft'

  let infoCard: React.ReactNode = null
  let editor: React.ReactNode = null
  let seeds: SectionSeed[] = []

  if (pageId === 'home') {
    const { data: ev } = await supabase
      .from('events')
      .select('name, primary_date, primary_venue, cover_image_url')
      .eq('id', id)
      .single()
    infoCard = <HomeInfoCard id={id} ev={ev} />
    editor = <SectionEditor eventId={id} pageId={pageRow.id} seeds={[]} />
  }

  if (pageId === 'story') {
    const { data: blocks } = await supabase
      .from('event_story_blocks')
      .select('id, block_type, heading, body, photo_key, twocol, is_visible, display_order')
      .eq('event_id', id)
      .order('display_order')
    editor = <StoryEditor eventId={id} initialBlocks={(blocks ?? []) as Parameters<typeof StoryEditor>[0]['initialBlocks']} />
  }

  if (pageId === 'schedule') {
    const { data: subEvents } = await supabase
      .from('event_sub_events')
      .select('id, custom_name, event_date, start_time, venue, show_on_website')
      .eq('event_id', id)
      .order('display_order')
    const list = subEvents ?? []
    infoCard = <ScheduleInfoCard total={list.length} visible={list.filter(s => s.show_on_website).length} />
    seeds = list.map(s => ({
      type: 'schedule' as const,
      data: {
        name: s.custom_name ?? '',
        date: s.event_date ? new Date(s.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        time: s.start_time ?? '',
        venue: s.venue ?? '',
        dress: '',
        note: '',
      },
    }))
    editor = (
      <>
        <ScheduleEditor eventId={id} subEvents={list} />
        <div className="mt-6">
          <SectionEditor eventId={id} pageId={pageRow.id} seeds={seeds} />
        </div>
      </>
    )
  }

  if (pageId === 'venue-travel') {
    const [pointsResult, staysResult] = await Promise.all([
      supabase.from('event_travel_points').select('id, kind, name, distance_text, travel_time_text, map_link, note, display_order').eq('event_id', id).order('display_order'),
      supabase.from('event_stays').select('id, name, address, phone, price_band, distance_text, map_link, booking_url, note, display_order').eq('event_id', id).order('display_order'),
    ])
    editor = (
      <TravelEditor
        eventId={id}
        initialPoints={(pointsResult.data ?? []) as Parameters<typeof TravelEditor>[0]['initialPoints']}
        initialStays={(staysResult.data ?? []) as Parameters<typeof TravelEditor>[0]['initialStays']}
      />
    )
  }

  if (pageId === 'wedding-party') {
    const { data: members } = await supabase
      .from('event_wedding_party_members')
      .select('id, name, side, relation, photo_key, is_visible, display_order')
      .eq('event_id', id)
      .order('display_order')
    editor = <WeddingPartyEditor eventId={id} initialMembers={(members ?? []) as Parameters<typeof WeddingPartyEditor>[0]['initialMembers']} />
  }

  if (pageId === 'gallery') {
    const { count: total } = await supabase.from('event_media').select('id', { count: 'exact', head: true }).eq('event_id', id)
    const { count: published } = await supabase.from('event_media').select('id', { count: 'exact', head: true }).eq('event_id', id).eq('published', true)
    infoCard = <GalleryInfoCard id={id} total={total ?? 0} published={published ?? 0} />
    editor = (
      <div className="clay-card p-8 text-center space-y-3 mt-6">
        <span className="material-symbols-outlined text-4xl text-muted" aria-hidden="true">photo_library</span>
        <p className="font-display font-bold text-sm text-ink">Gallery managed from Media</p>
        <p className="text-xs text-muted">Photos published in the Media section automatically appear in the gallery page on your guest site.</p>
        <Link href={`/events/${id}/media`} className="btn-pill btn-pill-secondary inline-flex mt-1">
          <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
          Manage media
        </Link>
      </div>
    )
  }

  if (pageId === 'qa') {
    const { data: items } = await supabase
      .from('event_qa_items')
      .select('id, question, answer, is_visible, display_order')
      .eq('event_id', id)
      .order('display_order')
    editor = <QAEditor eventId={id} initialItems={(items ?? []) as Parameters<typeof QAEditor>[0]['initialItems']} />
  }

  if (pageId === 'rsvp') {
    const { count: total } = await supabase.from('event_guests').select('id', { count: 'exact', head: true }).eq('event_id', id)
    infoCard = <RsvpInfoCard id={id} total={total ?? 0} />
    editor = <SectionEditor eventId={id} pageId={pageRow.id} seeds={[]} />
  }

  if (pageId === 'registry' || pageId === 'video') {
    editor = <SectionEditor eventId={id} pageId={pageRow.id} seeds={[]} />
  }

  if (!editor) {
    editor = (
      <div className="clay-card p-8 text-center mt-6">
        <p className="text-sm text-muted">Editor for this page type is coming soon.</p>
      </div>
    )
  }

  return (
    <div data-page="website-page-editor" data-wb-page="edit">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'PAGES', href: `/events/${id}/website/edit` },
          { label: `EDIT · ${pageLabel.toUpperCase()}` },
        ]}
        backHref={`/events/${id}/website/edit`}
      />

      <div className="page-band pt-6 md:pt-8 pb-4">
        <header className="section-head section-head--compact reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Edit: {pageLabel}</h1>
            {cfg?.tier === 'private' ? (
              <span className="dp-page-tier dp-tier-private" title="Private — guest must unlock">
                <span className="material-symbols-outlined" aria-hidden="true">lock</span>
                Private
              </span>
            ) : (
              <span className="dp-page-tier dp-tier-public">Public</span>
            )}
            <StatusBadge variant={pageStatus}>{pageStatus === 'live' ? 'Visible' : 'Hidden'}</StatusBadge>
          </div>
        </header>

        {infoCard && <div className="mt-4 max-w-2xl">{infoCard}</div>}
      </div>

      <div className="page-band pb-4">
        {editor}
      </div>

      <div className="page-band pb-24" />
      <PageFooter />
    </div>
  )
}

function HomeInfoCard({ id, ev }: { id: string; ev: { name: string | null; primary_date: string | null; primary_venue: string | null; cover_image_url: string | null } | null }) {
  return (
    <div className="clay-card reveal">
      <div className="flex items-center justify-between p-5 border-b border-line">
        <h2 className="font-display font-bold text-base text-ink">Event details</h2>
        <Link href={`/events/${id}/settings`} className="btn-pill btn-pill-secondary btn-pill-sm">
          <span className="material-symbols-outlined" aria-hidden="true">edit</span>
          Edit in Settings
        </Link>
      </div>
      <div className="p-5 space-y-4">
        {ev?.cover_image_url ? (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-bg-muted">
            <Image src={ev.cover_image_url} alt="Cover photo" fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
          </div>
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-bg-muted flex flex-col items-center justify-center gap-2 text-muted">
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">image</span>
            <span className="text-xs font-display">No cover photo yet</span>
          </div>
        )}
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'Event name', value: ev?.name },
            { label: 'Date', value: ev?.primary_date ? new Date(ev.primary_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
            { label: 'Venue', value: ev?.primary_venue },
          ].map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-muted font-display font-semibold tracking-wide">{label}</dt>
              <dd className="text-sm font-display font-bold text-ink mt-1">{value ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function ScheduleInfoCard({ total, visible }: { total: number; visible: number }) {
  return (
    <div className="clay-card reveal">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div>
          <h2 className="font-display font-bold text-sm text-ink">Sub-events</h2>
          <p className="text-xs text-muted">{visible} of {total} showing on website</p>
        </div>
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        Toggle which sub-events appear on the public schedule using the switches below.
      </p>
    </div>
  )
}

function RsvpInfoCard({ id, total }: { id: string; total: number }) {
  return (
    <div className="clay-card reveal">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div>
          <h2 className="font-display font-bold text-sm text-ink">RSVP responses</h2>
          <p className="text-xs text-muted">{total} guests in the list</p>
        </div>
        <Link href={`/events/${id}/guests`} className="btn-pill btn-pill-secondary btn-pill-sm">
          <span className="material-symbols-outlined" aria-hidden="true">groups</span>
          Manage guests
        </Link>
      </div>
      <p className="px-4 py-3 text-xs text-muted">
        Use the sections below to customise the RSVP page — add a welcome heading, dress code note, or FAQs.
      </p>
    </div>
  )
}

function GalleryInfoCard({ id, total, published }: { id: string; total: number; published: number }) {
  return (
    <div className="clay-card reveal">
      <div className="flex items-center justify-between p-4 border-b border-line">
        <div>
          <h2 className="font-display font-bold text-sm text-ink">Photo gallery</h2>
          <p className="text-xs text-muted">{published} of {total} photos published</p>
        </div>
        <Link href={`/events/${id}/media`} className="btn-pill btn-pill-secondary btn-pill-sm">
          <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
          Manage media
        </Link>
      </div>
    </div>
  )
}
