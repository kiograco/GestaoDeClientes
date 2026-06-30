import { Op } from "sequelize";
import Whatsapp from "../../models/Whatsapp";
import { StartWhatsAppSession } from "./StartWhatsAppSession";

export const StartAllWhatsAppsSessions = async (): Promise<void> => {
  const whatsapps = await Whatsapp.findAll({
    where: {
      type: "waba",
      wabaBSP: "meta",
      status: {
        [Op.notIn]: ["DISCONNECTED"]
      },
      isActive: true
    }
  });

  whatsapps.forEach(channel => {
    if (channel.tokenAPI) {
      StartWhatsAppSession(channel);
    }
  });
};
