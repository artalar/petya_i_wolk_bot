import { Context } from "./context.js";
import { MenuItem, CurrentOrder } from "./types.js";
export declare function findItem(id: string): MenuItem | undefined;
export declare function getTotalPrice(order: CurrentOrder): number;
export declare function buildOrderSummary(order: CurrentOrder): string;
export declare function updateOrderMessage(ctx: Context, isNew?: boolean): Promise<void>;
export declare function startOrder(ctx: Context): Promise<void>;
//# sourceMappingURL=orderFlow.d.ts.map