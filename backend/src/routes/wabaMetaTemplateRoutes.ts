import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as WabaMetaTemplateController from "../controllers/WabaMetaTemplateController";

const routes = Router();

routes.get(
  "/whatsapp/meta/:whatsappId/templates",
  isAuth,
  WabaMetaTemplateController.listTemplates
);

routes.post(
  "/whatsapp/meta/:whatsappId/templates/send",
  isAuth,
  WabaMetaTemplateController.sendTemplate
);

export default routes;
