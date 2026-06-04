import { Request, Response } from "express";
import AppError from "../errors/AppError";

import AuthUserService from "../services/UserServices/AuthUserSerice";
import { SendRefreshToken } from "../helpers/SendRefreshToken";
import { RefreshTokenService } from "../services/AuthServices/RefreshTokenService";
import { getIO } from "../libs/socket";
import User from "../models/User";
import { RequestPasswordResetService } from "../services/AuthServices/RequestPasswordResetService";
import { ResetPasswordService } from "../services/AuthServices/ResetPasswordService";
import ShowTenantBrandingService from "../services/TenantServices/ShowTenantBrandingService";
import {
  getTenantAccessDaysRemaining,
  isTenantAccessActive
} from "../helpers/TenantAccess";
import {
  ConfirmMfaSetupService,
  DisableMfaService,
  StartMfaSetupService
} from "../services/AuthServices/MfaService";
import createAuditLog from "../services/AuditLogService";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const io = getIO();

  const { email, password, mfaCode } = req.body;

  const { token, user, refreshToken, usuariosOnline, mfaRequired } =
    await AuthUserService({
    email,
    password,
    mfaCode
    });

  if (mfaRequired) {
    return res.status(401).json({ error: "ERR_MFA_REQUIRED", mfaRequired: true });
  }

  SendRefreshToken(res, refreshToken);

  const params = {
    token,
    username: user.name,
    email: user.email,
    profile: user.profile,
    status: user.status,
    userId: user.id,
    tenantId: user.tenantId,
    tenantName: user.tenant?.name,
    logoUrl: user.tenant?.logoUrl,
    accessExpiresAt: user.tenant?.accessExpiresAt,
    businessType: user.tenant?.businessType,
    enabledModules: user.tenant?.enabledModules,
    accessDaysRemaining: getTenantAccessDaysRemaining(
      user.tenant?.accessExpiresAt
    ),
    subscriptionExpired:
      user.profile !== "superadmin" && !isTenantAccessActive(user.tenant),
    queues: user.queues,
    usuariosOnline,
    configs: user.configs
  };

  io.emit(`${params.tenantId}:users`, {
    action: "update",
    data: {
      username: params.username,
      email: params.email,
      isOnline: true,
      lastLogin: new Date()
    }
  });

  await createAuditLog({
    tenantId: user.tenantId,
    userId: user.id,
    action: "auth.login",
    resource: "user",
    resourceId: user.id,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });

  return res.status(200).json(params);
};

export const update = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const token: string = req.cookies.jrt;

  if (!token) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { newToken, refreshToken } = await RefreshTokenService(token);

  SendRefreshToken(res, refreshToken);

  return res.json({ token: newToken });
};

export const logout = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const userId = req.user.id;
  const io = getIO();

  const userLogout = await User.findByPk(userId);

  if (userLogout) {
    userLogout.update({ isOnline: false, lastLogout: new Date() });
  }

  io.emit(`${userLogout?.tenantId}:users`, {
    action: "update",
    data: {
      username: userLogout?.name,
      email: userLogout?.email,
      isOnline: false,
      lastLogout: new Date()
    }
  });

  res.clearCookie("jrt", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production"
  });

  await createAuditLog({
    tenantId: userLogout?.tenantId,
    userId: userLogout?.id,
    action: "auth.logout",
    resource: "user",
    resourceId: userLogout?.id,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });

  return res.json({ message: "USER_LOGOUT" });
};

export const branding = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const email = typeof req.query.email === "string" ? req.query.email : "";
  const brandingData = await ShowTenantBrandingService(email);
  return res.json(brandingData);
};

export const requestPasswordReset = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { email } = req.body;

  if (typeof email === "string" && email.trim()) {
    await RequestPasswordResetService(email);
  }

  return res.json({
    message: "PASSWORD_RESET_EMAIL_SENT_IF_ACCOUNT_EXISTS"
  });
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { token, password } = req.body;

  await ResetPasswordService({ token, password });

  return res.json({ message: "PASSWORD_RESET_SUCCESS" });
};

export const startMfaSetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const setup = await StartMfaSetupService(req.user.id, req.user.tenantId);
  return res.json(setup);
};

export const confirmMfaSetup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await ConfirmMfaSetupService(req.user.id, req.user.tenantId, req.body.code);
  await createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: "auth.mfa_enabled",
    resource: "user",
    resourceId: req.user.id,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  return res.json({ message: "MFA_ENABLED" });
};

export const disableMfa = async (
  req: Request,
  res: Response
): Promise<Response> => {
  await DisableMfaService(req.user.id, req.user.tenantId, req.body.code);
  await createAuditLog({
    tenantId: req.user.tenantId,
    userId: req.user.id,
    action: "auth.mfa_disabled",
    resource: "user",
    resourceId: req.user.id,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  return res.json({ message: "MFA_DISABLED" });
};
