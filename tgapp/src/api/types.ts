export type TransactionType = 'INCOME' | 'EXPENSE'
export type WalletKind = 'CASH' | 'BANK' | 'CUSTOM'

export type Category = {
  id: string
  userId: string | null
  name: string
  type: TransactionType
  color: string
  emoji: string
  archivedAt?: string | null
}

export type Wallet = {
  id: string
  userId: string
  name: string
  kind: WalletKind
  emoji: string
  color: string
  initialBalance: string
  balance: string
  isDefault: boolean
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export type Transaction = {
  id: string
  userId: string
  categoryId: string
  walletId: string
  type: TransactionType
  amount: string
  description: string | null
  date: string
  updatedAt: string
  category: Category
  wallet: Wallet
}

export type DashboardExpenseCategory = {
  category: Category
  amount: string
  percentage: number
}

export type DashboardData = {
  balance: string
  totalBalance: string
  wallets: Wallet[]
  recentTransactions: Transaction[]
  topExpenseCategories: DashboardExpenseCategory[]
  period: { from: string; to: string }
}

export type CategoriesResponse = { items: Category[] }
export type WalletsResponse = { totalBalance: string; items: Wallet[] }

export type CreateTransactionInput = {
  categoryId: string
  walletId: string
  amount: string
  description?: string
  date?: string
}

export type UpdateTransactionInput = {
  categoryId?: string
  walletId?: string
  amount?: string
  description?: string | null
  date?: string
}

export type TransactionResponse = { item: Transaction }

export type TransactionsPage = {
  items: Transaction[]
  page: number
  limit: number
  total: number
  hasMore: boolean
  summary: { income: string; expense: string }
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
  period: { from: string | null; to: string | null }
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
  period: { from: string; to: string; currentMonth: string }
}

export type WalletInput = {
  name: string
  emoji: string
  color: string
  initialBalance: string
  isDefault: boolean
}

export type CategoryInput = {
  name: string
  type: TransactionType
  emoji: string
  color: string
}
