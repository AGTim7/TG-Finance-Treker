import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, ArrowDownLeft
} from 'lucide-react'
import { triggerHaptic } from '../utils/triggerHaptic';

import RecentTransactionsCard from "@/components/RecentTransactionsCard";
import ExpensesTopCard from "@/components/ExpensesTopCard";

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

      <RecentTransactionsCard/>
      <ExpensesTopCard/>
      
    </div>
  );
}