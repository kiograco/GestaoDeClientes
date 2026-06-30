import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import EnsureDeliveryModule from "../helpers/EnsureDeliveryModule";
import { getIO } from "../libs/socket";
import * as DeliveryOrder from "../services/DeliveryOrderServices/DeliveryOrderService";
import NotifyDeliveryOrderStatusService from "../services/DeliveryOrderServices/NotifyDeliveryOrderStatusService";

const itemSchema = Yup.object().shape({
  productId: Yup.number().integer().positive().required(),
  quantity: Yup.number().integer().positive().required(),
  notes: Yup.string().nullable(),
  optionIds: Yup.array().of(Yup.number().integer().positive())
});

const orderSchema = Yup.object().shape({
  contactId: Yup.number().integer().positive().required(),
  ticketId: Yup.number().integer().positive().nullable(),
  originChannel: Yup.string()
    .oneOf(["whatsapp", "instagram", "facebook", "manual"])
    .required(),
  deliveryType: Yup.string().oneOf(["pickup", "delivery"]).required(),
  deliveryFee: Yup.number().min(0),
  discount: Yup.number().min(0),
  deliveryAddressSnapshot: Yup.object().nullable(),
  notes: Yup.string().nullable(),
  items: Yup.array().of(itemSchema).min(1).required()
});

const statusSchema = Yup.object().shape({
  status: Yup.string().oneOf(DeliveryOrder.ORDER_STATUSES).required()
});

const validate = async (schema: LegacyAny, data: LegacyAny) => {
  try {
    return await schema.validate(data, { stripUnknown: true });
  } catch (error) {
    throw new AppError(error.message);
  }
};

const emitOrder = (
  tenantId: number,
  action: string,
  order: LegacyAny
) => {
  getIO().emit(`${tenantId}:delivery:order`, { action, order });
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const status =
    typeof req.query.status === "string" ? req.query.status : undefined;
  const searchParam =
    typeof req.query.searchParam === "string"
      ? req.query.searchParam
      : undefined;
  const contactId =
    typeof req.query.contactId === "string" ? req.query.contactId : undefined;
  const ticketId =
    typeof req.query.ticketId === "string" ? req.query.ticketId : undefined;
  return res.json(
    await DeliveryOrder.listOrders(
      req.user.tenantId,
      status,
      searchParam,
      contactId,
      ticketId
    )
  );
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const order = await DeliveryOrder.createOrder(
    req.user.tenantId,
    req.user.id,
    await validate(orderSchema, req.body)
  );
  emitOrder(req.user.tenantId, "create", order);
  return res.status(201).json(order);
};

export const updateStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const { status } = await validate(statusSchema, req.body);
  const order = await DeliveryOrder.updateOrderStatus(
    req.user.tenantId,
    req.user.id,
    req.params.orderId,
    status
  );
  emitOrder(req.user.tenantId, "update", order);
  await NotifyDeliveryOrderStatusService(req.user.tenantId, Number(req.user.id), order);
  return res.json(order);
};
