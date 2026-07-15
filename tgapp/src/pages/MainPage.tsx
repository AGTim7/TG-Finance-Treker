import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'

import ExpensesTopCard from '@/components/ExpensesTopCard'
import RecentTransactionsCard from '@/components/RecentTransactionsCard'
import TransactionDialog from '@/components/TransactionDialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboard } from '@/api/dashboard'
import { getApiErrorMessage, TelegramAuthorizationError } from '@/api/client'
import { formatMoney } from '@/lib/format'

export default function MainPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    retry: (failureCount, error) => (
      !(error instanceof TelegramAuthorizationError) && failureCount < 1
    ),
  })

  return (
    <div className="min-h-screen w-full pb-24 bg-tg-bg text-tg-text flex flex-col px-4 pt-4 gap-4 select-none font-sans">
      <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
        <CardContent className="p-5 flex flex-col gap-1">
          <span className="text-sm text-tg-subtitle-text font-medium">
            Общий баланс
          </span>
          {dashboardQuery.isLoading ? (
            <Skeleton className="h-11 w-52 bg-tg-secondary-bg" />
          ) : (
            <div className="text-4xl font-bold flex items-baseline gap-1 tabular-nums">
              <span className="text-3xl font-semibold">₽</span>
              <span>{formatMoney(dashboardQuery.data?.balance ?? '0')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {dashboardQuery.isError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-xl border border-tg-destructive-text/20 bg-tg-destructive-text/5 px-3 py-2.5"
        >
          <p className="text-xs leading-5 text-tg-destructive-text">
            {getApiErrorMessage(dashboardQuery.error)}
          </p>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            title="Повторить загрузку"
            aria-label="Повторить загрузку"
            onClick={() => void dashboardQuery.refetch()}
            className="shrink-0 text-tg-destructive-text"
          >
            <RefreshCw />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <TransactionDialog type="income" />
        <TransactionDialog type="expense" />
      </div>

      <RecentTransactionsCard
        transactions={dashboardQuery.data?.recentTransactions ?? []}
        isLoading={dashboardQuery.isLoading}
      />
      <ExpensesTopCard
        items={dashboardQuery.data?.topExpenseCategories ?? []}
        periodFrom={dashboardQuery.data?.period.from}
        isLoading={dashboardQuery.isLoading}
      />
    </div>
  )
}
