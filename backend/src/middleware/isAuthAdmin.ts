import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";
import User from "../models/User";

interface TokenPayload {
  id: string;
  profile: string;
  tenantId: number;
}

const isAuthAdmin = async (
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
    const { id, profile } = decoded as TokenPayload;
    const user = await User.findByPk(id);
    if (!user || user.profile !== "superadmin" || profile !== "superadmin") {
      throw new Error("Not super admin permission");
    }

    req.user = {
      id: String(user.id),
      profile: user.profile,
      tenantId: user.tenantId
    };
  } catch (error) {
    throw new AppError("Invalid token or not Super Admin", 403);
  }

  next();
};

export default isAuthAdmin;
