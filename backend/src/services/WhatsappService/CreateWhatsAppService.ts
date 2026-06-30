import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";

interface Request {
  name: string;
  status?: string;
  isDefault?: boolean;
  tenantId: string | number;
  wabaBSP?: string;
  tokenAPI?: string;
  fbPageId?: string;
  farewellMessage?: string;
  type:
    | "waba"
    | "instagram"
    | "instagram_oauth"
    | "telegram"
    | "whatsapp"
    | "messenger";
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const CreateWhatsAppService = async ({
  name,
  status = "DISCONNECTED",
  tenantId,
  type,
  wabaBSP,
  tokenAPI,
  fbPageId,
  farewellMessage,
  isDefault = false
}: Request): Promise<Response> => {
  if (type !== "waba" || wabaBSP !== "meta") {
    throw new AppError("ERR_ONLY_META_WHATSAPP_SUPPORTED", 400);
  }

  if (!tokenAPI) {
    throw new AppError("WABA Meta: favor informar o token de acesso");
  }

  if (!fbPageId) {
    throw new AppError("WABA Meta: favor informar o Phone Number ID");
  }

  const whatsappFound = await Whatsapp.findOne({
    where: { tenantId, isDefault: true }
  });

  if (!whatsappFound) {
    isDefault = !whatsappFound;
  }

  if (isDefault && whatsappFound) {
    await whatsappFound.update({ isDefault: false });
  }

  try {
    const whatsapp = await Whatsapp.create({
      name,
      status,
      isDefault,
      tenantId,
      type: "waba",
      wabaBSP: "meta",
      tokenAPI,
      fbPageId,
      farewellMessage
    });
    const io = getIO();
    io.emit(`${tenantId}:whatsapp`, {
      action: "update",
      whatsapp
    });

    return { whatsapp, oldDefaultWhatsapp: whatsappFound };
  } catch (error) {
    logger.error(error);
    throw new AppError("ERR_CREATE_WAPP", 404);
  }
};

export default CreateWhatsAppService;
