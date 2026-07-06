import { prisma } from '../prisma/client'
import type { UserModel } from '../../generated/prisma/models/User'

export class UserService {
  static async handleStartCommand(
    telegramId: string, 
    username: string | undefined
    ): Promise<void> {
    
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: telegramId },
    });

    if (!existingUser) {
      await prisma.user.create({
        data: {
          telegramId: telegramId,
          username: username,
          currency: 'RUB',
        },
      });
      return
    }

    if (existingUser.username !== username) {
        await prisma.user.update({
        where: { telegramId: telegramId },
        data: { username: username },
      });
    }
  }

  static async findUserUUID(
    telegramId: string
  ): Promise<string|never>{
    try{
      const user = await prisma.user.findUnique({
        where:{telegramId: telegramId},
        select:{id: true},
      })

      if (!user) {
        throw new Error(`Пользователь с telegramId ${telegramId} не найден`);
      }

      return user.id;
    }catch(error){
      console.log("Ошибка при получении id пользователя: ", error)
      throw error
    }
  }
}