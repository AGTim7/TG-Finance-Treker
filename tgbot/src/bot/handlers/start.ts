import bot from '../index' 
import {Composer} from 'grammy'
import {UserService} from '../../services/users.service'
import getStartMessage from '../../content/botTexts'


export const handleStart = new Composer();

handleStart.command("start", async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  const username = ctx.from?.username;

  if (!telegramId) {
    return ctx.reply("Ошибка: Не удалось получить ваш Telegram ID.");
  }

  try{
    const {user, isNew} = await UserService.handleStartCommand(telegramId, username);
      await ctx.reply(getStartMessage(username))
  } catch (error) {
    ctx.reply("Ошибка: Не удалось обработать команду.");
  }

});