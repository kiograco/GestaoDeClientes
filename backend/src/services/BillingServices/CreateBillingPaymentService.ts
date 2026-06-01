import { addDays, format } from "date-fns";
import * as Yup from "yup";
import AppError from "../../errors/AppError";
import Payment from "../../models/Payment";
import Plan from "../../models/Plan";
import Subscription from "../../models/Subscription";
import Tenant from "../../models/Tenant";
import User from "../../models/User";
import {
  createAsaasCustomer,
  createAsaasPayment,
  getAsaasPixQrCode
} from "../AsaasServices/AsaasService";

interface Request {
  companyId: number;
  planId: number;
  method: "PIX" | "CARD";
}

const CreateBillingPaymentService = async ({
  companyId,
  planId,
  method
}: Request): Promise<Payment> => {
  await Yup.object()
    .shape({
      companyId: Yup.number().integer().positive().required(),
      planId: Yup.number().integer().positive().required(),
      method: Yup.string().oneOf(["PIX", "CARD"]).required()
    })
    .validate({ companyId, planId, method });

  const plan = await Plan.findOne({ where: { id: planId, isActive: true } });
  if (!plan) throw new AppError("ERR_NO_PLAN_FOUND", 404);

  const company = await Tenant.findByPk(companyId, {
    include: [{ model: User, as: "owner", attributes: ["name", "email"] }]
  });
  if (!company) throw new AppError("ERR_NO_TENANT_FOUND", 404);
  if (!company.cpfCnpj) {
    throw new AppError("ERR_TENANT_DOCUMENT_REQUIRED", 400);
  }

  const { owner: companyOwner } = company;
  let owner: User | null | undefined = companyOwner;
  if (!owner) {
    owner = await User.findOne({
      where: { tenantId: companyId, profile: "admin" },
      attributes: ["id", "name", "email"],
      order: [["id", "ASC"]]
    });
    if (owner) await company.update({ ownerId: owner.id });
  }
  if (!owner) throw new AppError("ERR_NO_TENANT_OWNER_FOUND", 404);

  let subscription = await Subscription.findOne({
    where: { companyId, gateway: "asaas" },
    order: [["id", "DESC"]]
  });
  let externalCustomerId = subscription?.externalCustomerId;
  if (!externalCustomerId) {
    const customer = await createAsaasCustomer({
      name: company.name,
      cpfCnpj: company.cpfCnpj,
      email: owner.email,
      externalReference: `tenant:${company.id}`
    });
    externalCustomerId = customer.id;
  }

  if (!subscription) {
    subscription = await Subscription.create({
      companyId,
      planId,
      gateway: "asaas",
      externalCustomerId,
      status: "pending"
    });
  } else {
    await subscription.update({
      planId,
      externalCustomerId,
      status: "pending"
    });
  }

  const dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const asaasPayment = await createAsaasPayment({
    customer: externalCustomerId,
    billingType: method === "PIX" ? "PIX" : "UNDEFINED",
    value: Number(plan.price),
    dueDate,
    description: `Plano ${plan.name} - ${plan.durationDays} dias`,
    externalReference: `tenant:${companyId}:plan:${plan.id}`
  });
  const payment = await Payment.create({
    companyId,
    subscriptionId: subscription.id,
    planId: plan.id,
    gateway: "asaas",
    externalPaymentId: asaasPayment.id,
    amount: String(asaasPayment.value),
    method,
    dueDate: asaasPayment.dueDate,
    status: asaasPayment.status,
    paymentUrl: asaasPayment.invoiceUrl,
    rawPayload: asaasPayment
  });

  // TODO: Pix Automático requires controlled Asaas access. Keep one charge per renewal for now.
  if (method === "PIX") {
    const pix = await getAsaasPixQrCode(asaasPayment.id);
    await payment.update({
      pixQrCode: pix.encodedImage,
      pixCopyPaste: pix.payload
    });
  }

  return payment;
};

export default CreateBillingPaymentService;
