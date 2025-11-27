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
    volumes?: {
        [key: string]: number;
    };
    price?: number;
    category: 'black_coffee' | 'milk_coffee' | 'tea' | 'not_coffee' | 'special' | 'alternative';
}
export interface MenuCategory {
    id: string;
    title: string;
    items: MenuItem[];
}
export type PaymentMethod = 'cash' | 'online';
export interface OrderedItem {
    itemCode: string;
    volume?: string;
    milk?: string;
    syrup?: string;
    additions: string[];
    price: number;
}
export interface CurrentOrder {
    step: number;
    messageId?: number;
    categoryName?: string;
    itemCode?: string;
    volume?: string;
    milk?: string;
    syrup?: string;
    additions: string[];
    price: number;
    items: OrderedItem[];
    paymentMethod?: PaymentMethod;
    paymentId?: string;
    paymentUrl?: string;
    orderId?: number;
    comments?: string[];
}
export interface SessionData {
    currentOrder?: CurrentOrder;
    lastCommand?: number;
}
//# sourceMappingURL=types.d.ts.map