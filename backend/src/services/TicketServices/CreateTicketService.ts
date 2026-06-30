import AppError from "../../errors/AppError";
import CheckContactOpenTickets from "../../helpers/CheckContactOpenTickets";
import GetDefaultWhatsApp from "../../helpers/GetDefaultWhatsApp";
import socketEmit from "../../helpers/socketEmit";
import Ticket from "../../models/Ticket";
import AttendanceType from "../../models/AttendanceType";
import ShowContactService from "../ContactServices/ShowContactService";
import CreateLogTicketService from "./CreateLogTicketService";
import ShowTicketService from "./ShowTicketService";

interface Request {
  contactId: number;
  status: string;
  userId: string | number;
  tenantId: number;
  channel: string;
  channelId?: number;
  attendanceTypeId?: number | null;
}

const CreateTicketService = async ({
  contactId,
  status,
  userId,
  tenantId,
  channel,
  channelId = undefined,
  attendanceTypeId = null
}: Request): Promise<Ticket> => {
  const defaultWhatsapp = await GetDefaultWhatsApp(tenantId, channelId);

  if (!channel || !["instagram", "telegram", "whatsapp"].includes(channel)) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  await CheckContactOpenTickets(contactId);

  const { isGroup } = await ShowContactService({ id: contactId, tenantId });
  if (attendanceTypeId) {
    const attendanceType = await AttendanceType.findOne({
      where: { id: attendanceTypeId, tenantId }
    });
    if (!attendanceType)
      throw new AppError("ERR_ATTENDANCE_TYPE_NOT_FOUND", 404);
  }

  const { id }: Ticket = await defaultWhatsapp.$create("ticket", {
    contactId,
    status,
    isGroup,
    userId,
    isActiveDemand: true,
    channel,
    tenantId,
    attendanceTypeId
  });

  const ticket = await ShowTicketService({ id, tenantId });

  if (!ticket) {
    throw new AppError("ERR_CREATING_TICKET");
  }

  await CreateLogTicketService({
    userId,
    ticketId: ticket.id,
    type: "create"
  });

  socketEmit({
    tenantId,
    type: "ticket:update",
    payload: ticket
  });

  return ticket;
};

export default CreateTicketService;
