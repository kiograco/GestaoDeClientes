import { col, Op, Transaction, where as sequelizeWhere } from "sequelize";
import PDFDocument from "pdfkit";
import { Resend } from "resend";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Contact from "../../models/Contact";
import CustomerAddress from "../../models/CustomerAddress";
import ServiceAttendant from "../../models/ServiceAttendant";
import ServiceInventoryMovement from "../../models/ServiceInventoryMovement";
import ServiceInventoryItem from "../../models/ServiceInventoryItem";
import ServiceOrder from "../../models/ServiceOrder";
import ServiceOrderItem from "../../models/ServiceOrderItem";
import ServiceOrderLog from "../../models/ServiceOrderLog";
import ServiceType from "../../models/ServiceType";
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

export const SERVICE_ORDER_RECURRENCE_TYPES = [
  "single",
  "monthly_fixed_day",
  "custom_interval"
];

export interface ServiceAttendantData {
  name: string;
  email?: string | null;
  phone?: string | null;
  specialty?: string | null;
  active?: boolean;
  workingHours?: LegacyAny;
}

export interface ServiceOrderItemData {
  itemType: "service" | "product";
  serviceTypeId?: number | null;
  inventoryItemId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface ServiceOrderData {
  contactId: number;
  attendantId?: number | null;
  title: string;
  description?: string | null;
  serviceType: string;
  priority?: string;
  status?: string;
  recurrenceType?: string;
  recurrenceActive?: boolean;
  recurrenceDayOfMonth?: number | null;
  recurrenceIntervalDays?: number | null;
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
  items?: ServiceOrderItemData[];
}

export interface ServiceOrderNotificationData {
  channels: Array<"internal" | "email" | "whatsapp">;
  message?: string | null;
}

export interface ServiceInventoryItemData {
  name: string;
  sku?: string | null;
  description?: string | null;
  unit?: string | null;
  quantity?: number;
  minQuantity?: number;
  costPrice?: number | null;
  salePrice?: number | null;
  active?: boolean;
}

export interface ServiceInventoryAdjustmentData {
  movementType: "entry" | "exit" | "set";
  quantity: number;
  observation?: string | null;
}

export interface ServiceTypeData {
  name: string;
  description?: string | null;
  defaultPrice?: number | null;
  active?: boolean;
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

const resolveRecurrenceType = (data: ServiceOrderData): string => {
  const hasRecurringType =
    data.recurrenceType && data.recurrenceType !== "single";
  const isRecurring =
    data.recurrenceActive === true ||
    (data.recurrenceActive === undefined && hasRecurringType);
  return isRecurring ? data.recurrenceType || "monthly_fixed_day" : "single";
};

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
    model: ServiceOrderItem,
    as: "items",
    include: [{ model: ServiceType }, { model: ServiceInventoryItem }]
  },
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

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const daysInUTCMonth = (year: number, month: number): number =>
  new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

const withOccurrenceDate = (
  base: Date,
  year: number,
  month: number,
  dayOfMonth: number
): Date => {
  const next = new Date(base);
  next.setUTCFullYear(year, month, dayOfMonth);
  return next;
};

const buildOccurrence = (
  order: Record<string, unknown>,
  occurrenceStart: Date,
  baseStart: Date,
  durationMs: number
): Record<string, unknown> => {
  const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
  const isBaseOccurrence = occurrenceStart.getTime() === baseStart.getTime();
  return {
    ...order,
    scheduledStart: occurrenceStart.toISOString(),
    scheduledEnd: occurrenceEnd.toISOString(),
    originalServiceOrderId: order.id,
    recurringOccurrence: !isBaseOccurrence,
    occurrenceKey: `${order.id}:${occurrenceStart.toISOString()}`
  };
};

const occurrenceOverlaps = (
  occurrenceStart: Date,
  durationMs: number,
  rangeStart: Date,
  rangeEnd: Date
): boolean => {
  const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
  return occurrenceStart < rangeEnd && occurrenceEnd > rangeStart;
};

const expandCustomIntervalOccurrences = (
  order: Record<string, unknown>,
  rangeStart: Date,
  rangeEnd: Date,
  baseStart: Date,
  durationMs: number
): Record<string, unknown>[] => {
  const intervalDays = Number(order.recurrenceIntervalDays);
  if (!Number.isInteger(intervalDays) || intervalDays < 1) return [];

  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const firstIndex = Math.max(
    0,
    Math.floor((rangeStart.getTime() - baseStart.getTime()) / intervalMs) - 1
  );
  const occurrences: Record<string, unknown>[] = [];

  for (
    let index = firstIndex;
    baseStart.getTime() + index * intervalMs < rangeEnd.getTime();
    index += 1
  ) {
    const occurrenceStart = addDays(baseStart, index * intervalDays);
    if (occurrenceOverlaps(occurrenceStart, durationMs, rangeStart, rangeEnd)) {
      occurrences.push(
        buildOccurrence(order, occurrenceStart, baseStart, durationMs)
      );
    }
  }

  return occurrences;
};

const expandMonthlyFixedDayOccurrences = (
  order: Record<string, unknown>,
  rangeStart: Date,
  rangeEnd: Date,
  baseStart: Date,
  durationMs: number
): Record<string, unknown>[] => {
  const dayOfMonth = Number(order.recurrenceDayOfMonth);
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return [];
  }

