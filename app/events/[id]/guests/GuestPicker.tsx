'use client'

import { useEffect, useRef, useState } from 'react'

export interface PickerOption {
  value: string
  label: string
  icon?: string
  group?: string
}

interface PickerBaseProps {
  anchorRect: DOMRect
  ariaLabel: string
  title: React.ReactNode
  options: PickerOption[]
  onClose: () => void
}

interface PickerSingleProps extends PickerBaseProps {
  multi?: false
  current: string
  onPick: (value: string) => void
}

interface PickerMultiProps extends PickerBaseProps {
  multi: true
  current: string[]
  onApply: (values: string[]) => void
}

export type GuestPickerProps = PickerSingleProps | PickerMultiProps

export function GuestPicker(props: GuestPickerProps): React.ReactElement {
  const { anchorRect, ariaLabel, title, options, onClose } = props
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [pendingMulti, setPendingMulti] = useState<string[]>(props.multi ? props.current : [])

  useEffect(() => {
    function place(): void {
      if (window.innerWidth < 480 || !panelRef.current) { setPosition(null); return }
      const w = panelRef.current.offsetWidth || 280
      const h = panelRef.current.offsetHeight || 240
      const left = Math.min(Math.max(8, anchorRect.right - w), window.innerWidth - w - 8)
      let top = anchorRect.bottom + 6
      if (top + h > window.innerHeight - 8) top = Math.max(8, anchorRect.top - h - 6)
      setPosition({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRect])

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') { e.preventDefault(); onClose() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  useEffect(() => {
    const first = panelRef.current?.querySelector<HTMLElement>('[aria-checked="true"], .gm-setter-opt')
    first?.focus()
  }, [])

  function toggleMulti(value: string): void {
    setPendingMulti((cur) => (cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]))
  }

  let lastGroup: string | undefined
  const items = options.map((o) => {
    const showGroup = Boolean(o.group) && o.group !== lastGroup
    lastGroup = o.group
    const on = props.multi ? pendingMulti.includes(o.value) : o.value === props.current
    return (
      <div key={o.value}>
        {showGroup && <p className="gm-setter-group">{o.group}</p>}
        <button
          type="button"
          className="gm-setter-opt"
          role={props.multi ? 'menuitemcheckbox' : 'menuitemradio'}
          aria-checked={on}
          onClick={() => { if (props.multi) toggleMulti(o.value); else props.onPick(o.value) }}
        >
          {o.icon && <span aria-hidden="true" className="material-symbols-outlined icon-fill">{o.icon}</span>}
          {o.label}
          <span aria-hidden="true" className="material-symbols-outlined gm-setter-check">check</span>
        </button>
      </div>
    )
  })

  return (
    <>
      <div className="gm-setter-scrim" onClick={onClose} />
      <div
        ref={panelRef}
        className={`gm-setter${props.multi ? ' gm-setter-multi' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        style={position ? { position: 'fixed', top: position.top, left: position.left } : undefined}
      >
        <p className="gm-setter-title">{title}</p>
        <div className="gm-setter-opts" role="menu" aria-label={ariaLabel}>{items}</div>
        {props.multi && (
          <div className="gm-setter-foot">
            <button type="button" className="gm-setter-clear" onClick={() => setPendingMulti([])}>Clear</button>
            <button type="button" className="btn-pill btn-pill-primary gm-setter-apply" onClick={() => props.onApply(pendingMulti)}>Apply</button>
          </div>
        )}
      </div>
    </>
  )
}
