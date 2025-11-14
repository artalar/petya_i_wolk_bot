import pino from "pino";

const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export interface LogContext {
  userId?: number;
  chatId?: number;
  orderId?: string;
  action?: string;
  category?: string;
  drinkId?: string;
  [key: string]: unknown;
}

export const createLogger = (context: LogContext = {}) => {
  return logger.child(context);
};

export const logWithContext = (
  level: "trace" | "debug" | "info" | "warn" | "error" | "fatal",
  message: string,
  context: LogContext = {}
) => {
  const log = logger.child(context);
  log[level](message);
};

