import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import EnsureDeliveryModule from "../helpers/EnsureDeliveryModule";
import * as DeliveryPayment from "../services/DeliveryPaymentServices/DeliveryPaymentService";
import * as DeliveryOrder from "../services/DeliveryOrderServices/DeliveryOrderService";
import NotifyDeliveryOrderStatusService from "../services/DeliveryOrderServices/NotifyDeliveryOrderStatusService";
import { getIO } from "../libs/socket";

const paymentSchema = Yup.object().shape({
  method: Yup.string().oneOf(["PIX", "CASH", "CARD_ON_DELIVERY"]).required(),
  customer: Yup.object()
    .shape({
      name: Yup.string().trim().required(),
      email: Yup.string().trim().email().required(),
      cpfCnpj: Yup.string()
        .transform(value => value?.replace(/\D/g, ""))
        .matches(/^(\d{11}|\d{14})$/)
        .required()
    })
    .nullable()
});

const statusSchema = Yup.object().shape({
  status: Yup.string()
    .oneOf(["PENDING", "PAID", "FAILED", "REFUNDED"])
    .required()
});

const validate = async (schema: LegacyAny, data: LegacyAny) => {
  try {
    return await schema.validate(data, { stripUnknown: true });
  } catch (error) {
    throw new AppError(error.message);
  }
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const payment = await DeliveryPayment.createOrderPayment(
    req.user.tenantId,
    req.params.orderId,
    await validate(paymentSchema, req.body)
  );
  if (payment.method === "PIX") {
    const order = await DeliveryOrder.updateOrderStatus(
      req.user.tenantId,
      req.user.id,
      String(payment.orderId),
      "WAITING_PAYMENT"
    );
    getIO().emit(`${req.user.tenantId}:delivery:order`, {
      action: "update",
      order
    });
    await NotifyDeliveryOrderStatusService(
      req.user.tenantId,
      req.user.id,
      order
    );
  }
  return res.status(201).json(payment);
};

export const updateStatus = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const { status } = await validate(statusSchema, req.body);
  const payment = await DeliveryPayment.updateOrderPaymentStatus(
    req.user.tenantId,
    req.params.paymentId,
    status
  );
  if (status === "PAID") {
    const order = await DeliveryOrder.updateOrderStatus(
      req.user.tenantId,
      req.user.id,
      String(payment.orderId),
      "CONFIRMED"
    );
    getIO().emit(`${req.user.tenantId}:delivery:order`, {
      action: "update",
      order
    });
    await NotifyDeliveryOrderStatusService(
      req.user.tenantId,
      req.user.id,
      order
    );
  }
  return res.json(payment);
};
