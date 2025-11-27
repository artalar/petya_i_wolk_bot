"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
const grammy_1 = require("grammy");
const storage_file_1 = require("@grammyjs/storage-file");
const config_js_1 = require("./config.js");
const logger_js_1 = require("./logger.js");
const checkTime_js_1 = require("./middleware/checkTime.js");
const checkDate_js_1 = require("./middleware/checkDate.js");
const checkStatus_js_1 = require("./middleware/checkStatus.js");
const orderFlow_js_1 = require("./orderFlow.js");
const orderCallback_js_1 = require("./orderCallback.js");
const menu_js_1 = require("./commands/menu.js");
const admin_js_1 = require("./commands/admin.js");
exports.bot = new grammy_1.Bot(config_js_1.config.botToken);
// Middleware
exports.bot.use((0, grammy_1.session)({
    initial: () => ({}),
    storage: new storage_file_1.FileAdapter({ dirName: 'sessions' })
}));
exports.bot.use(checkStatus_js_1.checkBotStatus);
exports.bot.use(checkTime_js_1.checkWorkHours);
exports.bot.use(checkDate_js_1.checkMessageDate);
// Logging middleware
exports.bot.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    logger_js_1.logger.info({
        update_id: ctx.update.update_id,
        user: ctx.from?.id,
        type: ctx.update.message ? 'message' : ctx.update.callback_query ? 'callback_query' : 'other',
        duration: ms
    }, 'Update processed');
});
// Commands
exports.bot.command('start', orderFlow_js_1.startOrder);
exports.bot.command('menu', menu_js_1.showMenu);
exports.bot.command('admin', admin_js_1.showAdminPanel);
// Callbacks
exports.bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    if (data.startsWith('admin_')) {
        return (0, admin_js_1.handleAdminCallback)(ctx);
    }
    if (data.startsWith('high_load_')) {
        const userId = Number(data.replace('high_load_', ''));
        if (!userId) {
            await ctx.answerCallbackQuery("Ошибка: ID пользователя не найден.");
            return;
        }
        try {
            await ctx.api.sendMessage(userId, "Сейчас у нас высокая загрузка, но мы постараемся приготовить ваш заказ в течении 10 минут.");
            await ctx.answerCallbackQuery("Уведомление отправлено пользователю.");
        }
        catch (e) {
            logger_js_1.logger.error({ err: e }, "Failed to send high load notification");
            await ctx.answerCallbackQuery("Ошибка отправки (бот заблокирован?).");
        }
        return;
    }
    return next();
});
exports.bot.on('callback_query:data', orderCallback_js_1.handleOrderCallback);
// Handle any messages as comments for steps 2-8
exports.bot.on('message', async (ctx) => {
    const order = ctx.session.currentOrder;
    if (!order)
        return;
    if (order.step >= 2 && order.step <= 8 && order.messageId) {
        let commentText = '';
        if (ctx.message.text) {
            commentText = ctx.message.text;
        }
        else if (ctx.message.caption) {
            commentText = ctx.message.caption;
        }
        else if (ctx.message.sticker) {
            commentText = '[Стикер]';
        }
        else if (ctx.message.photo) {
            commentText = '[Фото]';
        }
        else if (ctx.message.voice) {
            commentText = '[Голосовое сообщение]';
        }
        else if (ctx.message.video) {
            commentText = '[Видео]';
        }
        else if (ctx.message.document) {
            commentText = '[Документ]';
        }
        else if (ctx.message.audio) {
            commentText = '[Аудио]';
        }
        else {
            commentText = '[Сообщение]';
        }
        if (!order.comments) {
            order.comments = [];
        }
        order.comments.push(commentText);
        try {
            await ctx.deleteMessage();
        }
        catch {
            // Ignore if can't delete
        }
        const { buildOrderSummary, findItem } = await Promise.resolve().then(() => __importStar(require('./orderFlow.js')));
        const { getSettings } = await Promise.resolve().then(() => __importStar(require('./db.js')));
        const { InlineKeyboard } = await Promise.resolve().then(() => __importStar(require('grammy')));
        const { MENU, SYRUPS, ALT_MILKS } = await Promise.resolve().then(() => __importStar(require('./consts.js')));
        let stepMessage = "";
        const keyboard = new InlineKeyboard();
        switch (order.step) {
            case 2:
                stepMessage = "Отличный выбор! Какой именно?";
                MENU.black_coffee.forEach((item) => {
                    keyboard.text(item.name, `item_${item.id}`).row();
                });
                keyboard.row().text("Назад", "back");
                break;
            case 3:
                stepMessage = "Отличный выбор! Какой именно?";
                MENU.milk_coffee.forEach((item) => {
                    keyboard.text(item.name, `item_${item.id}`).row();
                });
                keyboard.row().text("Назад", "back");
                break;
            case 4: {
                stepMessage = "Отличный выбор! Теперь давайте определимся с объемом!";
                const item = findItem(order.itemCode);
                if (item?.volumes) {
                    Object.keys(item.volumes).forEach((vol) => {
                        keyboard.text(`${vol} л`, `vol_${vol}`).row();
                    });
                }
                keyboard.row().text("Назад", "back");
                break;
            }
            case 5:
                stepMessage = "Отличный выбор! Какой именно?";
                MENU.tea.forEach((item) => {
                    keyboard.text(item.name, `item_${item.id}`).row();
                });
                keyboard.row().text("Назад", "back");
                break;
            case 6:
                stepMessage = "Может на альтернативном молоке?";
                keyboard.text("Спасибо, не надо", "milk_none").row();
                ALT_MILKS.forEach((m) => keyboard.text(m, `milk_${m}`).row());
                keyboard.row().text("Назад", "back");
                break;
            case 7:
                stepMessage = "А как насчет сиропа?";
                keyboard.text("Спасибо, не надо", "syrup_none").row();
                SYRUPS.forEach((s) => keyboard.text(s, `syrup_${s}`).row());
                keyboard.row().text("Назад", "back");
                break;
            case 8: {
                stepMessage = "Чудесно! Как будете оплачивать заказ?";
                keyboard.text("➕ Добавить еще напиток", "add_more").row();
                keyboard.text("Оплатить на кассе", "pay_cash").row();
                const settings = await getSettings();
                if (settings.isOnlinePaymentActive) {
                    keyboard.text("Оплатить онлайн", "pay_online").row();
                }
                keyboard.row().text("Назад", "back");
                break;
            }
        }
        const summary = buildOrderSummary(order);
        const commentHint = "\n\nНам можно написать комментарий к заказу в сообщении 😉";
        let fullText = summary;
        if (summary && stepMessage) {
            fullText += "\n\n\n" + stepMessage;
        }
        else {
            fullText += stepMessage;
        }
        fullText += commentHint;
        try {
            await ctx.api.editMessageText(ctx.chat.id, order.messageId, fullText, {
                reply_markup: keyboard,
                parse_mode: "Markdown",
            });
        }
        catch {
            // Ignore if can't edit
        }
    }
});
// Error handling
exports.bot.catch((err) => {
    const ctx = err.ctx;
    logger_js_1.logger.error({ err: err.error, update_id: ctx.update.update_id }, `Error while handling update ${ctx.update.update_id}:`);
    const e = err.error;
    if (e instanceof grammy_1.GrammyError) {
        logger_js_1.logger.error({ description: e.description }, "Error in request");
    }
    else if (e instanceof grammy_1.HttpError) {
        logger_js_1.logger.error({ err: e }, "Could not contact Telegram");
    }
    else {
        logger_js_1.logger.error({ err: e }, "Unknown error");
    }
});
//# sourceMappingURL=bot.js.map