  const occurrences: Record<string, unknown>[] = [];
  const cursor = new Date(
    Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() - 1, 1)
  );

  while (cursor < rangeEnd) {
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();
    if (dayOfMonth <= daysInUTCMonth(year, month)) {
      const occurrenceStart = withOccurrenceDate(
        baseStart,
        year,
        month,
        dayOfMonth
      );
      if (
        occurrenceStart >= baseStart &&
        occurrenceOverlaps(occurrenceStart, durationMs, rangeStart, rangeEnd)
      ) {
        occurrences.push(
          buildOccurrence(order, occurrenceStart, baseStart, durationMs)
        );
      }
    }
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return occurrences;
};

export const expandServiceOrderOccurrences = (
  orders: Record<string, unknown>[],
  rangeStart?: Date | null,
  rangeEnd?: Date | null
): Record<string, unknown>[] => {
  if (!rangeStart || !rangeEnd) {
    return orders.map(order => ({
      ...order,
      originalServiceOrderId: order.id,
      occurrenceKey: `${order.id}:${String(order.scheduledStart || "")}`,
      recurringOccurrence: false
    }));
  }

  return orders
    .reduce<Record<string, unknown>[]>((occurrences, order) => {
      const baseStart = normalizeDate(order.scheduledStart as string | Date);
      const baseEnd = normalizeDate(order.scheduledEnd as string | Date);
      if (!baseStart || !baseEnd) return [...occurrences, order];

      const durationMs = baseEnd.getTime() - baseStart.getTime();
      if (
        !order.recurrenceActive ||
        order.recurrenceType === "single" ||
        durationMs <= 0
      ) {
        return [
          ...occurrences,
          ...(occurrenceOverlaps(baseStart, durationMs, rangeStart, rangeEnd)
            ? [
                {
                  ...order,
                  originalServiceOrderId: order.id,
                  occurrenceKey: `${order.id}:${baseStart.toISOString()}`,
                  recurringOccurrence: false
                }
              ]
            : [])
        ];
      }

      if (order.recurrenceType === "custom_interval") {
        return [
          ...occurrences,
          ...expandCustomIntervalOccurrences(
            order,
            rangeStart,
            rangeEnd,
            baseStart,
            durationMs
          )
        ];
      }

      if (order.recurrenceType === "monthly_fixed_day") {
        return [
          ...occurrences,
          ...expandMonthlyFixedDayOccurrences(
            order,
            rangeStart,
            rangeEnd,
            baseStart,
            durationMs
          )
        ];
      }

      return occurrences;
    }, [])
    .sort(
      (a, b) =>
        new Date(String(a.scheduledStart)).getTime() -
        new Date(String(b.scheduledStart)).getTime()
    );
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

const ensureServiceType = async (
  tenantId: string | number,
  serviceTypeId?: number | null,
  transaction?: Transaction
): Promise<void> => {
  if (!serviceTypeId) return;
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId },
    transaction
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
};

const ensureInventoryItem = async (
  tenantId: string | number,
  inventoryItemId?: number | null,
  transaction?: Transaction
): Promise<void> => {
  if (!inventoryItemId) return;
  const inventoryItem = await ServiceInventoryItem.findOne({
    where: { id: inventoryItemId, tenantId },
    transaction
  });
  if (!inventoryItem) {
    throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  }
};

