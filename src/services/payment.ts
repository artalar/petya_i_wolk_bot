import { config } from "../config.js";
import { logger } from "../logger.js";
import { randomUUID } from "crypto";

const YOOKASSA_API_URL = "https://api.yookassa.ru/v3/payments";

interface YookassaPayment {
  id: string;
  status: string;
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
}

export async function createPayment(amount: number, description: string, customerEmail?: string): Promise<YookassaPayment | null> {
  const idempotencyKey = randomUUID();
  
  const paymentRequest = {
    amount: {
      value: amount.toFixed(2),
      currency: "RUB",
    },
    capture: true,
    payment_method_data: {
      type: "bank_card",
    },
    confirmation: {
      type: "redirect",
      return_url: `https://t.me/${config.botName}`,
    },
    description,
    receipt: {
      customer: {
        email: customerEmail || "customer@example.com",
      },
      items: [
        {
          description: description.slice(0, 128),
          quantity: "1",
          amount: {
            value: amount.toFixed(2),
            currency: "RUB",
          },
          vat_code: 1,
          payment_subject: "service",
          payment_mode: "full_payment",
        },
      ],
    },
  };
  
  logger.info({ amount, description, idempotencyKey, paymentRequest }, "Creating payment");
  
  const authString = Buffer.from(`${config.yookassaShopId}:${config.yookassaSecretKey}`).toString("base64");
  
  const response = await fetch(YOOKASSA_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Basic ${authString}`,
      "Idempotence-Key": idempotencyKey,
    },
    body: JSON.stringify(paymentRequest),
  });
  
  const responseData = await response.json() as YookassaPayment & { type?: string; description?: string };
  
  if (!response.ok) {
    logger.error({ 
      status: response.status,
      responseData,
      amount, 
      description,
    }, "Yookassa payment creation failed");
    return null;
  }
  
  logger.info({ paymentId: responseData.id, status: responseData.status }, "Payment created successfully");
  return responseData;
}

export async function checkPayment(paymentId: string): Promise<'succeeded' | 'pending' | 'failed'> {
  const authString = Buffer.from(`${config.yookassaShopId}:${config.yookassaSecretKey}`).toString("base64");
  
  const response = await fetch(`${YOOKASSA_API_URL}/${paymentId}`, {
    method: "GET",
    headers: {
      "Authorization": `Basic ${authString}`,
    },
  });
  
  if (!response.ok) {
    logger.error({ paymentId, status: response.status }, "Yookassa payment check failed");
    return 'failed';
  }
  
  const payment = await response.json() as YookassaPayment;
  logger.info({ paymentId, status: payment.status }, "Payment status checked");
  
  if (payment.status === "succeeded") {
    return 'succeeded';
  }
  if (payment.status === "pending" || payment.status === "waiting_for_capture") {
    return 'pending';
  }
  return 'failed';
}

