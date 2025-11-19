# Petya i Wolk Bot

A Telegram bot for ordering coffee and drinks, built with [Grammy.dev](https://grammy.dev) and TypeScript.

## Features

- 🤖 Interactive order conversation flow
- ☕ Multiple drink categories (black coffee, milk coffee, tea, etc.)
- 🥛 Alternative milk options
- 🍯 Syrup add-ons
- 💳 **YooKassa payment integration**
- ⏱️ Customizable preparation time
- 📊 Order tracking and notifications
- 🔒 Secure payment verification

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
BOT_TOKEN=your_bot_token_here
GROUP_CHAT_ID=your_group_chat_id
NODE_ENV=development
YOOKASSA_SHOP_ID=your_yookassa_shop_id
YOOKASSA_SECRET_KEY=your_yookassa_secret_key
PAYMENT_RETURN_URL=https://t.me/your_bot_username
```

**Getting started:**
- Bot token: Talk to [@BotFather](https://t.me/BotFather) on Telegram
- YooKassa credentials: Create a test store at [yookassa.ru](https://yookassa.ru)

## Payment Integration

This bot uses **YooKassa** for payment processing. See detailed setup guides:

- 📖 [**YOOKASSA_SETUP.md**](./YOOKASSA_SETUP.md) - Complete setup and deployment guide
- 🧪 [**YOOKASSA_TEST_GUIDE.md**](./YOOKASSA_TEST_GUIDE.md) - Testing instructions
- 💳 [**YOOKASSA_TEST_DATA.md**](./YOOKASSA_TEST_DATA.md) - Test cards and scenarios

## Development

Run the bot in development mode (with hot reload):
```bash
npm run dev
```

## Production

Build the project:
```bash
npm run build
```

Run the bot:
```bash
npm start
```

## Type Checking

Check types without building:
```bash
npm run type-check
```