import express from "express";
import isAuth from "../middleware/isAuth";
import * as DeliveryOrderController from "../controllers/DeliveryOrderController";
import * as DeliveryPaymentController from "../controllers/DeliveryPaymentController";

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
deliveryOrderRoutes.post(
  "/delivery/orders/:orderId/payments",
  isAuth,
  DeliveryPaymentController.store
);
deliveryOrderRoutes.put(
  "/delivery/order-payments/:paymentId/status",
  isAuth,
  DeliveryPaymentController.updateStatus
);

export default deliveryOrderRoutes;
