type TagVariant = 'orange' | 'void' | 'outline' | 'tint' | 'tech-active' | 'tech-inactive' | 'status'

interface TagProps {
  children: React.ReactNode
  variant?: TagVariant
  className?: string
}

const variants: Record<TagVariant, string> = {
  orange:       'bg-ks-lava text-white border border-ks-lava',
  void:         'bg-ks-void text-white border border-ks-void',
  outline:      'bg-transparent text-ks-ink border border-ks-ink border-hairline',
  tint:         'bg-ks-lava-tint text-ks-lava-dark border border-transparent',
  'tech-active':   'bg-ks-lava text-white border border-ks-lava',
  'tech-inactive': 'bg-transparent text-ks-void-grid border border-ks-void-grid',
  status:       'bg-ks-pebble text-ks-silver border border-transparent',
}

export function Tag({ children, variant = 'outline', className = '' }: TagProps) {
  return (
    <span
      className={`inline-block font-body font-medium text-[9px] uppercase tracking-[0.1em] px-2.5 py-1 rounded-ks ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
