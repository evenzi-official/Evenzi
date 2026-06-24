import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: string
  loading?: boolean
  children: ReactNode
}

const variantClass: Record<Variant, string> = {
  primary:   'btn-pill btn-pill-primary',
  secondary: 'btn-pill btn-pill-secondary',
  danger:    'btn-pill btn-pill-danger',
  ghost:     'btn-pill btn-pill-ghost',
}

const sizeClass: Record<Size, string> = {
  sm:  'btn-pill-sm',
  md:  '',
  lg:  'btn-pill-lg',
}

export function Button({ variant = 'primary', size = 'md', icon, loading, children, className = '', ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={`${variantClass[variant]} ${sizeClass[size]} ${loading ? 'is-loading' : ''} ${className}`.trim()}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {icon && <span aria-hidden="true" className="material-symbols-outlined">{icon}</span>}
      {children}
      <span aria-hidden="true" className="btn-pill-spinner" />
    </button>
  )
}
