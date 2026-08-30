import { redirect } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'qrcode'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getAppBaseUrl } from '@/lib/url'
import { LivePreviewCard } from './LivePreviewCard'
import { SiteStatusCard } from './SiteStatusCard'

type WebsitePage = {
  id: string
  slug: string
  label: string
  icon: string
  is_visible: boolean
  display_order: number
}

type SummaryPages = {
  id: string
  slug: string
  name: string
  icon_name: string | null
  tier: string
  is_visible: boolean
  display_order: number
}[]

type GsTile = {
  done: boolean
  label: string
  help: string
  icon: string
  href: string
}

export default async function WebsiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug, primary_date')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [
    summaryResult,
    designResult,
    settingsResult,
    guestSettingsResult,
    subEventsResult,
    partyResult,
    qaResult,
    mediaResult,
  ] = await Promise.all([
    supabase
      .from('event_website_summary')
      .select('pages')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_website_design')
      .select('cover_image_key')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_website_settings')
      .select('site_offline, website_password_enabled')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_guest_settings')
      .select('rsvp_enabled')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_sub_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
    supabase
      .from('event_wedding_party_members')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
    supabase
      .from('event_qa_items')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
    supabase
      .from('event_media')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', id),
  ])

  const rawPages = (summaryResult.data?.pages ?? []) as SummaryPages
  const pages: WebsitePage[] = rawPages
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      label: p.name,
      icon: p.icon_name ?? 'web',
      is_visible: p.is_visible,
      display_order: p.display_order,
    }))

  const slug = event.slug ?? null
  const siteOffline = settingsResult.data?.site_offline ?? true
  const liveUrl = slug ? `${getAppBaseUrl()}/e/${slug}` : null
  const qrDataUrl = liveUrl
    ? await QRCode.toDataURL(liveUrl, {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: { dark: '#111111', light: '#ffffff' },
      })
    : null

  const tiles: GsTile[] = [
    {
      done: !!designResult.data?.cover_image_key,
      label: 'Add a cover photo',
      help: 'Hero image for the homepage',
      icon: 'image',
      href: `/events/${id}/website/design#cover`,
    },
    {
      done: !!(event.name && event.primary_date),
      label: 'Edit hero copy',
      help: 'Names, tagline, date',
      icon: 'edit',
      href: `/events/${id}/website/edit/home`,
    },
    {
      done: (subEventsResult.count ?? 0) >= 1,
      label: 'Add sub-events',
      help: 'Mehendi, Ceremony, Reception…',
      icon: 'calendar_month',
      href: `/events/${id}/website/edit/schedule`,
    },
    {
      done: (partyResult.count ?? 0) >= 1,
      label: 'Add wedding party',
      help: 'Family + close people',
      icon: 'groups',
      href: `/events/${id}/website/edit/wedding-party`,
    },
    {
      done: !!settingsResult.data?.website_password_enabled,
      label: 'Set a site password',
      help: 'Optional — for extra privacy',
      icon: 'lock',
      href: `/events/${id}/settings/website`,
    },
    {
      done: (qaResult.count ?? 0) >= 1,
      label: 'Add Q&A',
      help: 'Answer guest FAQs upfront',
      icon: 'question_answer',
      href: `/events/${id}/website/edit/qa`,
    },
    {
      done: (mediaResult.count ?? 0) >= 1,
      label: 'Upload first photos',
      help: 'Build out the gallery',
      icon: 'photo_library',
      href: `/events/${id}/website/photos`,
    },
    {
      done: siteOffline === false,
      label: 'Preview & publish',
      help: 'Take your site live',
      icon: 'rocket_launch',
      href: '#publish',
    },
  ]

  const doneCount = tiles.filter((t) => t.done).length
  const allDone = doneCount === tiles.length
  const pct = Math.round((doneCount / tiles.length) * 100)

  return (
    <div data-page="website">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'WEBSITE' },
        ]}
        backHref={`/events/${id}`}
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        <div className="seg-wrap seg-wrap--page reveal">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page is-active" aria-current="page">
              <span className="material-symbols-outlined" aria-hidden="true">overview</span>
              <span>Overview</span>
            </Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">palette</span>
              <span>Design</span>
            </Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">photo_library</span>
              <span>Photos</span>
            </Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">edit_note</span>
              <span>Pages</span>
            </Link>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 mt-6">
          <div className="flex min-w-0 flex-col gap-6">
            <LivePreviewCard liveUrl={liveUrl} />

            <section
              className="clay-card dp-card"
              id="getstarted"
              aria-labelledby="dp-gs-h"
              data-gs-state={allDone ? 'all-done' : 'in-progress'}
            >
              <header className="dp-card-head">
                <div>
                  <h2 id="dp-gs-h" className="dp-card-title">Get started</h2>
                  <p className="dp-card-sub">
                    <span>{doneCount}</span> of <span>{tiles.length}</span> done
                  </p>
                </div>
                <span className="dp-gs-meter" aria-hidden="true">
                  <span className="dp-gs-bar" data-p={pct} style={{ width: `${pct}%` }} />
                </span>
              </header>

              <div className="dp-gs-done-banner" role="status" aria-hidden={!allDone}>
                <span className="material-symbols-outlined" aria-hidden="true">celebration</span>
                <div>
                  <p className="dp-gs-done-title">You&apos;re all set.</p>
                  <p className="dp-gs-done-sub">Preview once more and publish to share with guests.</p>
                </div>
                <a href="#publish" className="btn-pill btn-pill-primary">
                  <span className="material-symbols-outlined" aria-hidden="true">rocket_launch</span>
                  Publish
                </a>
              </div>

              <div className="dp-gs-grid" role="list">
                {tiles.map((tile) => (
                  <Link
                    key={tile.label}
                    href={tile.href}
                    className={`gs-tile${tile.done ? ' is-done' : ''}`}
                    role="listitem"
                  >
                    <span className="gs-tile-icon" aria-hidden="true">
                      <span className="material-symbols-outlined">{tile.icon}</span>
                    </span>
                    <span className="gs-tile-body">
                      <span className="gs-tile-label">{tile.label}</span>
                      <span className="gs-tile-help">{tile.help}</span>
                    </span>
                    <span className="gs-tile-state" aria-label={tile.done ? 'Done' : undefined} aria-hidden={!tile.done}>
                      <span className="material-symbols-outlined" aria-hidden="true">
                        {tile.done ? 'check_circle' : 'chevron_right'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <SiteStatusCard
              eventId={id}
              slug={slug}
              liveUrl={liveUrl}
              qrDataUrl={qrDataUrl}
              siteOffline={siteOffline}
              rsvpEnabled={guestSettingsResult.data?.rsvp_enabled ?? true}
              settingsHref={`/events/${id}/settings/website`}
            />
          </div>

          <div className="clay-card min-w-0 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-ink">Pages</h3>
              <Link href={`/events/${id}/website/edit`} className="text-xs font-display font-semibold text-brand hover:underline">
                Manage →
              </Link>
            </div>
            {pages.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">No pages set up yet.</p>
            ) : (
              <div className="space-y-2">
                {pages.map((pg) => (
                  <Link
                    key={pg.id}
                    href={`/events/${id}/website/edit/${pg.slug}`}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-brand-tint transition-colors group"
                  >
                    <span aria-hidden="true" className="w-8 h-8 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined icon-sm-18 icon-fill">{pg.icon}</span>
                    </span>
                    <span className="flex-1 font-display font-semibold text-sm text-ink truncate">{pg.label}</span>
                    <StatusBadge variant={pg.is_visible ? 'live' : 'draft'}>
                      {pg.is_visible ? 'Visible' : 'Hidden'}
                    </StatusBadge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}
