import { Request, Response } from "express";
import { Op } from "sequelize";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { STOCK_MANAGER_PROFILES } from "../helpers/UserSecurity";
import AuditLog from "../models/AuditLog";
import createAuditLog, { listAuditLogs } from "../services/AuditLogService";
import * as ServiceOrder from "../services/ServiceOrderServices/ServiceOrderService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const attendantSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  email: nullableString.email(),
  phone: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  specialty: nullableString,
  active: Yup.boolean(),
  workingHours: Yup.mixed().nullable()
});

const inventoryItemSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  sku: nullableString,
  activeIngredient: nullableString,
  chemicalGroup: nullableString,
  healthRegistration: nullableString,
  manufacturer: nullableString,
  productCategory: Yup.string()
    .oneOf([
      "inseticida",
      "raticida",
      "cupinicida",
      "desinfetante",
      "repelente",
      "larvicida",
      "outro"
    ])
    .default("outro"),
  description: nullableString,
  unit: Yup.string()
    .trim()
    .oneOf(["ml", "litro", "grama", "kg", "unidade", "litros"])
    .default("unidade"),
  quantity: Yup.number().integer().min(0).default(0),
  minQuantity: Yup.number().integer().min(0).default(0),
  costPrice: Yup.number().min(0).nullable(),
  salePrice: Yup.number().min(0).nullable(),
  internalCode: nullableString,
  barcode: nullableString,
  lotControlEnabled: Yup.boolean(),
  showLotOnOrder: Yup.boolean(),
  showLotExpirationOnOrder: Yup.boolean(),
  diluentTypes: Yup.array().of(
    Yup.string().oneOf([
      "agua",
      "oleo_mineral",
      "iso_parafina",
      "pronto_uso",
      "outro"
    ])
  ),
  applicationMethods: Yup.array().of(
    Yup.string().oneOf([
      "pulverizacao",
      "termonebulizacao",
      "atomizacao",
      "iscagem",
      "polvilhamento",
      "gel",
      "espuma",
      "outro"
    ])
  ),
  showApplicationMethodOnOrder: Yup.boolean(),
  printSettings: Yup.object().nullable(),
  batches: Yup.array().of(
    Yup.object().shape({
      batchNumber: Yup.string().trim().required(),
      manufacturingDate: Yup.date().nullable(),
      expirationDate: Yup.date().nullable(),
      quantity: Yup.number().integer().min(0).default(0),
      supplier: nullableString,
      observation: nullableString
    })
  ),
  pestRecommendations: Yup.array().of(
    Yup.object().shape({
      pestId: Yup.number().integer().positive().required(),
      productQuantity: Yup.number().min(0).nullable(),
      diluentQuantity: Yup.number().min(0).nullable(),
      unit: nullableString,
      actionTime: nullableString,
      technicalObservation: nullableString
    })
  ),
  pestIds: Yup.array().of(Yup.number().integer().positive()),
  active: Yup.boolean()
});

const inventoryAdjustmentSchema = Yup.object().shape({
  movementType: Yup.string().oneOf(["entry", "exit", "set"]).required(),
  quantity: Yup.number().integer().min(0).required(),
  observation: nullableString
});

const serviceTypeSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  code: nullableString,
  description: nullableString,
  technicalDescription: nullableString,
  defaultPrice: Yup.number().min(0).nullable(),
  categories: Yup.array().of(Yup.string().trim()),
  pests: Yup.array().of(
    Yup.object().shape({
      pestId: Yup.number().integer().positive().required()
    })
  ),
  environments: Yup.array().of(Yup.string().trim()),
  methods: Yup.array().of(Yup.string().trim()),
  products: Yup.array().of(
    Yup.object().shape({
      inventoryItemId: Yup.number().integer().positive().required(),
      averageConsumption: Yup.number().min(0).nullable()
    })
  ),
  warranty: Yup.object()
    .shape({
      hasWarranty: Yup.boolean(),
      quantity: Yup.number().integer().min(0).nullable(),
      unit: nullableString,
      observation: nullableString,
      rules: nullableString
    })
    .nullable(),
  averageExecutionTime: nullableString,
  recommendedTechnicians: Yup.number().integer().min(1).nullable(),
  needsReturn: Yup.boolean(),
  returnQuantity: Yup.number().integer().min(0).nullable(),
  returnInterval: nullableString,
  orderDefaultText: nullableString,
  customerRecommendations: nullableString,
  internalObservation: nullableString,
  active: Yup.boolean()
});

