import dotenv from "dotenv";
import { BotConfig } from "../types";
import { logger } from "../logger";

dotenv.config();

const botToken = process.env.BOT_TOKEN;
const groupChatId = process.env.GROUP_CHAT_ID;
const paymentUrl = process.env.PAYMENT_URL;

if (!botToken) {
  logger.fatal("BOT_TOKEN environment variable is not set");
  throw new Error("BOT_TOKEN environment variable is not set");
}

if (!groupChatId) {
  logger.fatal("GROUP_CHAT_ID environment variable is not set");
  throw new Error("GROUP_CHAT_ID environment variable is not set");
}

if (!paymentUrl) {
  logger.fatal("PAYMENT_URL environment variable is not set");
  throw new Error("PAYMENT_URL environment variable is not set");
}

export const botConfig: BotConfig = {
  botToken,
  groupChatId,
  paymentUrl,
};

logger.info({ groupChatId, paymentUrl: "***" }, "Bot configuration loaded");

