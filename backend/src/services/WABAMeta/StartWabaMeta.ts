import AppError from "../../errors/AppError";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import WabaMetaSendMessagesSystem from "./WabaMetaSendMessagesSystem";
import { metaGraphBreaker } from "./metaGraphClient";

const checkingWabaMeta: LegacyAny = {};
const graphApiVersion = process.env.META_GRAPH_API_VERSION || "v20.0";

const checkMessagesWabaMeta = async (connection: Whatsapp) => {
  if (checkingWabaMeta[connection.id]) return;
  checkingWabaMeta[connection.id] = true;
  try {
    await WabaMetaSendMessagesSystem(connection);
  } catch (error) {
    logger.error(
      `ERROR: Meta WABA checkMessages Tenant: ${connection.tenantId}::`,
      error
    );
  }
  checkingWabaMeta[connection.id] = false;
};

export const StartWabaMeta = async (connection: Whatsapp): Promise<void> => {
  const io = getIO();
  await connection.update({ status: "OPENING" });
  io.emit(`${connection.tenantId}:whatsappSession`, {
    action: "update",
    session: connection
  });

  try {
    if (!connection.tokenAPI || !connection.fbPageId) {
      throw new AppError(
        "META_WABA: informe o token de acesso e o Phone Number ID",
        400
      );
    }

    const { data } = await metaGraphBreaker.fire({
      method: "get",
      url: `https://graph.facebook.com/${graphApiVersion}/${connection.fbPageId}`,
      params: { fields: "display_phone_number,verified_name" },
      headers: { Authorization: `Bearer ${connection.tokenAPI}` }
    });

    logger.info(`Conexao WABA Meta iniciada | Empresa: ${connection.tenantId}`);
    await connection.update({
      status: "CONNECTED",
      number: data?.display_phone_number || connection.number || ""
    });
    setInterval(
      checkMessagesWabaMeta,
      +(process.env.CHECK_INTERVAL || 5000),
      connection
    );
    io.emit(`${connection.tenantId}:whatsappSession`, {
      action: "update",
      session: connection
    });
  } catch (err) {
    logger.error(`StartWabaMeta | Error: ${err}`);
    await connection.update({ status: "DISCONNECTED" });
    io.emit(`${connection.tenantId}:whatsappSession`, {
      action: "update",
      session: connection
    });
    throw new AppError(`ERROR_CONNECT_WABA_META: ${err}`, 404);
  }
};
