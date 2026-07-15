import { createConversation } from '@grammyjs/conversations'
import { Composer } from 'grammy'

import type { MyContext, MyConversation, MyConversationContext } from '../../types/context'
import { runTransactionConversation } from './transactionConversation'

export const handleExpenseCommand = new Composer<MyContext>()

async function expenseConversation(
  conversation: MyConversation,
  ctx: MyConversationContext,
) {
  await runTransactionConversation(conversation, ctx, {
    type: 'EXPENSE',
    command: '/expense',
    label: 'расхода',
    sign: '-',
  })
}

handleExpenseCommand.use(createConversation(expenseConversation, 'expenseConversation'))
handleExpenseCommand.command('expense', async (ctx) => {
  await ctx.conversation.enter('expenseConversation')
})
