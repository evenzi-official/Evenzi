// M16: route-level skeleton for the event dashboard while the server component
// fetches event_hub_summary + sub-events. Renders inside the event [id] layout
// (nav + tool-rail), reusing the shell `.skeleton` primitive.

function StatTile(): React.ReactElement {
  return (
    <div className="clay-card p-4" style={{ flex: "1 1 0" }}>
      <div className="skeleton skeleton-line skeleton-line-sm" style={{ width: "40%" }} />
      <div className="skeleton skeleton-line skeleton-line-lg mt-3" style={{ width: "70%" }} />
    </div>
  )
}

export default function EventLoading(): React.ReactElement {
  return (
    <div className="page-band pt-8 md:pt-12 pb-20" aria-busy="true" aria-label="Loading event">
      {/* hero */}
      <div className="skeleton skeleton-block" style={{ aspectRatio: "21/9", borderRadius: "20px" }} />

      {/* stat strip */}
      <div className="flex gap-3 mt-6" style={{ flexWrap: "wrap" }}>
        <StatTile />
        <StatTile />
        <StatTile />
      </div>

      {/* tool grid */}
      <div className="skeleton skeleton-line skeleton-line-lg mt-10" style={{ width: "220px" }} />
      <div
        className="mt-5"
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="clay-card p-5">
            <div className="skeleton skeleton-circle" style={{ width: "40px" }} />
            <div className="skeleton skeleton-line skeleton-line-lg mt-4" style={{ width: "60%" }} />
            <div className="skeleton skeleton-line skeleton-line-sm mt-3" style={{ width: "90%" }} />
          </div>
        ))}
      </div>
    </div>
  )
}
