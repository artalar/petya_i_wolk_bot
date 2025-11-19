import YooKassa from 'yookassa';
import { config } from '../config.js';
import { logger } from '../logger.js';

const yookassa = new YooKassa({
  shopId: config.yookassaShopId,
  secretKey: config.yookassaSecretKey
});

export async function createPayment(amount: number, description: string) {
  try {
    const payment = await yookassa.createPayment({
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB'
      },
      capture: true,
      confirmation: {
        type: 'redirect',
        return_url: `https://t.me/${config.botToken.split(':')[0]}` // Redirect to bot
      },
      description
    });
    return payment;
  } catch (error) {
    logger.error({ err: error }, 'Yookassa payment creation failed');
    return null;
  }
}

export async function checkPayment(paymentId: string) {
  try {
    const payment = await yookassa.getPayment(paymentId);
    return payment.status === 'succeeded';
  } catch (error) {
    logger.error({ err: error }, 'Yookassa payment check failed');
    return false;
  }
}

