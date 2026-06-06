import express from "express";
import isAuth from "../middleware/isAuth";
import * as ServiceOrderController from "../controllers/ServiceOrderController";

const serviceOrderRoutes = express.Router();

serviceOrderRoutes.get(
  "/service/attendants",
  isAuth,
  ServiceOrderController.listAttendants
);
serviceOrderRoutes.post(
  "/service/attendants",
  isAuth,
  ServiceOrderController.createAttendant
);
serviceOrderRoutes.put(
  "/service/attendants/:attendantId",
  isAuth,
  ServiceOrderController.updateAttendant
);
serviceOrderRoutes.get(
  "/service/orders",
  isAuth,
  ServiceOrderController.listOrders
);
serviceOrderRoutes.get(
  "/service/orders-dashboard",
  isAuth,
  ServiceOrderController.dashboard
);
serviceOrderRoutes.get(
  "/service/orders/:serviceOrderId",
  isAuth,
  ServiceOrderController.showOrder
);
serviceOrderRoutes.post(
  "/service/orders",
  isAuth,
  ServiceOrderController.createOrder
);
serviceOrderRoutes.put(
  "/service/orders/:serviceOrderId",
  isAuth,
  ServiceOrderController.updateOrder
);
serviceOrderRoutes.get(
  "/service/orders/:serviceOrderId/document",
  isAuth,
  ServiceOrderController.publicDocument
);
serviceOrderRoutes.get(
  "/service/orders/:serviceOrderId/document/internal",
  isAuth,
  ServiceOrderController.internalDocument
);
serviceOrderRoutes.post(
  "/service/orders/:serviceOrderId/notify",
  isAuth,
  ServiceOrderController.notifyOrder
);

export default serviceOrderRoutes;
