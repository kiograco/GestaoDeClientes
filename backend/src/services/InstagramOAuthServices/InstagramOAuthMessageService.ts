import axios from "axios";
import { createWriteStream } from "fs";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import mime from "mime";
import Whatsapp from "../../models/Whatsapp";
import Contact from "../../models/Contact";
import Ticket from "../../models/Ticket";
import AppError from "../../errors/AppError";
import CreateOrUpdateContactService from "../ContactServices/CreateOrUpdateContactService";
import FindOrCreateTicketService from "../TicketServices/FindOrCreateTicketService";
import CreateMessageService from "../MessageServices/CreateMessageService";
import VerifyStepsChatFlowTicket from "../ChatFlowServices/VerifyStepsChatFlowTicket";
import verifyBusinessHours from "../WbotServices/helpers/VerifyBusinessHours";
import { instagramGraphUrl } from "./InstagramOAuthConfig";

interface InstagramWebhookMessage {
  mid: string;
  text?: string;
  attachments?: Array<{ type?: string; payload?: { url?: string } }>;
}

interface InstagramWebhookEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: InstagramWebhookMessage;
}

const downloadAttachment = async (
  url: string
): Promise<{ filename: string; mediaType: string }> => {
  const response = await axios.get(url, { responseType: "stream" });
  const extension = (mime as any).extension(
    response.headers["content-type"] || "application/octet-stream"
  );
  const filename = `${uuidv4()}.${extension || "bin"}`;
  const path = join(__dirname, "..", "..", "..", "public", filename);
  await new Promise((resolve, reject) => {
    response.data
      .pipe(createWriteStream(path))
      .on("finish", resolve)
      .on("error", reject);
  });
  return {
    filename,
    mediaType: String(response.headers["content-type"] || "application")
      .split("/")[0]
  };
};

export const handleInstagramOAuthWebhookEvent = async (
  event: InstagramWebhookEvent
): Promise<void> => {
  if (!event.message?.mid || event.message.mid.startsWith("echo_")) return;

  const channel = await Whatsapp.findOne({
    where: {
      type: "instagram_oauth",
      instagramOAuthUserId: event.recipient.id,
      status: "CONNECTED"
    }
  });
  if (!channel?.instagramOAuthToken) return;

  let profile: any = {};
  try {
    const response = await axios.get(`${instagramGraphUrl}/${event.sender.id}`, {
      params: {
        fields: "id,username,name,profile_pic",
        access_token: channel.instagramOAuthToken
      }
    });
    profile = response.data;
  } catch (_) {
    profile = {};
  }

  const contact = await CreateOrUpdateContactService({
    name: profile.name || profile.username || `Instagram ${event.sender.id}`,
    number: "",
    profilePicUrl: profile.profile_pic,
    tenantId: channel.tenantId,
    pushname: profile.username || "",
    isUser: true,
    isWAContact: false,
    isGroup: false,
    origem: "instagram",
    instagramPK: event.sender.id
  });
  const body = event.message.text || "Anexo recebido pelo Instagram";
  const ticket = await FindOrCreateTicketService({
    contact,
    whatsappId: channel.id,
    unreadMessages: 1,
    tenantId: channel.tenantId,
    msg: { message_id: event.message.mid, fromMe: false, body },
    channel: "instagram_oauth"
  });

  let mediaUrl: string | undefined;
  let mediaType = "chat";
  const attachmentUrl = event.message.attachments?.[0]?.payload?.url;
  if (attachmentUrl) {
    const attachment = await downloadAttachment(attachmentUrl);
    mediaUrl = attachment.filename;
    mediaType = attachment.mediaType;
  }

  await ticket.update({
    lastMessage: body,
    lastMessageAt: event.timestamp,
    answered: false
  });
  await CreateMessageService({
    tenantId: channel.tenantId,
    messageData: {
      messageId: event.message.mid,
      ticketId: ticket.id,
      contactId: contact.id,
      body,
      fromMe: false,
      read: false,
      mediaUrl,
      mediaType,
      timestamp: event.timestamp,
      status: "received"
    }
  } as any);

  await VerifyStepsChatFlowTicket(
    { fromMe: false, body, timestamp: event.timestamp / 1000 },
    ticket
  );
  await verifyBusinessHours(
    { fromMe: false, timestamp: event.timestamp / 1000 },
    ticket
  );
};

export const sendInstagramOAuthMessage = async (
  ticket: Ticket,
  message: any
): Promise<any> => {
  const channel = await Whatsapp.findOne({
    where: {
      id: ticket.whatsappId,
      tenantId: ticket.tenantId,
      type: "instagram_oauth",
      status: "CONNECTED"
    }
  });
  if (!channel?.instagramOAuthToken) {
    throw new AppError("ERR_INSTAGRAM_OAUTH_NOT_CONNECTED", 409);
  }

  const contact = (ticket as any).contact as Contact;
  if (!contact?.instagramPK) {
    throw new AppError("ERR_INSTAGRAM_CONTACT_NOT_FOUND", 404);
  }

  const payload = message.media
    ? {
        attachment: {
          type: ["image", "video", "audio"].includes(message.mediaType)
            ? message.mediaType
            : "file",
          payload: {
            url: `${process.env.BACKEND_URL}:${process.env.PROXY_PORT}/public/${message.media.filename}`,
            is_reusable: true
          }
        }
      }
    : { text: message.body };
  const response = await axios.post(
    `${instagramGraphUrl}/${channel.instagramOAuthUserId}/messages`,
    {
      recipient: { id: String(contact.instagramPK) },
      message: payload
    },
    { params: { access_token: channel.instagramOAuthToken } }
  );
  return {
    messageId: response.data.message_id,
    status: "sended",
    ack: 2
  };
};
