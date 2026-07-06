import { Bot, Composer, GrammyError, HttpError } from "grammy";
import {conversations} from '@grammyjs/conversations'
import dotenv from "dotenv";
import {handleStart} from './handlers/start'
import { handleIncomeCommand } from "./handlers/income";
import { MyContext } from '../types/context'


dotenv.config()
const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("Ошибка: Переменная BOT_TOKEN не задана в файле .env");
}
const bot = new Bot<MyContext>(token);
bot.use(conversations());



export const handlers = new Composer<MyContext>();
handlers.use(handleStart);
handlers.use(handleIncomeCommand)

bot.use(handlers)



async function setBotCommands() {
  await bot.api.setMyCommands([
    { command: 'start', description: '📊 Посмотреть инструкцию'},
    { command: 'income', description: '💰 Добавить доход' },
    { command: 'expense', description: '💸 Добавить расход' },
  ], {
    language_code: 'ru' 
  });
}

setBotCommands().catch(console.error);


bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Ошибка при обработке апдейта ${ctx.update.update_id}:`);
  
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Ошибка в Telegram API:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Ошибка сети:', e.message);
  } else {
    console.error('Неизвестная ошибка:', e);
  }
});


export default bot