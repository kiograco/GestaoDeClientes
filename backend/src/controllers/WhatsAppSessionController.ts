import { Request, Response } from "express";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { logger } from "../utils/logger";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";

const ensureMetaConnection = (channel: {
  type: string;
  wabaBSP?: string;
}): void => {
  if (channel.type !== "waba" || channel.wabaBSP !== "meta") {
    throw new AppError("ERR_ONLY_META_WHATSAPP_SUPPORTED", 400);
  }
};

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  const whatsapp = await ShowWhatsAppService({
    id: whatsappId,
    tenantId,
    isInternal: true
  });

  ensureMetaConnection(whatsapp);

  StartWhatsAppSession(whatsapp).catch(error =>
    logger.error(`Erro ao iniciar conexao ${whatsapp.id}: ${error}`)
  );

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;

  const { whatsapp } = await UpdateWhatsAppService({
    whatsappId,
    whatsappData: { session: "", qrcode: null },
    tenantId
  });

  ensureMetaConnection(whatsapp);

  StartWhatsAppSession(whatsapp).catch(error =>
    logger.error(`Erro ao iniciar conexao ${whatsapp.id}: ${error}`)
  );

  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });

  ensureMetaConnection(channel);

  const io = getIO();

  try {
    await channel.update({
      status: "DISCONNECTED",
      session: "",
      qrcode: null,
      retries: 0
    });
  } catch (error) {
    logger.error(error);
    await channel.update({
      status: "DISCONNECTED",
      session: "",
      qrcode: null,
      retries: 0
    });

    io.emit(`${channel.tenantId}:whatsappSession`, {
      action: "update",
      session: channel
    });
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  io.emit(`${channel.tenantId}:whatsappSession`, {
    action: "update",
    session: channel
  });

  return res.status(200).json({ message: "Session disconnected." });
};

export default { store, remove, update };
