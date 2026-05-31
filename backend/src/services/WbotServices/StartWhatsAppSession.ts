import { hasWbot, initWbot, isWbotStarting } from "../../libs/wbot";
import Whatsapp from "../../models/Whatsapp";
import { wbotMessageListener } from "./wbotMessageListener";
import { getIO } from "../../libs/socket";
import wbotMonitor from "./wbotMonitor";
import { logger } from "../../utils/logger";
import AppError from "../../errors/AppError";
import Queue from "../../libs/Queue";
import { StartInstaBotSession } from "../InstagramBotServices/StartInstaBotSession";
import { StartTbotSession } from "../TbotServices/StartTbotSession";
import { StartWaba360 } from "../WABA360/StartWaba360";
import { StartMessengerBot } from "../MessengerChannelServices/StartMessengerBot";

export const StartWhatsAppSession = async (
  whatsapp: Whatsapp
): Promise<void> => {
  if (
    whatsapp.type === "whatsapp" &&
    (hasWbot(whatsapp.id) || isWbotStarting(whatsapp.id))
  ) {
    logger.info(`Session ${whatsapp.id} is already active or starting.`);
    return;
  }

  await whatsapp.update({ status: "OPENING" });

  const io = getIO();
  io.emit(`${whatsapp.tenantId}:whatsappSession`, {
    action: "update",
    session: whatsapp
  });

  try {
    if (whatsapp.type === "whatsapp") {
      const wbot = await initWbot(whatsapp);
      wbotMessageListener(wbot);
      wbotMonitor(wbot, whatsapp);
      await Queue.add("SendMessages", {
        tenantId: whatsapp.tenantId,
        sessionId: whatsapp.id
      });
    }

    if (whatsapp.type === "telegram") {
      StartTbotSession(whatsapp);
    }

    if (whatsapp.type === "instagram") {
      StartInstaBotSession(whatsapp);
    }

    if (whatsapp.type === "messenger") {
      StartMessengerBot(whatsapp);
    }

    if (whatsapp.type === "waba") {
      if (whatsapp.wabaBSP === "360") {
        StartWaba360(whatsapp);
      }
    }
  } catch (err) {
    logger.error(`StartWhatsAppSession | Error: ${err}`);
    throw new AppError("ERR_START_SESSION", 404);
  }
};
