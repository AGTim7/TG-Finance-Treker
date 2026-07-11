import { Card, CardContent } from "@/components/ui/card";


import RecentTransactionsCard from "@/components/RecentTransactionsCard";
import ExpensesTopCard from "@/components/ExpensesTopCard";
import TransactionDialog from "@/components/TransactionDialog";


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

        </CardContent>
      </Card>

      {/* 2. КНОПКИ ДЕЙСТВИЯ (ДОХОД / РАСХОД) */}
      <div className="grid grid-cols-2 gap-3">
        <TransactionDialog type="income"/>
        <TransactionDialog type="expense"/>
      </div>

      <RecentTransactionsCard/>
      <ExpensesTopCard/>
      
    </div>
  );
}