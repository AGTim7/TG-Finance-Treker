import { Composer } from 'grammy'

import type { MyContext } from '../../types/context'
import { UserService } from '../../services/users.service'
import getStartMessage from '../../content/botTexts'

export const handleStart = new Composer<MyContext>()

handleStart.command('start', async (ctx) => {
  const telegramId = ctx.from?.id.toString()
  const username = ctx.from?.username

  if (!telegramId) {
    await ctx.reply('Не удалось получить ваш Telegram ID.')
    return
  }

  try {
    await UserService.upsertTelegramUser(telegramId, username)
    await ctx.reply(getStartMessage(username))
  } catch (error) {
    console.error('Failed to handle /start:', error)
    await ctx.reply('Не удалось обработать команду. Попробуйте позже.')
  }
})
