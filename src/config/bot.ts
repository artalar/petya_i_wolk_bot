import dotenv from "dotenv";
import { BotConfig } from "../types";
import { logger } from "../logger";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const groupChatIdString = process.env.GROUP_CHAT_ID;
const paymentUrl = process.env.PAYMENT_URL;

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

let finalPaymentUrl: string;

if (isDevelopment) {
  finalPaymentUrl = "https://example.com/mock-payment";
  logger.warn("Development mode: using mock payment URL");
} else {
  if (!paymentUrl) {
    logger.fatal("PAYMENT_URL environment variable is not set");
    throw new Error("PAYMENT_URL environment variable is not set");
  }
  finalPaymentUrl = paymentUrl;
}

export const botConfig: BotConfig = {
  botToken,
  groupChatId,
  paymentUrl: finalPaymentUrl,
};

if (isDevelopment) {
  logger.warn(
    { groupChatId, paymentUrl: finalPaymentUrl },
    "Bot running in DEVELOPMENT mode with mock payment URL"
  );
} else {
  logger.info({ groupChatId, paymentUrl: "***" }, "Bot configuration loaded");
}

