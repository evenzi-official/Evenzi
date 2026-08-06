"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { EventListItem } from "@/lib/types/events"
import { ScrollProgress } from "@/components/layout/ScrollProgress"
import { FloatingNav } from "@/components/layout/FloatingNav"
import { avatarInitial } from "@/lib/utils"

type Ownership = "my" | "collab"
type TimeFilter = "active" | "past"

export interface PendingInvite {
  id: string
  eventId: string
  eventName: string
  role: string
  invitedAt: string
  ownerDisplayName: string
}

function formatRole(role: string): string {
  if (!role) return role
  return role.charAt(0).toUpperCase() + role.slice(1)
}

// Placeholder cover images by event type slug (Unsplash CDN, free to use).
// Falls back to the wedding image for any unrecognised slug (MVP = weddings only).
const COVER_PLACEHOLDERS: Record<string, string> = {
  wedding: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?auto=format&fit=crop&w=800&q=80',
}
const DEFAULT_PLACEHOLDER = COVER_PLACEHOLDERS.wedding

function coverUrl(event: EventListItem): string {
  return event.coverImageUrl ?? COVER_PLACEHOLDERS[event.eventType.slug] ?? DEFAULT_PLACEHOLDER
}

function formatDate(d: string | null): string {
  if (!d) return "Date not set"
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return "Date not set"
  }
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function isActive(event: EventListItem): boolean {
  if (event.status === "completed") return false
  const days = daysUntil(event.primaryDate)
  if (days !== null && days < 0) return false
  return true
}

function setupProgress(event: EventListItem): { pct: number; label: string } {
  const steps = [
    { done: !!event.primaryDate,          hint: 'Set your event date' },
    { done: !!event.primaryVenue,         hint: 'Add a venue' },
    { done: event.guestCapacity != null,  hint: 'Set guest count' },
    { done: event.subEventCount > 0,      hint: 'Add sub-events' },
    { done: !!event.coverImageUrl,        hint: 'Upload a cover photo' },
  ]
  const done = steps.filter(s => s.done).length
  const pct = Math.round((done / steps.length) * 100)
  const nextHint = steps.find(s => !s.done)?.hint
  const label = pct === 100 ? '100% · Setup complete' : `${pct}% · ${nextHint ?? 'Almost there'}`
  return { pct, label }
}

function FeaturedCard({ event }: { event: EventListItem }) {
  const days = daysUntil(event.primaryDate)
  const isPast = !isActive(event)
  const { pct, label } = setupProgress(event)

  return (
    <article className="featured-event-card">
      <div
        className="fec-cover"
        aria-hidden="true"
        style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.05) 45%,rgba(0,0,0,.45) 100%),url(${coverUrl(event)})` }}
      >
        {isPast && (
          <span className="fec-cover-tag">
            <span aria-hidden="true" className="material-symbols-outlined fec-cover-tag-icon">check_circle</span>
            Completed
          </span>
        )}
      </div>

      <div className="fec-body">
        <div className="fec-head">
          <div className="fec-head-text">
            <p className="fec-type-eyebrow">{event.eventType.name}</p>
            <h2 className="fec-title">
              <Link href={`/events/${event.id}`} className="fec-link-stretched">
                {event.name ?? "Untitled Event"}
              </Link>
            </h2>
          </div>
          {days !== null && (
            <span className={`fec-countdown${isPast ? " fec-countdown-muted" : ""}`}>
              <span aria-hidden="true" className="material-symbols-outlined icon-fill">
                {isPast ? "history" : "timer"}
              </span>
              {isPast
                ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`
                : `${days} day${days !== 1 ? "s" : ""} to go`}
            </span>
          )}
        </div>

        <div className="fec-meta">
          {event.primaryVenue && (
            <span className="hero-meta-chip">
              <span className="hero-meta-icon">
                <span className="material-symbols-outlined icon-fill dash-meta-icon">location_on</span>
              </span>
              <span className="hero-meta-text">
                <span className="hero-meta-label">Venue</span>
                <span className="hero-meta-value">{event.primaryVenue}</span>
              </span>
            </span>
          )}
          {event.primaryDate && (
            <span className="hero-meta-chip">
              <span className="hero-meta-icon">
                <span className="material-symbols-outlined icon-fill dash-meta-icon">calendar_month</span>
              </span>
              <span className="hero-meta-text">
                <span className="hero-meta-label">Date</span>
                <span className="hero-meta-value">{formatDate(event.primaryDate)}</span>
              </span>
            </span>
          )}
          {event.guestCapacity != null && (
            <span className="hero-meta-chip">
              <span className="hero-meta-icon">
                <span className="material-symbols-outlined icon-fill dash-meta-icon">groups</span>
              </span>
              <span className="hero-meta-text">
                <span className="hero-meta-label">Guests</span>
                <span className="hero-meta-value">{event.guestCapacity} expected</span>
              </span>
            </span>
          )}
        </div>

        <div className="fec-progress">
          <div className="fec-progress-head">
            <span className="fec-progress-label">Setup progress</span>
            <span className="fec-progress-val">{label}</span>
          </div>
          <div className="fec-progress-track">
            <span className="fec-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="fec-bottom">
          {!isPast && days !== null && days > 0 && (
            <Link href={`/events/${event.id}`} className="fec-upnext">
              <span aria-hidden="true" className="material-symbols-outlined">bolt</span>
              <span className="fec-upnext-text">
                <strong>Up next</strong> · Continue setting up your event
              </span>
            </Link>
          )}
          <div className="fec-actions">
            <Link href={`/events/${event.id}/website`} className="btn-pill btn-pill-secondary">
              <span aria-hidden="true" className="material-symbols-outlined">language</span>
              Live website
            </Link>
            <Link href={`/events/${event.id}`} className="btn-pill btn-pill-primary">
              Manage event
              <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}

