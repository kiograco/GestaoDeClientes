import AppError from "../../errors/AppError";
import Message from "../../models/Message";
import ShowWhatsAppService from "../WhatsappService/ShowWhatsAppService";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import SentMessageMeta from "./SentMessageMeta";

interface Request {
  whatsappId: number;
  tenantId: number;
  to: string;
  templateName: string;
  languageCode: string;
  components?: LegacyAny[];
}

// Envia um template aprovado (HSM) para um contato, útil para reabrir uma
// conversa fora da janela de 24h. Cria/atualiza o contato e o ticket para que
// a mensagem apareça no CRM como uma conversa normal.
const SendWabaMetaTemplateMessage = async ({
  whatsappId,
  tenantId,
  to,
  templateName,
  languageCode,
  components
}: Request): Promise<Message> => {
  const channel = await ShowWhatsAppService({
    id: whatsappId,
    tenantId,
    isInternal: true
  });

  if (channel.wabaBSP !== "meta" || channel.type !== "waba") {
    throw new AppError("ERR_META_WABA_ONLY", 400);
  }

  const number = String(to).replace(/[^0-9]/g, "");

  const sentMessage = await SentMessageMeta({
    message: {
      to: number,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components?.length ? { components } : {})
      }
    },
    accessToken: channel.tokenAPI,
    phoneNumberId: channel.fbPageId
  });

  const contact = await CreateOrUpdateContactService({
    name: number,
    number,
    tenantId,
    pushname: number,
    isUser: false,
    isWAContact: true,
    isGroup: false
  });

  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: channel.id,
    unreadMessages: 0,
    tenantId,
    channel: "waba"
  });

  return CreateMessageService({
    messageData: {
      messageId: sentMessage.messages[0].id,
      ticketId: ticket.id,
      body: `Template: ${templateName}`,
      fromMe: true,
      read: true,
      mediaType: "chat",
      status: "sended",
      ack: 2,
      timestamp: new Date().getTime()
    } as LegacyAny,
    tenantId
  });
};

export default SendWabaMetaTemplateMessage;
