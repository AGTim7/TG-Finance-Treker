import { Bot, Composer, GrammyError, HttpError } from "grammy";
import dotenv from "dotenv";
import {handleStart} from './handlers/start'


dotenv.config()
const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("Ошибка: Переменная BOT_TOKEN не задана в файле .env");
}
const bot = new Bot(token);


export const handlers = new Composer();
handlers.use(handleStart);

bot.use(handlers)

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