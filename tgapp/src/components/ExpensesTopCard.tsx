import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { ChevronRight, ShoppingBag, Coffee, Car, Gamepad2 
} from 'lucide-react'

function ExpensesTopCard() {
  return (
    <div>
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

            {/* Развлечения */}
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
  )
}

export default ExpensesTopCard