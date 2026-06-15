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

const sectorSchema = Yup.object().shape({
  id: Yup.number().integer().positive(),
  name: Yup.string().trim().required().min(2),
  description: nullableString,
  notes: nullableString
});

const areaSchema = Yup.object().shape({
  id: Yup.number().integer().positive(),
  addressId: Yup.number().integer().positive().nullable(),
  addressIndex: Yup.number().integer().min(0).nullable(),
  name: Yup.string().trim().required().min(2),
  areaType: nullableString,
  description: nullableString,
  notes: nullableString,
  services: Yup.array().of(Yup.string().trim().required()).default([]),
  sectors: Yup.array().of(sectorSchema).default([])
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
  contacts: Yup.array().of(contactSchema).default([]),
  areas: Yup.array().of(areaSchema).default([])
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

const validateArea = async (data: LegacyAny): Promise<LegacyAny> => {
  try {
    return await areaSchema.validate(data, {
      stripUnknown: true
    });
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

export const listAreas = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(
    await SalesCustomer.listAreas(
      req.user.tenantId,
      req.params.clientId,
      typeof req.query.addressId === "string" ? req.query.addressId : undefined
    )
  );

export const storeArea = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const area = await SalesCustomer.createArea(
    req.user.tenantId,
    req.params.clientId,
    await validateArea(req.body)
  );
  await auditClientAction(req, "client_area_created", area.id, {
    clientId: req.params.clientId,
    addressId: area.addressId,
    name: area.name
  });
  return res.status(201).json(area);
};

export const updateArea = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const area = await SalesCustomer.updateArea(
    req.user.tenantId,
    req.params.clientId,
    req.params.areaId,
    await validateArea(req.body)
  );
  await auditClientAction(req, "client_area_updated", area.id, {
    clientId: req.params.clientId,
    addressId: area.addressId,
    name: area.name
  });
  return res.json(area);
};

export const removeArea = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await SalesCustomer.deleteArea(
    req.user.tenantId,
    req.params.clientId,
    req.params.areaId
  );
  await auditClientAction(req, "client_area_deleted", req.params.areaId, {
    clientId: req.params.clientId
  });
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
