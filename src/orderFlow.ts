import { Context } from "./context.js";
import { InlineKeyboard } from "grammy";
import { MENU, PRICES, SYRUPS, ALT_MILKS } from "./consts.js";
import { MenuItem } from "./types.js";
import { getNextOrderId, getSettings } from "./db.js";
import { logger } from "./logger.js";
import { createPayment, checkPayment } from "./services/payment.js";
import { config } from "./config.js";

// Helper to find item by ID
function findItem(id: string): MenuItem | undefined {
  for (const category of Object.values(MENU)) {
    const item = category.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}

export async function startOrder(ctx: Context) {
  ctx.session.currentOrder = {
    step: 1,
    additions: [],
    price: 0,
  };
  await updateOrderMessage(ctx, true);
}

export async function handleOrderCallback(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !ctx.session.currentOrder) return;

  const order = ctx.session.currentOrder;

  if (data === "back") {
    switch (order.step) {
      case 2: // Black Coffee -> Main
      case 3: // Milk Coffee -> Main
      case 5: // Tea -> Main
        order.step = 1;
        order.categoryName = undefined;
        break;

      case 4: // Volume -> Item Selection (2 or 3)
        // Check category of current item
        const item = findItem(order.itemCode!);
        if (item?.category === "black_coffee") order.step = 2;
        else if (item?.category === "milk_coffee") order.step = 3;
        else if (item?.category === "not_coffee") order.step = 1; // Not coffee handled? Not in buttons logic but good to be safe
        order.itemCode = undefined;
        order.price = 0;
        break;

      case 6: // Alt Milk -> Volume (4)
        order.step = 4;
        order.volume = undefined;
        order.price = 0;
        break;

      case 7: // Syrup -> Alt Milk (6)
        order.step = 6;
        if (order.milk && order.milk !== "none") {
          order.price -= PRICES.ALT_MILK;
          order.additions = order.additions.filter((a) => !a.startsWith("Молоко"));
        }
        order.milk = undefined;
        break;

      case 8: // Payment -> Previous step
        order.paymentId = undefined;
        order.paymentUrl = undefined;
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
            order.additions = order.additions.filter((a) => !a.startsWith("Сироп"));
          }
          order.syrup = undefined;
        }
        break;

      case 9: // Time -> Payment (8)
        order.step = 8;
        break;
    }
    await updateOrderMessage(ctx);
    return;
  }

  // Branching logic
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
      // Logic for next step based on item
      if (item.category === "black_coffee") {
        if (["espresso", "espresso_tonic", "bumble"].includes(item.id)) {
          // Fixed volume, go to payment (Step 8)
          if (item.id === "espresso") order.volume = "0.042";
          else if (item.id === "espresso_tonic") order.volume = "0.3";
          else if (item.id === "bumble") order.volume = "0.3";

          order.price =
            item.price || (item.volumes ? Object.values(item.volumes)[0] : 0);
          order.step = 8;
        } else {
          // Americano, Filter -> Volume (Step 4)
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

    // Calculate price so far
    const item = findItem(order.itemCode!);
    if (item && item.volumes) {
      order.price = item.volumes[vol];
    }

    // Determine next step
    if (item?.category === "milk_coffee") {
      order.step = 6; // Alt milk
    } else {
      order.step = 8; // Payment
    }
  } else if (data.startsWith("milk_")) {
    const milk = data.replace("milk_", "");
    if (milk !== "none") {
      order.milk = milk;
      order.price += PRICES.ALT_MILK;
      order.additions.push(`Молоко ${milk}`);
    }
    order.step = 7; // Syrup
  } else if (data.startsWith("syrup_")) {
    const syrup = data.replace("syrup_", "");
    if (syrup !== "none") {
      order.syrup = syrup;
      order.price += PRICES.SYRUP;
      order.additions.push(`Сироп ${syrup}`);
    }
    order.step = 8; // Payment
  } else if (data.startsWith("pay_")) {
    const method = data.replace("pay_", "");
    if (method === "online") {
      const payment = await createPayment(
        order.price,
        `Order from @${ctx.from?.username}`
      );
      if (payment) {
        order.paymentId = payment.id;
        order.paymentUrl = payment.confirmation.confirmation_url;
        await updateOrderMessage(ctx);
        return;
      } else {
        await ctx.answerCallbackQuery(
          "Ошибка создания платежа. Попробуйте позже или оплатите на кассе."
        );
        return;
      }
    } else if (method === "done") {
      if (order.paymentId) {
        const isPaid = await checkPayment(order.paymentId);
        if (isPaid) {
          order.step = 9;
        } else {
          await ctx.answerCallbackQuery(
            "Оплата еще не прошла. Если вы оплатили, подождите немного и попробуйте снова."
          );
          return;
        }
      } else {
        order.step = 9;
      }
    } else {
      order.step = 9;
    }
  } else if (data.startsWith("time_")) {
    order.step = 10;
  }

  await updateOrderMessage(ctx);

  if (order.step === 10) {
    await finalizeOrder(ctx);
  }
}

