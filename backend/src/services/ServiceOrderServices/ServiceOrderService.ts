import {
  col,
  Includeable,
  Op,
  Transaction,
  where as sequelizeWhere
} from "sequelize";
import PDFDocument from "pdfkit";
import sequelize from "../../database";
import AppError from "../../errors/AppError";
import Client from "../../models/Client";
import ClientContact from "../../models/ClientContact";
import Contact from "../../models/Contact";
import CustomerAddress from "../../models/CustomerAddress";
import Pest from "../../models/Pest";
import ProductPest from "../../models/ProductPest";
import ServiceAttendant from "../../models/ServiceAttendant";
import ServiceInventoryBatch from "../../models/ServiceInventoryBatch";
import ServiceInventoryMovement from "../../models/ServiceInventoryMovement";
import ServiceInventoryItem from "../../models/ServiceInventoryItem";
import ServiceInventoryPestRecommendation from "../../models/ServiceInventoryPestRecommendation";
import ServiceEnvironment from "../../models/ServiceEnvironment";
import ServiceMethod from "../../models/ServiceMethod";
import ServiceOrder from "../../models/ServiceOrder";
import ServiceOrderItem from "../../models/ServiceOrderItem";
import ServiceOrderLog from "../../models/ServiceOrderLog";
import ServiceOrderOccurrenceException from "../../models/ServiceOrderOccurrenceException";
import ServicePest from "../../models/ServicePest";
import ServiceProduct from "../../models/ServiceProduct";
import ServiceType from "../../models/ServiceType";
import ServiceWarranty from "../../models/ServiceWarranty";
import User from "../../models/User";
import Tenant from "../../models/Tenant";
import { getIO } from "../../libs/socket";
import Ticket from "../../models/Ticket";
import AttendanceType from "../../models/AttendanceType";
import SendMessageSystemProxy from "../../helpers/SendMessageSystemProxy";
import {
  sendFinancialNotification,
  sendOrderService
} from "../EmailServices/EmailService";

export const SERVICE_ORDER_PRIORITIES = ["baixa", "media", "alta", "urgente"];

export const SERVICE_ORDER_STATUSES = [
  "rascunho",
  "agendada",
  "em_atendimento",
  "concluida",
  "cancelada",
  "reagendada"
];

export const SERVICE_ORDER_FINANCIAL_STATUSES = [
  "nao_cobrado",
  "cobrado",
  "pago",
  "parcial",
  "cancelado"
];

export const SERVICE_ORDER_PAYMENT_METHODS = [
  "pix",
  "dinheiro",
  "cartao",
  "boleto",
  "transferencia"
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
  inventoryBatchId?: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  pestTarget?: string | null;
  applicationMethod?: string | null;
  dilutionUsed?: string | null;
  technicalObservation?: string | null;
}

export interface ServiceOrderData {
  contactId: number;
  attendantId?: number | null;
  title: string;
  description?: string | null;
  attendanceTypeId?: number | null;
  serviceType?: string | null;
  priority?: string;
  status?: string;
  financialStatus?: string;
  paymentMethod?: string | null;
  chargedAmount?: number | null;
  paidAmount?: number | null;
  paymentDueDate?: string | Date | null;
  paidAt?: string | Date | null;
  financialObservation?: string | null;
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

export interface ServiceOrderBillingReminderData
  extends ServiceOrderNotificationData {
  force?: boolean;
}

export interface ServiceInventoryBatchData {
  id?: number;
  batchNumber: string;
  manufacturingDate?: string | Date | null;
  expirationDate?: string | Date | null;
  quantity?: number;
  supplier?: string | null;
  observation?: string | null;
}

export interface ServiceInventoryPestRecommendationData {
  id?: number;
  pestId: number;
  productQuantity?: number | null;
  diluentQuantity?: number | null;
  unit?: string | null;
  actionTime?: string | null;
  technicalObservation?: string | null;
}

export interface ServiceInventoryItemData {
  name: string;
  sku?: string | null;
  activeIngredient?: string | null;
  chemicalGroup?: string | null;
  healthRegistration?: string | null;
  manufacturer?: string | null;
  productCategory?: string | null;
  description?: string | null;
  unit?: string | null;
  quantity?: number;
  minQuantity?: number;
  costPrice?: number | null;
  salePrice?: number | null;
  internalCode?: string | null;
  barcode?: string | null;
  lotControlEnabled?: boolean;
  showLotOnOrder?: boolean;
  showLotExpirationOnOrder?: boolean;
  diluentTypes?: string[];
  applicationMethods?: string[];
  showApplicationMethodOnOrder?: boolean;
  printSettings?: Record<string, boolean>;
  batches?: ServiceInventoryBatchData[];
  pestRecommendations?: ServiceInventoryPestRecommendationData[];
  pestIds?: number[];
  active?: boolean;
}

export interface ServiceInventoryAdjustmentData {
  movementType: "entry" | "exit" | "set";
  quantity: number;
  observation?: string | null;
}

export interface ServiceTypeData {
  id?: number;
  name: string;
  code?: string | null;
  description?: string | null;
  technicalDescription?: string | null;
  defaultPrice?: number | null;
  categories?: string[];
  pests?: {
    pestId: number;
  }[];
  environments?: string[];
  methods?: string[];
  products?: {
    id?: number;
    inventoryItemId: number;
    averageConsumption?: number | null;
  }[];
  warranty?: {
    hasWarranty?: boolean;
    quantity?: number | null;
    unit?: string | null;
    observation?: string | null;
    rules?: string | null;
  };
  averageExecutionTime?: string | null;
  recommendedTechnicians?: number | null;
  needsReturn?: boolean;
  returnQuantity?: number | null;
  returnInterval?: string | null;
  orderDefaultText?: string | null;
  customerRecommendations?: string | null;
  internalObservation?: string | null;
  active?: boolean;
}

export interface PestData {
  commonName: string;
  scientificName: string;
}

export interface ServiceOrderOccurrenceData {
  occurrenceStart: string | Date;
  scheduledStart: string | Date;
  scheduledEnd: string | Date;
  attendantId?: number | null;
  status: string;
}

export interface ServiceOrderPatchData {
  expectedUpdatedAt: string | Date;
  attendantId?: number | null;
  scheduledStart?: string | Date | null;
  scheduledEnd?: string | Date | null;
  status?: string;
  financialStatus?: string;
  paymentMethod?: string | null;
  chargedAmount?: number | null;
  paidAmount?: number | null;
  paymentDueDate?: string | Date | null;
  paidAt?: string | Date | null;
  financialObservation?: string | null;
}

const relevantStatuses = ["agendada", "em_atendimento", "reagendada"];
const managerProfiles = ["admin", "superadmin", "supervisor"];
const operatorProfiles = [...managerProfiles, "atendente"];
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
  operatorProfiles.includes(profile);

const resolveAttendanceType = async (
  tenantId: string | number,
  data: { attendanceTypeId?: number | null; serviceType?: string | null },
  transaction?: Transaction
): Promise<AttendanceType | null> => {
  if (data.attendanceTypeId) {
    const attendanceType = await AttendanceType.findOne({
      where: { id: data.attendanceTypeId, tenantId },
      transaction
    });
    if (!attendanceType)
      throw new AppError("ERR_ATTENDANCE_TYPE_NOT_FOUND", 404);
    return attendanceType;
  }

  const serviceType = cleanText(data.serviceType);
  if (!serviceType) return null;

  return AttendanceType.findOne({
    where: { tenantId, name: { [Op.iLike]: serviceType } },
    transaction
  });
};

const applyServiceOrderFinancialFilters = (
  where: LegacyAny,
  filters: LegacyAny
): void => {
  if (filters.financialStatus) where.financialStatus = filters.financialStatus;
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.financialView === "paid") where.financialStatus = "pago";
  if (filters.financialView === "partial") where.financialStatus = "parcial";
  if (filters.financialView === "overdue") {
    where.financialStatus = { [Op.notIn]: ["pago", "cancelado"] };
    where.paymentDueDate = { [Op.lt]: new Date() };
  }
  if (filters.financialView === "dueSoon") {
    const dueLimit = new Date();
    dueLimit.setDate(dueLimit.getDate() + 7);
    where.financialStatus = { [Op.notIn]: ["pago", "cancelado"] };
    where.paymentDueDate = { [Op.between]: [new Date(), dueLimit] };
  }
  if (filters.financialView === "open") {
    where.financialStatus = { [Op.notIn]: ["pago", "cancelado"] };
  }
};

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
  { model: AttendanceType },
  { model: User, as: "createdBy", attributes: ["id", "name", "email"] },
  {
    model: ServiceOrderItem,
    as: "items",
    include: [
      { model: ServiceType },
      {
        model: ServiceInventoryItem,
        include: [
          { model: ServiceInventoryBatch },
          { model: ServiceInventoryPestRecommendation }
        ]
      },
      { model: ServiceInventoryBatch }
    ]
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
    originalOccurrenceStart: occurrenceStart.toISOString(),
    recurringOccurrence: !isBaseOccurrence,
    occurrenceKey: `${order.id}:${occurrenceStart.toISOString()}`
  };
};

const applyOccurrenceException = (
  occurrence: Record<string, unknown>,
  exception: ServiceOrderOccurrenceException
): Record<string, unknown> => ({
  ...occurrence,
  scheduledStart: exception.scheduledStart.toISOString(),
  scheduledEnd: exception.scheduledEnd.toISOString(),
  attendantId: exception.attendantId,
  attendant: exception.attendant || null,
  status: exception.status,
  occurrenceExceptionId: exception.id,
  originalOccurrenceStart: exception.occurrenceStart.toISOString(),
  recurringOccurrence: true,
  occurrenceKey: `${
    exception.serviceOrderId
  }:${exception.occurrenceStart.toISOString()}`
});

