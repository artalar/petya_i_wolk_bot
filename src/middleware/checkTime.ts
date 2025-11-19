import { Context, NextFunction } from 'grammy';
import { logger } from '../logger.js';
import { config } from '../config.js';

export async function checkWorkHours(ctx: Context, next: NextFunction) {
  // Allow admins to bypass work hours check
  if (String(ctx.chat?.id) === config.adminGroupId) {
    return next();
  }

  const now = new Date();
  // Convert to MSK (UTC+3)
  const mskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  const hours = mskTime.getHours();

  // Work hours: 8 to 21
  if (hours >= 8 && hours < 21) {
    return next();
  }

  // Allow admins or debug mode if needed, but strictly following spec for now
  // Spec: "в другое время на любое действие пользователя отправляется сообщение о нерабочем времени"
  
  // Avoid replying to updates that are not messages or callbacks if possible, but "любое действие" implies all relevant updates
  if (ctx.message || ctx.callbackQuery) {
    try {
       if (ctx.callbackQuery) {
          await ctx.answerCallbackQuery({ text: "Мы сейчас закрыты. Работаем с 8 до 21 по МСК.", show_alert: true });
       } else {
          await ctx.reply("Мы сейчас закрыты. Работаем с 8 до 21 по МСК. Ждем вас завтра! 😴");
       }
    } catch (err) {
      logger.error({ err }, "Failed to send closed message");
    }
  }
}

