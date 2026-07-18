import { api } from './client'
import type {
  CreateTransactionInput,
  TransactionResponse,
  TransactionsPage,
  TransactionType,
  UpdateTransactionInput,
} from './types'

export async function createTransaction(input: CreateTransactionInput) {
  const response = await api.post<TransactionResponse>('/transactions', input)
  return response.data.item
}

export async function getTransactions(params: {
  page: number
  limit?: number
  type?: TransactionType
  walletId?: string
  from?: string
  to?: string
}) {
  const response = await api.get<TransactionsPage>('/transactions', { params })
  return response.data
}

export async function updateTransaction(id: string, input: UpdateTransactionInput) {
  const response = await api.patch<TransactionResponse>(`/transactions/${id}`, input)
  return response.data.item
}

export async function deleteTransaction(id: string) {
  await api.delete(`/transactions/${id}`)
}
