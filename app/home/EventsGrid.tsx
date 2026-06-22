"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { EventListItem } from "@/lib/types/events"
import { ScrollProgress } from "@/components/layout/ScrollProgress"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

type Ownership = "my" | "collab"
type TimeFilter = "active" | "past"

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
    !!event.primaryDate,
    !!event.primaryVenue,
    event.guestCapacity != null,
    event.subEventCount > 0,
  ]
  const done = steps.filter(Boolean).length
  const pct = Math.round((done / steps.length) * 100)
  const labels: Record<number, string> = { 0: '0%', 25: '25%', 50: '50%', 75: '75%', 100: '100% · Setup complete' }
  return { pct, label: labels[pct] ?? `${pct}%` }
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
        style={
          event.coverImageUrl
            ? { backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.25) 0%,rgba(0,0,0,.05) 45%,rgba(0,0,0,.45) 100%),url(${event.coverImageUrl})` }
            : { background: "linear-gradient(135deg,var(--brand-tint) 0%,var(--brand-tint-2) 100%)" }
        }
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
            <span className="fec-progress-label">Planning progress</span>
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

interface Props {
  events: EventListItem[]
  userDisplay: string
}

export default function EventsGrid({ events, userDisplay }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [ownership, setOwnership] = useState<Ownership>("my")
  const [time, setTime] = useState<TimeFilter>("active")

  const handleSignOut = async (): Promise<void> => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const myActive = events.filter(isActive)
  const myPast = events.filter((e) => !isActive(e))
  const collabActive: EventListItem[] = []
  const collabPast: EventListItem[] = []

  const visibleEvents =
    ownership === "my"
      ? time === "active"
        ? myActive
        : myPast
      : time === "active"
        ? collabActive
        : collabPast

  const avatarLetter = (userDisplay.replace(/[^a-zA-Z]/g, "")[0] ?? "U").toUpperCase()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100dvh' }}>
      <ScrollProgress />
      <nav className="floating-nav" aria-label="Main">
        <div className="floating-nav-inner dash-nav-inner">
          <Link href="/home" className="fn-logo-link" aria-label="Evenzi home">
            <span className="fn-logo">EVENZI</span>
            <span className="hidden sm:flex flex-col leading-tight border-l border-brand/30 pl-3" aria-hidden="true">
              <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">CAPTURE</span>
              <span className="font-display font-bold text-[9px] tracking-[0.35em] text-brand/85">SHARE · CHERISH</span>
            </span>
          </Link>

          <span aria-hidden="true" />

          <div className="fn-actions">
            <Link href="/events/create" className="dash-create-btn" aria-label="Create new event">
              <span aria-hidden="true" className="material-symbols-outlined">add</span>
              <span className="dash-create-label">Create event</span>
            </Link>
            <button
              type="button"
              aria-label="Notifications"
              className="fn-icon-btn"
            >
              <span aria-hidden="true" className="material-symbols-outlined">notifications</span>
            </button>
            <ThemeToggle />
            <button
              type="button"
              aria-label="Settings"
              className="fn-icon-btn"
              onClick={() => { void handleSignOut() }}
            >
              <span aria-hidden="true" className="material-symbols-outlined">logout</span>
            </button>
            <span className="fn-divider hidden sm:inline-block" aria-hidden="true" />
            <button type="button" aria-label="Account menu" className="fn-avatar">
              {avatarLetter}
            </button>
          </div>
        </div>
      </nav>

      <main className="page-band pt-10 md:pt-14 pb-20">
        <header className="section-head">
          <p className="section-head-eyebrow">Welcome back, {userDisplay}</p>
          <h1 className="section-head-title" id="dash-title">Your Events</h1>
          <p className="section-head-sub">
            Everything you&apos;re hosting and planning — in one place.
          </p>
        </header>

        <div className="filter-row">
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
        </div>

        <section
          className="mt-10 md:mt-12"
          aria-label={`${ownership === "my" ? "My" : "Collaborative"} ${time} events`}
        >
          <EventSection events={visibleEvents} isCollab={ownership === "collab"} />
        </section>
      </main>
    </div>
  )
}
