import express from "express";
import * as AsaasWebhookController from "../controllers/AsaasWebhookController";
import * as BillingController from "../controllers/BillingController";
import isBillingAuth from "../middleware/isBillingAuth";

const billingRoutes = express.Router();

billingRoutes.post("/webhooks/asaas", AsaasWebhookController.store);
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
