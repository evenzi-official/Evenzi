type Variant = 'success' | 'warning' | 'danger' | 'info' | 'draft' | 'live' | 'overrun'

interface StatusBadgeProps {
  variant?: Variant
  children: string
  dot?: boolean
}

const variantMap: Record<Variant, string> = {
  success: 'status-badge status-badge--success',
  warning: 'status-badge status-badge--warning',
  danger:  'status-badge status-badge--danger',
  info:    'status-badge status-badge--info',
  draft:   'status-badge status-badge--draft',
  live:    'status-badge status-badge--live',
  overrun: 'status-badge status-badge--over',
}

export function StatusBadge({ variant = 'info', children, dot = false }: StatusBadgeProps) {
  return (
    <span className={variantMap[variant]}>
      {dot && <span aria-hidden="true" className="status-dot" />}
      {children}
    </span>
  )
}
