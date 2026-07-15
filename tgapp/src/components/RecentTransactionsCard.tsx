import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router'

import type { Transaction } from '@/api/types'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney, formatTransactionDate } from '@/lib/format'
import { triggerHaptic } from '@/utils/triggerHaptic'

type RecentTransactionsCardProps = {
  transactions: Transaction[]
  isLoading: boolean
}

function RecentTransactionsCard({ transactions, isLoading }: RecentTransactionsCardProps) {
  const navigate = useNavigate()

  const openHistory = () => {
    triggerHaptic('selection')
    navigate('/history')
  }

  return (
    <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base">Последние транзакции</h3>
          <button
            type="button"
            onClick={openHistory}
            className="text-xs text-tg-hint flex items-center gap-0.5 font-medium hover:opacity-80"
          >
            Смотреть все <ChevronRight size={14} />
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {isLoading && Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="size-10 shrink-0 rounded-xl bg-tg-secondary-bg" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28 bg-tg-secondary-bg" />
                  <Skeleton className="h-3 w-20 bg-tg-secondary-bg" />
                </div>
              </div>
              <Skeleton className="h-4 w-20 bg-tg-secondary-bg" />
            </div>
          ))}

          {!isLoading && transactions.length === 0 && (
            <p className="py-4 text-center text-sm text-tg-subtitle-text">
              Транзакций пока нет
            </p>
          )}

          {!isLoading && transactions.map((transaction) => {
            const isIncome = transaction.category.type === 'INCOME'

            return (
              <div key={transaction.id} className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl"
                    style={{ backgroundColor: `${transaction.category.color}18` }}
                  >
                    {transaction.category.emoji}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-sm">
                      {transaction.description || transaction.category.name}
                    </span>
                    <span className="truncate text-xs text-tg-subtitle-text">
                      {transaction.category.name}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end">
                  <span className={`font-bold text-sm tabular-nums ${
                    isIncome
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-tg-destructive-text'
                  }`}>
                    {isIncome ? '+' : '−'} {formatMoney(transaction.amount)} ₽
                  </span>
                  <span className="text-[10px] text-tg-hint">
                    {formatTransactionDate(transaction.date)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentTransactionsCard
