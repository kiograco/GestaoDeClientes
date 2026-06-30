import Whatsapp from "../../models/Whatsapp";
import { getIO } from "../../libs/socket";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import { StartWabaMeta } from "../WABAMeta/StartWabaMeta";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp
): Promise<void> => {
  if (whatsapp.type !== "waba" || whatsapp.wabaBSP !== "meta") {
    await whatsapp.update({ status: "DISCONNECTED" });
    throw new AppError("ERR_ONLY_META_WHATSAPP_SUPPORTED", 400);
  }

  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`${whatsapp.tenantId}:whatsappSession`, {
    action: "update",
    session: whatsapp
  });

  try {
    StartWabaMeta(whatsapp);
  } catch (err) {
    logger.error(`StartWhatsAppSession | Error: ${err}`);
    throw new AppError("ERR_START_SESSION", 404);
  }
};
