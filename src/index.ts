import { Bot, session, MemorySessionStorage } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { botConfig } from "./config/bot";
import { logger } from "./logger";
import { loggingMiddleware } from "./logger/middleware";
import { MyContext, Session } from "./types/context";
import { createMainMenu } from "./menus/main";
import { orderConversation } from "./conversations/order";
import { InlineKeyboard } from "grammy";
import { TIMINGS } from "./config/menu";
import { sendOrderToGroup, notifyOrderCreated } from "./utils/notify";
import { groupMessageLogger } from "./middleware/groupMessageLogger";

const bot = new Bot<MyContext>(botConfig.botToken);

const initialSession = (): Session => ({
  currentOrder: undefined,
  lastOrder: undefined,
});

// TODO: Replace MemorySessionStorage with persistent storage for production
// MemorySessionStorage loses all data on bot restart. Users will lose their
// in-progress orders and order history. Consider using:
// - @grammyjs/storage-redis for Redis
// - @grammyjs/storage-file for file-based storage (simple but not scalable)
// - @grammyjs/storage-mongodb for MongoDB
// - Custom adapter for PostgreSQL/MySQL
bot.use(
  session({
    initial: initialSession,
    storage: new MemorySessionStorage(),
  })
);

bot.use(conversations());

bot.use(createConversation(orderConversation, "order-conversation"));

bot.use(loggingMiddleware);

const mainMenu = createMainMenu();

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

  await ctx.reply("Привет! Что вам приготовить? ☕", {
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
3. Укажите объем (0.2л, 0.3л, 0.4л)
4. При необходимости выберите альтернативное молоко
5. При необходимости добавьте сироп
6. Оплатите заказ по ссылке
7. Укажите время, когда вы придете за заказом

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

bot.callbackQuery(/^check_payment:(.+)$/, async (ctx) => {
  const log = logger.child({
    action: "check_payment",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  const orderId = ctx.match[1];
  log.info({ orderId }, "Payment check requested");

  // TODO: Implement actual payment verification
  // Currently, this handler always assumes payment is successful without checking
  // with the payment provider API. This is a CRITICAL SECURITY ISSUE.
  // Integrate with your payment provider (e.g., Stripe, YooKassa, etc.) to verify
  // that the payment for this order ID was actually completed before proceeding.

  const session = ctx.session;
  const lastOrder = session.lastOrder;

  if (!lastOrder || lastOrder.id !== orderId) {
    log.warn({ orderId, hasLastOrder: !!lastOrder }, "Order not found in session");
    await ctx.answerCallbackQuery({
      text: "Ошибка: заказ не найден",
    });
    await ctx.reply("Ошибка: заказ не найден. Пожалуйста, создайте новый заказ.");
    return;
  }

  if (!ctx.from || !ctx.chat) {
    log.warn("Missing user or chat information");
    await ctx.answerCallbackQuery({
      text: "Ошибка системы",
    });
    await ctx.reply("Ошибка: не удалось определить пользователя");
    return;
  }

  const isDevelopment = process.env.NODE_ENV === "development";

  if (isDevelopment) {
    log.warn({ orderId: lastOrder.id }, "DEV MODE: Auto-approving payment without verification");
    await ctx.answerCallbackQuery({
      text: "✅ [DEV] Оплата подтверждена автоматически",
    });
  } else {
    log.info({ orderId: lastOrder.id }, "Payment check successful, showing timing selection");
    await ctx.answerCallbackQuery({
      text: "Оплата подтверждена!",
    });
  }


  const timingKeyboard = new InlineKeyboard();
  TIMINGS.forEach((timing) => {
    timingKeyboard.text(timing.label, `timing:${lastOrder.id}:${timing.minutes}`).row();
  });

  await ctx.reply("Отлично, оплата прошла! Уже начинать готовить?", {
    reply_markup: timingKeyboard,
  });
});

bot.callbackQuery(/^timing:(.+):(\d+)$/, async (ctx) => {
  const log = logger.child({
    action: "timing_selected",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  const orderId = ctx.match[1];
  const minutes = parseInt(ctx.match[2], 10);

  log.info({ orderId, minutes }, "Timing selected");

  await ctx.answerCallbackQuery({
    text: "Время сохранено!",
  });

  const timing = TIMINGS.find((t) => t.minutes === minutes);

  if (!timing) {
    log.warn({ minutes }, "Timing not found");
    await ctx.reply("Ошибка: время не найдено");
    return;
  }

  if (!ctx.from || !ctx.chat) {
    log.warn("Missing user or chat information");
    await ctx.reply("Ошибка: не удалось определить пользователя");
    return;
  }

  const session = ctx.session;
  const lastOrder = session.lastOrder;

  if (!lastOrder || lastOrder.id !== orderId) {
    log.warn({ orderId, hasLastOrder: !!lastOrder }, "Order not found in session");
    await ctx.reply("Ошибка: заказ не найден. Пожалуйста, создайте новый заказ.");
    return;
  }

  lastOrder.timing = timing;
  lastOrder.status = "paid";

  log.info({ orderId: lastOrder.id, timing: timing.label }, "Order completed with timing");

  try {
    await sendOrderToGroup(bot.api, lastOrder);
    await notifyOrderCreated(bot.api, ctx.chat.id, lastOrder.id);
    await ctx.reply("Супер! Ждем ⏰");
    ctx.session.lastOrder = undefined;
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        orderId: lastOrder.id,
      },
      "Failed to send order to group"
    );
    await ctx.reply("Ошибка при отправке заказа. Пожалуйста, попробуйте еще раз.");
  }
});

bot.callbackQuery(/^cancel_order:(.+)$/, async (ctx) => {
  const log = logger.child({
    action: "cancel_order",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  const orderId = ctx.match[1];
  log.info({ orderId }, "Order cancellation requested");

  await ctx.answerCallbackQuery({
    text: "Заказ отменен",
  });

  const session = ctx.session;
  if (session.lastOrder && session.lastOrder.id === orderId) {
    session.lastOrder = undefined;
  }
  session.currentOrder = undefined;

  log.info({ orderId }, "Order cancelled");

  await ctx.reply("Заказ отменен. Вы можете начать новый заказ через /start");
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
