import YooKassa from "yookassa";
import { logger } from "../logger";

interface YooKassaConfig {
  shopId: string;
  secretKey: string;
}

interface CreatePaymentParams {
  amount: number;
  orderId: string;
  description: string;
  returnUrl: string;
  customerEmail?: string;
}

interface PaymentResponse {
  id: string;
  status: string;
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  test: boolean;
  created_at: string;
  metadata?: Record<string, string>;
}

interface PaymentStatus {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  test: boolean;
}

class YooKassaService {
  private client: YooKassa | null = null;
  private config: YooKassaConfig | null = null;

  initialize(config: YooKassaConfig): void {
    this.config = config;
    this.client = new YooKassa({
      shopId: config.shopId,
      secretKey: config.secretKey,
    });

    const log = logger.child({ service: "yookassa" });
    log.info("YooKassa service initialized");
  }

  isInitialized(): boolean {
    return this.client !== null && this.config !== null;
  }

  private ensureInitialized(): void {
    if (!this.isInitialized()) {
      throw new Error("YooKassa service is not initialized");
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    this.ensureInitialized();

    const log = logger.child({
      action: "create_payment",
      orderId: params.orderId,
    });

    try {
      const idempotenceKey = `${params.orderId}-${Date.now()}`;

      const payment = await this.client!.createPayment(
        {
          amount: {
            value: params.amount.toFixed(2),
            currency: "RUB",
          },
          confirmation: {
            type: "redirect",
            return_url: params.returnUrl,
          },
          capture: true,
          description: params.description,
          metadata: {
            order_id: params.orderId,
          },
        },
        idempotenceKey
      );

      log.info(
        {
          paymentId: payment.id,
          amount: payment.amount.value,
          test: payment.test,
        },
        "Payment created successfully"
      );

      return payment as PaymentResponse;
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        "Failed to create payment"
      );
      throw error;
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    this.ensureInitialized();

    const log = logger.child({
      action: "get_payment_status",
      paymentId,
    });

    try {
      const payment = await this.client!.getPayment(paymentId);

      log.info(
        {
          paymentId: payment.id,
          status: payment.status,
          paid: payment.paid,
        },
        "Payment status retrieved"
      );

      return {
        id: payment.id,
        status: payment.status as PaymentStatus["status"],
        paid: payment.paid,
        test: payment.test,
      };
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          paymentId,
        },
        "Failed to get payment status"
      );
      throw error;
    }
  }

  async capturePayment(
    paymentId: string,
    amount?: number
  ): Promise<PaymentResponse> {
    this.ensureInitialized();

    const log = logger.child({
      action: "capture_payment",
      paymentId,
    });

    try {
      const captureData = amount
        ? {
            amount: {
              value: amount.toFixed(2),
              currency: "RUB",
            },
          }
        : {};

      const payment = await this.client!.capturePayment(
        paymentId,
        captureData,
        `capture-${paymentId}-${Date.now()}`
      );

      log.info(
        {
          paymentId: payment.id,
          status: payment.status,
        },
        "Payment captured successfully"
      );

      return payment as PaymentResponse;
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          paymentId,
        },
        "Failed to capture payment"
      );
      throw error;
    }
  }

  async cancelPayment(paymentId: string): Promise<PaymentResponse> {
    this.ensureInitialized();

    const log = logger.child({
      action: "cancel_payment",
      paymentId,
    });

    try {
      const payment = await this.client!.cancelPayment(
        paymentId,
        `cancel-${paymentId}-${Date.now()}`
      );

      log.info(
        {
          paymentId: payment.id,
          status: payment.status,
        },
        "Payment cancelled successfully"
      );

      return payment as PaymentResponse;
    } catch (error) {
      log.error(
        {
          error: error instanceof Error ? error.message : String(error),
          paymentId,
        },
        "Failed to cancel payment"
      );
      throw error;
    }
  }

  getPaymentUrlFromResponse(payment: PaymentResponse): string {
    if (
      payment.confirmation?.type === "redirect" &&
      payment.confirmation.confirmation_url
    ) {
      return payment.confirmation.confirmation_url;
    }
    throw new Error("Payment confirmation URL not found");
  }

  isTestPayment(payment: PaymentResponse | PaymentStatus): boolean {
    return payment.test === true;
  }
}

export const yooKassaService = new YooKassaService();

export type { CreatePaymentParams, PaymentResponse, PaymentStatus };

