'use client'

import { useState, useSyncExternalStore } from 'react'

// ── coalesce ──────────────────────────────────────────────────────────────────
// Trailing-edge debounce: repeated calls within `ms` of each other collapse
// into a single invocation of `fn`, fired `ms` after the last call.
export function coalesce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  ms: number,
): (...args: Args) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Args) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn(...args)
    }, ms)
  }
}

// ── types ─────────────────────────────────────────────────────────────────────
export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type CardPatch = {
  template_id?: string | null
  card_upload_key?: string | null
  photo_bg_key?: string | null
  slots?: Partial<{
    eyebrow: string
    couple: string
    invite: string
    date: string
    time: string
    venue: string
    message: string
  }>
  slot_sizes?: Record<string, 's' | 'm' | 'l'>
  is_custom?: boolean
}

// `save()` accepts either a resolved `template_id` directly, or a raw
// `templateSlug` that gets translated via `templateSlugToId` before send.
export type SavePartial = CardPatch & { templateSlug?: string }

export interface AutosaveController {
  save: (partial: SavePartial) => void
  getStatus: () => AutosaveStatus
  getSavedAt: () => Date | null
  subscribe: (listener: () => void) => () => void
}

type FetchLike = typeof fetch

// ── pure controller ──────────────────────────────────────────────────────────
// Framework-free autosave state machine. Kept separate from the React hook so
// it can be unit-tested with plain fake timers, with no DOM/jsdom dependency.
export function createAutosaveController(
  eventId: string,
  templateSlugToId?: Record<string, string>,
  opts?: { debounceMs?: number; fetchImpl?: FetchLike },
): AutosaveController {
  const debounceMs = opts?.debounceMs ?? 800
  const fetchImpl = opts?.fetchImpl ?? fetch

  let status: AutosaveStatus = 'idle'
  let savedAt: Date | null = null
  let pending: CardPatch = {}
  const listeners = new Set<() => void>()

  function notify(): void {
    for (const l of listeners) l()
  }

  function setStatus(next: AutosaveStatus): void {
    status = next
    notify()
  }

  async function flush(): Promise<void> {
    const payload = pending
    if (Object.keys(payload).length === 0) return
    setStatus('saving')
    try {
      const res = await fetchImpl(`/api/events/${eventId}/invitation-card`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      // Clear only the keys we just sent — a save() that landed while this
      // request was in flight has already merged newer values into `pending`.
      for (const key of Object.keys(payload) as (keyof CardPatch)[]) {
        if (pending[key] === payload[key]) delete pending[key]
      }
      savedAt = new Date()
      setStatus('saved')
    } catch {
      // Leave `pending` populated so the next save() retries it merged in.
      setStatus('error')
    }
  }

  const coalescedFlush = coalesce(() => { void flush() }, debounceMs)

  function save(partial: SavePartial): void {
    const { templateSlug, ...rest } = partial
    const resolved: CardPatch = { ...rest }
    if (templateSlug !== undefined) {
      resolved.template_id = templateSlugToId?.[templateSlug] ?? null
    }
    // Merge only the fields actually provided. Injecting empty `slots`/
    // `slot_sizes` on every call would ship them in unrelated saves — and
    // because the server does a full-column replace, a text-only edit would
    // wipe previously-saved sizes.
    const next: CardPatch = { ...pending, ...resolved }
    if (resolved.slots) next.slots = { ...pending.slots, ...resolved.slots }
    if (resolved.slot_sizes) next.slot_sizes = { ...pending.slot_sizes, ...resolved.slot_sizes }
    pending = next
    coalescedFlush()
  }

  return {
    save,
    getStatus: () => status,
    getSavedAt: () => savedAt,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

// ── React hook ────────────────────────────────────────────────────────────────
export interface UseAutosaveCardResult {
  save: (partial: SavePartial) => void
  status: AutosaveStatus
  savedAt: Date | null
}

export function useAutosaveCard(
  eventId: string,
  templateSlugToId?: Record<string, string>,
): UseAutosaveCardResult {
  const [controller] = useState<AutosaveController>(() =>
    createAutosaveController(eventId, templateSlugToId)
  )

  const status = useSyncExternalStore(controller.subscribe, controller.getStatus, controller.getStatus)
  const savedAt = useSyncExternalStore(controller.subscribe, controller.getSavedAt, controller.getSavedAt)

  return {
    save: controller.save,
    status,
    savedAt,
  }
}
