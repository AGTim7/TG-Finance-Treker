import { api } from './client'
import type { CategoriesResponse, TransactionType } from './types'

export async function getCategories(type: TransactionType) {
  const response = await api.get<CategoriesResponse>('/categories', {
    params: { type },
  })
  return response.data.items
}
