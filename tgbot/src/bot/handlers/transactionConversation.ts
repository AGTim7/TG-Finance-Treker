import { InlineKeyboard } from 'grammy'
import type { TransactionType } from '../../../generated/prisma/enums'

import type { MyConversation, MyConversationContext } from '../../types/context'
import { CategoryService } from '../../services/categories.service'
import { TransactionService } from '../../services/transactions.service'
import { UserService } from '../../services/users.service'
import { parseTransactionAmount, TransactionAmountError } from '../../domain/transactionAmount'

type TransactionConversationOptions = {
  type: TransactionType
  command: '/income' | '/expense'
  label: 'дохода' | 'расхода'
  sign: '+' | '-'
}

export async function runTransactionConversation(
  conversation: MyConversation,
  ctx: MyConversationContext,
  options: TransactionConversationOptions,
) {
  const telegramId = ctx.from?.id.toString()
  if (!telegramId) {
    await ctx.reply('Не удалось определить пользователя Telegram.')
    return
  }

  await ctx.reply(`Введите сумму ${options.label} (например, 5000 или 1500,50):`)
  const amountCtx = await conversation.waitFor('message:text')
  const normalizedAmount = amountCtx.msg.text.trim().replace(',', '.')

  let amount
  try {
    amount = parseTransactionAmount(normalizedAmount)
  } catch (error) {
    const message = error instanceof TransactionAmountError
      ? error.message
      : 'invalid amount'
    console.error('Invalid transaction amount:', message)
    await ctx.reply(`Некорректная сумма. Попробуйте снова: ${options.command}`)
    return
  }

  try {
    const user = await conversation.external(() => UserService.upsertTelegramUser(
      telegramId,
      ctx.from?.username,
    ))
    const categories = await conversation.external(() => CategoryService.getAvailableForUser(
      user.id,
      options.type,
    ))

    if (categories.length === 0) {
      await ctx.reply('Категории пока не настроены. Попробуйте позже.')
      return
    }

    const keyboard = new InlineKeyboard()
    categories.forEach((category, index) => {
      keyboard.text(`${category.emoji} ${category.name}`, `cat:${category.id}`)
      if ((index + 1) % 2 === 0) keyboard.row()
    })

    await ctx.reply('Нажмите на нужную категорию:', { reply_markup: keyboard })
    const callbackCtx = await conversation.waitForCallbackQuery(/^cat:/)
    const categoryId = callbackCtx.callbackQuery.data.slice(4)
    const allowedCategoryIds = new Set(categories.map((category) => category.id))

    if (!allowedCategoryIds.has(categoryId)) {
      await callbackCtx.answerCallbackQuery({ text: 'Эта кнопка устарела' })
      await callbackCtx.reply(`Выберите категорию заново: ${options.command}`)
      return
    }

    await callbackCtx.answerCallbackQuery()
    await conversation.external(async () => {
      await TransactionService.createForUser(user.id, {
        categoryId,
        amount,
        expectedType: options.type,
      })
    })

    const formattedAmount = amount.toFixed(2).replace(/\.00$/, '')
    await callbackCtx.reply(`Успешно добавлено: ${options.sign}${formattedAmount} ₽`)
  } catch (error) {
    console.error('Failed to create transaction from bot:', error)
    await ctx.reply('Не удалось сохранить транзакцию. Попробуйте позже.')
  }
}
