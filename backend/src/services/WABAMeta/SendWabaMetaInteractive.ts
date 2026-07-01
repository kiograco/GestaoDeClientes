import AppError from "../../errors/AppError";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import SentMessageMeta from "./SentMessageMeta";

interface ReplyButton {
  id: string;
  title: string;
}

interface Request {
  whatsappId: number;
  tenantId: number;
  to: string;
  bodyText: string;
  buttons: ReplyButton[];
}

// Envia mensagem interativa de "quick reply" (até 3 botões), usada por exemplo
// em fluxos de chatbot. Suporte a listas/catálogo fica fora do escopo por ora.
const SendWabaMetaQuickReplyButtons = async ({
  whatsappId,
  tenantId,
  to,
  bodyText,
  buttons
}: Request): Promise<WabaResponse> => {
  if (!buttons?.length || buttons.length > 3) {
    throw new AppError("ERR_META_WABA_INVALID_BUTTONS_COUNT", 400);
  }

  const channel = await ShowWhatsAppService({
    id: whatsappId,
    tenantId,
    isInternal: true
  });

  if (channel.wabaBSP !== "meta" || channel.type !== "waba") {
    throw new AppError("ERR_META_WABA_ONLY", 400);
  }

  const number = String(to).replace(/[^0-9]/g, "");

  return SentMessageMeta({
    message: {
      to: number,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttons.map(button => ({
            type: "reply",
            reply: { id: button.id, title: button.title }
          }))
        }
      }
    },
    accessToken: channel.tokenAPI,
    phoneNumberId: channel.fbPageId
  });
};

export default SendWabaMetaQuickReplyButtons;
