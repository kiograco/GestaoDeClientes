import { Request, Response } from "express";
import AppError from "../errors/AppError";
import ProcessAsaasWebhookService from "../services/BillingServices/ProcessAsaasWebhookService";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const configuredToken = process.env.ASAAS_WEBHOOK_TOKEN;
  const receivedToken = req.headers["asaas-access-token"];
  if (configuredToken && receivedToken !== configuredToken) {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_TOKEN", 401);
  }
  if (!req.body?.event || typeof req.body.event !== "string") {
    throw new AppError("ERR_INVALID_ASAAS_WEBHOOK_PAYLOAD", 400);
  }

  await ProcessAsaasWebhookService(req.body);
  return res.status(200).json({ received: true });
};
