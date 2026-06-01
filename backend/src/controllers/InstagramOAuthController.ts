import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import {
  connectInstagramOAuthChannel,
  getInstagramAuthorizationUrl
} from "../services/InstagramOAuthServices/InstagramOAuthService";
import { getInstagramOAuthConfig } from "../services/InstagramOAuthServices/InstagramOAuthConfig";
import { handleInstagramOAuthWebhookEvent } from "../services/InstagramOAuthServices/InstagramOAuthMessageService";
import { logger } from "../utils/logger";

export const authorize = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const channel = await Whatsapp.findOne({
    where: {
      id: req.params.whatsappId,
      tenantId: req.user.tenantId,
      type: "instagram_oauth"
    }
  });
  if (!channel) throw new AppError("ERR_NO_WAPP_FOUND", 404);
  return res.json({ url: getInstagramAuthorizationUrl(channel) });
};

export const callback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { code, state, error } = req.query as Record<string, string>;
  if (error || !code || !state) {
    throw new AppError("ERR_INSTAGRAM_OAUTH_DENIED", 400);
  }
  await connectInstagramOAuthChannel(code, state);
  return res
    .status(200)
    .type("html")
    .send(
      "<html><body><script>window.close()</script>Instagram conectado. Esta janela pode ser fechada.</body></html>"
    );
};

export const verifyWebhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { verifyToken } = getInstagramOAuthConfig();
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode !== "subscribe" || token !== verifyToken) {
    throw new AppError("ERR_INSTAGRAM_WEBHOOK_VERIFY", 403);
  }
  return res.status(200).send(challenge);
};

export const webhook = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { appSecret } = getInstagramOAuthConfig();
  const signature = req.header("x-hub-signature-256");
  const rawBody = (req as LegacyAny).rawBody as Buffer | undefined;
  if (!signature || !rawBody) {
    throw new AppError("ERR_INSTAGRAM_WEBHOOK_SIGNATURE", 403);
  }
  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new AppError("ERR_INSTAGRAM_WEBHOOK_SIGNATURE", 403);
  }

  const entries = Array.isArray(req.body.entry) ? req.body.entry : [];
  entries.forEach((entry: LegacyAny) => {
    (entry.messaging || []).forEach((event: LegacyAny) => {
      handleInstagramOAuthWebhookEvent(event).catch(error =>
        logger.error(`Instagram webhook processing error: ${error}`)
      );
    });
  });
  return res.status(200).send("EVENT_RECEIVED");
};
