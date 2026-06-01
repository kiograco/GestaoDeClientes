import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import Tenant from "../models/Tenant";
import User from "../models/User";

interface TokenPayload {
  id: string;
  tenantId: number;
}

const isBillingAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("Token was not provided.", 403);
  }

  try {
    const [, token] = authHeader.split(" ");
    const { id, tenantId } = verify(token, authConfig.secret) as TokenPayload;
    const user = await User.findOne({
      where: { id, tenantId },
      attributes: ["id", "profile", "tenantId"],
      include: [{ model: Tenant, attributes: ["status"] }]
    });

    if (!user || !user.tenant || user.tenant.status !== "active") {
      throw new Error("Tenant cannot access billing");
    }

    req.user = {
      id: String(user.id),
      profile: user.profile,
      tenantId: user.tenantId
    };
  } catch (error) {
    throw new AppError("ERR_TENANT_INACTIVE", 403);
  }

  next();
};

export default isBillingAuth;
