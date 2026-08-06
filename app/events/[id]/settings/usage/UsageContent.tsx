interface Props {
  storageUsedBytes: number
  storageLimitBytes: number
  canReadMedia: boolean
  guestTotal: number
  canReadGuests: boolean
  taskPercent: number | null
  budgetPercent: number | null
  canReadPlanning: boolean
  planName: string
}

function fmtGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function UsageContent({
  storageUsedBytes, storageLimitBytes, canReadMedia,
  guestTotal, canReadGuests,
  taskPercent, budgetPercent, canReadPlanning,
  planName,
}: Props) {
  const storagePct = storageLimitBytes > 0 ? Math.min(100, Math.round((storageUsedBytes / storageLimitBytes) * 100)) : 0

  return (
    <div className="es-content">
      <header className="es-content-head">
        <div>
          <h1 className="es-content-title">Usage</h1>
          <p className="es-content-lead">A snapshot of this event&apos;s storage, guests, and plan.</p>
        </div>
      </header>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">database</span>
            Storage
          </h2>
          {canReadMedia && <span className="es-section-tag">{fmtGB(storageUsedBytes)} of {fmtGB(storageLimitBytes)}</span>}
        </header>
        {canReadMedia ? (
          <div
            className="es-usage-bar"
            role="progressbar"
            aria-valuenow={storagePct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Storage used: ${fmtGB(storageUsedBytes)} of ${fmtGB(storageLimitBytes)}`}
          >
            <div className="es-usage-bar-fill" style={{ width: `${storagePct}%` }} />
          </div>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to storage data — contact the event owner.</p>
        )}
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">groups</span>
            Guests
          </h2>
        </header>
        {canReadGuests ? (
          <p className="es-usage-stat">{guestTotal}</p>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to guest data — contact the event owner.</p>
        )}
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">checklist</span>
            Planning progress
          </h2>
        </header>
        {canReadPlanning ? (
          <>
            <p className="es-usage-stat">{taskPercent !== null ? `${taskPercent}% tasks done` : 'No tasks yet'}</p>
            <p className="es-usage-stat">{budgetPercent !== null ? `${budgetPercent}% of budget spent` : 'No budget set'}</p>
          </>
        ) : (
          <p className="es-usage-no-access">You don&apos;t have access to planning data — contact the event owner.</p>
        )}
      </section>

      <section className="es-section">
        <header className="es-section-head">
          <h2 className="es-section-title">
            <span aria-hidden="true" className="material-symbols-outlined icon-fill">verified</span>
            Plan
          </h2>
        </header>
        <p className="es-usage-stat">{planName}</p>
      </section>
    </div>
  )
}
