// M8/M16 — structure-matched skeleton for /home.
// Mirrors the real page (EventsGrid) 1:1: the static chrome (nav, header copy,
// filter tabs) renders as real markup; only the dynamic event-card CONTENT is
// skeletonised — the card container + every structural div stay in place, so
// there is zero layout shift when the real content swaps in.

import Link from "next/link"
import { FloatingNav } from "@/components/layout/FloatingNav"

function MetaChipSkeleton(): React.ReactElement {
  return (
    <span className="hero-meta-chip">
      <span className="hero-meta-icon">
        <span className="skeleton skeleton-circle" style={{ width: "20px", height: "20px" }} />
      </span>
      <span className="hero-meta-text" style={{ gap: "6px" }}>
        <span className="skeleton skeleton-line skeleton-line-sm" style={{ width: "40px" }} />
        <span className="skeleton skeleton-line" style={{ width: "84px" }} />
      </span>
    </span>
  )
}

/** Real card structure; dynamic text/values replaced with skeleton. */
function FeaturedCardSkeleton(): React.ReactElement {
  return (
    <article className="featured-event-card" aria-hidden="true">
      <div className="fec-cover">
        <span className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: 0 }} />
      </div>
      <div className="fec-body">
        <div className="fec-head">
          <div className="fec-head-text" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <span className="skeleton skeleton-line skeleton-line-sm" style={{ width: "72px" }} />
            <span className="skeleton skeleton-line skeleton-line-lg" style={{ width: "60%", maxWidth: "280px" }} />
          </div>
          <span className="skeleton skeleton-pill" style={{ width: "108px" }} />
        </div>

        <div className="fec-meta">
          <MetaChipSkeleton />
          <MetaChipSkeleton />
          <MetaChipSkeleton />
        </div>

        <div className="fec-progress">
          <div className="fec-progress-head">
            <span className="fec-progress-label">Planning progress</span>
            <span className="skeleton skeleton-line skeleton-line-sm" style={{ width: "100px" }} />
          </div>
          <div className="fec-progress-track">
            <span className="skeleton" style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />
          </div>
        </div>

        <div className="fec-bottom">
          <span className="skeleton skeleton-pill" style={{ width: "70%", maxWidth: "320px", height: "44px" }} />
          <div className="fec-actions">
            <span className="skeleton skeleton-pill" style={{ width: "132px", height: "44px" }} />
            <span className="skeleton skeleton-pill" style={{ width: "150px", height: "44px" }} />
          </div>
        </div>
      </div>
    </article>
  )
}

export default function HomeLoading(): React.ReactElement {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }} aria-busy="true">
      <FloatingNav showCreateEvent />

      <main className="page-band pt-10 md:pt-14 pb-20">
        {/* ── real header copy (static) ── */}
        <header className="section-head">
          <p className="section-head-eyebrow">Welcome back,</p>
          <h1 className="section-head-title">Your Events</h1>
          <p className="section-head-sub">Everything you&apos;re hosting and planning — in one place.</p>
        </header>

        {/* ── real filter tabs (static) ── */}
        <div className="filter-row home-filter-row" aria-hidden="true">
          <div className="seg seg--fill">
            <span className="seg-item is-active">
              <span className="material-symbols-outlined icon-fill dash-filter-icon">home_pin</span>
              <span>My events</span>
            </span>
            <span className="seg-item">
              <span className="material-symbols-outlined dash-filter-icon">groups</span>
              <span>Collaborations</span>
            </span>
          </div>
          <div className="seg seg--fill">
            <span className="seg-item is-active"><span>Active</span></span>
            <span className="seg-item"><span>Past</span></span>
          </div>
        </div>

        {/* ── dynamic content → skeleton (card shell present) ── */}
        <div className="event-grid mt-10 md:mt-12">
          <FeaturedCardSkeleton />
          <div className="event-side">
            <Link href="/events/create" className="empty-cta-card" aria-hidden="true">
              <span aria-hidden="true" className="empty-cta-icon">
                <span className="material-symbols-outlined">add</span>
              </span>
              <span className="empty-cta-title">Start a new event</span>
              <span className="empty-cta-sub">Wedding, birthday, conference, or anything you&apos;re hosting.</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
