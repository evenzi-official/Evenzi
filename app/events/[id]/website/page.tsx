import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'

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
  label: string
  icon: string | null
  tier: string
  is_visible: boolean
  display_order: number
}[]

export default async function WebsiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: event } = await supabase
    .from('events')
    .select('id, name, slug')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  const [summaryResult, designResult] = await Promise.all([
    supabase
      .from('event_website_summary')
      .select('pages')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .from('event_website_design')
      .select('template_id')
      .eq('event_id', id)
      .maybeSingle(),
  ])

  const rawPages = (summaryResult.data?.pages ?? []) as SummaryPages
  const pages: WebsitePage[] = rawPages
    .sort((a, b) => a.display_order - b.display_order)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      label: p.label,
      icon: p.icon ?? 'web',
      is_visible: p.is_visible,
      display_order: p.display_order,
    }))

  const hasTemplate = !!(designResult.data?.template_id)
  const slug = (event as { slug?: string | null }).slug ?? null
  const liveUrl = slug ? `evenzi.app/e/${slug}` : null

  const checklistItems = [
    { done: hasTemplate,    label: 'Choose a theme',      desc: 'Pick a design for your event site',         href: `/events/${id}/website/design` },
    { done: false,          label: 'Write your story',    desc: 'Share how you met and fell in love',         href: `/events/${id}/website/edit/story` },
    { done: false,          label: 'Add event schedule',  desc: 'Help guests plan their attendance',          href: `/events/${id}/website/edit/schedule` },
    { done: !!liveUrl,      label: 'Publish your site',   desc: 'Set a site URL to share with guests',       href: `/events/${id}/settings/website` },
  ]

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
          {/* Left: live URL + checklist */}
          <div className="flex flex-col gap-6">
            {/* Live URL card */}
            <div className="clay-card p-5 flex items-center gap-4">
              {liveUrl ? (
                <>
                  <StatusBadge variant="live" dot>Live</StatusBadge>
                  <span className="font-display font-semibold text-sm text-ink truncate flex-1">{liveUrl}</span>
                  <a href={`https://${liveUrl}`} target="_blank" rel="noopener noreferrer" className="shrink-0 btn-pill btn-pill-secondary">
                    <span aria-hidden="true" className="material-symbols-outlined">open_in_new</span>
                    Preview
                  </a>
                </>
              ) : (
                <>
                  <StatusBadge variant="draft">Not published</StatusBadge>
                  <span className="flex-1 text-sm text-muted font-display">No site URL yet — set one in Website Settings</span>
                  <Link href={`/events/${id}/settings/website`} className="shrink-0 btn-pill btn-pill-secondary">
                    <span aria-hidden="true" className="material-symbols-outlined">settings</span>
                    Settings
                  </Link>
                </>
              )}
            </div>

            {/* Get started checklist */}
            <div className="clay-card p-7 md:p-8">
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">QUICK START</p>
              <h2 className="font-display font-bold text-2xl text-ink mb-6">Get your site ready</h2>
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <Link key={item.label} href={item.href} className="checklist-row block">
                    <span className={`checklist-check ${item.done ? 'is-checked' : ''}`} aria-hidden="true">
                      <span className="material-symbols-outlined">check</span>
                    </span>
                    <span className="checklist-body">
                      <span className="checklist-title">{item.label}</span>
                      <span className="checklist-sub">{item.desc}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: pages list */}
          <div className="clay-card p-6">
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
