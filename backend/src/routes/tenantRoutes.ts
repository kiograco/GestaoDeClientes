import express from "express";
import multer from "multer";
import path from "path";
import { mkdirSync } from "fs";
import isAuth from "../middleware/isAuth";

import * as TenantController from "../controllers/TenantController";

const tenantRoutes = express.Router();
const logoDirectory = path.resolve(
  process.env.PERSISTENT_DATA_DIR || path.resolve(__dirname, "..", "..", "data"),
  "logos"
);
mkdirSync(logoDirectory, { recursive: true });
const uploadLogo = multer({
  storage: multer.diskStorage({
    destination: logoDirectory,
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      cb(null, `tenant-logo-${Date.now()}${extension}`);
    }
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/png", "image/jpeg"].includes(file.mimetype));
  }
});

// tenantRoutes.post("/tenants", isAuth, TenantController.store);
tenantRoutes.get(
  "/tenants/business-hours/",
  isAuth,
  TenantController.showBusinessHoursAndMessage
);
tenantRoutes.put(
  "/tenants/business-hours/",
  isAuth,
  TenantController.updateBusinessHours
);
tenantRoutes.put(
  "/tenants/message-business-hours/",
  isAuth,
  TenantController.updateMessageBusinessHours
);
tenantRoutes.put(
  "/tenants/logo",
  isAuth,
  uploadLogo.single("logo"),
  TenantController.updateLogo
);
// tenantRoutes.delete("/tenants/:tagId", isAuth, TenantController.remove);

export default tenantRoutes;
