import { useState, useEffect } from 'react'
import {
  Field,
  FieldGroup,
  FieldLabel,
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

// Наш enum типов транзакций
enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

// Категории доходов
const INCOME_CATEGORIES = [
  { name: 'Зарплата', type: TransactionType.INCOME, emoji: '💰', color: '#28C76F' },
  { name: 'Фриланс и подработка', type: TransactionType.INCOME, emoji: '💻', color: '#00CFDD' },
  { name: 'Подарки и переводы', type: TransactionType.INCOME, emoji: '🍀', color: '#EA5455' },
  { name: 'Инвестиции', type: TransactionType.INCOME, emoji: '📈', color: '#7367F0' },
  { name: 'Прочие доходы', type: TransactionType.INCOME, emoji: '💵', color: '#32CB82' }
]

// Твои новые категории расходов
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

interface TransactionDialogProps {
  type: "expense" | "income"
}

function TransactionDialog({ type }: TransactionDialogProps) {
  const isIncome = type === 'income'
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // Состояния формы
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [commentary, setCommentary] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  // Сброс и автоматический выбор первой категории при открытии
  useEffect(() => {
    if (isOpen && categories.length > 0) {
      setAmount('')
      setSelectedCategory(categories[0].name)
      setCommentary('')
      setDate(new Date().toISOString().split('T')[0])
    }
  }, [isOpen, type])

  const handleSave = () => {
    triggerHaptic('heavy')
    console.log('Сохранение транзакции:', { amount, selectedCategory, commentary, date, type })
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

        <FieldSet>
          <FieldGroup className="flex flex-col gap-4">
            
            {/* 1. Поле ввода суммы */}
            <div className={`flex flex-col items-center justify-center py-3 rounded-2xl border mb-1 transition-all ${
              isIncome ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-tg-destructive-text/5 border-tg-destructive-text/10'
            }`}>
              <span className="text-[11px] font-semibold text-tg-subtitle-text uppercase tracking-wider mb-1">
                Сумма транзакции
              </span>
              <div className={`flex items-center justify-center font-black text-3xl tabular-nums ${
                isIncome ? 'text-emerald-500' : 'text-tg-destructive-text'
              }`}>
                <span className="mr-1 text-2xl font-bold">₽</span>
                <input 
                  id="income-sum"
                  type="number" 
                  inputMode="decimal"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full max-w-48 text-center bg-transparent outline-none border-none p-0 focus:ring-0 font-black ${
                    isIncome ? 'text-emerald-500 placeholder:text-emerald-500/30' : 'text-tg-destructive-text placeholder:text-tg-destructive-text/30'
                  }`}
                  autoFocus
                />
              </div>
            </div>

            {/* 2. Сетка категорий (3 колонки) */}
            <Field className="flex flex-col gap-1.5">
              <FieldLabel className="text-xs font-semibold text-tg-subtitle-text">Категория</FieldLabel>
              <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto p-0.5 custom-scrollbar">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.name
                  
                  return (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => {
                        triggerHaptic('selection')
                        setSelectedCategory(cat.name)
                      }}
                      style={{
                        borderColor: isSelected ? cat.color : 'transparent',
                        backgroundColor: isSelected ? `${cat.color}12` : undefined,
                        color: isSelected ? cat.color : undefined
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all gap-1.5 active:scale-95 ${
                        isSelected
                          ? 'font-bold shadow-sm'
                          : 'bg-tg-secondary-bg border-tg-hint/10 text-tg-text'
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
            </Field>

            {/* 3. Комментарий */}
            <Field className="flex flex-col gap-1.5">
              <FieldLabel htmlFor='commentary' className="text-xs font-semibold text-tg-subtitle-text">Комментарий</FieldLabel>
              <Input 
                id='commentary' 
                type='text' 
                placeholder={isIncome ? 'Например: Аванс, За премию...' : 'Например: Продукты в магните, Кино...'} 
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                className="h-11 rounded-xl bg-tg-secondary-bg border-tg-hint/10 text-sm focus:border-tg-hint/30"
              />
            </Field>

            {/* 4. Дата */}
            <Field className="flex flex-col gap-1.5">
              <FieldLabel htmlFor='date' className="text-xs font-semibold text-tg-subtitle-text">Дата <span className='text-tg-hint'>(не обязательно)</span></FieldLabel>
              <Input 
                id='date' 
                type='date' 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-11 rounded-xl bg-tg-secondary-bg border-tg-hint/10 text-sm text-left"
              />
            </Field>

            {/* Кнопка отправки */}
            <Button 
              onClick={handleSave}
              className={`h-12 w-full rounded-xl font-bold text-sm text-white mt-2 transition-all border-none shadow-none ${
                isIncome ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-tg-destructive-text hover:opacity-90'
              }`}
            >
              Сохранить
            </Button>

          </FieldGroup>
        </FieldSet>
      </DrawerContent>
    </Drawer>
  )
}

export default TransactionDialog