export const validateServiceOrderSchedule = (data: ServiceOrderData): void => {
  const start = normalizeDate(data.scheduledStart);
  const end = normalizeDate(data.scheduledEnd);
  const status = data.status || "rascunho";
  const recurrenceType = resolveRecurrenceType(data);

  if (status !== "rascunho" && (!start || !end)) {
    throw new AppError("Informe inicio e fim do agendamento");
  }

  if (start && end && end.getTime() <= start.getTime()) {
    throw new AppError("Horario final deve ser maior que o horario inicial");
  }

  if (!SERVICE_ORDER_RECURRENCE_TYPES.includes(recurrenceType)) {
    throw new AppError("Tipo de recorrencia invalido");
  }

  if (recurrenceType === "monthly_fixed_day") {
    const day = Number(data.recurrenceDayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      throw new AppError("Informe um dia do mes entre 1 e 31");
    }
  }

  if (recurrenceType === "custom_interval") {
    const intervalDays = Number(data.recurrenceIntervalDays);
    if (
      !Number.isInteger(intervalDays) ||
      intervalDays < 1 ||
      intervalDays > 365
    ) {
      throw new AppError(
        "Informe o intervalo de recorrencia entre 1 e 365 dias"
      );
    }
  }
};

const normalizeRecurrence = (
  data: ServiceOrderData
): Pick<
  ServiceOrderData,
  | "recurrenceType"
  | "recurrenceActive"
  | "recurrenceDayOfMonth"
  | "recurrenceIntervalDays"
> => {
  const recurrenceType = resolveRecurrenceType(data);

  if (recurrenceType === "monthly_fixed_day") {
    return {
      recurrenceType,
      recurrenceActive: data.recurrenceActive !== false,
      recurrenceDayOfMonth: Number(data.recurrenceDayOfMonth),
      recurrenceIntervalDays: null
    };
  }

  if (recurrenceType === "custom_interval") {
    return {
      recurrenceType,
      recurrenceActive: data.recurrenceActive !== false,
      recurrenceDayOfMonth: null,
      recurrenceIntervalDays: Number(data.recurrenceIntervalDays)
    };
  }

  return {
    recurrenceType: "single",
    recurrenceActive: false,
    recurrenceDayOfMonth: null,
    recurrenceIntervalDays: null
  };
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

const formatCurrency = (value?: number | string | null): string =>
  Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

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

const normalizeNumber = (value?: number | null): number | null => {
  if (value === undefined || value === null || value === ("" as LegacyAny)) {
    return null;
  }
  return Number(value);
};

const normalizeInteger = (value?: number | null): number => {
  const normalized = normalizeNumber(value);
  return normalized === null ? 0 : Math.trunc(normalized);
};

const normalizeMoney = (value?: number | null): number => {
  const normalized = normalizeNumber(value);
  return normalized === null ? 0 : Number(normalized.toFixed(2));
};

const buildInventoryPayload = (
  tenantId: string | number,
  data: ServiceInventoryItemData
): Record<string, unknown> => ({
  tenantId,
  name: cleanText(data.name),
  sku: cleanText(data.sku),
  description: cleanText(data.description),
  unit: cleanText(data.unit) || "unidade",
  quantity: normalizeInteger(data.quantity),
  minQuantity: normalizeInteger(data.minQuantity),
  costPrice: normalizeNumber(data.costPrice),
  salePrice: normalizeNumber(data.salePrice),
  active: data.active !== false
});

export const listInventoryItems = async (
  tenantId: string | number
): Promise<ServiceInventoryItem[]> =>
  ServiceInventoryItem.findAll({
    where: { tenantId },
    order: [["name", "ASC"]]
  });

export const listLowStockInventoryItems = async (
  tenantId: string | number
): Promise<ServiceInventoryItem[]> =>
  ServiceInventoryItem.findAll({
    where: {
      tenantId,
      active: true,
      [Op.and]: [sequelizeWhere(col("quantity"), "<=", col("minQuantity"))]
    },
    order: [["name", "ASC"]]
  });

export const listInventoryMovements = async (
  tenantId: string | number
): Promise<ServiceInventoryMovement[]> =>
  ServiceInventoryMovement.findAll({
    where: { tenantId },
    include: [
      { model: ServiceInventoryItem, attributes: ["id", "name", "unit"] },
      { model: ServiceOrder, attributes: ["id", "title", "status"] },
      { model: User, attributes: ["id", "name", "email"] }
    ],
    order: [["createdAt", "DESC"]],
    limit: 100
  });

export const createInventoryItem = async (
  tenantId: string | number,
  data: ServiceInventoryItemData
): Promise<ServiceInventoryItem> =>
  ServiceInventoryItem.create(buildInventoryPayload(tenantId, data));

export const updateInventoryItem = async (
  tenantId: string | number,
  itemId: string,
  data: ServiceInventoryItemData
): Promise<ServiceInventoryItem> => {
  const item = await ServiceInventoryItem.findOne({
    where: { id: itemId, tenantId }
  });
  if (!item) throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  await item.update(buildInventoryPayload(tenantId, data));
  return item;
};

export const deleteInventoryItem = async (
  tenantId: string | number,
  itemId: string
): Promise<void> => {
  const item = await ServiceInventoryItem.findOne({
    where: { id: itemId, tenantId }
  });
  if (!item) throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  await item.destroy();
};

export const adjustInventoryItem = async (
  tenantId: string | number,
  itemId: string,
  userId: string | number,
  data: ServiceInventoryAdjustmentData
): Promise<ServiceInventoryItem> =>
  sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async transaction => {
      const item = await ServiceInventoryItem.findOne({
        where: { id: itemId, tenantId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!item) {
        throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
      }

      const quantity = Math.max(0, normalizeInteger(data.quantity));
      const previousQuantity = Number(item.quantity || 0);
      let newQuantity = quantity;
      if (data.movementType === "entry") {
        newQuantity = previousQuantity + quantity;
      }
      if (data.movementType === "exit") {
        newQuantity = previousQuantity - quantity;
      }

      if (newQuantity < 0) {
        throw new AppError("ERR_SERVICE_INVENTORY_INSUFFICIENT_STOCK", 409);
      }

      await item.update({ quantity: newQuantity }, { transaction });
      await ServiceInventoryMovement.create(
        {
          tenantId,
          inventoryItemId: item.id,
          userId: Number(userId),
          movementType: `manual_${data.movementType}`,
          quantity: newQuantity - previousQuantity,
          previousQuantity,
          newQuantity,
          observation: cleanText(data.observation)
        },
        { transaction }
      );
      return item;
    }
  );

const buildServiceTypePayload = (
  tenantId: string | number,
  data: ServiceTypeData
): Record<string, unknown> => ({
  tenantId,
  name: cleanText(data.name),
  description: cleanText(data.description),
  defaultPrice: normalizeNumber(data.defaultPrice),
  active: data.active !== false
});

export const listServiceTypes = async (
  tenantId: string | number
): Promise<ServiceType[]> =>
  ServiceType.findAll({
    where: { tenantId },
    order: [["name", "ASC"]]
  });

export const createServiceType = async (
  tenantId: string | number,
  data: ServiceTypeData
): Promise<ServiceType> =>
  ServiceType.create(buildServiceTypePayload(tenantId, data));

export const updateServiceType = async (
  tenantId: string | number,
  serviceTypeId: string,
  data: ServiceTypeData
): Promise<ServiceType> => {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId }
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
  await serviceType.update(buildServiceTypePayload(tenantId, data));
  return serviceType;
};

export const deleteServiceType = async (
  tenantId: string | number,
  serviceTypeId: string
): Promise<void> => {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId }
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
  await serviceType.destroy();
};

