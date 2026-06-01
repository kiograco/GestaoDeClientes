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

export const store = async (req: Request, res: Response): Promise<Response> => {
  const io = getIO();

  const { email, password } = req.body;

  const { token, user, refreshToken, usuariosOnline } = await AuthUserService({
    email,
    password
  });

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
