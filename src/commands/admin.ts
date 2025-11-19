import { Context } from '../context.js';
import { InlineKeyboard } from 'grammy';
import { config } from '../config.js';
import { getSettings, updateSettings } from '../db.js';

export async function showAdminPanel(ctx: Context) {
  // Check if we are in the admin group
  if (String(ctx.chat?.id) !== config.adminGroupId) {
      // If it's a private chat, maybe check if user is admin? 
      // Spec says "доступна только в админском чате". 
      // So we strictly check the group ID.
      return; 
  }

  const settings = await getSettings();
  const keyboard = buildAdminKeyboard(settings);

  await ctx.reply("⚙️ *Панель управления*", {
      reply_markup: keyboard,
      parse_mode: "Markdown"
  });
}

export async function handleAdminCallback(ctx: Context) {
    const data = ctx.callbackQuery?.data;
    if (!data || !data.startsWith('admin_')) return;

    // Verify permission (redundant but safe if callback comes from shared link, though unlikely)
    // Callbacks happen in the chat context where the button was clicked.
    if (String(ctx.chat?.id) !== config.adminGroupId) {
        return ctx.answerCallbackQuery("Нет доступа");
    }

    const action = data.replace('admin_', '');
    const settings = await getSettings();
    let newSettings = { ...settings };

    if (action === 'toggle_status') {
        newSettings.isBotActive = !settings.isBotActive;
    } else if (action === 'toggle_payment') {
        newSettings.isOnlinePaymentActive = !settings.isOnlinePaymentActive;
    }

    await updateSettings(newSettings);
    
    const keyboard = buildAdminKeyboard(newSettings);
    try {
        await ctx.editMessageReplyMarkup({ reply_markup: keyboard });
    } catch (e) {
        // Ignore if not changed
    }
    return ctx.answerCallbackQuery();
}

function buildAdminKeyboard(settings: { isBotActive: boolean; isOnlinePaymentActive: boolean; availableTimes: number[] }) {
    const keyboard = new InlineKeyboard();

    // Status button
    const statusText = settings.isBotActive ? "🟢 Бот Активен" : "🔴 Бот Не активен";
    keyboard.text(statusText, "admin_toggle_status").row();

    // Payment button
    const paymentText = settings.isOnlinePaymentActive ? "🟢 Оплата онлайн вкл" : "🔴 Оплата онлайн выкл";
    keyboard.text(paymentText, "admin_toggle_payment").row();

    return keyboard;
}
