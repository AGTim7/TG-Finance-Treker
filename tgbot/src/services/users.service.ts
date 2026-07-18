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
        wallets: {
          create: [
            {
              name: 'Банковский',
              kind: 'BANK',
              emoji: '💳',
              color: '#2481CC',
              isDefault: true,
            },
            {
              name: 'Наличные',
              kind: 'CASH',
              emoji: '💵',
              color: '#31B56A',
            },
          ],
        },
      },
      select: {
        id: true,
        telegramId: true,
        username: true,
      },
    })

    const activeWallets = await prisma.wallet.findMany({
      where: { userId: user.id, archivedAt: null },
      select: { kind: true, isDefault: true },
    })
    const existingKinds = new Set(activeWallets.map((wallet) => wallet.kind))
    const hasDefault = activeWallets.some((wallet) => wallet.isDefault)
    const missingWallets = [
      ...(!existingKinds.has('BANK') ? [{
        userId: user.id,
        name: 'Банковский',
        kind: 'BANK' as const,
        emoji: '💳',
        color: '#2481CC',
        isDefault: !hasDefault,
      }] : []),
      ...(!existingKinds.has('CASH') ? [{
        userId: user.id,
        name: 'Наличные',
        kind: 'CASH' as const,
        emoji: '💵',
        color: '#31B56A',
        isDefault: false,
      }] : []),
    ]
    if (missingWallets.length > 0) {
      await prisma.wallet.createMany({ data: missingWallets, skipDuplicates: true })
    }
    if (!hasDefault && existingKinds.has('BANK')) {
      await prisma.wallet.updateMany({
        where: { userId: user.id, kind: 'BANK', archivedAt: null },
        data: { isDefault: true },
      })
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      username: user.username ?? undefined,
    }
  }
}
