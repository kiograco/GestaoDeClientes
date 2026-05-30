import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import isAuth from "../middleware/isAuth";
import rateLimit from "../middleware/rateLimit";

const authRoutes = Router();

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

authRoutes.post("/login", authRateLimit, SessionController.store);
authRoutes.post("/logout", isAuth, SessionController.logout);

authRoutes.post("/refresh_token", authRateLimit, SessionController.update);

export default authRoutes;
