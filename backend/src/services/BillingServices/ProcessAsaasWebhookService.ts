import sequelize from "../../database";
import Payment from "../../models/Payment";
import PaymentWebhookEvent from "../../models/PaymentWebhookEvent";
import Plan from "../../models/Plan";
import Subscription from "../../models/Subscription";
import Tenant from "../../models/Tenant";
import RenewCompanyAccessService from "./RenewCompanyAccessService";

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
      rawPayload: payload
    }
  });
  if (webhookEvent.processedAt || !externalPaymentId) return;

  const payment = await Payment.findOne({
    where: { externalPaymentId },
    include: [{ model: Plan }]
  });
  if (!payment) {
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
