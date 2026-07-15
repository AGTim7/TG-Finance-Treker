import type {
  ConversationData,
  ConversationStorage,
  VersionedState,
} from '@grammyjs/conversations'
import type { Prisma } from '../../generated/prisma/client'

import { prisma } from '../prisma/client'
import type { MyContext } from '../types/context'

export const conversationStorage = {
  type: 'key',
  version: 1,
  prefix: 'conversation:',
  adapter: {
    async read(key: string) {
      const record = await prisma.botConversation.findUnique({
        where: { chatId: key },
        select: { state: true },
      })

      return record?.state as unknown as VersionedState<ConversationData> | undefined
    },
    async write(key: string, state: VersionedState<ConversationData>) {
      const jsonState = state as unknown as Prisma.InputJsonValue

      await prisma.botConversation.upsert({
        where: { chatId: key },
        create: { chatId: key, state: jsonState },
        update: { state: jsonState },
      })
    },
    async delete(key: string) {
      await prisma.botConversation.deleteMany({ where: { chatId: key } })
    },
  },
} satisfies ConversationStorage<MyContext, ConversationData>