const pestSchema = Yup.object().shape({
  commonName: Yup.string().trim().required().min(2),
  scientificName: Yup.string().trim().required().min(2)
});

const orderItemSchema = Yup.object().shape({
  itemType: Yup.string().oneOf(["service", "product"]).required(),
  serviceTypeId: Yup.number().integer().positive().nullable(),
  inventoryItemId: Yup.number().integer().positive().nullable(),
  inventoryBatchId: Yup.number().integer().positive().nullable(),
  description: Yup.string().trim().required().min(2),
  quantity: Yup.number().integer().min(1).required(),
  unitPrice: Yup.number().min(0).required(),
  pestTarget: nullableString,
  applicationMethod: nullableString,
  dilutionUsed: nullableString,
  technicalObservation: nullableString
});

const orderSchema = Yup.object().shape({
  contactId: Yup.number().integer().positive().required(),
  attendantId: Yup.number().integer().positive().nullable(),
  title: Yup.string().trim().required().min(2),
  description: nullableString,
  serviceType: Yup.string().trim().required(),
  priority: Yup.string().oneOf(ServiceOrder.SERVICE_ORDER_PRIORITIES),
  status: Yup.string().oneOf(ServiceOrder.SERVICE_ORDER_STATUSES),
  financialStatus: Yup.string().oneOf(
    ServiceOrder.SERVICE_ORDER_FINANCIAL_STATUSES
  ),
  paymentMethod: nullableString.oneOf([
    ...ServiceOrder.SERVICE_ORDER_PAYMENT_METHODS,
    null
  ]),
  chargedAmount: Yup.number().min(0).nullable(),
  paidAmount: Yup.number().min(0).nullable(),
  paymentDueDate: Yup.date().nullable(),
  paidAt: Yup.date().nullable(),
  financialObservation: nullableString,
  recurrenceType: Yup.string().oneOf(
    ServiceOrder.SERVICE_ORDER_RECURRENCE_TYPES
  ),
  recurrenceActive: Yup.boolean(),
  recurrenceDayOfMonth: Yup.number().integer().min(1).max(31).nullable(),
  recurrenceIntervalDays: Yup.number().integer().min(1).max(365).nullable(),
  scheduledStart: Yup.date().nullable(),
  scheduledEnd: Yup.date().nullable(),
  address: nullableString,
  addressComplement: nullableString,
  city: nullableString,
  state: nullableString.length(2),
  zipCode: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  publicObservation: nullableString,
  internalObservation: nullableString,
  customerSignatureUrl: nullableString,
  attachmentUrls: Yup.array().of(Yup.string().url()).default([]),
  cancelReason: nullableString,
  items: Yup.array().of(orderItemSchema).default([])
});

const notificationSchema = Yup.object().shape({
  channels: Yup.array()
    .of(Yup.string().oneOf(["internal", "email", "whatsapp"]))
    .min(1)
    .required(),
  message: nullableString
});

const billingReminderSchema = notificationSchema.shape({
  force: Yup.boolean()
});

const validate = async <T>(schema: Yup.ObjectSchema, data: LegacyAny) => {
  try {
    return (await schema.validate(data, { stripUnknown: true })) as T;
  } catch (error) {
    throw new AppError(error.message);
  }
};

const ensureCanManageStock = (profile: string): void => {
  if (!STOCK_MANAGER_PROFILES.includes(profile)) {
    throw new AppError("ERR_STOCK_PERMISSION_DENIED", 403);
  }
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message || "unknown");
  }
  return "unknown";
};

