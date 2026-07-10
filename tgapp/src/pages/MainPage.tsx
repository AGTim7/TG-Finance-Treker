import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { 
  ArrowUpRight, ArrowDownLeft, ChevronRight,
  ShoppingBag, Coffee, Car, Wallet, Gamepad2 
} from 'lucide-react'
import { triggerHaptic } from '../utils/triggerHaptic';

export default function MainPage() {
  return (
    <div className="min-h-screen w-full pb-24 bg-tg-bg text-tg-text flex flex-col px-4 pt-4 gap-4 select-none font-sans">
      
      {/* 1. БЛОК ОБЩЕГО БАЛАНСА */}
      <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
        <CardContent className="p-5 flex flex-col gap-1">
          <span className="text-sm text-tg-subtitle-text font-medium">
            Общий баланс
          </span>
          <div className="text-4xl font-bold tracking-tight flex items-baseline gap-1">
            <span className="text-3xl font-semibold">₽</span> 124 580<span className="text-xl text-tg-subtitle-text">,00</span>
          </div>
          <div className="mt-2 self-start flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <ArrowUpRight size={14} />
            <span>+12,4% за месяц</span>
          </div>
        </CardContent>
      </Card>

      {/* 2. КНОПКИ ДЕЙСТВИЯ (ДОХОД / РАСХОД) */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className="h-12 rounded-xl text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 border-none transition-all shadow-none"
          onClick={() => triggerHaptic('medium')}
        >
          <ArrowUpRight size={18} className="p-0.5 rounded-full bg-emerald-500 text-white" />
          + Доход
        </Button>
        <Button 
          className="h-12 rounded-xl text-sm font-semibold bg-tg-destructive-text/10 hover:bg-tg-destructive-text/20 text-tg-destructive-text flex items-center justify-center gap-1.5 border-none transition-all shadow-none"
          onClick={() => triggerHaptic('medium')}
        >
          <ArrowDownLeft size={18} className="p-0.5 rounded-full bg-tg-destructive-text text-white" />
          – Расход
        </Button>
      </div>

      {/* 3. ПОСЛЕДНИЕ ТРАНЗАКЦИИ */}
      <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Последние транзакции</h3>
            <button className="text-xs text-tg-hint flex items-center gap-0.5 font-medium hover:opacity-80">
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

      {/* 4. ТОП РАСХОДОВ */}
      <Card className="border-tg-hint/10 bg-tg-section-bg shadow-none rounded-2xl">
        <CardContent className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base">Топ расходов</h3>
            <button className="text-xs text-tg-hint flex items-center gap-0.5 font-medium hover:opacity-80">
              Смотреть все <ChevronRight size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {/* Продукты */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-emerald-500/10 text-emerald-600">
                    <ShoppingBag size={14} />
                  </div>
                  <span className="font-medium">Продукты</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tg-hint">35%</span>
                  <span className="font-bold">43 680,00 ₽</span>
                </div>
              </div>
              <Progress value={35} className="w-full">
                <ProgressTrack className="h-1.5 bg-tg-secondary-bg">
                  <ProgressIndicator className="bg-emerald-500" />
                </ProgressTrack>
              </Progress>
            </div>

            {/*  Транспорт */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-blue-500/10 text-blue-600">
                    <Car size={14} />
                  </div>
                  <span className="font-medium">Транспорт</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tg-hint">22%</span>
                  <span className="font-bold">27 456,00 ₽</span>
                </div>
              </div>
              <Progress value={22} className="w-full">
                <ProgressTrack className="h-1.5 bg-tg-secondary-bg">
                  <ProgressIndicator className="bg-blue-500" />
                </ProgressTrack>
              </Progress>
            </div>

            {/* Кафе */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-orange-500/10 text-orange-600">
                    <Coffee size={14} />
                  </div>
                  <span className="font-medium">Кафе</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tg-hint">18%</span>
                  <span className="font-bold">22 464,00 ₽</span>
                </div>
              </div>
              <Progress value={18} className="w-full">
                <ProgressTrack className="h-1.5 bg-tg-secondary-bg">
                  <ProgressIndicator className="bg-orange-500" />
                </ProgressTrack>
              </Progress>
            </div>

            {/* Развлечения (Добавлено из макета!) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-purple-500/10 text-purple-600">
                    <Gamepad2 size={14} />
                  </div>
                  <span className="font-medium">Развлечения</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-tg-hint">15%</span>
                  <span className="font-bold">18 720,00 ₽</span>
                </div>
              </div>
              <Progress value={15} className="w-full">
                <ProgressTrack className="h-1.5 bg-tg-secondary-bg">
                  <ProgressIndicator className="bg-purple-500" />
                </ProgressTrack>
              </Progress>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}