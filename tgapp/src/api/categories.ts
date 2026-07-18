import { api } from './client'
import type { CategoriesResponse, Category, CategoryInput, TransactionType } from './types'

export async function getCategories(type: TransactionType) {
  const response = await api.get<CategoriesResponse>('/categories', {
    params: { type },
  })
  return response.data.items
}

export async function createCategory(input: CategoryInput) {
  const response = await api.post<{ item: Category }>('/categories', input)
  return response.data.item
}

export async function updateCategory(id: string, input: Omit<Partial<CategoryInput>, 'type'>) {
  const response = await api.patch<{ item: Category }>(`/categories/${id}`, input)
  return response.data.item
}

export async function archiveCategory(id: string) {
  await api.delete(`/categories/${id}`)
}
