import { Bot } from "grammy";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("Ошибка: Переменная BOT_TOKEN не задана в файле .env");
}

const bot = new Bot(token);




bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

bot.on("message", (ctx) => ctx.reply("Got another message!"));

export default bot