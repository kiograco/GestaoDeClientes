import { createHmac, timingSafeEqual } from "crypto";
import { Request, Response } from "express";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import HandleMessage360 from "../services/WABA360/HandleMessage360";
import HandleWabaMetaStatus from "../services/WABAMeta/HandleWabaMetaStatus";

const validate360Signature = (req: Request): void => {
  const secret = process.env.DIALOG360_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError("ERR_360_WEBHOOK_SECRET_NOT_CONFIGURED", 500);
  }
  const signature = req.header("d360-signature");
  const rawBody = (req as LegacyAny).rawBody as Buffer | undefined;
  if (!signature || !rawBody) {
    throw new AppError("ERR_360_WEBHOOK_SIGNATURE_MISSING", 403);
  }
  const expected = `sha256=${createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;
  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new AppError("ERR_360_WEBHOOK_SIGNATURE_INVALID", 403);
  }
};

export const ReceivedRequest360 = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    validate360Signature(req);
    // const message = {
    //   token: req.params.token,
    //   messages: req.body
    // };
    // await req.app.rabbit.publishInQueue("waba360", JSON.stringify(message));
  } catch (error) {
    throw new AppError(error.message);
  }
  // Queue.add("SendMessageAPI", newMessage);

  return res.status(200).json({ message: "Message add queue" });
};

const findWabaByWebhookToken = async (token: string): Promise<Whatsapp> => {
  const channel = await Whatsapp.findOne({
    where: { tokenHook: token, type: "waba", wabaBSP: "meta", isDeleted: false }
  });

  if (!channel) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return channel;
};

const validateMetaSignature = (req: Request): void => {
  const appSecret =
    process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET;
  const signature = req.header("x-hub-signature-256");
  const rawBody = (req as LegacyAny).rawBody as Buffer | undefined;

  if (!appSecret || !signature || !rawBody) {
    throw new AppError("ERR_META_WEBHOOK_SIGNATURE", 403);
  }

  const expected = `sha256=${createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex")}`;

  if (
    expected.length !== signature.length ||
    !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    throw new AppError("ERR_META_WEBHOOK_SIGNATURE", 403);
  }
};

export const CheckServiceWabaMeta = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || verifyToken !== req.params.token) {
    return res.status(403).json({ error: "Invalid verify token" });
  }

  await findWabaByWebhookToken(req.params.token);
  return res.status(200).send(challenge);
};

export const ReceivedRequestWabaMeta = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    validateMetaSignature(req);
    const channel = await findWabaByWebhookToken(req.params.token);
    const entries = req.body?.entry || [];

    await Promise.all(
      entries.flatMap((entry: LegacyAny) =>
        (entry.changes || []).map(async (change: LegacyAny) => {
          const { value } = change;

          if (value?.statuses?.length) {
            await HandleWabaMetaStatus(value.statuses);
          }

          if (!value?.messages?.length) return;

          await HandleMessage360(
            {
              contacts: value.contacts || [],
              messages: value.messages
            },
            channel.id
          );
        })
      )
    );
  } catch (error) {
    throw new AppError(error.message);
  }

  return res.status(200).json({ message: "Message add queue" });
};

export const CheckServiceMessenger = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const challenge = req.query["hub.challenge"];
  console.log("WEBHOOK_VERIFIED");
  return res.status(200).send(challenge);
};

export const ReceivedRequestMessenger = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    // const message = {
    //   token: req.params.token,
    //   messages: req.body
    // };
    // await req.app.rabbit.publishInQueue("messenger", JSON.stringify(message));
  } catch (error) {
    throw new AppError(error.message);
  }
  // Queue.add("SendMessageAPI", newMessage);

  return res.status(200).json({ message: "Message add queue" });
};
