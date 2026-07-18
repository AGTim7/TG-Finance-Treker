import { api } from './client'
import type { DashboardData } from './types'

export async function getDashboard(walletId?: string) {
  const response = await api.get<DashboardData>('/dashboard', { params: { walletId } })
  return response.data
}
