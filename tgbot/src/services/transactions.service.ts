import { prisma } from '../prisma/client'
import { Prisma } from '@prisma/client'; 
import type { TransactionModel } from '../../generated/prisma/models/Transaction'

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
}