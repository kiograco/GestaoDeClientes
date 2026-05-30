import { Router } from "express";
import isAuth from "../middleware/isAuth";
import * as InstagramOAuthController from "../controllers/InstagramOAuthController";

const routes = Router();

routes.get("/instagram/oauth/callback", InstagramOAuthController.callback);
routes.get("/instagram/webhook", InstagramOAuthController.verifyWebhook);
routes.post("/instagram/webhook", InstagramOAuthController.webhook);
routes.get(
  "/instagram/oauth/:whatsappId",
  isAuth,
  InstagramOAuthController.authorize
);

export default routes;
