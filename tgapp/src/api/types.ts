export type TransactionType = 'INCOME' | 'EXPENSE'

export type Category = {
  id: string
  userId?: string | null
  name: string
  type: TransactionType
  color: string
  emoji: string
}

export type Transaction = {
  id: string
  userId: string
  categoryId: string
  amount: string
  description: string | null
  date: string
  category: Category
}

export type DashboardExpenseCategory = {
  category: Category
  amount: string
  percentage: number
}

export type DashboardData = {
  balance: string
  recentTransactions: Transaction[]
  topExpenseCategories: DashboardExpenseCategory[]
  period: {
    from: string
    to: string
  }
}

export type CategoriesResponse = {
  items: Category[]
}

export type CreateTransactionInput = {
  categoryId: string
  amount: string
  description?: string
}

export type CreateTransactionResponse = {
  item: Transaction
}

export type TransactionsPage = {
  items: Transaction[]
  page: number
  limit: number
  total: number
  hasMore: boolean
  summary: {
    income: string
    expense: string
  }
}

export type AnalyticsCategory = {
  category: Category
  amount: string
  transactionCount: number
  percentage: number
}

export type AnalyticsData = {
  type: TransactionType
  total: string
  transactionCount: number
  categories: AnalyticsCategory[]
  period: {
    from: string | null
    to: string | null
  }
}

export type MonthlyAnalytics = {
  month: string
  income: string
  expense: string
  balance: string
}

export type AnalyticsOverviewData = {
  months: MonthlyAnalytics[]
  totalIncome: string
  totalExpense: string
  balance: string
  period: {
    from: string
    to: string
    currentMonth: string
  }
}