const applyOccurrenceExceptions = (
  orders: Record<string, unknown>[],
  occurrences: Record<string, unknown>[],
  exceptions: ServiceOrderOccurrenceException[],
  rangeStart: Date,
  rangeEnd: Date
): Record<string, unknown>[] => {
  const exceptionByKey = new Map(
    exceptions.map(exception => [
      `${exception.serviceOrderId}:${exception.occurrenceStart.toISOString()}`,
      exception
    ])
  );
  const appliedKeys = new Set<string>();
  const adjusted = occurrences.reduce<Record<string, unknown>[]>(
    (result, occurrence) => {
      const key = String(occurrence.occurrenceKey || "");
      const exception = exceptionByKey.get(key);
      if (!exception) return [...result, occurrence];
      appliedKeys.add(key);
      const adjustedOccurrence = applyOccurrenceException(
        occurrence,
        exception
      );
      const start = normalizeDate(
        adjustedOccurrence.scheduledStart as string | Date
      );
      const end = normalizeDate(
        adjustedOccurrence.scheduledEnd as string | Date
      );
      return start && end && start < rangeEnd && end > rangeStart
        ? [...result, adjustedOccurrence]
        : result;
    },
    []
  );
  const orderById = new Map(orders.map(order => [Number(order.id), order]));

  exceptions.forEach(exception => {
    const key = `${
      exception.serviceOrderId
    }:${exception.occurrenceStart.toISOString()}`;
    if (appliedKeys.has(key)) return;
    const order = orderById.get(exception.serviceOrderId);
    const baseStart = normalizeDate(order?.scheduledStart as string | Date);
    const baseEnd = normalizeDate(order?.scheduledEnd as string | Date);
    if (!order || !baseStart || !baseEnd) return;
    const adjustedOccurrence = applyOccurrenceException(
      buildOccurrence(
        order,
        exception.occurrenceStart,
        baseStart,
        baseEnd.getTime() - baseStart.getTime()
      ),
      exception
    );
    if (
      exception.scheduledStart < rangeEnd &&
      exception.scheduledEnd > rangeStart
    ) {
      adjusted.push(adjustedOccurrence);
    }
  });

  return adjusted.sort(
    (a, b) =>
      new Date(String(a.scheduledStart)).getTime() -
      new Date(String(b.scheduledStart)).getTime()
  );
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
  if (contact) return contact;

  const client = await Client.findOne({
    where: { id: contactId, tenantId },
    include: [{ model: ClientContact, as: "contacts", required: false }],
    transaction
  });
  if (!client) throw new AppError("ERR_NO_CONTACT_FOUND", 404);

  if (client.contactId) {
    const linkedContact = await Contact.findOne({
      where: { id: client.contactId, tenantId },
      transaction
    });
    if (linkedContact) return linkedContact;
  }

  const primaryContact = client.contacts?.find(item => item.name);
  const preferredNumber =
    normalizeDigits(primaryContact?.whatsapp) ||
    normalizeDigits(primaryContact?.phone) ||
    normalizeDigits(client.document) ||
    `crm-client-${tenantId}-${client.id}`;
  const duplicatedNumber = await Contact.findOne({
    where: { tenantId, number: preferredNumber },
    transaction
  });
  const createdContact = await Contact.create(
    {
      tenantId,
      name: client.legalName || client.tradeName || `Cliente #${client.id}`,
      number: duplicatedNumber
        ? `crm-client-${tenantId}-${client.id}`
        : preferredNumber,
      email: cleanText(primaryContact?.email)?.toLowerCase() || null,
      profilePicUrl: ""
    },
    { transaction }
  );
  await client.update({ contactId: createdContact.id }, { transaction });
  return createdContact;
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
): Promise<ServiceInventoryItem | null> => {
  if (!inventoryItemId) return null;
  const inventoryItem = await ServiceInventoryItem.findOne({
    where: { id: inventoryItemId, tenantId },
    include: [
      { model: ServiceInventoryBatch },
      { model: ServiceInventoryPestRecommendation }
    ],
    transaction
  });
  if (!inventoryItem) {
    throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  }
  return inventoryItem;
};

