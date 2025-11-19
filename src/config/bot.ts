import dotenv from "dotenv";
import { BotConfig } from "../types";
import { logger } from "../logger";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const groupChatIdString = process.env.GROUP_CHAT_ID;
const yooKassaShopId = process.env.YOOKASSA_SHOP_ID;
const yooKassaSecretKey = process.env.YOOKASSA_SECRET_KEY;
const paymentReturnUrl = process.env.PAYMENT_RETURN_URL;

if (!botToken) {
  logger.fatal("BOT_TOKEN environment variable is not set");
  throw new Error("BOT_TOKEN environment variable is not set");
}

if (!groupChatIdString) {
  logger.fatal("GROUP_CHAT_ID environment variable is not set");
  throw new Error("GROUP_CHAT_ID environment variable is not set");
}

const groupChatId = parseInt(groupChatIdString, 10);
if (isNaN(groupChatId)) {
  logger.fatal({ groupChatIdString }, "GROUP_CHAT_ID must be a valid number");
  throw new Error("GROUP_CHAT_ID must be a valid number");
}

const isDevelopment = process.env.NODE_ENV === "development";

const finalPaymentReturnUrl = paymentReturnUrl || "https://t.me/your_bot";

export const botConfig: BotConfig = {
  botToken,
  groupChatId,
  paymentReturnUrl: finalPaymentReturnUrl,
};

export const yooKassaConfig = {
  shopId: yooKassaShopId,
  secretKey: yooKassaSecretKey,
};

if (isDevelopment) {
  logger.warn(
    { groupChatId },
    "Bot running in DEVELOPMENT mode"
  );
} else {
  logger.info({ groupChatId }, "Bot configuration loaded");
}
