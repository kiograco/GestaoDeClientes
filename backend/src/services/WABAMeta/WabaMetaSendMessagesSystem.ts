/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import { Op } from "sequelize";
import SetTicketMessagesAsRead from "../../helpers/SetTicketMessagesAsRead";
import socketEmit from "../../helpers/socketEmit";
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import SentMessageMeta from "./SentMessageMeta";
import UploadMediaMeta from "./UploadMediaMeta";

const buildMetaMessage = (
  message: Message,
  recipient: string
): Record<string, unknown> => {
  if (message.mediaType === "application" || message.mediaType === "document") {
    return {
      to: recipient,
      type: "document",
      document: {
        id: message.wabaMediaId,
        caption: message.body || message.mediaName || "",
        filename: message.mediaName || undefined
      }
    };
  }

  if (message.mediaType === "image") {
    return {
      to: recipient,
      type: "image",
      image: {
        id: message.wabaMediaId,
        caption: message.body || message.mediaName || ""
      }
    };
  }

  if (message.mediaType === "video") {
    return {
      to: recipient,
      type: "video",
      video: {
        id: message.wabaMediaId,
        caption: message.body || message.mediaName || ""
      }
    };
  }

  if (message.mediaType === "audio" || message.mediaType === "voice") {
    return {
      to: recipient,
      type: "audio",
      audio: {
        id: message.wabaMediaId
      }
    };
  }

  return {
    to: recipient,
    type: "text",
    text: {
      preview_url: false,
      body: message.body
    }
  };
};

const where = {
  fromMe: true,
  messageId: { [Op.is]: null },
  status: "pending",
  [Op.or]: [
    {
      scheduleDate: {
        [Op.lte]: new Date()
      }
    },
    {
      scheduleDate: { [Op.is]: null }
    }
  ]
};

const WabaMetaSendMessagesSystem = async (
  connection: Whatsapp
): Promise<void> => {
  const messages = await Message.findAll({
    where,
    include: [
      "contact",
      {
        model: Ticket,
        as: "ticket",
        where: { tenantId: connection.tenantId, channel: "waba" },
        include: [
          "contact",
          {
            model: Whatsapp,
            as: "whatsapp",
            where: { id: connection.id, type: "waba", wabaBSP: "meta" }
          }
        ]
      },
      {
        model: Message,
        as: "quotedMsg",
        include: ["contact"]
      }
    ],
    order: [["createdAt", "ASC"]]
  });

  for (const messageItem of messages) {
    const { ticket } = messageItem;

    const needsMediaUpload =
      !["text", "chat"].includes(messageItem.mediaType) &&
      messageItem.mediaUrl &&
      !messageItem.wabaMediaId;

    if (needsMediaUpload) {
      try {
        const wabaMediaId = await UploadMediaMeta({
          fileName: messageItem.mediaName,
          accessToken: connection.tokenAPI,
          phoneNumberId: connection.fbPageId
        });
        await messageItem.update({ wabaMediaId });
      } catch (error) {
        logger.error(
          `Meta WABA media upload failed for message ${messageItem.id}`,
          error
        );
      }
    }

    const isMissingMedia =
      !["text", "chat"].includes(messageItem.mediaType) &&
      !messageItem.wabaMediaId;

    if (isMissingMedia) {
      logger.warn(
        `Meta WABA media message ${messageItem.id} without uploaded media id`
      );
    } else {
      const sentMessage = await SentMessageMeta({
        message: buildMetaMessage(messageItem, String(ticket.contact.number)),
        accessToken: connection.tokenAPI,
        phoneNumberId: connection.fbPageId
      });

      const messageToUpdate: LegacyAny = {
        ...messageItem,
        messageId: sentMessage.messages[0].id,
        status: "sended",
        ack: 2
      };

      await Message.update(
        { ...messageToUpdate },
        { where: { id: messageItem.id } }
      );

      socketEmit({
        tenantId: ticket.tenantId,
        type: "chat:ack",
        payload: {
          ...messageToUpdate.dataValues,
          mediaUrl: messageItem.mediaUrl,
          messageId: messageToUpdate.messageId,
          status: "sended",
          ack: 2
        }
      });

      logger.info("Meta WABA message sent");
      await SetTicketMessagesAsRead(ticket);
    }
  }
};

export default WabaMetaSendMessagesSystem;
