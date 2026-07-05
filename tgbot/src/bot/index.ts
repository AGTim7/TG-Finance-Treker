import { Bot, Composer } from "grammy";
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


bot.on("message", (ctx) => ctx.reply("Got anoer message!"));

bot.use(handlers)

export default bot