const ensureInventoryBatch = async (
  tenantId: string | number,
  inventoryItemId?: number | null,
  inventoryBatchId?: number | null,
  transaction?: Transaction
): Promise<ServiceInventoryBatch | null> => {
  if (!inventoryBatchId) return null;
  const batch = await ServiceInventoryBatch.findOne({
    where: {
      id: inventoryBatchId,
      inventoryItemId: inventoryItemId || null,
      tenantId
    },
    transaction
  });
  if (!batch) throw new AppError("ERR_SERVICE_INVENTORY_BATCH_NOT_FOUND", 404);
  return batch;
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
  const candidates = await ServiceOrder.findAll({
    where: {
      tenantId,
      attendantId,
      status: { [Op.in]: relevantStatuses },
      [Op.or]: [
        {
          scheduledStart: { [Op.lt]: scheduledEnd },
          scheduledEnd: { [Op.gt]: scheduledStart }
        },
        {
          recurrenceActive: true,
          scheduledStart: { [Op.lt]: scheduledEnd }
        }
      ],
      ...(ignoreOrderId ? { id: { [Op.ne]: ignoreOrderId } } : {})
    },
    transaction,
    lock: transaction?.LOCK.UPDATE
  });
  const conflict = candidates.some(
    order =>
      expandServiceOrderOccurrences(
        [order.toJSON() as Record<string, unknown>],
        scheduledStart,
        scheduledEnd
      ).length > 0
  );
  if (conflict) throw new AppError("ERR_SERVICE_ORDER_SCHEDULE_CONFLICT", 409);

  const exceptionConflict = await ServiceOrderOccurrenceException.findOne({
    where: {
      tenantId,
      attendantId,
      status: { [Op.in]: relevantStatuses },
      scheduledStart: { [Op.lt]: scheduledEnd },
      scheduledEnd: { [Op.gt]: scheduledStart },
      ...(ignoreOrderId ? { serviceOrderId: { [Op.ne]: ignoreOrderId } } : {})
    },
    transaction,
    lock: transaction?.LOCK.UPDATE
  });
  if (exceptionConflict) {
    throw new AppError("ERR_SERVICE_ORDER_SCHEDULE_CONFLICT", 409);
  }
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

const buildBillingReminderMessage = (
  serviceOrder: ServiceOrder,
  customMessage?: string | null
): string => {
  const chargedAmount = Number(serviceOrder.chargedAmount || 0);
  const paidAmount = Number(serviceOrder.paidAmount || 0);
  const openAmount = Math.max(0, chargedAmount - paidAmount);
  const parts = [
    customMessage ||
      `Lembrete de pagamento da ordem de servico #${serviceOrder.id}`,
    `Servico: ${serviceOrder.serviceType}`,
    `Cliente: ${serviceOrder.contact?.name || ""}`,
    `Valor em aberto: ${formatCurrency(openAmount)}`,
    serviceOrder.paymentDueDate
      ? `Vencimento: ${formatDateTime(serviceOrder.paymentDueDate)}`
      : "",
    serviceOrder.paymentMethod
      ? `Forma de pagamento: ${serviceOrder.paymentMethod}`
      : "",
    "Caso o pagamento ja tenha sido realizado, desconsidere esta mensagem."
  ];
  return parts.filter(Boolean).join("\n");
};

const defaultPrintSettings = {
  commercialName: true,
  activeIngredient: true,
  chemicalGroup: true,
  healthRegistration: true,
  lotNumber: true,
  lotExpiration: true,
  applicationMethod: true,
  dilution: true,
  technicalObservation: true
};

const productTechnicalDetails = (item: ServiceOrderItem): string => {
  if (item.itemType !== "product" || !item.inventoryItem) return "";
  const product = item.inventoryItem;
  const settings = {
    ...defaultPrintSettings,
    ...(product.printSettings || {})
  };
  const parts = [
    settings.commercialName ? product.name : null,
    settings.activeIngredient && product.activeIngredient
      ? `Principio ativo: ${product.activeIngredient}`
      : null,
    settings.chemicalGroup && product.chemicalGroup
      ? `Grupo quimico: ${product.chemicalGroup}`
      : null,
    settings.healthRegistration && product.healthRegistration
      ? `Registro MS/ANVISA: ${product.healthRegistration}`
      : null,
    settings.lotNumber && product.showLotOnOrder && item.inventoryBatch
      ? `Lote: ${item.inventoryBatch.batchNumber}`
      : null,
    settings.lotExpiration &&
    product.showLotExpirationOnOrder &&
    item.inventoryBatch?.expirationDate
      ? `Vencimento: ${item.inventoryBatch.expirationDate}`
      : null,
    settings.applicationMethod &&
    product.showApplicationMethodOnOrder &&
    item.applicationMethod
      ? `Metodo: ${item.applicationMethod}`
      : null,
    settings.dilution && item.dilutionUsed
      ? `Diluicao: ${item.dilutionUsed}`
      : null,
    item.pestTarget ? `Praga: ${item.pestTarget}` : null,
    settings.technicalObservation && item.technicalObservation
      ? `Obs. tecnica: ${item.technicalObservation}`
      : null
  ];
  return parts.filter(Boolean).join(" | ");
};

const sendServiceOrderMessage = async (
  tenantId: string | number,
  userId: string | number,
  serviceOrder: ServiceOrder,
  channels: Array<"internal" | "email" | "whatsapp">,
  message: string,
  subject: string,
  internalEvent: string,
  emailPdfFactory?: () => Promise<Buffer>
): Promise<{ sent: string[]; failed: Record<string, string> }> => {
  const sent: string[] = [];
  const failed: Record<string, string> = {};

  if (channels.includes("internal")) {
    emitServiceOrderEvent(tenantId, internalEvent, serviceOrder);
    sent.push("internal");
  }

  if (channels.includes("email")) {
    try {
      if (!serviceOrder.contact?.email) throw new Error("Cliente sem e-mail");
      if (internalEvent === "service_order_billing_reminder") {
        await sendFinancialNotification({
          tenantId,
          to: serviceOrder.contact.email,
          subject,
          variables: {
            client_name: serviceOrder.contact.name,
            message,
            reference: `OS #${serviceOrder.id}`,
            due_date: formatDateTime(serviceOrder.paymentDueDate)
          }
        });
      } else {
        if (!emailPdfFactory) throw new Error("PDF da ordem nao foi gerado");
        const emailPdf = await emailPdfFactory();
        await sendOrderService({
          tenantId,
          to: serviceOrder.contact.email,
          subject,
          variables: {
            client_name: serviceOrder.contact.name,
            order_number: serviceOrder.id,
            service_date: formatDateTime(serviceOrder.scheduledStart),
            technician_name: serviceOrder.attendant?.name || "A definir",
            address: [
              serviceOrder.address,
              serviceOrder.city,
              serviceOrder.state
            ]
              .filter(Boolean)
              .join(", "),
            services: serviceOrder.items
              .map(item => item.description)
              .filter(Boolean)
              .join(", ")
          },
          attachments: [
            {
              filename: `ordem-servico-${serviceOrder.id}.pdf`,
              content: emailPdf,
              contentType: "application/pdf"
            }
          ]
        });
      }
      sent.push("email");
    } catch (error) {
      failed.email = error instanceof Error ? error.message : "Falha no e-mail";
    }
  }

  if (channels.includes("whatsapp")) {
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

  return { sent, failed };
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

const normalizeStringArray = (value?: string[]): string[] =>
  Array.isArray(value)
    ? (value.map(item => cleanText(item)).filter(Boolean) as string[])
    : [];

const buildInventoryPayload = (
  tenantId: string | number,
  data: ServiceInventoryItemData
): Record<string, unknown> => ({
  tenantId,
  name: cleanText(data.name),
  sku: cleanText(data.sku),
  activeIngredient: cleanText(data.activeIngredient),
  chemicalGroup: cleanText(data.chemicalGroup),
  healthRegistration: cleanText(data.healthRegistration),
  manufacturer: cleanText(data.manufacturer),
  productCategory: cleanText(data.productCategory) || "outro",
  description: cleanText(data.description),
  unit: cleanText(data.unit) || "unidade",
  quantity: normalizeInteger(data.quantity),
  minQuantity: normalizeInteger(data.minQuantity),
  costPrice: normalizeNumber(data.costPrice),
  salePrice: normalizeNumber(data.salePrice),
  internalCode: cleanText(data.internalCode),
  barcode: cleanText(data.barcode),
  lotControlEnabled: data.lotControlEnabled === true,
  showLotOnOrder: data.showLotOnOrder !== false,
  showLotExpirationOnOrder: data.showLotExpirationOnOrder !== false,
  diluentTypes: normalizeStringArray(data.diluentTypes),
  applicationMethods: normalizeStringArray(data.applicationMethods),
  showApplicationMethodOnOrder: data.showApplicationMethodOnOrder !== false,
  printSettings: {
    ...defaultPrintSettings,
    ...(data.printSettings || {})
  },
  active: data.active !== false
});

const buildBatchPayload = (
  tenantId: string | number,
  inventoryItemId: number,
  data: ServiceInventoryBatchData
): Record<string, unknown> => ({
  tenantId,
  inventoryItemId,
  batchNumber: cleanText(data.batchNumber),
  manufacturingDate: data.manufacturingDate || null,
  expirationDate: data.expirationDate || null,
  quantity: normalizeInteger(data.quantity),
  supplier: cleanText(data.supplier),
  observation: cleanText(data.observation)
});

const buildPestRecommendationPayload = (
  tenantId: string | number,
  inventoryItemId: number,
  data: ServiceInventoryPestRecommendationData
): Record<string, unknown> => ({
  tenantId,
  inventoryItemId,
  pestId: Number(data.pestId),
  productQuantity: normalizeNumber(data.productQuantity),
  diluentQuantity: normalizeNumber(data.diluentQuantity),
  unit: cleanText(data.unit),
  actionTime: cleanText(data.actionTime),
  technicalObservation: cleanText(data.technicalObservation)
});

const replaceInventoryChildren = async (
  tenantId: string | number,
  inventoryItemId: number,
  data: ServiceInventoryItemData,
  transaction: Transaction
): Promise<void> => {
  await ServiceInventoryBatch.destroy({
    where: { tenantId, inventoryItemId },
    transaction
  });
  await ServiceInventoryPestRecommendation.destroy({
    where: { tenantId, inventoryItemId },
    transaction
  });
  await ProductPest.destroy({
    where: { tenantId, productId: inventoryItemId },
    transaction
  });

  const batches = (data.batches || []).filter(batch =>
    Boolean(cleanText(batch.batchNumber))
  );
  if (batches.length) {
    await ServiceInventoryBatch.bulkCreate(
      batches.map(batch => buildBatchPayload(tenantId, inventoryItemId, batch)),
      { transaction }
    );
  }

  const pestIds = [
    ...new Set(
      [
        ...(data.pestIds || []).map(Number),
        ...(data.pestRecommendations || []).map(item => Number(item.pestId))
      ].filter(Boolean)
    )
  ];
  if (pestIds.length) {
    const foundPests = await Pest.count({
      where: { tenantId, id: { [Op.in]: pestIds } },
      transaction
    });
    if (foundPests !== pestIds.length) {
      throw new AppError("ERR_PEST_NOT_FOUND", 404);
    }
    await ProductPest.bulkCreate(
      pestIds.map(pestId => ({
        tenantId,
        productId: inventoryItemId,
        pestId
      })),
      { transaction }
    );
  }

  const recommendations = (data.pestRecommendations || []).filter(item =>
    Boolean(item.pestId)
  );
  if (recommendations.length) {
    await ServiceInventoryPestRecommendation.bulkCreate(
      recommendations.map(item =>
        buildPestRecommendationPayload(tenantId, inventoryItemId, item)
      ),
      { transaction }
    );
  }
};

const inventoryInclude = [
  { model: ServiceInventoryBatch },
  { model: ProductPest, include: [{ model: Pest }] },
  { model: ServiceInventoryPestRecommendation, include: [{ model: Pest }] }
];

export const listInventoryItems = async (
  tenantId: string | number
): Promise<ServiceInventoryItem[]> =>
  ServiceInventoryItem.findAll({
    where: { tenantId },
    include: inventoryInclude,
    order: [["name", "ASC"]]
  });

export const listLowStockInventoryItems = async (
  tenantId: string | number
): Promise<ServiceInventoryItem[]> =>
  ServiceInventoryItem.findAll({
    where: {
      tenantId,
      active: true,
      [Op.and]: [
        sequelizeWhere(
          col("ServiceInventoryItem.quantity"),
          "<=",
          col("ServiceInventoryItem.minQuantity")
        )
      ]
    },
    include: inventoryInclude,
    order: [["name", "ASC"]]
  });

export const getInventoryItem = async (
  tenantId: string | number,
  itemId: string
): Promise<ServiceInventoryItem | null> =>
  ServiceInventoryItem.findOne({
    where: { id: itemId, tenantId },
    include: inventoryInclude
  });

export const listInventoryMovements = async (
  tenantId: string | number
): Promise<ServiceInventoryMovement[]> =>
  ServiceInventoryMovement.findAll({
    where: { tenantId },
    include: [
      { model: ServiceInventoryItem, attributes: ["id", "name", "unit"] },
      {
        model: ServiceInventoryBatch,
        attributes: ["id", "batchNumber", "expirationDate"]
      },
      { model: ServiceOrder, attributes: ["id", "title", "status"] },
      { model: User, attributes: ["id", "name", "email"] }
    ],
    order: [["createdAt", "DESC"]],
    limit: 100
  });

const parseReportDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const buildMovementWhere = (
  tenantId: string | number,
  filters: LegacyAny = {}
): LegacyAny => {
  const where: LegacyAny = {
    tenantId,
    movementType: "service_order_deduction"
  };
  const start = parseReportDate(filters.startDate);
  const end = parseReportDate(filters.endDate);
  if (start || end) {
    where.createdAt = {
      ...(start ? { [Op.gte]: start } : {}),
      ...(end ? { [Op.lte]: end } : {})
    };
  }
  return where;
};

export const getInventoryConsumptionReport = async (
  tenantId: string | number,
  filters: LegacyAny = {}
): Promise<Record<string, unknown>> => {
  const movements = await ServiceInventoryMovement.findAll({
    where: buildMovementWhere(tenantId, filters) as LegacyAny,
    include: [
      { model: ServiceInventoryItem },
      {
        model: ServiceOrder,
        attributes: ["id", "title", "attendantId", "contactId"],
        include: [
          { model: Contact, attributes: ["id", "name"] },
          { model: ServiceAttendant, attributes: ["id", "name"] }
        ]
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  const add = (
    acc: Record<string, number>,
    key: string | number | null | undefined,
    value: number
  ) => {
    const label = key ? String(key) : "Nao informado";
    acc[label] = Number(((acc[label] || 0) + value).toFixed(3));
  };

  const byProduct: Record<string, number> = {};
  const byClient: Record<string, number> = {};
  const byAttendant: Record<string, number> = {};

  movements.forEach(movement => {
    const quantity = Math.abs(Number(movement.quantity || 0));
    add(byProduct, movement.inventoryItem?.name, quantity);
    add(byClient, movement.serviceOrder?.contact?.name, quantity);
    add(byAttendant, movement.serviceOrder?.attendant?.name, quantity);
  });

  return {
    rows: movements,
    byProduct,
    byClient,
    byAttendant,
    mostUsedProduct:
      Object.entries(byProduct).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  };
};

export const getInventoryBatchReport = async (
  tenantId: string | number
): Promise<Record<string, unknown>> => {
  const today = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const batches = await ServiceInventoryBatch.findAll({
    where: { tenantId },
    include: [
      { model: ServiceInventoryItem, attributes: ["id", "name", "unit"] }
    ],
    order: [["expirationDate", "ASC"]]
  });
  const movements = await ServiceInventoryMovement.findAll({
    where: { tenantId, inventoryBatchId: { [Op.ne]: null } } as LegacyAny,
    include: [
      { model: ServiceInventoryItem, attributes: ["id", "name", "unit"] },
      { model: ServiceInventoryBatch, attributes: ["id", "batchNumber"] },
      { model: ServiceOrder, attributes: ["id", "title"] },
      { model: User, attributes: ["id", "name"] }
    ],
    order: [["createdAt", "DESC"]],
    limit: 200
  });

  return {
    expiringSoon: batches.filter(batch => {
      if (!batch.expirationDate) return false;
      const expiration = new Date(batch.expirationDate);
      return expiration >= today && expiration <= soon;
    }),
    expired: batches.filter(batch => {
      if (!batch.expirationDate) return false;
      return new Date(batch.expirationDate) < today;
    }),
    depleted: batches.filter(batch => Number(batch.quantity || 0) <= 0),
    history: movements
  };
};

const addCost = (
  acc: Record<string, number>,
  key: string | number | null | undefined,
  value: number
) => {
  const label = key ? String(key) : "Nao informado";
  acc[label] = Number(((acc[label] || 0) + value).toFixed(2));
};

export const getInventoryCostReport = async (
  tenantId: string | number,
  filters: LegacyAny = {}
): Promise<Record<string, unknown>> => {
  const movements = await ServiceInventoryMovement.findAll({
    where: buildMovementWhere(tenantId, filters) as LegacyAny,
    include: [
      { model: ServiceInventoryItem, attributes: ["id", "name", "unit"] },
      {
        model: ServiceOrder,
        attributes: ["id", "title", "contactId", "chargedAmount"],
        include: [{ model: Contact, attributes: ["id", "name"] }]
      }
    ],
    order: [["createdAt", "DESC"]]
  });

  const byOrder: Record<string, number> = {};
  const byClient: Record<string, number> = {};
  const byPest: Record<string, number> = {};
  movements.forEach(movement => {
    const cost = normalizeMoney(Number(movement.totalCost || 0));
    addCost(byOrder, movement.serviceOrderId, cost);
    addCost(byClient, movement.serviceOrder?.contact?.name, cost);
    addCost(byPest, movement.pestTarget, cost);
  });

  return {
    rows: movements,
    byOrder,
    byClient,
    byPest,
    totalCost: Number(
      movements
        .reduce((sum, movement) => sum + Number(movement.totalCost || 0), 0)
        .toFixed(2)
    )
  };
};

export const createInventoryItem = async (
  tenantId: string | number,
  data: ServiceInventoryItemData
): Promise<ServiceInventoryItem> => {
  const created = await sequelize.transaction(async transaction => {
    const item = await ServiceInventoryItem.create(
      buildInventoryPayload(tenantId, data),
      { transaction }
    );
    await replaceInventoryChildren(tenantId, item.id, data, transaction);
    return item;
  });
  const loaded = await ServiceInventoryItem.findOne({
    where: { id: created.id, tenantId },
    include: inventoryInclude
  });
  if (!loaded) throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  return loaded;
};

export const updateInventoryItem = async (
  tenantId: string | number,
  itemId: string,
  data: ServiceInventoryItemData
): Promise<ServiceInventoryItem> => {
  const item = await ServiceInventoryItem.findOne({
    where: { id: itemId, tenantId },
    include: inventoryInclude
  });
  if (!item) throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await item.update(buildInventoryPayload(tenantId, data), { transaction });
    await replaceInventoryChildren(tenantId, item.id, data, transaction);
  });
  const loaded = await ServiceInventoryItem.findOne({
    where: { id: itemId, tenantId },
    include: inventoryInclude
  });
  if (!loaded) throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
  return loaded;
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
        throw new AppError(
          `Estoque insuficiente para ${item.name}. Saldo atual: ${previousQuantity}, necessario: ${quantity}.`,
          409
        );
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

const buildPestPayload = (
  tenantId: string | number,
  data: PestData
): Record<string, unknown> => ({
  tenantId,
  commonName: cleanText(data.commonName),
  scientificName: cleanText(data.scientificName)
});

const ensureUniquePest = async (
  tenantId: string | number,
  data: PestData,
  pestId?: string
): Promise<void> => {
  const commonName = cleanText(data.commonName) || "";
  const scientificName = cleanText(data.scientificName) || "";
  const existing = await Pest.findOne({
    where: {
      tenantId,
      ...(pestId ? { id: { [Op.ne]: pestId } } : {}),
      [Op.or]: [
        { commonName: { [Op.iLike]: commonName } },
        { scientificName: { [Op.iLike]: scientificName } }
      ]
    }
  });
  if (existing) {
    throw new AppError("ERR_PEST_ALREADY_EXISTS", 409);
  }
};

export const listPests = async (
  tenantId: string | number,
  filters: LegacyAny = {}
): Promise<Pest[]> => {
  const search = cleanText(filters.search);
  return Pest.findAll({
    where: {
      tenantId,
      ...(search
        ? {
            [Op.or]: [
              { commonName: { [Op.iLike]: `%${search}%` } },
              { scientificName: { [Op.iLike]: `%${search}%` } }
            ]
          }
        : {})
    },
    order: [["commonName", "ASC"]]
  });
};

export const createPest = async (
  tenantId: string | number,
  data: PestData
): Promise<Pest> => {
  await ensureUniquePest(tenantId, data);
  return Pest.create(buildPestPayload(tenantId, data));
};

export const updatePest = async (
  tenantId: string | number,
  pestId: string,
  data: PestData
): Promise<Pest> => {
  const pest = await Pest.findOne({ where: { id: pestId, tenantId } });
  if (!pest) throw new AppError("ERR_PEST_NOT_FOUND", 404);
  await ensureUniquePest(tenantId, data, pestId);
  await pest.update(buildPestPayload(tenantId, data));
  return pest;
};

export const deletePest = async (
  tenantId: string | number,
  pestId: string
): Promise<void> => {
  const pest = await Pest.findOne({ where: { id: pestId, tenantId } });
  if (!pest) throw new AppError("ERR_PEST_NOT_FOUND", 404);
  await pest.destroy();
};

const buildServiceTypePayload = (
  tenantId: string | number,
  data: ServiceTypeData,
  code?: string
): Record<string, unknown> => ({
  tenantId,
  name: cleanText(data.name),
  code: code || cleanText(data.code),
  description: cleanText(data.description),
  technicalDescription: cleanText(data.technicalDescription),
  defaultPrice: normalizeNumber(data.defaultPrice),
  categories: data.categories || [],
  averageExecutionTime: cleanText(data.averageExecutionTime),
  recommendedTechnicians: Math.max(
    1,
    normalizeInteger(data.recommendedTechnicians || 1)
  ),
  needsReturn: data.needsReturn === true,
  returnQuantity: Math.max(0, normalizeInteger(data.returnQuantity || 0)),
  returnInterval: cleanText(data.returnInterval),
  orderDefaultText: cleanText(data.orderDefaultText),
  customerRecommendations: cleanText(data.customerRecommendations),
  internalObservation: cleanText(data.internalObservation),
  active: data.active !== false
});

const serviceTypeInclude = [
  { model: ServicePest, include: [{ model: Pest }] },
  { model: ServiceEnvironment },
  { model: ServiceMethod },
  {
    model: ServiceProduct,
    include: [
      {
        model: ServiceInventoryItem,
        attributes: ["id", "name", "activeIngredient", "chemicalGroup", "unit"]
      }
    ]
  },
  { model: ServiceWarranty }
];

const serviceCodeFromId = (id: number): string =>
  `SRV-${String(id).padStart(5, "0")}`;

const replaceServiceTypeChildren = async (
  tenantId: string | number,
  serviceTypeId: number,
  data: ServiceTypeData,
  transaction: Transaction
): Promise<void> => {
  await Promise.all([
    ServicePest.destroy({ where: { tenantId, serviceTypeId }, transaction }),
    ServiceEnvironment.destroy({
      where: { tenantId, serviceTypeId },
      transaction
    }),
    ServiceMethod.destroy({ where: { tenantId, serviceTypeId }, transaction }),
    ServiceProduct.destroy({ where: { tenantId, serviceTypeId }, transaction }),
    ServiceWarranty.destroy({ where: { tenantId, serviceTypeId }, transaction })
  ]);

  const pestIds = [
    ...new Set(
      (data.pests || []).map(item => Number(item.pestId)).filter(Boolean)
    )
  ];
  if (pestIds.length) {
    const foundPests = await Pest.count({
      where: { tenantId, id: { [Op.in]: pestIds } },
      transaction
    });
    if (foundPests !== pestIds.length) {
      throw new AppError("ERR_PEST_NOT_FOUND", 404);
    }
    await ServicePest.bulkCreate(
      pestIds.map(pestId => ({
        tenantId,
        serviceTypeId,
        pestId
      })),
      { transaction }
    );
  }

  const environments = [...new Set((data.environments || []).filter(Boolean))];
  if (environments.length) {
    await ServiceEnvironment.bulkCreate(
      environments.map(environment => ({
        tenantId,
        serviceTypeId,
        environment
      })),
      { transaction }
    );
  }

  const methods = [...new Set((data.methods || []).filter(Boolean))];
  if (methods.length) {
    await ServiceMethod.bulkCreate(
      methods.map(method => ({ tenantId, serviceTypeId, method })),
      { transaction }
    );
  }

  const products = (data.products || []).filter(item =>
    Boolean(item.inventoryItemId)
  );
  if (products.length) {
    const inventoryItemIds = products.map(item => Number(item.inventoryItemId));
    const foundItems = await ServiceInventoryItem.count({
      where: { tenantId, id: { [Op.in]: inventoryItemIds } },
      transaction
    });
    if (foundItems !== new Set(inventoryItemIds).size) {
      throw new AppError("ERR_SERVICE_INVENTORY_ITEM_NOT_FOUND", 404);
    }
    await ServiceProduct.bulkCreate(
      products.map(item => ({
        tenantId,
        serviceTypeId,
        inventoryItemId: Number(item.inventoryItemId),
        averageConsumption: normalizeNumber(item.averageConsumption)
      })),
      { transaction }
    );
  }

  if (data.warranty?.hasWarranty) {
    await ServiceWarranty.create(
      {
        tenantId,
        serviceTypeId,
        quantity: Math.max(0, normalizeInteger(data.warranty.quantity || 0)),
        unit: cleanText(data.warranty.unit) || "dias",
        observation: cleanText(data.warranty.observation),
        rules: cleanText(data.warranty.rules)
      },
      { transaction }
    );
  }
};

export const listServiceTypes = async (
  tenantId: string | number,
  filters: LegacyAny = {}
): Promise<ServiceType[]> => {
  const include: Includeable[] = [
    {
      model: ServiceProduct,
      include: [
        {
          model: ServiceInventoryItem,
          attributes: [
            "id",
            "name",
            "activeIngredient",
            "chemicalGroup",
            "unit"
          ]
        }
      ]
    },
    { model: ServiceWarranty }
  ];
  include.unshift(
    filters.method
      ? { model: ServiceMethod, where: { method: filters.method } }
      : { model: ServiceMethod }
  );
  include.unshift(
    filters.environment
      ? {
          model: ServiceEnvironment,
          where: { environment: filters.environment }
        }
      : { model: ServiceEnvironment }
  );
  include.unshift(
    filters.pest
      ? {
          model: ServicePest,
          include: [
            {
              model: Pest,
              where: {
                [Op.or]: [
                  { commonName: { [Op.iLike]: `%${filters.pest}%` } },
                  { scientificName: { [Op.iLike]: `%${filters.pest}%` } }
                ]
              }
            }
          ]
        }
      : { model: ServicePest, include: [{ model: Pest }] }
  );

  return ServiceType.findAll({
    where: {
      tenantId,
      ...(filters.search
        ? { name: { [Op.iLike]: `%${String(filters.search).trim()}%` } }
        : {}),
      ...(filters.category
        ? { categories: { [Op.contains]: [filters.category] } }
        : {})
    },
    include,
    order: [["name", "ASC"]]
  });
};

export const createServiceType = async (
  tenantId: string | number,
  data: ServiceTypeData
): Promise<ServiceType> =>
  sequelize.transaction(async transaction => {
    const serviceType = await ServiceType.create(
      buildServiceTypePayload(tenantId, data),
      { transaction }
    );
    const code = cleanText(data.code) || serviceCodeFromId(serviceType.id);
    await serviceType.update({ code }, { transaction });
    await replaceServiceTypeChildren(
      tenantId,
      serviceType.id,
      data,
      transaction
    );
    const loaded = await ServiceType.findOne({
      where: { id: serviceType.id, tenantId },
      include: serviceTypeInclude,
      transaction
    });
    if (!loaded) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
    return loaded;
  });

export const updateServiceType = async (
  tenantId: string | number,
  serviceTypeId: string,
  data: ServiceTypeData
): Promise<ServiceType> => {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId }
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
  await sequelize.transaction(async transaction => {
    await serviceType.update(
      buildServiceTypePayload(tenantId, data, serviceType.code),
      { transaction }
    );
    await replaceServiceTypeChildren(
      tenantId,
      serviceType.id,
      data,
      transaction
    );
  });
  const loaded = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId },
    include: serviceTypeInclude
  });
  if (!loaded) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
  return loaded;
};

export const deleteServiceType = async (
  tenantId: string | number,
  serviceTypeId: string
): Promise<void> => {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId }
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);
  await serviceType.update({ active: false });
};

