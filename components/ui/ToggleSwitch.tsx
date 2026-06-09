'use client'
import { InputHTMLAttributes } from 'react'

interface ToggleSwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  id: string
}

export function ToggleSwitch({ label, id, className = '', ...rest }: ToggleSwitchProps) {
  return (
    <label htmlFor={id} className={`toggle-switch ${className}`.trim()}>
      <input id={id} type="checkbox" role="switch" {...rest} />
      <span className="toggle-thumb" aria-hidden="true" />
      {label && <span className="toggle-label">{label}</span>}
    </label>
  )
}
