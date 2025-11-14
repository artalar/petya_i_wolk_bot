export interface Order {
  id: string;
  userId: number;
  chatId: number;
  userFirstName: string;
  userLastName?: string;
  userUsername?: string;
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
  prices: Partial<Record<Volume, number>>;
}

export type DrinkCategory = "black" | "alternative" | "milk" | "signature" | "non-coffee" | "tea";

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
}

export interface BotConfig {
  botToken: string;
  groupChatId: number;
  paymentUrl: string;
}