const auditStockAction = async (
  req: Request,
  action: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
): Promise<void> =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "service_inventory",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

const auditServiceTypeAction = async (
  req: Request,
  action: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
): Promise<void> =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "service_type",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

const technicalInventoryFields = [
  "name",
  "sku",
  "activeIngredient",
  "chemicalGroup",
  "healthRegistration",
  "manufacturer",
  "productCategory",
  "unit",
  "costPrice",
  "salePrice",
  "internalCode",
  "barcode",
  "lotControlEnabled",
  "showLotOnOrder",
  "showLotExpirationOnOrder",
  "diluentTypes",
  "applicationMethods",
  "showApplicationMethodOnOrder",
  "printSettings"
];

const inventoryChanges = (
  before: Record<string, unknown> | null,
  after: Record<string, unknown>,
  payload: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> =>
  technicalInventoryFields.reduce((acc, field) => {
    if (!(field in payload)) return acc;
    const oldValue = before?.[field] ?? null;
    const newValue = after[field] ?? null;
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      acc[field] = { before: oldValue, after: newValue };
    }
    return acc;
  }, {} as Record<string, { before: unknown; after: unknown }>);

const auditFinancialAction = async (
  req: Request,
  action: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
): Promise<void> =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "service_order_financial",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

const financialAuditFields = [
  "financialStatus",
  "paymentMethod",
  "chargedAmount",
  "paidAmount",
  "paymentDueDate",
  "paidAt",
  "financialObservation"
];

const comparableFinancialValue = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return value.toFixed(2);
  if (typeof value === "string" && !Number.isNaN(Number(value))) {
    return Number(value).toFixed(2);
  }
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return String(value);
};

const financialChanges = (
  before: LegacyAny,
  after: LegacyAny,
  payload: LegacyAny
): Record<string, { before: string | null; after: string | null }> =>
  financialAuditFields.reduce((acc, field) => {
    if (!(field in payload)) return acc;
    const oldValue = comparableFinancialValue(before[field]);
    const newValue = comparableFinancialValue(after[field]);
    if (oldValue !== newValue) {
      acc[field] = { before: oldValue, after: newValue };
    }
    return acc;
  }, {} as Record<string, { before: string | null; after: string | null }>);

