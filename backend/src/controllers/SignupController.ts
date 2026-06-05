import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import Plan from "../models/Plan";
import AdminCreateTenantService from "../services/AdminServices/AdminCreateTenantService";
import CreateBillingPaymentService from "../services/BillingServices/CreateBillingPaymentService";

const documentSchema = /^(\d{11}|\d{14})$/;

const signupSchema = Yup.object().shape({
  personType: Yup.string().oneOf(["pf", "pj"]).required(),
  planId: Yup.number().integer().positive().required(),
  paymentMethod: Yup.string().oneOf(["PIX", "CARD"]).required(),
  businessType: Yup.string().oneOf(["generic", "food_delivery"]),
  company: Yup.object()
    .shape({
      name: Yup.string().trim().required().min(2),
      tradeName: Yup.string().trim(),
      document: Yup.string()
        .transform(value => value?.replace(/\D/g, ""))
        .matches(documentSchema, "CPF ou CNPJ invalido")
        .required(),
      stateRegistration: Yup.string().trim(),
      municipalRegistration: Yup.string().trim(),
      phone: Yup.string().trim().required(),
      email: Yup.string().trim().email().required(),
      segment: Yup.string().trim().required()
    })
    .required(),
  responsible: Yup.object()
    .shape({
      name: Yup.string().trim().required().min(2),
      document: Yup.string()
        .transform(value => value?.replace(/\D/g, ""))
        .matches(/^(\d{11})$/, "CPF do responsavel invalido")
        .required(),
      phone: Yup.string().trim().required(),
      email: Yup.string().trim().email().required()
    })
    .required(),
  address: Yup.object()
    .shape({
      zipCode: Yup.string().trim().required(),
      street: Yup.string().trim().required(),
      number: Yup.string().trim().required(),
      complement: Yup.string().trim(),
      district: Yup.string().trim().required(),
      city: Yup.string().trim().required(),
      state: Yup.string().trim().required().length(2)
    })
    .required(),
  admin: Yup.object()
    .shape({
      name: Yup.string().trim().required().min(2),
      email: Yup.string().trim().email().required(),
      password: Yup.string().required().min(6)
    })
    .required(),
  acceptedTerms: Yup.boolean().oneOf([true]).required()
});

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

export const store = async (req: Request, res: Response): Promise<Response> => {
  try {
    await signupSchema.validate(req.body, { abortEarly: false });
  } catch (error) {
    throw new AppError(error.errors?.join("; ") || error.message, 400);
  }

  const plan = await Plan.findOne({
    where: { id: req.body.planId, isActive: true }
  });
  if (!plan) throw new AppError("ERR_NO_PLAN_FOUND", 404);

  const tenant = await AdminCreateTenantService({
    name:
      req.body.personType === "pj"
        ? req.body.company.tradeName || req.body.company.name
        : req.body.company.name,
    cpfCnpj: req.body.company.document,
    adminName: req.body.admin.name,
    adminEmail: req.body.admin.email,
    adminPassword: req.body.admin.password,
    maxUsers: plan.limits?.maxUsers,
    maxConnections: plan.limits?.maxConnections,
    paidDays: 1,
    businessType: req.body.businessType || "generic"
  });

  await tenant.update({
    registrationData: {
      personType: req.body.personType,
      company: req.body.company,
      responsible: req.body.responsible,
      address: req.body.address,
      selectedPlanId: plan.id,
      selectedPaymentMethod: req.body.paymentMethod,
      acceptedTerms: req.body.acceptedTerms,
      acceptedTermsAt: new Date().toISOString()
    }
  });

  try {
    const payment = await CreateBillingPaymentService({
      companyId: tenant.id,
      planId: plan.id,
      method: req.body.paymentMethod
    });

    return res.status(201).json({ tenant, plan, payment });
  } catch (error) {
    return res.status(201).json({
      tenant,
      plan,
      payment: null,
      paymentError: error.message
    });
  }
};
