import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
} from "@/components/ui/field"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from '@/components/ui/input'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { triggerHaptic } from '../utils/triggerHaptic'

enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

const INCOME_CATEGORIES = [
  { name: 'Зарплата', type: TransactionType.INCOME, emoji: '💰', color: '#28C76F' },
  { name: 'Фриланс и подработка', type: TransactionType.INCOME, emoji: '💻', color: '#00CFDD' },
  { name: 'Подарки и переводы', type: TransactionType.INCOME, emoji: '🍀', color: '#EA5455' },
  { name: 'Инвестиции', type: TransactionType.INCOME, emoji: '📈', color: '#7367F0' },
  { name: 'Прочие доходы', type: TransactionType.INCOME, emoji: '💵', color: '#32CB82' }
]

const EXPENSE_CATEGORIES = [
  { name: 'Продукты', type: TransactionType.EXPENSE, emoji: '🍏', color: '#4CD964' },
  { name: 'Кафе и рестораны', type: TransactionType.EXPENSE, emoji: '🍔', color: '#FF9500' },
  { name: 'Транспорт и такси', type: TransactionType.EXPENSE, emoji: '🚕', color: '#FFCC00' },
  { name: 'Жилье и ЖКХ', type: TransactionType.EXPENSE, emoji: '🏠', color: '#5AC8FA' },
  { name: 'Одежда и покупки', type: TransactionType.EXPENSE, emoji: '👕', color: '#007AFF' },
  { name: 'Здоровье и аптека', type: TransactionType.EXPENSE, emoji: '💊', color: '#FF3B30' },
  { name: 'Развлечения и отдых', type: TransactionType.EXPENSE, emoji: '🍿', color: '#5856D6' },
  { name: 'Подарки', type: TransactionType.EXPENSE, emoji: '🎁', color: '#FF2D55' },
  { name: 'Другое', type: TransactionType.EXPENSE, emoji: '🏷️', color: '#8E8E93' }
]

const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'Введите сумму' })
    .refine((val) => /^\d{1,10}(\.\d{1,2})?$/.test(val), {
      message: 'Максимум 10 знаков до запятой и 2 знака после',
    })
    .refine((val) => Number(val) > 0, {
      message: 'Сумма должна быть больше 0',
    }),
  selectedCategory: z.string().min(1, { message: 'Выберите категорию' }),
  commentary: z.string().max(30, { message: 'Максимум 30 символов' }).optional(),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

interface TransactionDialogProps {
  type: "expense" | "income"
}

function TransactionDialog({ type }: TransactionDialogProps) {
  const isIncome = type === 'income'
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  const [isOpen, setIsOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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

  const amountValue = watch('amount')
  const currentCategory = watch('selectedCategory')

  useEffect(() => {
    if (isOpen && categories.length > 0) {
      reset({
        amount: '',
        selectedCategory: categories[0].name,
        commentary: '',
      })
    }
  }, [isOpen, type, categories, reset])

  const onSubmit = (data: TransactionFormValues) => {
    triggerHaptic('heavy')
    const finalData = {
      ...data,
      amount: Number(data.amount),
      type: isIncome ? TransactionType.INCOME : TransactionType.EXPENSE,
      date: new Date().toISOString().split('T')[0]
    }
    console.log('Данные отправлены:', finalData)
    setIsOpen(false)
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger
        render={
          <Button 
            className={`h-12 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 border-none transition-all shadow-none ${
              isIncome 
                ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                : "bg-tg-destructive-text/10 hover:bg-tg-destructive-text/20 text-tg-destructive-text"
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
                – Расход
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
              
              {/* 1. Поле ввода суммы */}
              <Field className="flex flex-col items-center justify-center">
                <span className="text-[11px] font-semibold text-tg-subtitle-text uppercase tracking-wider mb-1 select-none">
                  Сумма транзакции
                </span>
                
                <div className="flex items-center justify-center font-black text-3xl tabular-nums tracking-tight w-full py-3 rounded-2xl border transition-all relative">
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
                        onChange: (e) => {
                          let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                          
                          const parts = val.split('.')
                          if (parts.length > 2) {
                            val = parts[0] + '.' + parts.slice(1).join('')
                          }

                          const refinedParts = val.split('.')
                          if (refinedParts[0].length > 10) {
                            refinedParts[0] = refinedParts[0].slice(0, 10)
                          }
                          if (refinedParts[1] && refinedParts[1].length > 2) {
                            refinedParts[1] = refinedParts[1].slice(0, 2)
                          }
                          
                          e.target.value = refinedParts.join('.')
                        }
                      })}
                      className={`col-start-1 row-start-1 w-full bg-transparent outline-none border-none p-0 focus:ring-0 font-black text-center ${
                        isIncome ? 'text-emerald-500 placeholder:text-emerald-500/30' : 'text-tg-destructive-text placeholder:text-tg-destructive-text/30'
                      }`}
                      autoFocus
                    />
                  </div>
                </div>
                {errors.amount && <FieldError className="mt-1">{errors.amount.message}</FieldError>}
              </Field>

              {/* 2. Сетка категорий */}
              <Field className="flex flex-col gap-1.5">
                <FieldLabel className="text-xs font-semibold text-tg-subtitle-text">Категория</FieldLabel>
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto p-0.5 custom-scrollbar">
                  {categories.map((cat) => {
                    const isSelected = currentCategory === cat.name
                    
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => {
                          triggerHaptic('selection')
                          setValue('selectedCategory', cat.name, { shouldValidate: true })
                        }}
                        style={{
                          borderColor: isSelected ? cat.color : 'transparent',
                          backgroundColor: isSelected ? `${cat.color}12` : undefined,
                          color: isSelected ? cat.color : undefined
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all gap-1.5 active:scale-95 ${
                          isSelected ? 'font-bold shadow-sm' : 'bg-tg-secondary-bg border-tg-hint/10 text-tg-text'
                        }`}
                      >
                        <span className={`text-xl transition-transform ${isSelected ? 'scale-110' : 'opacity-80'}`}>
                          {cat.emoji}
                        </span>
                        <span className={`text-[11px] font-medium leading-tight truncate w-full ${isSelected ? '' : 'text-tg-text/90'}`}>
                          {cat.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {errors.selectedCategory && <FieldError>{errors.selectedCategory.message}</FieldError>}
              </Field>

              {/* 3. Комментарий */}
              <Field className="flex flex-col gap-1.5">
                <FieldLabel htmlFor='commentary' className="text-xs font-semibold text-tg-subtitle-text">Комментарий</FieldLabel>
                <Input 
                  id='commentary' 
                  type='text' 
                  placeholder={isIncome ? 'Например: Аванс, За премию...' : 'Например: Продукты в магните...'} 
                  {...register('commentary')}
                  className="h-11 rounded-xl bg-tg-secondary-bg border-tg-hint/10 text-sm focus:border-tg-hint/30"
                  maxLength={30}
                />
                {errors.commentary && <FieldError>{errors.commentary.message}</FieldError>}
              </Field>

              {/* Кнопка отправки */}
              <Button 
                type="submit"
                className={`h-12 w-full rounded-xl font-bold text-sm text-white mt-2 transition-all border-none shadow-none ${
                  isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-tg-destructive-text hover:opacity-90'
                }`}
              >
                Сохранить транзакцию
              </Button>

            </FieldGroup>
          </FieldSet>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

export default TransactionDialog