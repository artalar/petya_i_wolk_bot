"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findItem = findItem;
exports.getTotalPrice = getTotalPrice;
exports.buildOrderSummary = buildOrderSummary;
exports.updateOrderMessage = updateOrderMessage;
exports.startOrder = startOrder;
const grammy_1 = require("grammy");
const consts_js_1 = require("./consts.js");
const db_js_1 = require("./db.js");
function findItem(id) {
    for (const category of Object.values(consts_js_1.MENU)) {
        const item = category.find((i) => i.id === id);
        if (item)
            return item;
    }
    return undefined;
}
function formatSingleItem(itemCode, volume, milk, syrup, price) {
    const item = findItem(itemCode);
    let text = `☕️ ${item?.name}`;
    if (volume)
        text += ` (${Number(volume) * 1000}мл)`;
    if (milk)
        text += ` + ${milk}`;
    if (syrup)
        text += ` + ${syrup}`;
    if (price)
        text += ` — ${price}₽`;
    return text;
}
function getTotalPrice(order) {
    const items = order.items || [];
    const itemsTotal = items.reduce((sum, item) => sum + item.price, 0);
    return itemsTotal + order.price;
}
function buildOrderSummary(order) {
    const items = order.items || [];
    if (order.step === 1 && items.length === 0)
        return "";
    let summary = order.orderId
        ? `📋 *Ваш заказ #${order.orderId}:*\n`
        : "📋 *Ваш заказ:*\n";
    items.forEach((item, index) => {
        summary += `${index + 1}. ${formatSingleItem(item.itemCode, item.volume, item.milk, item.syrup, item.price)}\n`;
    });
    if (order.itemCode) {
        const itemNum = items.length + 1;
        const item = findItem(order.itemCode);
        summary += `${itemNum}. ☕️ ${item?.name}`;
        if (order.volume)
            summary += ` (${Number(order.volume) * 1000}мл)`;
        summary += "\n";
        if (order.milk)
            summary += `   🥛 Молоко: ${order.milk}\n`;
        if (order.syrup)
            summary += `   🍬 Сироп: ${order.syrup}\n`;
    }
    else if (order.categoryName && order.step > 1 && order.step < 8) {
        summary += `📂 ${order.categoryName}\n`;
    }
    summary += `⏰ Готовность: в течение 5 минут\n`;
    if (order.comments && order.comments.length > 0) {
        summary += `\n💬 *Комментарии:*\n`;
        order.comments.forEach((comment) => {
            summary += `• ${comment}\n`;
        });
    }
    const total = getTotalPrice(order);
    if (total > 0)
        summary += `\n💰 *Итого: ${total}₽*`;
    return summary;
}
async function updateOrderMessage(ctx, isNew = false) {
    const order = ctx.session.currentOrder;
    if (!order)
        return;
    const summary = buildOrderSummary(order);
    let stepMessage = "";
    let keyboard = new grammy_1.InlineKeyboard();
    switch (order.step) {
        case 1:
            if ((order.items || []).length > 0) {
                stepMessage = "Отлично! Что еще добавим?";
            }
            else {
                stepMessage = "Привет! 🙌 Что вам приготовить?";
            }
            keyboard.text("Черный кофе", "cat_black").row();
            keyboard.text("Молочный кофе", "cat_milk").row();
            keyboard.text("Чай 0,3", "cat_tea");
            break;
        case 2:
            stepMessage = "Отличный выбор! Какой именно?";
            consts_js_1.MENU.black_coffee.forEach((item) => {
                keyboard.text(item.name, `item_${item.id}`).row();
            });
            keyboard.row().text("Назад", "back");
            break;
        case 3:
            stepMessage = "Отличный выбор! Какой именно?";
            consts_js_1.MENU.milk_coffee.forEach((item) => {
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
            consts_js_1.MENU.tea.forEach((item) => {
                keyboard.text(item.name, `item_${item.id}`).row();
            });
            keyboard.row().text("Назад", "back");
            break;
        case 6:
            stepMessage = "Может на альтернативном молоке?";
            keyboard.text("Спасибо, не надо", "milk_none").row();
            consts_js_1.ALT_MILKS.forEach((m) => keyboard.text(m, `milk_${m}`).row());
            keyboard.row().text("Назад", "back");
            break;
        case 7:
            stepMessage = "А как насчет сиропа?";
            keyboard.text("Спасибо, не надо", "syrup_none").row();
            consts_js_1.SYRUPS.forEach((s) => keyboard.text(s, `syrup_${s}`).row());
            keyboard.row().text("Назад", "back");
            break;
        case 8: {
            stepMessage = "Чудесно! Как будете оплачивать заказ?";
            keyboard.text("➕ Добавить еще напиток", "add_more").row();
            keyboard.text("Оплатить на кассе", "pay_cash").row();
            const settings = await (0, db_js_1.getSettings)();
            if (settings.isOnlinePaymentActive) {
                keyboard.text("Оплатить онлайн", "pay_online").row();
            }
            keyboard.row().text("Назад", "back");
            break;
        }
        case 9: {
            stepMessage = "💳 Оплатите заказ по ссылке ниже";
            if (order.paymentUrl) {
                keyboard.url("Перейти к оплате", order.paymentUrl).row();
            }
            keyboard.text("✅ Я оплатил", "pay_check").row();
            keyboard.row().text("Назад", "back");
            break;
        }
        case 10:
            stepMessage = "Супер! Ждем 👍";
            break;
    }
    const commentHint = "\n\nНам можно написать комментарий к заказу в сообщении 😉";
    let fullText = summary;
    if (summary && stepMessage) {
        fullText += "\n\n\n" + stepMessage;
    }
    else {
        fullText += stepMessage;
    }
    if (order.step >= 2 && order.step <= 8) {
        fullText += commentHint;
    }
    if (isNew) {
        const msg = await ctx.reply(fullText, {
            reply_markup: keyboard,
            parse_mode: "Markdown",
        });
        order.messageId = msg.message_id;
    }
    else {
        try {
            await ctx.editMessageText(fullText, {
                reply_markup: keyboard,
                parse_mode: "Markdown",
            });
        }
        catch {
            // Ignore if not modified
        }
    }
}
async function startOrder(ctx) {
    ctx.session.currentOrder = {
        step: 1,
        additions: [],
        price: 0,
        items: [],
    };
    await updateOrderMessage(ctx, true);
}
//# sourceMappingURL=orderFlow.js.map