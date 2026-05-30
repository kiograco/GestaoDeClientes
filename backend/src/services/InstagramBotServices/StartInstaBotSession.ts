/* eslint-disable camelcase */
import {
  AccountRepositoryCurrentUserResponseUser,
  AccountRepositoryLoginResponseLogged_in_user
} from "instagram-private-api";
import { IgApiClientMQTT } from "instagram_mqtt";
import AppError from "../../errors/AppError";
import { confirmInstaBotTwoFactor, initInstaBot } from "../../libs/InstaBot";
import { getIO } from "../../libs/socket";
import Whatsapp from "../../models/Whatsapp";
import { logger } from "../../utils/logger";
import { InstaBotMessageListener } from "./InstaBotMessageListener";

interface Session extends IgApiClientMQTT {
  id: number;
  accountLogin?:
    | AccountRepositoryLoginResponseLogged_in_user
    | AccountRepositoryCurrentUserResponseUser;
}

const getConnectionErrorStatus = (err: unknown): string => {
  const message = err instanceof AppError ? err.message : `${err}`;

  if (message.includes("IgLoginBadPasswordError")) {
    return "INSTAGRAM_BAD_PASSWORD";
  }

  return "DISCONNECTED";
};

export const StartInstaBotSession = async (
  connection: Whatsapp
): Promise<void> => {
  const io = getIO();
  await connection.update({ status: "OPENING" });
  io.emit(`${connection.tenantId}:whatsappSession`, {
    action: "update",
    session: connection
  });

  try {
    const instaBot = await initInstaBot(connection);
    InstaBotMessageListener(instaBot);
    logger.info(`Conexão Instagram iniciada | Empresa: ${connection.tenantId}`);
    await connection.update({ status: "CONNECTED" });
    io.emit(`${connection.tenantId}:whatsappSession`, {
      action: "update",
      session: connection
    });
  } catch (err) {
    const message = err instanceof AppError ? err.message : `${err}`;
    logger.error(`StartInstaBotSession | Error: ${message}`);
    await connection.update({ status: getConnectionErrorStatus(err) });
    io.emit(`${connection.tenantId}:whatsappSession`, {
      action: "update",
      session: connection
    });
    throw new AppError(`ERROR_CONNECT_INSTAGRAM: ${message}`, 404);
  }
};

export const ConfirmInstaBotTwoFactorSession = async (
  connection: Whatsapp,
  verificationCode: string
): Promise<void> => {
  const io = getIO();
  const instaBot = await confirmInstaBotTwoFactor(connection, verificationCode);
  InstaBotMessageListener(instaBot);
  await connection.update({ status: "CONNECTED" });
  io.emit(`${connection.tenantId}:whatsappSession`, {
    action: "update",
    session: connection
  });
};
