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
      attributes: ["id", "profile", "tenantId"],
      include: [{ model: Tenant, attributes: ["status", "accessExpiresAt"] }]
    });
    if (
      !user ||
      user.profile !== profile ||
      (user.profile !== "superadmin" && !isTenantAccessActive(user.tenant))
    ) {
      throw new Error("User no longer has access");
    }

    req.user = {
      id: String(user.id),
      profile: user.profile,
      tenantId: user.tenantId
    };
  } catch (err) {
    throw new AppError("Invalid token.", 403);
  }

  next();
};

export default isAuth;
