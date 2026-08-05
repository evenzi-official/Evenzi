import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'
import WebsiteDesignClient from './WebsiteDesignClient'
import FontPairSection from './FontPairSection'
import PaletteSection from './PaletteSection'
import CoverOgSection from './CoverOgSection'
import { getSignedDownloadUrl, R2_BUCKET_PUBLIC } from '@/lib/storage/r2'

interface Params { params: Promise<{ id: string }> }

type ConfigFont = { id: string; name: string; role: string; display_order: number }
type ConfigPalette = { id: string; name: string; swatch_hex: string[] | null; css_tokens: unknown; display_order: number }

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

  const [designResult, cinematicResult, fontsResult, palettesResult] = await Promise.all([
    supabase
      .from('event_website_design')
      .select('template_id, palette_id, heading_font_id, body_font_id, cover_image_key, og_image_key')
      .eq('event_id', id)
      .maybeSingle(),
    supabase
      .schema('config')
      .from('website_templates')
      .select('id')
      .eq('slug', 'cinematic-scroll')
      .maybeSingle() as unknown as Promise<{ data: { id: string } | null; error: unknown }>,
    supabase
      .schema('config')
      .from('website_fonts')
      .select('id, name, role, display_order')
      .eq('enabled', true)
      .order('display_order') as unknown as Promise<{ data: ConfigFont[] | null; error: unknown }>,
    supabase
      .schema('config')
      .from('website_palettes')
      .select('id, name, swatch_hex, css_tokens, display_order')
      .eq('enabled', true)
      .order('display_order') as unknown as Promise<{ data: ConfigPalette[] | null; error: unknown }>,
  ])
  const design = designResult.data
  const cinematicTemplateId = (cinematicResult.data as { id: string } | null)?.id ?? null
  const fonts = fontsResult.data ?? []
  const headingOptions = fonts.filter((f) => f.role === 'heading').map((f) => ({ id: f.id, name: f.name }))
  const palettes = (palettesResult.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    swatch_hex: Array.isArray(p.swatch_hex) ? p.swatch_hex : [],
  }))

  const coverPreviewUrl = design?.cover_image_key
    ? await getSignedDownloadUrl(design.cover_image_key, { bucket: R2_BUCKET_PUBLIC, expiresIn: 3600 }).catch(() => null)
    : null
  const ogPreviewUrl = design?.og_image_key
    ? await getSignedDownloadUrl(design.og_image_key, { bucket: R2_BUCKET_PUBLIC, expiresIn: 3600 }).catch(() => null)
    : null

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
            cinematicTemplateId={cinematicTemplateId}
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

        <section className="clay-card p-7 md:p-8 reveal mt-6" aria-labelledby="dp-pal-h">
          <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">COLOUR</p>
          <h2 id="dp-pal-h" className="font-display font-bold text-xl text-ink mb-2">Palette</h2>
          <p className="text-sm text-muted mb-6">Pick a colour story. Guest templates will use these tokens when wired.</p>
          <PaletteSection
            eventId={id}
            palettes={palettes}
            initialPaletteId={design?.palette_id ?? null}
          />
        </section>

        <section className="clay-card p-7 md:p-8 reveal mt-6">
          <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-1">TYPOGRAPHY</p>
          <h2 className="font-display font-bold text-xl text-ink mb-2">Headings</h2>
          <p className="text-sm text-muted mb-6">Body text stays Poppins for clarity.</p>
          <FontPairSection
            eventId={id}
            headingOptions={headingOptions}
            initialHeadingFontId={design?.heading_font_id ?? null}
          />
        </section>

        <CoverOgSection
          eventId={id}
          coverPreviewUrl={coverPreviewUrl}
          ogPreviewUrl={ogPreviewUrl}
          hasCover={!!design?.cover_image_key}
          hasCustomOg={!!design?.og_image_key}
        />
      </main>

      <PageFooter />
    </div>
  )
}
