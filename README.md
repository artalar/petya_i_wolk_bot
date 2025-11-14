# Petya i Wolk Bot

A Telegram bot built with [Grammy.dev](https://grammy.dev) and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your bot token to `.env`:
```
BOT_TOKEN=your_bot_token_here
```

To get a bot token, talk to [@BotFather](https://t.me/BotFather) on Telegram.

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