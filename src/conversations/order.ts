import { Conversation } from "@grammyjs/conversations";
import { MyContext } from "../types/context";
import { InlineKeyboard } from "grammy";
import { VOLUMES, ALTERNATIVE_MILKS, SYRUPS, TIMINGS } from "../config/menu";
import { getAlternativeMilkById, getSyrupById } from "../config/menu";
import { createOrder } from "../utils/order";
import { logger } from "../logger";
import { Order, Volume } from "../types";
import { yooKassaService } from "../services/yookassa";
import { sendOrderToGroup, notifyOrderCreated } from "../utils/notify";
import { OrderMessage } from "../utils/messageState";

type OrderConversation = Conversation<MyContext, MyContext>;

interface ConversationState {
  orderMessage?: OrderMessage;
  messageId?: number;
  createdOrder?: Order;
}

async function updateOrderMessage(
  ctx: MyContext,
  state: ConversationState,
  keyboard?: InlineKeyboard
) {
  if (!state.orderMessage) {
    throw new Error("OrderMessage not initialized");
  }

  const messageText = state.orderMessage.toMessageString();

  try {
    if (!state.messageId) {
      const message = await ctx.reply(messageText, {
        reply_markup: keyboard,
      });
      state.messageId = message.message_id;
    } else {
      await ctx.api.editMessageText(ctx.chat!.id, state.messageId, messageText, {
        reply_markup: keyboard,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("message is not modified")) {
      logger.debug("Message not modified, skipping update");
    } else {
      logger.warn(
        { error: errorMessage, messageId: state.messageId },
        "Failed to update order message"
      );
    }
  }
}

async function selectVolume(
  conversation: OrderConversation,
  ctx: MyContext,
  state: ConversationState
) {
  const drink = state.orderMessage!.getDrink();
  const availableVolumes = VOLUMES.filter(
    (vol) => drink.prices[vol.value] !== undefined
  );

  if (availableVolumes.length === 0) {
    logger.error({ drinkId: drink.id }, "No available volumes for drink");
    await ctx.reply("Ошибка: для этого напитка не указаны доступные объемы");
    throw new Error("No available volumes");
  }

  if (availableVolumes.length === 1) {
    state.orderMessage!.setVolume(availableVolumes[0].value);
    await updateOrderMessage(ctx, state);
    return;
  }

  const volumeKeyboard = new InlineKeyboard();
  availableVolumes.forEach((vol) => {
    volumeKeyboard.text(vol.label, `volume:${vol.value}`).row();
  });

  state.orderMessage!.setCurrentStep("🔽 Выберите объем:");
  await updateOrderMessage(ctx, state, volumeKeyboard);

  const volumeCtx = await conversation.waitForCallbackQuery(
    /^volume:(0\.042|0\.06|0\.2|0\.3|0\.4)$/
  );
  await volumeCtx.answerCallbackQuery();

  const volume = volumeCtx.callbackQuery.data.split(":")[1] as Volume;
  state.orderMessage!.setVolume(volume);
  state.orderMessage!.setCurrentStep(undefined);
  await updateOrderMessage(ctx, state);
}

async function selectExtras(
  conversation: OrderConversation,
  ctx: MyContext,
  state: ConversationState
) {
  const drink = state.orderMessage!.getDrink();
  if (drink.category !== "milk") {
    return;
  }

  const milkKeyboard = new InlineKeyboard();
  ALTERNATIVE_MILKS.forEach((milk) => {
    milkKeyboard.text(milk.name, `milk:${milk.id}`).row();
  });
  milkKeyboard.text("Спасибо, не надо", "milk:none").row();

  state.orderMessage!.setCurrentStep("🔽 Может на альтернативном молоке?");
  await updateOrderMessage(ctx, state, milkKeyboard);

  const milkCtx = await conversation.waitForCallbackQuery(/^milk:(.+)$/);
  await milkCtx.answerCallbackQuery();

  const selectedMilkId = milkCtx.callbackQuery.data.split(":")[1];
  if (selectedMilkId !== "none") {
    const milk = getAlternativeMilkById(selectedMilkId);
    state.orderMessage!.setAlternativeMilk(milk);
  }

  state.orderMessage!.setCurrentStep(undefined);
  await updateOrderMessage(ctx, state);

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

  state.orderMessage!.setCurrentStep("🔽 А как насчет сиропа?");
  await updateOrderMessage(ctx, state, syrupKeyboard);

  const syrupCtx = await conversation.waitForCallbackQuery(/^syrup:(.+)$/);
  await syrupCtx.answerCallbackQuery();

  const selectedSyrupId = syrupCtx.callbackQuery.data.split(":")[1];
  if (selectedSyrupId !== "none") {
    const syrup = getSyrupById(selectedSyrupId);
    state.orderMessage!.setSyrup(syrup);
  }

  state.orderMessage!.setCurrentStep(undefined);
  await updateOrderMessage(ctx, state);
}

async function processPayment(
  conversation: OrderConversation,
  ctx: MyContext,
  state: ConversationState,
  orderId: string
) {
  if (!state.createdOrder) {
    throw new Error("Order not created before payment");
  }

  const paymentKeyboard = new InlineKeyboard()
    .text("💵 Оплачу на кассе", `pay_cash:${orderId}`)
    .row()
    .url("💳 Оплатить онлайн", state.createdOrder.paymentUrl!)
    .row()
    .text("🔄 Я оплатил", `paid:${orderId}`);

  state.orderMessage!.setCurrentStep("🔽 Выберите способ оплаты:");
  await updateOrderMessage(ctx, state, paymentKeyboard);

  let paymentSuccess = false;

  logger.info({ orderId }, "Starting payment wait loop");

  while (!paymentSuccess) {
    const newCtx = await conversation.wait();

    if (newCtx.callbackQuery?.data) {
      const callbackData = newCtx.callbackQuery.data;
      logger.info({ callbackData, orderId }, "Received callback in payment loop");

      const match = callbackData.match(/^(pay_cash|paid):(.+)$/);

      if (match) {
        const action = match[1];
        const callbackOrderId = match[2];

        if (callbackOrderId === orderId) {
          logger.info({ action, callbackOrderId }, "Callback matched order");

          if (action === "pay_cash") {
            await newCtx.answerCallbackQuery({
              text: "Оплатите на кассе при получении",
            });
            state.orderMessage!.setPaymentMethod("cash");
            state.createdOrder.paymentMethod = "cash";
            state.createdOrder.paymentUrl = undefined;
            state.createdOrder.paymentId = undefined;
            paymentSuccess = true;
          } else if (action === "paid") {
            await newCtx.answerCallbackQuery({ text: "Проверяем оплату..." });

            if (state.createdOrder.paymentId) {
              try {
                const paymentStatus = await conversation.external(() =>
                  yooKassaService.getPaymentStatus(
                    state.createdOrder!.paymentId!
                  )
                );

                logger.info(
                  { status: paymentStatus.status, paid: paymentStatus.paid },
                  "Payment status check result"
                );

                if (
                  paymentStatus.status === "succeeded" ||
                  paymentStatus.paid
                ) {
                  state.orderMessage!.setPaymentMethod("online");
                  paymentSuccess = true;
                } else {
                  state.orderMessage!.setCurrentStep(
                    "❌ Оплата не подтверждена. Пожалуйста, завершите оплату и попробуйте снова."
                  );
                  await updateOrderMessage(ctx, state, paymentKeyboard);
                }
              } catch (error) {
                logger.error({ error }, "Payment check failed");
                state.orderMessage!.setCurrentStep(
                  "⚠️ Не удалось проверить оплату. Попробуйте еще раз или выберите оплату на кассе."
                );
                await updateOrderMessage(ctx, state, paymentKeyboard);
              }
            } else {
              state.orderMessage!.setPaymentMethod("online");
              paymentSuccess = true;
            }
          }
        } else {
          logger.warn(
            { callbackOrderId, expectedOrderId: orderId },
            "Callback order ID mismatch"
          );
        }
      } else {
        logger.debug({ callbackData }, "Callback data did not match regex");
      }
    } else {
      logger.debug(
        { update: newCtx.update },
        "Received non-callback update in payment loop"
      );
    }
  }

  state.orderMessage!.setCurrentStep(undefined);
  await updateOrderMessage(ctx, state);
}

async function selectTiming(
  conversation: OrderConversation,
  ctx: MyContext,
  state: ConversationState
) {
  const timingKeyboard = new InlineKeyboard();
  TIMINGS.forEach((timing) => {
    timingKeyboard.text(timing.label, `timing:${timing.minutes}`).row();
  });

  state.orderMessage!.setCurrentStep("🔽 Уже начинаем готовить?");
  await updateOrderMessage(ctx, state, timingKeyboard);

  const timingCtx = await conversation.waitForCallbackQuery(/^timing:(\d+)$/);
  await timingCtx.answerCallbackQuery({ text: "Время сохранено!" });

  const minutes = parseInt(timingCtx.callbackQuery.data.split(":")[1], 10);
  const timing = TIMINGS.find((t) => t.minutes === minutes);

  if (timing) {
    state.orderMessage!.setTiming(timing);
  }

  if (state.createdOrder && timing) {
    state.createdOrder.timing = timing;
    state.createdOrder.status = "paid";
  }

  state.orderMessage!.setCurrentStep(undefined);
  await updateOrderMessage(ctx, state);
}

export async function orderConversation(
  conversation: Conversation<MyContext, MyContext>,
  ctx: MyContext
) {
  const log = logger.child({
    action: "order_conversation",
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
  });

  const session = await conversation.external((ctx) => ctx.session);
  if (!session.currentOrder?.drink) {
    await ctx.reply("Ошибка: напиток не выбран");
    return;
  }

  if (!ctx.from || !ctx.chat) {
    await ctx.reply("Ошибка: не удалось определить пользователя");
    return;
  }

  const state: ConversationState = {
    orderMessage: new OrderMessage(session.currentOrder.drink),
    messageId: session.orderMessageId,
  };

  try {
    await selectVolume(conversation, ctx, state);

    await selectExtras(conversation, ctx, state);

    const orderId = `${ctx.from.id}-${Date.now()}`;
    state.orderMessage!.setOrderId(orderId);

    const messageState = state.orderMessage!.getState();

    state.createdOrder = await conversation.external(() =>
      createOrder(
        ctx.from!.id,
        ctx.chat!.id,
        orderId,
        ctx.from!.first_name,
        ctx.from!.last_name,
        ctx.from!.username,
        messageState.drink,
        messageState.volume!,
        "online",
        messageState.alternativeMilk,
        messageState.syrup
      )
    );

    await processPayment(conversation, ctx, state, orderId);

    await selectTiming(conversation, ctx, state);

    await conversation.external(async () => {
      try {
        await sendOrderToGroup(ctx.api, state.createdOrder!);
        await notifyOrderCreated(
          ctx.api,
          ctx.chat!.id,
          state.createdOrder!.id,
          state.createdOrder!.paymentMethod
        );
      } catch (e) {
        logger.error({ error: e }, "Failed to send order notifications");
      }

      ctx.session.lastOrder = undefined;
      ctx.session.currentOrder = undefined;
      ctx.session.orderMessageId = undefined;
    });

    await ctx.reply("Супер! Ждем 👍");
    log.info({ orderId }, "Order conversation completed successfully");
  } catch (error) {
    log.error({ error }, "Error in order conversation");
    await ctx.reply(
      "Произошла ошибка при оформлении заказа. Пожалуйста, попробуйте еще раз."
    );

    await conversation.external((ctx) => {
      ctx.session.currentOrder = undefined;
      ctx.session.orderMessageId = undefined;
    });
  }
}
