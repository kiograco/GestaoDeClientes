import sequelize from "../../database";
import Payment from "../../models/Payment";
import PaymentWebhookEvent from "../../models/PaymentWebhookEvent";
import Plan from "../../models/Plan";
import Subscription from "../../models/Subscription";
import Tenant from "../../models/Tenant";
import RenewCompanyAccessService from "./RenewCompanyAccessService";
import OrderPayment from "../../models/OrderPayment";
import Order from "../../models/Order";
import OrderStatusHistory from "../../models/OrderStatusHistory";
import { getIO } from "../../libs/socket";
import NotifyDeliveryOrderStatusService from "../DeliveryOrderServices/NotifyDeliveryOrderStatusService";

interface WebhookPayload {
  id?: string;
  event: string;
  payment?: {
    id: string;
    status?: string;
  };
}

const refundEvents = [
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "PAYMENT_AWAITING_CHARGEBACK_REVERSAL",
  "PAYMENT_DUNNING_REQUESTED"
];
const failedEvents = ["PAYMENT_OVERDUE", "PAYMENT_DELETED"];

const ProcessAsaasWebhookService = async (
  payload: WebhookPayload
): Promise<void> => {
  const externalPaymentId = payload.payment?.id;
  const externalEventId =
    payload.id || `${payload.event}:${externalPaymentId || "unknown"}`;
  const [webhookEvent] = await PaymentWebhookEvent.findOrCreate({
    where: { externalEventId },
    defaults: {
      gateway: "asaas",
      externalEventId,
      eventType: payload.event,
      externalPaymentId,
      rawPayload: payload as unknown as Record<string, unknown>
    }
  });
  if (webhookEvent.processedAt || !externalPaymentId) return;

  const payment = await Payment.findOne({
    where: { externalPaymentId },
    include: [{ model: Plan }]
  });
  if (!payment) {
    const orderPayment = await OrderPayment.findOne({
      where: { externalPaymentId },
      include: [{ model: Order }]
    });
    if (orderPayment) {
      let updatedOrder: Order | undefined;
      await sequelize.transaction(async transaction => {
        if (payload.event === "PAYMENT_RECEIVED") {
          await orderPayment.update({ status: "PAID" }, { transaction });
          if (
            orderPayment.order &&
            ["NEW", "WAITING_PAYMENT"].includes(orderPayment.order.status)
          ) {
            const oldStatus = orderPayment.order.status;
            await orderPayment.order.update(
              { status: "CONFIRMED" },
              { transaction }
            );
            await OrderStatusHistory.create(
              {
                orderId: orderPayment.order.id,
                oldStatus,
                newStatus: "CONFIRMED",
                changedBy: null
              } as LegacyAny,
              { transaction }
            );
            updatedOrder = orderPayment.order;
          }
        } else if (refundEvents.includes(payload.event)) {
          await orderPayment.update({ status: "REFUNDED" }, { transaction });
        } else if (failedEvents.includes(payload.event)) {
          await orderPayment.update({ status: "FAILED" }, { transaction });
        }
      });
      if (updatedOrder) {
        getIO().emit(`${orderPayment.tenantId}:delivery:order`, {
          action: "update",
          order: updatedOrder
        });
        await NotifyDeliveryOrderStatusService(
          orderPayment.tenantId,
          undefined,
          updatedOrder
        );
      }
    }
    await webhookEvent.update({ processedAt: new Date() });
    return;
  }

  if (payload.event === "PAYMENT_RECEIVED") {
    await RenewCompanyAccessService(
      payment.companyId,
      payment.plan.durationDays,
      payment.id,
      payment.plan.limits
    );
  } else if (
    payload.event === "PAYMENT_CONFIRMED" &&
    payment.method === "CARD" &&
    process.env.ASAAS_RENEW_ON_CARD_CONFIRMED === "true"
  ) {
    await RenewCompanyAccessService(
      payment.companyId,
      payment.plan.durationDays,
      payment.id,
      payment.plan.limits
    );
  } else {
    await sequelize.transaction(async transaction => {
      await payment.update(
        { status: payload.payment?.status || payload.event },
        { transaction }
      );
      if (payload.event === "PAYMENT_OVERDUE") {
        await Subscription.update(
          { status: "overdue" },
          { where: { id: payment.subscriptionId }, transaction }
        );
      }
      if (
        refundEvents.includes(payload.event) &&
        process.env.ASAAS_SUSPEND_ON_REFUND === "true"
      ) {
        await Tenant.update(
          { status: "inactive" },
          { where: { id: payment.companyId }, transaction }
        );
      }
    });
  }

  await webhookEvent.update({ processedAt: new Date() });
};

export default ProcessAsaasWebhookService;
