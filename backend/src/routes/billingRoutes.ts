import express from "express";
import * as AsaasWebhookController from "../controllers/AsaasWebhookController";
import * as BillingController from "../controllers/BillingController";
import isBillingAuth from "../middleware/isBillingAuth";
import rateLimit from "../middleware/rateLimit";

const billingRoutes = express.Router();

const asaasWebhookRateLimit = rateLimit({ windowMs: 60 * 1000, max: 60 });

billingRoutes.post(
  "/webhooks/asaas",
  asaasWebhookRateLimit,
  AsaasWebhookController.store
);
billingRoutes.get(
  "/billing/plans",
  isBillingAuth,
  BillingController.indexPlans
);
billingRoutes.get(
  "/billing/subscription",
  isBillingAuth,
  BillingController.showSubscription
);
billingRoutes.post(
  "/billing/payments",
  isBillingAuth,
  BillingController.storePayment
);

export default billingRoutes;
