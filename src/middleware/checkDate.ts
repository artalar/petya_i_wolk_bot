import { Context, NextFunction } from 'grammy';

export async function checkMessageDate(ctx: Context, next: NextFunction) {
  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    const messageDate = new Date(ctx.callbackQuery.message.date * 1000);
    const now = new Date();
    
    // Convert both to MSK strings YYYY-MM-DD
    const msgDateStr = messageDate.toLocaleString("en-US", { timeZone: "Europe/Moscow" }).split(',')[0];
    const nowDateStr = now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }).split(',')[0];

    if (msgDateStr !== nowDateStr) {
      await ctx.answerCallbackQuery("Этот заказ устарел. Пожалуйста, начните новый командой /start");
      await ctx.reply("Этот заказ устарел. Пожалуйста, начните новый командой /start");
      return;
    }
  }
  return next();
}

