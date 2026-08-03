import Link from 'next/link'
import { PageFooter } from '@/components/layout/PageFooter'
import { WebsitePhotosClient } from './WebsitePhotosClient'

interface Params { params: Promise<{ id: string }> }

export default async function WebsitePhotosPage({ params }: Params) {
  const { id } = await params

  return (
    <div data-page="website-photos">
      <div className="bc-wrap reveal">
        <div className="seg-wrap seg-wrap--page">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">overview</span><span>Overview</span></Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">palette</span><span>Design</span></Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page is-active" aria-current="page"><span className="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Photos</span></Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page"><span className="material-symbols-outlined" aria-hidden="true">edit_note</span><span>Pages</span></Link>
          </nav>
        </div>
      </div>

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Photos</h1>
          </div>
          <p className="section-head-sub">Manage photos shown on your public event website — different from your private media library.</p>
        </header>

        <section className="clay-card p-7 md:p-8 reveal">
          <WebsitePhotosClient eventId={id} />
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
