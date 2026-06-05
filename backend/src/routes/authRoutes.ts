import { Router } from "express";
import * as SessionController from "../controllers/SessionController";
import * as SignupController from "../controllers/SignupController";
import isAuth from "../middleware/isAuth";
import rateLimit from "../middleware/rateLimit";

const authRoutes = Router();

const authRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const passwordResetRateLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });
const signupRateLimit = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

authRoutes.post("/login", authRateLimit, SessionController.store);
authRoutes.get("/branding", authRateLimit, SessionController.branding);
authRoutes.get("/signup/plans", authRateLimit, SignupController.indexPlans);
authRoutes.post("/signup", signupRateLimit, SignupController.store);
authRoutes.post("/logout", isAuth, SessionController.logout);
authRoutes.post("/mfa/setup", isAuth, SessionController.startMfaSetup);
authRoutes.post("/mfa/confirm", isAuth, SessionController.confirmMfaSetup);
authRoutes.post("/mfa/disable", isAuth, SessionController.disableMfa);

authRoutes.post("/refresh_token", authRateLimit, SessionController.update);
authRoutes.post(
  "/password-reset/request",
  passwordResetRateLimit,
  SessionController.requestPasswordReset
);
authRoutes.post(
  "/password-reset/confirm",
  passwordResetRateLimit,
  SessionController.resetPassword
);

export default authRoutes;
