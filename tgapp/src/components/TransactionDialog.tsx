import { useEffect, useMemo, useState, type ReactElement } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Trash2 } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { getCategories } from '@/api/categories'
import { getApiErrorMessage } from '@/api/client'
import { createTransaction, deleteTransaction, updateTransaction } from '@/api/transactions'
import type { Transaction, TransactionType } from '@/api/types'
import { getWallets } from '@/api/wallets'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { triggerHaptic, triggerNotificationHaptic } from '@/utils/triggerHaptic'

const transactionSchema = z.object({
  amount: z.string()
    .min(1, { message: 'Введите сумму' })
    .refine((value) => /^\d{1,10}(\.\d{1,2})?$/.test(value), {
      message: 'До 10 цифр и не более 2 знаков после запятой',
    })
    .refine((value) => Number(value) > 0, { message: 'Сумма должна быть больше 0' }),
  categoryId: z.string().min(1, { message: 'Выберите категорию' }),
  walletId: z.string().min(1, { message: 'Выберите кошелёк' }),
  date: z.string().min(1, { message: 'Выберите дату' }),
  description: z.string().max(500, { message: 'Максимум 500 символов' }).optional(),
})

type FormValues = z.infer<typeof transactionSchema>

type TransactionDialogProps = {
  type?: 'expense' | 'income'
  transaction?: Transaction
  defaultWalletId?: string
  trigger?: ReactElement
}

const EMPTY_ITEMS: never[] = []

function invalidateFinanceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics'] }),
    queryClient.invalidateQueries({ queryKey: ['analytics-overview'] }),
    queryClient.invalidateQueries({ queryKey: ['wallets'] }),
  ])
}

