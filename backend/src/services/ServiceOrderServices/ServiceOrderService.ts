import { Op, Transaction } from "sequelize";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import CustomerAddress from "../../models/CustomerAddress";
import ServiceAttendant from "../../models/ServiceAttendant";
import ServiceOrder from "../../models/ServiceOrder";
import ServiceOrderLog from "../../models/ServiceOrderLog";
import User from "../../models/User";
import Tenant from "../../models/Tenant";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";

export const SERVICE_ORDER_PRIORITIES = ["baixa", "media", "alta", "urgente"];

export const SERVICE_ORDER_STATUSES = [
  "rascunho",
  "agendada",
  "em_atendimento",
  "concluida",
  "cancelada",
  "reagendada"
];

export interface ServiceAttendantData {
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  active?: boolean;
  workingHours?: LegacyAny;
}

export interface ServiceOrderData {
  contactId: number;
  attendantId?: number | null;
  title: string;
  description?: string | null;
  serviceType: string;
  priority?: string;
  status?: string;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  address?: string | null;
  addressComplement?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  publicObservation?: string | null;
  internalObservation?: string | null;
  customerSignatureUrl?: string | null;
  attachmentUrls?: string[];
  cancelReason?: string | null;
}

export interface ServiceOrderNotificationData {
  channels: Array<"internal" | "email" | "whatsapp">;
  message?: string | null;
}

const relevantStatuses = ["agendada", "em_atendimento", "reagendada"];
const managerProfiles = ["admin", "superadmin", "supervisor"];
const internalProfiles = [...managerProfiles, "atendente", "tecnico"];

const cleanText = (value?: string | null): string | null => {
  if (!value) return null;
  return value.replace(/<[^>]*>/g, "").trim() || null;
};

const escapePublicText = (value?: string | number | null): string =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const normalizeDigits = (value?: string | null): string | null =>
  value ? value.replace(/\D/g, "") : null;

const normalizeDate = (value?: string | Date | null): Date | null =>
  value ? new Date(value) : null;

const canSeeInternalObservation = (profile: string): boolean =>
  internalProfiles.includes(profile);

const canManageServiceOrders = (profile: string): boolean =>
  managerProfiles.includes(profile);

const emitServiceOrderEvent = (
  tenantId: number | string,
  type: string,
  serviceOrder: ServiceOrder
): void => {
  try {
    getIO()
      .to(String(tenantId))
      .emit(`${tenantId}:serviceOrders`, { type, payload: serviceOrder });
  } catch (error) {
    // Sockets can be unavailable in tests or background scripts.
  }
};

const includeOrder = [
  {
    model: Contact,
    attributes: ["id", "name", "number", "email"],
    include: [
      {
        model: CustomerAddress,
        as: "addresses",
        where: { isDefault: true },
        required: false
      }
    ]
  },
  { model: ServiceAttendant },
  { model: User, as: "createdBy", attributes: ["id", "name", "email"] },
  {
    model: ServiceOrderLog,
    as: "logs",
    include: [{ model: User, attributes: ["id", "name", "email"] }]
  }
];

const scrubOrder = (
  serviceOrder: ServiceOrder,
  profile: string
): Record<string, unknown> => {
  const data = serviceOrder.toJSON() as Record<string, unknown>;
  if (!canSeeInternalObservation(profile)) {
    delete data.internalObservation;
  }
  return data;
};

const ensureCustomer = async (
  tenantId: string | number,
  contactId: number,
  transaction?: Transaction
): Promise<Contact> => {
  const contact = await Contact.findOne({
    where: { id: contactId, tenantId },
    transaction
  });
  if (!contact) throw new AppError("ERR_NO_CONTACT_FOUND", 404);
  return contact;
};

const ensureAttendant = async (
  tenantId: string | number,
  attendantId?: number | null,
  transaction?: Transaction
): Promise<ServiceAttendant | null> => {
  if (!attendantId) return null;
  const attendant = await ServiceAttendant.findOne({
    where: { id: attendantId, tenantId },
    transaction
  });
  if (!attendant) throw new AppError("ERR_NO_SERVICE_ATTENDANT_FOUND", 404);
  if (!attendant.active) throw new AppError("ERR_SERVICE_ATTENDANT_INACTIVE");
  return attendant;
};

export const validateServiceOrderSchedule = (data: ServiceOrderData): void => {
  const start = normalizeDate(data.scheduledStart);
  const end = normalizeDate(data.scheduledEnd);
  const status = data.status || "rascunho";

  if (status !== "rascunho" && (!start || !end)) {
    throw new AppError("Informe inicio e fim do agendamento");
  }

  if (start && end && end.getTime() <= start.getTime()) {
    throw new AppError("Horario final deve ser maior que o horario inicial");
  }
};

