interface BotSettings {
    isBotActive: boolean;
    isOnlinePaymentActive: boolean;
    availableTimes: number[];
}
export declare function getNextOrderId(): Promise<number>;
export declare function getSettings(): Promise<BotSettings>;
export declare function updateSettings(settings: Partial<BotSettings>): Promise<BotSettings>;
export {};
//# sourceMappingURL=db.d.ts.map