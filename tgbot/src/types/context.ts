import { type Context } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
} from "@grammyjs/conversations";


export type MyContext = ConversationFlavor<Context>;
export type MyConversationContext = Context;
export type MyConversation = Conversation<MyContext, MyConversationContext>;