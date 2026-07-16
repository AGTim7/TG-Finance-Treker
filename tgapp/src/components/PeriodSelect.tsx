import { CalendarDays, ChevronDown } from 'lucide-react'

import { periodOptions, type PeriodKey } from '@/lib/period'
import { triggerHaptic } from '@/utils/triggerHaptic'

type PeriodSelectProps = {
  value: PeriodKey
  onChange: (value: PeriodKey) => void
}

export default function PeriodSelect({ value, onChange }: PeriodSelectProps) {
  return (
    <label className="relative flex h-10 min-w-0 flex-1 items-center gap-2 rounded-lg bg-tg-secondary-bg px-3 text-sm font-semibold text-tg-text transition-transform active:scale-[0.98]">
      <CalendarDays className="size-4 shrink-0 text-tg-hint" />
      <select
        aria-label="Период"
        value={value}
        onChange={(event) => {
          triggerHaptic('selection')
          onChange(event.target.value as PeriodKey)
        }}
        className="min-w-0 flex-1 appearance-none bg-transparent pr-5 outline-none"
      >
        {periodOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-tg-hint" />
    </label>
  )
}
