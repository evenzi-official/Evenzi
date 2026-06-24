import { ReactElement } from 'react'

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'live' | 'overrun'

interface StatusBadgeProps {
  variant?: Variant
  children: string
  dot?: boolean
}

/**
 * Maps semantic variants onto the canonical shell status classes
 * (see designs/shared/shell.css ~2640 / components.html). No invented classes:
 * every variant resolves to a real `.status-*` primitive that carries both the
 * pill color and the `.status-dot` coloring.
 *   success  → status-confirmed (green)
 *   live     → status-published (green)
 *   info     → status-published (green)
 *   warning  → status-maybe     (amber)
 *   danger   → status-declined  (red)
 *   overrun  → status-declined  (red — budget over-spend)
 *   draft    → status-draft     (muted)
 */
const variantMap: Record<Variant, string> = {
  success: 'status-badge status-confirmed',
  warning: 'status-badge status-maybe',
  danger:  'status-badge status-declined',
  info:    'status-badge status-published',
  draft:   'status-badge status-draft',
  live:    'status-badge status-published',
  overrun: 'status-badge status-declined',
}

export function StatusBadge({ variant = 'info', children, dot = false }: StatusBadgeProps): ReactElement {
  return (
    <span className={variantMap[variant]}>
      {dot && <span aria-hidden="true" className="status-dot" />}
      {children}
    </span>
  )
}
