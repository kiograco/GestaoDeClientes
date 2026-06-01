import { verify } from "jsonwebtoken";
import AppError from "../../errors/AppError";
import User from "../../models/User";
import authConfig from "../../config/auth";
import Tenant from "../../models/Tenant";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";

interface RefreshTokenPayload {
  id: string;
  tokenVersion: number;
}

interface Response {
  newToken: string;
  refreshToken: string;
}

export const RefreshTokenService = async (token: string): Promise<Response> => {
  let decoded;

  try {
    decoded = verify(token, authConfig.refreshSecret);
  } catch (err) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const { id, tokenVersion } = decoded as RefreshTokenPayload;

  const user = await User.findByPk(id, {
    include: [{ model: Tenant, attributes: ["status"] }]
  });

  if (
    !user ||
    user.tokenVersion !== tokenVersion ||
    (user.profile !== "superadmin" && user.tenant?.status !== "active")
  ) {
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  const newToken = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  return { newToken, refreshToken };
};
