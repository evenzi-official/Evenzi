import { describe, expect, it } from 'vitest'
import {
  sortByDisplayOrder,
  sortByWeddingRoadmap,
  type RoadmapSortable,
} from '@/lib/events/subEventRoadmap'

function row(
  partial: Pick<RoadmapSortable, 'id'> & Partial<RoadmapSortable>,
): RoadmapSortable {
  return {
    custom_name: null,
    type_name: null,
    event_date: null,
    display_order: null,
    start_time: null,
    ...partial,
  }
}

describe('sortByDisplayOrder', () => {
  it('orders by display_order, not WEDDING_ROADMAP_ORDER (Mehendi before Sangeet)', () => {
    const sorted = sortByDisplayOrder([
      row({ id: 'sangeet', custom_name: 'Sangeet', display_order: 4, event_date: '2026-12-20' }),
      row({ id: 'mehendi', custom_name: 'Mehendi', display_order: 2, event_date: '2026-12-19' }),
      row({ id: 'haldi', custom_name: 'Haldi', display_order: 3, event_date: '2026-12-19' }),
      row({ id: 'pre', custom_name: 'Pre-Wedding Shoot', display_order: 1, event_date: '2026-12-10' }),
    ])
    expect(sorted.map((r) => r.id)).toEqual(['pre', 'mehendi', 'haldi', 'sangeet'])
  })

  it('tiebreaks equal display_order on event_date then start_time', () => {
    const sorted = sortByDisplayOrder([
      row({ id: 'late', display_order: 1, event_date: '2026-12-19', start_time: '18:00' }),
      row({ id: 'early', display_order: 1, event_date: '2026-12-19', start_time: '10:00' }),
      row({ id: 'next-day', display_order: 1, event_date: '2026-12-20', start_time: '09:00' }),
    ])
    expect(sorted.map((r) => r.id)).toEqual(['early', 'late', 'next-day'])
  })
})

describe('sortByWeddingRoadmap', () => {
  it('still places Sangeet before Mehendi/Haldi for the hub strip', () => {
    const sorted = sortByWeddingRoadmap([
      row({ id: 'mehendi', type_name: 'Mehendi', display_order: 2 }),
      row({ id: 'sangeet', type_name: 'Sangeet', display_order: 1 }),
      row({ id: 'haldi', type_name: 'Haldi', display_order: 3 }),
    ])
    expect(sorted.map((r) => r.id)).toEqual(['sangeet', 'mehendi', 'haldi'])
  })
})
