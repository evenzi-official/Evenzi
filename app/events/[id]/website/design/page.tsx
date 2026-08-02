import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import WebsiteDesignClient from './WebsiteDesignClient'

interface Params { params: Promise<{ id: string }> }

const FAKE_THEMES = [
  { id: 'classic',   label: 'Classic',   preview: 'bg-gradient-to-br from-rose-50 to-pink-100' },
  { id: 'modern',    label: 'Modern',    preview: 'bg-gradient-to-br from-slate-100 to-slate-200' },
  { id: 'garden',    label: 'Garden',    preview: 'bg-gradient-to-br from-green-50 to-emerald-100' },
  { id: 'golden',    label: 'Golden',    preview: 'bg-gradient-to-br from-amber-50 to-yellow-100' },
  { id: 'midnight',  label: 'Midnight',  preview: 'bg-gradient-to-br from-gray-900 to-slate-800' },
  { id: 'heritage',  label: 'Heritage',  preview: 'bg-gradient-to-br from-orange-50 to-red-100' },
] as const

export default async function WebsiteDesignPage({ params }: Params) {
  const { id } = await params
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

  const { data: design } = await supabase
    .from('event_website_design')
    .select('template_id, palette_id, heading_font_id, body_font_id')
    .eq('event_id', id)
    .maybeSingle()

  return (
    <div data-page="website-design">
      <Breadcrumb
        items={[
          { label: 'DASHBOARD', href: '/home' },
          { label: eventName.toUpperCase(), href: `/events/${id}` },
          { label: 'WEBSITE', href: `/events/${id}/website` },
          { label: 'DESIGN' },
        ]}
        backHref={`/events/${id}/website`}
      />

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
          </div>

          {/* Coming-soon banner for real catalog */}
          <div className="mb-5 flex items-center gap-3 p-3 rounded-2xl bg-brand-tint border border-brand/20">
            <span className="material-symbols-outlined text-brand" aria-hidden="true">auto_awesome</span>
            <p className="text-xs font-display font-semibold text-brand">More premium themes coming soon — the one below is live now.</p>
          </div>

          <WebsiteDesignClient
            eventId={id}
            initialDesign={design ?? null}
            fakeThemes={FAKE_THEMES}
            cinematicCard={
              <Link
                href={`/wedding-invitation-temp-1?eventId=${id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-3xl overflow-hidden aspect-video cursor-pointer border-2 border-transparent hover:border-brand/30 block"
              >
                <Image
                  src="/wedding-frames/ezgif-frame-001.jpg"
                  alt="Cinematic Scroll"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/40 to-transparent">
                  <p className="font-display font-bold text-xs text-white">Cinematic Scroll</p>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="bg-brand text-white text-[10px] font-display font-bold px-2 py-0.5 rounded-full">LIVE</span>
                </div>
              </Link>
            }
          />
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
