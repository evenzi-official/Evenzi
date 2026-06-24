import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumb } from '@/components/layout/Breadcrumb'
import { PageFooter } from '@/components/layout/PageFooter'

const ICON_MAP: Record<string, string> = {
  sparkles: 'auto_awesome', palette: 'palette', music: 'music_note',
  heart: 'favorite', utensils: 'restaurant', wine: 'wine_bar',
  coffee: 'local_cafe', spa: 'spa',
}

// Sub-event row joined in JS with its config.event_sub_types catalog entry.
interface SubEventRow {
  id: string
  custom_name: string | null
  event_sub_types: { name: string; icon_name: string | null } | null
}

// Hero/overview aggregate stats from public.event_hub_summary (security_invoker view).
interface HubSummaryRow {
  event_id: string
  event_name: string | null
  primary_date: string | null
  primary_venue: string | null
  guest_total: number | null
  task_percent: number | null
  task_done: number | null
  task_total: number | null
  budget_total: number | null
  budget_spent: number | null
  budget_percent: number | null
  sub_event_count: number | null
  default_card_share_token: string | null
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function daysUntil(d: string | null): number | null {
  if (!d) return null
  const diff = new Date(d).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default async function EventControlPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // 1) Existence + soft-delete guard + hero cover image.
  //    Plain public select (no cross-schema embed) — also tells genuine
  //    "not found" apart from a query failure.
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('id, name, status, cover_image_url, deleted_at')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (eventError) {
    console.error('[event-hub] events query failed:', eventError)
    throw new Error('Failed to load event')
  }
  if (!eventRow) {
    // Genuinely absent or soft-deleted — not a query error.
    notFound()
  }

  // 2) Hero / overview aggregate stats — public.event_hub_summary view
  //    (security_invoker, all in `public` → no cross-schema embed).
  const { data: summaryRow, error: summaryError } = await supabase
    .from('event_hub_summary')
    .select(
      'event_id, event_name, primary_date, primary_venue, guest_total, ' +
        'task_percent, task_done, task_total, budget_total, budget_spent, ' +
        'budget_percent, sub_event_count, default_card_share_token',
    )
    .eq('event_id', id)
    .maybeSingle()

  if (summaryError) {
    console.error('[event-hub] event_hub_summary query failed:', summaryError)
    throw new Error('Failed to load event summary')
  }

  const summary = (summaryRow ?? null) as HubSummaryRow | null

  // 3) Sub-event milestone list — resolve config.event_sub_types separately
  //    (direct access works; embedding it across schemas does NOT → PGRST200).
  const { data: subEventRows, error: subEventsError } = await supabase
    .from('event_sub_events')
    .select('id, custom_name, event_sub_type_id, display_order')
    .eq('event_id', id)
    .order('display_order', { ascending: true })

  if (subEventsError) {
    console.error('[event-hub] event_sub_events query failed:', subEventsError)
    throw new Error('Failed to load sub-events')
  }

  const rawSubEvents = subEventRows ?? []

  // Resolve sub-event type names/icons from the config catalog (direct access).
  const typeIds = Array.from(
    new Set(
      rawSubEvents
        .map((se) => se.event_sub_type_id)
        .filter((tid): tid is string => tid != null),
    ),
  )

  const typesById: Record<string, { name: string; icon_name: string | null }> = {}
  if (typeIds.length > 0) {
    const { data: typeRows, error: typesError } = await supabase
      .schema('config')
      .from('event_sub_types')
      .select('id, name, icon_name')
      .in('id', typeIds)

    if (typesError) {
      console.error('[event-hub] config.event_sub_types query failed:', typesError)
      throw new Error('Failed to load sub-event types')
    }

    for (const t of typeRows ?? []) {
      typesById[t.id] = { name: t.name, icon_name: t.icon_name }
    }
  }

  // Join in JS — preserve the existing { custom_name, event_sub_types } shape
  // the JSX expects (name + icon_name resolved off the catalog).
  const subEvents: SubEventRow[] = rawSubEvents.map((se) => ({
    id: se.id,
    custom_name: se.custom_name,
    event_sub_types: se.event_sub_type_id
      ? typesById[se.event_sub_type_id] ?? null
      : null,
  }))

  // Hero/overview fields — prefer the view; fall back to the events row.
  const event = {
    cover_image_url: eventRow.cover_image_url as string | null,
    primary_date: summary?.primary_date ?? null,
    primary_venue: summary?.primary_venue ?? null,
    guest_capacity: summary?.guest_total ?? null,
  }

  const eventName = summary?.event_name ?? eventRow.name ?? 'Your Event'
  const days = daysUntil(event.primary_date)
  // Drive the milestone strip off the rows we actually render so the count,
  // the empty-state branch, and subEvents[0] never diverge.
  const subCount = subEvents.length

  // SVG circle progress: circumference = 2π × 44 ≈ 276.46; offset 0 = full fill
  const circleOffset = subCount > 0 ? 6 : 276.46

  return (
    <div data-page="event-control" data-section="dashboard">

      {/* ── HERO ── */}
      <section className="hero-screen snap reveal" id="hero">
        <div className="hero-bg" aria-hidden="true">
          <div
            className="hero-bg-img"
            id="hero-bg-img"
            style={event.cover_image_url ? { backgroundImage: `url(${event.cover_image_url})` } : undefined}
          />
          <div className="hero-bg-overlay" />
          <span className="hero-particle" /><span className="hero-particle" />
          <span className="hero-particle" /><span className="hero-particle" />
          <span className="hero-particle" /><span className="hero-particle" />
        </div>

        <svg className="hero-mandala" viewBox="0 0 320 320" fill="none" aria-hidden="true">
          <g className="hm-spin" transform-origin="160 160">
            <circle cx="160" cy="160" r="135" className="hm-stroke-brand-25" strokeWidth="1.5" strokeDasharray="2 6" />
            <circle cx="160" cy="160" r="100" className="hm-stroke-brand-35" strokeWidth="1.5" />
          </g>
          <g transform="translate(160 160)">
            <g className="hm-fill-brand">
              <ellipse cx="0" cy="-65" rx="14" ry="36" />
              <ellipse cx="0" cy="65"  rx="14" ry="36" />
              <ellipse cx="-65" cy="0" rx="36" ry="14" />
              <ellipse cx="65"  cy="0" rx="36" ry="14" />
            </g>
            <g className="hm-fill-white">
              <ellipse transform="rotate(45)"  cx="0" cy="-65" rx="10" ry="28" />
              <ellipse transform="rotate(45)"  cx="0" cy="65"  rx="10" ry="28" />
              <ellipse transform="rotate(-45)" cx="0" cy="-65" rx="10" ry="28" />
              <ellipse transform="rotate(-45)" cx="0" cy="65"  rx="10" ry="28" />
            </g>
            <path d="M0 6 C-14 -10 -28 0 -16 14 C-8 22 0 28 0 28 C0 28 8 22 16 14 C28 0 14 -10 0 6Z" className="hm-fill-brand-solid" />
          </g>
        </svg>

        <div className="hero-content page-band" id="hero-content">
          <div className="mb-7 md:mb-9 sticky z-20 ec-sticky-subnav">
            <Breadcrumb
              items={[
                { label: 'DASHBOARD', href: '/home' },
                { label: eventName.toUpperCase() },
              ]}
              backHref="/home"
            />
          </div>

          {/* Title + quick-action */}
          <div className="grid grid-cols-12 gap-6 lg:gap-10 items-start mb-8 md:mb-10">
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-5">
              <h1 className="hero-title-1">{eventName}</h1>

              <div className="flex flex-wrap items-stretch gap-3" id="hero-meta">
                <span className="hero-meta-chip">
                  <span aria-hidden="true" className="hero-meta-icon">
                    <span className="material-symbols-outlined icon-fill icon-sm-18">location_on</span>
                  </span>
                  <span className="hero-meta-text">
                    <span className="hero-meta-label">Venue</span>
                    <span className="hero-meta-value">{event.primary_venue ?? '—'}</span>
                  </span>
                </span>
                <span className="hero-meta-chip">
                  <span aria-hidden="true" className="hero-meta-icon">
                    <span className="material-symbols-outlined icon-fill icon-sm-18">calendar_today</span>
                  </span>
                  <span className="hero-meta-text">
                    <span className="hero-meta-label">Date</span>
                    <span className="hero-meta-value">{formatDate(event.primary_date)}</span>
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="hero-pill">
                  <span aria-hidden="true" className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  Planning in progress
                </span>
                <span className="hero-pill">Owner</span>
                {days !== null && days > 0 && (
                  <span className="hero-pill hero-pill-brand">{days} days to go</span>
                )}
              </div>
            </div>

            <aside className="col-span-12 lg:col-span-5 qa-card" aria-label="Quick actions">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span aria-hidden="true" className="w-8 h-8 rounded-full bg-brand text-white inline-flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-base icon-fill icon-sm-16">auto_awesome</span>
                  </span>
                  <span className="font-display font-bold text-sm text-ink truncate">Quick actions</span>
                </div>
                <span className="hidden sm:inline-flex text-[10px] font-bold tracking-widest text-muted uppercase whitespace-nowrap">What can I help with?</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <Link href={`/events/${id}/invitations`} className="qa-tile text-left block">
                  <span aria-hidden="true" className="qa-tile-icon"><span className="material-symbols-outlined icon-fill icon-sm-18">forward_to_inbox</span></span>
                  <p className="font-display font-bold text-sm text-ink leading-tight">Send invites</p>
                </Link>
                <Link href={`/events/${id}/guests`} className="qa-tile text-left block">
                  <span aria-hidden="true" className="qa-tile-icon"><span className="material-symbols-outlined icon-fill icon-sm-18">how_to_reg</span></span>
                  <p className="font-display font-bold text-sm text-ink leading-tight">Track RSVPs</p>
                </Link>
                <Link href={`/events/${id}/planning`} className="qa-tile text-left block">
                  <span aria-hidden="true" className="qa-tile-icon"><span className="material-symbols-outlined icon-fill icon-sm-18">payments</span></span>
                  <p className="font-display font-bold text-sm text-ink leading-tight">Manage budget</p>
                </Link>
                <Link href={`/events/${id}/planning`} className="qa-tile text-left block">
                  <span aria-hidden="true" className="qa-tile-icon"><span className="material-symbols-outlined icon-fill icon-sm-18">checklist_rtl</span></span>
                  <p className="font-display font-bold text-sm text-ink leading-tight">Plan timeline</p>
                </Link>
              </div>
            </aside>
          </div>

          {/* Stats dock */}
          <div className="hero-dock">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              <div className="stats-strip-card tool-card flex items-center gap-4">
                <span aria-hidden="true" className="stat-icon"><span className="material-symbols-outlined icon-fill">groups</span></span>
                <div className="min-w-0">
                  <p className="text-[10px] font-display font-bold tracking-[0.25em] text-muted uppercase">Guests</p>
                  <p className="font-display font-bold text-2xl text-ink leading-none mt-0.5">
                    {event.guest_capacity ?? '—'}
                  </p>
                  {event.guest_capacity != null && (
                    <p className="text-[10px] text-muted-soft font-semibold mt-1">expected</p>
                  )}
                </div>
              </div>
              <div className="stats-strip-card tool-card flex items-center gap-4">
                <span aria-hidden="true" className="stat-icon"><span className="material-symbols-outlined icon-fill">how_to_reg</span></span>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] font-display font-bold tracking-[0.25em] text-muted uppercase">RSVP rate</p>
                  <p className="font-display font-bold text-2xl text-ink leading-none mt-0.5">—</p>
                  <div className="ec-progress-track"><div className="ec-progress-fill pf-bar" /></div>
                </div>
              </div>
              <div className="stats-strip-card tool-card flex items-center gap-4">
                <span aria-hidden="true" className="stat-icon"><span className="material-symbols-outlined icon-fill">payments</span></span>
                <div className="min-w-0 w-full">
                  <p className="text-[10px] font-display font-bold tracking-[0.25em] text-muted uppercase">Budget used</p>
                  <p className="font-display font-bold text-2xl text-ink leading-none mt-0.5">—</p>
                  <div className="ec-progress-track"><div className="ec-progress-fill pf-bar" /></div>
                </div>
              </div>
            </div>
            <div className="text-center hero-scroll-cue">
              <a href="#journey" className="inline-flex flex-col items-center gap-1 text-muted hover:text-brand transition-colors group">
                <span className="text-[10px] font-display font-bold tracking-[0.3em] uppercase">Scroll · Our journey</span>
                <span aria-hidden="true" className="material-symbols-outlined icon-sm-18">expand_more</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── JOURNEY SNAPSHOT ── */}
      <section id="journey" className="snap reveal page-band pt-20 md:pt-24">
        <article className="clay-card p-7 md:p-10 relative overflow-hidden">
          <div aria-hidden="true" className="absolute -top-32 -right-32 w-72 h-72 rounded-full ec-deco-glow-tr" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative">
            <Link href={`/events/${id}/journey`} className="group block">
              <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">OUR JOURNEY</p>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-ink tracking-[-0.02em] group-hover:text-brand transition-colors">
                Where you are
              </h2>
              {event.primary_date && days !== null && (
                <p className="text-sm text-muted mt-2">
                  {formatDate(event.primary_date)} ·{' '}
                  {days > 0 ? `${days} days to go` : days === 0 ? 'Today!' : 'Past'}
                </p>
              )}
            </Link>
            <div className="flex items-center gap-5">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                  <circle cx="50" cy="50" r="44" stroke="var(--line)" strokeWidth="8" fill="none" />
                  <circle cx="50" cy="50" r="44" stroke="var(--brand)" strokeWidth="8" fill="none"
                    strokeDasharray="276.46" strokeDashoffset={circleOffset} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display font-bold text-2xl text-ink leading-none">{subCount}</span>
                </div>
              </div>
              <div>
                <p className="font-display font-bold text-lg text-ink leading-tight">
                  {subCount} {subCount === 1 ? 'function' : 'functions'}
                </p>
                <p className="text-xs text-muted font-semibold tracking-wide">
                  {subCount === 0 ? 'None added yet' : `${subCount} to come`}
                </p>
              </div>
            </div>
          </div>

