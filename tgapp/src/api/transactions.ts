import { api } from './client'
import type {
  CreateTransactionInput,
  CreateTransactionResponse,
  TransactionsPage,
  TransactionType,
} from './types'

export async function createTransaction(input: CreateTransactionInput) {
  const response = await api.post<CreateTransactionResponse>('/transactions', input)
  return response.data.item
}

export async function getTransactions(params: {
  page: number
  limit?: number
  type?: TransactionType
  from?: string
  to?: string
}) {
  const response = await api.get<TransactionsPage>('/transactions', { params })
  return response.data
}