export const duplicateServiceType = async (
  tenantId: string | number,
  serviceTypeId: string
): Promise<ServiceType> => {
  const serviceType = await ServiceType.findOne({
    where: { id: serviceTypeId, tenantId },
    include: serviceTypeInclude
  });
  if (!serviceType) throw new AppError("ERR_SERVICE_TYPE_NOT_FOUND", 404);

  const source = serviceType.toJSON() as LegacyAny;
  return createServiceType(tenantId, {
    ...source,
    id: undefined,
    name: `${source.name} (copia)`,
    code: null,
    products: (source.products || []).map((item: LegacyAny) => ({
      inventoryItemId: item.inventoryItemId,
      averageConsumption: item.averageConsumption
    })),
    pests: (source.pests || []).map((item: LegacyAny) => ({
      pestId: item.pestId
    })),
    environments: (source.environments || []).map(
      (item: LegacyAny) => item.environment
    ),
    methods: (source.methods || []).map((item: LegacyAny) => item.method),
    warranty: {
      hasWarranty: Boolean(source.warranties?.length),
      ...(source.warranties?.[0] || {})
    }
  });
};

export const listOrders = async (
  tenantId: string | number,
  profile: string,
  filters: LegacyAny
): Promise<Record<string, unknown>[]> => {
  const where: LegacyAny = { tenantId };
  const rangeStart = filters.start ? new Date(filters.start) : null;
  const rangeEnd = filters.end ? new Date(filters.end) : null;
  if (filters.status && !(rangeStart && rangeEnd))
    where.status = filters.status;
  applyServiceOrderFinancialFilters(where, filters);
  if (filters.priority) where.priority = filters.priority;
  if (filters.attendanceTypeId)
    where.attendanceTypeId = filters.attendanceTypeId;
  if (filters.serviceType) where.serviceType = filters.serviceType;
  if (filters.attendantId && !(rangeStart && rangeEnd)) {
    where.attendantId = filters.attendantId;
  }
  const occurrenceExceptions =
    rangeStart && rangeEnd
      ? await ServiceOrderOccurrenceException.findAll({
          where: {
            tenantId,
            [Op.or]: [
              {
                scheduledStart: { [Op.lt]: rangeEnd },
                scheduledEnd: { [Op.gt]: rangeStart }
              },
              {
                occurrenceStart: {
                  [Op.gte]: rangeStart,
                  [Op.lt]: rangeEnd
                }
              }
            ]
          },
          include: [{ model: ServiceAttendant }]
        })
      : [];
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
    const exceptionOrderIds = occurrenceExceptions.map(
      exception => exception.serviceOrderId
    );
    if (exceptionOrderIds.length) {
      where[Op.or].push({ id: { [Op.in]: exceptionOrderIds } });
    }
  }

  const orders = await ServiceOrder.findAll({
    where,
    include: includeOrder,
    order: [["scheduledStart", "ASC"]]
  });
  const scrubbedOrders = orders.map(order => scrubOrder(order, profile));
  const occurrences = expandServiceOrderOccurrences(
    scrubbedOrders,
    rangeStart,
    rangeEnd
  );
  const result =
    rangeStart && rangeEnd
      ? applyOccurrenceExceptions(
          scrubbedOrders,
          occurrences,
          occurrenceExceptions,
          rangeStart,
          rangeEnd
        )
      : occurrences;
  return result.filter(
    occurrence =>
      (!filters.status || occurrence.status === filters.status) &&
      (!filters.attendantId ||
        Number(occurrence.attendantId) === Number(filters.attendantId))
  );
};

