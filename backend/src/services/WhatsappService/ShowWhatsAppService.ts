import Whatsapp from "../../models/Whatsapp";
import AppError from "../../errors/AppError";

interface Data {
  id: string | number;
  tenantId?: string | number;
  isInternal?: boolean;
}

const ShowWhatsAppService = async ({
  id,
  tenantId,
  isInternal = false
}: Data): Promise<Whatsapp> => {
  const attr = [
    "id",
    "qrcode",
    "name",
    "status",
    "plugged",
    "isDefault",
    "instagramUser",
    "type",
    "createdAt",
    "updatedAt",
    "number",
    "phone",
    "tenantId",
    "wabaBSP",
    "fbPageId",
    "farewellMessage",
    "chatFlowId"
  ];
  if (isInternal) {
    attr.push("tokenTelegram", "tokenAPI", "instagramKey");
  }

  const whatsapp = await Whatsapp.findByPk(id, {
    attributes: attr
  });

  if (!whatsapp || (tenantId && whatsapp.tenantId !== tenantId)) {
    throw new AppError("ERR_NO_WAPP_FOUND", 404);
  }

  return whatsapp;
};

export default ShowWhatsAppService;
