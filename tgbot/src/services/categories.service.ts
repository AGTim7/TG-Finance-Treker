import type { TransactionType } from '../../generated/prisma/enums'

import { prisma } from '../prisma/client'

export class CategoryServiceError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message)
    this.name = 'CategoryServiceError'
  }
}

export class CategoryService {
  static async getAvailableForUser(userId: string, type?: TransactionType) {
    return prisma.category.findMany({
      where: {
        archivedAt: null,
        OR: [{ userId: null }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ userId: 'desc' }, { type: 'asc' }, { name: 'asc' }],
    })
  }

  static async createForUser(userId: string, data: {
    name: string
    type: TransactionType
    emoji: string
    color: string
  }) {
    const customCount = await prisma.category.count({ where: { userId, archivedAt: null } })
    if (customCount >= 50) throw new CategoryServiceError('Category limit reached', 409)

    const duplicate = await prisma.category.findFirst({
      where: {
        archivedAt: null,
        type: data.type,
        name: { equals: data.name, mode: 'insensitive' },
        OR: [{ userId: null }, { userId }],
      },
    })
    if (duplicate) throw new CategoryServiceError('Category with this name already exists', 409)

    return prisma.category.create({ data: { userId, ...data } })
  }

  static async updateForUser(userId: string, categoryId: string, data: {
    name?: string
    emoji?: string
    color?: string
  }) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, archivedAt: null },
    })
    if (!category) throw new CategoryServiceError('Custom category not found', 404)

    if (data.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          id: { not: categoryId },
          archivedAt: null,
          type: category.type,
          name: { equals: data.name, mode: 'insensitive' },
          OR: [{ userId: null }, { userId }],
        },
      })
      if (duplicate) throw new CategoryServiceError('Category with this name already exists', 409)
    }

    return prisma.category.update({ where: { id: categoryId }, data })
  }

  static async archiveForUser(userId: string, categoryId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, archivedAt: null },
      select: { id: true },
    })
    if (!category) throw new CategoryServiceError('Custom category not found', 404)
    await prisma.category.update({ where: { id: categoryId }, data: { archivedAt: new Date() } })
  }
}
