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

  let orderCompleted = false;

  try {
    await ctx.reply("Отличный выбор! Теперь давайте определимся с объемом!");

    const availableVolumes = VOLUMES.filter(vol => currentOrder.drink?.prices[vol.value] !== undefined);
    
    if (availableVolumes.length === 0) {
      log.error({ drinkId: currentOrder.drink.id }, "No available volumes for drink");
      await ctx.reply("Ошибка: для этого напитка не указаны доступные объемы");
      return;
    }

    const volumeKeyboard = new InlineKeyboard();
    availableVolumes.forEach((vol) => {
      volumeKeyboard.text(vol.label, `volume:${vol.value}`).row();
    });

    const volumeMessage = await ctx.reply("Выберите объем:", {
      reply_markup: volumeKeyboard,
    });

    log.info("Volume selection message sent, waiting for callback query");
    log.debug("Calling waitForCallbackQuery");
    const volumeCtx = await conversation.waitForCallbackQuery(/^volume:(0\.2|0\.3|0\.4)$/);
    log.info({ data: volumeCtx.callbackQuery.data, callbackQueryId: volumeCtx.callbackQuery.id }, "Volume callback query received");

    await volumeCtx.answerCallbackQuery();
    try {
      await volumeCtx.api.deleteMessage(ctx.chat.id, volumeMessage.message_id);
    } catch (error) {
      log.debug({ error: error instanceof Error ? error.message : String(error) }, "Failed to delete volume message");
    }

    const selectedVolume = volumeCtx.callbackQuery.data.split(":")[1] as "0.2" | "0.3" | "0.4";

    log.info({ volume: selectedVolume }, "Volume selected");

    await conversation.external((ctx) => {
      if (!ctx.session.currentOrder) {
        ctx.session.currentOrder = {};
      }
      ctx.session.currentOrder.volume = selectedVolume;
    });

    const drinkCategory = currentOrder.drink.category;
    const milkRelevantCategories = ['milk', 'non-coffee', 'signature'];

    if (milkRelevantCategories.includes(drinkCategory)) {
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
      try {
        await milkCtx.api.deleteMessage(ctx.chat.id, milkMessage.message_id);
      } catch (error) {
        log.debug({ error: error instanceof Error ? error.message : String(error) }, "Failed to delete milk message");
      }

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
    } else {
      log.debug({ drinkCategory }, "Skipping alternative milk selection for this drink category");
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
    try {
      await syrupCtx.api.deleteMessage(ctx.chat.id, syrupMessage.message_id);
    } catch (error) {
      log.debug({ error: error instanceof Error ? error.message : String(error) }, "Failed to delete syrup message");
    }

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
      throw new Error("Missing required order data");
    }

    const orderId = `${ctx.from.id}-${Date.now()}`;

    const order = createOrder(
      ctx.from.id,
      ctx.chat.id,
      orderId,
      ctx.from.first_name,
      ctx.from.last_name,
      ctx.from.username,
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

    orderCompleted = true;
    log.info({ orderId: order.id }, "Order conversation completed");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Error during order conversation"
    );
    await ctx.reply("Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз.");
    throw error;
  } finally {
    if (!orderCompleted) {
      await conversation.external((ctx) => {
        ctx.session.currentOrder = undefined;
      });
      log.debug("Cleaned up incomplete order from session");
    }
  }
}

