import { conversations } from '@grammyjs/conversations'
import { Bot, Composer, GrammyError, HttpError } from 'grammy'

import type { MyContext } from '../types/context'
import { env } from '../config/env'
import { conversationStorage } from './conversationStorage'
import { handleExpenseCommand } from './handlers/expense'
import { handleIncomeCommand } from './handlers/income'
import { handleStart } from './handlers/start'

const bot = new Bot<MyContext>(env.BOT_TOKEN)
bot.use(conversations({ storage: conversationStorage }))

export const handlers = new Composer<MyContext>()
handlers.use(handleStart)
handlers.use(handleIncomeCommand)
handlers.use(handleExpenseCommand)
bot.use(handlers)

bot.catch((error) => {
  const ctx = error.ctx
  console.error(`Failed to process Telegram update ${ctx.update.update_id}:`)

  if (error.error instanceof GrammyError) {
    console.error('Telegram API error:', error.error.description)
  } else if (error.error instanceof HttpError) {
    console.error('Telegram network error:', error.error.message)
  } else {
    console.error('Unknown Telegram error:', error.error)
  }
})

export const BOT_COMMANDS = [
    { command: 'start', description: 'Посмотреть инструкцию' },
    { command: 'income', description: 'Добавить доход' },
    { command: 'expense', description: 'Добавить расход' },
] as const

export async function configureBotCommands() {
  await bot.api.setMyCommands([...BOT_COMMANDS], { language_code: 'ru' })
}

export async function startBot() {
  await configureBotCommands()

  await bot.start({
    onStart: () => console.log('Bot started'),
  })
}

export default bot
