import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import createAuditLog from "../services/AuditLogService";
import * as SalesCustomer from "../services/SalesCustomerServices/SalesCustomerService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const addressSchema = Yup.object().shape({
  id: Yup.number().integer().positive(),
  addressType: nullableString,
  linkedDocument: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  zipCode: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  street: nullableString,
  number: nullableString,
  complement: nullableString,
  district: nullableString,
  city: nullableString,
  state: nullableString.max(2),
  reference: nullableString,
  notes: nullableString
});

const contactSchema = Yup.object().shape({
  id: Yup.number().integer().positive(),
  addressId: Yup.number().integer().positive().nullable(),
  addressIndex: Yup.number().integer().min(0).nullable(),
  name: Yup.string().trim().required().min(2),
  role: nullableString,
  phone: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  whatsapp: nullableString.transform(value =>
    value ? value.replace(/\D/g, "") : value
  ),
  email: nullableString.email(),
  notes: nullableString
});

const customerSchema = Yup.object().shape({
  registrationType: Yup.string()
    .oneOf(["person", "legal_entity", "condominium", "company"])
    .required(),
  legalName: Yup.string().trim().required().min(2),
  tradeName: nullableString,
  document: nullableString
    .transform(value => (value ? value.replace(/\D/g, "") : value))
    .matches(/^(\d{11}|\d{14})$/),
  stateRegistration: nullableString,
  municipalRegistration: nullableString,
  activitySector: nullableString,
  status: Yup.string().oneOf(["prospect", "active", "inactive"]),
  notes: nullableString,
  addresses: Yup.array().of(addressSchema).default([]),
  contacts: Yup.array().of(contactSchema).default([])
});

const validate = async (
  data: LegacyAny
): Promise<SalesCustomer.CustomerData> => {
  try {
    return (await customerSchema.validate(data, {
      stripUnknown: true
    })) as SalesCustomer.CustomerData;
  } catch (error) {
    throw new AppError(error.message);
  }
};

const auditClientAction = (
  req: Request,
  action: string,
  resourceId: string | number,
  metadata?: Record<string, unknown>
) =>
  createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action,
    resource: "client",
    resourceId,
    ip: req.ip,
    userAgent: req.get("user-agent"),
    metadata
  });

export const index = async (req: Request, res: Response): Promise<Response> => {
  const searchParam =
    typeof req.query.searchParam === "string" ? req.query.searchParam : "";
  return res.json(
    await SalesCustomer.listCustomers(req.user.tenantId, searchParam)
  );
};

export const show = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await SalesCustomer.showCustomer(req.user.tenantId, req.params.clientId)
  );

export const store = async (req: Request, res: Response): Promise<Response> => {
  const client = await SalesCustomer.createCustomer(
    req.user.tenantId,
    await validate(req.body)
  );
  await auditClientAction(req, "client_created", client.id, {
    legalName: client.legalName,
    status: client.status
  });
  return res.status(201).json(client);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const client = await SalesCustomer.updateCustomer(
    req.user.tenantId,
    req.params.clientId,
    await validate(req.body)
  );
  await auditClientAction(req, "client_updated", client.id, {
    legalName: client.legalName,
    status: client.status
  });
  return res.json(client);
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await SalesCustomer.deleteCustomer(req.user.tenantId, req.params.clientId);
  await auditClientAction(req, "client_deleted", req.params.clientId);
  return res.status(204).send();
};

export const showAddressByZipCode = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesCustomer.findAddressByZipCode(req.params.zipCode));

export const showCompanyByCnpj = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesCustomer.findCompanyByCnpj(req.params.cnpj));
