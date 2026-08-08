'use client'

export type EscalateFooterAction = {
  id: string
  label: string
  onClick: () => void
  variant: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  desktopOnly?: boolean
  icon?: string
  fullWidth?: boolean
}

export type EscalateFooterProps = {
  lead: string
  actions: EscalateFooterAction[]
  helperText?: string
  /** When true, hide the footer entirely (ticket / success). */
  hidden?: boolean
}

/**
 * Single escalation ladder for the Help panel.
 * Driven by a config array so a future answer tier can inject a step without
 * forking the footer markup (UI spec §2).
 */
export function EscalateFooter({
  lead,
  actions,
  helperText,
  hidden = false,
}: EscalateFooterProps): React.ReactElement | null {
  if (hidden) return null

  return (
    <footer
      className="help-escalate-footer shrink-0 border-t border-[var(--line-soft)] bg-[var(--card)] px-4 py-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <p className="m-0 mb-2 text-xs text-[var(--muted)]">{lead}</p>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const variantClass =
            action.variant === 'primary'
              ? 'btn-pill-primary'
              : action.variant === 'ghost'
                ? 'btn-pill-ghost'
                : 'btn-pill-secondary'
          return (
            <button
              key={action.id}
              type="button"
              className={`btn-pill btn-pill-sm ${variantClass}${action.desktopOnly ? ' hidden md:inline-flex' : ''}${action.fullWidth ? ' w-full justify-center' : ''}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.label}
              {action.icon ? (
                <span className="material-symbols-outlined ml-1 text-[16px]" aria-hidden="true">
                  {action.icon}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
      {helperText ? (
        <p className="form-hint m-0 mt-2">{helperText}</p>
      ) : null}
    </footer>
  )
}
