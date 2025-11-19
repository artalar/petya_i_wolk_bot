import {
  Drink,
  Volume,
  AlternativeMilk,
  Syrup,
  PaymentMethod,
  Timing,
} from "../types";
import {
  getDrinkById,
  getAlternativeMilkById,
  getSyrupById,
  TIMINGS,
} from "../config/menu";
import { calculateTotalPrice, formatVolume } from "./order";

export interface OrderMessageState {
  drink: Drink;
  volume?: Volume;
  alternativeMilk?: AlternativeMilk;
  syrup?: Syrup;
  paymentMethod?: PaymentMethod;
  timing?: Timing;
  orderId?: string;
  currentStep?: string;
}

const STATE_SEPARATOR = "\n---\n";
const FIELD_SEPARATOR = "|";

export class OrderMessage {
  private state: OrderMessageState;

  constructor(messageTextOrDrink: string | Drink) {
    if (typeof messageTextOrDrink === "string") {
      this.state = this.parseMessageText(messageTextOrDrink);
    } else {
      this.state = {
        drink: messageTextOrDrink,
      };
    }
  }

  private parseMessageText(messageText: string): OrderMessageState {
    const parts = messageText.split(STATE_SEPARATOR);
    if (parts.length < 2) {
      throw new Error("Invalid message format: missing state separator");
    }

    const stateText = parts[1];
    const stateFields = stateText.split(FIELD_SEPARATOR);

    const drinkId = stateFields[0];
    const drink = getDrinkById(drinkId);
    if (!drink) {
      throw new Error(`Drink not found: ${drinkId}`);
    }

    const state: OrderMessageState = { drink };

    if (stateFields[1] && stateFields[1] !== "-") {
      state.volume = stateFields[1] as Volume;
    }

    if (stateFields[2] && stateFields[2] !== "-") {
      state.alternativeMilk = getAlternativeMilkById(stateFields[2]);
    }

    if (stateFields[3] && stateFields[3] !== "-") {
      state.syrup = getSyrupById(stateFields[3]);
    }

    if (stateFields[4] && stateFields[4] !== "-") {
      state.paymentMethod = stateFields[4] as PaymentMethod;
    }

    if (stateFields[5] && stateFields[5] !== "-") {
      const minutes = parseInt(stateFields[5], 10);
      state.timing = TIMINGS.find((t) => t.minutes === minutes);
    }

    if (stateFields[6] && stateFields[6] !== "-") {
      state.orderId = stateFields[6];
    }

    if (stateFields[7] && stateFields[7] !== "-") {
      state.currentStep = stateFields[7];
    }

    return state;
  }

  toMessageString(): string {
    const displayParts: string[] = [];

    if (this.state.orderId) {
      displayParts.push(`Заказ #${this.state.orderId} создан! 💳`);
      displayParts.push("");
    }

    displayParts.push(`✅ Выбрано: ${this.state.drink.name}`);

    if (this.state.volume) {
      displayParts.push(`✅ Объем: ${formatVolume(this.state.volume)}`);
    }

    if (this.state.alternativeMilk) {
      displayParts.push(
        `✅ Молоко: ${this.state.alternativeMilk.name} (+${this.state.alternativeMilk.price}₽)`
      );
    }

    if (this.state.syrup) {
      displayParts.push(
        `✅ Сироп: ${this.state.syrup.name} (+${this.state.syrup.price}₽)`
      );
    }

    if (this.state.volume) {
      const totalPrice = calculateTotalPrice(
        this.state.drink,
        this.state.volume,
        this.state.alternativeMilk,
        this.state.syrup
      );
      displayParts.push("");
      displayParts.push(`💰 Итого: ${totalPrice}₽`);
    }

    if (this.state.paymentMethod === "online") {
      displayParts.push(`💳 Оплата: Онлайн`);
    } else if (this.state.paymentMethod === "cash") {
      displayParts.push(`💵 Оплата: На кассе`);
    }

    if (this.state.timing) {
      displayParts.push(`⏰ ${this.state.timing.label}`);
    }

    if (this.state.currentStep) {
      displayParts.push("");
      displayParts.push(this.state.currentStep);
    }

    const stateParts = [
      this.state.drink.id,
      this.state.volume || "-",
      this.state.alternativeMilk?.id || "-",
      this.state.syrup?.id || "-",
      this.state.paymentMethod || "-",
      this.state.timing?.minutes?.toString() || "-",
      this.state.orderId || "-",
      this.state.currentStep || "-",
    ];

    return `${displayParts.join("\n")}${STATE_SEPARATOR}${stateParts.join(FIELD_SEPARATOR)}`;
  }

  getState(): OrderMessageState {
    return { ...this.state };
  }

  setVolume(volume: Volume): void {
    this.state.volume = volume;
  }

  setAlternativeMilk(milk: AlternativeMilk | undefined): void {
    this.state.alternativeMilk = milk;
  }

  setSyrup(syrup: Syrup | undefined): void {
    this.state.syrup = syrup;
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.state.paymentMethod = method;
  }

  setTiming(timing: Timing): void {
    this.state.timing = timing;
  }

  setOrderId(orderId: string): void {
    this.state.orderId = orderId;
  }

  setCurrentStep(step: string | undefined): void {
    this.state.currentStep = step;
  }

  getDrink(): Drink {
    return this.state.drink;
  }

  getVolume(): Volume | undefined {
    return this.state.volume;
  }

  getAlternativeMilk(): AlternativeMilk | undefined {
    return this.state.alternativeMilk;
  }

  getSyrup(): Syrup | undefined {
    return this.state.syrup;
  }

  getPaymentMethod(): PaymentMethod | undefined {
    return this.state.paymentMethod;
  }

  getTiming(): Timing | undefined {
    return this.state.timing;
  }

  getOrderId(): string | undefined {
    return this.state.orderId;
  }

  getCurrentStep(): string | undefined {
    return this.state.currentStep;
  }

  getTotalPrice(): number | undefined {
    if (!this.state.volume) {
      return undefined;
    }
    return calculateTotalPrice(
      this.state.drink,
      this.state.volume,
      this.state.alternativeMilk,
      this.state.syrup
    );
  }
}

