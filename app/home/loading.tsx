// M8: route-level skeleton shown during navigation to /home (server fetch).
// Reuses the shell `.skeleton` primitive — SK3 "event card" template from
// designs/components.html §14 — instead of a blank/empty flash.

function SkeletonCard(): React.ReactElement {
  return (
    <div className="clay-card p-4">
      <div className="skeleton skeleton-block" style={{ aspectRatio: "16/9", borderRadius: "12px" }} />
      <div className="skeleton skeleton-line skeleton-line-lg mt-4" style={{ width: "75%" }} />
      <div className="skeleton skeleton-line skeleton-line-sm mt-3" style={{ width: "50%" }} />
      <div className="flex items-center gap-2 mt-4">
        <div className="skeleton skeleton-pill" style={{ width: "64px" }} />
        <div className="skeleton skeleton-pill" style={{ width: "48px" }} />
      </div>
    </div>
  );
}

export default function HomeLoading(): React.ReactElement {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100dvh" }} aria-busy="true">
      <main className="page-band pt-10 md:pt-14 pb-20">
        <header className="section-head">
          <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: "180px" }} />
          <div className="skeleton skeleton-line skeleton-line-lg mt-3" style={{ width: "260px" }} />
          <div className="skeleton skeleton-line skeleton-line-sm mt-3" style={{ width: "320px", maxWidth: "100%" }} />
        </header>

        <div className="filter-row" aria-hidden="true">
          <div className="skeleton skeleton-pill" style={{ width: "100%", maxWidth: "260px", height: "44px" }} />
          <div className="skeleton skeleton-pill" style={{ width: "100%", maxWidth: "180px", height: "44px" }} />
        </div>

        <section className="event-grid mt-10 md:mt-12" aria-label="Loading events">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </section>
      </main>
    </div>
  );
}
