import { Request, Response } from "express";
import { createHmac, timingSafeEqual } from "crypto";
import AppError from "../errors/AppError";
import ProcessAsaasWebhookService from "../services/BillingServices/ProcessAsaasWebhookService";
import createAuditLog from "../services/AuditLogService";

const MAX_WEBHOOK_CLOCK_SKEW_MS = 5 * 60 * 1000;

const safeEqual = (left: string, right: string): boolean =>
  left.length === right.length &&
  timingSafeEqual(Buffer.from(left), Buffer.from(right));

const validateWebhookSignature = (req: Request): void => {
  const webhookSecret = process.env.ASAAS_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new AppError("ERR_ASAAS_WEBHOOK_SECRET_NOT_CONFIGURED", 500);
  }

  const signatureHeader = req.headers["asaas-signature"];
  const timestampHeader = req.headers["asaas-timestamp"];
  const signature = Array.isArray(signatureHeader)
    ? signatureHeader[0]
    : signatureHeader;
  const timestamp = Array.isArray(timestampHeader)
    ? timestampHeader[0]
    : timestampHeader;

  const rawBody = (req as LegacyAny).rawBody as Buffer | undefined;

  if (!signature || !timestamp || !rawBody) {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_SIGNATURE", 401);
  }

  const timestampMs = Number(timestamp);
  if (
    !Number.isFinite(timestampMs) ||
    Math.abs(Date.now() - timestampMs) > MAX_WEBHOOK_CLOCK_SKEW_MS
  ) {
    throw new AppError("ERR_ASAAS_WEBHOOK_TIMESTAMP_EXPIRED", 401);
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody.toString("utf8")}`)
    .digest("hex");

  if (!safeEqual(signature, expectedSignature)) {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_SIGNATURE", 401);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedHeader = req.headers["asaas-access-token"];
  const receivedToken = Array.isArray(receivedHeader)
    ? receivedHeader[0]
    : receivedHeader;

  if (!configuredToken) {
    throw new AppError("ERR_ASAAS_WEBHOOK_TOKEN_NOT_CONFIGURED", 503);
  }

  const validToken =
    typeof receivedToken === "string" &&
    safeEqual(receivedToken, configuredToken);

  if (!validToken) {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_TOKEN", 401);
  }
  if (!req.body?.event || typeof req.body.event !== "string") {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_PAYLOAD", 400);
  }

  validateWebhookSignature(req);

  await ProcessAsaasWebhookService(req.body);
  await createAuditLog({
    action: "billing.webhook_asaas",
    resource: "payment_webhook",
    resourceId: req.body.id,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata: {
      event: req.body.event,
      externalPaymentId: req.body.payment?.id
    }
  });
  return res.status(200).json({ received: true });
};
