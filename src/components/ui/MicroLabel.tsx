interface MicroLabelProps {
  children: React.ReactNode
  color?: 'orange' | 'silver'
  className?: string
}

export function MicroLabel({ children, color = 'orange', className = '' }: MicroLabelProps) {
  return (
    <span
      className={`font-body font-medium text-[9px] uppercase tracking-[0.15em] ${
        color === 'orange' ? 'text-ks-lava' : 'text-ks-silver'
      } ${className}`}
    >
      {children}
    </span>
  )
}
