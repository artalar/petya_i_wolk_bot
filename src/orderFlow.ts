import { Context } from "./context.js";
import { InlineKeyboard } from "grammy";
import { MENU, SYRUPS, ALT_MILKS } from "./consts.js";
import { MenuItem, CurrentOrder } from "./types.js";
import { getSettings } from "./db.js";

export function findItem(id: string): MenuItem | undefined {
  for (const category of Object.values(MENU)) {
    const item = category.find((i) => i.id === id);
    if (item) return item;
  }
  return undefined;
}

export function buildOrderSummary(order: CurrentOrder): string {
  if (order.step === 1) return "";

  let summary = "📋 *Ваш заказ:*\n";

  if (order.itemCode) {
    const item = findItem(order.itemCode);
    summary += `☕️ ${item?.name}`;
    if (order.volume) summary += ` (${Number(order.volume) * 1000}мл)`;
    summary += "\n";
  } else if (order.categoryName) {
    summary += `📂 ${order.categoryName}\n`;
  }

  if (order.milk) summary += `🥛 Молоко: ${order.milk}\n`;
  if (order.syrup) summary += `🍬 Сироп: ${order.syrup}\n`;
  summary += `⏰ Готовность: в течение 5 минут\n`;
  if (order.price > 0) summary += `\n💰 *Итого: ${order.price}₽*`;
  return summary;
}

export async function updateOrderMessage(ctx: Context, isNew = false) {
  const order = ctx.session.currentOrder;
  if (!order) return;

  const summary = buildOrderSummary(order);
  let stepMessage = "";
  let keyboard = new InlineKeyboard();

  switch (order.step) {
    case 1:
      stepMessage = "Привет! 🙌 Что вам приготовить?";
      keyboard.text("Черный кофе", "cat_black").row();
      keyboard.text("Молочный кофе", "cat_milk").row();
      keyboard.text("Чай 0,3", "cat_tea");
      break;

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
      keyboard.text("Оплатить на кассе", "pay_cash").row();

      const settings = await getSettings();
      if (settings.isOnlinePaymentActive) {
        keyboard.text("Оплатить онлайн", "pay_online").row();
      }

      keyboard.row().text("Назад", "back");
      break;
    }

    case 9: {
      stepMessage = "💳 Оплатите заказ по ссылке ниже";

      if (order.paymentUrl) {
        keyboard.url("Перейти к оплате", order.paymentUrl).row();
      }
      keyboard.text("✅ Я оплатил", "pay_check").row();
      keyboard.row().text("Назад", "back");
      break;
    }

    case 10:
      stepMessage = `Супер! Ждем 👍\n\n🔢 Номер вашего заказа: #${order.orderId}`;
      break;
  }

  let fullText = summary;
  if (summary && stepMessage) {
    fullText += "\n\n\n" + stepMessage;
  } else {
    fullText += stepMessage;
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
    } catch {
      // Ignore if not modified
    }
  }
}

export async function startOrder(ctx: Context) {
  ctx.session.currentOrder = {
    step: 1,
    additions: [],
    price: 0,
  };
  await updateOrderMessage(ctx, true);
}
