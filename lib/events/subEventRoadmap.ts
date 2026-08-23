export const ICON_MAP: Record<string, string> = {
  sparkles: 'auto_awesome',
  palette: 'palette',
  music: 'music_note',
  heart: 'favorite',
  utensils: 'restaurant',
  wine: 'wine_bar',
  coffee: 'local_cafe',
  spa: 'spa',
}

/** Canonical wedding timeline. Unknown / custom names sort last. */
export const WEDDING_ROADMAP_ORDER: Record<string, number> = {
  'pre-wedding shoot': 1,
  engagement: 2,
  'cocktail party': 3,
  sangeet: 4,
  mehendi: 5,
  haldi: 6,
  'wedding ceremony': 7,
  reception: 8,
  'post-wedding brunch': 9,
}

export const WEDDING_CEREMONY_NAME = 'wedding ceremony'

export function resolveSubEventIcon(iconName: string | null | undefined): string {
  if (!iconName) return 'celebration'
  return ICON_MAP[iconName] ?? iconName
}

export function subEventTitle(
  customName: string | null | undefined,
  typeName: string | null | undefined,
): string {
  const custom = customName?.trim()
  if (custom) return custom
  return typeName?.trim() || 'Function'
}

export function isWeddingCeremony(typeName: string | null | undefined): boolean {
  return (typeName ?? '').trim().toLowerCase() === WEDDING_CEREMONY_NAME
}

export function formatSubEventDate(iso: string | null | undefined): string | null {
  if (!iso) return null
  const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatSubEventTime(time24: string | null | undefined): string | null {
  if (!time24) return null
  const [hStr, mStr] = time24.split(':')
  const h = parseInt(hStr, 10)
  const min = parseInt(mStr, 10)
  if (Number.isNaN(h) || Number.isNaN(min)) return null
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(min).padStart(2, '0')} ${ampm}`
}

export function formatSubEventMeta(
  date: string | null | undefined,
  time: string | null | undefined,
  venue: string | null | undefined,
): string {
  const parts = [
    formatSubEventDate(date),
    formatSubEventTime(time),
    venue?.trim() || null,
  ].filter((p): p is string => Boolean(p))
  return parts.join(' · ')
}

export type JourneyBadge = 'held' | 'next' | 'big-day'

export interface RoadmapSortable {
  id: string
  custom_name: string | null
  type_name: string | null
  event_date: string | null
  display_order: number | null
}

function todayIsoLocal(): string {
  const n = new Date()
  const y = n.getFullYear()
  const m = String(n.getMonth() + 1).padStart(2, '0')
  const d = String(n.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function sortByWeddingRoadmap<T extends RoadmapSortable>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const nameOf = (row: RoadmapSortable) =>
      (row.custom_name ?? row.type_name ?? '').toLowerCase()
    const byRoadmap =
      (WEDDING_ROADMAP_ORDER[nameOf(a)] ?? 99) - (WEDDING_ROADMAP_ORDER[nameOf(b)] ?? 99)
    if (byRoadmap !== 0) return byRoadmap
    return (a.display_order ?? 0) - (b.display_order ?? 0)
  })
}

export function journeyBadgeFor(
  row: RoadmapSortable,
  nextUpId: string | null,
): JourneyBadge | null {
  if (isWeddingCeremony(row.type_name)) return 'big-day'
  if (row.event_date && row.event_date < todayIsoLocal()) return 'held'
  if (nextUpId && row.id === nextUpId) return 'next'
  return null
}

export function findNextUpId(rows: RoadmapSortable[]): string | null {
  const today = todayIsoLocal()
  const upcoming = rows
    .filter((r) => r.event_date && r.event_date >= today && !isWeddingCeremony(r.type_name))
    .sort((a, b) => (a.event_date ?? '').localeCompare(b.event_date ?? ''))
  return upcoming[0]?.id ?? null
}

export function countHeldAndUpcoming(rows: RoadmapSortable[]): { held: number; upcoming: number } {
  const today = todayIsoLocal()
  let held = 0
  let upcoming = 0
  for (const r of rows) {
    if (r.event_date && r.event_date < today) held += 1
    else upcoming += 1
  }
  return { held, upcoming }
}
