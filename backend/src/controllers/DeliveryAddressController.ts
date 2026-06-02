import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import EnsureDeliveryModule from "../helpers/EnsureDeliveryModule";
import * as DeliveryAddress from "../services/DeliveryAddressServices/DeliveryAddressService";

const addressSchema = Yup.object().shape({
  contactId: Yup.number().integer().positive().required(),
  label: Yup.string().trim().required(),
  street: Yup.string().trim().required(),
  number: Yup.string().trim().required(),
  district: Yup.string().trim().required(),
  city: Yup.string().trim().required(),
  state: Yup.string().trim().length(2).required(),
  zipCode: Yup.string()
    .matches(/^\d{8}$/)
    .required(),
  complement: Yup.string().nullable(),
  reference: Yup.string().nullable(),
  isDefault: Yup.boolean()
});

const zoneSchema = Yup.object().shape({
  name: Yup.string().trim().required(),
  district: Yup.string().trim().nullable(),
  zipCodeStart: Yup.string()
    .nullable()
    .matches(/^\d{8}$/),
  zipCodeEnd: Yup.string()
    .nullable()
    .matches(/^\d{8}$/),
  deliveryFee: Yup.number().min(0).required(),
  estimatedMinutes: Yup.number().integer().positive().required(),
  active: Yup.boolean()
});

const validate = async (schema: LegacyAny, data: LegacyAny) => {
  try {
    return await schema.validate(data, { stripUnknown: true });
  } catch (error) {
    throw new AppError(error.message);
  }
};

const requireAdmin = (req: Request) => {
  if (req.user.profile !== "admin")
    throw new AppError("ERR_NO_PERMISSION", 403);
};

export const indexAddresses = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(
    await DeliveryAddress.listAddresses(
      req.user.tenantId,
      Number(req.params.contactId)
    )
  );
};

export const storeAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res
    .status(201)
    .json(
      await DeliveryAddress.createAddress(
        req.user.tenantId,
        await validate(addressSchema, req.body)
      )
    );
};

export const updateAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(
    await DeliveryAddress.updateAddress(
      req.user.tenantId,
      req.params.addressId,
      await validate(addressSchema, req.body)
    )
  );
};

export const removeAddress = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  await DeliveryAddress.deleteAddress(req.user.tenantId, req.params.addressId);
  return res.json({ message: "Customer address deleted" });
};

export const indexZones = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(await DeliveryAddress.listZones(req.user.tenantId));
};

export const storeZone = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res
    .status(201)
    .json(
      await DeliveryAddress.createZone(
        req.user.tenantId,
        await validate(zoneSchema, req.body)
      )
    );
};

export const updateZone = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(
    await DeliveryAddress.updateZone(
      req.user.tenantId,
      req.params.zoneId,
      await validate(zoneSchema, req.body)
    )
  );
};

export const removeZone = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  await DeliveryAddress.deleteZone(req.user.tenantId, req.params.zoneId);
  return res.json({ message: "Delivery zone deleted" });
};

export const showResolvedZone = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  const district =
    typeof req.query.district === "string" ? req.query.district : undefined;
  const zipCode =
    typeof req.query.zipCode === "string" ? req.query.zipCode : undefined;
  return res.json(
    await DeliveryAddress.resolveZone(req.user.tenantId, district, zipCode)
  );
};
