const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''

  const diffSec = Math.round((then - Date.now()) / 1000)
  const absSec = Math.abs(diffSec)

  if (absSec < 60) return rtf.format(diffSec, 'second')

  const diffMin = Math.round(diffSec / 60)
  if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute')

  const diffHr = Math.round(diffSec / 3600)
  if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour')

  const diffDay = Math.round(diffSec / 86400)
  if (Math.abs(diffDay) < 7) return rtf.format(diffDay, 'day')

  const diffWeek = Math.round(diffSec / 604_800)
  if (Math.abs(diffWeek) < 5) return rtf.format(diffWeek, 'week')

  const diffMonth = Math.round(diffSec / 2_592_000)
  if (Math.abs(diffMonth) < 12) return rtf.format(diffMonth, 'month')

  const diffYear = Math.round(diffSec / 31_536_000)
  return rtf.format(diffYear, 'year')
}
