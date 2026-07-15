import { createConversation } from '@grammyjs/conversations'
import { Composer } from 'grammy'

import type { MyContext, MyConversation, MyConversationContext } from '../../types/context'
import { runTransactionConversation } from './transactionConversation'

export const handleIncomeCommand = new Composer<MyContext>()

async function incomeConversation(
  conversation: MyConversation,
  ctx: MyConversationContext,
) {
  await runTransactionConversation(conversation, ctx, {
    type: 'INCOME',
    command: '/income',
    label: 'дохода',
    sign: '+',
  })
}

handleIncomeCommand.use(createConversation(incomeConversation, 'incomeConversation'))
handleIncomeCommand.command('income', async (ctx) => {
  await ctx.conversation.enter('incomeConversation')
})
