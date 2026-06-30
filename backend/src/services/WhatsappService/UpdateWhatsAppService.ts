import * as Yup from "yup";
import { Op } from "sequelize";

import AppError from "../../errors/AppError";
import Whatsapp from "../../models/Whatsapp";

interface WhatsappData {
  name?: string;
  status?: string;
  session?: string;
  qrcode?: string | null;
  isDefault?: boolean;
  isActive?: boolean;
  type?:
    | "waba"
    | "instagram"
    | "instagram_oauth"
    | "telegram"
    | "whatsapp"
    | "messenger";
  wabaBSP?: string;
  tokenAPI?: string;
  fbPageId?: string;
  farewellMessage?: string;
  chatFlowId?: number;
}

interface Request {
  whatsappData: WhatsappData;
  whatsappId: string;
  tenantId: string | number;
}

interface Response {
  whatsapp: Whatsapp;
  oldDefaultWhatsapp: Whatsapp | null;
}

const UpdateWhatsAppService = async ({
  whatsappData,
  whatsappId,
  tenantId
}: Request): Promise<Response> => {
  const schema = Yup.object().shape({
    name: Yup.string().min(2),
    isDefault: Yup.boolean()
  });

  const {
    name,
    status,
    isDefault,
    session,
    qrcode,
    isActive,
    type,
    wabaBSP,
    tokenAPI,
    fbPageId,
    farewellMessage,
    chatFlowId
  } = whatsappData;

  try {
    await schema.validate({ name, status, isDefault });

    let oldDefaultWhatsapp: Whatsapp | null = null;

    if (isDefault) {
      oldDefaultWhatsapp = await Whatsapp.findOne({
        where: { isDefault: true, tenantId, id: { [Op.not]: whatsappId } }
      });
      if (oldDefaultWhatsapp) {
        await oldDefaultWhatsapp.update({ isDefault: false });
      }
    }

    const whatsapp = await Whatsapp.findOne({
      where: { id: whatsappId, tenantId }
    });

    if (!whatsapp) {
      throw new AppError("ERR_NO_WAPP_FOUND", 404);
    }

    if (whatsapp.type !== "waba" || whatsapp.wabaBSP !== "meta") {
      throw new AppError("ERR_ONLY_META_WHATSAPP_SUPPORTED", 400);
    }

    if ((type && type !== "waba") || (wabaBSP && wabaBSP !== "meta")) {
      throw new AppError("ERR_ONLY_META_WHATSAPP_SUPPORTED", 400);
    }

    if (type === "waba" && !wabaBSP) {
      throw new AppError("WABA Meta: favor informar o provedor Meta");
    }

    if (!fbPageId && !whatsapp.fbPageId && name) {
      throw new AppError("WABA Meta: favor informar o Phone Number ID");
    }

    if (!tokenAPI && !whatsapp.tokenAPI && name) {
      throw new AppError("WABA Meta: favor informar o token de acesso");
    }

    const data: WhatsappData = {
      name,
      status,
      session,
      qrcode,
      isDefault,
      isActive,
      type: type ? "waba" : undefined,
      wabaBSP: wabaBSP ? "meta" : undefined,
      tokenAPI,
      fbPageId,
      farewellMessage,
      chatFlowId
    };

    await whatsapp.update(data);

    return { whatsapp, oldDefaultWhatsapp };
  } catch (err: LegacyAny) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(err.message);
  }
};

export default UpdateWhatsAppService;
