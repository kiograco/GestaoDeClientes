/* eslint-disable camelcase */
import {
  AccountRepositoryCurrentUserResponseUser,
  AccountRepositoryLoginResponseLogged_in_user,
  IgApiClient,
  IgLoginTwoFactorRequiredError
} from "instagram-private-api";
import { IgApiClientMQTT, withFbnsAndRealtime } from "instagram_mqtt";
import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
// import { getIO } from "./socket";
import { logger } from "../utils/logger";

interface Session extends IgApiClientMQTT {
  id: number;
  accountLogin?:
    | AccountRepositoryLoginResponseLogged_in_user
    | AccountRepositoryCurrentUserResponseUser;
}

const sessions: Session[] = [];

interface PendingTwoFactor {
  ig: Session;
  username: string;
  twoFactorIdentifier: string;
  verificationMethod: string;
}

const pendingTwoFactor = new Map<number, PendingTwoFactor>();

const connectInstaBot = async (
  ig: Session,
  connection: Whatsapp
): Promise<Session> => {
  const sessionCfg = await ig.exportState();
  await connection.update({ session: sessionCfg });

  await ig.realtime.connect({
    irisData: await ig.feed.directInbox().request()
  });

  await ig.fbns.connect({
    autoReconnect: true
  });

  const sessionIndex = sessions.findIndex(s => s.id === connection.id);
  if (!ig.accountLogin) {
    ig.accountLogin = await ig.account.currentUser();
  }

  if (sessionIndex === -1) {
    sessions.push(ig);
  } else {
    sessions[sessionIndex] = ig;
  }

  return ig;
};

export const initInstaBot = async (connection: Whatsapp): Promise<Session> => {
  try {
    // const io = getIO();
    let loggedUser;
    // const { tenantId } = connection;
    const username = connection.instagramUser?.replace(/^@/, "").trim();
    const password = connection.instagramKey;
    if (!username || !password) {
      throw new Error("Not credentials");
    }

    // se não funcionar, necessário adequar o "as"
    const ig = withFbnsAndRealtime(new IgApiClient()) as Session;
    ig.id = connection.id;

    ig.state.generateDevice(username);

    if (connection.session) {
      const { accountLogin } = ig;
      await ig.importState(JSON.parse(connection.session));
      ig.accountLogin = accountLogin;
    } else {
      // await ig.simulate.preLoginFlow();
      try {
        loggedUser = await ig.account.login(username, password);
      } catch (err) {
        if (err instanceof IgLoginTwoFactorRequiredError) {
          const info = err.response.body.two_factor_info;
          pendingTwoFactor.set(connection.id, {
            ig,
            username,
            twoFactorIdentifier: info.two_factor_identifier,
            verificationMethod: info.totp_two_factor_on ? "3" : "1"
          });
          throw new AppError("INSTAGRAM_TWO_FACTOR_REQUIRED", 409);
        }
        throw err;
      }
      ig.accountLogin = loggedUser;
      process.nextTick(async () => {
        await ig.simulate.postLoginFlow();
      });
    }

    return connectInstaBot(ig, connection);
  } catch (err) {
    logger.error(`initWbot error | Error: ${err}`);
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError(`${err}`, 404);
    // 'Error: Protocol error (Runtime.callFunctionOn): Session closed.'
  }
};

export const confirmInstaBotTwoFactor = async (
  connection: Whatsapp,
  verificationCode: string
): Promise<Session> => {
  const pending = pendingTwoFactor.get(connection.id);
  if (!pending) {
    throw new AppError("INSTAGRAM_TWO_FACTOR_NOT_PENDING", 409);
  }

  pending.ig.accountLogin = await pending.ig.account.twoFactorLogin({
    username: pending.username,
    verificationCode,
    twoFactorIdentifier: pending.twoFactorIdentifier,
    verificationMethod: pending.verificationMethod,
    trustThisDevice: "1"
  });
  pendingTwoFactor.delete(connection.id);

  return connectInstaBot(pending.ig, connection);
};

export const getInstaBot = (channelId: number): Session => {
  // logger.info(`channelId: ${ channelId } | checkState: ${ checkState }`);
  const sessionIndex = sessions.findIndex(s => s.id === channelId);

  return sessions[sessionIndex];
};

export const removeInstaBot = (connection: Whatsapp): void => {
  try {
    const sessionIndex = sessions.findIndex(s => s.id === connection.id);
    if (sessionIndex !== -1) {
      sessions[sessionIndex].account.logout();
      sessions[sessionIndex].realtime.disconnect();
      sessions[sessionIndex].fbns.disconnect();
      sessions.splice(sessionIndex, 1);
    }
    connection.update({
      session: ""
    });
  } catch (err) {
    logger.error(`removeWbot | Error: ${err}`);
  }
};
