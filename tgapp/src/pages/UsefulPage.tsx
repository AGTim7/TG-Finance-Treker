import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, FileSpreadsheet, MessageCircle, Send } from 'lucide-react'

import { getApiErrorMessage } from '@/api/client'
import { exportTransactions } from '@/api/exports'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  exportPeriodOptions,
  getExportPeriod,
  toDateInputValue,
  type ExportPeriodKey,
} from '@/lib/exportPeriod'
import { triggerHaptic, triggerNotificationHaptic } from '@/utils/triggerHaptic'

const BOT_URL = 'https://t.me/financeOneTrackerBot'

function openBotChat() {
  const webApp = window.Telegram?.WebApp
  if (webApp?.openTelegramLink) webApp.openTelegramLink(BOT_URL)
  else window.open(BOT_URL, '_blank', 'noopener,noreferrer')
}

function UsefulPage() {
  const today = useMemo(() => toDateInputValue(new Date()), [])
  const monthStart = useMemo(() => {
    const now = new Date()
    return toDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1))
  }, [])
  const [period, setPeriod] = useState<ExportPeriodKey>('current-month')
  const [customFrom, setCustomFrom] = useState(monthStart)
  const [customTo, setCustomTo] = useState(today)
  const selection = useMemo(
    () => getExportPeriod(period, customFrom, customTo),
    [period, customFrom, customTo],
  )
  const exportMutation = useMutation({
    mutationFn: () => exportTransactions(selection.input),
    onSuccess: () => triggerNotificationHaptic('success'),
    onError: () => triggerNotificationHaptic('error'),
  })

  return (
    <div className="min-h-screen bg-tg-bg px-4 pb-28 pt-5 text-tg-text select-none">
      <header className="animate-page-enter">
        <h1 className="text-2xl font-bold">Полезное</h1>
      </header>

      <section className="animate-page-enter mt-5 overflow-hidden rounded-xl border border-tg-hint/10 bg-tg-section-bg">
        <div className="flex items-center gap-3 border-b border-tg-hint/10 px-4 py-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/12 text-emerald-500">
            <FileSpreadsheet className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold">Экспорт в Excel</h2>
            <p className="mt-0.5 text-xs text-tg-subtitle-text">Финансовый отчёт отправится в чат</p>
          </div>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <span className="mb-2 block text-xs font-semibold text-tg-subtitle-text">Период</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-tg-secondary-bg p-1">
              {exportPeriodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={period === option.value}
                  onClick={() => {
                    triggerHaptic('selection')
                    exportMutation.reset()
                    setPeriod(option.value)
                  }}
                  className={`h-10 min-w-0 rounded-md px-1 text-[11px] font-semibold transition-all ${
                    period === option.value
                      ? 'bg-tg-section-bg text-tg-text shadow-sm'
                      : 'text-tg-hint'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {period === 'custom' && (
            <div className="animate-page-enter grid grid-cols-2 gap-3">
              <label className="min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-tg-subtitle-text">С</span>
                <Input
                  type="date"
                  value={customFrom}
                  max={customTo || today}
                  onChange={(event) => { exportMutation.reset(); setCustomFrom(event.target.value) }}
                  className="h-11 min-w-0 bg-tg-secondary-bg px-2 text-xs"
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1.5 block text-xs font-semibold text-tg-subtitle-text">По</span>
                <Input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  max={today}
                  onChange={(event) => { exportMutation.reset(); setCustomTo(event.target.value) }}
                  className="h-11 min-w-0 bg-tg-secondary-bg px-2 text-xs"
                />
              </label>
            </div>
          )}

          <div className="flex min-h-11 items-center justify-between gap-3 border-y border-tg-hint/10 py-2.5">
            <span className="text-xs text-tg-subtitle-text">Выбранный период</span>
            <span className={`text-right text-xs font-semibold ${selection.isValid ? 'text-tg-text' : 'text-tg-destructive-text'}`}>
              {selection.label}
            </span>
          </div>

          {exportMutation.isError && (
            <p role="alert" className="rounded-lg bg-tg-destructive-text/8 px-3 py-2.5 text-xs leading-5 text-tg-destructive-text">
              {getApiErrorMessage(exportMutation.error)}
            </p>
          )}

          {exportMutation.isSuccess && (
            <div className="animate-page-enter flex items-center justify-between gap-3 rounded-lg bg-emerald-500/10 px-3 py-3 text-emerald-600 dark:text-emerald-400">
              <span className="flex min-w-0 items-center gap-2 text-xs font-semibold">
                <CheckCircle2 className="size-4 shrink-0" />
                Отчёт отправлен · {exportMutation.data.transactionCount} операций
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Открыть чат"
                aria-label="Открыть чат"
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
                onClick={openBotChat}
              >
                <MessageCircle />
              </Button>
            </div>
          )}

          <Button
            type="button"
            className="h-12 w-full rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500"
            disabled={!selection.isValid || exportMutation.isPending}
            onClick={() => {
              triggerHaptic('heavy')
              exportMutation.mutate()
            }}
          >
            {exportMutation.isPending ? <Spinner /> : <Send />}
            {exportMutation.isPending ? 'Формируем отчёт…' : 'Отправить отчёт в чат'}
          </Button>
        </div>
      </section>
    </div>
  )
}

export default UsefulPage
