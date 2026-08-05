'use client'
import { useState, useRef, useEffect, useCallback } from 'react'

const FALLBACK_FONTS = [
  { name: 'Cormorant Garamond', weight: '400;600;700' },
  { name: 'Playfair Display',   weight: '400;600;700' },
  { name: 'Poppins',            weight: '400;600;700' },
  { name: 'Inter',              weight: '400;600;700' },
  { name: 'Lora',               weight: '400;600;700' },
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
  options?: string[]
  onChange?: (v: string) => void
}

export function FontPicker({ label, value, options, onChange }: Props) {
  const fonts = (options?.length ? options : FALLBACK_FONTS.map((f) => f.name)).map((name) => ({
    name,
    weight: FALLBACK_FONTS.find((f) => f.name === name)?.weight ?? '400;600;700',
  }))
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(value)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const names = options?.length ? options : FALLBACK_FONTS.map((f) => f.name)
    names.forEach((name) => {
      const weight = FALLBACK_FONTS.find((f) => f.name === name)?.weight ?? '400;600;700'
      loadGoogleFont(name, weight)
    })
  }, [options])

  useEffect(() => {
    setCurrent(value)
  }, [value])

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

  const currentFont = fonts.find(f => f.name === current) ?? fonts[0]

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
          {fonts.map(f => (
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
