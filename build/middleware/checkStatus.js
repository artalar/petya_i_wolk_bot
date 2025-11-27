"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkBotStatus = checkBotStatus;
const db_js_1 = require("../db.js");
const config_js_1 = require("../config.js");
const logger_js_1 = require("../logger.js");
async function checkBotStatus(ctx, next) {
    const settings = await (0, db_js_1.getSettings)();
    if (settings.isBotActive) {
        return next();
    }
    // If bot is inactive, allow admins to bypass
    if (String(ctx.chat?.id) === config_js_1.config.adminGroupId) {
        return next();
    }
    // Respond with placeholder
    if (ctx.message || ctx.callbackQuery) {
        try {
            if (ctx.callbackQuery) {
                await ctx.answerCallbackQuery({ text: "Работа бота временно приостановлена", show_alert: true });
            }
            else {
                await ctx.reply("Работа бота временно приостановлена");
            }
        }
        catch (err) {
            logger_js_1.logger.error({ err }, "Failed to send inactive message");
        }
    }
}
//# sourceMappingURL=checkStatus.js.map