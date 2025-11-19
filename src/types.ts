export interface Order {
  id?: string;
  userId: number;
  username?: string;
  status: 'pending' | 'paid' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  paymentMethod?: 'card_online' | 'card_offline' | 'cash';
  readinessTime?: string;
}

export interface OrderItem {
  name: string;
  volume?: string;
  price: number;
  additions: OrderAddition[];
  milk?: string;
  syrup?: string;
}

export interface OrderAddition {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  volumes?: { [key: string]: number }; // volume -> price
  price?: number; // fixed price
  category: 'black_coffee' | 'milk_coffee' | 'tea' | 'not_coffee' | 'special' | 'alternative';
}

export interface MenuCategory {
  id: string;
  title: string;
  items: MenuItem[];
}

// Session data to track the current order being built
export interface SessionData {
  currentOrder?: {
    step: number;
    messageId?: number;
    categoryName?: string; // To display branch name before item selection
    itemCode?: string; // temporary storage for selected item type
    volume?: string;
    milk?: string;
    syrup?: string;
    additions: string[];
    price: number;
    paymentId?: string;
    paymentUrl?: string;
    time?: string;
  };
  // To prevent spamming commands
  lastCommand?: number;
}