const escapeCsvValue = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  const text = value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replace(/"/g, '""')}"`;
};

const buildFinancialReportCsv = (rows: LegacyAny[]): string => {
  const columns = [
    ["id", "OS"],
    ["customerName", "Cliente"],
    ["title", "Servico"],
    ["financialStatus", "Status financeiro"],
    ["paymentMethod", "Forma pagamento"],
    ["chargedAmount", "Cobrado"],
    ["paidAmount", "Pago"],
    ["openAmount", "Aberto"],
    ["paymentDueDate", "Vencimento"],
    ["paidAt", "Pago em"],
    ["serviceRevenue", "Receita servicos"],
    ["productCost", "Custo produtos"],
    ["grossProfit", "Lucro bruto"]
  ];
  return [
    columns.map(([, label]) => escapeCsvValue(label)).join(","),
    ...rows.map(row =>
      columns.map(([field]) => escapeCsvValue(row[field])).join(",")
    )
  ].join("\n");
};

const buildMonthlyClosingCsv = (rows: LegacyAny[]): string => {
  const columns = [
    ["id", "OS"],
    ["customerName", "Cliente"],
    ["attendantName", "Tecnico"],
    ["title", "Servico"],
    ["serviceType", "Tipo servico"],
    ["financialStatus", "Status financeiro"],
    ["chargedAmount", "Cobrado"],
    ["paidAmount", "Pago"],
    ["openAmount", "Aberto"],
    ["paymentDueDate", "Vencimento"],
    ["paidAt", "Pago em"],
    ["serviceRevenue", "Receita servicos"],
    ["productCost", "Custo produtos"],
    ["grossProfit", "Lucro bruto"],
    ["paidInMonth", "Recebido no mes"],
    ["overdueAtClosing", "Vencido no fechamento"]
  ];
  return [
    columns.map(([, label]) => escapeCsvValue(label)).join(","),
    ...rows.map(row =>
      columns.map(([field]) => escapeCsvValue(row[field])).join(",")
    )
  ].join("\n");
};

const auditBillingReminderAction = async (
  req: Request,
  action: string,
  resourceId?: string | number | null,
  metadata?: Record<string, unknown>
): Promise<void> =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "service_order_billing_reminder",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

const startOfCurrentDay = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const listAttendants = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listAttendants(req.user.tenantId));

export const createAttendant = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await ServiceOrder.createAttendant(
        req.user.tenantId,
        await validate<ServiceOrder.ServiceAttendantData>(
          attendantSchema,
          req.body
        )
      )
    );

export const updateAttendant = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.updateAttendant(
      req.user.tenantId,
      req.params.attendantId,
      await validate<ServiceOrder.ServiceAttendantData>(
        attendantSchema,
        req.body
      )
    )
  );

export const listInventoryItems = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listInventoryItems(req.user.tenantId));

export const listLowStockInventoryItems = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listLowStockInventoryItems(req.user.tenantId));

export const listInventoryMovements = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listInventoryMovements(req.user.tenantId));

export const inventoryConsumptionReport = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.getInventoryConsumptionReport(
      req.user.tenantId,
      req.query
    )
  );

export const inventoryBatchReport = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.getInventoryBatchReport(req.user.tenantId));

export const inventoryCostReport = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.getInventoryCostReport(req.user.tenantId, req.query)
  );

export const listInventoryAuditLogs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  return res.json(
    await listAuditLogs({
      tenantId: req.user.tenantId,
      resource: "service_inventory",
      limit: Number(req.query.limit) || 100
    })
  );
};

export const listFinancialAuditLogs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  return res.json(
    await listAuditLogs({
      tenantId: req.user.tenantId,
      resources: ["service_order_financial", "service_order_billing_reminder"],
      limit: Number(req.query.limit) || 100
    })
  );
};

export const listServiceTypeAuditLogs = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  return res.json(
    await listAuditLogs({
      tenantId: req.user.tenantId,
      resource: "service_type",
      limit: Number(req.query.limit) || 100
    })
  );
};

export const createInventoryItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  const data = await validate<ServiceOrder.ServiceInventoryItemData>(
    inventoryItemSchema,
    req.body
  );
  const item = await ServiceOrder.createInventoryItem(req.user.tenantId, data);
  await auditStockAction(req, "service_inventory_created", item.id, {
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    active: item.active
  });
  return res.status(201).json(item);
};

export const updateInventoryItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  const data = await validate<ServiceOrder.ServiceInventoryItemData>(
    inventoryItemSchema,
    req.body
  );
  const before = await ServiceOrder.getInventoryItem(
    req.user.tenantId,
    req.params.itemId
  );
  const item = await ServiceOrder.updateInventoryItem(
    req.user.tenantId,
    req.params.itemId,
    data
  );
  const changes = inventoryChanges(
    before ? (before.toJSON() as Record<string, unknown>) : null,
    item.toJSON() as Record<string, unknown>,
    data as unknown as Record<string, unknown>
  );
  await auditStockAction(req, "service_inventory_updated", item.id, {
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    active: item.active,
    changedCostPrice: data.costPrice !== undefined,
    changedSalePrice: data.salePrice !== undefined,
    changedFields: Object.keys(changes),
    changes,
    batches: {
      before: before?.batches?.length || 0,
      after: item.batches?.length || 0
    },
    pestRecommendations: {
      before: before?.pestRecommendations?.length || 0,
      after: item.pestRecommendations?.length || 0
    }
  });
  return res.json(item);
};

export const deleteInventoryItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  await ServiceOrder.deleteInventoryItem(req.user.tenantId, req.params.itemId);
  await auditStockAction(req, "service_inventory_deleted", req.params.itemId);
  return res.status(204).send();
};

export const adjustInventoryItem = async (
  req: Request,
  res: Response
): Promise<Response> => {
  ensureCanManageStock(req.user.profile);
  const data = await validate<ServiceOrder.ServiceInventoryAdjustmentData>(
    inventoryAdjustmentSchema,
    req.body
  );
  try {
    const item = await ServiceOrder.adjustInventoryItem(
      req.user.tenantId,
      req.params.itemId,
      req.user.id,
      data
    );
    await auditStockAction(req, "service_inventory_adjusted", item.id, {
      movementType: data.movementType,
      quantity: data.quantity,
      newQuantity: item.quantity,
      hasObservation: Boolean(data.observation)
    });
    return res.json(item);
  } catch (error) {
    await auditStockAction(
      req,
      "service_inventory_adjust_failed",
      req.params.itemId,
      {
        movementType: data.movementType,
        quantity: data.quantity,
        reason: getErrorMessage(error)
      }
    );
    throw error;
  }
};

export const listPests = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listPests(req.user.tenantId, req.query));

export const createPest = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await ServiceOrder.createPest(
        req.user.tenantId,
        await validate<ServiceOrder.PestData>(pestSchema, req.body)
      )
    );

export const updatePest = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.updatePest(
      req.user.tenantId,
      req.params.pestId,
      await validate<ServiceOrder.PestData>(pestSchema, req.body)
    )
  );

export const deletePest = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await ServiceOrder.deletePest(req.user.tenantId, req.params.pestId);
  return res.status(204).send();
};

export const listServiceTypes = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listServiceTypes(req.user.tenantId, req.query));

export const createServiceType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await validate<ServiceOrder.ServiceTypeData>(
    serviceTypeSchema,
    req.body
  );
  const serviceType = await ServiceOrder.createServiceType(
    req.user.tenantId,
    data
  );
  await auditServiceTypeAction(req, "service_type_created", serviceType.id, {
    name: serviceType.name,
    code: serviceType.code
  });
  return res.status(201).json(serviceType);
};

export const updateServiceType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await validate<ServiceOrder.ServiceTypeData>(
    serviceTypeSchema,
    req.body
  );
  const serviceType = await ServiceOrder.updateServiceType(
    req.user.tenantId,
    req.params.serviceTypeId,
    data
  );
  await auditServiceTypeAction(req, "service_type_updated", serviceType.id, {
    name: serviceType.name,
    code: serviceType.code
  });
  return res.json(serviceType);
};

export const deleteServiceType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await ServiceOrder.deleteServiceType(
    req.user.tenantId,
    req.params.serviceTypeId
  );
  await auditServiceTypeAction(
    req,
    "service_type_deleted",
    req.params.serviceTypeId
  );
  return res.status(204).send();
};

export const duplicateServiceType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const serviceType = await ServiceOrder.duplicateServiceType(
    req.user.tenantId,
    req.params.serviceTypeId
  );
  await auditServiceTypeAction(req, "service_type_duplicated", serviceType.id, {
    sourceId: req.params.serviceTypeId,
    name: serviceType.name,
    code: serviceType.code
  });
  return res.status(201).json(serviceType);
};

export const listOrders = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.listOrders(
      req.user.tenantId,
      req.user.profile,
      req.query
    )
  );

export const dashboard = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.getDashboard(req.user.tenantId, req.query));

export const financialReport = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const report = await ServiceOrder.getFinancialReport(
    req.user.tenantId,
    req.query
  );
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=relatorio-financeiro-os.csv"
    );
    return res.send(buildFinancialReportCsv(report.rows as LegacyAny[]));
  }
  return res.json(report);
};

export const monthlyFinancialClosing = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const report = await ServiceOrder.getMonthlyFinancialClosing(
    req.user.tenantId,
    req.query
  );
  if (req.query.format === "csv") {
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=fechamento-financeiro-${report.month}.csv`
    );
    return res.send(buildMonthlyClosingCsv(report.rows as LegacyAny[]));
  }
  return res.json(report);
};

