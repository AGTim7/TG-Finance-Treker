import { api } from './client'
import type { DashboardData } from './types'

export async function getDashboard() {
  const response = await api.get<DashboardData>('/dashboard')
  return response.data
}