export const listOrders = async (
  tenantId: string | number,
  profile: string,
  filters: LegacyAny
): Promise<Record<string, unknown>[]> => {
  const where: LegacyAny = { tenantId };
  const rangeStart = filters.start ? new Date(filters.start) : null;
  const rangeEnd = filters.end ? new Date(filters.end) : null;
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.serviceType) where.serviceType = filters.serviceType;
  if (filters.attendantId) where.attendantId = filters.attendantId;
  if (rangeStart && rangeEnd) {
    where[Op.or] = [
      {
        scheduledStart: { [Op.lt]: rangeEnd },
        scheduledEnd: { [Op.gt]: rangeStart }
      },
      {
        recurrenceActive: true,
        scheduledStart: { [Op.lt]: rangeEnd }
      }
    ];
  }

  const orders = await ServiceOrder.findAll({
    where,
    include: includeOrder,
    order: [["scheduledStart", "ASC"]]
  });
  return expandServiceOrderOccurrences(
    orders.map(order => scrubOrder(order, profile)),
    rangeStart,
    rangeEnd
  );
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
    include: [
      { model: ServiceAttendant },
      { model: Contact },
      { model: ServiceOrderItem, as: "items" }
    ],
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
  const itemMetrics = orders.reduce(
    (acc, order) => {
      (order.items || []).forEach(item => {
        const quantity = Number(item.quantity || 0);
        const totalPrice = Number(item.totalPrice || 0);
        const key = item.description || "sem_descricao";
        acc.totalItemsValue += totalPrice;
        if (item.itemType === "service") {
          acc.serviceItemsValue += totalPrice;
          acc.servicesByQuantity[key] =
            (acc.servicesByQuantity[key] || 0) + quantity;
          acc.servicesByValue[key] = Number(
            ((acc.servicesByValue[key] || 0) + totalPrice).toFixed(2)
          );
        }
        if (item.itemType === "product") {
          acc.productItemsValue += totalPrice;
          acc.productsByQuantity[key] =
            (acc.productsByQuantity[key] || 0) + quantity;
          acc.productsByValue[key] = Number(
            ((acc.productsByValue[key] || 0) + totalPrice).toFixed(2)
          );
        }
      });
      return acc;
    },
    {
      totalItemsValue: 0,
      serviceItemsValue: 0,
      productItemsValue: 0,
      servicesByQuantity: {} as Record<string, number>,
      servicesByValue: {} as Record<string, number>,
      productsByQuantity: {} as Record<string, number>,
      productsByValue: {} as Record<string, number>
    }
  );

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
    visitsByDay,
    totalItemsValue: Number(itemMetrics.totalItemsValue.toFixed(2)),
    serviceItemsValue: Number(itemMetrics.serviceItemsValue.toFixed(2)),
    productItemsValue: Number(itemMetrics.productItemsValue.toFixed(2)),
    servicesByQuantity: itemMetrics.servicesByQuantity,
    servicesByValue: itemMetrics.servicesByValue,
    productsByQuantity: itemMetrics.productsByQuantity,
    productsByValue: itemMetrics.productsByValue
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
): LegacyAny => {
  const recurrence = normalizeRecurrence(data);
  return {
    tenantId,
    contactId: data.contactId,
    attendantId: data.attendantId || null,
    createdByUserId: Number(userId),
    title: cleanText(data.title),
    description: cleanText(data.description),
    serviceType: cleanText(data.serviceType),
    priority: data.priority || "baixa",
    status: data.status || "rascunho",
    ...recurrence,
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
  };
};

