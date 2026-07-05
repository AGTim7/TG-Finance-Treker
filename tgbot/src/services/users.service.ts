import { prisma } from '../prisma/client'
import type { UserModel } from '../../generated/prisma/models/User'

export class UserService {
  static async handleStartCommand(
    telegramId: string, 
    username: string | undefined
  ): Promise<{ user: UserModel; isNew: boolean }> {
    
    const existingUser = await prisma.user.findUnique({
      where: { telegramId: telegramId },
    });

    if (!existingUser) {
      const newUser = await prisma.user.create({
        data: {
          telegramId: telegramId,
          username: username,
          currency: 'RUB',
        },
      });
      return { user: newUser, isNew: true };
    }

    if (existingUser.username !== username) {
      const updatedUser = await prisma.user.update({
        where: { telegramId: telegramId },
        data: { username: username },
      });
      return { user: updatedUser, isNew: false };
    }

    return { user: existingUser, isNew: false };
  }
}