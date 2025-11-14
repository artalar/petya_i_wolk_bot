import { Api } from "grammy";
import { Order } from "../types";
import { botConfig } from "../config/bot";
import { logger, logWithContext } from "../logger";
import { apiCallLogger } from "../logger/middleware";

export const sendOrderToGroup = async (api: Api, order: Order): Promise<void> => {
  const log = logger.child({
    action: "send_order_to_group",
    orderId: order.id,
    groupChatId: botConfig.groupChatId,
  });

  log.info("Preparing to send order to group");

  const message = formatOrderForGroup(order);

  try {
    await apiCallLogger(
      () => api.sendMessage(botConfig.groupChatId, message, { parse_mode: "HTML" }),
      "sendMessage",
      { chatId: botConfig.groupChatId }
    );

    log.info("Order successfully sent to group");
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      "Failed to send order to group"
    );
    throw error;
  }
};

const formatOrderForGroup = (order: Order): string => {
  const parts: string[] = [];
  parts.push(`<b>Новый заказ #${order.id}</b>\n`);
  
  const userParts: string[] = [];
  
  const fullName = [order.userFirstName, order.userLastName].filter(Boolean).join(" ");
  userParts.push(fullName);
  
  if (order.userUsername) {
    userParts.push(`@${order.userUsername}`);
  }
  
  userParts.push(`(ID: ${order.userId})`);
  
  parts.push(`👤 Пользователь: ${userParts.join(" ")}`);
  parts.push(`☕ Напиток: ${order.drink.name}`);
  parts.push(`🥛 Объем: ${order.volume} л`);

  if (order.alternativeMilk) {
    parts.push(`🥛 Альтернативное молоко: ${order.alternativeMilk.name}`);
  }

  if (order.syrup) {
    parts.push(`🍯 Сироп: ${order.syrup.name} (+${order.syrup.price}₽)`);
  }

  if (order.timing) {
    parts.push(`⏰ Время: ${order.timing.label}`);
  }

  parts.push(`\n💰 Итого: ${order.totalPrice}₽`);
  parts.push(`📅 Создан: ${order.createdAt.toLocaleString("ru-RU")}`);

  return parts.join("\n");
};

export const notifyOrderCreated = async (
  api: Api,
  chatId: number,
  orderId: string
): Promise<void> => {
  logWithContext(
    "info",
    "Notifying user about order creation",
    { chatId, orderId, action: "notify_order_created" }
  );

  try {
    await apiCallLogger(
      () =>
        api.sendMessage(
          chatId,
          `✅ Заказ #${orderId} успешно создан! Мы получили ваш заказ и начнем готовить после оплаты.`
        ),
      "sendMessage",
      { chatId }
    );
  } catch (error) {
    logger.error(
      {
        error: error instanceof Error ? error.message : String(error),
        chatId,
        orderId,
      },
      "Failed to notify user about order creation"
    );
  }
};

