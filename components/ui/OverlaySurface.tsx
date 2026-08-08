'use client'
import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
import { useOverlaySurface } from '@/lib/hooks/useOverlaySurface'

export function OverlaySurface({
  open,
  onClose,
  modal,
  labelledBy,
  id,
  className = '',
  triggerRef,
  children,
}: {
  open: boolean
  onClose: () => void
  modal: boolean
  labelledBy: string
  id: string
  className?: string
  triggerRef?: RefObject<HTMLElement | null>
  children: ReactNode
}): React.ReactElement | null {
  const { containerRef } = useOverlaySurface({ open, onClose, modal, triggerRef })
  const closedByOutsideClick = useRef(false)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current) return
      if (containerRef.current.contains(e.target as Node)) return
      if (triggerRef?.current?.contains(e.target as Node)) return
      closedByOutsideClick.current = true
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open, onClose, containerRef, triggerRef])

  if (!open) return null

  return (
    <div
      ref={containerRef}
      id={id}
      role="dialog"
      aria-modal={modal}
      aria-labelledby={labelledBy}
      className={className}
    >
      {children}
    </div>
  )
}
