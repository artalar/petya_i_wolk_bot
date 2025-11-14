import { TIMINGS } from "../config/menu";
import { Timing } from "../types";
import { logger } from "../logger";

export const getTimingByMinutes = (minutes: number): Timing | undefined => {
  const timing = TIMINGS.find((t) => t.minutes === minutes);
  if (!timing) {
    logger.warn({ minutes }, "Timing not found");
  }
  return timing;
};

export const formatTimingLabel = (timing: Timing): string => {
  return timing.label;
};

