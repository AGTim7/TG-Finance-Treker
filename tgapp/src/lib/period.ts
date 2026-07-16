import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export type PeriodKey = 'current-month' | 'previous-month' | 'all-time'

export const periodOptions: Array<{ value: PeriodKey; label: string }> = [
  { value: 'current-month', label: 'Этот месяц' },
  { value: 'previous-month', label: 'Прошлый месяц' },
  { value: 'all-time', label: 'Все время' },
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function getPeriodRange(period: PeriodKey, now = new Date()) {
  if (period === 'all-time') {
    return { from: undefined, to: undefined, label: 'все время', shortLabel: 'Все время' }
  }

  const monthOffset = period === 'previous-month' ? -1 : 0
  const fromDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
  const toDate = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 1)
  const monthLabel = format(fromDate, 'LLLL', { locale: ru })

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    label: monthLabel,
    shortLabel: capitalize(monthLabel),
  }
}
