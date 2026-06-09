import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'

const DEFAULT_PAGES = [
  { id: 'home',        label: 'Home',          icon: 'home',              status: 'live' as const },
  { id: 'our-story',   label: 'Our story',     icon: 'favorite',          status: 'draft' as const },
  { id: 'schedule',    label: 'Schedule',      icon: 'calendar_today',    status: 'draft' as const },
  { id: 'gallery',     label: 'Gallery',       icon: 'photo_library',     status: 'draft' as const },
  { id: 'rsvp',        label: 'RSVP',          icon: 'how_to_reg',        status: 'live' as const },
  { id: 'travel',      label: 'Travel & stay', icon: 'hotel',             status: 'draft' as const },
] as const

export default async function WebsiteOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

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
        {/* Website sub-nav */}
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
          {/* Left: preview + checklist */}
          <div className="flex flex-col gap-6">
            {/* Live URL card */}
            <div className="clay-card p-6 flex items-center gap-4">
              <StatusBadge variant="live" dot>Live</StatusBadge>
              <span className="font-display font-semibold text-sm text-ink truncate">evenzi.app/{id}</span>
              <a href={`https://evenzi.app/${id}`} target="_blank" rel="noopener noreferrer" className="shrink-0 btn-pill btn-pill-secondary">
                <span aria-hidden="true" className="material-symbols-outlined">open_in_new</span>
                Preview
              </a>
            </div>

            {/* Get started checklist */}
            <div className="clay-card p-7 md:p-8">
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">QUICK START</p>
              <h2 className="font-display font-bold text-2xl text-ink mb-6">Get your site ready</h2>
              <div className="space-y-3">
                {[
                  { done: false, label: 'Add a cover photo', desc: 'Set the hero image for your home page' },
                  { done: false, label: 'Write your story', desc: 'Share how you met and fell in love' },
                  { done: false, label: 'Add event schedule', desc: 'Help guests plan their attendance' },
                  { done: false, label: 'Enable RSVP', desc: 'Let guests confirm attendance online' },
                ].map((item) => (
                  <label key={item.label} className="checklist-row">
                    <input type="checkbox" defaultChecked={item.done} aria-label={`Mark complete: ${item.label}`} />
                    <span className="checklist-check" aria-hidden="true">
                      <span className="material-symbols-outlined">check</span>
                    </span>
                    <span className="checklist-body">
                      <span className="checklist-title">{item.label}</span>
                      <span className="checklist-sub">{item.desc}</span>
                    </span>
                  </label>
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
            <div className="space-y-2">
              {DEFAULT_PAGES.map((pg) => (
                <Link
                  key={pg.id}
                  href={`/events/${id}/website/edit/${pg.id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl hover:bg-brand-tint transition-colors group"
                >
                  <span aria-hidden="true" className="w-8 h-8 rounded-xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined icon-sm-18 icon-fill">{pg.icon}</span>
                  </span>
                  <span className="flex-1 font-display font-semibold text-sm text-ink truncate">{pg.label}</span>
                  <StatusBadge variant={pg.status}>{pg.status === 'live' ? 'Live' : 'Draft'}</StatusBadge>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <PageFooter />
    </div>
  )
}
