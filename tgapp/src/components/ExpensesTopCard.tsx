import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { DashboardExpenseCategory } from '@/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { Progress, ProgressIndicator, ProgressTrack } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/format'
import { triggerHaptic } from '@/utils/triggerHaptic'

type ExpensesTopCardProps = {
  items: DashboardExpenseCategory[]
  periodFrom?: string
  isLoading: boolean
}

function ExpensesTopCard({ items, periodFrom, isLoading }: ExpensesTopCardProps) {
  const navigate = useNavigate()
  const monthLabel = periodFrom
    ? format(new Date(periodFrom), 'LLLL', { locale: ru })
    : ''

  const openAnalysis = () => {
    triggerHaptic('selection')
    navigate('/analysis')
  }

  return (
    <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Топ расходов</h3>
            {monthLabel && (
              <p className="text-[11px] capitalize text-tg-subtitle-text">{monthLabel}</p>
            )}
          </div>
          <button
            type="button"
            onClick={openAnalysis}
            className="text-xs text-tg-hint flex items-center gap-0.5 font-medium hover:opacity-80"
          >
            Смотреть все <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex flex-col gap-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28 bg-tg-secondary-bg" />
                <Skeleton className="h-4 w-24 bg-tg-secondary-bg" />
              </div>
              <Skeleton className="h-1.5 w-full bg-tg-secondary-bg" />
            </div>
          ))}

          {!isLoading && items.length === 0 && (
            <p className="py-4 text-center text-sm text-tg-subtitle-text">
              В этом месяце расходов нет
            </p>
          )}

          {!isLoading && items.map((item) => (
            <div key={item.category.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <div
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-sm"
                    style={{ backgroundColor: `${item.category.color}18` }}
                  >
                    {item.category.emoji}
                  </div>
                  <span className="truncate font-medium">{item.category.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 tabular-nums">
                  <span className="text-xs text-tg-hint">{item.percentage}%</span>
                  <span className="font-bold">{formatMoney(item.amount)} ₽</span>
                </div>
              </div>
              <Progress value={item.percentage} className="w-full">
                <ProgressTrack className="h-1.5 bg-tg-secondary-bg">
                  <ProgressIndicator style={{ backgroundColor: item.category.color }} />
                </ProgressTrack>
              </Progress>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ExpensesTopCard
