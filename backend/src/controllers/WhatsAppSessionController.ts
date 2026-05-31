import { Request, Response } from "express";
// import path from "path";
// import { rmdir } from "fs/promises";
import { apagarPastaSessao, getWbot, removeWbot } from "../libs/wbot";
import ShowWhatsAppService from "../services/WhatsappService/ShowWhatsAppService";
import { StartWhatsAppSession } from "../services/WbotServices/StartWhatsAppSession";
import UpdateWhatsAppService from "../services/WhatsappService/UpdateWhatsAppService";
import { setValue } from "../libs/redisClient";
import { logger } from "../utils/logger";
import { getTbot, removeTbot } from "../libs/tbot";
import { getInstaBot, removeInstaBot } from "../libs/InstaBot";
import AppError from "../errors/AppError";
import { getIO } from "../libs/socket";
import { ConfirmInstaBotTwoFactorSession } from "../services/InstagramBotServices/StartInstaBotSession";

const store = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  const whatsapp = await ShowWhatsAppService({
    id: whatsappId,
    tenantId,
    isInternal: true
  });

  if (whatsapp.type === "instagram_oauth") {
    throw new AppError("ERR_INSTAGRAM_USE_OAUTH", 400);
  }

  StartWhatsAppSession(whatsapp).catch(error =>
    logger.error(`Erro ao iniciar conexão ${whatsapp.id}: ${error}`)
  );

  return res.status(200).json({ message: "Starting session." });
};

const update = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { isQrcode } = req.body;
  const { tenantId } = req.user;

  if (isQrcode) {
    await removeWbot(+whatsappId);
    await apagarPastaSessao(whatsappId);
  }

  const { whatsapp } = await UpdateWhatsAppService({
    whatsappId,
    whatsappData: { session: "", qrcode: isQrcode ? null : undefined },
    tenantId
  });

  // await apagarPastaSessao(whatsappId);
  StartWhatsAppSession(whatsapp).catch(error =>
    logger.error(`Erro ao iniciar conexão ${whatsapp.id}: ${error}`)
  );
  return res.status(200).json({ message: "Starting session." });
};

const remove = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });

  const io = getIO();

  try {
    if (channel.type === "whatsapp") {
      const wbot = getWbot(channel.id);
      await setValue(`${channel.id}-retryQrCode`, 0);
      await wbot
        .logout()
        .catch(error => logger.error("Erro ao fazer logout da conexão", error)); // --> fecha o client e conserva a sessão para reconexão (criar função desconectar)
      await removeWbot(channel.id);
      // await wbot
      //   .destroy()
      //   .catch(error => logger.error("Erro ao destuir conexão", error)); // --> encerra a sessão e desconecta o bot do whatsapp, geando um novo QRCODE
    }

    if (channel.type === "telegram") {
      const tbot = getTbot(channel.id);
      await tbot.telegram
        .logOut()
        .catch(error => logger.error("Erro ao fazer logout da conexão", error));
      removeTbot(channel.id);
    }

    if (channel.type === "instagram") {
      const instaBot = getInstaBot(channel.id);
      await instaBot.destroy();
      removeInstaBot(channel);
    }

    if (channel.type === "instagram_oauth") {
      await channel.update({
        instagramOAuthToken: null,
        instagramOAuthExpiresAt: null,
        status: "DISCONNECTED"
      });
    }

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
  return res.status(200).json({ message: "Session disconnected." });
};

const instagramTwoFactor = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { whatsappId } = req.params;
  const { tenantId } = req.user;
  const { verificationCode } = req.body;
  const channel = await ShowWhatsAppService({ id: whatsappId, tenantId });

  if (channel.type !== "instagram" || !verificationCode) {
    throw new AppError("INSTAGRAM_TWO_FACTOR_CODE_REQUIRED", 400);
  }

  await ConfirmInstaBotTwoFactorSession(channel, verificationCode);
  return res.status(200).json({ message: "Instagram session connected." });
};

export default { store, remove, update, instagramTwoFactor };
