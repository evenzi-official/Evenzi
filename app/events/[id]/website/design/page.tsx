import Link from 'next/link'
import { PageFooter } from '@/components/layout/PageFooter'

interface Params { params: Promise<{ id: string }> }

const THEMES = [
  { id: 'classic',   label: 'Classic',   preview: 'bg-gradient-to-br from-rose-50 to-pink-100' },
  { id: 'modern',    label: 'Modern',    preview: 'bg-gradient-to-br from-slate-100 to-slate-200' },
  { id: 'garden',    label: 'Garden',    preview: 'bg-gradient-to-br from-green-50 to-emerald-100' },
  { id: 'golden',    label: 'Golden',    preview: 'bg-gradient-to-br from-amber-50 to-yellow-100' },
  { id: 'midnight',  label: 'Midnight',  preview: 'bg-gradient-to-br from-gray-900 to-slate-800' },
  { id: 'heritage',  label: 'Heritage',  preview: 'bg-gradient-to-br from-orange-50 to-red-100' },
] as const

export default async function WebsiteDesignPage({ params }: Params) {
  const { id } = await params

  return (
    <div data-page="website-design">
      {/* Website sub-nav (reused across all website pages) */}
      <div className="bc-wrap reveal">
        <div className="seg-wrap seg-wrap--page">
          <nav className="seg" aria-label="Website sections">
            <Link href={`/events/${id}/website`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">overview</span><span>Overview</span>
            </Link>
            <Link href={`/events/${id}/website/design`} className="seg-item seg--page is-active" aria-current="page">
              <span className="material-symbols-outlined" aria-hidden="true">palette</span><span>Design</span>
            </Link>
            <Link href={`/events/${id}/website/photos`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">photo_library</span><span>Photos</span>
            </Link>
            <Link href={`/events/${id}/website/edit`} className="seg-item seg--page">
              <span className="material-symbols-outlined" aria-hidden="true">edit_note</span><span>Pages</span>
            </Link>
          </nav>
        </div>
      </div>

      <main className="page-band pt-6 md:pt-8 pb-24">
        <header className="section-head reveal">
          <p className="section-head-eyebrow">Website</p>
          <div className="section-head-titlerow">
            <h1 className="section-head-title">Design</h1>
          </div>
          <p className="section-head-sub">Choose a theme and customise typography, colours, and layout.</p>
        </header>

        {/* Themes */}
        <section className="clay-card p-7 md:p-8 reveal">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">LOOK &amp; FEEL</p>
              <h2 className="font-display font-bold text-xl text-ink">Choose a theme</h2>
            </div>
            <button type="button" className="btn-pill btn-pill-primary">
              Apply
              <span aria-hidden="true" className="btn-pill-spinner" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {THEMES.map((theme, i) => (
              <button key={theme.id} type="button" className={`group relative rounded-3xl overflow-hidden aspect-video cursor-pointer border-2 transition-all ${i === 0 ? 'border-brand' : 'border-transparent hover:border-brand/30'}`}>
                <div className={`w-full h-full ${theme.preview}`} />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
                  <p className="font-display font-bold text-xs text-white">{theme.label}</p>
                </div>
                {i === 0 && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                    <span aria-hidden="true" className="material-symbols-outlined text-white" style={{ fontSize: 14 }}>check</span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Font picker */}
        <section className="clay-card p-7 md:p-8 reveal mt-6">
          <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">TYPOGRAPHY</p>
          <h2 className="font-display font-bold text-xl text-ink mb-6">Font pair</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[{ label: 'Heading font', value: 'Cormorant Garamond' }, { label: 'Body font', value: 'Poppins' }].map((f) => (
              <div key={f.label} className="form-group">
                <label className="form-label">{f.label}</label>
                <select className="form-select" defaultValue={f.value}>
                  <option>Cormorant Garamond</option>
                  <option>Playfair Display</option>
                  <option>Poppins</option>
                  <option>Inter</option>
                </select>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PageFooter />
    </div>
  )
}
