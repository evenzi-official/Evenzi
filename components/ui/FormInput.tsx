import { InputHTMLAttributes } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  prefix?: string
  suffix?: string
}

export function FormInput({ prefix, suffix, className = '', ...rest }: FormInputProps) {
  if (prefix || suffix) {
    return (
      <div className="form-input form-input-group">
        {prefix && <span className="form-input-prefix" aria-hidden="true">{prefix}</span>}
        <input className={`form-input-field ${className}`.trim()} {...rest} />
        {suffix && <span className="form-input-suffix" aria-hidden="true">{suffix}</span>}
      </div>
    )
  }
  return <input className={`form-input ${className}`.trim()} {...rest} />
}
