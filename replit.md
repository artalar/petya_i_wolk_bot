# Petya and Wolk Bot - Replit Setup

## Project Overview
This is a Telegram bot for ordering coffee and drinks, built with Grammy.dev (Telegram bot framework) and TypeScript. The bot provides an interactive ordering system with YooKassa payment integration.

**Current Status**: Successfully imported and running on Replit as of November 27, 2025.

## Features
- Interactive order conversation flow
- Multiple drink categories (black coffee, milk coffee, tea, etc.)
- Alternative milk options and syrup add-ons
- YooKassa payment integration for processing orders
- Customizable preparation time
- Order tracking and notifications to admin group
- Session management with file-based storage

The main features list and specification detailes stored in [SPECIFICATION.md](./SPECIFICATION.md)!

## Project Structure
```
├── src/
│   ├── bot.ts              # Main bot setup and middleware
│   ├── index.ts            # Entry point
│   ├── config.ts           # Environment configuration
│   ├── context.ts          # Custom context type
│   ├── db.ts               # Database management
│   ├── logger.ts           # Logging setup
│   ├── orderFlow.ts        # Order conversation flow
│   ├── orderCallback.ts    # Order callback handlers
│   ├── types.ts            # TypeScript types
│   ├── commands/           # Bot commands
│   ├── middleware/         # Custom middleware
│   └── services/           # External services (payments)
├── sessions/               # File-based session storage
├── db.json                 # Local JSON database
└── package.json            # Dependencies and scripts
```

## Technology Stack
- **Runtime**: Node.js with TypeScript
- **Bot Framework**: Grammy.dev
- **Payment Provider**: YooKassa
- **Session Storage**: File-based (@grammyjs/storage-file)
- **Logging**: Pino with pretty printing

## Environment Configuration

### Secrets (Encrypted)
- `BOT_TOKEN`: Telegram bot token from @BotFather
- `YOOKASSA_SHOP_ID`: YooKassa merchant ID
- `YOOKASSA_SECRET_KEY`: YooKassa API secret key

### Environment Variables (Shared)
- `BOT_NAME`: Bot username (e.g., Petya_and_wolk_bot)
- `ADMIN_GROUP_ID`: Chat ID for order notifications
- `NODE_ENV`: Environment mode (defaults to 'development')

## Running the Bot

### Development Mode
The bot runs automatically via the "Telegram Bot" workflow using:
```bash
npm run dev
```
This uses `tsx watch` for hot-reloading during development.

### Production Mode
```bash
npm run build    # Compile TypeScript
npm start        # Run compiled code
```

## Important Notes
- This is a backend service (no frontend/web interface)
- The bot communicates via Telegram's API
- Sessions are stored in the `sessions/` directory
- Database is stored in `db.json` (file-based)
- All environment variables are already configured in Replit Secrets

## Bot Commands
- `/start` - Begin new order
- `/menu` - Show drink menu
- `/admin` - Admin panel (for authorized users)

## Payment Testing
See the following documentation files for YooKassa integration:
- `YOOKASSA_SETUP.md` - Setup and deployment guide
- `YOOKASSA_TEST_GUIDE.md` - Testing instructions
- `YOOKASSA_TEST_DATA.md` - Test cards and scenarios

## Deployment
This bot is currently running in development mode on Replit. For production deployment, ensure:
1. All environment variables are set correctly
2. YooKassa account is in production mode (not test mode)
3. Bot webhook is properly configured (if using webhooks instead of polling)

## Recent Changes
- **November 27, 2025**: Imported from GitHub and configured for Replit environment
  - Installed all dependencies
  - Configured environment variables and secrets
  - Set up development workflow
  - Verified bot starts successfully as @Petya_and_wolk_bot
