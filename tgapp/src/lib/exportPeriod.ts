import { addDays, addMonths, format, startOfMonth, startOfYear, subMonths } from 'date-fns'
import { ru } from 'date-fns/locale'

import type { TransactionExportInput } from '@/api/exports'

export type ExportPeriodKey =
  | 'current-month'
  | 'previous-month'
  | 'three-months'
  | 'current-year'
  | 'all-time'
  | 'custom'

export const exportPeriodOptions: Array<{ value: ExportPeriodKey; label: string }> = [
  { value: 'current-month', label: 'Этот месяц' },
  { value: 'previous-month', label: 'Прошлый' },
  { value: 'three-months', label: '3 месяца' },
  { value: 'current-year', label: 'Этот год' },
  { value: 'all-time', label: 'Всё время' },
  { value: 'custom', label: 'Свои даты' },
]

export function toDateInputValue(value: Date) {
  return format(value, 'yyyy-MM-dd')
}

function dateAtLocalMidnight(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatRange(from: Date, toExclusive: Date) {
  const toInclusive = addDays(toExclusive, -1)
  const sameYear = from.getFullYear() === toInclusive.getFullYear()
  const fromPattern = sameYear ? 'd MMMM' : 'd MMMM yyyy'
  return capitalize(`${format(from, fromPattern, { locale: ru })} — ${format(toInclusive, 'd MMMM yyyy', { locale: ru })}`)
}

export function getExportPeriod(
  period: ExportPeriodKey,
  customFrom: string,
  customTo: string,
  now = new Date(),
): { input: TransactionExportInput; label: string; isValid: boolean } {
  const timezoneOffsetMinutes = now.getTimezoneOffset()
  if (period === 'all-time') {
    return { input: { timezoneOffsetMinutes }, label: 'Все время', isValid: true }
  }

  let from: Date
  let toExclusive: Date
  if (period === 'custom') {
    if (!customFrom || !customTo) {
      return { input: { timezoneOffsetMinutes }, label: 'Укажите обе даты', isValid: false }
    }
    from = dateAtLocalMidnight(customFrom)
    toExclusive = addDays(dateAtLocalMidnight(customTo), 1)
  } else if (period === 'previous-month') {
    from = startOfMonth(subMonths(now, 1))
    toExclusive = startOfMonth(now)
  } else if (period === 'three-months') {
    from = startOfMonth(subMonths(now, 2))
    toExclusive = startOfMonth(addMonths(now, 1))
  } else if (period === 'current-year') {
    from = startOfYear(now)
    toExclusive = startOfYear(new Date(now.getFullYear() + 1, 0, 1))
  } else {
    from = startOfMonth(now)
    toExclusive = startOfMonth(addMonths(now, 1))
  }

  const isValid = from < toExclusive
  return {
    input: {
      from: from.toISOString(),
      to: toExclusive.toISOString(),
      timezoneOffsetMinutes,
    },
    label: isValid ? formatRange(from, toExclusive) : 'Дата начала должна быть раньше даты окончания',
    isValid,
  }
}
