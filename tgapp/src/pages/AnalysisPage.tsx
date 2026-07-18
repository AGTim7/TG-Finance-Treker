import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { RefreshCw, Scale } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'

import { getAnalytics, getAnalyticsOverview } from '@/api/analytics'
import { getApiErrorMessage, TelegramAuthorizationError } from '@/api/client'
import { getWallets } from '@/api/wallets'
import type {
  AnalyticsCategory,
  AnalyticsOverviewData,
  TransactionType,
} from '@/api/types'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import WalletSelector from '@/components/WalletSelector'
import { formatMoney } from '@/lib/format'
import { getPeriodRange } from '@/lib/period'
import { triggerHaptic } from '@/utils/triggerHaptic'

type AnalysisMode = TransactionType | 'OVERVIEW'

const modeOptions: Array<{ value: AnalysisMode; label: string }> = [
  { value: 'EXPENSE', label: 'Расходы' },
  { value: 'INCOME', label: 'Доходы' },
  { value: 'OVERVIEW', label: 'Вся аналитика' },
]

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function operationLabel(value: number) {
  const mod100 = value % 100
  const mod10 = value % 10
  if (mod100 >= 11 && mod100 <= 14) return 'операций'
  if (mod10 === 1) return 'операция'
  if (mod10 >= 2 && mod10 <= 4) return 'операции'
  return 'операций'
}

function QueryError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-tg-destructive-text/8 px-3 py-2.5 text-sm text-tg-destructive-text">
      <span>{getApiErrorMessage(error)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Повторить загрузку"
        aria-label="Повторить загрузку"
        onClick={onRetry}
      >
        <RefreshCw />
      </Button>
    </div>
  )
}

function CategoryChart({
  items,
  total,
  monthLabel,
}: {
  items: AnalyticsCategory[]
  total: string
  monthLabel: string
}) {
  const data = items.map((item) => ({
    name: item.category.name,
    emoji: item.category.emoji,
    amount: Number(item.amount),
    color: item.category.color,
  }))

  return (
    <div className="relative h-72 min-h-0 w-full min-w-0 animate-chart-enter">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 288 }}
      >
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={112}
            paddingAngle={2}
            cornerRadius={5}
            minAngle={6}
            stroke="var(--color-tg-section-bg)"
            strokeWidth={3}
            isAnimationActive
            animationBegin={80}
            animationDuration={850}
            animationEasing="ease-out"
          >
            {data.map((item) => <Cell key={item.name} fill={item.color} />)}
            <LabelList
              dataKey="emoji"
              position="inside"
              fill="var(--color-tg-text)"
              style={{ fontSize: 18 }}
            />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-20 text-center">
        <span className="max-w-full truncate text-xs font-semibold text-tg-hint">{monthLabel}</span>
        <span className="mt-1 max-w-full text-lg font-bold tabular-nums">{formatMoney(total)} ₽</span>
      </div>
    </div>
  )
}

