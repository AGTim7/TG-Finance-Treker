import { Prisma } from '../../generated/prisma/client'

import { prisma } from '../prisma/client'
import { WalletService } from './wallets.service'

export class DashboardService {
  static async getForUser(userId: string, walletId?: string, now = new Date()) {
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const walletData = await WalletService.getForUser(userId)
    const selectedWallet = walletId
      ? walletData.items.find((wallet) => wallet.id === walletId)
      : undefined
    if (walletId && !selectedWallet) await WalletService.requireActiveForUser(userId, walletId)
    const walletWhere = walletId ? { walletId } : {}

    const [recentTransactions, topExpenseGroups, monthExpense] =
      await prisma.$transaction([
        prisma.transaction.findMany({
          where: { userId, ...walletWhere },
          include: { category: true, wallet: true },
          orderBy: [{ date: 'desc' }, { id: 'desc' }],
          take: 4,
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            ...walletWhere,
            date: { gte: monthStart },
            type: 'EXPENSE',
          },
          _sum: { amount: true },
          orderBy: { _sum: { amount: 'desc' } },
          take: 4,
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            ...walletWhere,
            date: { gte: monthStart },
            type: 'EXPENSE',
          },
          _sum: { amount: true },
        }),
      ])

    const categoryIds = topExpenseGroups.map((group) => group.categoryId)
    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            name: true,
            type: true,
            color: true,
            emoji: true,
          },
        })
      : []
    const categoriesById = new Map(categories.map((category) => [category.id, category]))

    const monthExpenseTotal = monthExpense._sum.amount ?? new Prisma.Decimal(0)

    const topExpenseCategories = topExpenseGroups.flatMap((group) => {
      const category = categoriesById.get(group.categoryId)
      const amount = group._sum.amount
      if (!category || !amount) return []

      const percentage = monthExpenseTotal.isZero()
        ? 0
        : amount.dividedBy(monthExpenseTotal).times(100).toDecimalPlaces(1).toNumber()

      return [{
        category,
        amount: amount.toFixed(2),
        percentage,
      }]
    })

    return {
      balance: selectedWallet?.balance ?? walletData.totalBalance,
      totalBalance: walletData.totalBalance,
      wallets: walletData.items,
      recentTransactions,
      topExpenseCategories,
      period: {
        from: monthStart.toISOString(),
        to: now.toISOString(),
      },
    }
  }
}