const buildOrderItemPayload = (
  tenantId: string | number,
  serviceOrderId: number,
  item: ServiceOrderItemData
): Record<string, unknown> => {
  const quantity = Math.max(1, normalizeInteger(item.quantity));
  const unitPrice = normalizeMoney(item.unitPrice);
  return {
    tenantId,
    serviceOrderId,
    itemType: item.itemType,
    serviceTypeId:
      item.itemType === "service" ? item.serviceTypeId || null : null,
    inventoryItemId:
      item.itemType === "product" ? item.inventoryItemId || null : null,
    description: cleanText(item.description),
    quantity,
    unitPrice,
    totalPrice: Number((quantity * unitPrice).toFixed(2))
  };
};

const replaceOrderItems = async (
  tenantId: string | number,
  serviceOrderId: number,
  items: ServiceOrderItemData[] = [],
  transaction: Transaction
): Promise<void> => {
  await ServiceOrderItem.destroy({
    where: { tenantId, serviceOrderId },
    transaction
  });

  if (!items.length) return;

  await Promise.all(
    items.map(async item => {
      if (item.itemType === "service") {
        await ensureServiceType(tenantId, item.serviceTypeId, transaction);
      }
      if (item.itemType === "product") {
        await ensureInventoryItem(tenantId, item.inventoryItemId, transaction);
      }
    })
  );

  await ServiceOrderItem.bulkCreate(
    items.map(item => buildOrderItemPayload(tenantId, serviceOrderId, item)),
    { transaction }
  );
};

