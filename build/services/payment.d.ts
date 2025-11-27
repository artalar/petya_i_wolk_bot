interface YookassaPayment {
    id: string;
    status: string;
    confirmation?: {
        type: string;
        confirmation_url?: string;
    };
}
export declare function createPayment(amount: number, description: string, customerEmail?: string): Promise<YookassaPayment | null>;
export declare function checkPayment(paymentId: string): Promise<'succeeded' | 'pending' | 'failed'>;
export {};
//# sourceMappingURL=payment.d.ts.map