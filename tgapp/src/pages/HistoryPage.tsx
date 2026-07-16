
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { format, isToday, isYesterday } from 'date-fns'
import { ru } from 'date-fns/locale'
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'

import { getAnalytics } from '@/api/analytics'
import { getApiErrorMessage, TelegramAuthorizationError } from '@/api/client'
import { getTransactions } from '@/api/transactions'
import type { AnalyticsCategory, Transaction, TransactionType } from '@/api/types'
import PeriodSelect from '@/components/PeriodSelect'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatMoney } from '@/lib/format'
import { getPeriodRange, type PeriodKey } from '@/lib/period'
import { triggerHaptic } from '@/utils/triggerHaptic'

type HistoryFilter = 'ALL' | TransactionType

const historyFilters: Array<{ value: HistoryFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'EXPENSE', label: 'Расходы' },
  { value: 'INCOME', label: 'Доходы' },
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function groupTitle(value: string) {
  const date = new Date(value)
  if (isToday(date)) return `Сегодня, ${format(date, 'd MMMM', { locale: ru })}`
  if (isYesterday(date)) return `Вчера, ${format(date, 'd MMMM', { locale: ru })}`
  return capitalize(format(date, 'EEEE, d MMMM', { locale: ru }))
}

function operationLabel(value: number) {
  const mod100 = value % 100
  const mod10 = value % 10
  if (mod100 >= 11 && mod100 <= 14) return 'операций'
  if (mod10 === 1) return 'операция'
  if (mod10 >= 2 && mod10 <= 4) return 'операции'
  return 'операций'
}

