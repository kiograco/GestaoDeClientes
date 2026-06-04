import request from "supertest";
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

    await request(app)
      .post("/webhooks/asaas")
      .send({
        id: "evt_webhook_123",
        event: "PAYMENT_RECEIVED",
        payment: { id: "pay_webhook_123", status: "RECEIVED" }
      })
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
});
