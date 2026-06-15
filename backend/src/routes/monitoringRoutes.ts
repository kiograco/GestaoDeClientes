import express from "express";
import isAuth from "../middleware/isAuth";
import * as MonitoringController from "../controllers/MonitoringController";

const monitoringRoutes = express.Router();

monitoringRoutes.get(
  "/monitoring/trap-types",
  isAuth,
  MonitoringController.listTrapTypes
);
monitoringRoutes.post(
  "/monitoring/trap-types",
  isAuth,
  MonitoringController.storeTrapType
);
monitoringRoutes.put(
  "/monitoring/trap-types/:trapTypeId",
  isAuth,
  MonitoringController.updateTrapType
);
monitoringRoutes.delete(
  "/monitoring/trap-types/:trapTypeId",
  isAuth,
  MonitoringController.removeTrapType
);

monitoringRoutes.get(
  "/monitoring/points",
  isAuth,
  MonitoringController.listPoints
);
monitoringRoutes.post(
  "/monitoring/points",
  isAuth,
  MonitoringController.storePoints
);
monitoringRoutes.put(
  "/monitoring/points/:pointId",
  isAuth,
  MonitoringController.updatePoint
);
monitoringRoutes.delete(
  "/monitoring/points/:pointId",
  isAuth,
  MonitoringController.removePoint
);

export default monitoringRoutes;
