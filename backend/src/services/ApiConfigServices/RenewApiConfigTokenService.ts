// import AppError from "../../errors/AppError";
import { sign } from "jsonwebtoken";
import ApiInstance from "../../models/ApiConfig";
import authConfig from "../../config/auth";
import AppError from "../../errors/AppError";

interface Request {
  apiId: string;
  sessionId: string | number;
  userId: string | number;
  tenantId: number;
}

const RenewApiConfigTokenService = async ({
  apiId,
  sessionId,
  tenantId
}: Request): Promise<ApiInstance> => {
  const { secret } = authConfig;

  const api = await ApiInstance.findOne({ where: { id: apiId, tenantId } });

  if (!api) {
    throw new AppError("ERR_API_CONFIG_NOT_FOUND", 404);
  }

  const token = sign(
    {
      apiId: api.id,
      tenantId,
      purpose: "external-api",
      sessionId
    },
    secret,
    {
      expiresIn: "730d"
    }
  );

  await api.update({ token });
  await api.reload();

  return api;
};

export default RenewApiConfigTokenService;