function CategoryRow({ item, index }: { item: AnalyticsCategory; index: number }) {
  return (
    <div
      className="animate-list-in py-3.5 opacity-0"
      style={{ animationDelay: `${Math.min(index * 45, 400)}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm shadow-black/5 transition-transform duration-200 active:scale-90"
            style={{ backgroundColor: `${item.category.color}1F` }}
          >
            {item.category.emoji}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold">{item.category.name}</p>
            <p className="text-xs text-tg-subtitle-text">
              {item.transactionCount} {operationLabel(item.transactionCount)}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold tabular-nums">{formatMoney(item.amount)} ₽</p>
          <p className="text-xs font-medium text-tg-hint">{item.percentage}%</p>
        </div>
      </div>
      <div className="ml-15 mt-2 h-1.5 overflow-hidden rounded-full bg-tg-secondary-bg">
        <div
          className="animate-bar-grow h-full origin-left rounded-full"
          style={{
            width: `${item.percentage}%`,
            backgroundColor: item.category.color,
            animationDelay: `${180 + index * 55}ms`,
          }}
        />
      </div>
    </div>
  )
}

function CategoryAnalytics({
  type,
  data,
  isLoading,
}: {
  type: TransactionType
  data: Awaited<ReturnType<typeof getAnalytics>> | undefined
  isLoading: boolean
}) {
  const isExpense = type === 'EXPENSE'
  const monthLabel = getPeriodRange('current-month').shortLabel

  return (
    <>
      <section className="mt-4 rounded-2xl border border-tg-hint/10 bg-tg-section-bg px-3 pb-4 pt-4 shadow-sm shadow-black/[0.03]">
        <div className="px-1">
          <p className="text-xs font-medium text-tg-hint">
            {isExpense ? 'Всего расходов' : 'Всего доходов'}
          </p>
          {isLoading ? (
            <Skeleton className="mt-1 h-8 w-36 bg-tg-secondary-bg" />
          ) : (
            <p className="text-2xl font-bold tabular-nums">{formatMoney(data?.total ?? 0)} ₽</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-72 items-center justify-center">
            <Skeleton className="size-52 rounded-full bg-tg-secondary-bg" />
          </div>
        ) : data && data.categories.length > 0 ? (
          <CategoryChart
            key={type}
            items={data.categories}
            total={data.total}
            monthLabel={monthLabel}
          />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-tg-secondary-bg text-2xl">
              {isExpense ? '📊' : '💸'}
            </div>
            <p className="font-bold">Пока нечего анализировать</p>
            <p className="mt-1 max-w-64 text-sm text-tg-subtitle-text">
              Добавьте {isExpense ? 'расходы' : 'доходы'} в этом месяце.
            </p>
          </div>
        )}

        {!isLoading && data && data.transactionCount > 0 && (
          <p className="-mt-2 text-center text-xs text-tg-hint">
            {data.transactionCount} {operationLabel(data.transactionCount)}
          </p>
        )}
      </section>

      {!isLoading && data && data.categories.length > 0 && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3 border-b border-tg-hint/10 pb-2">
            <h2 className="text-lg font-bold">Топ {isExpense ? 'расходов' : 'доходов'}</h2>
            <span className="text-xs text-tg-hint">{monthLabel}</span>
          </div>
          <div>
            {data.categories.map((item, index) => (
              <CategoryRow key={item.category.id} item={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

function OverviewChart({ data }: { data: AnalyticsOverviewData }) {
  const chartData = data.months.map((item, index) => ({
    label: capitalize(format(new Date(item.month), 'LLL', { locale: ru })),
    income: Number(item.income),
    expense: Number(item.expense),
    isCurrent: index === data.months.length - 1,
  }))

  return (
    <div className="mt-5 h-64 min-h-0 w-full min-w-0 animate-chart-enter">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        initialDimension={{ width: 320, height: 256 }}
      >
        <BarChart data={chartData} margin={{ top: 8, right: 2, bottom: 0, left: 2 }} barGap={3}>
          <YAxis hide domain={[0, 'dataMax']} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={{ fill: 'var(--color-tg-hint)', fontSize: 11 }}
          />
          <Bar
            dataKey="expense"
            radius={[5, 5, 5, 5]}
            maxBarSize={18}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((item) => (
              <Cell
                key={`expense-${item.label}`}
                fill={item.isCurrent ? '#f43f5e' : 'var(--color-tg-hint)'}
                fillOpacity={item.isCurrent ? 1 : 0.18}
              />
            ))}
          </Bar>
          <Bar
            dataKey="income"
            radius={[5, 5, 5, 5]}
            maxBarSize={18}
            isAnimationActive
            animationDuration={900}
            animationEasing="ease-out"
          >
            {chartData.map((item) => (
              <Cell
                key={`income-${item.label}`}
                fill={item.isCurrent ? '#10b981' : 'var(--color-tg-hint)'}
                fillOpacity={item.isCurrent ? 1 : 0.18}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function OverviewAnalytics({ data, isLoading }: {
  data: AnalyticsOverviewData | undefined
  isLoading: boolean
}) {
  const balance = Number(data?.balance ?? 0)

  return (
    <div className="animate-page-enter mt-4">
      <section className="rounded-2xl bg-tg-secondary-bg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-28 bg-tg-hint/10" />
            ) : (
              <p className="whitespace-nowrap text-xl font-bold tabular-nums">{formatMoney(data?.totalExpense ?? 0)} ₽</p>
            )}
            <p className="mt-1 text-sm text-tg-subtitle-text">Расходы</p>
          </div>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-28 bg-tg-hint/10" />
            ) : (
              <p className="whitespace-nowrap text-xl font-bold tabular-nums">{formatMoney(data?.totalIncome ?? 0)} ₽</p>
            )}
            <p className="mt-1 text-sm text-tg-subtitle-text">Доходы</p>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="mt-5 h-64 w-full bg-tg-hint/10" />
        ) : data ? (
          <OverviewChart data={data} />
        ) : null}
      </section>

      <section className="mt-4 flex items-center gap-3 px-1">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-tg-secondary-bg">
          <Scale className="size-5" />
        </div>
        <div>
          <p className="text-sm text-tg-subtitle-text">Баланс за 6 месяцев</p>
          {isLoading ? (
            <Skeleton className="mt-1 h-7 w-28 bg-tg-secondary-bg" />
          ) : (
            <p className={`text-xl font-bold tabular-nums ${
              balance > 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : balance < 0
                  ? 'text-tg-destructive-text'
                  : 'text-tg-text'
            }`}>
              {balance > 0 ? '+' : balance < 0 ? '−' : ''}{formatMoney(Math.abs(balance))} ₽
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

export default function AnalysisPage() {
  const [mode, setMode] = useState<AnalysisMode>('EXPENSE')
  const [walletId, setWalletId] = useState<string>()
  const currentMonth = useMemo(() => getPeriodRange('current-month'), [])
  const categoryType: TransactionType = mode === 'INCOME' ? 'INCOME' : 'EXPENSE'

  const categoryQuery = useQuery({
    queryKey: ['analytics', categoryType, 'current-month', walletId],
    queryFn: () => getAnalytics({
      type: categoryType,
      walletId,
      from: currentMonth.from,
      to: currentMonth.to,
    }),
    enabled: mode !== 'OVERVIEW',
    retry: (failureCount, error) => (
      !(error instanceof TelegramAuthorizationError) && failureCount < 1
    ),
  })

  const overviewQuery = useQuery({
    queryKey: ['analytics-overview', walletId],
    queryFn: () => getAnalyticsOverview(walletId),
    enabled: mode === 'OVERVIEW',
    retry: (failureCount, error) => (
      !(error instanceof TelegramAuthorizationError) && failureCount < 1
    ),
  })

  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
    staleTime: 60_000,
  })

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-28 pt-5 text-tg-text select-none">
      <header className="animate-page-enter">
        <h1 className="text-2xl font-bold">Аналитика</h1>
      </header>

      <div className="mt-3">
        <WalletSelector
          wallets={walletsQuery.data?.items ?? []}
          value={walletId}
          onChange={setWalletId}
        />
      </div>

      <div className="sticky top-0 z-20 -mx-4 mt-2 bg-tg-bg/95 px-4 py-2 backdrop-blur-md">
        <div className="grid grid-cols-[0.82fr_0.82fr_1.3fr] rounded-lg bg-tg-secondary-bg p-1">
          {modeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={mode === option.value}
              onClick={() => {
                triggerHaptic('selection')
                setMode(option.value)
              }}
              className={`h-9 min-w-0 rounded-md px-1 text-xs font-semibold transition-all duration-200 ${
                mode === option.value
                  ? 'bg-tg-text text-tg-bg shadow-sm'
                  : 'text-tg-hint'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {mode !== 'OVERVIEW' && categoryQuery.isError && (
        <QueryError error={categoryQuery.error} onRetry={() => void categoryQuery.refetch()} />
      )}
      {mode === 'OVERVIEW' && overviewQuery.isError && (
        <QueryError error={overviewQuery.error} onRetry={() => void overviewQuery.refetch()} />
      )}

      {mode === 'OVERVIEW' ? (
        <OverviewAnalytics data={overviewQuery.data} isLoading={overviewQuery.isLoading} />
      ) : (
        <CategoryAnalytics
          type={categoryType}
          data={categoryQuery.data}
          isLoading={categoryQuery.isLoading}
        />
      )}
    </div>
  )
}
