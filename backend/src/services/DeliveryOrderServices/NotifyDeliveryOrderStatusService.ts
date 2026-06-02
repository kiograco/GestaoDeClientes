import { logger } from "../../utils/logger";
import CreateMessageSystemService from "../MessageServices/CreateMessageSystemService";
import ShowTicketService from "../TicketServices/ShowTicketService";
import Order from "../../models/Order";

const statusMessages: Record<string, string> = {
  WAITING_PAYMENT: "Seu pedido #{orderId} esta aguardando pagamento.",
  CONFIRMED: "Seu pedido #{orderId} foi confirmado.",
  PREPARING: "Seu pedido #{orderId} esta em preparo.",
  READY: "Seu pedido #{orderId} esta pronto.",
  OUT_FOR_DELIVERY: "Seu pedido #{orderId} saiu para entrega.",
  DELIVERED: "Seu pedido #{orderId} foi entregue. Obrigado!",
  CANCELLED: "Seu pedido #{orderId} foi cancelado."
};

const NotifyDeliveryOrderStatusService = async (
  tenantId: string | number,
  userId: string | number | undefined,
  order: Order
): Promise<void> => {
  const template = statusMessages[order.status];
  if (!template || !order.ticketId) return;

  try {
    const ticket = await ShowTicketService({ id: order.ticketId, tenantId });
    await CreateMessageSystemService({
      msg: {
        body: template.replace("{orderId}", String(order.id)),
        fromMe: true,
        read: true
      },
      tenantId,
      ticket,
      userId,
      sendType: "chat",
      status: "pending"
    });
  } catch (error) {
    logger.error(
      `Delivery order notification failed: order=${order.id} status=${order.status} error=${error.message}`
    );
  }
};

export default NotifyDeliveryOrderStatusService;
