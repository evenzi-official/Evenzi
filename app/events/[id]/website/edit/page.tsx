import Link from 'next/link'
import { PageFooter } from '@/components/layout/PageFooter'
import { StatusBadge } from '@/components/ui/StatusBadge'

interface Params { params: Promise<{ id: string }> }

const PAGES = [
  { id: 'home',       label: 'Home',           icon: 'home',           status: 'live' as const,  desc: 'Landing page for your event website' },
  { id: 'our-story',  label: 'Our story',      icon: 'favorite',       status: 'draft' as const, desc: 'Share how you met and fell in love' },
  { id: 'schedule',   label: 'Schedule',       icon: 'calendar_today', status: 'draft' as const, desc: 'Ceremony and reception timeline' },
  { id: 'gallery',    label: 'Gallery',        icon: 'photo_library',  status: 'draft' as const, desc: 'Photo gallery from your pre-wedding shoot' },
  { id: 'rsvp',       label: 'RSVP',           icon: 'how_to_reg',     status: 'live' as const,  desc: 'Guest RSVP form' },
  { id: 'travel',     label: 'Travel & stay',  icon: 'hotel',          status: 'draft' as const, desc: 'Directions and accommodation info' },
] as const

export default async function EditPagesPage({ params }: Params) {
  const { id } = await params

  return (
    <div data-page="website-edit-pages">
      <div className="bc-wrap reveal">
        <div className="seg-wrap seg-wrap--page">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">overview</span><span>Overview</span></Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">palette</span><span>Design</span></Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Photos</span></Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page is-active" aria-current="page"><span className="material-symbols-outlined" aria-hidden="true">edit_note</span><span>Pages</span></Link>
          </nav>
        </div>
      </div>

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Pages</h1>
          </div>
          <p className="section-head-sub">Edit and manage the pages of your event website.</p>
        </header>

        <section className="clay-card reveal mt-6">
          <div className="flex items-center justify-between p-6 border-b border-line">
            <h2 className="font-display font-bold text-base text-ink">All pages</h2>
            <button type="button" className="btn-pill btn-pill-secondary">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              Add page
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>

          <ul role="list" className="divide-y divide-line">
            {PAGES.map((pg) => (
              <li key={pg.id}>
                <Link
                  href={`/events/${id}/website/edit/${pg.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-brand-tint/50 transition-colors group"
                >
                  <span aria-hidden="true" className="w-10 h-10 rounded-2xl bg-brand-tint text-brand flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined icon-fill">{pg.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-ink">{pg.label}</p>
                    <p className="text-xs text-muted truncate">{pg.desc}</p>
                  </div>
                  <StatusBadge variant={pg.status}>{pg.status === 'live' ? 'Live' : 'Draft'}</StatusBadge>
                  <span aria-hidden="true" className="material-symbols-outlined text-muted group-hover:text-brand transition-colors">chevron_right</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
