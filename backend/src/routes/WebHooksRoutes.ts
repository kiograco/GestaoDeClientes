import express from "express";
// import isAuth from "../middleware/isAuth";

import * as HooksController from "../controllers/WebHooksController";
import rateLimit from "../middleware/rateLimit";

const webHooksRoutes = express.Router();

const wabaWebhookRateLimit = rateLimit({ windowMs: 60 * 1000, max: 120 });

webHooksRoutes.get(
  "/wabahooks/meta/:token",
  wabaWebhookRateLimit,
  HooksController.CheckServiceWabaMeta
);

webHooksRoutes.post(
  "/wabahooks/meta/:token",
  wabaWebhookRateLimit,
  HooksController.ReceivedRequestWabaMeta
);

export default webHooksRoutes;