const ensureNoScheduleConflict = async (
  tenantId: string | number,
  attendantId?: number | null,
  scheduledStart?: Date | null,
  scheduledEnd?: Date | null,
  ignoreOrderId?: number,
  transaction?: Transaction
): Promise<void> => {
  if (!attendantId || !scheduledStart || !scheduledEnd) return;
  const conflict = await ServiceOrder.findOne({
    where: {
      tenantId,
      attendantId,
      status: { [Op.in]: relevantStatuses },
      scheduledStart: { [Op.lt]: scheduledEnd },
      scheduledEnd: { [Op.gt]: scheduledStart },
      ...(ignoreOrderId ? { id: { [Op.ne]: ignoreOrderId } } : {})
    },
    transaction,
    lock: transaction?.LOCK.UPDATE
  });
  if (conflict) throw new AppError("ERR_SERVICE_ORDER_SCHEDULE_CONFLICT", 409);
};

const logOrder = async (
  serviceOrderId: number,
  userId: string | number,
  action: string,
  description: string,
  oldValue: LegacyAny,
  newValue: LegacyAny,
  transaction?: Transaction
): Promise<void> => {
  await ServiceOrderLog.create(
    {
      serviceOrderId,
      userId: Number(userId),
      action,
      oldValue,
      newValue,
      description
    },
    { transaction }
  );
};

const loadOrder = async (
  tenantId: string | number,
  serviceOrderId: string | number,
  transaction?: Transaction
): Promise<ServiceOrder> => {
  const serviceOrder = await ServiceOrder.findOne({
    where: { id: serviceOrderId, tenantId },
    include: includeOrder,
    order: [[{ model: ServiceOrderLog, as: "logs" }, "createdAt", "DESC"]],
    transaction
  });
  if (!serviceOrder) throw new AppError("ERR_SERVICE_ORDER_NOT_FOUND", 404);
  return serviceOrder;
};

const formatDateTime = (date?: Date | null): string =>
  date
    ? new Date(date).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    : "";

const buildPublicNotificationMessage = (
  serviceOrder: ServiceOrder,
  customMessage?: string | null
): string => {
  const parts = [
    customMessage || `Ordem de servico #${serviceOrder.id}`,
    `Servico: ${serviceOrder.serviceType}`,
    `Cliente: ${serviceOrder.contact?.name || ""}`,
    `Horario: ${formatDateTime(
      serviceOrder.scheduledStart
    )} ate ${formatDateTime(serviceOrder.scheduledEnd)}`,
    `Endereco: ${serviceOrder.address || ""} ${serviceOrder.city || ""}/${
      serviceOrder.state || ""
    }`,
    serviceOrder.publicObservation
      ? `Observacao: ${serviceOrder.publicObservation}`
      : ""
  ];
  return parts.filter(Boolean).join("\n");
};

export const listAttendants = async (
  tenantId: string | number
): Promise<ServiceAttendant[]> =>
  ServiceAttendant.findAll({
    where: { tenantId },
    order: [["name", "ASC"]]
  });

export const createAttendant = async (
  tenantId: string | number,
  data: ServiceAttendantData
): Promise<ServiceAttendant> =>
  ServiceAttendant.create({
    tenantId,
    name: cleanText(data.name),
    email: cleanText(data.email),
    phone: normalizeDigits(data.phone),
    specialty: cleanText(data.specialty),
    active: data.active !== false,
    workingHours: data.workingHours || null
  });

export const updateAttendant = async (
  tenantId: string | number,
  attendantId: string,
  data: ServiceAttendantData
): Promise<ServiceAttendant> => {
  const attendant = await ServiceAttendant.findOne({
    where: { id: attendantId, tenantId }
  });
  if (!attendant) throw new AppError("ERR_NO_SERVICE_ATTENDANT_FOUND", 404);
  await attendant.update({
    name: cleanText(data.name),
    email: cleanText(data.email),
    phone: normalizeDigits(data.phone),
    specialty: cleanText(data.specialty),
    active: data.active !== false,
    workingHours: data.workingHours || null
  });
  return attendant;
};

export const listOrders = async (
  tenantId: string | number,
  profile: string,
  filters: LegacyAny
): Promise<Record<string, unknown>[]> => {
  const where: LegacyAny = { tenantId };
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.serviceType) where.serviceType = filters.serviceType;
  if (filters.attendantId) where.attendantId = filters.attendantId;
  if (filters.start && filters.end) {
    where.scheduledStart = { [Op.lt]: new Date(filters.end) };
    where.scheduledEnd = { [Op.gt]: new Date(filters.start) };
  }

  const orders = await ServiceOrder.findAll({
    where,
    include: includeOrder,
    order: [["scheduledStart", "ASC"]]
  });
  return orders.map(order => scrubOrder(order, profile));
};

