import { Request, Response } from "express";
import Payment from "../models/Payment";
import Plan from "../models/Plan";
import Subscription from "../models/Subscription";
import Tenant from "../models/Tenant";
import { getTenantAccessDaysRemaining } from "../helpers/TenantAccess";
import CreateBillingPaymentService from "../services/BillingServices/CreateBillingPaymentService";

export const indexPlans = async (
  _req: Request,
  res: Response
): Promise<Response> => {
  const plans = await Plan.findAll({
    where: { isActive: true },
    order: [["durationDays", "ASC"]]
  });
  return res.json(plans);
};

export const showSubscription = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const company = await Tenant.findByPk(req.user.tenantId, {
    attributes: ["id", "name", "status", "accessExpiresAt"]
  });
  const subscription = await Subscription.findOne({
    where: { companyId: req.user.tenantId },
    include: [{ model: Plan }],
    order: [["id", "DESC"]]
  });
  const payments = await Payment.findAll({
    where: { companyId: req.user.tenantId },
    include: [{ model: Plan, attributes: ["id", "name"] }],
    order: [["createdAt", "DESC"]],
    limit: 30
  });

  return res.json({
    company,
    subscription,
    payments,
    accessDaysRemaining: getTenantAccessDaysRemaining(company?.accessExpiresAt)
  });
};

export const storePayment = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const payment = await CreateBillingPaymentService({
    companyId: Number(req.user.tenantId),
    planId: req.body.planId,
    method: req.body.method
  });
  return res.status(201).json(payment);
};
