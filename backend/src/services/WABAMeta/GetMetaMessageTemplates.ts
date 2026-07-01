import AppError from "../../errors/AppError";
import { logger } from "../../utils/logger";
import Whatsapp from "../../models/Whatsapp";
import { metaGraphBreaker } from "./metaGraphClient";
import { withMetaRetry } from "./metaRetry";

const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

interface WabaMessageTemplate {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: LegacyAny[];
}

// Lista os templates (HSM) cadastrados na Meta para a WABA do canal,
// incluindo os que ainda estão em análise ou foram rejeitados.
const GetMetaMessageTemplates = async (
  channel: Whatsapp
): Promise<WabaMessageTemplate[]> => {
  const wabaId = (channel.fbObject as LegacyAny)?.wabaId;

  if (!wabaId) {
    throw new AppError("ERR_META_WABA_ID_NOT_CONFIGURED", 400);
  }

  try {
    const res = await withMetaRetry(() =>
      metaGraphBreaker.fire({
        method: "get",
        url: `https://graph.facebook.com/${graphApiVersion}/${wabaId}/message_templates`,
        params: {
          fields: "name,status,category,language,components",
          limit: 100
        },
        headers: { Authorization: `Bearer ${channel.tokenAPI}` }
      })
    );

    return res.data?.data || [];
  } catch (error) {
    logger.error("META_WABA_NOT_LIST_TEMPLATES", error);
    throw new AppError(`META_WABA_NOT_LIST_TEMPLATES: ${error}`);
  }
};

export default GetMetaMessageTemplates;
