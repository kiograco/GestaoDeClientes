/* eslint-disable camelcase */
import { Client, LocalAuth, DefaultOptions } from "whatsapp-web.js";
import path from "path";
import { rm } from "fs/promises";
import { getIO } from "./socket";
import Whatsapp from "../models/Whatsapp";
import { logger } from "../utils/logger";
import SyncUnreadMessagesWbot from "../services/WbotServices/SyncUnreadMessagesWbot";
import AppError from "../errors/AppError";

interface Session extends Client {
  id: number;
}

const sessions: Session[] = [];
const startingSessions = new Set<number>();
const stoppingSessions = new Set<number>();

const getSessionPath = (id: number | string): string => {
  const pathRoot = path.resolve(__dirname, "..", "..", ".wwebjs_auth");
  return `${pathRoot}/session-wbot-${id}`;
};

const clearChromeProfileLocks = async (id: number | string): Promise<void> => {
  const pathSession = getSessionPath(id);
  await Promise.all(
    ["SingletonCookie", "SingletonLock", "SingletonSocket"].map(lock =>
      rm(path.join(pathSession, lock), { force: true })
    )
  );
};

const minimal_args = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-gpu",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain"
];

export const apagarPastaSessao = async (id: number | string): Promise<void> => {
  const pathSession = getSessionPath(id);
  try {
    await rm(pathSession, { recursive: true, force: true });
  } catch (error) {
    logger.info(`apagarPastaSessao:: ${pathSession}`);
    logger.error(error);
  }
};

export const hasWbot = (whatsappId: number): boolean =>
  sessions.some(session => session.id === whatsappId);

export const isWbotStarting = (whatsappId: number): boolean =>
  startingSessions.has(whatsappId);

export const isWbotStopping = (whatsappId: number): boolean =>
  stoppingSessions.has(whatsappId);

export const removeWbot = async (
  whatsappId: number,
  destroy = true
): Promise<void> => {
  stoppingSessions.add(whatsappId);
  try {
    const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
    if (sessionIndex !== -1) {
      const [session] = sessions.splice(sessionIndex, 1);
      if (destroy) {
        await session.destroy();
      }
    }
  } catch (err) {
    logger.error(`removeWbot | Error: ${err}`);
  } finally {
    startingSessions.delete(whatsappId);
    stoppingSessions.delete(whatsappId);
  }
};

const args: string[] = process.env.CHROME_ARGS
  ? process.env.CHROME_ARGS.split(",")
  : minimal_args;

args.unshift(`--user-agent=${DefaultOptions.userAgent}`);

export const initWbot = async (whatsapp: Whatsapp): Promise<Session> => {
  if (hasWbot(whatsapp.id) || isWbotStarting(whatsapp.id)) {
    throw new AppError("ERR_WAPP_ALREADY_INITIALIZED");
  }

  startingSessions.add(whatsapp.id);
  await clearChromeProfileLocks(whatsapp.id);

  return new Promise((resolve, reject) => {
    try {
      const io = getIO();
      const sessionName = whatsapp.name;
      const { tenantId } = whatsapp;
      let sessionCfg;
      if (whatsapp?.session) {
        sessionCfg = JSON.parse(whatsapp.session);
      }

      const wbot = new Client({
        authStrategy: new LocalAuth({ clientId: `wbot-${whatsapp.id}` }),
        takeoverOnConflict: true,
        puppeteer: {
          // headless: false,
          executablePath: process.env.CHROME_BIN || undefined,
          args
        },
        qrMaxRetries: 5
      }) as Session;

      wbot.id = whatsapp.id;
      sessions.push(wbot);

      wbot.initialize().catch(async err => {
        logger.error(`initWbot error | Error: ${err}`);
        await removeWbot(whatsapp.id);
        await whatsapp.update({ status: "DISCONNECTED" });
        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
        reject(err);
      });

      wbot.on("qr", async qr => {
        if (whatsapp.status === "CONNECTED") return;
        logger.info(
          `Session QR CODE: ${sessionName}-ID: ${whatsapp.id}-${whatsapp.status}`
        );

        await whatsapp.update({ qrcode: qr, status: "qrcode", retries: 0 });
        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
      });

      wbot.on("authenticated", async () => {
        logger.info(`Session: ${sessionName} AUTHENTICATED`);
      });

      wbot.on("auth_failure", async msg => {
        logger.error(
          `Session: ${sessionName}-AUTHENTICATION FAILURE :: ${msg}`
        );
        if (whatsapp.retries > 1) {
          await whatsapp.update({
            retries: 0,
            session: ""
          });
        }

        const retry = whatsapp.retries;
        await whatsapp.update({
          status: "DISCONNECTED",
          retries: retry + 1
        });
        await removeWbot(whatsapp.id);

        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });
        reject(new Error("Error starting whatsapp session."));
      });

      wbot.on("ready", async () => {
        logger.info(`Session: ${sessionName}-READY`);

        const info: any = wbot?.info;
        const wbotVersion = await wbot.getWWebVersion();
        const wbotBrowser = await wbot.pupBrowser?.version();
        await whatsapp.update({
          status: "CONNECTED",
          qrcode: "",
          retries: 0,
          number: wbot?.info?.wid?.user, // || wbot?.info?.me?.user,
          phone: {
            ...(info || {}),
            wbotVersion,
            wbotBrowser
          }
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: "update",
          session: whatsapp
        });

        io.emit(`${tenantId}:whatsappSession`, {
          action: "readySession",
          session: whatsapp
        });

        startingSessions.delete(whatsapp.id);

        wbot.sendPresenceAvailable();
        SyncUnreadMessagesWbot(wbot, tenantId);
        resolve(wbot);
      });
    } catch (err) {
      startingSessions.delete(whatsapp.id);
      logger.error(`initWbot error | Error: ${err}`);
      reject(err);
    }
  });
};

export const getWbot = (whatsappId: number): Session => {
  const sessionIndex = sessions.findIndex(s => s.id === whatsappId);
  if (sessionIndex === -1) {
    throw new AppError("ERR_WAPP_NOT_INITIALIZED");
  }

  return sessions[sessionIndex];
};
