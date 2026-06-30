import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { request360 } from "./waba360Client";

interface Request {
  url: string;
  apiKey: string;
}

const SetWebHookUrl = async ({ url, apiKey }: Request): Promise<boolean> => {
  const apiUrl360 = `${process.env.API_URL_360}/v1/configs/webhook`;

  try {
    await request360({
      method: "post",
      url: apiUrl360,
      data: { url },
      headers: {
        "D360-API-KEY": apiKey,
        "Content-Type": "application/json"
      }
    });
    return true;
  } catch (error) {
    logger.error(error);
    throw new AppError(`360_NOT_SET_WEBHOOK: ${error}`);
  }
};

export default SetWebHookUrl;
