/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
import Message from "../../models/Message";
import Ticket from "../../models/Ticket";
import socketEmit from "../../helpers/socketEmit";
import { logger } from "../../utils/logger";

// Segue a mesma escala numérica usada pelo whatsapp-web.js (ACK_ERROR=-1,
// ACK_PENDING=0, ACK_SERVER=1, ACK_DEVICE=2, ACK_READ=3) para manter
// consistência com o restante do CRM.
const ackByStatus: Record<string, number> = {
  sent: 1,
  delivered: 2,
  read: 3,
  failed: -1
};

const WabaMetaStatusHandler = async (
  statuses: WabaMetaMessageStatus[]
): Promise<void> => {
  for (const statusItem of statuses) {
    const ack = ackByStatus[statusItem.status];
    if (ack === undefined) {
      // eslint-disable-next-line no-continue
      continue;
    }

    try {
      const message = await Message.findOne({
        where: { messageId: statusItem.id },
        include: [
          { model: Ticket, as: "ticket", attributes: ["id", "tenantId"] }
        ]
      });

      if (!message || !message.ticket) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (statusItem.status !== "failed" && ack <= message.ack) {
        // eslint-disable-next-line no-continue
        continue;
      }

      await message.update({ ack });

      if (statusItem.status === "failed" && statusItem.errors?.length) {
        logger.warn(
          `Meta WABA message ${statusItem.id} failed: ${JSON.stringify(
            statusItem.errors
          )}`
        );
      }

      socketEmit({
        tenantId: message.ticket.tenantId,
        type: "chat:ack",
        payload: message
      });
    } catch (error) {
      logger.error(
        `Meta WABA status handling failed for ${statusItem.id}`,
        error
      );
    }
  }
};

export default WabaMetaStatusHandler;