async function updateOrderMessage(ctx: Context, isNew = false) {
  const order = ctx.session.currentOrder;
  if (!order) return;

  let summary = buildOrderSummary(order);
  let stepMessage = "";
  let keyboard = new InlineKeyboard();

  switch (order.step) {
    case 1:
      stepMessage = "Привет! 🙌 Что вам приготовить?";
      keyboard.text("Черный кофе", "cat_black").row();
      keyboard.text("Молочный кофе", "cat_milk").row();
      keyboard.text("Чай 0,3", "cat_tea");
      break;

    case 2: // Black Coffee
      stepMessage = "Отличный выбор! Какой именно?";
      MENU.black_coffee.forEach((item) => {
        keyboard.text(item.name, `item_${item.id}`).row();
      });
      keyboard.row().text("Назад", "back");
      break;

    case 3: // Milk Coffee
      stepMessage = "Отличный выбор! Какой именно?";
      MENU.milk_coffee.forEach((item) => {
        keyboard.text(item.name, `item_${item.id}`).row();
      });
      keyboard.row().text("Назад", "back");
      break;

    case 4: // Volume
      stepMessage = "Отличный выбор! Теперь давайте определимся с объемом!";
      const item = findItem(order.itemCode!);
      if (item?.volumes) {
        Object.keys(item.volumes).forEach((vol) => {
          keyboard.text(`${vol} л`, `vol_${vol}`).row();
        });
      }
      keyboard.row().text("Назад", "back");
      break;

    case 5: // Tea
      stepMessage = "Отличный выбор! Какой именно?";
      MENU.tea.forEach((item) => {
        keyboard.text(item.name, `item_${item.id}`).row();
      });
      keyboard.row().text("Назад", "back");
      break;

    case 6: // Alt Milk
      stepMessage = "Может на альтернативном молоке?";
      keyboard.text("Спасибо, не надо", "milk_none").row();
      ALT_MILKS.forEach((m) => keyboard.text(m, `milk_${m}`).row());
      keyboard.row().text("Назад", "back");
      break;

    case 7: // Syrup
      stepMessage = "А как насчет сиропа?";
      keyboard.text("Спасибо, не надо", "syrup_none").row();
      SYRUPS.forEach((s) => keyboard.text(s, `syrup_${s}`).row());
      keyboard.row().text("Назад", "back");
      break;

    case 8: // Payment
      keyboard.text("Оплатить на кассе", "pay_cash").row();

      stepMessage = "Чудесно! Как будете оплачивать заказ?";

      const settings = await getSettings();
      if (settings.isOnlinePaymentActive) {
        if (order.paymentUrl) {
          stepMessage += `\n\n[Ссылка на оплату](${order.paymentUrl})`;
        }
        keyboard.text("Оплатить онлайн", "pay_online").row();
        keyboard.text("Я оплатил", "pay_done").row();
      }

      keyboard.row().text("Назад", "back");
      break;

    case 9: { // Time
      stepMessage = "Отлично, заказ почти сформирован! 👌 Вот время через которое мы сможем его приготовить:";
      const settings = await getSettings();
      settings.availableTimes.forEach((time) => {
        keyboard.text(`Через ${time} минут`, `time_${time}`).row();
      });
      keyboard.row().text("Назад", "back");
      break;
    }

    case 10: // Final
      stepMessage = "Супер! Ждем 👍";
      // No buttons
      break;
  }

  // Combine summary and step message with extra spacing (triple newline as requested "пустую строку" implies \n\n + separator?)
  // "дополнительный отсутп (пустую строку) перед сообщением этапа"
  // Summary is block 1. Step Msg is block 2.
  // Normal is \n\n. Extra empty line means \n\n\n.

  let fullText = summary;
  if (summary && stepMessage) {
    fullText += "\n\n\n" + stepMessage;
  } else {
    fullText += stepMessage; // Fallback if summary is empty (step 1)
  }

  if (isNew) {
    const msg = await ctx.reply(fullText, {
      reply_markup: keyboard,
      parse_mode: "Markdown",
    });
    order.messageId = msg.message_id;
  } else {
    try {
      await ctx.editMessageText(fullText, {
        reply_markup: keyboard,
        parse_mode: "Markdown",
      });
    } catch (e) {
      // Ignore if not modified
    }
  }
}

function buildOrderSummary(order: any): string {
  if (order.step === 1) return "";

  let summary = "📋 *Ваш заказ:*\n";

  if (order.itemCode) {
    const item = findItem(order.itemCode);
    summary += `☕️ ${item?.name}`;
    if (order.volume) summary += ` (${order.volume}л)`;
    summary += "\n";
  } else if (order.categoryName) {
    // Show branch name if item not selected yet
    summary += `📂 ${order.categoryName}\n`;
  }

  if (order.milk) summary += `🥛 Молоко: ${order.milk}\n`;
  if (order.syrup) summary += `🍬 Сироп: ${order.syrup}\n`;

  if (order.price > 0) summary += `\n💰 *Итого: ${order.price}₽*`;

  return summary;
}

async function finalizeOrder(ctx: Context) {
  const order = ctx.session.currentOrder;
  if (!order) return;

  const orderId = await getNextOrderId();
  const orderText =
    buildOrderSummary(order) +
    `\n\n🔢 Номер заказа: #${orderId}\n👤 Пользователь: @${
      ctx.from?.username || ctx.from?.first_name
    }`;

  // Send to Admin Group
  if (config.adminGroupId) {
    try {
      await ctx.api.sendMessage(
        config.adminGroupId,
        `🔔 Новый заказ #${orderId}!\n\n${orderText}`
      );
    } catch (e) {
      logger.error({ err: e }, "Failed to send order to admin group");
    }
  }

  ctx.session.currentOrder = undefined;
}
