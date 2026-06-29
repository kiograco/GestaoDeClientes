import { Op } from "sequelize";
// import { initInstaBot } from "../../libs/InstaBot";
import Whatsapp from "../../models/Whatsapp";
import { StartInstaBotSession } from "../InstagramBotServices/StartInstaBotSession";
import { StartMessengerBot } from "../MessengerChannelServices/StartMessengerBot";
import { StartTbotSession } from "../TbotServices/StartTbotSession";
import { StartWhatsAppSession } from "./StartWhatsAppSession";
// import { StartTbotSession } from "../TbotServices/StartTbotSession";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  const whatsapps = await Whatsapp.findAll({
    where: {
      [Op.or]: [
        {
          [Op.and]: {
            type: {
              [Op.in]: [
                "instagram",
                "instagram_oauth",
                "telegram",
                "waba",
                "messenger"
              ]
            },
            status: {
              [Op.notIn]: ["DISCONNECTED"]
            }
          }
        },
        {
          [Op.and]: {
            type: "whatsapp"
          },
          status: {
            [Op.notIn]: ["DISCONNECTED", "qrcode"]
            // "DISCONNECTED"
          }
        }
      ],
      isActive: true
    }
  });
  const whatsappSessions = whatsapps.filter(w => w.type === "whatsapp");
  const telegramSessions = whatsapps.filter(
    w => w.type === "telegram" && !!w.tokenTelegram
  );
  const instagramSessions = whatsapps.filter(w => w.type === "instagram");
  const wabaSessions = whatsapps.filter(w => w.type === "waba");
  const messengerSessions = whatsapps.filter(w => w.type === "messenger");

  if (whatsappSessions.length > 0) {
    whatsappSessions.forEach(whatsapp => {
      StartWhatsAppSession(whatsapp);
    });
  }

  if (telegramSessions.length > 0) {
    telegramSessions.forEach(whatsapp => {
      StartTbotSession(whatsapp);
    });
  }

  if (wabaSessions.length > 0) {
    wabaSessions.forEach(channel => {
      if (channel.tokenAPI) {
        StartWhatsAppSession(channel);
      }
    });
  }

  if (instagramSessions.length > 0) {
    instagramSessions.forEach(channel => {
      if (channel.instagramKey) {
        StartInstaBotSession(channel);
      }
    });
  }

  if (messengerSessions.length > 0) {
    messengerSessions.forEach(channel => {
      if (channel.tokenAPI) {
        StartMessengerBot(channel);
      }
    });
  }
};