const deductInventoryForServiceOrder = async (
  tenantId: string | number,
  serviceOrderId: number,
  userId: string | number,
  transaction: Transaction
): Promise<void> => {
  const productItems = (
    await ServiceOrderItem.findAll({
      where: {
        tenantId,
        serviceOrderId,
        itemType: "product"
      },
      transaction
    })
  ).filter(item => item.inventoryItemId);

  if (!productItems.length) return;

  const totalsByInventoryItemId = productItems.reduce<Record<number, number>>(
    (acc, item) => ({
      ...acc,
      [item.inventoryItemId]:
        (acc[item.inventoryItemId] || 0) + Number(item.quantity || 0)
    }),
    {}
  );
  const inventoryItemIds = Object.keys(totalsByInventoryItemId).map(Number);

  const inventoryItems = await ServiceInventoryItem.findAll({
    where: {
      tenantId,
      id: { [Op.in]: inventoryItemIds }
    },
    transaction,
    lock: transaction.LOCK.UPDATE
  });
  const inventoryById = new Map(
    inventoryItems.map(item => [item.id, item] as const)
  );

  const missingInventoryItemId = inventoryItemIds.find(
    inventoryItemId => !inventoryById.has(inventoryItemId)
  );
  if (missingInventoryItemId) {
    throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  }

  const insufficientInventoryItemId = inventoryItemIds.find(inventoryItemId => {
    const inventoryItem = inventoryById.get(inventoryItemId);
    return (
      Number(inventoryItem?.quantity || 0) <
      totalsByInventoryItemId[inventoryItemId]
    );
  });
  if (insufficientInventoryItemId) {
    throw new AppError("ERR_SERVICE_INVENTORY_INSUFFICIENT_STOCK", 409);
  }

  const runningQuantities: Record<number, number> = {};
  const movements = productItems.map(item => {
    const inventoryItem = inventoryById.get(item.inventoryItemId);
    const quantityToDeduct = Number(item.quantity || 0);
    const previousQuantity =
      runningQuantities[item.inventoryItemId] ??
      Number(inventoryItem?.quantity || 0);
    const newQuantity = previousQuantity - quantityToDeduct;
    runningQuantities[item.inventoryItemId] = newQuantity;

    return {
      tenantId,
      inventoryItemId: item.inventoryItemId,
      serviceOrderId,
      serviceOrderItemId: item.id,
      userId: Number(userId),
      movementType: "service_order_deduction",
      quantity: -quantityToDeduct,
      previousQuantity,
      newQuantity,
      observation: `Baixa automatica pela OS #${serviceOrderId}`
    };
  });

  await Promise.all(
    Object.entries(runningQuantities).map(([inventoryItemId, quantity]) =>
      inventoryById
        .get(Number(inventoryItemId))
        ?.update({ quantity }, { transaction })
    )
  );
  await ServiceInventoryMovement.bulkCreate(movements, { transaction });
};

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
      await replaceOrderItems(
        tenantId,
        serviceOrder.id,
        data.items,
        transaction
      );
      if (serviceOrder.status === "concluida") {
        await deductInventoryForServiceOrder(
          tenantId,
          serviceOrder.id,
          userId,
          transaction
        );
        await serviceOrder.update(
          { inventoryDeductedAt: new Date() },
          { transaction }
        );
      }
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
        scheduledEnd: serviceOrder.scheduledEnd,
        recurrenceType: serviceOrder.recurrenceType,
        recurrenceDayOfMonth: serviceOrder.recurrenceDayOfMonth,
        recurrenceIntervalDays: serviceOrder.recurrenceIntervalDays,
        inventoryDeductedAt: serviceOrder.inventoryDeductedAt
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
      await replaceOrderItems(
        tenantId,
        serviceOrder.id,
        data.items,
        transaction
      );
      if (payload.status === "concluida" && !oldValue.inventoryDeductedAt) {
        await deductInventoryForServiceOrder(
          tenantId,
          serviceOrder.id,
          userId,
          transaction
        );
        await serviceOrder.update(
          { inventoryDeductedAt: new Date() },
          { transaction }
        );
      }
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
          scheduledEnd: serviceOrder.scheduledEnd,
          recurrenceType: serviceOrder.recurrenceType,
          recurrenceDayOfMonth: serviceOrder.recurrenceDayOfMonth,
          recurrenceIntervalDays: serviceOrder.recurrenceIntervalDays
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
  <h3>Produtos e servicos</h3>
  <ul>
    ${(serviceOrder.items || [])
      .map(
        item =>
          `<li>${escapePublicText(item.description)} - ${escapePublicText(
            item.quantity
          )} x ${escapePublicText(
            formatCurrency(item.unitPrice)
          )} = ${escapePublicText(formatCurrency(item.totalPrice))}</li>`
      )
      .join("")}
  </ul>
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
    if (serviceOrder.items?.length) {
      doc.moveDown();
      doc.text("Produtos e servicos:", { underline: true });
      serviceOrder.items.forEach(item => {
        doc.text(
          `${item.description || ""} - ${item.quantity} x ${formatCurrency(
            item.unitPrice
          )} = ${formatCurrency(item.totalPrice)}`
        );
      });
    }
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
