import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'

import { getCategories } from '@/api/categories'
import { getApiErrorMessage } from '@/api/client'
import { createTransaction } from '@/api/transactions'
import type { TransactionType } from '@/api/types'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { triggerHaptic, triggerNotificationHaptic } from '@/utils/triggerHaptic'

const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'Введите сумму' })
    .refine((value) => /^\d{1,10}(\.\d{1,2})?$/.test(value), {
      message: 'До 10 цифр и не более 2 знаков после запятой',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Сумма должна быть больше 0',
    })
    .refine((value) => Number(value) <= 9_999_999_999.99, {
      message: 'Сумма превышает допустимый максимум',
    }),
  selectedCategory: z.string().min(1, { message: 'Выберите категорию' }),
  commentary: z.string().max(500, { message: 'Максимум 500 символов' }).optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

type TransactionDialogProps = {
  type: 'expense' | 'income'
}

const EMPTY_CATEGORIES: never[] = []

function TransactionDialog({ type }: TransactionDialogProps) {
  const queryClient = useQueryClient()
  const isIncome = type === 'income'
  const transactionType: TransactionType = isIncome ? 'INCOME' : 'EXPENSE'
  const [isOpen, setIsOpen] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ['categories', transactionType],
    queryFn: () => getCategories(transactionType),
    enabled: isOpen,
    staleTime: 5 * 60_000,
    retry: 1,
  })

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      triggerNotificationHaptic('success')
      setIsOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
    },
    onError: () => triggerNotificationHaptic('error'),
  })

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: '',
      selectedCategory: '',
      commentary: '',
    },
  })

  const amountValue = useWatch({ control, name: 'amount' })
  const currentCategory = useWatch({ control, name: 'selectedCategory' })
  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES

  useEffect(() => {
    if (isOpen && categories[0] && !currentCategory) {
      setValue('selectedCategory', categories[0].id, { shouldValidate: true })
    }
  }, [categories, currentCategory, isOpen, setValue])

  const onSubmit = (data: TransactionFormValues) => {
    triggerHaptic('heavy')
    mutation.mutate({
      categoryId: data.selectedCategory,
      amount: data.amount,
      description: data.commentary?.trim() || undefined,
    })
  }

  const handleOpenChange = (open: boolean) => {
    if (open) {
      reset({
        amount: '',
        selectedCategory: '',
        commentary: '',
      })
      mutation.reset()
    }
    setIsOpen(open)
  }

  return (
    <Drawer open={isOpen} onOpenChange={handleOpenChange}>
      <DrawerTrigger
        render={
          <Button
            className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 border-none transition-all shadow-none ${
              isIncome
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-tg-destructive-text/10 hover:bg-tg-destructive-text/20 text-tg-destructive-text'
            }`}
            onClick={() => triggerHaptic('medium')}
          >
            {isIncome ? (
              <>
                <ArrowUpRight size={18} className="p-0.5 rounded-full bg-emerald-500 text-white" />
                + Доход
              </>
            ) : (
              <>
                <ArrowDownLeft size={18} className="p-0.5 rounded-full bg-tg-destructive-text text-white" />
                − Расход
              </>
            )}
          </Button>
        }
      />

      <DrawerContent className="mx-auto max-w-110 rounded-t-3xl bg-tg-section-bg border-t border-tg-hint/10 p-5 pb-safe text-tg-text font-sans">
        <DrawerHeader className="p-0 mb-4 flex justify-between items-center">
          <DrawerTitle className="text-lg font-bold">
            {isIncome ? 'Добавить доход' : 'Добавить расход'}
          </DrawerTitle>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <FieldSet>
            <FieldGroup className="flex flex-col gap-4">
              <Field className="flex flex-col items-center justify-center">
                <span className="text-[11px] font-semibold text-tg-subtitle-text uppercase mb-1 select-none">
                  Сумма транзакции
                </span>

                <div className="flex items-center justify-center font-black text-3xl tabular-nums w-full py-3 rounded-2xl border transition-all relative">
                  {amountValue && (
                    <span className="text-tg-text/30 ml-1.5 select-none font-black text-3xl animate-in fade-in zoom-in-95 duration-100">
                      &nbsp;₽
                    </span>
                  )}
                  <div className="inline-grid grid-cols-1 items-center justify-items-center">
                    <span className="col-start-1 row-start-1 invisible whitespace-pre font-black text-3xl pointer-events-none p-0 text-center">
                      {amountValue || '0'}
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
                      className={`col-start-1 row-start-1 w-full bg-transparent outline-none border-none p-0 focus:ring-0 font-black text-center ${
                        isIncome
                          ? 'text-emerald-500 placeholder:text-emerald-500/30'
                          : 'text-tg-destructive-text placeholder:text-tg-destructive-text/30'
                      }`}
                      autoFocus
                    />
                  </div>
                </div>
                {errors.amount && <FieldError className="mt-1">{errors.amount.message}</FieldError>}
              </Field>

              <Field className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs font-semibold text-tg-subtitle-text">
                  Категория
                </FieldLabel>

                {categoriesQuery.isLoading && (
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton key={index} className="h-20 rounded-xl bg-tg-secondary-bg" />
                    ))}
                  </div>
                )}

                {categoriesQuery.isError && (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-tg-destructive-text/5 px-3 py-2">
                    <p className="text-xs text-tg-destructive-text">
                      {getApiErrorMessage(categoriesQuery.error)}
                    </p>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Повторить загрузку"
                      aria-label="Повторить загрузку категорий"
                      onClick={() => void categoriesQuery.refetch()}
                    >
                      <RefreshCw />
                    </Button>
                  </div>
                )}

                {!categoriesQuery.isLoading && !categoriesQuery.isError && categories.length === 0 && (
                  <p className="rounded-xl bg-tg-secondary-bg px-3 py-4 text-center text-xs text-tg-subtitle-text">
                    Категории пока не настроены
                  </p>
                )}

                {categories.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto p-0.5 custom-scrollbar">
                    {categories.map((category) => {
                      const isSelected = currentCategory === category.id

                      return (
                        <button
                          key={category.id}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => {
                            triggerHaptic('selection')
                            setValue('selectedCategory', category.id, { shouldValidate: true })
                          }}
                          style={{
                            borderColor: isSelected ? category.color : 'transparent',
                            backgroundColor: isSelected ? `${category.color}12` : undefined,
                            color: isSelected ? category.color : undefined,
                          }}
                          className={`flex min-h-20 flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all gap-1.5 active:scale-95 ${
                            isSelected
                              ? 'font-bold shadow-sm'
                              : 'bg-tg-secondary-bg border-tg-hint/10 text-tg-text'
                          }`}
                        >
                          <span className={`text-xl transition-transform ${isSelected ? 'scale-110' : 'opacity-80'}`}>
                            {category.emoji}
                          </span>
                          <span className="text-[11px] font-medium leading-tight line-clamp-2 w-full">
                            {category.name}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
                {errors.selectedCategory && <FieldError>{errors.selectedCategory.message}</FieldError>}
              </Field>

              <Field className="flex flex-col gap-1.5">
                <FieldLabel htmlFor="commentary" className="text-xs font-semibold text-tg-subtitle-text">
                  Комментарий
                </FieldLabel>
                <Input
                  id="commentary"
                  type="text"
                  placeholder={isIncome ? 'Например: аванс' : 'Например: продукты в магазине'}
                  {...register('commentary')}
                  className="h-11 rounded-xl bg-tg-secondary-bg border-tg-hint/10 text-sm focus:border-tg-hint/30"
                  maxLength={500}
                />
                {errors.commentary && <FieldError>{errors.commentary.message}</FieldError>}
              </Field>

              {mutation.isError && (
                <p role="alert" className="text-center text-xs text-tg-destructive-text">
                  {getApiErrorMessage(mutation.error)}
                </p>
              )}

              <Button
                type="submit"
                disabled={mutation.isPending || categories.length === 0}
                className={`h-12 w-full rounded-xl font-bold text-sm text-white mt-2 transition-all border-none shadow-none ${
                  isIncome
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-tg-destructive-text hover:opacity-90'
                }`}
              >
                {mutation.isPending && <Spinner />}
                {mutation.isPending ? 'Сохраняем...' : 'Сохранить транзакцию'}
              </Button>
            </FieldGroup>
          </FieldSet>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default TransactionDialog
