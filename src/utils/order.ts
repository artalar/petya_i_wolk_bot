import { Order, Drink, Volume, AlternativeMilk, Syrup } from "../types";
import { botConfig } from "../config/bot";
import { logger } from "../logger";
import { yooKassaService } from "../services/yookassa";
import { VOLUMES } from "../config/menu";

export const formatVolume = (volume: Volume): string => {
  const volumeConfig = VOLUMES.find(v => v.value === volume);
  return volumeConfig ? volumeConfig.label : `${volume} л`;
};

export const calculateTotalPrice = (
  drink: Drink,
  volume: Volume,
  alternativeMilk?: AlternativeMilk,
  syrup?: Syrup
): number => {
  const log = logger.child({ action: "calculate_price", drinkId: drink.id, volume });

  const basePrice = drink.prices[volume];
  if (!basePrice) {
    log.error({ drinkId: drink.id, volume, availablePrices: drink.prices }, "Price not available for this volume");
    throw new Error(`Напиток "${drink.name}" недоступен в объеме ${formatVolume(volume)}`);
  }

  let totalPrice = basePrice;

  log.debug({ basePrice, volume }, "Base price for volume");

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

export const createYooKassaPayment = async (
  orderId: string,
  totalPrice: number,
  description: string
): Promise<{ paymentId: string; paymentUrl: string }> => {
  const log = logger.child({
    action: "create_yookassa_payment",
    orderId,
    totalPrice,
  });

  if (!yooKassaService.isInitialized()) {
    log.warn("YooKassa service not initialized, using mock payment URL");
    const mockPaymentUrl = `https://yookassa.ru/checkout/payments/mock?order_id=${orderId}&amount=${totalPrice}`;
    return {
      paymentId: `mock-${orderId}`,
      paymentUrl: mockPaymentUrl,
    };
  }

  try {
    const payment = await yooKassaService.createPayment({
      amount: totalPrice,
      orderId,
      description,
      returnUrl: botConfig.paymentReturnUrl,
    });

    const paymentUrl = yooKassaService.getPaymentUrlFromResponse(payment);

    log.info(
      {
        paymentId: payment.id,
        test: payment.test,
      },
      "YooKassa payment created"
    );

    return {
      paymentId: payment.id,
      paymentUrl,
    };
  } catch (error) {
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      "Failed to create YooKassa payment"
    );
    throw error;
  }
};

export const formatOrderMessage = (order: Order): string => {
  const log = logger.child({ action: "format_order_message", orderId: order.id });

  const parts: string[] = [];
  parts.push(`Заказ #${order.id} создан! 💳`);
  parts.push("");
  parts.push("Ваш заказ:");
  parts.push(`☕ Напиток: ${order.drink.name}`);
  parts.push(`🥛 Объем: ${formatVolume(order.volume)}`);

  if (order.alternativeMilk) {
    parts.push(`🥛 Альтернативное молоко: ${order.alternativeMilk.name}`);
  }

  if (order.syrup) {
    parts.push(`🍯 Сироп: ${order.syrup.name} (+${order.syrup.price}₽)`);
  }

  parts.push("");
  parts.push(`💰 Итого: ${order.totalPrice}₽`);

  const message = parts.join("\n");
  log.debug({ messageLength: message.length }, "Order message formatted");
  return message;
};

export const createOrder = async (
  userId: number,
  chatId: number,
  orderId: string,
  userFirstName: string,
  userLastName: string | undefined,
  userUsername: string | undefined,
  drink: Drink,
  volume: Volume,
  paymentMethod: "online" | "cash",
  alternativeMilk?: AlternativeMilk,
  syrup?: Syrup
): Promise<Order> => {
  const log = logger.child({
    action: "create_order",
    userId,
    chatId,
    orderId,
    drinkId: drink.id,
    paymentMethod,
  });

  const totalPrice = calculateTotalPrice(drink, volume, alternativeMilk, syrup);

  const description = `${drink.name} ${formatVolume(volume)}`;

  let paymentId: string | undefined;
  let paymentUrl: string | undefined;

  if (paymentMethod === "online") {
    const payment = await createYooKassaPayment(
      orderId,
      totalPrice,
      description
    );
    paymentId = payment.paymentId;
    paymentUrl = payment.paymentUrl;
  }

  const order: Order = {
    id: orderId,
    userId,
    chatId,
    userFirstName,
    userLastName,
    userUsername,
    drink,
    volume,
    alternativeMilk,
    syrup,
    totalPrice,
    paymentMethod,
    paymentUrl,
    paymentId,
    status: "pending",
    createdAt: new Date(),
  };

  log.info({ orderId, paymentId, totalPrice, paymentMethod, status: order.status }, "Order created");
  return order;
};