export const billingReminderCandidates = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.listOrders(req.user.tenantId, req.user.profile, {
      ...req.query,
      financialView: req.query.financialView || "overdue"
    })
  );

export const showOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.showOrder(
      req.user.tenantId,
      req.user.profile,
      req.params.serviceOrderId
    )
  );

export const createOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await ServiceOrder.createOrder(
        req.user.tenantId,
        req.user.id,
        await validate<ServiceOrder.ServiceOrderData>(orderSchema, req.body)
      )
    );

export const updateOrder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const previous = await ServiceOrder.showOrder(
      req.user.tenantId,
      req.user.profile,
      req.params.serviceOrderId
    );
    const data = await validate<ServiceOrder.ServiceOrderData>(
      orderSchema,
      req.body
    );
    const serviceOrder = await ServiceOrder.updateOrder(
      req.user.tenantId,
      req.user.id,
      req.user.profile,
      req.params.serviceOrderId,
      data
    );
    const changes = financialChanges(previous, serviceOrder, req.body);
    if (Object.keys(changes).length) {
      await auditFinancialAction(
        req,
        "service_order_financial_updated",
        serviceOrder.id,
        {
          serviceOrderId: serviceOrder.id,
          changedFields: Object.keys(changes),
          changes
        }
      );
    }
    if (req.body.status === "concluida" && serviceOrder.inventoryDeductedAt) {
      await auditStockAction(
        req,
        "service_inventory_auto_deducted",
        serviceOrder.id,
        {
          serviceOrderId: serviceOrder.id,
          productItems: (serviceOrder.items || []).filter(
            item => item.itemType === "product"
          ).length
        }
      );
    }
    return res.json(serviceOrder);
  } catch (error) {
    if (req.body.status === "concluida") {
      await auditStockAction(
        req,
        "service_inventory_auto_deduct_failed",
        req.params.serviceOrderId,
        {
          serviceOrderId: req.params.serviceOrderId,
          reason: getErrorMessage(error)
        }
      );
    }
    throw error;
  }
};

