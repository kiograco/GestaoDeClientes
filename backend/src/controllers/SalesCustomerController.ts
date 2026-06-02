import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import * as SalesCustomer from "../services/SalesCustomerServices/SalesCustomerService";

const nullableString = Yup.string()
  .transform(value => value || null)
  .nullable();

const addressSchema = Yup.object().shape({
  id: Yup.number().integer().positive(),
  label: Yup.string().trim().required(),
  street: Yup.string().trim().required(),
  number: Yup.string().trim().required(),
  district: Yup.string().trim().required(),
  city: Yup.string().trim().required(),
  state: Yup.string().trim().length(2).required(),
  zipCode: Yup.string()
    .transform(value => (value ? value.replace(/\D/g, "") : value))
    .matches(/^\d{8}$/)
    .required(),
  complement: nullableString,
  reference: nullableString
});

const customerSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  number: Yup.string()
    .transform(value => (value ? value.replace(/\D/g, "") : value))
    .matches(/^\d{8,15}$/)
    .required(),
  email: nullableString.email(),
  document: nullableString.matches(/^(\d{11}|\d{14})$/),
  secondaryPhone: nullableString.matches(/^\d{8,15}$/),
  companyName: nullableString,
  birthDate: nullableString,
  salesStatus: Yup.string().oneOf(["LEAD", "CUSTOMER", "INACTIVE"]),
  source: nullableString,
  notes: nullableString,
  address: addressSchema.required()
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

export const index = async (req: Request, res: Response): Promise<Response> => {
  const searchParam =
    typeof req.query.searchParam === "string" ? req.query.searchParam : "";
  return res.json(
    await SalesCustomer.listCustomers(req.user.tenantId, searchParam)
  );
};

export const show = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await SalesCustomer.showCustomer(req.user.tenantId, req.params.contactId)
  );

export const store = async (req: Request, res: Response): Promise<Response> =>
  res
    .status(201)
    .json(
      await SalesCustomer.createCustomer(
        req.user.tenantId,
        await validate(req.body)
      )
    );

export const update = async (req: Request, res: Response): Promise<Response> =>
  res.json(
    await SalesCustomer.updateCustomer(
      req.user.tenantId,
      req.params.contactId,
      await validate(req.body)
    )
  );

export const showAddressByZipCode = async (
  req: Request,
  res: Response
): Promise<Response> =>
  res.json(await SalesCustomer.findAddressByZipCode(req.params.zipCode));
