import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { metaGraphBreaker } from "./metaGraphClient";
import { withMetaRetry } from "./metaRetry";

interface Request {
  message: Record<string, unknown>;
  accessToken: string;
  phoneNumberId: string;
}

const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

const SentMessageMeta = async ({
  message,
  accessToken,
  phoneNumberId
}: Request): Promise<WabaResponse> => {
  try {
    const res = await withMetaRetry(() =>
      metaGraphBreaker.fire({
        method: "post",
        url: `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/messages`,
        data: {
          messaging_product: "whatsapp",
          ...message
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      })
    );

    return res.data;
  } catch (error) {
    logger.error("META_WABA_NOT_SENT_MESSAGE");
    throw new AppError(`META_WABA_NOT_SENT_MESSAGE: ${error}`);
  }
};

export default SentMessageMeta;
