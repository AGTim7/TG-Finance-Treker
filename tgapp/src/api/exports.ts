import { api } from './client'

export type TransactionExportInput = {
  from?: string
  to?: string
  timezoneOffsetMinutes: number
}

export type TransactionExportResponse = {
  sent: true
  filename: string
  transactionCount: number
  period: string
}

export async function exportTransactions(input: TransactionExportInput) {
  const response = await api.post<TransactionExportResponse>('/exports/transactions', input, {
    timeout: 75_000,
  })
  return response.data
}
