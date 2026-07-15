import type { TransactionType } from '../../generated/prisma/enums'

import { prisma } from '../prisma/client'

export class CategoryService {
  static async getAvailableForUser(userId: string, type?: TransactionType) {
    return prisma.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        ...(type ? { type } : {}),
      },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })
  }
}
