import request from "supertest";
import { createHmac } from "crypto";
import Order from "../../src/models/Order";
import OrderPayment from "../../src/models/OrderPayment";
import PaymentWebhookEvent from "../../src/models/PaymentWebhookEvent";
import { createOrder, createOrderPayment } from "../factories";
import { makeTestApp } from "../helpers/app";

jest.mock(
  "../../src/services/DeliveryOrderServices/NotifyDeliveryOrderStatusService",
  () => ({
    __esModule: true,
    default: jest.fn(async () => undefined)
  })
);

describe("payment webhooks", () => {
  it("processa webhook Asaas e confirma pedido aguardando pagamento", async () => {
    const app = await makeTestApp();
    const order = await createOrder({ status: "WAITING_PAYMENT" });
    const payment = await createOrderPayment({
      tenantId: order.tenantId,
      orderId: order.id,
      externalPaymentId: "pay_webhook_123"
    });

    const rawBody = JSON.stringify({
      id: "evt_webhook_123",
      event: "PAYMENT_RECEIVED",
      payment: { id: "pay_webhook_123", status: "RECEIVED" }
    });
    const timestamp = Date.now().toString();
    const signature = createHmac(
      "sha256",
      process.env.ASAAS_WEBHOOK_SECRET as string
    )
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");

    await request(app)
      .post("/api/v1/webhooks/asaas")
      .set("asaas-access-token", "test-asaas-webhook-token")
      .set("asaas-signature", signature)
      .set("asaas-timestamp", timestamp)
      .type("json")
      .send(rawBody)
      .expect(200)
      .expect(({ body }) => {
        expect(body.received).toBe(true);
      });

    await order.reload();
    await payment.reload();

    expect(order.status).toBe("CONFIRMED");
    expect(payment.status).toBe("PAID");
    expect(await PaymentWebhookEvent.count()).toBe(1);
    expect(await Order.count()).toBe(1);
    expect(await OrderPayment.count()).toBe(1);
  });

  it("rejeita webhook Asaas sem token valido", async () => {
    const app = await makeTestApp();

    await request(app)
      .post("/api/v1/webhooks/asaas")
      .send({
        id: "evt_webhook_invalid_token",
        event: "PAYMENT_RECEIVED",
        payment: { id: "pay_webhook_123", status: "RECEIVED" }
      })
      .expect(401);

    expect(await PaymentWebhookEvent.count()).toBe(0);
  });
});
