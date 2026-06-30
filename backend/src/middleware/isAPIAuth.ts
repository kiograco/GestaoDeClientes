import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import Tenant from "../models/Tenant";
import { isTenantAccessActive } from "../helpers/TenantAccess";

interface TokenPayload {
  apiId: string;
  sessionId: number;
  tenantId: number;
  purpose: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

const isAPIAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Token was not provided.", 403);
  }

  const [, token] = authHeader.split(" ");

  try {
    const decoded = verify(token, authConfig.secret);
    const { apiId, sessionId, tenantId, purpose } = decoded as TokenPayload;
    if (!apiId || !sessionId || !tenantId || purpose !== "external-api") {
      throw new Error("Invalid external API token payload");
    }

    if (req.params.apiId && req.params.apiId !== apiId) {
      throw new Error("External API token does not match route");
    }

    const tenant = await Tenant.findByPk(tenantId, {
      attributes: ["status", "accessExpiresAt"]
    });
    if (!isTenantAccessActive(tenant)) {
      throw new Error("Tenant no longer has access");
    }

    req.APIAuth = {
      apiId,
      sessionId,
      tenantId
    };
  } catch (err) {
    throw new AppError("Invalid token.", 403);
  }

  next();
};

export default isAPIAuth;
