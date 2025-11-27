"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkWorkHours = checkWorkHours;
const logger_js_1 = require("../logger.js");
const config_js_1 = require("../config.js");
async function checkWorkHours(ctx, next) {
    // Allow admins to bypass work hours check
    if (String(ctx.chat?.id) === config_js_1.config.adminGroupId) {
        return next();
    }
    const now = new Date();
    // Convert to MSK (UTC+3)
    const mskTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
    const hours = mskTime.getHours();
    // Work hours: 8 to 21
    if (hours >= 8 && hours < 21) {
        return next();
    }
    // Allow admins or debug mode if needed, but strictly following spec for now
    // Spec: "в другое время на любое действие пользователя отправляется сообщение о нерабочем времени"
    // Avoid replying to updates that are not messages or callbacks if possible, but "любое действие" implies all relevant updates
    if (ctx.message || ctx.callbackQuery) {
        try {
            if (ctx.callbackQuery) {
                await ctx.answerCallbackQuery({ text: "Мы сейчас закрыты. Работаем с 8 до 21 по МСК.", show_alert: true });
            }
            else {
                await ctx.reply("Мы сейчас закрыты. Работаем с 8 до 21 по МСК. Ждем вас завтра! 😴");
            }
        }
        catch (err) {
            logger_js_1.logger.error({ err }, "Failed to send closed message");
        }
    }
}
//# sourceMappingURL=checkTime.js.map