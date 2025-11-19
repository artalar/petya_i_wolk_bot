import dotenv from 'dotenv';
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN || '',
  yookassaShopId: process.env.YOOKASSA_SHOP_ID || '',
  yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || '',
  adminGroupId: process.env.ADMIN_GROUP_ID || '',
  nodeEnv: process.env.NODE_ENV || 'development',
};

if (!config.botToken) {
  console.error('BOT_TOKEN is missing in .env');
  process.exit(1);
}

