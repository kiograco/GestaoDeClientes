import User from "../../models/User";
import AppError from "../../errors/AppError";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import Queue from "../../models/Queue";
import Tenant from "../../models/Tenant";
import { isTenantAccessActive } from "../../helpers/TenantAccess";
import { isMfaEnabled, verifyUserMfaCode } from "../AuthServices/MfaService";

interface Request {
  email: string;
  password: string;
  mfaCode?: string;
}

interface Response {
  user: User;
  token: string;
  refreshToken: string;
  usuariosOnline?: User[];
  mfaRequired?: boolean;
}

const AuthUserService = async ({
  email,
  password,
  mfaCode
}: Request): Promise<Response> => {
  const user = await User.findOne({
    where: { email },
    include: [
      { model: Queue, as: "queues" },
      {
        model: Tenant,
        attributes: [
          "id",
          "name",
          "status",
          "logoUrl",
          "accessExpiresAt",
          "businessType",
          "enabledModules"
        ]
      }
    ]
  });

  if (!user) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (!(await user.checkPassword(password))) {
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  if (user.profile !== "superadmin" && user.tenant?.status !== "active") {
    throw new AppError("ERR_TENANT_INACTIVE", 403);
  }

  if (user.profile !== "superadmin" && !isTenantAccessActive(user.tenant)) {
    throw new AppError("ERR_TENANT_ACCESS_EXPIRED", 403);
  }

  if (isMfaEnabled(user) && !mfaCode) {
    return {
      user,
      token: "",
      refreshToken: "",
      mfaRequired: true
    };
  }

  verifyUserMfaCode(user, mfaCode);

  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);
  await user.update({
    isOnline: true,
    status: "online",
    lastLogin: new Date()
  });

  const usuariosOnline = await User.findAll({
    where: { tenantId: user.tenantId, isOnline: true },
    attributes: ["id", "email", "status", "lastOnline", "name", "lastLogin"]
  });

  return {
    user,
    token,
    refreshToken,
    usuariosOnline
  };
};

export default AuthUserService;
