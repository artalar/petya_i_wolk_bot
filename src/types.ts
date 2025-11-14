export interface Order {
  id: string;
  userId: number;
  chatId: number;
  drink: Drink;
  volume: Volume;
  alternativeMilk?: AlternativeMilk;
  syrup?: Syrup;
  totalPrice: number;
  paymentUrl: string;
  status: OrderStatus;
  timing?: Timing;
  createdAt: Date;
}

export type OrderStatus = "pending" | "paid" | "preparing" | "ready" | "cancelled";

export interface Drink {
  id: string;
  name: string;
  category: DrinkCategory;
  basePrice: number;
}

export type DrinkCategory = "black" | "milk" | "signature" | "non-coffee" | "tea";

export type Volume = "0.2" | "0.3" | "0.4";

export interface AlternativeMilk {
  id: string;
  name: string;
  price: number;
}

export interface Syrup {
  id: string;
  name: string;
  price: number;
}

export interface Timing {
  minutes: number;
  label: string;
}

export interface SessionData {
  currentOrder?: Partial<Order>;
  lastOrder?: Order;
  orderIdCounter?: number;
}

export interface BotConfig {
  botToken: string;
  groupChatId: string;
  paymentUrl: string;
}