export const getDashboard = async (
  tenantId: string | number,
  filters: LegacyAny
): Promise<Record<string, unknown>> => {
  const where: LegacyAny = { tenantId };
  if (filters.attendantId) where.attendantId = filters.attendantId;
  if (filters.status) where.status = filters.status;
  applyServiceOrderFinancialFilters(where, filters);
  if (filters.priority) where.priority = filters.priority;
  if (filters.attendanceTypeId)
    where.attendanceTypeId = filters.attendanceTypeId;
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
      {
        model: ServiceOrderItem,
        as: "items",
        include: [{ model: ServiceInventoryItem }]
      }
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
      let orderServiceRevenue = 0;
      let orderProductCost = 0;
      (order.items || []).forEach(item => {
        const quantity = Number(item.quantity || 0);
        const totalPrice = Number(item.totalPrice || 0);
        const productCost =
          Number(item.inventoryItem?.costPrice || 0) * quantity;
        const key = item.description || "sem_descricao";
        acc.totalItemsValue += totalPrice;
        if (item.itemType === "service") {
          acc.serviceItemsValue += totalPrice;
          acc.serviceRevenue += totalPrice;
          orderServiceRevenue += totalPrice;
          acc.servicesByQuantity[key] =
            (acc.servicesByQuantity[key] || 0) + quantity;
          acc.servicesByValue[key] = Number(
            ((acc.servicesByValue[key] || 0) + totalPrice).toFixed(2)
          );
        }
        if (item.itemType === "product") {
          acc.productItemsValue += totalPrice;
          acc.productCost += productCost;
          orderProductCost += productCost;
          acc.productsByQuantity[key] =
            (acc.productsByQuantity[key] || 0) + quantity;
          acc.productsByValue[key] = Number(
            ((acc.productsByValue[key] || 0) + totalPrice).toFixed(2)
          );
          acc.productsByCost[key] = Number(
            ((acc.productsByCost[key] || 0) + productCost).toFixed(2)
          );
        }
      });
      const grossProfit = Number(
        (orderServiceRevenue - orderProductCost).toFixed(2)
      );
      const chargedAmount = Number(order.chargedAmount || 0);
      const paidAmount = Number(order.paidAmount || 0);
      const receivableAmount = Math.max(0, chargedAmount - paidAmount);
      const isPaid = order.financialStatus === "pago";
      const isCanceledFinancial = order.financialStatus === "cancelado";
      const isOverdue =
        !isPaid &&
        !isCanceledFinancial &&
        order.paymentDueDate &&
        new Date(order.paymentDueDate).getTime() < now;
      acc.totalCharged += chargedAmount;
      acc.totalReceived += paidAmount;
      if (!isPaid && !isCanceledFinancial) {
        acc.totalReceivable += receivableAmount;
        acc.grossProfitPending += grossProfit;
      }
      if (isPaid) {
        acc.paidOrders += 1;
        acc.grossProfitPaid += grossProfit;
      }
      if (isOverdue) {
        acc.overdueOrders += 1;
        acc.overdueAmount += receivableAmount;
      }
      acc.ordersProfitability.push({
        id: order.id,
        title: order.title,
        contactName: order.contact?.name || "Sem cliente",
        serviceRevenue: Number(orderServiceRevenue.toFixed(2)),
        productCost: Number(orderProductCost.toFixed(2)),
        grossProfit,
        grossMarginPercent: orderServiceRevenue
          ? Number(((grossProfit / orderServiceRevenue) * 100).toFixed(2))
          : 0
      });
      return acc;
    },
    {
      totalItemsValue: 0,
      serviceItemsValue: 0,
      productItemsValue: 0,
      serviceRevenue: 0,
      productCost: 0,
      totalCharged: 0,
      totalReceivable: 0,
      totalReceived: 0,
      overdueAmount: 0,
      overdueOrders: 0,
      paidOrders: 0,
      grossProfitPaid: 0,
      grossProfitPending: 0,
      servicesByQuantity: {} as Record<string, number>,
      servicesByValue: {} as Record<string, number>,
      productsByQuantity: {} as Record<string, number>,
      productsByValue: {} as Record<string, number>,
      productsByCost: {} as Record<string, number>,
      ordersProfitability: [] as Array<Record<string, unknown>>
    }
  );
  const grossProfit = Number(
    (itemMetrics.serviceRevenue - itemMetrics.productCost).toFixed(2)
  );
  const grossMarginPercent = itemMetrics.serviceRevenue
    ? Number(((grossProfit / itemMetrics.serviceRevenue) * 100).toFixed(2))
    : 0;

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
    byFinancialStatus: grouped("financialStatus"),
    byPriority: grouped("priority"),
    byServiceType: grouped("serviceType"),
    byAttendant,
    visitsByDay,
    totalItemsValue: Number(itemMetrics.totalItemsValue.toFixed(2)),
    serviceItemsValue: Number(itemMetrics.serviceItemsValue.toFixed(2)),
    productItemsValue: Number(itemMetrics.productItemsValue.toFixed(2)),
    serviceRevenue: Number(itemMetrics.serviceRevenue.toFixed(2)),
    productCost: Number(itemMetrics.productCost.toFixed(2)),
    grossProfit,
    grossMarginPercent,
    totalCharged: Number(itemMetrics.totalCharged.toFixed(2)),
    totalReceivable: Number(itemMetrics.totalReceivable.toFixed(2)),
    totalReceived: Number(itemMetrics.totalReceived.toFixed(2)),
    overdueAmount: Number(itemMetrics.overdueAmount.toFixed(2)),
    overdueOrders: itemMetrics.overdueOrders,
    paidOrders: itemMetrics.paidOrders,
    grossProfitPaid: Number(itemMetrics.grossProfitPaid.toFixed(2)),
    grossProfitPending: Number(itemMetrics.grossProfitPending.toFixed(2)),
    servicesByQuantity: itemMetrics.servicesByQuantity,
    servicesByValue: itemMetrics.servicesByValue,
    productsByQuantity: itemMetrics.productsByQuantity,
    productsByValue: itemMetrics.productsByValue,
    productsByCost: itemMetrics.productsByCost,
    ordersProfitability: itemMetrics.ordersProfitability
      .sort((a, b) => Number(b.grossProfit || 0) - Number(a.grossProfit || 0))
      .slice(0, 8)
  };
};

const financialReportDateFields = ["paymentDueDate", "paidAt", "createdAt"];

export const getFinancialReport = async (
  tenantId: string | number,
  filters: LegacyAny
): Promise<Record<string, unknown>> => {
  const where: LegacyAny = { tenantId };
  applyServiceOrderFinancialFilters(where, filters);
  if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;
  if (filters.financialStatus) where.financialStatus = filters.financialStatus;

  const dateField = financialReportDateFields.includes(filters.dateField)
    ? filters.dateField
    : "paymentDueDate";
  if (filters.start && filters.end) {
    where[dateField] = {
      [Op.between]: [new Date(filters.start), new Date(filters.end)]
    };
  }

  const orders = await ServiceOrder.findAll({
    where,
    include: [
      { model: Contact },
      {
        model: ServiceOrderItem,
        as: "items",
        include: [{ model: ServiceInventoryItem }]
      }
    ],
    order: [[dateField, "ASC"]]
  });

  const rows = orders.map(order => {
    let serviceRevenue = 0;
    let productCost = 0;
    (order.items || []).forEach(item => {
      const quantity = Number(item.quantity || 0);
      if (item.itemType === "service") {
        serviceRevenue += Number(item.totalPrice || 0);
      }
      if (item.itemType === "product") {
        productCost += Number(item.inventoryItem?.costPrice || 0) * quantity;
      }
    });
    const chargedAmount = Number(order.chargedAmount || 0);
    const paidAmount = Number(order.paidAmount || 0);
    const openAmount = Math.max(0, chargedAmount - paidAmount);
    const grossProfit = serviceRevenue - productCost;
    return {
      id: order.id,
      title: order.title,
      customerName: order.contact?.name || "Sem cliente",
      financialStatus: order.financialStatus,
      paymentMethod: order.paymentMethod,
      chargedAmount: Number(chargedAmount.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      openAmount: Number(openAmount.toFixed(2)),
      paymentDueDate: order.paymentDueDate,
      paidAt: order.paidAt,
      serviceRevenue: Number(serviceRevenue.toFixed(2)),
      productCost: Number(productCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2))
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalCharged += Number(row.chargedAmount || 0);
      acc.totalReceived += Number(row.paidAmount || 0);
      acc.totalReceivable += Number(row.openAmount || 0);
      acc.serviceRevenue += Number(row.serviceRevenue || 0);
      acc.productCost += Number(row.productCost || 0);
      acc.grossProfit += Number(row.grossProfit || 0);
      if (row.financialStatus === "pago") acc.paidOrders += 1;
      if (row.financialStatus === "parcial") acc.partialOrders += 1;
      if (
        !["pago", "cancelado"].includes(String(row.financialStatus)) &&
        row.paymentDueDate &&
        new Date(row.paymentDueDate).getTime() < Date.now()
      ) {
        acc.overdueOrders += 1;
        acc.overdueAmount += Number(row.openAmount || 0);
      }
      return acc;
    },
    {
      orders: rows.length,
      totalCharged: 0,
      totalReceived: 0,
      totalReceivable: 0,
      serviceRevenue: 0,
      productCost: 0,
      grossProfit: 0,
      paidOrders: 0,
      partialOrders: 0,
      overdueOrders: 0,
      overdueAmount: 0
    }
  );

  Object.keys(summary).forEach(key => {
    if (typeof summary[key] === "number") {
      summary[key] = Number(summary[key].toFixed(2));
    }
  });

  return { summary, rows };
};

const monthRange = (
  month?: string
): { start: Date; end: Date; key: string } => {
  const match = month?.match(/^(\d{4})-(\d{2})$/);
  const now = new Date();
  const year = match ? Number(match[1]) : now.getFullYear();
  const monthIndex = match ? Number(match[2]) - 1 : now.getMonth();
  const start = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  return {
    start,
    end,
    key: `${year}-${String(monthIndex + 1).padStart(2, "0")}`
  };
};

const addMetric = (
  target: Record<string, number>,
  key: string | null | undefined,
  value: number
): void => {
  const safeKey = key || "Sem valor";
  target[safeKey] = Number(((target[safeKey] || 0) + value).toFixed(2));
};

const sortedMetricEntries = (
  values: Record<string, number>,
  limit = 10
): Array<Record<string, unknown>> =>
  Object.entries(values)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => Number(b.value || 0) - Number(a.value || 0))
    .slice(0, limit);

