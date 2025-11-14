import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../types/context";
import { InlineKeyboard } from "grammy";
import { VOLUMES, ALTERNATIVE_MILKS, SYRUPS } from "../config/menu";
import { getAlternativeMilkById, getSyrupById } from "../config/menu";
import { createOrder, formatOrderMessage } from "../utils/order";
import { logger } from "../logger";

export async function orderConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext
) {
  const log = logger.child({
    action: "order_conversation_started",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });
  log.info("Order conversation started");

  const session = await conversation.external((ctx) => ctx.session);
  const currentOrder = session.currentOrder;

  if (!currentOrder?.drink) {
    log.warn("No drink selected in session");
    await ctx.reply("Ошибка: напиток не выбран");
    return;
  }

  if (!ctx.from || !ctx.chat) {
    log.warn("Missing user or chat information");
    await ctx.reply("Ошибка: не удалось определить пользователя");
    return;
  }

  log.debug({ drinkId: currentOrder.drink.id }, "Starting volume selection");

  await ctx.reply("Отличный выбор! Теперь давайте определимся с объемом!");

  const volumeKeyboard = new InlineKeyboard();
  VOLUMES.forEach((vol) => {
    volumeKeyboard.text(vol.label, `volume:${vol.value}`).row();
  });

  const volumeMessage = await ctx.reply("Выберите объем:", {
    reply_markup: volumeKeyboard,
  });

  const volumeCtx = await conversation.waitForCallbackQuery(/^volume:(0\.2|0\.3|0\.4)$/);

  await volumeCtx.answerCallbackQuery();
  await volumeCtx.api.deleteMessage(ctx.chat.id, volumeMessage.message_id);

  const selectedVolume = volumeCtx.callbackQuery.data.split(":")[1] as "0.2" | "0.3" | "0.4";

  log.info({ volume: selectedVolume }, "Volume selected");

  await conversation.external((ctx) => {
    if (!ctx.session.currentOrder) {
      ctx.session.currentOrder = {};
    }
    ctx.session.currentOrder.volume = selectedVolume;
  });

  log.debug("Starting alternative milk selection");

  const milkKeyboard = new InlineKeyboard();
  ALTERNATIVE_MILKS.forEach((milk) => {
    milkKeyboard.text(milk.name, `milk:${milk.id}`).row();
  });
  milkKeyboard.text("Спасибо, не надо", "milk:none").row();

  const milkMessage = await ctx.reply("Может на альтернативном молоке?", {
    reply_markup: milkKeyboard,
  });

  const milkCtx = await conversation.waitForCallbackQuery(/^milk:(.+)$/);

  await milkCtx.answerCallbackQuery();
  await milkCtx.api.deleteMessage(ctx.chat.id, milkMessage.message_id);

  const selectedMilkId = milkCtx.callbackQuery.data.split(":")[1];

  if (selectedMilkId !== "none") {
    const selectedMilk = getAlternativeMilkById(selectedMilkId);
    if (selectedMilk) {
      log.info({ milkId: selectedMilk.id }, "Alternative milk selected");
      await conversation.external((ctx) => {
        if (!ctx.session.currentOrder) {
          ctx.session.currentOrder = {};
        }
        ctx.session.currentOrder.alternativeMilk = selectedMilk;
      });
    }
  } else {
    log.debug("No alternative milk selected");
  }

  log.debug("Starting syrup selection");

  const syrupKeyboard = new InlineKeyboard();
  const syrupsPerRow = 2;
  for (let i = 0; i < SYRUPS.length; i += syrupsPerRow) {
    const row = SYRUPS.slice(i, i + syrupsPerRow);
    row.forEach((syrup) => {
      syrupKeyboard.text(syrup.name, `syrup:${syrup.id}`);
    });
    syrupKeyboard.row();
  }
  syrupKeyboard.text("Спасибо, не надо", "syrup:none").row();

  const syrupMessage = await ctx.reply("А как насчет сиропа?", {
    reply_markup: syrupKeyboard,
  });

  const syrupCtx = await conversation.waitForCallbackQuery(/^syrup:(.+)$/);

  await syrupCtx.answerCallbackQuery();
  await syrupCtx.api.deleteMessage(ctx.chat.id, syrupMessage.message_id);

  const selectedSyrupId = syrupCtx.callbackQuery.data.split(":")[1];

  if (selectedSyrupId !== "none") {
    const selectedSyrup = getSyrupById(selectedSyrupId);
    if (selectedSyrup) {
      log.info({ syrupId: selectedSyrup.id }, "Syrup selected");
      await conversation.external((ctx) => {
        if (!ctx.session.currentOrder) {
          ctx.session.currentOrder = {};
        }
        ctx.session.currentOrder.syrup = selectedSyrup;
      });
    }
  } else {
    log.debug("No syrup selected");
  }

  const finalSession = await conversation.external((ctx) => ctx.session);
  const finalOrder = finalSession.currentOrder;

  if (!finalOrder?.drink || !finalOrder?.volume) {
    log.error("Missing required order data");
    await ctx.reply("Ошибка: не удалось создать заказ");
    return;
  }

  const orderIdCounter = (finalSession.orderIdCounter || 0) + 1;
  const orderId = orderIdCounter.toString();

  await conversation.external((ctx) => {
    ctx.session.orderIdCounter = orderIdCounter;
  });

  const order = createOrder(
    ctx.from.id,
    ctx.chat.id,
    orderId,
    finalOrder.drink,
    finalOrder.volume,
    finalOrder.alternativeMilk,
    finalOrder.syrup
  );

  log.info({ orderId: order.id, totalPrice: order.totalPrice }, "Order created in conversation");

  const orderMessage = formatOrderMessage(order);

  const orderKeyboard = new InlineKeyboard()
    .url("💳 Оплатить заказ", order.paymentUrl)
    .row()
    .text("🔄 Проверить оплату", `check_payment:${orderId}`)
    .text("❌ Отменить заказ", `cancel_order:${orderId}`);

  await ctx.reply(orderMessage, {
    reply_markup: orderKeyboard,
  });

  await conversation.external((ctx) => {
    ctx.session.lastOrder = order;
    ctx.session.currentOrder = undefined;
  });

  log.info({ orderId: order.id }, "Order conversation completed");
}

