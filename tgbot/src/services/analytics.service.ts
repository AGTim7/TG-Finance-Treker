import { Prisma } from '../../generated/prisma/client'
import type { TransactionType } from '../../generated/prisma/enums'

import { prisma } from '../prisma/client'
import { WalletService } from './wallets.service'

type MonthlyAnalyticsRow = {
  month: Date
  type: TransactionType
  amount: Prisma.Decimal
}

export class AnalyticsService {
  static async getOverviewForUser(userId: string, now = new Date(), walletId?: string) {
    const currentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
    const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

    if (walletId) await WalletService.requireActiveForUser(userId, walletId)
    const walletFilter = walletId ? Prisma.sql`AND t.wallet_id = ${walletId}::uuid` : Prisma.empty

    const rows = await prisma.$queryRaw<MonthlyAnalyticsRow[]>(Prisma.sql`
      SELECT
        date_trunc('month', t.date) AS month,
        t.type::text AS type,
        SUM(t.amount) AS amount
      FROM "transaction" AS t
      WHERE t.user_id = ${userId}::uuid
        AND t.date >= ${from}
        AND t.date < ${to}
        ${walletFilter}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `)

    const valuesByMonth = new Map<string, { income: Prisma.Decimal; expense: Prisma.Decimal }>()
    rows.forEach((row) => {
      const key = `${row.month.getUTCFullYear()}-${row.month.getUTCMonth()}`
      const values = valuesByMonth.get(key) ?? {
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
      }

      if (row.type === 'INCOME') values.income = new Prisma.Decimal(row.amount)
      if (row.type === 'EXPENSE') values.expense = new Prisma.Decimal(row.amount)
      valuesByMonth.set(key, values)
    })

    let totalIncome = new Prisma.Decimal(0)
    let totalExpense = new Prisma.Decimal(0)
    const months = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1))
      const key = `${month.getUTCFullYear()}-${month.getUTCMonth()}`
      const values = valuesByMonth.get(key) ?? {
        income: new Prisma.Decimal(0),
        expense: new Prisma.Decimal(0),
      }

      totalIncome = totalIncome.plus(values.income)
      totalExpense = totalExpense.plus(values.expense)

      return {
        month: month.toISOString(),
        income: values.income.toFixed(2),
        expense: values.expense.toFixed(2),
        balance: values.income.minus(values.expense).toFixed(2),
      }
    })

    return {
      months,
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: totalIncome.minus(totalExpense).toFixed(2),
      period: {
        from: from.toISOString(),
        to: to.toISOString(),
        currentMonth: currentMonth.toISOString(),
      },
    }
  }

  static async getForUser(
    userId: string,
    filters: { type: TransactionType; walletId?: string; from?: Date; to?: Date },
  ) {
    if (filters.walletId) await WalletService.requireActiveForUser(userId, filters.walletId)
    const where: Prisma.TransactionWhereInput = {
      userId,
      type: filters.type,
      ...(filters.walletId && { walletId: filters.walletId }),
      ...((filters.from || filters.to) && {
        date: {
          ...(filters.from && { gte: filters.from }),
          ...(filters.to && { lt: filters.to }),
        },
      }),
    }

    const [groups, totalAggregate, transactionCount] = await prisma.$transaction([
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.count({ where }),
    ])

    const categoryIds = groups.map((group) => group.categoryId)
    const categories = categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: {
            id: true,
            userId: true,
            name: true,
            type: true,
            color: true,
            emoji: true,
          },
        })
      : []
    const categoriesById = new Map(categories.map((category) => [category.id, category]))
    const total = totalAggregate._sum.amount ?? new Prisma.Decimal(0)

    const categoryItems = groups.flatMap((group) => {
      const category = categoriesById.get(group.categoryId)
      const amount = group._sum.amount
      if (!category || !amount) return []

      return [{
        category,
        amount: amount.toFixed(2),
        transactionCount: group._count._all,
        percentage: total.isZero()
          ? 0
          : amount.dividedBy(total).times(100).toDecimalPlaces(1).toNumber(),
      }]
    })

    return {
      type: filters.type,
      total: total.toFixed(2),
      transactionCount,
      categories: categoryItems,
      period: {
        from: filters.from?.toISOString() ?? null,
        to: filters.to?.toISOString() ?? null,
      },
    }
  }
}
