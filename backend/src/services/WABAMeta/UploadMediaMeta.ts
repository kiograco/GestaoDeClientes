import { createReadStream } from "fs";
import { join } from "path";
import FormData from "form-data";
import mime from "mime-types";
import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import { metaGraphBreaker } from "./metaGraphClient";
import { withMetaRetry } from "./metaRetry";

interface Request {
  fileName: string;
  accessToken: string;
  phoneNumberId: string;
}

const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

// Envia um arquivo já salvo em public/ para a Graph API e retorna o media id
// que deve ser usado no campo `id` da mensagem (image/video/document/audio).
const UploadMediaMeta = async ({
  fileName,
  accessToken,
  phoneNumberId
}: Request): Promise<string> => {
  const filePath = join(__dirname, "..", "..", "public", fileName);
  const mimeType = mime.lookup(filePath) || "application/octet-stream";

  const form = new FormData();
  form.append("messaging_product", "whatsapp");
  form.append("file", createReadStream(filePath), { contentType: mimeType });

  try {
    const res = await withMetaRetry(() =>
      metaGraphBreaker.fire({
        method: "post",
        url: `https://graph.facebook.com/${graphApiVersion}/${phoneNumberId}/media`,
        data: form,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      })
    );

    if (!res.data?.id) {
      throw new AppError("ERR_META_WABA_MEDIA_UPLOAD_NO_ID");
    }

    return res.data.id;
  } catch (error) {
    logger.error("META_WABA_MEDIA_UPLOAD_FAILED", error);
    throw new AppError(`META_WABA_MEDIA_UPLOAD_FAILED: ${error}`);
  }
};

export default UploadMediaMeta;
