import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { coalesce, createAutosaveController } from '@/lib/invitations/useAutosaveCard'

describe('coalesce', () => {
  it('fires once after rapid calls settle', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const run = coalesce(fn, 800)
    run(); run(); run()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(800)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  it('resets the timer on each call within the window', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const run = coalesce(fn, 800)
    run()
    vi.advanceTimersByTime(500)
    run() // resets the 800ms window
    vi.advanceTimersByTime(500)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})

describe('createAutosaveController (useAutosaveCard core logic)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts idle and coalesces save() into a single PATCH after 800ms', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const controller = createAutosaveController('event-1', undefined, { fetchImpl })

    expect(controller.getStatus()).toBe('idle')

    controller.save({ slots: { couple: 'A & B' } })
    controller.save({ slots: { venue: 'Beach' } })

    expect(fetchImpl).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(800)

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, init] = fetchImpl.mock.calls[0]
    expect(url).toBe('/api/events/event-1/invitation-card')
    expect(init.method).toBe('PATCH')
    const body = JSON.parse(init.body)
    expect(body.slots).toEqual({ couple: 'A & B', venue: 'Beach' })
    expect(controller.getStatus()).toBe('saved')
    expect(controller.getSavedAt()).toBeInstanceOf(Date)
  })

  it('translates a templateSlug to template_id via templateSlugToId', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const controller = createAutosaveController(
      'event-1',
      { eternal: 'tpl-uuid-123' },
      { fetchImpl },
    )

    controller.save({ templateSlug: 'eternal', is_custom: true })

    await vi.advanceTimersByTimeAsync(800)

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.template_id).toBe('tpl-uuid-123')
    expect(body.is_custom).toBe(true)
    expect(body.templateSlug).toBeUndefined()
  })

  it('sets status to error and keeps the payload pending for retry on failure', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })
    const controller = createAutosaveController('event-1', undefined, { fetchImpl })

    controller.save({ slots: { couple: 'A & B' } })
    await vi.advanceTimersByTimeAsync(800)

    expect(controller.getStatus()).toBe('error')

    fetchImpl.mockResolvedValue({ ok: true })
    controller.save({ slots: { venue: 'Beach' } })
    await vi.advanceTimersByTimeAsync(800)

    expect(fetchImpl).toHaveBeenCalledTimes(2)
    const retriedBody = JSON.parse(fetchImpl.mock.calls[1][1].body)
    expect(retriedBody.slots).toEqual({ couple: 'A & B', venue: 'Beach' })
    expect(controller.getStatus()).toBe('saved')
  })

  it('notifies subscribers on every status change', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const controller = createAutosaveController('event-1', undefined, { fetchImpl })
    const listener = vi.fn()
    const unsubscribe = controller.subscribe(listener)

    controller.save({ slots: { couple: 'A & B' } })
    await vi.advanceTimersByTimeAsync(800)

    // saving -> saved is at least 2 notifications
    expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2)
    unsubscribe()
  })
})
