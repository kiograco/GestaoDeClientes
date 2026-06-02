import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import { randomUUID } from "crypto";
import isAuth from "../middleware/isAuth";
import AppError from "../errors/AppError";
import uploadConfig from "../config/upload";
import * as DeliveryCatalogController from "../controllers/DeliveryCatalogController";

const deliveryCatalogRoutes = express.Router();
const productImageDirectory = path.resolve(uploadConfig.directory, "products");
mkdirSync(productImageDirectory, { recursive: true });

const productImageUpload = multer({
  storage: multer.diskStorage({
    destination: productImageDirectory,
    filename: (req, file, cb) => {
      const extensions = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
      };
      const extension = extensions[file.mimetype];
      cb(null, `tenant-${req.user.tenantId}-${randomUUID()}${extension}`);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      cb(new Error("Envie uma imagem JPG, PNG ou WEBP"));
      return;
    }
    cb(null, true);
  }
});
const uploadProductImage = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  productImageUpload.single("image")(req, res, error => {
    if (error) {
      next(new AppError(error.message, 400));
      return;
    }
    next();
  });
};

deliveryCatalogRoutes.get(
  "/delivery/categories",
  isAuth,
  DeliveryCatalogController.indexCategories
);
deliveryCatalogRoutes.post(
  "/delivery/categories",
  isAuth,
  DeliveryCatalogController.storeCategory
);
deliveryCatalogRoutes.put(
  "/delivery/categories/:categoryId",
  isAuth,
  DeliveryCatalogController.updateCategory
);
deliveryCatalogRoutes.delete(
  "/delivery/categories/:categoryId",
  isAuth,
  DeliveryCatalogController.removeCategory
);
deliveryCatalogRoutes.get(
  "/delivery/products",
  isAuth,
  DeliveryCatalogController.indexProducts
);
deliveryCatalogRoutes.post(
  "/delivery/products/image",
  isAuth,
  uploadProductImage,
  DeliveryCatalogController.storeProductImage
);
deliveryCatalogRoutes.post(
  "/delivery/products",
  isAuth,
  DeliveryCatalogController.storeProduct
);
deliveryCatalogRoutes.put(
  "/delivery/products/:productId",
  isAuth,
  DeliveryCatalogController.updateProduct
);
deliveryCatalogRoutes.delete(
  "/delivery/products/:productId",
  isAuth,
  DeliveryCatalogController.removeProduct
);

export default deliveryCatalogRoutes;
