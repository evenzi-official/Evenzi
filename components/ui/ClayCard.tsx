import { HTMLAttributes, ReactNode } from 'react'

interface ClayCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  as?: 'div' | 'article' | 'section' | 'aside'
}

export function ClayCard({ children, as: Tag = 'div', className = '', ...rest }: ClayCardProps) {
  return (
    <Tag className={`clay-card ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  )
}