function HistorySummary({
  income,
  expense,
  filter,
  periodLabel,
  isLoading,
  categories,
  categoryTotal,
}: {
  income: number
  expense: number
  filter: HistoryFilter
  periodLabel: string
  isLoading: boolean
  categories: AnalyticsCategory[]
  categoryTotal?: number
}) {
  const turnover = income + expense
  const incomePercentage = turnover > 0 ? (income / turnover) * 100 : 0
  const isCategorySummary = filter !== 'ALL'
  const selectedAmount = isCategorySummary
    ? categoryTotal ?? (filter === 'INCOME' ? income : expense)
    : turnover
  const title = filter === 'INCOME'
    ? `Доходы за ${periodLabel}`
    : filter === 'EXPENSE'
      ? `Расходы за ${periodLabel}`
      : `Оборот за ${periodLabel}`

  return (
    <section className="animate-page-enter rounded-2xl border border-tg-hint/10 bg-tg-section-bg p-5 shadow-sm shadow-black/[0.03]">
      <p className="text-sm font-medium text-tg-subtitle-text">{title}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-10 w-44 bg-tg-secondary-bg" />
      ) : (
        <p className="mt-1 text-3xl font-bold tabular-nums tracking-normal">
          {formatMoney(selectedAmount)} ₽
        </p>
      )}

      <div
        className="mt-5 h-2.5 overflow-hidden rounded-full bg-tg-secondary-bg"
        aria-label={isCategorySummary ? 'Распределение по категориям' : 'Соотношение доходов и расходов'}
      >
        <div
          key={`${filter}-${periodLabel}`}
          className="animate-summary-fill flex h-full w-full overflow-hidden rounded-full"
        >
          {isCategorySummary ? (
            categories.map((item) => (
              <div
                key={item.category.id}
                className="h-full shrink-0"
                title={`${item.category.name}: ${item.percentage}%`}
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.category.color,
                }}
              />
            ))
          ) : (
            <>
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${incomePercentage}%` }}
              />
              <div
                className="h-full bg-rose-500"
                style={{ width: `${turnover > 0 ? 100 - incomePercentage : 0}%` }}
              />
            </>
          )}
        </div>
      </div>

      {!isCategorySummary && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownLeft className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-tg-hint">Доходы</p>
              <p className="truncate text-sm font-bold tabular-nums">{formatMoney(income)} ₽</p>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-tg-hint">Расходы</p>
              <p className="truncate text-sm font-bold tabular-nums">{formatMoney(expense)} ₽</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function TransactionRow({ transaction, index }: { transaction: Transaction; index: number }) {
  const isIncome = transaction.category.type === 'INCOME'

  return (
    <div
      className="animate-list-in flex items-center justify-between gap-3 py-3 opacity-0"
      style={{ animationDelay: `${Math.min(index * 35, 350)}ms` }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-[22px] shadow-sm shadow-black/5 transition-transform duration-200 active:scale-90"
          style={{ backgroundColor: `${transaction.category.color}1F` }}
        >
          {transaction.category.emoji}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">
            {transaction.description || transaction.category.name}
          </p>
          <p className="truncate text-xs text-tg-subtitle-text">
            {transaction.category.name} · {format(new Date(transaction.date), 'HH:mm')}
          </p>
        </div>
      </div>
      <p className={`shrink-0 text-sm font-bold tabular-nums ${
        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-tg-text'
      }`}>
        {isIncome ? '+' : '−'}{formatMoney(transaction.amount)} ₽
      </p>
    </div>
  )
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<HistoryFilter>('ALL')
  const [period, setPeriod] = useState<PeriodKey>('current-month')
  const range = useMemo(() => getPeriodRange(period), [period])
  const selectedType: TransactionType = filter === 'INCOME' ? 'INCOME' : 'EXPENSE'

  const transactionsQuery = useInfiniteQuery({
    queryKey: ['transactions', filter, period],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => getTransactions({
      page: pageParam,
      limit: 20,
      type: filter === 'ALL' ? undefined : filter,
      from: range.from,
      to: range.to,
    }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    retry: (failureCount, error) => (
      !(error instanceof TelegramAuthorizationError) && failureCount < 1
    ),
  })

  const categorySummaryQuery = useQuery({
    queryKey: ['analytics', selectedType, period],
    queryFn: () => getAnalytics({
      type: selectedType,
      from: range.from,
      to: range.to,
    }),
    enabled: filter !== 'ALL',
    retry: (failureCount, error) => (
      !(error instanceof TelegramAuthorizationError) && failureCount < 1
    ),
  })

  const transactions = useMemo(
    () => transactionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [transactionsQuery.data],
  )
  const summary = transactionsQuery.data?.pages[0]?.summary
  const total = transactionsQuery.data?.pages[0]?.total ?? 0
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>()
    transactions.forEach((transaction) => {
      const key = format(new Date(transaction.date), 'yyyy-MM-dd')
      groups.set(key, [...(groups.get(key) ?? []), transaction])
    })
    return Array.from(groups.values())
  }, [transactions])

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-28 pt-5 text-tg-text select-none">
      <header className="animate-page-enter mb-4">
        <h1 className="text-2xl font-bold">История</h1>
      </header>

      <HistorySummary
        income={Number(summary?.income ?? 0)}
        expense={Number(summary?.expense ?? 0)}
        filter={filter}
        periodLabel={range.label}
        isLoading={transactionsQuery.isLoading || (filter !== 'ALL' && categorySummaryQuery.isLoading)}
        categories={categorySummaryQuery.data?.categories ?? []}
        categoryTotal={filter === 'ALL' ? undefined : Number(categorySummaryQuery.data?.total ?? 0)}
      />

      <div className="sticky top-0 z-20 -mx-4 mt-3 bg-tg-bg/95 px-4 py-2 backdrop-blur-md">
        <div className="flex gap-2">
          <div className="grid min-w-0 flex-[1.55] grid-cols-3 rounded-lg bg-tg-secondary-bg p-1">
            {historyFilters.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={filter === item.value}
                onClick={() => {
                  triggerHaptic('selection')
                  setFilter(item.value)
                }}
                className={`h-8 rounded-md px-1 text-xs font-semibold transition-all duration-200 ${
                  filter === item.value
                    ? 'bg-tg-section-bg text-tg-text shadow-sm'
                    : 'text-tg-hint'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <PeriodSelect value={period} onChange={setPeriod} />
        </div>
      </div>

      {(transactionsQuery.isError || (filter !== 'ALL' && categorySummaryQuery.isError)) && (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-tg-destructive-text/8 px-3 py-2.5 text-sm text-tg-destructive-text">
          <span>{getApiErrorMessage(transactionsQuery.error ?? categorySummaryQuery.error)}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            title="Повторить загрузку"
            aria-label="Повторить загрузку"
            onClick={() => {
              void transactionsQuery.refetch()
              if (filter !== 'ALL') void categorySummaryQuery.refetch()
            }}
          >
            <RefreshCw />
          </Button>
        </div>
      )}

      {transactionsQuery.isLoading && (
        <div className="mt-5 space-y-5">
          {Array.from({ length: 3 }).map((_, groupIndex) => (
            <div key={groupIndex}>
              <Skeleton className="mb-2 h-5 w-36 bg-tg-secondary-bg" />
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex items-center gap-3 py-3">
                  <Skeleton className="size-11 rounded-xl bg-tg-secondary-bg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-tg-secondary-bg" />
                    <Skeleton className="h-3 w-24 bg-tg-secondary-bg" />
                  </div>
                  <Skeleton className="h-4 w-20 bg-tg-secondary-bg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!transactionsQuery.isLoading && !transactionsQuery.isError && transactions.length === 0 && (
        <div className="animate-page-enter flex flex-col items-center py-16 text-center">
          <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-tg-secondary-bg text-2xl">🧾</div>
          <h2 className="font-bold">Операций нет</h2>
          <p className="mt-1 max-w-64 text-sm text-tg-subtitle-text">
            Попробуйте выбрать другой период или добавить новую транзакцию.
          </p>
        </div>
      )}

      {!transactionsQuery.isLoading && groupedTransactions.map((group, groupIndex) => (
        <section key={group[0].date} className="mt-5">
          <div className="flex items-baseline justify-between gap-3 border-b border-tg-hint/10 pb-1.5">
            <h2 className="text-base font-bold">{groupTitle(group[0].date)}</h2>
            <span className="text-[11px] text-tg-hint">
              {group.length} {operationLabel(group.length)}
            </span>
          </div>
          <div>
            {group.map((transaction, rowIndex) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                index={groupIndex * 3 + rowIndex}
              />
            ))}
          </div>
        </section>
      ))}

      {transactionsQuery.hasNextPage && (
        <Button
          type="button"
          variant="secondary"
          className="mt-5 h-11 w-full"
          disabled={transactionsQuery.isFetchingNextPage}
          onClick={() => {
            triggerHaptic('selection')
            void transactionsQuery.fetchNextPage()
          }}
        >
          {transactionsQuery.isFetchingNextPage ? 'Загрузка…' : `Показать ещё · ${total - transactions.length}`}
        </Button>
      )}
    </div>
  )
}
