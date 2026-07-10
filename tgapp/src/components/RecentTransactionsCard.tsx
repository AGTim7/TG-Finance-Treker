import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, ShoppingBag, Coffee, Car, Wallet,
} from 'lucide-react'
import { triggerHaptic } from "@/utils/triggerHaptic"
import { useNavigate } from "react-router"

function RecentTransactionsCard() {

  const navigate = useNavigate()

  const handleNavigation = (path: string) => {
      triggerHaptic("selection")
      navigate(path)
  }

  return (
    <div>
      {/* 3. ПОСЛЕДНИЕ ТРАНЗАКЦИИ */}
      <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Последние транзакции</h3>
            <button 
              onClick={() => handleNavigation("/history")}
              className="text-xs text-tg-hint flex items-center gap-0.5 font-medium hover:opacity-80"
            >
              Смотреть все <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {/* Строка 1: Перекресток */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <ShoppingBag size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Перекрёсток</span>
                  <span className="text-xs text-tg-subtitle-text">Продукты</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-sm text-tg-destructive-text">– 2 450,00 ₽</span>
                <span className="text-[10px] text-tg-hint">Сегодня</span>
              </div>
            </div>

            {/* Строка 2: Surf Coffee */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600">
                  <Coffee size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Surf Coffee</span>
                  <span className="text-xs text-tg-subtitle-text">Кафе</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-sm text-tg-destructive-text">– 320,00 ₽</span>
                <span className="text-[10px] text-tg-hint">Сегодня</span>
              </div>
            </div>

            {/* Строка 3: Яндекс.Заправки */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600">
                  <Car size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Яндекс.Заправки</span>
                  <span className="text-xs text-tg-subtitle-text">Транспорт</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-sm text-tg-destructive-text">– 1 850,00 ₽</span>
                <span className="text-[10px] text-tg-hint">Вчера</span>
              </div>
            </div>

            {/* Строка 4: Зарплата */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Wallet size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Зарплата</span>
                  <span className="text-xs text-tg-subtitle-text">Доход</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">+ 75 000,00 ₽</span>
                <span className="text-[10px] text-tg-hint">Вчера</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}

export default RecentTransactionsCard