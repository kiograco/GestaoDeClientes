import Whatsapp from "../../models/Whatsapp";

const ListWhatsAppsService = async (tenantId: number): Promise<Whatsapp[]> => {
  const whatsapps = await Whatsapp.findAll({
    where: {
      tenantId,
      type: "waba",
      wabaBSP: "meta"
    },
    attributes: {
      exclude: [
        "session",
        "tokenTelegram",
        "instagramKey",
        "instagramOAuthToken",
        "tokenAPI",
        "tokenHook"
      ]
    }
  });

  return whatsapps;
};

export default ListWhatsAppsService;
