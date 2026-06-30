import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import User from "../models/User";
import Tenant from "../models/Tenant";
import { isTenantAccessActive } from "../helpers/TenantAccess";
import {
  CachedAuthUser,
  getCachedAuthUser,
  setCachedAuthUser
} from "../libs/authCache";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  tenantId: number;
  iat: number;
  exp: number;
}

const loadAuthUser = async (
  id: string,
  tenantId: number
): Promise<CachedAuthUser | null> => {
  const cached = await getCachedAuthUser(tenantId, id);
  if (cached) return cached;

  const user = await User.findOne({
    where: { id, tenantId },
    attributes: ["id", "profile", "tenantId", "configs"],
    include: [{ model: Tenant, attributes: ["status", "accessExpiresAt"] }]
  });
  if (!user) return null;

  const configs = (user.configs || {}) as { permissions?: unknown };
  const permissions = Array.isArray(configs.permissions)
    ? configs.permissions.filter(permission => typeof permission === "string")
    : undefined;

  const data: CachedAuthUser = {
    profile: user.profile,
    tenantId: user.tenantId,
    tenantStatus: user.tenant?.status,
    tenantAccessExpiresAt: user.tenant?.accessExpiresAt
      ? new Date(user.tenant.accessExpiresAt).toISOString()
      : null,
    permissions
  };

  await setCachedAuthUser(tenantId, id, data);

  return data;
};

const isAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Token was not provided.", 403);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verify(token, authConfig.secret);
    const { id, profile, tenantId } = decoded as TokenPayload;
    if (!id || !profile || !tenantId) {
      throw new Error("Invalid access token payload");
    }

    const authUser = await loadAuthUser(id, tenantId);
    if (!authUser || authUser.profile !== profile) {
      throw new Error("User no longer has access");
    }
    if (
      authUser.profile !== "superadmin" &&
      authUser.tenantStatus !== "active"
    ) {
      throw new AppError("ERR_TENANT_INACTIVE", 403);
    }
    if (
      authUser.profile !== "superadmin" &&
      !isTenantAccessActive({
        status: authUser.tenantStatus,
        accessExpiresAt: authUser.tenantAccessExpiresAt
          ? new Date(authUser.tenantAccessExpiresAt)
          : null
      } as LegacyAny)
    ) {
      throw new AppError("ERR_TENANT_ACCESS_EXPIRED", 403);
    }

    req.user = {
      id: String(id),
      profile: authUser.profile,
      tenantId: authUser.tenantId,
      permissions: authUser.permissions
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid token.", 403);
  }

  next();
};

export default isAuth;
