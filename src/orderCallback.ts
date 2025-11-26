import { Context } from "./context.js";
import { InlineKeyboard } from "grammy";
import { PRICES } from "./consts.js";
import { getNextOrderId } from "./db.js";
import { logger } from "./logger.js";
import { createPayment, checkPayment } from "./services/payment.js";
import { config } from "./config.js";
import {
  findItem,
  buildOrderSummary,
  updateOrderMessage,
} from "./orderFlow.js";

export async function handleOrderCallback(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.session.currentOrder) return;

  const order = ctx.session.currentOrder;

  if (data === "back") {
    switch (order.step) {
      case 2:
      case 3:
      case 5:
        order.step = 1;
        order.categoryName = undefined;
        break;

      case 4: {
        const item = findItem(order.itemCode!);
        if (item?.category === "black_coffee") order.step = 2;
        else if (item?.category === "milk_coffee") order.step = 3;
        else if (item?.category === "not_coffee") order.step = 1;
        order.itemCode = undefined;
        order.price = 0;
        break;
      }

      case 6:
        order.step = 4;
        order.volume = undefined;
        order.price = 0;
        break;

      case 7:
        order.step = 6;
        if (order.milk && order.milk !== "none") {
          order.price -= PRICES.ALT_MILK;
          order.additions = order.additions.filter(
            (a) => !a.startsWith("Молоко")
          );
        }
        order.milk = undefined;
        break;

      case 8: {
        const item8 = findItem(order.itemCode!);
        if (item8?.category === "tea") {
          order.step = 5;
          order.itemCode = undefined;
          order.price = 0;
          order.volume = undefined;
        } else if (item8?.category === "black_coffee") {
          if (["espresso", "espresso_tonic", "bumble"].includes(item8.id)) {
            order.step = 2;
            order.itemCode = undefined;
            order.price = 0;
            order.volume = undefined;
          } else {
            order.step = 4;
            order.volume = undefined;
            order.price = 0;
          }
        } else if (item8?.category === "milk_coffee") {
          order.step = 7;
          if (order.syrup && order.syrup !== "none") {
            order.price -= PRICES.SYRUP;
            order.additions = order.additions.filter(
              (a) => !a.startsWith("Сироп")
            );
          }
          order.syrup = undefined;
        }
        break;
      }

      case 9:
        order.step = 8;
        order.paymentMethod = undefined;
        order.paymentId = undefined;
        order.paymentUrl = undefined;
        break;
    }
    await updateOrderMessage(ctx);
    return;
  }

  if (data === "cat_black") {
    order.step = 2;
    order.categoryName = "Черный кофе";
  } else if (data === "cat_milk") {
    order.step = 3;
    order.categoryName = "Молочный кофе";
  } else if (data === "cat_tea") {
    order.step = 5;
    order.categoryName = "Чай";
  } else if (data.startsWith("item_")) {
    const itemId = data.replace("item_", "");
    order.itemCode = itemId;
    const item = findItem(itemId);

    if (item) {
      if (item.category === "black_coffee") {
        if (["espresso", "espresso_tonic", "bumble"].includes(item.id)) {
          if (item.id === "espresso") order.volume = "0.042";
          else if (item.id === "espresso_tonic") order.volume = "0.3";
          else if (item.id === "bumble") order.volume = "0.3";

          order.price =
            item.price || (item.volumes ? Object.values(item.volumes)[0] : 0);
          order.step = 8;
        } else {
          order.step = 4;
        }
      } else if (item.category === "milk_coffee") {
        order.step = 4;
      } else if (item.category === "tea") {
        order.volume = "0.3";
        order.price = 180;
        order.step = 8;
      }
    }
  } else if (data.startsWith("vol_")) {
    const vol = data.replace("vol_", "");
    order.volume = vol;

    const item = findItem(order.itemCode!);
    if (item && item.volumes) {
      order.price = item.volumes[vol];
    }

    if (item?.category === "milk_coffee") {
      order.step = 6;
    } else {
      order.step = 8;
    }
  } else if (data.startsWith("milk_")) {
    const milk = data.replace("milk_", "");
    if (milk !== "none") {
      order.milk = milk;
      order.price += PRICES.ALT_MILK;
      order.additions.push(`Молоко ${milk}`);
    }
    order.step = 7;
  } else if (data.startsWith("syrup_")) {
    const syrup = data.replace("syrup_", "");
    if (syrup !== "none") {
      order.syrup = syrup;
      order.price += PRICES.SYRUP;
      order.additions.push(`Сироп ${syrup}`);
    }
    order.step = 8;
  } else if (data === "pay_cash") {
    order.paymentMethod = "cash";
    order.step = 10;
  } else if (data === "pay_online") {
    order.paymentMethod = "online";

    const payment = await createPayment(
      order.price,
      `Order from @${ctx.from?.username}`
    );

    if (payment) {
      order.paymentId = payment.id;
      if (payment.confirmation && "confirmation_url" in payment.confirmation) {
        order.paymentUrl = payment.confirmation.confirmation_url;
      }
      order.step = 9;
    } else {
      await ctx.answerCallbackQuery(
        "Ошибка создания платежа. Попробуйте позже или оплатите на кассе."
      );
      return;
    }
  } else if (data === "pay_check") {
    if (!order.paymentId) {
      await ctx.answerCallbackQuery("Ошибка: платеж не был создан.");
      return;
    }

    await ctx.answerCallbackQuery("Проверяем статус оплаты...");

    const paymentStatus = await checkPayment(order.paymentId);

    if (paymentStatus === "succeeded") {
      logger.info(
        { paymentId: order.paymentId, userId: ctx.from?.id },
        "Payment confirmed by user"
      );
      order.step = 10;
    } else if (paymentStatus === "pending") {
      await ctx.answerCallbackQuery(
        "Оплата ещё в процессе. Завершите оплату и нажмите «Проверить» снова."
      );
      return;
    } else {
      await ctx.answerCallbackQuery(
        "Оплата не найдена или отклонена. Попробуйте снова или оплатите на кассе."
      );
      return;
    }
  }

  if (order.step === 10 && !order.orderId) {
    order.orderId = await getNextOrderId();
  }

  await updateOrderMessage(ctx);

  if (order.step === 10) {
    await finalizeOrder(ctx);
  }
}

function getPaymentMethodLabel(method: string | undefined): string {
  if (method === "online") return "💳 Оплачено онлайн";
  if (method === "cash") return "💵 Оплата на кассе";
  return "❓ Не указан";
}

async function finalizeOrder(ctx: Context) {
  const order = ctx.session.currentOrder;
  if (!order || !order.orderId) return;

  const orderId = order.orderId;
  const paymentLabel = getPaymentMethodLabel(order.paymentMethod);

  const orderText =
    buildOrderSummary(order) +
    `\n\n${paymentLabel}\n🔢 Номер заказа: #${orderId}\n👤 Пользователь: @${
      ctx.from?.username || ctx.from?.first_name
    }`;

  if (config.adminGroupId) {
    try {
      const adminKeyboard = new InlineKeyboard().text(
        "⚠️ Высокая загрузка",
        `high_load_${ctx.from?.id}`
      );
      await ctx.api.sendMessage(
        config.adminGroupId,
        `🔔 Новый заказ #${orderId}!\n\n${orderText}`,
        { reply_markup: adminKeyboard }
      );
      logger.info(
        { orderId, userId: ctx.from?.id, paymentMethod: order.paymentMethod },
        "Order sent to admin group"
      );
    } catch (e) {
      logger.error({ err: e, orderId }, "Failed to send order to admin group");
    }
  }

  ctx.session.currentOrder = undefined;
}
