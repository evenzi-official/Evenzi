import { notFound } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import GuestLookupForm from './GuestLookupForm'
import PasswordGate from './PasswordGate'
import WeddingTemplate1Client from '@/components/templates/WeddingTemplate1Client'
import { PW_COOKIE_NAME } from '@/app/api/e/[slug]/_lib'

interface Params { params: Promise<{ slug: string }> }

type ContentBlock = {
  id: string
  block_type: 'heading' | 'text' | 'photo'
  heading: string | null
  body: string | null
  photo_key: string | null
  twocol: boolean
  display_order: number
}

type WebsitePage = {
  name: string
  slug: string
  tier: string
  content: ContentBlock[]
  page_id: string
  display_order: number
}

type WebsitePayload = {
  pages: WebsitePage[]
  design: Record<string, unknown> | null
  password_enabled?: boolean
}

type EventMeta = {
  id: string
  name: string | null
  primary_date: string | null
  primary_venue: string | null
  event_details: Record<string, string> | null
}

function parseSlug(slug: string): { displayName: string; eventDate: Date | null } {
  const match = slug.match(/^(.+?)-(\d{8})/)
  if (!match) return { displayName: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), eventDate: null }
  const namePart = match[1].split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const d = match[2]
  const eventDate = new Date(parseInt(d.slice(0, 4)), parseInt(d.slice(4, 6)) - 1, parseInt(d.slice(6, 8)))
  return { displayName: namePart, eventDate }
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  return (
    <div className={`my-8 ${block.twocol ? 'md:grid md:grid-cols-2 md:gap-12' : ''}`}>
      {block.heading && (
        <h3 className="font-serif text-2xl md:text-3xl text-stone-800 mb-4 leading-snug italic">
          {block.heading}
        </h3>
      )}
      {block.body && (
        <p className="text-stone-600 leading-relaxed text-base md:text-lg whitespace-pre-line" style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
          {block.body}
        </p>
      )}
    </div>
  )
}

function PageSection({ page }: { page: WebsitePage }) {
  return (
    <section id={`section-${page.slug}`} className="py-16 md:py-24 border-t border-stone-100">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-xs tracking-widest uppercase text-stone-400 mb-3">{page.name}</p>
        {page.content.length === 0 ? (
          <p className="text-stone-400 italic text-sm">Content coming soon.</p>
        ) : (
          page.content
            .slice()
            .sort((a, b) => a.display_order - b.display_order)
            .map(block => <BlockRenderer key={block.id} block={block} />)
        )}
      </div>
    </section>
  )
}

