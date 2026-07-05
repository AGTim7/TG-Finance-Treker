import bot from '../index' 
import {Composer} from 'grammy'
import {UserService} from '../../services/users.service'

export const handleStart = new Composer();

handleStart.command("start", async (ctx) => {
  const telegramId = ctx.from?.id.toString();
  const username = ctx.from?.username;

  if (!telegramId) {
    return ctx.reply("Ошибка: Не удалось получить ваш Telegram ID.");
  }

  try{
    const {user, isNew} = await UserService.handleStartCommand(telegramId, username);
    if (isNew) {
      await ctx.reply(`Рад знакомству, ${username || 'пользователь'}! Вы успешно зарегистрированы. 🎉`);
    } else {
      await ctx.reply("Вы уже зарегистрированы в системе! Рады видеть вас снова. 👋");
    }
  } catch (error) {
    ctx.reply("Ошибка: Не удалось обработать команду.");
  }

});