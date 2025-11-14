import { logger, LogContext } from "./index";

export const logExecution = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string,
  getContext?: (...args: T) => LogContext
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    const context = getContext ? getContext(...args) : {};
    const log = logger.child({ action: operationName, ...context });

    log.debug("Operation started");

    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      log.debug({ duration, success: true }, "Operation completed");
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
        "Operation failed"
      );
      throw error;
    }
  };
};

export const logError = (error: unknown, context: LogContext = {}) => {
  logger.error(
    {
      ...context,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "Error occurred"
  );
};

