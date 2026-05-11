import { MicroLabel } from './MicroLabel'

interface SectionHeaderProps {
  micro: string
  title: string
  className?: string
}

export function SectionHeader({ micro, title, className = '' }: SectionHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      <MicroLabel className="block mb-1">{micro}</MicroLabel>
      <h3 className="font-display text-[16px] font-bold text-ks-ink uppercase tracking-[0.02em] border-b border-ks-rule pb-2">
        {title}
      </h3>
    </div>
  )
}
