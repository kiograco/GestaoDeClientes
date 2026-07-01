/* eslint-disable camelcase */
import axios from "axios";
import { createWriteStream } from "fs";
import { join } from "path";
import AppError from "../../errors/AppError";
import Ticket from "../../models/Ticket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { metaGraphBreaker } from "./metaGraphClient";

interface Request {
  channel: Whatsapp;
  msg: WabaMessage;
  ticket: Ticket;
}

const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

// Diferente da 360Dialog, a Meta exige duas chamadas: primeiro busca a URL
// temporária do arquivo pelo media id, depois baixa o binário dessa URL.
const downloadFile = async (
  accessToken: string,
  mediaId: string,
  filename: string
): Promise<void> => {
  const pathFile = join(__dirname, "..", "..", "public", filename);

  const { data: mediaInfo } = await metaGraphBreaker.fire({
    method: "get",
    url: `https://graph.facebook.com/${graphApiVersion}/${mediaId}`,
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!mediaInfo?.url) {
    throw new AppError("ERR_META_MEDIA_URL_NOT_FOUND");
  }

  const request = await axios({
    url: mediaInfo.url,
    method: "GET",
    responseType: "stream",
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  await new Promise((resolve, reject) => {
    request.data
      .pipe(createWriteStream(pathFile))
      .on("finish", () => resolve(true))
      .on("error", (error: LegacyAny) => {
        logger.error("ERROR_DOWNLOAD_META_MEDIA", error);
        reject(new Error(error));
      });
  });
};

// Use este endpoint para baixar mídia recebida via WhatsApp Cloud API (Meta).
const GetMediaWabaMeta = async ({
  channel,
  msg,
  ticket
}: Request): Promise<string> => {
  try {
    let mediaId = "";
    let originalName;
    let mime_type;
    if (msg?.document) {
      mediaId = msg.document.id || "";
      originalName = msg.document.filename;
      mime_type = msg.document.mime_type;
    }
    if (msg?.image) {
      mediaId = msg.image.id || "";
      mime_type = msg.image.mime_type;
    }
    if (msg?.video) {
      mediaId = msg.video.id || "";
      mime_type = msg.video.mime_type;
    }
    if (msg?.voice) {
      mediaId = msg.voice.id || "";
      const mime = msg.voice.mime_type || "";
      const mimeSplit = mime.split(";");
      mime_type = mimeSplit.length > 1 ? mimeSplit[0] : msg.voice.mime_type;
    }
    if (msg?.audio) {
      mediaId = msg.audio.id || "";
      mime_type = msg.audio.mime_type;
    }

    const ext = mime_type?.split("/")[1]?.split(";")[0];
    const time = new Date().getTime();
    const filename = originalName
      ? `${originalName}_${ticket.id}_${mediaId}_${time}.${ext}`
      : `${ticket.id}_${mediaId}_${time}.${ext}`;

    await downloadFile(channel.tokenAPI, mediaId, filename);
    return filename;
  } catch (error) {
    logger.error(error);
    throw new AppError(`META_NOT_DOWNLOAD_MEDIA: ${error}`);
  }
};

export default GetMediaWabaMeta;
