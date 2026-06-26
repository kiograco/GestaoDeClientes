import express from "express";
import isAuth from "../middleware/isAuth";
import * as AttendanceTypeController from "../controllers/AttendanceTypeController";

const routes = express.Router();

routes.get(
  "/attendance-types/audit",
  isAuth,
  AttendanceTypeController.auditLogs
);
routes.get(
  "/attendance-types/export",
  isAuth,
  AttendanceTypeController.exportRows
);
routes.get("/attendance-types", isAuth, AttendanceTypeController.index);
routes.get("/attendance-types/:id", isAuth, AttendanceTypeController.show);
routes.post("/attendance-types", isAuth, AttendanceTypeController.store);
routes.put("/attendance-types/:id", isAuth, AttendanceTypeController.update);
routes.patch(
  "/attendance-types/:id/active",
  isAuth,
  AttendanceTypeController.toggleActive
);
routes.delete("/attendance-types/:id", isAuth, AttendanceTypeController.remove);

export default routes;
