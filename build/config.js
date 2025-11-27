"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    botToken: process.env.BOT_TOKEN || '',
    botName: process.env.BOT_NAME || '',
    yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
    yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
    adminGroupId: process.env.ADMIN_GROUP_ID || '',
    nodeEnv: process.env.NODE_ENV || 'development',
};
if (!exports.config.botToken) {
    console.error('BOT_TOKEN is missing in .env');
    process.exit(1);
}
//# sourceMappingURL=config.js.map