import { getInstaBot } from "../libs/InstaBot";
import { getTbot } from "../libs/tbot";
import InstagramSendMessagesSystem from "../services/InstagramBotServices/InstagramSendMessagesSystem";
import TelegramSendMessagesSystem from "../services/TbotServices/TelegramSendMessagesSystem";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import { sendInstagramOAuthMessage } from "../services/InstagramOAuthServices/InstagramOAuthMessageService";

type Payload = {
  ticket: LegacyAny;
  messageData: LegacyAny;
  media: LegacyAny;
  userId: LegacyAny;
};

const SendMessageSystemProxy = async ({
  ticket,
  messageData,
  media,
  userId
}: Payload): Promise<LegacyAny> => {
  let message;

  if (messageData.mediaName) {
    switch (ticket.channel) {
      case "instagram":
        message = await InstagramSendMessagesSystem(
          getInstaBot(ticket.whatsappId),
          ticket,
          { ...messageData, media }
        );
        break;

      case "instagram_oauth":
        message = await sendInstagramOAuthMessage(ticket, {
          ...messageData,
          media
        });
        break;

      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          { ...messageData, media }
        );
        break;

      default:
        message = await SendWhatsAppMedia({ media, ticket, userId });
        break;
    }
  }

  if (!media) {
    switch (ticket.channel) {
      case "instagram":
        message = await InstagramSendMessagesSystem(
          getInstaBot(ticket.whatsappId),
          ticket,
          messageData
        );
        break;

      case "instagram_oauth":
        message = await sendInstagramOAuthMessage(ticket, messageData);
        break;

      case "telegram":
        message = await TelegramSendMessagesSystem(
          getTbot(ticket.whatsappId),
          ticket,
          messageData
        );
        break;

      default:
        message = await SendWhatsAppMessage({
          body: messageData.body,
          ticket,
          quotedMsg: messageData?.quotedMsg
        });
        break;
    }
  }

  return message;
};

export default SendMessageSystemProxy;
