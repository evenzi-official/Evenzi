'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const FONTS = [
  { name: 'Cormorant Garamond', weight: '400;600;700' },
  { name: 'Playfair Display',   weight: '400;600;700' },
  { name: 'Poppins',            weight: '400;600;700' },
  { name: 'Inter',              weight: '400;600;700' },
]

function loadGoogleFont(name: string, weight: string) {
  const id = `gf-${name.replace(/\s+/g, '-').toLowerCase()}`
  if (typeof document === 'undefined' || document.getElementById(id)) return
  const link = document.createElement('link')
  link.id   = id
  link.rel  = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, '+')}:wght@${weight}&display=swap`
  document.head.appendChild(link)
}

interface Props {
  label: string
  value: string
  onChange?: (v: string) => void
}

export function FontPicker({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Load all fonts on mount so switching is instant
  useEffect(() => {
    FONTS.forEach(f => loadGoogleFont(f.name, f.weight))
  }, [])

  // Close on outside click
  const handleOutside = useCallback((e: MouseEvent) => {
    if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
  }, [])
  useEffect(() => {
    if (open) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [open, handleOutside])

  function select(name: string) {
    setCurrent(name)
    setOpen(false)
    onChange?.(name)
  }

  const currentFont = FONTS.find(f => f.name === current) ?? FONTS[0]

  return (
    <div className="form-group" ref={wrapRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <button
        type="button"
        className="fp-btn"
        style={{ fontFamily: `'${currentFont.name}', serif` }}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span style={{ flex: 1 }}>{current}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, opacity: 0.6, flexShrink: 0 }}>
          {open ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {open && (
        <ul role="listbox" aria-label={label} className="fp-listbox">
          {FONTS.map(f => (
            <li
              key={f.name}
              role="option"
              aria-selected={f.name === current}
              className={`fp-option${f.name === current ? ' is-selected' : ''}`}
              style={{ fontFamily: `'${f.name}', serif` }}
              onClick={() => select(f.name)}
            >
              <span style={{ flex: 1 }}>{f.name}</span>
              {f.name === current && (
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
