import express from "express";
import isAuth from "../middleware/isAuth";
import * as BaseRegisterController from "../controllers/BaseRegisterController";

const baseRegisterRoutes = express.Router();

baseRegisterRoutes.get(
  "/base-registers/audit",
  isAuth,
  BaseRegisterController.listBaseRegisterAudit
);
baseRegisterRoutes.get(
  "/base-registers/client-units",
  isAuth,
  BaseRegisterController.listClientUnits
);
baseRegisterRoutes.get(
  "/base-registers/client-units/export",
  isAuth,
  BaseRegisterController.exportClientUnits
);
baseRegisterRoutes.post(
  "/base-registers/client-units",
  isAuth,
  BaseRegisterController.createClientUnit
);
baseRegisterRoutes.put(
  "/base-registers/client-units/:unitId",
  isAuth,
  BaseRegisterController.updateClientUnit
);
baseRegisterRoutes.delete(
  "/base-registers/client-units/:unitId",
  isAuth,
  BaseRegisterController.deleteClientUnit
);
baseRegisterRoutes.get(
  "/base-registers/:module",
  isAuth,
  BaseRegisterController.listBaseRegisters
);
baseRegisterRoutes.get(
  "/base-registers/:module/export",
  isAuth,
  BaseRegisterController.exportBaseRegisters
);
baseRegisterRoutes.post(
  "/base-registers/:module",
  isAuth,
  BaseRegisterController.createBaseRegister
);
baseRegisterRoutes.put(
  "/base-registers/:module/:registerId",
  isAuth,
  BaseRegisterController.updateBaseRegister
);
baseRegisterRoutes.delete(
  "/base-registers/:module/:registerId",
  isAuth,
  BaseRegisterController.deleteBaseRegister
);

export default baseRegisterRoutes;