export const getDashboard = async (
  tenantId: string | number,
  filters: LegacyAny
): Promise<Record<string, unknown>> => {
  const where: LegacyAny = { tenantId };
  if (filters.attendantId) where.attendantId = filters.attendantId;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.serviceType) where.serviceType = filters.serviceType;
  if (filters.start && filters.end) {
    where.createdAt = {
      [Op.between]: [new Date(filters.start), new Date(filters.end)]
    };
  }

  const orders = await ServiceOrder.findAll({
    where,
    include: [{ model: ServiceAttendant }, { model: Contact }],
    order: [["createdAt", "ASC"]]
  });
  const now = Date.now();
  const grouped = (field: keyof ServiceOrder): Record<string, number> =>
    orders.reduce((acc, order) => {
      const key = String(order[field] || "sem_valor");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const total = orders.length;
  const completed = orders.filter(order => order.status === "concluida");
  const canceled = orders.filter(order => order.status === "cancelada");
  const late = orders.filter(
    order =>
      relevantStatuses.includes(order.status) &&
      order.scheduledEnd &&
      new Date(order.scheduledEnd).getTime() < now
  );
  const completionMinutes = completed
    .filter(order => order.completedAt && order.scheduledStart)
    .map(order =>
      Math.max(
        0,
        (new Date(order.completedAt).getTime() -
          new Date(order.scheduledStart).getTime()) /
          60000
      )
    );
  const byAttendant = orders.reduce((acc, order) => {
    const key = order.attendant?.name || "Sem tecnico";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const visitsByDay = orders.reduce((acc, order) => {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total,
    scheduled: orders.filter(order => order.status === "agendada").length,
    completed: completed.length,
    canceled: canceled.length,
    late: late.length,
    cancellationRate: total
      ? Number(((canceled.length / total) * 100).toFixed(2))
      : 0,
    averageServiceMinutes: completionMinutes.length
      ? Number(
          (
            completionMinutes.reduce((sum, value) => sum + value, 0) /
            completionMinutes.length
          ).toFixed(2)
        )
      : 0,
    byStatus: grouped("status"),
    byPriority: grouped("priority"),
    byServiceType: grouped("serviceType"),
    byAttendant,
    visitsByDay
  };
};

export const showOrder = async (
  tenantId: string | number,
  profile: string,
  serviceOrderId: string
): Promise<Record<string, unknown>> =>
  scrubOrder(await loadOrder(tenantId, serviceOrderId), profile);

const buildOrderPayload = (
  tenantId: string | number,
  userId: string | number,
  data: ServiceOrderData
): LegacyAny => ({
  tenantId,
  contactId: data.contactId,
  attendantId: data.attendantId || null,
  createdByUserId: Number(userId),
  title: cleanText(data.title),
  description: cleanText(data.description),
  serviceType: cleanText(data.serviceType),
  priority: data.priority || "baixa",
  status: data.status || "rascunho",
  scheduledStart: normalizeDate(data.scheduledStart),
  scheduledEnd: normalizeDate(data.scheduledEnd),
  address: cleanText(data.address),
  addressComplement: cleanText(data.addressComplement),
  city: cleanText(data.city),
  state: cleanText(data.state)?.toUpperCase() || null,
  zipCode: normalizeDigits(data.zipCode),
  publicObservation: cleanText(data.publicObservation),
  internalObservation: cleanText(data.internalObservation),
  customerSignatureUrl: cleanText(data.customerSignatureUrl),
  attachmentUrls: data.attachmentUrls || [],
  cancelReason: cleanText(data.cancelReason)
});

export const createOrder = async (
  tenantId: string | number,
  userId: string | number,
  data: ServiceOrderData
): Promise<ServiceOrder> => {
  validateServiceOrderSchedule(data);
  const created = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async transaction => {
      await ensureCustomer(tenantId, data.contactId, transaction);
      await ensureAttendant(tenantId, data.attendantId, transaction);
      const payload = buildOrderPayload(tenantId, userId, data);
      await ensureNoScheduleConflict(
        tenantId,
        payload.attendantId,
        payload.scheduledStart,
        payload.scheduledEnd,
        undefined,
        transaction
      );
      const serviceOrder = await ServiceOrder.create(payload, { transaction });
      await logOrder(
        serviceOrder.id,
        userId,
        "created",
        "Ordem de servico criada",
        null,
        { status: serviceOrder.status, attendantId: serviceOrder.attendantId },
        transaction
      );
      return serviceOrder;
    }
  );
  const loaded = await loadOrder(tenantId, created.id);
  emitServiceOrderEvent(tenantId, "service_order_created", loaded);
  return loaded;
};

export const updateOrder = async (
  tenantId: string | number,
  userId: string | number,
  profile: string,
  serviceOrderId: string,
  data: ServiceOrderData
): Promise<ServiceOrder> => {
  if (!canManageServiceOrders(profile) && data.status) {
    throw new AppError("ERR_SERVICE_ORDER_PERMISSION_DENIED", 403);
  }
  validateServiceOrderSchedule(data);
  const updated = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async transaction => {
      const serviceOrder = await ServiceOrder.findOne({
        where: { id: serviceOrderId, tenantId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!serviceOrder) throw new AppError("ERR_SERVICE_ORDER_NOT_FOUND", 404);
      await ensureCustomer(tenantId, data.contactId, transaction);
      await ensureAttendant(tenantId, data.attendantId, transaction);
      const oldValue = {
        status: serviceOrder.status,
        attendantId: serviceOrder.attendantId,
        scheduledStart: serviceOrder.scheduledStart,
        scheduledEnd: serviceOrder.scheduledEnd
      };
      const payload = buildOrderPayload(tenantId, userId, data);
      payload.createdByUserId = serviceOrder.createdByUserId;
      if (payload.status === "concluida" && !serviceOrder.completedAt) {
        payload.completedAt = new Date();
      }
      if (payload.status === "cancelada" && !serviceOrder.canceledAt) {
        payload.canceledAt = new Date();
      }
      await ensureNoScheduleConflict(
        tenantId,
        payload.attendantId,
        payload.scheduledStart,
        payload.scheduledEnd,
        serviceOrder.id,
        transaction
      );
      await serviceOrder.update(payload, { transaction });
      await logOrder(
        serviceOrder.id,
        userId,
        payload.status !== oldValue.status ? "status_changed" : "updated",
        "Ordem de servico atualizada",
        oldValue,
        {
          status: serviceOrder.status,
          attendantId: serviceOrder.attendantId,
          scheduledStart: serviceOrder.scheduledStart,
          scheduledEnd: serviceOrder.scheduledEnd
        },
        transaction
      );
      return serviceOrder;
    }
  );
  const loaded = await loadOrder(tenantId, updated.id);
  let type = "service_order_updated";
  if (loaded.status === "cancelada") type = "service_order_cancelled";
  if (loaded.status === "concluida") type = "service_order_completed";
  emitServiceOrderEvent(tenantId, type, loaded);
  return loaded;
};

export const buildPublicServiceOrderDocumentHTML = ({
  tenantName,
  serviceOrder
}: {
  tenantName: string;
  serviceOrder: ServiceOrder;
}): string => {
  const { contact } = serviceOrder;
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>Ordem de Servico ${escapePublicText(
    serviceOrder.id
  )}</title></head>
<body>
  <h1>${escapePublicText(tenantName)}</h1>
  <h2>Ordem de Servico #${escapePublicText(serviceOrder.id)}</h2>
  <p><strong>Cliente:</strong> ${escapePublicText(contact?.name)}</p>
  <p><strong>Endereco:</strong> ${escapePublicText(
    serviceOrder.address
  )} ${escapePublicText(serviceOrder.addressComplement)} - ${escapePublicText(
    serviceOrder.city
  )}/${escapePublicText(serviceOrder.state)} ${escapePublicText(
    serviceOrder.zipCode
  )}</p>
  <p><strong>Horario:</strong> ${escapePublicText(
    serviceOrder.scheduledStart?.toISOString()
  )} ate ${escapePublicText(serviceOrder.scheduledEnd?.toISOString())}</p>
  <p><strong>Tipo:</strong> ${escapePublicText(serviceOrder.serviceType)}</p>
  <p><strong>Descricao:</strong> ${escapePublicText(
    serviceOrder.description
  )}</p>
  <p><strong>Observacao para o cliente:</strong> ${escapePublicText(
    serviceOrder.publicObservation
  )}</p>
  <hr>
  <p>Assinatura do cliente: ________________________________________</p>
</body></html>`;
};

function buildServiceOrderPdf({
  tenantName,
  serviceOrder,
  includeInternalObservation
}: {
  tenantName: string;
  serviceOrder: ServiceOrder;
  includeInternalObservation: boolean;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(tenantName, { align: "center" });
    doc.moveDown();
    doc
      .fontSize(16)
      .text(
        includeInternalObservation
          ? `Ordem de Servico Interna #${serviceOrder.id}`
          : `Ordem de Servico #${serviceOrder.id}`
      );
    doc.moveDown();
    doc.fontSize(11);
    doc.text(`Cliente: ${serviceOrder.contact?.name || ""}`);
    doc.text(
      `Endereco: ${serviceOrder.address || ""} ${
        serviceOrder.addressComplement || ""
      }`
    );
    doc.text(
      `${serviceOrder.city || ""}/${serviceOrder.state || ""} ${
        serviceOrder.zipCode || ""
      }`
    );
    doc.text(
      `Horario: ${formatDateTime(
        serviceOrder.scheduledStart
      )} ate ${formatDateTime(serviceOrder.scheduledEnd)}`
    );
    doc.text(`Tipo de servico: ${serviceOrder.serviceType || ""}`);
    doc.moveDown();
    doc.text("Descricao:", { underline: true });
    doc.text(serviceOrder.description || "");
    doc.moveDown();
    doc.text("Observacao para o cliente:", { underline: true });
    doc.text(serviceOrder.publicObservation || "");
    if (includeInternalObservation) {
      doc.moveDown();
      doc.text("Observacao interna:", { underline: true });
      doc.text(serviceOrder.internalObservation || "");
      doc.moveDown();
      doc.text(`Tecnico: ${serviceOrder.attendant?.name || "Sem tecnico"}`);
      doc.text(`Criado por: ${serviceOrder.createdBy?.name || ""}`);
    }
    doc.moveDown(3);
    if (!includeInternalObservation) {
      doc.text(
        "Assinatura do cliente: ________________________________________"
      );
    }
    doc.end();
  });
}

export const generatePublicDocument = async (
  tenantId: string | number,
  serviceOrderId: string
): Promise<Buffer> => {
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  const tenant = await Tenant.findByPk(tenantId);
  return buildServiceOrderPdf({
    tenantName: tenant?.name || "Empresa",
    serviceOrder,
    includeInternalObservation: false
  });
};

export const generateInternalDocument = async (
  tenantId: string | number,
  profile: string,
  serviceOrderId: string
): Promise<Buffer> => {
  if (!canSeeInternalObservation(profile)) {
    throw new AppError("ERR_SERVICE_ORDER_PERMISSION_DENIED", 403);
  }
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  const tenant = await Tenant.findByPk(tenantId);
  return buildServiceOrderPdf({
    tenantName: tenant?.name || "Empresa",
    serviceOrder,
    includeInternalObservation: true
  });
};

export const notifyOrder = async (
  tenantId: string | number,
  serviceOrderId: string,
  userId: string | number,
  data: ServiceOrderNotificationData
): Promise<Record<string, unknown>> => {
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  const message = buildPublicNotificationMessage(
    serviceOrder,
    cleanText(data.message)
  );
  const sent: string[] = [];
  const failed: Record<string, string> = {};

  if (data.channels.includes("internal")) {
    emitServiceOrderEvent(tenantId, "service_order_notification", serviceOrder);
    sent.push("internal");
  }

  if (data.channels.includes("email")) {
    try {
      if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
        throw new Error(
          "RESEND_API_KEY and RESEND_FROM_EMAIL must be configured"
        );
      }
      if (!serviceOrder.contact?.email) throw new Error("Cliente sem e-mail");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: serviceOrder.contact.email,
        subject: `Ordem de Servico #${serviceOrder.id}`,
        html: `<pre>${escapePublicText(message)}</pre>`
      });
      if (error) throw new Error(error.message);
      sent.push("email");
    } catch (error) {
      failed.email = error instanceof Error ? error.message : "Falha no e-mail";
    }
  }

  if (data.channels.includes("whatsapp")) {
    try {
      const ticket = await Ticket.findOne({
        where: { tenantId, contactId: serviceOrder.contactId },
        include: [{ model: Contact }]
      });
      if (!ticket) throw new Error("Cliente sem ticket/canal para WhatsApp");
      await SendMessageSystemProxy({
        ticket,
        messageData: { body: message },
        media: null,
        userId
      });
      sent.push("whatsapp");
    } catch (error) {
      failed.whatsapp =
        error instanceof Error ? error.message : "Falha no WhatsApp";
    }
  }

  await logOrder(
    serviceOrder.id,
    userId,
    "notification_sent",
    "Notificacao da ordem de servico processada",
    null,
    { channels: data.channels, sent, failed }
  );

  return { sent, failed };
};
