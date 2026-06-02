import express from "express";
import isAuth from "../middleware/isAuth";
import * as DeliveryOrderController from "../controllers/DeliveryOrderController";

const deliveryOrderRoutes = express.Router();

deliveryOrderRoutes.get(
  "/delivery/orders",
  isAuth,
  DeliveryOrderController.index
);
deliveryOrderRoutes.post(
  "/delivery/orders",
  isAuth,
  DeliveryOrderController.store
);
deliveryOrderRoutes.put(
  "/delivery/orders/:orderId/status",
  isAuth,
  DeliveryOrderController.updateStatus
);

export default deliveryOrderRoutes;
