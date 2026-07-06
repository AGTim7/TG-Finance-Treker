import {Composer} from 'grammy'
import {conversations, createConversation} from '@grammyjs/conversations'
import { MyContext, MyConversation, MyConversationContext } from '../../types/context'

export const handleIncomeCommand = new Composer<MyContext>()

export async function incomeConservation( conversation: MyConversation, ctx: MyConversationContext,){

  await ctx.reply("💰 Введите сумму дохода (например, 5000):")
  const amountCtx = await conversation.waitFor("message:text");
  const amountNum = parseFloat(amountCtx.msg.text)

  if (isNaN(amountNum)|| amountNum <= 0){
    await ctx.reply("❌ Некорректная сумма. Процесс отменен. Попробуйте снова: /доход")
    return
  }

  
}

handleIncomeCommand.use(createConversation(incomeConservation, "incomeConservation"))

handleIncomeCommand.command('income', async (ctx) => {
  await ctx.conversation.enter("incomeConservation")
});