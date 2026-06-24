import Link from 'next/link'
import { PageFooter } from '@/components/layout/PageFooter'

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
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">GALLERY</p>
              <h2 className="font-display font-bold text-xl text-ink">Website gallery</h2>
            </div>
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">upload</span>
              Upload photos
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>

          {/* Cover photo */}
          <div className="mb-8">
            <p className="text-xs font-display font-bold tracking-[0.3em] text-muted uppercase mb-3">Cover photo</p>
            <div className="h-48 rounded-3xl bg-line-soft border-2 border-dashed border-line flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-brand/40 transition-colors">
              <span aria-hidden="true" className="material-symbols-outlined text-3xl text-muted">add_photo_alternate</span>
              <p className="text-sm font-display font-semibold text-muted">Click to set cover photo</p>
            </div>
          </div>

          {/* Photo grid */}
          <div>
            <p className="text-xs font-display font-bold tracking-[0.3em] text-muted uppercase mb-3">Gallery photos</p>
            <div className="empty-cta-card">
              <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">collections</span></span>
              <p className="empty-cta-title">No gallery photos yet</p>
              <p className="empty-cta-sub">Upload photos to display in the gallery section of your event website.</p>
              <button type="button" className="btn-pill btn-pill-secondary">
                <span className="material-symbols-outlined" aria-hidden="true">upload</span>
                Upload photos
                <span aria-hidden="true" className="btn-pill-spinner" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
