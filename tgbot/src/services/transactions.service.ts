import { Prisma } from '../../generated/prisma/client'
import type { TransactionType } from '../../generated/prisma/enums'

import { prisma } from '../prisma/client'
import { assertTransactionAmount, TransactionAmountError } from '../domain/transactionAmount'

export class TransactionServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = 'TransactionServiceError'
  }
}

export class TransactionService {
  static async createForUser(userId: string, data: {
    categoryId: string
    amount: Prisma.Decimal
    description?: string
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

    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId: null }, { userId }],
        ...(data.expectedType ? { type: data.expectedType } : {}),
      },
      select: { id: true },
    })

    if (!category) {
      throw new TransactionServiceError('Category not found', 404)
    }

    return prisma.transaction.create({
      data: {
        userId,
        categoryId: category.id,
        amount: data.amount,
        description: data.description,
      },
      include: { category: true },
    })
  }

  static async getPageByUserId(
    userId: string,
    page: number,
    limit: number,
    filters: { type?: TransactionType; from?: Date; to?: Date } = {},
  ) {
    const skip = (page - 1) * limit

    if (!Number.isSafeInteger(skip)) {
      throw new TransactionServiceError('Requested page is too large', 400)
    }

    const periodWhere: Prisma.TransactionWhereInput = {
      userId,
      ...((filters.from || filters.to) && {
        date: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lt: filters.to }),
        },
      }),
    }
    const itemsWhere: Prisma.TransactionWhereInput = {
      ...periodWhere,
      ...(filters.type && { category: { type: filters.type } }),
    }

    const [items, total, income, expense] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: itemsWhere,
        include: { category: true },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: itemsWhere }),
      prisma.transaction.aggregate({
        where: { ...periodWhere, category: { type: 'INCOME' } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { ...periodWhere, category: { type: 'EXPENSE' } },
        _sum: { amount: true },
      }),
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
