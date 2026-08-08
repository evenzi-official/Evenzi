'use client'

import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

export type HelpSearchInputProps = {
  value: string
  onChange: (value: string) => void
  onDebouncedChange?: (value: string) => void
  debounceMs?: number
  disabled?: boolean
  placeholder?: string
  helperText?: string
  id?: string
}

/**
 * Search field with optional debounce callback (panel: 300ms).
 * Does not auto-focus — mobile keyboard must not open on panel mount.
 */
export function HelpSearchInput({
  value,
  onChange,
  onDebouncedChange,
  debounceMs = 300,
  disabled = false,
  placeholder = 'Search help articles',
  helperText,
  id: idProp,
}: HelpSearchInputProps): React.ReactElement {
  const autoId = useId()
  const id = idProp ?? autoId
  const [local, setLocal] = useState(value)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const next = e.target.value
    setLocal(next)
    onChange(next)
    if (!onDebouncedChange) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onDebouncedChange(next)
    }, debounceMs)
  }

  function clear(): void {
    setLocal('')
    onChange('')
    onDebouncedChange?.('')
  }

  return (
    <div className="w-full">
      {/* Hint must stay outside .form-input-search — icon uses top:50% of that box. */}
      <div className="form-input-search w-full">
        <span className="material-symbols-outlined form-input-search-icon" aria-hidden="true">
          search
        </span>
        <input
          id={id}
          type="search"
          className="form-input"
          value={local}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          enterKeyHint="search"
          aria-describedby={helperText ? `${id}-help` : undefined}
        />
        {local ? (
          <button
            type="button"
            className="form-input-search-clear"
            aria-label="Clear search"
            onClick={clear}
            disabled={disabled}
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        ) : null}
      </div>
      {helperText ? (
        <p id={`${id}-help`} className="form-hint m-0 mt-1">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}
