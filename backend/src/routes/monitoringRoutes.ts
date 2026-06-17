import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import { randomUUID } from "crypto";
import isAuth from "../middleware/isAuth";
import AppError from "../errors/AppError";
import uploadConfig from "../config/upload";
import * as MonitoringController from "../controllers/MonitoringController";

const monitoringRoutes = express.Router();
const floorPlanDirectory = path.resolve(uploadConfig.directory, "floor-plans");
mkdirSync(floorPlanDirectory, { recursive: true });

const floorPlanUpload = multer({
  storage: multer.diskStorage({
    destination: floorPlanDirectory,
    filename: (req, file, cb) => {
      const extensions = {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp"
      };
      cb(
        null,
        `tenant-${req.user.tenantId}-${randomUUID()}${
          extensions[file.mimetype]
        }`
      );
    }
  }),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp"
    ];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error("Envie PDF, JPG, PNG ou WEBP"));
      return;
    }
    cb(null, true);
  }
});
const uploadFloorPlan = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  floorPlanUpload.single("file")(req, res, error => {
    if (error) {
      next(new AppError(error.message, 400));
      return;
    }
    next();
  });
};

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
  "/monitoring/trap-conditions",
  isAuth,
  MonitoringController.listConditions
);
monitoringRoutes.post(
  "/monitoring/trap-conditions",
  isAuth,
  MonitoringController.storeCondition
);
monitoringRoutes.put(
  "/monitoring/trap-conditions/:conditionId",
  isAuth,
  MonitoringController.updateCondition
);

monitoringRoutes.get(
  "/monitoring/trap-actions",
  isAuth,
  MonitoringController.listActions
);
monitoringRoutes.post(
  "/monitoring/trap-actions",
  isAuth,
  MonitoringController.storeAction
);
monitoringRoutes.put(
  "/monitoring/trap-actions/:actionId",
  isAuth,
  MonitoringController.updateAction
);

monitoringRoutes.get(
  "/monitoring/inspections",
  isAuth,
  MonitoringController.listInspections
);
monitoringRoutes.post(
  "/monitoring/inspections",
  isAuth,
  MonitoringController.storeInspection
);

monitoringRoutes.get(
  "/monitoring/floor-plans",
  isAuth,
  MonitoringController.listFloorPlans
);
monitoringRoutes.post(
  "/monitoring/floor-plans",
  isAuth,
  uploadFloorPlan,
  MonitoringController.storeFloorPlan
);
monitoringRoutes.put(
  "/monitoring/floor-plans/:floorPlanId",
  isAuth,
  MonitoringController.updateFloorPlan
);
monitoringRoutes.delete(
  "/monitoring/floor-plans/:floorPlanId",
  isAuth,
  MonitoringController.removeFloorPlan
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
monitoringRoutes.put(
  "/monitoring/points/:pointId/position",
  isAuth,
  MonitoringController.updatePointPosition
);
monitoringRoutes.delete(
  "/monitoring/points/:pointId/position",
  isAuth,
  MonitoringController.removePointPosition
);
monitoringRoutes.delete(
  "/monitoring/points/:pointId",
  isAuth,
  MonitoringController.removePoint
);

export default monitoringRoutes;
