import { Context, NextFunction } from 'grammy';
import { getSettings } from '../db.js';
import { config } from '../config.js';
import { logger } from '../logger.js';

export async function checkBotStatus(ctx: Context, next: NextFunction) {
  const settings = await getSettings();

  if (settings.isBotActive) {
    return next();
  }

  // If bot is inactive, allow admins to bypass
  if (String(ctx.chat?.id) === config.adminGroupId) {
    return next();
  }

  // Respond with placeholder
  if (ctx.message || ctx.callbackQuery) {
    try {
      if (ctx.callbackQuery) {
         await ctx.answerCallbackQuery({ text: "Работа бота временно приостановлена", show_alert: true });
      } else {
         await ctx.reply("Работа бота временно приостановлена");
      }
    } catch (err) {
      logger.error({ err }, "Failed to send inactive message");
    }
  }
}

