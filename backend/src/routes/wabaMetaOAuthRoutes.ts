import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as WabaMetaOAuthController from "../controllers/WabaMetaOAuthController";

const routes = Router();

routes.get("/whatsapp/meta/signup", isAuth, WabaMetaOAuthController.authorize);
routes.get("/whatsapp/meta/callback", WabaMetaOAuthController.callback);

export default routes;
