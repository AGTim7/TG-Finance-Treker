import { prisma } from '../prisma/client'
import { Prisma } from '@prisma/client'; 
import type { TransactionModel } from '../../generated/prisma/models/Transaction'

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
  static async create(userId: string, data: {
    categoryId: string;
    amount: Prisma.Decimal;
    description?: string;
  }): Promise<void> {
    if (data.amount.toNumber() <= 0) {
      throw new Error('Сумма транзакции должна быть больше нуля');
    }  
    
    await prisma.$transaction(async (tx)=>{
      
      const category = await tx.category.findUnique({
        where: { id: data.categoryId }
      });
      
      if (!category){
        throw new Error('Категория не найдена! Без категории транкзация не может существовать');
      }else{
        await tx.transaction.create({
          data:{
            userId,
            categoryId: data.categoryId,
            amount: data.amount,
            description: data.description
          }
        })
      }
    })
    
  }

  static async createForUser(userId: string, data: {
    categoryId: string
    amount: Prisma.Decimal
    description?: string
  }) {
    if (data.amount.lessThanOrEqualTo(0)) {
      throw new TransactionServiceError('amount must be greater than zero', 400)
    }

    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [{ userId: null }, { userId }],
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

  static async getPageByUserId(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit

    const [items, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: { userId },
        include: { category: true },
        orderBy: [{ date: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ])

    return {
      items,
      page,
      limit,
      total,
      hasMore: page * limit < total,
    }
  }
}
