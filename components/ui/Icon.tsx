interface IconProps {
  name: string
  fill?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  'aria-hidden'?: boolean | 'true' | 'false'
}

const sizeClass = { sm: 'icon-sm-18', md: '', lg: 'text-2xl' }

export function Icon({ name, fill = false, size = 'md', className = '', ...rest }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined${fill ? ' icon-fill' : ''} ${sizeClass[size]} ${className}`.trim()}
      {...rest}
    >
      {name}
    </span>
  )
}
