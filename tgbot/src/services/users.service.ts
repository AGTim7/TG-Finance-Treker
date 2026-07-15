import { prisma } from '../prisma/client'

export class UserService {
  static async upsertTelegramUser(telegramId: string, username?: string) {
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: { username: username ?? null },
      create: {
        telegramId,
        username,
        currency: 'RUB',
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
      },
    })

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username ?? undefined,
    }
  }
}
