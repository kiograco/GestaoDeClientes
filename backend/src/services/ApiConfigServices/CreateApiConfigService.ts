// import AppError from "../../errors/AppError";
import { sign } from "jsonwebtoken";
import ApiConfig from "../../models/ApiConfig";
import authConfig from "../../config/auth";

interface Request {
  name: string;
  sessionId: string | number;
  urlServiceStatus?: string;
  urlMessageStatus?: string;
  authToken?: string;
  userId: string | number;
  tenantId: number;
}

const CreateApiConfigService = async ({
  name,
  sessionId,
  urlServiceStatus,
  urlMessageStatus,
  userId,
  authToken,
  tenantId
}: Request): Promise<ApiConfig> => {
  const { secret } = authConfig;

  const api = await ApiConfig.create({
    name,
    sessionId,
    authToken,
    urlServiceStatus,
    urlMessageStatus,
    userId,
    tenantId
  } as LegacyAny);

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

  return api;
};

export default CreateApiConfigService;
