import { MiddlewareFn } from "grammy";
import { Context } from "grammy";
import { logger, createLogger } from "./index";

export const loggingMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const startTime = Date.now();
  const logContext = {
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    updateType: ctx.update.update_id,
  };

  const log = createLogger(logContext);

  if (ctx.message) {
    log.debug(
      {
        messageId: ctx.message.message_id,
        text: ctx.message.text,
        action: "message_received",
      },
      "Received message"
    );
  }

  if (ctx.callbackQuery) {
    log.debug(
      {
        callbackQueryId: ctx.callbackQuery.id,
        data: ctx.callbackQuery.data,
        action: "callback_query_received",
      },
      "Received callback query"
    );
  }

  try {
    await next();
    const duration = Date.now() - startTime;
    log.debug({ duration, action: "request_completed" }, "Request completed");
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        action: "request_failed",
      },
      "Request failed"
    );
    throw error;
  }
};

export const apiCallLogger = async <T>(
  apiCall: () => Promise<T>,
  method: string,
  params?: Record<string, unknown>
): Promise<T> => {
  const startTime = Date.now();
  const log = logger.child({ action: "api_call", method, params });

  try {
    log.debug("API call started");
    const result = await apiCall();
    const duration = Date.now() - startTime;
    log.debug({ duration, success: true }, "API call completed");
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    log.error(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        success: false,
      },
      "API call failed"
    );
    throw error;
  }
};

