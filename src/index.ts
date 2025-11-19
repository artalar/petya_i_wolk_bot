import { Bot, session } from "grammy";
import { FileAdapter } from "@grammyjs/storage-file";
import { conversations, createConversation } from "@grammyjs/conversations";
import { botConfig, yooKassaConfig } from "./config/bot";
import { logger } from "./logger";
import { loggingMiddleware } from "./logger/middleware";
import { MyContext, Session } from "./types/context";
import { createMainMenu } from "./menus/main";
import { orderConversation } from "./conversations/order";
import { groupMessageLogger } from "./middleware/groupMessageLogger";
import { yooKassaService } from "./services/yookassa";

// Initialize services
if (yooKassaConfig.shopId && yooKassaConfig.secretKey) {
  yooKassaService.initialize({
    shopId: yooKassaConfig.shopId,
    secretKey: yooKassaConfig.secretKey,
  });
  logger.info("YooKassa service configured");
} else {
  logger.warn(
    "YooKassa credentials not provided - payment functionality will be limited"
  );
}

const bot = new Bot<MyContext>(botConfig.botToken);

const initialSession = (): Session => ({
  currentOrder: undefined,
  lastOrder: undefined,
});

bot.use(
  session({
    initial: initialSession,
    storage: new FileAdapter({ dirName: "sessions" }),
  })
);

bot.use(loggingMiddleware);

bot.use(conversations());

bot.use(createConversation(orderConversation, "order-conversation"));

const mainMenu = createMainMenu();

bot.use(async (ctx, next) => {
  if (ctx.callbackQuery) {
    const data = ctx.callbackQuery.data;
    logger.debug({ callbackData: data, hasConversation: !!ctx.conversation }, "Global callback interceptor");
  }
  await next();
});

bot.use(mainMenu);

if (process.env.NODE_ENV === "development") {
  bot.on("message", groupMessageLogger);
}

bot.command("start", async (ctx) => {
  const log = logger.child({
    action: "start_command",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
  log.info("Start command received");

  await ctx.reply("Привет! 🙌 Что вам приготовить?", {
    reply_markup: mainMenu,
  });
});

bot.command("help", async (ctx) => {
  const log = logger.child({
    action: "help_command",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
  log.info("Help command received");

  const helpText = `
🤖 <b>Помощь по использованию бота</b>

1. Выберите категорию напитка из меню
2. Выберите конкретный напиток
3. Укажите объем (в зависимости от напитка)
4. При необходимости выберите альтернативное молоко
5. При необходимости добавьте сироп
6. Выберите способ оплаты (онлайн или на кассе)
7. Оплатите заказ (онлайн или при получении)
8. Укажите время, когда вы придете за заказом

<b>Команды:</b>
/start - Начать заказ
/menu - Показать меню
/help - Показать эту справку
  `;

  await ctx.reply(helpText, { parse_mode: "HTML" });
});

bot.command("menu", async (ctx) => {
  const log = logger.child({
    action: "menu_command",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
  log.info("Menu command received");

  await ctx.reply("Выберите категорию:", {
    reply_markup: mainMenu,
  });
});


bot.catch((err) => {
  const ctx = err.ctx;
  const error = err.error instanceof Error ? err.error : new Error(String(err.error));
  logger.error(
    {
      error: error.message,
      stack: error.stack,
      userId: ctx.from?.id,
      chatId: ctx.chat?.id,
    },
    "Bot error occurred"
  );
});

bot.start();

logger.info("Bot started successfully");
