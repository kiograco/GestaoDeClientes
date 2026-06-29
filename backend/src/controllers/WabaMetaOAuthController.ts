import { Request, Response } from "express";
import AppError from "../errors/AppError";
import {
  connectWabaMetaChannel,
  getWabaMetaEmbeddedSignupUrl
} from "../services/WABAMeta/WabaMetaOAuthService";

export const authorize = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { tenantId, id: userId } = req.user;
  return res.json({
    url: getWabaMetaEmbeddedSignupUrl({
      tenantId: Number(tenantId),
      userId: Number(userId)
    })
  });
};

export const callback = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { code, state, error } = req.query as Record<string, string>;
  if (error || !code || !state) {
    throw new AppError("ERR_META_WHATSAPP_OAUTH_DENIED", 400);
  }

  await connectWabaMetaChannel(code, state);
  return res
    .status(200)
    .type("html")
    .send(
      "<html><body><script>window.close()</script>WhatsApp Oficial conectado. Esta janela pode ser fechada.</body></html>"
    );
};
