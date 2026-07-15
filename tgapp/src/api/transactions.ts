import { api } from './client'
import type { CreateTransactionInput, CreateTransactionResponse } from './types'

export async function createTransaction(input: CreateTransactionInput) {
  const response = await api.post<CreateTransactionResponse>('/transactions', input)
  return response.data.item
}
