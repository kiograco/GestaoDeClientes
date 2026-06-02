import { Request, Response } from "express";
import * as Yup from "yup";
import AppError from "../errors/AppError";
import EnsureDeliveryModule from "../helpers/EnsureDeliveryModule";
import * as Catalog from "../services/DeliveryCatalogServices/DeliveryCatalogService";

const categorySchema = Yup.object().shape({
  name: Yup.string().trim().required().min(2),
  description: Yup.string().nullable(),
  isActive: Yup.boolean()
});

const optionSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(1),
  price: Yup.number().min(0),
  available: Yup.boolean()
});

const optionGroupSchema = Yup.object().shape({
  name: Yup.string().trim().required().min(1),
  required: Yup.boolean(),
  minSelections: Yup.number().integer().min(0),
  maxSelections: Yup.number().integer().min(1),
  options: Yup.array().of(optionSchema)
});

const productSchema = Yup.object().shape({
  categoryId: Yup.number().integer().positive().required(),
  name: Yup.string().trim().required().min(2),
  description: Yup.string().nullable(),
  imageUrl: Yup.string()
    .transform(value => value || null)
    .test(
      "not-data-url",
      "Envie uma URL publica da imagem. Imagens em Base64 nao sao aceitas",
      value => !value || !value.startsWith("data:")
    )
    .test(
      "is-image-url",
      "Informe uma URL publica valida para a imagem",
      value =>
        !value ||
        value.startsWith("/public/products/") ||
        /^https?:\/\//i.test(value)
    )
    .nullable(),
  basePrice: Yup.number().min(0).required(),
  available: Yup.boolean(),
  saleStartTime: Yup.string()
    .nullable()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  saleEndTime: Yup.string()
    .nullable()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/),
  optionGroups: Yup.array().of(optionGroupSchema)
});

const validate = async (schema: LegacyAny, data: LegacyAny) => {
  try {
    return await schema.validate(data, { stripUnknown: true });
  } catch (error) {
    throw new AppError(error.message);
  }
};

const requireAdmin = (req: Request) => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }
};

export const indexCategories = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(await Catalog.listCategories(req.user.tenantId));
};

export const storeCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res
    .status(201)
    .json(
      await Catalog.createCategory(
        req.user.tenantId,
        await validate(categorySchema, req.body)
      )
    );
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(
    await Catalog.updateCategory(
      req.user.tenantId,
      req.params.categoryId,
      await validate(categorySchema, req.body)
    )
  );
};

export const removeCategory = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  await Catalog.deleteCategory(req.user.tenantId, req.params.categoryId);
  return res.json({ message: "Product category deleted" });
};

export const indexProducts = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(await Catalog.listProducts(req.user.tenantId));
};

export const storeProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res
    .status(201)
    .json(
      await Catalog.createProduct(
        req.user.tenantId,
        await validate(productSchema, req.body)
      )
    );
};

export const storeProductImage = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);

  if (!req.file) {
    throw new AppError("Envie uma imagem JPG, PNG ou WEBP", 400);
  }

  return res.status(201).json({
    imageUrl: `/public/products/${req.file.filename}`
  });
};

export const updateProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  return res.json(
    await Catalog.updateProduct(
      req.user.tenantId,
      req.params.productId,
      await validate(productSchema, req.body)
    )
  );
};

export const removeProduct = async (
  req: Request,
  res: Response
): Promise<Response> => {
  requireAdmin(req);
  await EnsureDeliveryModule(req.user.tenantId);
  await Catalog.deleteProduct(req.user.tenantId, req.params.productId);
  return res.json({ message: "Product deleted" });
};
