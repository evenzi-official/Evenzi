import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

export default async function MediaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase.from('events').select('id, name').eq('id', id).single()
  if (!event) redirect('/home')

  const eventName = event.name ?? 'Your Event'

  return (
    <div data-page="media">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'MEDIA' },
        ]}
        backHref={`/events/${id}`}
      />

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Section</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Media &amp; Memories</h1>
          </div>
          <p className="section-head-sub">Upload, organise and share every photo &amp; reel from the celebrations.</p>
        </header>

        {/* Stats */}
        <section className="gm-stats reveal" aria-label="Media summary">
          <div className="clay-card gm-rate" role="group">
            <span className="stat-icon"><span className="material-symbols-outlined icon-fill">photo_library</span></span>
            <div className="min-w-0 w-full">
              <p className="gm-rate-cap">Total media</p>
              <p className="gm-rate-num">0</p>
              <p className="gm-rate-sub">0 photos · 0 reels</p>
            </div>
          </div>
          <div className="gm-counts" role="group" aria-label="Media counts">
            {['Photos', 'Reels', 'Shared', 'Albums'].map((lbl) => (
              <button key={lbl} type="button" className="clay-card gm-count">
                <span className="gm-count-num">0</span>
                <span className="gm-count-lbl">{lbl}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Upload area */}
        <section className="clay-card p-7 md:p-8 reveal" aria-label="Photo gallery">
          <div className="flex items-center justify-between mb-6 gap-4">
            <div>
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">GALLERY</p>
              <h2 className="font-display font-bold text-2xl text-ink">Photos &amp; reels</h2>
            </div>
            <button type="button" className="btn-pill btn-pill-primary">
              <span aria-hidden="true" className="material-symbols-outlined">upload</span>
              Upload
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>

          <div className="empty-cta-card">
            <span className="empty-cta-icon" aria-hidden="true"><span className="material-symbols-outlined">photo_library</span></span>
            <p className="empty-cta-title">No media yet</p>
            <p className="empty-cta-sub">Upload photos and reels from your celebrations to build your memories gallery.</p>
            <button type="button" className="btn-pill btn-pill-primary">
              <span className="material-symbols-outlined" aria-hidden="true">upload</span>
              Upload your first photo
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
        </section>
      </main>

      {/* FAB */}
      <button type="button" className="fab" aria-label="Upload media">
        <span aria-hidden="true" className="material-symbols-outlined">upload</span>
      </button>

      <PageFooter />
    </div>
  )
}
