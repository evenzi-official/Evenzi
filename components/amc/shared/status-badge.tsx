'use client'

import type { RunStatus } from '@/lib/amc/types'

// Extend RunStatus with 'idle' for display purposes
type BadgeStatus = RunStatus | 'idle'

const STATUS_STYLES: Record<BadgeStatus, string> = {
  pending:   'bg-gray-100 text-gray-700',
  running:   'bg-blue-100 text-blue-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  aborted:   'bg-red-100 text-red-500',
  idle:      'bg-gray-100 text-gray-500',
}

const STATUS_DOTS: Record<BadgeStatus, string> = {
  pending:   'bg-gray-400',
  running:   'bg-blue-500 animate-pulse',
  paused:    'bg-yellow-500',
  completed: 'bg-green-500',
  failed:    'bg-red-500',
  aborted:   'bg-red-400',
  idle:      'bg-gray-300',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const s = (STATUS_STYLES[status as BadgeStatus] ?? 'bg-gray-100 text-gray-700')
  const dot = (STATUS_DOTS[status as BadgeStatus] ?? 'bg-gray-400')

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${s} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}