function CompactCard({ event }: { event: EventListItem }) {
  const isPast = !isActive(event)

  return (
    <Link href={`/events/${event.id}`} className="compact-event-card">
      <div className="cec-body">
        <span className={`cec-status${isPast ? " cec-status-archived" : " cec-status-active"}`}>
          <span className="dot" aria-hidden="true" />
          {isPast ? "Completed" : "Active"}
        </span>
        <p className="cec-type">{event.eventType.name}</p>
        <p className="cec-title">{event.name ?? "Untitled Event"}</p>
        {event.primaryDate && (
          <p className="cec-meta-line">
            <span aria-hidden="true" className="material-symbols-outlined">calendar_month</span>
            {formatDate(event.primaryDate)}
          </p>
        )}
        {event.primaryVenue && (
          <p className="cec-meta-line">
            <span aria-hidden="true" className="material-symbols-outlined">location_on</span>
            {event.primaryVenue}
          </p>
        )}
        <div className="cec-bottom">
          <span className="cec-action">
            Manage
            <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptySection({ isCollab }: { isCollab?: boolean }) {
  return (
    <div className="nothing-yet">
      <span className="nothing-yet-icon" aria-hidden="true">
        <span className="material-symbols-outlined">{isCollab ? "group_add" : "event_note"}</span>
      </span>
      <p className="nothing-yet-title">{isCollab ? "No collaborations yet" : "Nothing here yet"}</p>
      <p className="nothing-yet-sub">
        {isCollab
          ? "Events you're invited to collaborate on will appear here."
          : "No events in this view. Create a new event to get started."}
      </p>
      {!isCollab && (
        <Link href="/events/create" className="btn-pill btn-pill-primary" style={{ marginTop: "0.5rem" }}>
          <span aria-hidden="true" className="material-symbols-outlined">add</span>
          Create event
        </Link>
      )}
    </div>
  )
}

function PendingInviteCard({
  invite,
  busy,
  onAccept,
  onDecline,
}: {
  invite: PendingInvite
  busy: boolean
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <article className="pending-invite-card">
      <div className="pic-body">
        <span className="status-badge status-pending">
          <span className="status-dot" aria-hidden="true" />
          Pending invite
        </span>
        <p className="pic-type">{formatRole(invite.role)}</p>
        <p className="pic-title">{invite.eventName}</p>
        <p className="pic-meta">
          <span aria-hidden="true" className="material-symbols-outlined">person</span>
          Invited by {invite.ownerDisplayName}
        </p>
        <div className="pic-actions">
          <button
            type="button"
            className="btn-pill btn-pill-secondary"
            disabled={busy}
            aria-busy={busy}
            onClick={onDecline}
          >
            Decline
          </button>
          <button
            type="button"
            className="btn-pill btn-pill-primary"
            disabled={busy}
            aria-busy={busy}
            onClick={onAccept}
          >
            Accept
            <span aria-hidden="true" className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function sortForDashboard(events: EventListItem[]): EventListItem[] {
  const upcoming = events
    .filter((e) => { const d = daysUntil(e.primaryDate); return d !== null && d > 0 })
    .sort((a, b) => {
      const da = daysUntil(a.primaryDate) ?? Infinity
      const db = daysUntil(b.primaryDate) ?? Infinity
      return da - db
    })
  const active = events.filter((e) => { const d = daysUntil(e.primaryDate); return d === null || d <= 0 })
  return [...upcoming, ...active]
}

function EventSection({ events, isCollab }: { events: EventListItem[]; isCollab?: boolean }) {
  if (events.length === 0) return <EmptySection isCollab={isCollab} />

  const sorted = sortForDashboard(events)
  const [featured, ...rest] = sorted

  return (
    <div className="event-grid">
      <FeaturedCard event={featured} />
      <div className="event-side">
        {rest.map((e) => (
          <CompactCard key={e.id} event={e} />
        ))}
        <Link href="/events/create" className="empty-cta-card">
          <span aria-hidden="true" className="empty-cta-icon">
            <span className="material-symbols-outlined">add</span>
          </span>
          <span className="empty-cta-title">Start a new event</span>
          <span className="empty-cta-sub">
            Wedding, birthday, conference, or anything you&apos;re hosting.
          </span>
        </Link>
      </div>
    </div>
  )
}

function ErrorSection() {
  return (
    <div className="nothing-yet">
      <span className="nothing-yet-icon" aria-hidden="true">
        <span className="material-symbols-outlined">error</span>
      </span>
      <p className="nothing-yet-title">Couldn&apos;t load your events</p>
      <p className="nothing-yet-sub">
        Something went wrong while fetching your events. Please refresh the page to try again.
      </p>
    </div>
  )
}

interface Props {
  events: EventListItem[]
  collabEvents: EventListItem[]
  pendingInvites?: PendingInvite[]
  userDisplay: string
  avatarUrl?: string | null
  hasError?: boolean
}

function TimeFilterSeg({
  time,
  setTime,
}: {
  time: TimeFilter
  setTime: (t: TimeFilter) => void
}) {
  return (
    <div className="seg seg--fill" role="radiogroup" aria-label="Time filter">
      <button
        type="button"
        role="radio"
        aria-checked={time === "active"}
        className={`seg-item${time === "active" ? " is-active" : ""}`}
        onClick={() => setTime("active")}
      >
        <span>Active</span>
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={time === "past"}
        className={`seg-item${time === "past" ? " is-active" : ""}`}
        onClick={() => setTime("past")}
      >
        <span>Past</span>
      </button>
    </div>
  )
}

export default function EventsGrid({
  events,
  collabEvents,
  pendingInvites = [],
  userDisplay,
  avatarUrl = null,
  hasError = false,
}: Props) {
  const router = useRouter()
  const [ownership, setOwnership] = useState<Ownership>("my")
  const [time, setTime] = useState<TimeFilter>("active")
  const [actingId, setActingId] = useState<string | null>(null)

  const myActive = events.filter(isActive)
  const myPast = events.filter((e) => !isActive(e))
  const collabActive = collabEvents.filter(isActive)
  const collabPast = collabEvents.filter((e) => !isActive(e))

  const visibleEvents =
    ownership === "my"
      ? time === "active"
        ? myActive
        : myPast
      : time === "active"
        ? collabActive
        : collabPast

  const showPending =
    ownership === "collab" && pendingInvites.length > 0

  const avatarLetter = avatarInitial(userDisplay)

  async function acceptInvite(id: string): Promise<void> {
    setActingId(id)
    try {
      const res = await fetch(`/api/collaborators/invites/${id}/accept`, {
        method: "POST",
      })
      if (!res.ok) {
        console.error("[home] accept invite failed:", res.status)
        return
      }
      router.refresh()
    } catch (err) {
      console.error("[home] accept invite error:", err)
    } finally {
      setActingId(null)
    }
  }

  async function declineInvite(id: string): Promise<void> {
    if (!window.confirm("Decline this collaboration invite?")) return
    setActingId(id)
    try {
      const res = await fetch(`/api/collaborators/invites/${id}/decline`, {
        method: "POST",
      })
      if (!res.ok) {
        console.error("[home] decline invite failed:", res.status)
        return
      }
      router.refresh()
    } catch (err) {
      console.error("[home] decline invite error:", err)
    } finally {
      setActingId(null)
    }
  }

  let eventsBody: React.ReactNode
  if (hasError) {
    eventsBody = <ErrorSection />
  } else if (
    ownership === "collab" &&
    pendingInvites.length === 0 &&
    collabEvents.length === 0
  ) {
    eventsBody = <EmptySection isCollab />
  } else if (
    ownership === "collab" &&
    pendingInvites.length > 0 &&
    visibleEvents.length === 0
  ) {
    eventsBody = (
      <p className="pending-invite-followup">
        Accepted collaborations will show up here under Active or Past.
      </p>
    )
  } else {
    eventsBody = (
      <EventSection events={visibleEvents} isCollab={ownership === "collab"} />
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      {/* M9: the shell `.seg--fill` desktop rule (max-width:520px; margin-right:auto)
          leaves the right "Active/Past" control with trailing dead space and out of
          alignment with the left "My events/Collaborations" control. Scope an override
          to the home filter row so both segs split the row evenly (50/50) with the
          space-between gap — edge-to-edge, no dead space, matching the left group. */}
      <style>{`
        @media (min-width: 768px) {
          .home-filter-row .seg.seg--fill {
            flex: 1 1 0;
            min-width: 0;
            max-width: none;
            margin-right: 0;
          }
        }
      `}</style>
      <ScrollProgress />
      <FloatingNav showCreateEvent userInitial={avatarLetter} avatarUrl={avatarUrl} />

      <main className="page-band pt-10 md:pt-14 pb-20">
        <header className="section-head">
          <p className="section-head-eyebrow">Welcome back, {userDisplay}</p>
          <h1 className="section-head-title" id="dash-title">Your Events</h1>
          <p className="section-head-sub">
            Everything you&apos;re hosting and planning — in one place.
          </p>
        </header>

        <div className="filter-row home-filter-row">
          <div className="seg seg--fill" role="radiogroup" aria-label="Ownership filter">
            <button
              type="button"
              role="radio"
              aria-checked={ownership === "my"}
              className={`seg-item${ownership === "my" ? " is-active" : ""}`}
              onClick={() => setOwnership("my")}
            >
              <span
                aria-hidden="true"
                className={`material-symbols-outlined${ownership === "my" ? " icon-fill" : ""} dash-filter-icon`}
              >
                home_pin
              </span>
              <span>My events</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={ownership === "collab"}
              className={`seg-item${ownership === "collab" ? " is-active" : ""}`}
              onClick={() => setOwnership("collab")}
            >
              <span aria-hidden="true" className="material-symbols-outlined dash-filter-icon">
                groups
              </span>
              <span>Collaborations</span>
            </button>
          </div>

          <TimeFilterSeg time={time} setTime={setTime} />
        </div>

        {showPending && (
          <section
            className="pending-invite-stack mt-8 md:mt-10"
            aria-label="Pending collaboration invites"
          >
            {pendingInvites.map((invite) => (
              <PendingInviteCard
                key={invite.id}
                invite={invite}
                busy={actingId === invite.id}
                onAccept={() => void acceptInvite(invite.id)}
                onDecline={() => void declineInvite(invite.id)}
              />
            ))}
          </section>
        )}

        <section
          className="mt-10 md:mt-12"
          aria-label={`${ownership === "my" ? "My" : "Collaborative"} ${time} events`}
        >
          {eventsBody}
        </section>
      </main>
    </div>
  )
}
