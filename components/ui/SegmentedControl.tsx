'use client'
import { ReactNode } from 'react'

interface SegOption {
  value: string
  label: ReactNode
}

interface SegmentedControlProps {
  options: SegOption[]
  value: string
  onChange: (value: string) => void
  fill?: boolean
  className?: string
}

export function SegmentedControl({ options, value, onChange, fill = false, className = '' }: SegmentedControlProps) {
  return (
    <div
      className={`seg${fill ? ' seg--fill' : ''} ${className}`.trim()}
      role="radiogroup"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="radio"
          aria-checked={value === opt.value}
          className={`seg-item${value === opt.value ? ' is-active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {typeof opt.label === 'string' ? <span>{opt.label}</span> : opt.label}
        </button>
      ))}
    </div>
  )
}
