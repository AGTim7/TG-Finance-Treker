import { Composer, InlineKeyboard } from 'grammy'
import { createConversation } from '@grammyjs/conversations'
import { Prisma } from '@prisma/client'

import { MyContext, MyConversation, MyConversationContext } from '../../types/context'
import type { CategoryModel } from '../../../generated/prisma/models/Category' 
import type { TransactionType } from '../../../generated/prisma/enums'

import { UserService } from '../../services/users.service'
import { CategoryService } from '../../services/categories.service'
import { TransactionService } from '../../services/transactions.service'

export const handleExpenseCommand = new Composer<MyContext>()

export async function expenseConversation(conversation: MyConversation, ctx: MyConversationContext) {

  const userTelegramId = ctx.from?.id.toString()
  const transactionType: TransactionType = "EXPENSE"
  let categoriesList: CategoryModel[] = []
  const keyboard = new InlineKeyboard();
  
  if (!userTelegramId) {
    console.log('Не найден пользователь')
    return
  }

  await ctx.reply("💰 Введите сумму расхода (например, 5000):")
  const amountCtx = await conversation.waitFor("message:text");
  const amountNum = parseFloat(amountCtx.msg.text)

  if (isNaN(amountNum) || amountNum <= 0) {
    await ctx.reply("❌ Некорректная сумма. Процесс отменен. Попробуйте снова: /expense")
    return
  }

  try {
    categoriesList = (await CategoryService.getBasicCategories()) || []
  } catch (error) {
    console.log('Не найдено категорий', error)
  }

  // Фильтруем и строим инлайн-кнопки
  categoriesList
    .filter((item) => item.type === transactionType)
    .forEach((category, index) => {
      keyboard.text(`${category.emoji} ${category.name}`, `cat:${category.id}`)

      if ((index + 1) % 2 === 0) {
        keyboard.row();
      }
    })
  
  await ctx.reply('Нажмите на нужную категорию:', { reply_markup: keyboard });

  const callbackCtx = await conversation.waitForCallbackQuery(/^cat:/);
  const selectedCategoryId = callbackCtx.callbackQuery.data.replace('cat:', '');
  await callbackCtx.answerCallbackQuery();

  try {
    const userUUID = await UserService.findUserUUID(userTelegramId)
    await TransactionService.create(userUUID, {
      categoryId: selectedCategoryId, 
      amount: new Prisma.Decimal(amountNum)
    })

    await ctx.reply(`✅ Успешно добавлено: -${amountNum} ₽`);
  } catch (error: any) {
    console.error('Ошибка при сохранении транзакции:', error)
    await ctx.reply(`❌ Ошибка при сохранении: ${error.message}`)
  }
}

handleExpenseCommand.use(createConversation(expenseConversation, "expenseConversation"))

handleExpenseCommand.command('expense', async (ctx) => {
  await ctx.conversation.enter("expenseConversation")
});