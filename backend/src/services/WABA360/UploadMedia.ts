import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { request360Media } from "./waba360Client";

interface Request {
  file: LegacyAny;
  apiKey: string;
}

interface mediaId {
  id: string;
}

interface Response {
  messages: mediaId[];
}

// Use this endpoint sent message waba.
const UploadMedia = async ({ file, apiKey }: Request): Promise<Response> => {
  const apiUrl360 = `${process.env.API_URL_360}/v1/media`;

  try {
    const res = await request360Media({
      method: "post",
      url: apiUrl360,
      data: { file },
      headers: {
        "D360-API-KEY": apiKey,
        "Content-Type": "multipart/form-data"
      }
    });
    return res.data;
  } catch (error) {
    logger.error(error);
    throw new AppError(`360_NOT_UPLOAD_MEDIA: ${error}`);
  }
};

export default UploadMedia;
