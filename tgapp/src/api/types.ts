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