export const getMonthlyFinancialClosing = async (
  tenantId: string | number,
  filters: LegacyAny
): Promise<Record<string, unknown>> => {
  const { start, end, key } = monthRange(filters.month);
  const where: LegacyAny = {
    tenantId,
    [Op.or]: [
      { paidAt: { [Op.between]: [start, end] } },
      { paymentDueDate: { [Op.lte]: end } },
      { createdAt: { [Op.between]: [start, end] } }
    ]
  };
  const orders = await ServiceOrder.findAll({
    where,
    include: [
      { model: ServiceAttendant },
      { model: Contact },
      {
        model: ServiceOrderItem,
        as: "items",
        include: [{ model: ServiceInventoryItem }]
      }
    ],
    order: [["paymentDueDate", "ASC"]]
  });

  const rankings = {
    byAttendant: {} as Record<string, number>,
    byCustomer: {} as Record<string, number>,
    byServiceType: {} as Record<string, number>
  };

  const rows = orders.map(order => {
    let serviceRevenue = 0;
    let productCost = 0;
    (order.items || []).forEach(item => {
      const quantity = Number(item.quantity || 0);
      if (item.itemType === "service") {
        serviceRevenue += Number(item.totalPrice || 0);
      }
      if (item.itemType === "product") {
        productCost += Number(item.inventoryItem?.costPrice || 0) * quantity;
      }
    });
    const chargedAmount = Number(order.chargedAmount || 0);
    const paidAmount = Number(order.paidAmount || 0);
    const openAmount = Math.max(0, chargedAmount - paidAmount);
    const paidInMonth =
      order.paidAt &&
      new Date(order.paidAt).getTime() >= start.getTime() &&
      new Date(order.paidAt).getTime() <= end.getTime();
    const isOpen = !["pago", "cancelado"].includes(order.financialStatus);
    const isOverdue =
      isOpen &&
      order.paymentDueDate &&
      new Date(order.paymentDueDate).getTime() <= end.getTime() &&
      openAmount > 0;
    const grossProfit = serviceRevenue - productCost;
    if (paidInMonth) {
      addMetric(
        rankings.byAttendant,
        order.attendant?.name || "Sem tecnico",
        paidAmount
      );
      addMetric(
        rankings.byCustomer,
        order.contact?.name || "Sem cliente",
        paidAmount
      );
      addMetric(rankings.byServiceType, order.serviceType, paidAmount);
    }
    return {
      id: order.id,
      title: order.title,
      customerName: order.contact?.name || "Sem cliente",
      attendantName: order.attendant?.name || "Sem tecnico",
      serviceType: order.serviceType,
      financialStatus: order.financialStatus,
      chargedAmount: Number(chargedAmount.toFixed(2)),
      paidAmount: Number(paidAmount.toFixed(2)),
      openAmount: Number(openAmount.toFixed(2)),
      paymentDueDate: order.paymentDueDate,
      paidAt: order.paidAt,
      serviceRevenue: Number(serviceRevenue.toFixed(2)),
      productCost: Number(productCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      paidInMonth: Boolean(paidInMonth),
      overdueAtClosing: Boolean(isOverdue)
    };
  });

  const summary = rows.reduce(
    (acc, row) => {
      acc.totalCharged += Number(row.chargedAmount || 0);
      acc.serviceRevenue += Number(row.serviceRevenue || 0);
      acc.productCost += Number(row.productCost || 0);
      if (row.paidInMonth) acc.totalReceived += Number(row.paidAmount || 0);
      if (!["pago", "cancelado"].includes(String(row.financialStatus))) {
        acc.totalOpen += Number(row.openAmount || 0);
      }
      if (row.overdueAtClosing) {
        acc.overdueAmount += Number(row.openAmount || 0);
        acc.overdueOrders += 1;
      }
      return acc;
    },
    {
      orders: rows.length,
      totalCharged: 0,
      totalReceived: 0,
      totalOpen: 0,
      overdueAmount: 0,
      overdueOrders: 0,
      serviceRevenue: 0,
      productCost: 0,
      grossProfit: 0,
      grossMarginPercent: 0
    }
  );
  summary.grossProfit = Number(
    (summary.serviceRevenue - summary.productCost).toFixed(2)
  );
  summary.grossMarginPercent = summary.serviceRevenue
    ? Number(((summary.grossProfit / summary.serviceRevenue) * 100).toFixed(2))
    : 0;
  Object.keys(summary).forEach(field => {
    summary[field] = Number(summary[field].toFixed(2));
  });

  return {
    month: key,
    start,
    end,
    summary,
    rankings: {
      byAttendant: sortedMetricEntries(rankings.byAttendant),
      byCustomer: sortedMetricEntries(rankings.byCustomer),
      byServiceType: sortedMetricEntries(rankings.byServiceType)
    },
    rows
  };
};

export const showOrder = async (
  tenantId: string | number,
  profile: string,
  serviceOrderId: string
): Promise<Record<string, unknown>> =>
  scrubOrder(await loadOrder(tenantId, serviceOrderId), profile);

const buildOrderPayload = async (
  tenantId: string | number,
  userId: string | number,
  data: ServiceOrderData,
  transaction?: Transaction
): Promise<LegacyAny> => {
  const recurrence = normalizeRecurrence(data);
  const attendanceType = await resolveAttendanceType(
    tenantId,
    data,
    transaction
  );
  if (!attendanceType && !cleanText(data.serviceType)) {
    throw new AppError("ERR_ATTENDANCE_TYPE_REQUIRED", 400);
  }
  const payload: LegacyAny = {
    tenantId,
    contactId: data.contactId,
    attendantId: data.attendantId || null,
    createdByUserId: Number(userId),
    title: cleanText(data.title),
    description: cleanText(data.description),
    serviceType: attendanceType?.name || cleanText(data.serviceType),
    attendanceTypeId: attendanceType?.id || null,
    priority: data.priority || "baixa",
    status: data.status || "rascunho",
    financialStatus: data.financialStatus,
    paymentMethod:
      data.paymentMethod === undefined
        ? undefined
        : cleanText(data.paymentMethod),
    chargedAmount:
      data.chargedAmount === undefined
        ? undefined
        : normalizeMoney(data.chargedAmount),
    paidAmount:
      data.paidAmount === undefined
        ? undefined
        : normalizeMoney(data.paidAmount),
    paymentDueDate:
      data.paymentDueDate === undefined
        ? undefined
        : normalizeDate(data.paymentDueDate),
    paidAt: data.paidAt === undefined ? undefined : normalizeDate(data.paidAt),
    financialObservation:
      data.financialObservation === undefined
        ? undefined
        : cleanText(data.financialObservation),
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
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) delete payload[key];
  });
  return payload;
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
    inventoryBatchId:
      item.itemType === "product" ? item.inventoryBatchId || null : null,
    description: cleanText(item.description),
    pestTarget: item.itemType === "product" ? cleanText(item.pestTarget) : null,
    applicationMethod:
      item.itemType === "product" ? cleanText(item.applicationMethod) : null,
    dilutionUsed:
      item.itemType === "product" ? cleanText(item.dilutionUsed) : null,
    technicalObservation:
      item.itemType === "product" ? cleanText(item.technicalObservation) : null,
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
        const inventoryItem = await ensureInventoryItem(
          tenantId,
          item.inventoryItemId,
          transaction
        );
        if (inventoryItem?.lotControlEnabled && !item.inventoryBatchId) {
          throw new AppError("Informe o lote utilizado para este produto");
        }
        await ensureInventoryBatch(
          tenantId,
          item.inventoryItemId,
          item.inventoryBatchId,
          transaction
        );
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
  const batchIds = productItems
    .map(item => item.inventoryBatchId)
    .filter(Boolean) as number[];
  const batches = batchIds.length
    ? await ServiceInventoryBatch.findAll({
        where: {
          tenantId,
          id: { [Op.in]: batchIds }
        },
        transaction,
        lock: transaction.LOCK.UPDATE
      })
    : [];
  const batchById = new Map(batches.map(batch => [batch.id, batch] as const));

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
    const inventoryItem = inventoryById.get(insufficientInventoryItemId);
    throw new AppError(
      `Estoque insuficiente para ${
        inventoryItem?.name || "produto"
      }. Saldo atual: ${Number(inventoryItem?.quantity || 0)}, necessario: ${
        totalsByInventoryItemId[insufficientInventoryItemId]
      }.`,
      409
    );
  }

  const missingRequiredBatch = productItems.find(item => {
    const inventoryItem = inventoryById.get(item.inventoryItemId);
    return inventoryItem?.lotControlEnabled && !item.inventoryBatchId;
  });
  if (missingRequiredBatch) {
    throw new AppError(
      "Informe o lote utilizado para produtos com controle de lote"
    );
  }

  const invalidBatchItem = productItems.find(item => {
    if (!item.inventoryBatchId) return false;
    const batch = batchById.get(item.inventoryBatchId);
    return (
      !batch || Number(batch.inventoryItemId) !== Number(item.inventoryItemId)
    );
  });
  if (invalidBatchItem) {
    throw new AppError("ERR_SERVICE_INVENTORY_BATCH_NOT_FOUND", 404);
  }

  const totalsByBatchId = productItems.reduce<Record<number, number>>(
    (acc, item) => {
      if (!item.inventoryBatchId) return acc;
      return {
        ...acc,
        [item.inventoryBatchId]:
          (acc[item.inventoryBatchId] || 0) + Number(item.quantity || 0)
      };
    },
    {}
  );
  const insufficientBatchId = Object.keys(totalsByBatchId)
    .map(Number)
    .find(batchId => {
      const batch = batchById.get(batchId);
      return Number(batch?.quantity || 0) < totalsByBatchId[batchId];
    });
  if (insufficientBatchId) {
    const batch = batchById.get(insufficientBatchId);
    throw new AppError(
      `Lote insuficiente para consumo. Lote: ${
        batch?.batchNumber || insufficientBatchId
      }. Saldo atual: ${Number(batch?.quantity || 0)}, necessario: ${
        totalsByBatchId[insufficientBatchId]
      }.`,
      409
    );
  }

  const runningQuantities: Record<number, number> = {};
  const runningBatchQuantities: Record<number, number> = {};
  const movements = productItems.map(item => {
    const inventoryItem = inventoryById.get(item.inventoryItemId);
    const batch = item.inventoryBatchId
      ? batchById.get(item.inventoryBatchId)
      : null;
    const quantityToDeduct = Number(item.quantity || 0);
    const previousQuantity =
      runningQuantities[item.inventoryItemId] ??
      Number(inventoryItem?.quantity || 0);
    const newQuantity = previousQuantity - quantityToDeduct;
    runningQuantities[item.inventoryItemId] = newQuantity;

    if (batch) {
      const previousBatchQuantity =
        runningBatchQuantities[batch.id] ?? Number(batch.quantity || 0);
      runningBatchQuantities[batch.id] =
        previousBatchQuantity - quantityToDeduct;
    }

    const unitCost = normalizeMoney(Number(inventoryItem?.costPrice || 0));

    return {
      tenantId,
      inventoryItemId: item.inventoryItemId,
      inventoryBatchId: item.inventoryBatchId || null,
      serviceOrderId,
      serviceOrderItemId: item.id,
      userId: Number(userId),
      movementType: "service_order_deduction",
      quantity: -quantityToDeduct,
      previousQuantity,
      newQuantity,
      observation: `Baixa automatica pela OS #${serviceOrderId}`,
      unitCost,
      totalCost: Number((unitCost * quantityToDeduct).toFixed(2)),
      pestTarget: item.pestTarget || null
    };
  });

  await Promise.all(
    Object.entries(runningQuantities).map(([inventoryItemId, quantity]) =>
      inventoryById
        .get(Number(inventoryItemId))
        ?.update({ quantity }, { transaction })
    )
  );
  await Promise.all(
    Object.entries(runningBatchQuantities).map(([batchId, quantity]) =>
      batchById.get(Number(batchId))?.update({ quantity }, { transaction })
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
      const contact = await ensureCustomer(
        tenantId,
        data.contactId,
        transaction
      );
      const normalizedData = { ...data, contactId: contact.id };
      await ensureAttendant(tenantId, data.attendantId, transaction);
      const payload = await buildOrderPayload(
        tenantId,
        userId,
        normalizedData,
        transaction
      );
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
        normalizedData.items,
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

export const updateOrderOccurrence = async (
  tenantId: string | number,
  userId: string | number,
  serviceOrderId: string,
  data: ServiceOrderOccurrenceData
): Promise<Record<string, unknown>> => {
  const occurrenceStart = normalizeDate(data.occurrenceStart);
  const scheduledStart = normalizeDate(data.scheduledStart);
  const scheduledEnd = normalizeDate(data.scheduledEnd);
  if (!occurrenceStart || !scheduledStart || !scheduledEnd) {
    throw new AppError("ERR_SERVICE_ORDER_OCCURRENCE_INVALID");
  }
  if (scheduledEnd <= scheduledStart) {
    throw new AppError("Horario final deve ser maior que o horario inicial");
  }
  if (!SERVICE_ORDER_STATUSES.includes(data.status)) {
    throw new AppError("Status da ordem invalido");
  }

  const exception = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async transaction => {
      const serviceOrder = await ServiceOrder.findOne({
        where: { id: serviceOrderId, tenantId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!serviceOrder) throw new AppError("ERR_SERVICE_ORDER_NOT_FOUND", 404);
      if (
        !serviceOrder.recurrenceActive ||
        serviceOrder.recurrenceType === "single"
      ) {
        throw new AppError("ERR_SERVICE_ORDER_OCCURRENCE_NOT_RECURRING", 409);
      }
      const validOccurrence = expandServiceOrderOccurrences(
        [serviceOrder.toJSON() as Record<string, unknown>],
        occurrenceStart,
        new Date(occurrenceStart.getTime() + 1)
      ).some(
        occurrence =>
          new Date(String(occurrence.scheduledStart)).getTime() ===
          occurrenceStart.getTime()
      );
      if (!validOccurrence) {
        throw new AppError("ERR_SERVICE_ORDER_OCCURRENCE_NOT_FOUND", 404);
      }

      await ensureAttendant(tenantId, data.attendantId, transaction);
      if (relevantStatuses.includes(data.status)) {
        await ensureNoScheduleConflict(
          tenantId,
          data.attendantId,
          scheduledStart,
          scheduledEnd,
          serviceOrder.id,
          transaction
        );
        const exceptionConflict = data.attendantId
          ? await ServiceOrderOccurrenceException.findOne({
              where: {
                tenantId,
                attendantId: data.attendantId,
                status: { [Op.in]: relevantStatuses },
                scheduledStart: { [Op.lt]: scheduledEnd },
                scheduledEnd: { [Op.gt]: scheduledStart },
                [Op.or]: [
                  { serviceOrderId: { [Op.ne]: serviceOrder.id } },
                  {
                    occurrenceStart: { [Op.ne]: occurrenceStart.toISOString() }
                  }
                ]
              },
              transaction,
              lock: transaction.LOCK.UPDATE
            })
          : null;
        if (exceptionConflict) {
          throw new AppError("ERR_SERVICE_ORDER_SCHEDULE_CONFLICT", 409);
        }
      }

      const existing = await ServiceOrderOccurrenceException.findOne({
        where: { tenantId, serviceOrderId: serviceOrder.id, occurrenceStart },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      const previousValue = existing ? existing.toJSON() : null;
      const payload = {
        tenantId: Number(tenantId),
        serviceOrderId: serviceOrder.id,
        occurrenceStart,
        scheduledStart,
        scheduledEnd,
        attendantId: data.attendantId || null,
        status: data.status,
        createdByUserId: Number(userId)
      };
      const saved = existing
        ? await existing.update(payload, { transaction })
        : await ServiceOrderOccurrenceException.create(payload, {
            transaction
          });
      await logOrder(
        serviceOrder.id,
        userId,
        "occurrence_updated",
        "Ocorrencia recorrente atualizada",
        previousValue,
        payload,
        transaction
      );
      return saved;
    }
  );

  const loadedException = await ServiceOrderOccurrenceException.findOne({
    where: { id: exception.id, tenantId },
    include: [{ model: ServiceAttendant }]
  });
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  if (!loadedException) {
    throw new AppError("ERR_SERVICE_ORDER_OCCURRENCE_NOT_FOUND", 404);
  }
  const baseStart = normalizeDate(serviceOrder.scheduledStart);
  const baseEnd = normalizeDate(serviceOrder.scheduledEnd);
  if (!baseStart || !baseEnd) {
    throw new AppError("ERR_SERVICE_ORDER_OCCURRENCE_INVALID");
  }
  emitServiceOrderEvent(
    tenantId,
    "service_order_occurrence_updated",
    serviceOrder
  );
  return applyOccurrenceException(
    buildOccurrence(
      serviceOrder.toJSON() as Record<string, unknown>,
      occurrenceStart,
      baseStart,
      baseEnd.getTime() - baseStart.getTime()
    ),
    loadedException
  );
};

export const patchOrder = async (
  tenantId: string | number,
  userId: string | number,
  serviceOrderId: string,
  data: ServiceOrderPatchData
): Promise<ServiceOrder> => {
  const expectedUpdatedAt = normalizeDate(data.expectedUpdatedAt);
  if (!expectedUpdatedAt) {
    throw new AppError("ERR_SERVICE_ORDER_VERSION_REQUIRED", 400);
  }

  const updated = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async transaction => {
      const serviceOrder = await ServiceOrder.findOne({
        where: { id: serviceOrderId, tenantId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!serviceOrder) throw new AppError("ERR_SERVICE_ORDER_NOT_FOUND", 404);
      if (serviceOrder.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
        throw new AppError("ERR_SERVICE_ORDER_STALE_VERSION", 409);
      }

      const payload: LegacyAny = {};
      if (data.attendantId !== undefined) {
        await ensureAttendant(tenantId, data.attendantId, transaction);
        payload.attendantId = data.attendantId || null;
      }
      if (data.scheduledStart !== undefined) {
        payload.scheduledStart = normalizeDate(data.scheduledStart);
      }
      if (data.scheduledEnd !== undefined) {
        payload.scheduledEnd = normalizeDate(data.scheduledEnd);
      }
      if (data.status !== undefined) payload.status = data.status;
      if (data.financialStatus !== undefined) {
        payload.financialStatus = data.financialStatus;
      }
      if (data.paymentMethod !== undefined) {
        payload.paymentMethod = cleanText(data.paymentMethod);
      }
      if (data.chargedAmount !== undefined) {
        payload.chargedAmount = normalizeMoney(data.chargedAmount || 0);
      }
      if (data.paidAmount !== undefined) {
        payload.paidAmount = normalizeMoney(data.paidAmount || 0);
      }
      if (data.paymentDueDate !== undefined) {
        payload.paymentDueDate = normalizeDate(data.paymentDueDate);
      }
      if (data.paidAt !== undefined) {
        payload.paidAt = normalizeDate(data.paidAt);
      }
      if (data.financialObservation !== undefined) {
        payload.financialObservation = cleanText(data.financialObservation);
      }

      const nextStatus = payload.status || serviceOrder.status;
      const nextStart =
        payload.scheduledStart !== undefined
          ? payload.scheduledStart
          : serviceOrder.scheduledStart;
      const nextEnd =
        payload.scheduledEnd !== undefined
          ? payload.scheduledEnd
          : serviceOrder.scheduledEnd;
      const nextAttendantId =
        payload.attendantId !== undefined
          ? payload.attendantId
          : serviceOrder.attendantId;
      validateServiceOrderSchedule({
        contactId: serviceOrder.contactId,
        title: serviceOrder.title,
        serviceType: serviceOrder.serviceType,
        status: nextStatus,
        scheduledStart: nextStart,
        scheduledEnd: nextEnd,
        recurrenceType: serviceOrder.recurrenceType,
        recurrenceActive: serviceOrder.recurrenceActive,
        recurrenceDayOfMonth: serviceOrder.recurrenceDayOfMonth,
        recurrenceIntervalDays: serviceOrder.recurrenceIntervalDays
      });
      await ensureNoScheduleConflict(
        tenantId,
        nextAttendantId,
        nextStart,
        nextEnd,
        serviceOrder.id,
        transaction
      );

      const oldValue = Object.keys(payload).reduce(
        (values, field) => ({ ...values, [field]: serviceOrder.get(field) }),
        {} as Record<string, unknown>
      );
      if (nextStatus === "concluida" && !serviceOrder.completedAt) {
        payload.completedAt = new Date();
      }
      if (nextStatus === "cancelada" && !serviceOrder.canceledAt) {
        payload.canceledAt = new Date();
      }
      await serviceOrder.update(payload, { transaction });
      if (nextStatus === "concluida" && !serviceOrder.inventoryDeductedAt) {
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
        "patched",
        "Ordem de servico atualizada parcialmente",
        oldValue,
        payload,
        transaction
      );
      return serviceOrder;
    }
  );

  const loaded = await loadOrder(tenantId, updated.id);
  emitServiceOrderEvent(tenantId, "service_order_updated", loaded);
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
      const contact = await ensureCustomer(
        tenantId,
        data.contactId,
        transaction
      );
      const normalizedData = { ...data, contactId: contact.id };
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
      const payload = await buildOrderPayload(
        tenantId,
        userId,
        normalizedData,
        transaction
      );
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
        normalizedData.items,
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
          )} = ${escapePublicText(formatCurrency(item.totalPrice))}${
            productTechnicalDetails(item)
              ? `<br><small>${escapePublicText(
                  productTechnicalDetails(item)
                )}</small>`
              : ""
          }</li>`
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
    const doc = new PDFDocument({ margin: 30, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", chunk => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const margin = 30;
    const contentWidth = doc.page.width - margin * 2;
    const primary = "#1f4e79";
    const border = "#d8dee9";
    const light = "#f5f7fb";
    const text = "#1f2937";
    const muted = "#667085";

    const items = serviceOrder.items || [];
    const itemsTotal = items.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );
    const title = includeInternalObservation
      ? "Ordem de Servico Interna"
      : "Ordem de Servico";
    const address = [
      serviceOrder.address,
      serviceOrder.addressComplement,
      serviceOrder.city && serviceOrder.state
        ? `${serviceOrder.city}/${serviceOrder.state}`
        : serviceOrder.city || serviceOrder.state,
      serviceOrder.zipCode
    ]
      .filter(Boolean)
      .join(" - ");

    const writeText = (
      value: string,
      x: number,
      y: number,
      width: number,
      height: number,
      options: PDFKit.Mixins.TextOptions = {}
    ): void => {
      doc.text(value || "-", x, y, {
        width,
        height,
        ellipsis: true,
        lineBreak: false,
        ...options
      });
    };

    const sectionTitle = (label: string, y: number): void => {
      doc
        .fontSize(8.5)
        .fillColor(primary)
        .text(label.toUpperCase(), margin, y, {
          width: contentWidth,
          height: 10,
          lineBreak: false
        });
      doc
        .strokeColor(primary)
        .lineWidth(0.8)
        .moveTo(margin, y + 13)
        .lineTo(doc.page.width - margin, y + 13)
        .stroke();
    };

    const labelValue = (
      label: string,
      value: string | number | null | undefined,
      x: number,
      y: number,
      width: number
    ): void => {
      doc.fontSize(6.7).fillColor(muted);
      writeText(label.toUpperCase(), x, y, width, 8);
      doc.fontSize(8.2).fillColor(text);
      writeText(String(value || "-"), x, y + 9, width, 10);
    };

    const box = (x: number, y: number, width: number, height: number): void => {
      doc.roundedRect(x, y, width, height, 4).stroke(border);
    };

    const paragraphBox = (
      label: string,
      value: string | null | undefined,
      y: number,
      height: number
    ): void => {
      box(margin, y, contentWidth, height);
      doc.fontSize(6.8).fillColor(muted);
      writeText(label.toUpperCase(), margin + 9, y + 7, contentWidth - 18, 8);
      doc.fontSize(8.2).fillColor(text);
      writeText(
        value || "-",
        margin + 9,
        y + 18,
        contentWidth - 18,
        height - 24,
        {
          lineBreak: true
        }
      );
    };

    doc.rect(0, 0, doc.page.width, 70).fill(primary);
    doc.fillColor("#ffffff").fontSize(15);
    writeText(tenantName, margin, 17, contentWidth * 0.6, 18);
    doc.fontSize(8);
    writeText(
      "Sistema de ordens de servico",
      margin,
      39,
      contentWidth * 0.6,
      10
    );
    doc.fontSize(13);
    writeText(title, margin + contentWidth * 0.6, 15, contentWidth * 0.4, 16, {
      align: "right"
    });
    doc.fontSize(10);
    writeText(
      `#${serviceOrder.id}`,
      margin + contentWidth * 0.6,
      35,
      contentWidth * 0.4,
      12,
      {
        align: "right"
      }
    );
    doc.fontSize(8);
    writeText(
      `Status: ${serviceOrder.status || "-"}`,
      margin,
      53,
      contentWidth,
      10,
      {
        align: "right"
      }
    );

    sectionTitle("Dados da ordem", 83);
    doc.roundedRect(margin, 102, contentWidth, 58, 4).fill(light);
    const half = contentWidth / 2;
    labelValue(
      "Cliente",
      serviceOrder.contact?.name,
      margin + 10,
      110,
      half - 20
    );
    labelValue(
      "Contato",
      serviceOrder.contact?.number || serviceOrder.contact?.email,
      margin + half + 10,
      110,
      half - 20
    );
    labelValue(
      "Tecnico",
      serviceOrder.attendant?.name || "Sem tecnico",
      margin + 10,
      127,
      half - 20
    );
    labelValue(
      "Tipo de servico",
      serviceOrder.serviceType,
      margin + half + 10,
      127,
      half - 20
    );
    labelValue(
      "Inicio",
      formatDateTime(serviceOrder.scheduledStart),
      margin + 10,
      144,
      half - 20
    );
    labelValue(
      "Fim",
      formatDateTime(serviceOrder.scheduledEnd),
      margin + half + 10,
      144,
      half - 20
    );

    sectionTitle("Endereco do atendimento", 172);
    paragraphBox("Endereco", address || "Endereco nao informado", 191, 34);

    sectionTitle("Descricao do servico", 236);
    paragraphBox("Descricao", serviceOrder.description, 255, 44);

    sectionTitle("Servicos e produtos", 310);
    const tableTop = 329;
    doc.rect(margin, tableTop, contentWidth, 18).fill(primary);
    doc.fillColor("#ffffff").fontSize(7.2);
    writeText("Tipo", margin + 7, tableTop + 5, 52, 8);
    writeText("Descricao", margin + 62, tableTop + 5, 230, 8);
    writeText("Qtd.", margin + 305, tableTop + 5, 34, 8, { align: "right" });
    writeText("Valor unit.", margin + 350, tableTop + 5, 76, 8, {
      align: "right"
    });
    writeText("Total", margin + 436, tableTop + 5, contentWidth - 444, 8, {
      align: "right"
    });

    const maxRows = includeInternalObservation ? 7 : 9;
    const rowHeight = 18;
    items.slice(0, maxRows).forEach((item, index) => {
      const y = tableTop + 18 + index * rowHeight;
      doc
        .rect(margin, y, contentWidth, rowHeight)
        .fill(index % 2 ? light : "#ffffff");
      doc.fillColor(text).fontSize(7.5);
      writeText(
        item.itemType === "service" ? "Servico" : "Produto",
        margin + 7,
        y + 5,
        52,
        8
      );
      const description = [item.description, productTechnicalDetails(item)]
        .filter(Boolean)
        .join(" - ");
      writeText(description || "-", margin + 62, y + 5, 230, 8);
      writeText(String(item.quantity || 0), margin + 305, y + 5, 34, 8, {
        align: "right"
      });
      writeText(formatCurrency(item.unitPrice), margin + 350, y + 5, 76, 8, {
        align: "right"
      });
      writeText(
        formatCurrency(item.totalPrice),
        margin + 436,
        y + 5,
        contentWidth - 444,
        8,
        {
          align: "right"
        }
      );
    });

    const omittedItems = Math.max(0, items.length - maxRows);
    if (!items.length || omittedItems > 0) {
      const y = tableTop + 18 + Math.min(items.length, maxRows) * rowHeight;
      doc.fillColor(muted).fontSize(7.5);
      writeText(
        items.length
          ? `Mais ${omittedItems} item(ns) constam nesta OS. Consulte o sistema para a lista completa.`
          : "Nenhum servico ou produto informado.",
        margin + 7,
        y + 5,
        contentWidth - 14,
        9
      );
    }

    const totalY = tableTop + 18 + maxRows * rowHeight + 8;
    doc.rect(margin, totalY, contentWidth, 24).fill("#eef4fb");
    doc.fillColor(primary).fontSize(9.5);
    writeText("Total geral", margin + 300, totalY + 7, 126, 10, {
      align: "right"
    });
    doc.fontSize(10.5);
    writeText(
      formatCurrency(itemsTotal),
      margin + 436,
      totalY + 7,
      contentWidth - 444,
      10,
      {
        align: "right"
      }
    );

    const notesY = includeInternalObservation ? 525 : 548;
    sectionTitle("Observacoes", notesY);
    paragraphBox(
      "Observacao para o cliente",
      serviceOrder.publicObservation,
      notesY + 19,
      48
    );

    if (includeInternalObservation) {
      paragraphBox(
        "Observacao interna",
        serviceOrder.internalObservation,
        592,
        44
      );
      sectionTitle("Dados internos", 646);
      doc.roundedRect(margin, 665, contentWidth, 52, 4).fill(light);
      labelValue(
        "Prioridade",
        serviceOrder.priority,
        margin + 10,
        672,
        half - 20
      );
      labelValue(
        "Criado por",
        serviceOrder.createdBy?.name,
        margin + half + 10,
        672,
        half - 20
      );
      labelValue(
        "Forma pagamento",
        serviceOrder.paymentMethod,
        margin + 10,
        690,
        half - 20
      );
      labelValue(
        "Valor pago",
        formatCurrency(serviceOrder.paidAmount),
        margin + half + 10,
        690,
        half - 20
      );
    } else {
      const signatureY = 680;
      doc
        .strokeColor("#111827")
        .lineWidth(0.8)
        .moveTo(margin + 70, signatureY)
        .lineTo(doc.page.width - margin - 70, signatureY)
        .stroke();
      doc.fontSize(8).fillColor(muted);
      writeText(
        "Assinatura do cliente",
        margin,
        signatureY + 8,
        contentWidth,
        10,
        {
          align: "center"
        }
      );
    }

    const footerY = doc.page.height - 48;
    doc
      .strokeColor(border)
      .lineWidth(0.5)
      .moveTo(margin, footerY)
      .lineTo(doc.page.width - margin, footerY)
      .stroke();
    doc.fontSize(7).fillColor(muted);
    writeText(
      `Documento gerado em ${formatDateTime(new Date())}`,
      margin,
      footerY + 10,
      contentWidth / 2,
      9
    );
    writeText(
      `OS #${serviceOrder.id}`,
      margin + contentWidth / 2,
      footerY + 10,
      contentWidth / 2,
      9,
      {
        align: "right"
      }
    );
    doc.end();
  });
}

export async function generatePublicDocument(
  tenantId: string | number,
  serviceOrderId: string
): Promise<Buffer> {
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  const tenant = await Tenant.findByPk(tenantId);
  return buildServiceOrderPdf({
    tenantName: tenant?.name || "Empresa",
    serviceOrder,
    includeInternalObservation: false
  });
}

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
  const emailPdfFactory = data.channels.includes("email")
    ? () => generatePublicDocument(tenantId, serviceOrderId)
    : undefined;
  const { sent, failed } = await sendServiceOrderMessage(
    tenantId,
    userId,
    serviceOrder,
    data.channels,
    message,
    `Ordem de Servico #${serviceOrder.id}`,
    "service_order_notification",
    emailPdfFactory
  );

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

export const sendBillingReminder = async (
  tenantId: string | number,
  serviceOrderId: string,
  userId: string | number,
  data: ServiceOrderBillingReminderData
): Promise<Record<string, unknown>> => {
  const serviceOrder = await loadOrder(tenantId, serviceOrderId);
  if (["pago", "cancelado"].includes(serviceOrder.financialStatus)) {
    throw new AppError("ERR_SERVICE_ORDER_BILLING_NOT_OPEN", 400);
  }
  const chargedAmount = Number(serviceOrder.chargedAmount || 0);
  const paidAmount = Number(serviceOrder.paidAmount || 0);
  if (Math.max(0, chargedAmount - paidAmount) <= 0) {
    throw new AppError("ERR_SERVICE_ORDER_BILLING_NOT_OPEN", 400);
  }

  const message = buildBillingReminderMessage(
    serviceOrder,
    cleanText(data.message)
  );
  const { sent, failed } = await sendServiceOrderMessage(
    tenantId,
    userId,
    serviceOrder,
    data.channels,
    message,
    `Lembrete de pagamento OS #${serviceOrder.id}`,
    "service_order_billing_reminder"
  );

  await logOrder(
    serviceOrder.id,
    userId,
    "billing_reminder_sent",
    "Lembrete de cobranca da ordem de servico processado",
    null,
    { channels: data.channels, sent, failed }
  );

  return { sent, failed, message };
};
