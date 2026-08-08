'use client'
import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

/** Exported for unit testing; also used by the trap. */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.getAttribute('tabindex') !== '-1'
  )
}

/**
 * Pure focus-cycling logic, expressed over identifiers so it can be unit
 * tested without a DOM. Returns the id that should receive focus next, or
 * null when there is nothing focusable.
 */
export function nextTrapFocus(
  ids: readonly string[],
  currentId: string,
  backward: boolean
): string | null {
  if (ids.length === 0) return null
  const i = ids.indexOf(currentId)
  if (i === -1) return ids[0]
  const next = backward ? i - 1 : i + 1
  if (next < 0) return ids[ids.length - 1]
  if (next >= ids.length) return ids[0]
  return ids[next]
}

export function useOverlaySurface({
  open,
  onClose,
  modal,
  triggerRef,
}: {
  open: boolean
  onClose: () => void
  modal: boolean
  triggerRef?: RefObject<HTMLElement | null>
}): { containerRef: RefObject<HTMLDivElement | null> } {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Escape closes, in both modal and non-modal presentations.
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !modal || !containerRef.current) return
      const items = getFocusableElements(containerRef.current)
      if (items.length === 0) return
      const active = document.activeElement as HTMLElement | null
      const i = active ? items.indexOf(active) : -1
      const goingBack = e.shiftKey
      if (i === -1) {
        e.preventDefault()
        items[0].focus()
      } else if (goingBack && i === 0) {
        e.preventDefault()
        items[items.length - 1].focus()
      } else if (!goingBack && i === items.length - 1) {
        e.preventDefault()
        items[0].focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, modal])

  // Body scroll lock, modal presentation only.
  useEffect(() => {
    if (!open || !modal) return
    document.body.classList.add('no-scroll')
    return () => document.body.classList.remove('no-scroll')
  }, [open, modal])

  // Focus return to the trigger on close (not on initial mount).
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true
      return
    }
    if (!wasOpenRef.current) return
    wasOpenRef.current = false
    triggerRef?.current?.focus()
  }, [open, triggerRef])

  return { containerRef }
}