export default function TransactionDialog({
  type = 'expense',
  transaction,
  defaultWalletId,
  trigger,
}: TransactionDialogProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(transaction)
  const initialType: TransactionType = transaction?.type ?? (type === 'income' ? 'INCOME' : 'EXPENSE')
  const [isOpen, setIsOpen] = useState(false)
  const [transactionType, setTransactionType] = useState<TransactionType>(initialType)
  const isIncome = transactionType === 'INCOME'

  const categoriesQuery = useQuery({
    queryKey: ['categories', transactionType],
    queryFn: () => getCategories(transactionType),
    enabled: isOpen,
    staleTime: 5 * 60_000,
    retry: 1,
  })
  const walletsQuery = useQuery({
    queryKey: ['wallets'],
    queryFn: getWallets,
    enabled: isOpen,
    staleTime: 60_000,
    retry: 1,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const input = {
        categoryId: values.categoryId,
        walletId: values.walletId,
        amount: values.amount,
        description: values.description?.trim() || null,
        date: new Date(`${values.date}T12:00:00`).toISOString(),
      }
      return transaction
        ? updateTransaction(transaction.id, input)
        : createTransaction({ ...input, description: input.description ?? undefined })
    },
    onSuccess: async () => {
      triggerNotificationHaptic('success')
      setIsOpen(false)
      await invalidateFinanceQueries(queryClient)
    },
    onError: () => triggerNotificationHaptic('error'),
  })
  const removeMutation = useMutation({
    mutationFn: () => deleteTransaction(transaction!.id),
    onSuccess: async () => {
      triggerNotificationHaptic('success')
      setIsOpen(false)
      await invalidateFinanceQueries(queryClient)
    },
    onError: () => triggerNotificationHaptic('error'),
  })

  const { register, handleSubmit, setValue, control, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: '', categoryId: '', walletId: '', date: format(new Date(), 'yyyy-MM-dd'), description: '' },
  })
  const amount = useWatch({ control, name: 'amount' })
  const categoryId = useWatch({ control, name: 'categoryId' })
  const walletId = useWatch({ control, name: 'walletId' })

  const categories = useMemo(() => {
    const active = categoriesQuery.data ?? EMPTY_ITEMS
    if (transaction?.category.type === transactionType && !active.some((item) => item.id === transaction.category.id)) {
      return [transaction.category, ...active]
    }
    return active
  }, [categoriesQuery.data, transaction, transactionType])
  const wallets = useMemo(() => {
    const active = walletsQuery.data?.items ?? EMPTY_ITEMS
    if (transaction?.wallet && !active.some((item) => item.id === transaction.wallet.id)) {
      return [transaction.wallet, ...active]
    }
    return active
  }, [transaction, walletsQuery.data])

  useEffect(() => {
    if (!isOpen) return
    if (!categoryId && categories[0]) setValue('categoryId', categories[0].id, { shouldValidate: true })
    if (!walletId && wallets[0]) {
      const preferred = wallets.find((item) => item.id === defaultWalletId)
        ?? wallets.find((item) => item.isDefault)
        ?? wallets[0]
      setValue('walletId', preferred.id, { shouldValidate: true })
    }
  }, [categories, categoryId, defaultWalletId, isOpen, setValue, walletId, wallets])

  const handleOpenChange = (open: boolean) => {
    if (open) {
      const nextType = transaction?.type ?? initialType
      setTransactionType(nextType)
      reset({
        amount: transaction?.amount ?? '',
        categoryId: transaction?.categoryId ?? '',
        walletId: transaction?.walletId ?? defaultWalletId ?? '',
        date: format(transaction ? new Date(transaction.date) : new Date(), 'yyyy-MM-dd'),
        description: transaction?.description ?? '',
      })
      mutation.reset()
      removeMutation.reset()
    }
    setIsOpen(open)
  }

  const changeType = (nextType: TransactionType) => {
    if (nextType === transactionType) return
    triggerHaptic('selection')
    setTransactionType(nextType)
    setValue('categoryId', '')
  }

  const requestDelete = () => {
    if (!transaction) return
    if (window.confirm('Удалить эту транзакцию? Это действие нельзя отменить.')) {
      triggerHaptic('heavy')
      removeMutation.mutate()
    }
  }

  const defaultTrigger = (
    <Button
      className={`h-12 rounded-xl border-none text-sm font-semibold shadow-none ${
        isIncome
          ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 dark:text-emerald-400'
          : 'bg-tg-destructive-text/10 text-tg-destructive-text hover:bg-tg-destructive-text/20'
      }`}
      onClick={() => triggerHaptic('medium')}
    >
      {isIncome ? <ArrowUpRight className="size-4 rounded-full bg-emerald-500 p-0.5 text-white" /> : <ArrowDownLeft className="size-4 rounded-full bg-tg-destructive-text p-0.5 text-white" />}
      {isIncome ? '+ Доход' : '− Расход'}
    </Button>
  )

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger render={trigger ?? defaultTrigger} />
      <DrawerContent className="mx-auto max-w-110 rounded-t-2xl border-t border-tg-hint/10 bg-tg-section-bg text-tg-text">
        <div className="overflow-y-auto px-5 pb-safe">
          <DrawerHeader className="flex-row items-center justify-between px-0 pb-3 pt-5 text-left">
            <DrawerTitle className="text-lg font-bold">
              {isEditing ? 'Редактировать транзакцию' : isIncome ? 'Добавить доход' : 'Добавить расход'}
            </DrawerTitle>
            {isEditing && (
              <Button type="button" variant="ghost" size="icon-sm" className="text-tg-destructive-text" title="Удалить транзакцию" aria-label="Удалить транзакцию" onClick={requestDelete} disabled={removeMutation.isPending}>
                {removeMutation.isPending ? <Spinner /> : <Trash2 />}
              </Button>
            )}
          </DrawerHeader>

          <form onSubmit={handleSubmit((values) => { triggerHaptic('heavy'); mutation.mutate(values) })} className="space-y-4 pb-5">
            {isEditing && (
              <div className="grid grid-cols-2 rounded-lg bg-tg-secondary-bg p-1">
                {(['EXPENSE', 'INCOME'] as const).map((value) => (
                  <button key={value} type="button" onClick={() => changeType(value)} className={`h-9 rounded-md text-xs font-semibold transition-all ${transactionType === value ? 'bg-tg-section-bg text-tg-text shadow-sm' : 'text-tg-hint'}`}>
                    {value === 'EXPENSE' ? 'Расход' : 'Доход'}
                  </button>
                ))}
              </div>
            )}

            <Field className="flex flex-col items-center justify-center">
              <span className="mb-1 select-none text-[11px] font-semibold uppercase text-tg-subtitle-text">
                Сумма транзакции
              </span>

              <div className="relative flex w-full items-center justify-center rounded-2xl border py-3 text-3xl font-black tabular-nums transition-all">
                {amount && (
                  <span className="ml-1.5 select-none text-3xl font-black text-tg-text/30 animate-in fade-in zoom-in-95 duration-100">
                    &nbsp;₽
                  </span>
                )}
                <div className="inline-grid grid-cols-1 items-center justify-items-center">
                  <span className="pointer-events-none invisible col-start-1 row-start-1 whitespace-pre p-0 text-center text-3xl font-black">
                    {amount || '0'}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    {...register('amount', {
                      onChange: (event) => {
                        let value = event.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                        const parts = value.split('.')
                        if (parts.length > 2) value = `${parts[0]}.${parts.slice(1).join('')}`

                        const refinedParts = value.split('.')
                        refinedParts[0] = refinedParts[0].slice(0, 10)
                        if (refinedParts[1]) refinedParts[1] = refinedParts[1].slice(0, 2)
                        event.target.value = refinedParts.join('.')
                      },
                    })}
                    className={`col-start-1 row-start-1 w-full border-none bg-transparent p-0 text-center font-black outline-none focus:ring-0 ${
                      isIncome
                        ? 'text-emerald-500 placeholder:text-emerald-500/30'
                        : 'text-tg-destructive-text placeholder:text-tg-destructive-text/30'
                    }`}
                    autoFocus={!isEditing}
                  />
                </div>
              </div>
              {errors.amount && <FieldError className="mt-1">{errors.amount.message}</FieldError>}
            </Field>

            <div>
              <FieldLabel className="mb-1.5 text-xs font-semibold text-tg-subtitle-text">Кошелёк</FieldLabel>
              {walletsQuery.isLoading ? <Skeleton className="h-12 rounded-xl bg-tg-secondary-bg" /> : (
                <div className="grid grid-cols-2 gap-2">
                  {wallets.map((wallet) => (
                    <button key={wallet.id} type="button" aria-pressed={walletId === wallet.id} onClick={() => { triggerHaptic('selection'); setValue('walletId', wallet.id, { shouldValidate: true }) }} className={`flex h-12 min-w-0 items-center gap-2 rounded-lg border px-3 text-left transition-all ${walletId === wallet.id ? 'border-tg-button bg-tg-button/10' : 'border-tg-hint/10 bg-tg-secondary-bg'}`}>
                      <span className="text-lg">{wallet.emoji}</span><span className="truncate text-xs font-semibold">{wallet.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.walletId && <FieldError className="mt-1">{errors.walletId.message}</FieldError>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <FieldLabel className="text-xs font-semibold text-tg-subtitle-text">Категория</FieldLabel>
                {categoriesQuery.isError && <button type="button" className="text-tg-link" onClick={() => void categoriesQuery.refetch()} aria-label="Повторить загрузку"><RefreshCw className="size-4" /></button>}
              </div>
              {categoriesQuery.isLoading ? (
                <div className="grid grid-cols-3 gap-2">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-18 rounded-xl bg-tg-secondary-bg" />)}</div>
              ) : (
                <div className="grid max-h-44 grid-cols-3 gap-2 overflow-y-auto">
                  {categories.map((category) => (
                    <button key={category.id} type="button" aria-pressed={categoryId === category.id} onClick={() => { triggerHaptic('selection'); setValue('categoryId', category.id, { shouldValidate: true }) }} style={{ borderColor: categoryId === category.id ? category.color : undefined, backgroundColor: categoryId === category.id ? `${category.color}14` : undefined }} className={`flex h-18 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-2 transition-all active:scale-95 ${categoryId === category.id ? 'font-bold' : 'border-tg-hint/10 bg-tg-secondary-bg'}`}>
                      <span className="text-xl">{category.emoji}</span><span className="w-full truncate text-[11px]">{category.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {errors.categoryId && <FieldError className="mt-1">{errors.categoryId.message}</FieldError>}
            </div>

            <div className="grid grid-cols-[1fr_1.15fr] gap-3">
              <div><FieldLabel htmlFor="transaction-date" className="mb-1.5 text-xs font-semibold text-tg-subtitle-text">Дата</FieldLabel><Input id="transaction-date" type="date" {...register('date')} className="h-11 rounded-lg border-tg-hint/10 bg-tg-secondary-bg text-sm" /></div>
              <div><FieldLabel htmlFor="transaction-description" className="mb-1.5 text-xs font-semibold text-tg-subtitle-text">Комментарий</FieldLabel><Input id="transaction-description" {...register('description')} placeholder="Необязательно" maxLength={500} className="h-11 rounded-lg border-tg-hint/10 bg-tg-secondary-bg text-sm" /></div>
            </div>

            {(mutation.isError || removeMutation.isError) && <p role="alert" className="text-center text-xs text-tg-destructive-text">{getApiErrorMessage(mutation.error ?? removeMutation.error)}</p>}
            <Button type="submit" disabled={mutation.isPending || categories.length === 0 || wallets.length === 0} className={`h-12 w-full rounded-xl border-none text-sm font-bold text-white shadow-none ${isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-tg-destructive-text hover:opacity-90'}`}>
              {mutation.isPending && <Spinner />}{mutation.isPending ? 'Сохраняем...' : isEditing ? 'Сохранить изменения' : 'Сохранить транзакцию'}
            </Button>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