          {subCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted">No sub-events added yet.</p>
              <Link
                href={`/events/${id}/journey`}
                className="mt-4 inline-flex items-center gap-2 clay-pill bg-brand text-white font-display font-semibold text-sm tracking-wide px-5 h-11 hover:bg-brand-hover transition-colors"
              >
                Add sub-events
                <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
              </Link>
            </div>
          ) : (
            <>
              {/* Active milestone spotlight — first sub-event */}
              {(() => {
                const next = subEvents[0]
                const nextName = next.custom_name ?? next.event_sub_types?.name ?? 'Sub-event'
                const nextIcon = ICON_MAP[next.event_sub_types?.icon_name ?? ''] ?? 'celebration'
                return (
                  <div className="rounded-3xl p-6 md:p-8 mb-10 relative overflow-hidden ec-milestone-spotlight">
                    <div aria-hidden="true" className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full ec-deco-glow-bl" />
                    <div className="grid md:grid-cols-[auto_1fr_auto] gap-5 md:gap-7 items-center relative">
                      <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0">
                        <span aria-hidden="true" className="absolute inset-0 rounded-2xl bg-brand animate-pulse opacity-30" />
                        <div className="relative w-full h-full rounded-2xl bg-brand text-white flex items-center justify-center ec-clay-pill-shadow">
                          <span aria-hidden="true" className="material-symbols-outlined text-4xl icon-fill">{nextIcon}</span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="inline-flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-3 h-7 rounded-full bg-brand text-white font-display font-bold text-[10px] tracking-[0.25em]">
                            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-white mr-2 animate-pulse" />
                            NEXT UP
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-2xl md:text-3xl text-ink tracking-[-0.02em] mb-1">{nextName}</h3>
                        <p className="text-sm text-muted leading-relaxed max-w-2xl">
                          Your next celebration milestone — add dates and details to start planning this function.
                        </p>
                      </div>
                      <Link
                        href={`/events/${id}/journey`}
                        className="clay-pill bg-brand text-white font-display font-semibold text-sm tracking-wide px-5 h-11 inline-flex items-center gap-2 hover:bg-brand-hover transition-colors shrink-0 self-start md:self-center"
                      >
                        VIEW DETAILS
                        <span aria-hidden="true" className="material-symbols-outlined text-base">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                )
              })()}

              {/* Roadmap strip */}
              <div className="relative">
                <div className="flex items-center justify-between mb-5 gap-4">
                  <p className="text-[11px] font-display font-bold tracking-[0.3em] text-muted uppercase">Full roadmap</p>
                  <Link href={`/events/${id}/journey`} className="font-display font-semibold text-xs text-brand hover:underline whitespace-nowrap">
                    Manage sub-events →
                  </Link>
                </div>
                <div className="roadmap-strip relative pt-3 pb-2">
                  <div aria-hidden="true" className="roadmap-strip-track absolute left-3 right-3 top-[22px] h-[3px] rounded-full" />
                  <ol
                    className="relative grid gap-1 md:gap-2"
                    style={{ gridTemplateColumns: `repeat(${subCount}, minmax(0, 1fr))` }}
                  >
                    {subEvents.map((se, idx) => {
                      const name = se.custom_name ?? se.event_sub_types?.name ?? 'Sub-event'
                      const icon = ICON_MAP[se.event_sub_types?.icon_name ?? ''] ?? 'celebration'
                      const isNext = idx === 0
                      return (
                        <li key={se.id} className="flex flex-col items-center text-center">
                          <button
                            type="button"
                            className={`ec-roadmap-dot ${isNext ? 'ec-roadmap-dot--next' : 'ec-roadmap-dot--upcoming'}`}
                            aria-label={`${name}${isNext ? ', next up' : ', scheduled'}`}
                          >
                            {isNext && (
                              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand animate-pulse opacity-50" />
                            )}
                            <span
                              aria-hidden="true"
                              className={`material-symbols-outlined text-base${isNext ? ' icon-fill relative' : ' text-muted-soft'}`}
                            >
                              {icon}
                            </span>
                          </button>
                          <p className={`mt-3 text-[11px] font-display font-bold leading-tight ${isNext ? 'text-brand' : 'text-muted'}`}>
                            {name}
                          </p>
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </div>
            </>
          )}
        </article>
      </section>

      {/* ── FEATURE BENTO ── */}
      <section id="tools" className="snap reveal page-band pt-20 md:pt-24">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">ALL TOOLS, ONE TAP AWAY</p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-ink tracking-[-0.02em]">Manage your event</h2>
          </div>
        </div>
        <div className="bento-grid">
          {([
            { slug: 'guests',      num: '01', icon: 'groups',           title: 'Guest management',   desc: 'Track RSVPs, organise families, capture dietary needs and hotel bookings.' },
            { slug: 'invitations', num: '02', icon: 'forward_to_inbox', title: 'Digital invitations', desc: 'Send personalised invites via WhatsApp, email or SMS.' },
            { slug: 'planning',    num: '03', icon: 'checklist_rtl',    title: 'Planning',            desc: 'Checklist + budget tracker.' },
            { slug: 'media',       num: '04', icon: 'photo_library',    title: 'Media & memories',    desc: 'Upload, organise and share every photo & reel from the celebrations.' },
            { slug: 'website',     num: '05', icon: 'language',         title: 'Event website',       desc: 'Your public event site — preview, customise, share with guests.' },
          ] as const).map((tool) => (
            <Link
              key={tool.slug}
              href={tool.slug === 'website' ? `/events/${id}/website` : `/events/${id}/${tool.slug}`}
              className="clay-card tool-card p-7 md:p-8 group cursor-pointer relative overflow-hidden scroll-mt-28 block"
            >
              <span className="tool-card-num">{tool.num}</span>
              <div aria-hidden="true" className="tool-card-icon mb-6">
                <span className="material-symbols-outlined icon-fill">{tool.icon}</span>
              </div>
              <h3 className="font-display font-bold text-2xl text-ink mb-2 tracking-[-0.01em]">{tool.title}</h3>
              <p className="text-muted text-sm leading-relaxed mb-6">{tool.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── TIMELINE + ACTIVITY ── */}
      <section className="reveal page-band mt-16">
        <div className="grid grid-cols-12 gap-6">

          {/* Up next — checklist */}
          <div className="col-span-12 lg:col-span-7 lg-glass-card p-7 md:p-8">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">UP NEXT</p>
                <h3 className="font-display font-bold text-2xl text-ink tracking-[-0.01em]">Your timeline</h3>
              </div>
              <Link href={`/events/${id}/planning`} className="font-display font-semibold text-sm text-brand hover:underline whitespace-nowrap">
                Full checklist →
              </Link>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <span aria-hidden="true" className="material-symbols-outlined text-4xl" style={{ color: 'var(--muted)' }}>checklist_rtl</span>
              <p className="text-sm text-muted">No checklist items yet.</p>
              <Link href={`/events/${id}/planning`} className="btn-pill btn-pill-secondary">
                <span>Start planning</span>
                <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Recent activity */}
          <div className="col-span-12 lg:col-span-5 lg-glass-card p-7 md:p-8">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-xs font-display font-bold tracking-[0.35em] text-brand mb-2">THIS WEEK</p>
                <h3 className="font-display font-bold text-2xl text-ink tracking-[-0.01em]">Recent activity</h3>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <span aria-hidden="true" className="material-symbols-outlined text-4xl" style={{ color: 'var(--muted)' }}>history</span>
              <p className="text-sm text-muted">Activity will appear here as you plan.</p>
            </div>
          </div>

        </div>
      </section>

      <PageFooter />
    </div>
  )
}
