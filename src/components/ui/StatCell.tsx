import { MicroLabel } from './MicroLabel'

interface StatCellProps {
  label: string
  value: string | number
  highlight?: boolean
  border?: boolean
}

export function StatCell({ label, value, highlight = false, border = true }: StatCellProps) {
  return (
    <div className={`flex-1 p-6 ${border ? 'border-r border-hairline border-ks-rule last:border-r-0' : ''}`}>
      <MicroLabel color="silver" className="block mb-1">{label}</MicroLabel>
      <p className={`font-display font-bold tracking-tight ${highlight ? 'text-[22px] text-ks-lava' : 'text-[14px] text-ks-ink'}`}>
        {value}
      </p>
    </div>
  )
}
