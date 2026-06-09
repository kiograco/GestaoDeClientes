import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import { STOCK_MANAGER_PROFILES } from "../helpers/UserSecurity";
import createAuditLog from "../services/AuditLogService";
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
  description: nullableString,
  unit: Yup.string().trim().oneOf(["unidade", "litros"]).default("unidade"),
  quantity: Yup.number().integer().min(0).default(0),
  minQuantity: Yup.number().integer().min(0).default(0),
  costPrice: Yup.number().min(0).nullable(),
  salePrice: Yup.number().min(0).nullable(),
  active: Yup.boolean()
});

const inventoryAdjustmentSchema = Yup.object().shape({
  movementType: Yup.string().oneOf(["entry", "exit", "set"]).required(),
  quantity: Yup.number().integer().min(0).required(),
  observation: nullableString
});

const serviceTypeSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  description: nullableString,
  defaultPrice: Yup.number().min(0).nullable(),
  active: Yup.boolean()
});

const orderItemSchema = Yup.object().shape({
  itemType: Yup.string().oneOf(["service", "product"]).required(),
  serviceTypeId: Yup.number().integer().positive().nullable(),
  inventoryItemId: Yup.number().integer().positive().nullable(),
  description: Yup.string().trim().required().min(2),
  quantity: Yup.number().integer().min(1).required(),
  unitPrice: Yup.number().min(0).required()
});

const orderSchema = Yup.object().shape({
  contactId: Yup.number().integer().positive().required(),
  attendantId: Yup.number().integer().positive().nullable(),
  title: Yup.string().trim().required().min(2),
  description: nullableString,
  serviceType: Yup.string().trim().required(),
  priority: Yup.string().oneOf(ServiceOrder.SERVICE_ORDER_PRIORITIES),
  status: Yup.string().oneOf(ServiceOrder.SERVICE_ORDER_STATUSES),
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
  const item = await ServiceOrder.updateInventoryItem(
    req.user.tenantId,
    req.params.itemId,
    data
  );
  await auditStockAction(req, "service_inventory_updated", item.id, {
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    minQuantity: item.minQuantity,
    active: item.active,
    changedCostPrice: data.costPrice !== undefined,
    changedSalePrice: data.salePrice !== undefined
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
        reason: error instanceof Error ? error.message : "unknown"
      }
    );
    throw error;
  }
};

export const listServiceTypes = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await ServiceOrder.listServiceTypes(req.user.tenantId));

export const createServiceType = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res
    .status(201)
    .json(
      await ServiceOrder.createServiceType(
        req.user.tenantId,
        await validate<ServiceOrder.ServiceTypeData>(
          serviceTypeSchema,
          req.body
        )
      )
    );

export const updateServiceType = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await ServiceOrder.updateServiceType(
      req.user.tenantId,
      req.params.serviceTypeId,
      await validate<ServiceOrder.ServiceTypeData>(serviceTypeSchema, req.body)
    )
  );

export const deleteServiceType = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await ServiceOrder.deleteServiceType(
    req.user.tenantId,
    req.params.serviceTypeId
  );
  return res.status(204).send();
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
  const serviceOrder = await ServiceOrder.updateOrder(
    req.user.tenantId,
    req.user.id,
    req.user.profile,
    req.params.serviceOrderId,
    await validate<ServiceOrder.ServiceOrderData>(orderSchema, req.body)
  );
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