export const publicDocument = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const pdf = await ServiceOrder.generatePublicDocument(
    req.user.tenantId,
    req.params.serviceOrderId
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=ordem-servico-${req.params.serviceOrderId}.pdf`
  );
  return res.send(pdf);
};

export const internalDocument = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const pdf = await ServiceOrder.generateInternalDocument(
    req.user.tenantId,
    req.user.profile,
    req.params.serviceOrderId
  );
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=ordem-servico-interna-${req.params.serviceOrderId}.pdf`
  );
  return res.send(pdf);
};

export const notifyOrder = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.notifyOrder(
      req.user.tenantId,
      req.params.serviceOrderId,
      req.user.id,
      await validate<ServiceOrder.ServiceOrderNotificationData>(
        notificationSchema,
        req.body
      )
    )
  );

export const sendBillingReminder = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const data = await validate<ServiceOrder.ServiceOrderBillingReminderData>(
    billingReminderSchema,
    req.body
  );
  const alreadySentToday = await AuditLog.findOne({
    where: {
      tenantId: req.user.tenantId,
      action: "service_order_billing_reminder_sent",
      resource: "service_order_billing_reminder",
      resourceId: String(req.params.serviceOrderId),
      createdAt: { [Op.gte]: startOfCurrentDay() }
    }
  });
  if (alreadySentToday && !data.force) {
    throw new AppError("ERR_SERVICE_ORDER_BILLING_REMINDER_DUPLICATED", 409);
  }

  const result = await ServiceOrder.sendBillingReminder(
    req.user.tenantId,
    req.params.serviceOrderId,
    req.user.id,
    data
  );
  await auditBillingReminderAction(
    req,
    result.sent && Array.isArray(result.sent) && result.sent.length
      ? "service_order_billing_reminder_sent"
      : "service_order_billing_reminder_failed",
    req.params.serviceOrderId,
    {
      serviceOrderId: req.params.serviceOrderId,
      channels: data.channels,
      sent: result.sent,
      failed: result.failed,
      forced: Boolean(data.force)
    }
  );
  return res.json(result);
};
