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
}