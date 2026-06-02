import { addDays, format } from "date-fns";
import AppError from "../../errors/AppError";
import Order from "../../models/Order";
import OrderPayment from "../../models/OrderPayment";
import {
  createAsaasCustomer,
  createAsaasPayment,
  getAsaasPixQrCode
} from "../AsaasServices/AsaasService";

interface CreatePaymentData {
  method: "PIX" | "CASH" | "CARD_ON_DELIVERY";
  customer?: {
    name: string;
    email: string;
    cpfCnpj: string;
  };
}

export const createOrderPayment = async (
  tenantId: string | number,
  orderId: string,
  data: CreatePaymentData
): Promise<OrderPayment> => {
  const order = await Order.findOne({ where: { id: orderId, tenantId } });
  if (!order) throw new AppError("ERR_NO_ORDER_FOUND", 404);

  const existingPayment = await OrderPayment.findOne({
    where: { tenantId, orderId, status: "PENDING" }
  });
  if (existingPayment) return existingPayment;

  if (data.method !== "PIX") {
    return OrderPayment.create({
      tenantId,
      orderId,
      method: data.method,
      status: "PENDING",
      amount: order.total
    });
  }
  if (!data.customer)
    throw new AppError("ERR_ORDER_PAYMENT_CUSTOMER_REQUIRED", 400);

  const customer = await createAsaasCustomer({
    ...data.customer,
    cpfCnpj: data.customer.cpfCnpj.replace(/\D/g, ""),
    externalReference: `delivery:tenant:${tenantId}:order:${order.id}`
  });
  const dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const externalReference = `delivery:tenant:${tenantId}:order:${order.id}`;
  const asaasPayment = await createAsaasPayment({
    customer: customer.id,
    billingType: "PIX",
    value: Number(order.total),
    dueDate,
    description: `Pedido #${order.id}`,
    externalReference
  });
  const pix = await getAsaasPixQrCode(asaasPayment.id);
  return OrderPayment.create({
    tenantId,
    orderId,
    method: "PIX",
    status: "PENDING",
    amount: order.total,
    gateway: "asaas",
    externalPaymentId: asaasPayment.id,
    externalReference,
    pixQrCode: pix.encodedImage,
    pixCopyPaste: pix.payload,
    rawPayload: asaasPayment
  });
};

export const updateOrderPaymentStatus = async (
  tenantId: string | number,
  paymentId: string,
  status: "PENDING" | "PAID" | "FAILED" | "REFUNDED"
): Promise<OrderPayment> => {
  const payment = await OrderPayment.findOne({
    where: { id: paymentId, tenantId }
  });
  if (!payment) throw new AppError("ERR_NO_ORDER_PAYMENT_FOUND", 404);
  await payment.update({ status });
  return payment;
};
