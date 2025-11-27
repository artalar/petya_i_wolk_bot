import { Bot, session, GrammyError, HttpError } from 'grammy';
import { FileAdapter } from '@grammyjs/storage-file';
import { config } from './config.js';
import { Context } from './context.js';
import { logger } from './logger.js';
import { checkWorkHours } from './middleware/checkTime.js';
import { checkMessageDate } from './middleware/checkDate.js';
import { checkBotStatus } from './middleware/checkStatus.js';
import { startOrder } from './orderFlow.js';
import { handleOrderCallback } from './orderCallback.js';
import { showMenu } from './commands/menu.js';
import { showAdminPanel, handleAdminCallback } from './commands/admin.js';
import { SessionData } from './types.js';

export const bot = new Bot<Context>(config.botToken);

// Middleware
bot.use(session({
  initial: (): SessionData => ({}),
  storage: new FileAdapter({ dirName: 'sessions' })
}));

bot.use(checkBotStatus);
bot.use(checkWorkHours);
bot.use(checkMessageDate);

// Logging middleware
bot.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  logger.info({
    update_id: ctx.update.update_id,
    user: ctx.from?.id,
    type: ctx.update.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other',
    duration: ms
  }, 'Update processed');
});

// Commands
bot.command('start', startOrder);
bot.command('menu', showMenu);
bot.command('admin', showAdminPanel);

// Callbacks
bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith('admin_')) {
        return handleAdminCallback(ctx);
    }
    if (data.startsWith('high_load_')) {
        const userId = Number(data.replace('high_load_', ''));
        if (!userId) {
             await ctx.answerCallbackQuery("Ошибка: ID пользователя не найден.");
             return;
        }
        
        try {
            await ctx.api.sendMessage(userId, "Сейчас у нас высокая загрузка, но мы постараемся приготовить ваш заказ в течении 10 минут.");
            await ctx.answerCallbackQuery("Уведомление отправлено пользователю.");
        } catch (e) {
            logger.error({ err: e }, "Failed to send high load notification");
            await ctx.answerCallbackQuery("Ошибка отправки (бот заблокирован?).");
        }
        return;
    }
    return next();
});
bot.on('callback_query:data', handleOrderCallback);

// Handle any messages as comments for steps 2-8
bot.on('message', async (ctx) => {
  const order = ctx.session.currentOrder;
  if (!order) return;
  
  if (order.step >= 2 && order.step <= 8 && order.messageId) {
    let commentText = '';
    
    if (ctx.message.text) {
      commentText = ctx.message.text;
    } else if (ctx.message.caption) {
      commentText = ctx.message.caption;
    } else if (ctx.message.sticker) {
      commentText = '[Стикер]';
    } else if (ctx.message.photo) {
      commentText = '[Фото]';
    } else if (ctx.message.voice) {
      commentText = '[Голосовое сообщение]';
    } else if (ctx.message.video) {
      commentText = '[Видео]';
    } else if (ctx.message.document) {
      commentText = '[Документ]';
    } else if (ctx.message.audio) {
      commentText = '[Аудио]';
    } else {
      commentText = '[Сообщение]';
    }
    
    if (!order.comments) {
      order.comments = [];
    }
    order.comments.push(commentText);
    
    try {
      await ctx.deleteMessage();
    } catch {
      // Ignore if can't delete
    }
    
    const { buildOrderSummary, findItem } = await import('./orderFlow.js');
    const { getSettings } = await import('./db.js');
    const { InlineKeyboard } = await import('grammy');
    const { MENU, SYRUPS, ALT_MILKS } = await import('./consts.js');
    
    let stepMessage = "";
    const keyboard = new InlineKeyboard();
    
    switch (order.step) {
      case 2:
        stepMessage = "Отличный выбор! Какой именно?";
        MENU.black_coffee.forEach((item) => {
          keyboard.text(item.name, `item_${item.id}`).row();
        });
        keyboard.row().text("Назад", "back");
        break;

      case 3:
        stepMessage = "Отличный выбор! Какой именно?";
        MENU.milk_coffee.forEach((item) => {
          keyboard.text(item.name, `item_${item.id}`).row();
        });
        keyboard.row().text("Назад", "back");
        break;

      case 4: {
        stepMessage = "Отличный выбор! Теперь давайте определимся с объемом!";
        const item = findItem(order.itemCode!);
        if (item?.volumes) {
          Object.keys(item.volumes).forEach((vol) => {
            keyboard.text(`${vol} л`, `vol_${vol}`).row();
          });
        }
        keyboard.row().text("Назад", "back");
        break;
      }

      case 5:
        stepMessage = "Отличный выбор! Какой именно?";
        MENU.tea.forEach((item) => {
          keyboard.text(item.name, `item_${item.id}`).row();
        });
        keyboard.row().text("Назад", "back");
        break;

      case 6:
        stepMessage = "Может на альтернативном молоке?";
        keyboard.text("Спасибо, не надо", "milk_none").row();
        ALT_MILKS.forEach((m) => keyboard.text(m, `milk_${m}`).row());
        keyboard.row().text("Назад", "back");
        break;

      case 7:
        stepMessage = "А как насчет сиропа?";
        keyboard.text("Спасибо, не надо", "syrup_none").row();
        SYRUPS.forEach((s) => keyboard.text(s, `syrup_${s}`).row());
        keyboard.row().text("Назад", "back");
        break;

      case 8: {
        stepMessage = "Чудесно! Как будете оплачивать заказ?";
        keyboard.text("➕ Добавить еще напиток", "add_more").row();
        keyboard.text("Оплатить на кассе", "pay_cash").row();

        const settings = await getSettings();
        if (settings.isOnlinePaymentActive) {
          keyboard.text("Оплатить онлайн", "pay_online").row();
        }

        keyboard.row().text("Назад", "back");
        break;
      }
    }
    
    const summary = buildOrderSummary(order);
    const commentHint = "\n\nНам можно написать комментарий к заказу в сообщении 😉";
    
    let fullText = summary;
    if (summary && stepMessage) {
      fullText += "\n\n\n" + stepMessage;
    } else {
      fullText += stepMessage;
    }
    fullText += commentHint;
    
    try {
      await ctx.api.editMessageText(ctx.chat.id, order.messageId, fullText, {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
    } catch {
      // Ignore if can't edit
    }
  }
});

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  logger.error({ err: err.error, update_id: ctx.update.update_id }, `Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error({ description: e.description }, "Error in request");
  } else if (e instanceof HttpError) {
    logger.error({ err: e }, "Could not contact Telegram");
  } else {
    logger.error({ err: e }, "Unknown error");
  }
});

