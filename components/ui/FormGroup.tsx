import { ReactNode } from 'react'

interface FormGroupProps {
  id: string
  label: string
  error?: string
  helper?: string
  full?: boolean
  children: ReactNode
}

export function FormGroup({ id, label, error, helper, full, children }: FormGroupProps) {
  return (
    <div className={`form-group${full ? ' is-full' : ''}`}>
      <label className="form-label" htmlFor={id}>{label}</label>
      {children}
      {error && <p className="form-error" role="alert">{error}</p>}
      {helper && !error && <p className="form-helper">{helper}</p>}
    </div>
  )
}
