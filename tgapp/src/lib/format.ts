import { format, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'

const moneyFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatMoney(value: string | number) {
  return moneyFormatter.format(Number(value))
}

export function formatTransactionDate(value: string) {
  const date = new Date(value)
  if (isToday(date)) return 'Сегодня'
  if (isYesterday(date)) return 'Вчера'
  return format(date, 'd MMM', { locale: ru })
}
