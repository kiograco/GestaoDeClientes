import express from "express";
import isAuth from "../middleware/isAuth";
import * as DeliveryCatalogController from "../controllers/DeliveryCatalogController";

const deliveryCatalogRoutes = express.Router();

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
