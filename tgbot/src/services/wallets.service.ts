import { Prisma } from '../../generated/prisma/client'

import { prisma } from '../prisma/client'

export const DEFAULT_WALLETS = [
  {
    name: 'Банковский',
    kind: 'BANK' as const,
    emoji: '💳',
    color: '#2481CC',
    isDefault: true,
  },
  {
    name: 'Наличные',
    kind: 'CASH' as const,
    emoji: '💵',
    color: '#31B56A',
    isDefault: false,
  },
]

export class WalletServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = 'WalletServiceError'
  }
}

function serializeWallet<T extends { initialBalance: Prisma.Decimal }>(wallet: T, balance: Prisma.Decimal) {
  return {
    ...wallet,
    initialBalance: wallet.initialBalance.toFixed(2),
    balance: balance.toFixed(2),
  }
}

export class WalletService {
  static async requireActiveForUser(userId: string, walletId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { id: walletId, userId, archivedAt: null },
    })
    if (!wallet) throw new WalletServiceError('Wallet not found', 404)
    return wallet
  }

  static async getForUser(userId: string, includeArchived = false) {
    const wallets = await prisma.wallet.findMany({
      where: {
        userId,
        ...(!includeArchived && { archivedAt: null }),
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })

    const groups = wallets.length === 0
      ? []
      : await prisma.transaction.groupBy({
          by: ['walletId', 'type'],
          where: { userId, walletId: { in: wallets.map((wallet) => wallet.id) } },
          _sum: { amount: true },
        })

    const deltas = new Map<string, Prisma.Decimal>()
    groups.forEach((group) => {
      const amount = group._sum.amount ?? new Prisma.Decimal(0)
      const signed = group.type === 'INCOME' ? amount : amount.negated()
      deltas.set(group.walletId, (deltas.get(group.walletId) ?? new Prisma.Decimal(0)).plus(signed))
    })

    const items = wallets.map((wallet) => serializeWallet(
      wallet,
      wallet.initialBalance.plus(deltas.get(wallet.id) ?? 0),
    ))
    const totalBalance = items.reduce(
      (total, wallet) => total.plus(wallet.balance),
      new Prisma.Decimal(0),
    )

    return { totalBalance: totalBalance.toFixed(2), items }
  }

  static async getDefaultForUser(userId: string) {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, isDefault: true, archivedAt: null },
    })
    if (!wallet) throw new WalletServiceError('Default wallet not found', 409)
    return wallet
  }

  static async createForUser(userId: string, data: {
    name: string
    emoji: string
    color: string
    initialBalance: Prisma.Decimal
    isDefault: boolean
  }) {
    const activeCount = await prisma.wallet.count({ where: { userId, archivedAt: null } })
    if (activeCount >= 20) throw new WalletServiceError('Wallet limit reached', 409)

    const duplicate = await prisma.wallet.findFirst({
      where: { userId, archivedAt: null, name: { equals: data.name, mode: 'insensitive' } },
    })
    if (duplicate) throw new WalletServiceError('Wallet with this name already exists', 409)

    const wallet = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.wallet.updateMany({
          where: { userId, archivedAt: null, isDefault: true },
          data: { isDefault: false },
        })
      }
      return tx.wallet.create({
        data: { userId, kind: 'CUSTOM', ...data },
      })
    })
    return serializeWallet(wallet, wallet.initialBalance)
  }

  static async updateForUser(userId: string, walletId: string, data: {
    name?: string
    emoji?: string
    color?: string
    initialBalance?: Prisma.Decimal
    isDefault?: boolean
  }) {
    const wallet = await prisma.wallet.findFirst({ where: { id: walletId, userId, archivedAt: null } })
    if (!wallet) throw new WalletServiceError('Wallet not found', 404)

    if (data.name) {
      const duplicate = await prisma.wallet.findFirst({
        where: {
          userId,
          id: { not: walletId },
          archivedAt: null,
          name: { equals: data.name, mode: 'insensitive' },
        },
      })
      if (duplicate) throw new WalletServiceError('Wallet with this name already exists', 409)
    }
    if (data.isDefault === false && wallet.isDefault) {
      throw new WalletServiceError('Choose another default wallet instead', 409)
    }

    await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.wallet.updateMany({
          where: { userId, archivedAt: null, isDefault: true },
          data: { isDefault: false },
        })
      }
      await tx.wallet.update({ where: { id: walletId }, data })
    })

    const result = await this.getForUser(userId)
    return result.items.find((item) => item.id === walletId)!
  }

  static async archiveForUser(userId: string, walletId: string) {
    const result = await this.getForUser(userId)
    const wallet = result.items.find((item) => item.id === walletId)
    if (!wallet) throw new WalletServiceError('Wallet not found', 404)
    if (wallet.kind !== 'CUSTOM') {
      throw new WalletServiceError('Built-in wallets cannot be archived', 409)
    }
    if (wallet.isDefault) throw new WalletServiceError('Default wallet cannot be archived', 409)
    if (!new Prisma.Decimal(wallet.balance).isZero()) {
      throw new WalletServiceError('Only a wallet with zero balance can be archived', 409)
    }

    await prisma.wallet.update({ where: { id: walletId }, data: { archivedAt: new Date() } })
  }
}
