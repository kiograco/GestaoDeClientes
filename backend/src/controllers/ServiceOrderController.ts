import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
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
  cancelReason: nullableString
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
): Promise<Response> =>
  res.json(
    await ServiceOrder.updateOrder(
      req.user.tenantId,
      req.user.id,
      req.user.profile,
      req.params.serviceOrderId,
      await validate<ServiceOrder.ServiceOrderData>(orderSchema, req.body)
    )
  );

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
