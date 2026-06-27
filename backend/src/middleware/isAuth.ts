import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import User from "../models/User";
import Tenant from "../models/Tenant";
import { isTenantAccessActive } from "../helpers/TenantAccess";

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  tenantId: number;
  iat: number;
  exp: number;
}

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

    const user = await User.findOne({
      where: { id, tenantId },
      attributes: ["id", "profile", "tenantId", "configs"],
      include: [{ model: Tenant, attributes: ["status", "accessExpiresAt"] }]
    });
    if (!user || user.profile !== profile) {
      throw new Error("User no longer has access");
    }
    if (user.profile !== "superadmin" && user.tenant?.status !== "active") {
      throw new AppError("ERR_TENANT_INACTIVE", 403);
    }
    if (user.profile !== "superadmin" && !isTenantAccessActive(user.tenant)) {
      throw new AppError("ERR_TENANT_ACCESS_EXPIRED", 403);
    }

    const configs = (user.configs || {}) as { permissions?: unknown };
    const permissions = Array.isArray(configs.permissions)
      ? configs.permissions.filter(permission => typeof permission === "string")
      : undefined;

    req.user = {
      id: String(user.id),
      profile: user.profile,
      tenantId: user.tenantId,
      permissions
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError("Invalid token.", 403);
  }

  next();
};

export default isAuth;
