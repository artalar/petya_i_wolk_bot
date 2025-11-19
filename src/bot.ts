import { Bot, session, GrammyError, HttpError } from 'grammy';
import { FileAdapter } from '@grammyjs/storage-file';
import { config } from './config.js';
import { Context } from './context.js';
import { logger } from './logger.js';
import { checkWorkHours } from './middleware/checkTime.js';
import { checkMessageDate } from './middleware/checkDate.js';
import { checkBotStatus } from './middleware/checkStatus.js';
import { startOrder, handleOrderCallback } from './orderFlow.js';
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
    type: ctx.updateType,
    duration: ms
  }, 'Update processed');
});

// Commands
bot.command('start', startOrder);
bot.command('menu', showMenu);
bot.command('admin', showAdminPanel);

// Callbacks
bot.on('callback_query:data', async (ctx, next) => {
    if (ctx.callbackQuery.data.startsWith('admin_')) {
        return handleAdminCallback(ctx);
    }
    return next();
});
bot.on('callback_query:data', handleOrderCallback);

// Error handling
bot.catch((err) => {
  const ctx = err.ctx;
  logger.error({ err: err.error, update_id: ctx.update.update_id }, `Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    logger.error("Error in request:", e.description);
  } else if (e instanceof HttpError) {
    logger.error("Could not contact Telegram:", e);
  } else {
    logger.error("Unknown error:", e);
  }
});

