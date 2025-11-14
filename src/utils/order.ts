import { Order, Drink, Volume, AlternativeMilk, Syrup } from "../types";
import { botConfig } from "../config/bot";
import { logger } from "../logger";

export const calculateTotalPrice = (
  drink: Drink,
  volume: Volume,
  alternativeMilk?: AlternativeMilk,
  syrup?: Syrup
): number => {
  const log = logger.child({ action: "calculate_price", drinkId: drink.id, volume });

  let totalPrice = drink.basePrice;

  if (syrup) {
    totalPrice += syrup.price;
    log.debug({ syrupId: syrup.id, syrupPrice: syrup.price }, "Added syrup price");
  }

  if (alternativeMilk) {
    totalPrice += alternativeMilk.price;
    log.debug(
      { milkId: alternativeMilk.id, milkPrice: alternativeMilk.price },
      "Added alternative milk price"
    );
  }

  log.info({ totalPrice }, "Total price calculated");
  return totalPrice;
};

export const generatePaymentUrl = (orderId: string, totalPrice: number): string => {
  const log = logger.child({ action: "generate_payment_url", orderId, totalPrice });

  const url = `${botConfig.paymentUrl}?order_id=${orderId}&amount=${totalPrice}`;
  log.debug({ url: "***" }, "Payment URL generated");
  return url;
};

export const formatOrderMessage = (order: Order): string => {
  const log = logger.child({ action: "format_order_message", orderId: order.id });

  const parts: string[] = [];
  parts.push(`Заказ #${order.id} создан! 💳`);
  parts.push("");
  parts.push("Ваш заказ:");
  parts.push(`☕ Напиток: ${order.drink.name}`);
  parts.push(`🥛 Объем: ${order.volume} л`);

  if (order.alternativeMilk) {
    parts.push(`🥛 Альтернативное молоко: ${order.alternativeMilk.name}`);
  }

  if (order.syrup) {
    parts.push(`🍯 Сироп: ${order.syrup.name} (+${order.syrup.price}₽)`);
  }

  parts.push("");
  parts.push(`💰 Итого: ${order.totalPrice}₽`);
  parts.push("");
  parts.push("Нажмите кнопку ниже для оплаты:");

  const message = parts.join("\n");
  log.debug({ messageLength: message.length }, "Order message formatted");
  return message;
};

export const createOrder = (
  userId: number,
  chatId: number,
  orderId: string,
  drink: Drink,
  volume: Volume,
  alternativeMilk?: AlternativeMilk,
  syrup?: Syrup
): Order => {
  const log = logger.child({
    action: "create_order",
    userId,
    chatId,
    orderId,
    drinkId: drink.id,
  });

  const totalPrice = calculateTotalPrice(drink, volume, alternativeMilk, syrup);
  const paymentUrl = generatePaymentUrl(orderId, totalPrice);

  const order: Order = {
    id: orderId,
    userId,
    chatId,
    drink,
    volume,
    alternativeMilk,
    syrup,
    totalPrice,
    paymentUrl,
    status: "pending",
    createdAt: new Date(),
  };

  log.info({ orderId, totalPrice, status: order.status }, "Order created");
  return order;
};

