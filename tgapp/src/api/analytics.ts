import { api } from './client'
import type { AnalyticsData, AnalyticsOverviewData, TransactionType } from './types'

export async function getAnalytics(params: {
  type: TransactionType
  from?: string
  to?: string
}) {
  const response = await api.get<AnalyticsData>('/analytics', { params })
  return response.data
}

export async function getAnalyticsOverview() {
  const response = await api.get<AnalyticsOverviewData>('/analytics/overview')
  return response.data
}
