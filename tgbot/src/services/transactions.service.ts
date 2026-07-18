import { Prisma } from '../../generated/prisma/client'
import type { TransactionType } from '../../generated/prisma/enums'

import { prisma } from '../prisma/client'
import { assertTransactionAmount, TransactionAmountError } from '../domain/transactionAmount'

export class TransactionServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = 'TransactionServiceError'
  }
}

const transactionInclude = { category: true, wallet: true } as const

export class TransactionService {
  private static async resolveCategory(
    userId: string,
    categoryId: string,
    expectedType?: TransactionType,
  ) {
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        archivedAt: null,
        OR: [{ userId: null }, { userId }],
        ...(expectedType ? { type: expectedType } : {}),
      },
    })
    if (!category) throw new TransactionServiceError('Category not found', 404)
    return category
  }

  private static async resolveWallet(userId: string, walletId?: string) {
    const wallet = await prisma.wallet.findFirst({
      where: walletId
        ? { id: walletId, userId, archivedAt: null }
        : { userId, isDefault: true, archivedAt: null },
    })
    if (!wallet) throw new TransactionServiceError('Wallet not found', 404)
    return wallet
  }

  static async createForUser(userId: string, data: {
    categoryId: string
    walletId?: string
    amount: Prisma.Decimal
    description?: string
    date?: Date
    expectedType?: TransactionType
  }) {
    try {
      assertTransactionAmount(data.amount)
    } catch (error) {
      if (error instanceof TransactionAmountError) {
        throw new TransactionServiceError(error.message, 400)
      }
      throw error
    }

    const [category, wallet] = await Promise.all([
      this.resolveCategory(userId, data.categoryId, data.expectedType),
      this.resolveWallet(userId, data.walletId),
    ])

    return prisma.transaction.create({
      data: {
        userId,
        categoryId: category.id,
        walletId: wallet.id,
        type: category.type,
        amount: data.amount,
        description: data.description,
        ...(data.date && { date: data.date }),
      },
      include: transactionInclude,
    })
  }

  static async updateForUser(userId: string, transactionId: string, data: {
    categoryId?: string
    walletId?: string
    amount?: Prisma.Decimal
    description?: string | null
    date?: Date
  }) {
    const current = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
      include: transactionInclude,
    })
    if (!current) throw new TransactionServiceError('Transaction not found', 404)

    if (data.amount) {
      try {
        assertTransactionAmount(data.amount)
      } catch (error) {
        if (error instanceof TransactionAmountError) {
          throw new TransactionServiceError(error.message, 400)
        }
        throw error
      }
    }

    const [category, wallet] = await Promise.all([
      data.categoryId
        ? this.resolveCategory(userId, data.categoryId)
        : Promise.resolve(current.category),
      data.walletId
        ? this.resolveWallet(userId, data.walletId)
        : Promise.resolve(current.wallet),
    ])

    return prisma.transaction.update({
      where: { id: current.id },
      data: {
        categoryId: category.id,
        walletId: wallet.id,
        type: category.type,
        ...(data.amount && { amount: data.amount }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.date && { date: data.date }),
      },
      include: transactionInclude,
    })
  }

  static async deleteForUser(userId: string, transactionId: string) {
    const result = await prisma.transaction.deleteMany({ where: { id: transactionId, userId } })
    if (result.count === 0) throw new TransactionServiceError('Transaction not found', 404)
  }

  static async getPageByUserId(
    userId: string,
    page: number,
    limit: number,
    filters: { type?: TransactionType; walletId?: string; from?: Date; to?: Date } = {},
  ) {
    const skip = (page - 1) * limit
    if (!Number.isSafeInteger(skip)) {
      throw new TransactionServiceError('Requested page is too large', 400)
    }

    if (filters.walletId) await this.resolveWallet(userId, filters.walletId)

    const periodWhere: Prisma.TransactionWhereInput = {
      userId,
      ...(filters.walletId && { walletId: filters.walletId }),
      ...((filters.from || filters.to) && {
        date: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lt: filters.to }),
        },
      }),
    }
    const itemsWhere: Prisma.TransactionWhereInput = {
      ...periodWhere,
      ...(filters.type && { type: filters.type }),
    }

    const [items, total, income, expense] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: itemsWhere,
        include: transactionInclude,
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: itemsWhere }),
      prisma.transaction.aggregate({ where: { ...periodWhere, type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { ...periodWhere, type: 'EXPENSE' }, _sum: { amount: true } }),
    ])

    return {
      items,
      page,
      limit,
      total,
      hasMore: page * limit < total,
      summary: {
        income: (income._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
        expense: (expense._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      },
    }
  }
}