function DefaultTemplate({
  slug,
  pages,
  isIdentified,
  guestName,
  heroName,
  heroVenue,
  eventDate,
}: {
  slug: string
  pages: WebsitePage[]
  isIdentified: boolean
  guestName: string | null
  heroName: string
  heroVenue: string | null
  eventDate: Date | null
}) {
  return (
    <div className="min-h-screen" style={{ background: '#faf9f7', color: '#292524', fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}>
      <header className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <p className="text-xs tracking-[0.3em] uppercase text-stone-400 mb-6">You are invited</p>
        <h1 className="font-serif text-5xl md:text-7xl font-light text-stone-800 leading-tight mb-6 italic">
          {heroName}
        </h1>
        {eventDate && (
          <p className="text-stone-500 text-sm md:text-base tracking-wide">{formatDate(eventDate)}</p>
        )}
        {heroVenue && (
          <p className="text-stone-400 text-sm mt-1">{heroVenue}</p>
        )}
        {isIdentified && guestName && (
          <div className="mt-8 px-6 py-3 rounded-full bg-stone-100 text-stone-600 text-sm">
            Welcome, {guestName}
          </div>
        )}
      </header>

      {pages.length > 1 && (
        <nav className="sticky top-0 z-10 border-t border-b border-stone-100 bg-[#faf9f7]/95 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-6 flex overflow-x-auto gap-1 py-1">
            {pages.map(page => (
              <a
                key={page.slug}
                href={`#section-${page.slug}`}
                className="flex-none px-4 py-2 text-xs tracking-widest uppercase text-stone-500 hover:text-stone-800 transition-colors whitespace-nowrap"
              >
                {page.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      <main>
        {pages.map(page => <PageSection key={page.page_id} page={page} />)}
      </main>

      {!isIdentified && (
        <section className="py-20 md:py-28 border-t border-stone-100">
          <div className="max-w-lg mx-auto px-6 text-center">
            <p className="text-xs tracking-widest uppercase text-stone-400 mb-4">Guest Access</p>
            <h2 className="font-serif text-3xl md:text-4xl text-stone-800 italic mb-3">
              Find your invitation
            </h2>
            <p className="text-stone-500 text-sm mb-10 leading-relaxed">
              Enter the name and phone number you were invited with to access your personal invitation, RSVP, schedule, and more.
            </p>
            <GuestLookupForm slug={slug} />
          </div>
        </section>
      )}

      <footer className="border-t border-stone-100 py-10 text-center">
        <p className="text-xs text-stone-400 tracking-wide">Made with <span className="text-stone-600">Evenzi</span></p>
      </footer>
    </div>
  )
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const { displayName } = parseSlug(slug)

  const title = clamp(`${displayName} — Wedding Website`, 70)
  const description = clamp(`You're invited to ${displayName}. View details, RSVP, and more.`, 200)

  // Cover/OG image for the WhatsApp / social link preview. Sourced from the same
  // anon-safe SECURITY DEFINER RPC the page uses (a direct events read is
  // RLS-blocked for anonymous crawlers), and served through the PUBLIC, no-auth
  // media proxy so WhatsApp can actually fetch it. The prefix guard matches the
  // proxy's allowlist — never emit a key it would 404 (council 2026-08-26).
  // Returning via Next's Metadata object keeps the host-authored name auto-escaped.
  let imageKey: string | null = null
  try {
    const supabase = await createClient()
    const { data } = await supabase.rpc('get_public_website_payload', { p_slug: slug })
    const design = (data as { design?: { og_image_key?: string | null; cover_image_key?: string | null } } | null)?.design
    imageKey = design?.og_image_key || design?.cover_image_key || null
  } catch { /* silent — no site/design or blocked; text-only preview */ }

  const openGraph: Metadata['openGraph'] = { title, description, type: 'website' }
  if (imageKey && /^(website|events|event-covers)\//.test(imageKey)) {
    openGraph.images = [{ url: `/api/media/${imageKey}` }]
  }

  // metadataBase makes the relative proxy path resolve to an absolute URL that a
  // crawler can fetch.
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined

  return { metadataBase, title, description, openGraph }
}

// Meta title/description length guard so a long event name doesn't blow out the
// link preview.
function clamp(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

export default async function GuestWebsitePage({ params }: Params) {
  const { slug } = await params
  const supabase = await createClient()

  // Public payload (always available — RPC is SECURITY DEFINER)
  const { data: rawPayload, error: payloadError } = await supabase
    .rpc('get_public_website_payload', { p_slug: slug })

  if (payloadError || rawPayload === null) notFound()

  const payload = rawPayload as WebsitePayload

  if (payload.password_enabled) {
    const pwCookieStore = await cookies()
    const pwToken = pwCookieStore.get(PW_COOKIE_NAME)?.value ?? null
    const { data: pwVerified } = await supabase
      .rpc('is_website_password_verified', { p_slug: slug, p_token: pwToken })
    if (!pwVerified) {
      return <PasswordGate slug={slug} />
    }
  }

  // Try to get event metadata + template_id (best-effort — RLS may restrict anonymous reads)
  let eventMeta: EventMeta | null = null
  let templateId: string | null = null

  try {
    const { data } = await supabase
      .from('events')
      .select('id, name, primary_date, primary_venue, event_details')
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()
    eventMeta = data as EventMeta | null
  } catch { /* silent — RLS blocked */ }

  // Prefer template_id from the RPC payload (already correct — no extra query)
  if (payload.design?.template_id) {
    templateId = payload.design.template_id as string
  } else if (eventMeta?.id) {
    // Fallback: direct query (handles cases where RPC lags behind a fresh save)
    const { data: design } = await supabase
      .from('event_website_design')
      .select('template_id')
      .eq('event_id', eventMeta.id)
      .maybeSingle()
    templateId = design?.template_id ?? null
  }

  // Resolve the template UUID to a slug via config.website_templates
  let templateSlug: string | null = null
  if (templateId) {
    const tplResult = await (supabase
      .schema('config')
      .from('website_templates')
      .select('slug')
      .eq('id', templateId)
      .maybeSingle() as unknown as Promise<{ data: { slug: string } | null; error: unknown }>)
    templateSlug = tplResult.data?.slug ?? null
  }

  // Guest session upgrade — resolve BEFORE template branch so all templates get the right pages
  let guestPayload: WebsitePayload | null = null
  let guestName: string | null = null
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('evz_guest_session')?.value

  if (sessionToken) {
    const [sessionResult, guestResult] = await Promise.all([
      supabase.rpc('resolve_guest_session', { p_token: sessionToken }),
      supabase.rpc('get_guest_website_payload', { p_session_token: sessionToken }),
    ])
    if (!sessionResult.error && !guestResult.error && guestResult.data) {
      guestPayload = guestResult.data as WebsitePayload
      const sessionData = sessionResult.data as { name?: string } | null
      guestName = sessionData?.name ?? null
    }
  }

  const activePayload = guestPayload ?? payload
  const isIdentified = !!guestPayload
  const activePages = activePayload.pages.slice().sort((a, b) => a.display_order - b.display_order)

  if (templateSlug === 'cinematic-scroll' && eventMeta) {
    return (
      <WeddingTemplate1Client
        event={eventMeta}
        eventId={eventMeta.id}
        pages={activePages}
        isIdentified={isIdentified}
        guestName={guestName}
        slug={slug}
      />
    )
  }

  const { displayName, eventDate } = parseSlug(slug)
  const heroName = eventMeta?.name ?? displayName
  const heroVenue = eventMeta?.primary_venue ?? null
  const pages = activePayload.pages.slice().sort((a, b) => a.display_order - b.display_order)

  return (
    <DefaultTemplate
      slug={slug}
      pages={pages}
      isIdentified={isIdentified}
      guestName={guestName}
      heroName={heroName}
      heroVenue={heroVenue}
      eventDate={eventDate}
    />
  )
}
