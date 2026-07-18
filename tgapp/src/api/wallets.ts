import { api } from './client'
import type { Wallet, WalletInput, WalletsResponse } from './types'

export async function getWallets() {
  const response = await api.get<WalletsResponse>('/wallets')
  return response.data
}

export async function createWallet(input: WalletInput) {
  const response = await api.post<{ item: Wallet }>('/wallets', input)
  return response.data.item
}

export async function updateWallet(id: string, input: Partial<WalletInput>) {
  const response = await api.patch<{ item: Wallet }>(`/wallets/${id}`, input)
  return response.data.item
}

export async function archiveWallet(id: string) {
  await api.delete(`/wallets/${id}`)
}
