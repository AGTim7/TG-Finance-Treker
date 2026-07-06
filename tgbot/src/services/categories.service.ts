import { prisma } from '../prisma/client'
import { Prisma } from '@prisma/client';
import type {CategoryModel} from '../../generated/prisma/models/Category' 

export class CategoryService{
  static async getBasicCategories(): Promise<CategoryModel[]|null>{
    try{
      const categoryList = await prisma.category.findMany({
        where:{ userId: null}
        
      })
      return categoryList
    }catch(error){
      console.log("Не получилось запросить базовые категории:", error)
      return null
    }
  }

  static async getByUserId(
    userId: string
  ): Promise<CategoryModel[]|null>{
    try{
      const categoryList = await prisma.category.findMany({
        where:{ userId: userId}
      })
      return categoryList
    }catch(error){
      console.log("Не получилось запросить базовые категории:", error)
      return null
    }
  }
}