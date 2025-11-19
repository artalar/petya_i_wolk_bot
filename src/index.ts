import { Bot } from 'grammy';
import { bot } from './bot.js';
import { logger } from './logger.js';

async function bootstrap() {
  try {
    await bot.init();
    logger.info(`Bot started as @${bot.botInfo.username}`);
    await bot.start();
  } catch (error) {
    logger.error(error, "Error starting bot");
    process.exit(1);
  }
}

bootstrap();

