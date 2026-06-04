import AppError from "../../../errors/AppError";
import { logger } from "../../../utils/logger";

interface GuardParams {
  whatsappId: number | string;
  tenantId?: number | string;
  recipient: string;
  body?: string;
  mediaName?: string | null;
  source?: string;
}

interface SessionState {
  lastSentAt: number;
  sentAt: number[];
}

const minuteWindowMs = 60000;
const sessionState = new Map<string, SessionState>();
const recipientLastSentAt = new Map<string, number>();
const duplicateSentAt = new Map<string, number[]>();
const sessionLocks = new Map<string, Promise<void>>();

const numberEnv = (key: string, defaultValue: number): number => {
  const parsed = Number(process.env[key]);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
};

const isEnabled = (): boolean => process.env.WAPP_ANTISPAM_ENABLED !== "false";

const sleep = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const sanitize = (value: string): string =>
  value.replace(/\s+/g, " ").trim().toLowerCase();

const signatureFrom = ({ body, mediaName }: GuardParams): string => {
  const value = body || mediaName || "";
  return sanitize(value).slice(0, 500);
};

const prune = (items: number[], windowMs: number, now: number): number[] =>
  items.filter(item => now - item <= windowMs);

const lockSession = async (
  sessionKey: string,
  task: () => Promise<void>
): Promise<void> => {
  const previous = sessionLocks.get(sessionKey) || Promise.resolve();
  const current = previous.then(task, task);
  sessionLocks.set(
    sessionKey,
    current.finally(() => {
      if (sessionLocks.get(sessionKey) === current) {
        sessionLocks.delete(sessionKey);
      }
    })
  );
  return current;
};

const applyGuard = async (params: GuardParams): Promise<void> => {
  const sessionKey = String(params.whatsappId);
  const recipientKey = `${sessionKey}:${params.recipient}`;
  const duplicateWindowMs = numberEnv("WAPP_DUPLICATE_WINDOW_MS", 300000);
  const maxDuplicateMessages = numberEnv("WAPP_MAX_DUPLICATE_MESSAGES", 2);
  const minSessionIntervalMs = numberEnv("WAPP_MIN_SEND_INTERVAL_MS", 8000);
  const minRecipientIntervalMs = numberEnv(
    "WAPP_MIN_RECIPIENT_INTERVAL_MS",
    30000
  );
  const maxPerMinute = numberEnv("WAPP_MAX_SENDS_PER_MINUTE", 10);
  const jitterMs = numberEnv("WAPP_RANDOM_JITTER_MS", 3000);
  const now = Date.now();
  const signature = signatureFrom(params);

  if (signature && maxDuplicateMessages > 0) {
    const duplicateKey = `${recipientKey}:${signature}`;
    const history = prune(
      duplicateSentAt.get(duplicateKey) || [],
      duplicateWindowMs,
      now
    );

    if (history.length >= maxDuplicateMessages) {
      logger.warn(
        `WhatsApp anti-spam blocked duplicate message | tenant=${params.tenantId} session=${sessionKey} recipient=${params.recipient} source=${params.source}`
      );
      throw new AppError("ERR_WAPP_ANTISPAM_DUPLICATED", 429);
    }
  }

  const state = sessionState.get(sessionKey) || { lastSentAt: 0, sentAt: [] };
  state.sentAt = prune(state.sentAt, minuteWindowMs, now);

  let waitMs = 0;
  if (maxPerMinute > 0 && state.sentAt.length >= maxPerMinute) {
    waitMs = Math.max(waitMs, minuteWindowMs - (now - state.sentAt[0]));
  }

  if (minSessionIntervalMs > 0 && state.lastSentAt > 0) {
    waitMs = Math.max(waitMs, state.lastSentAt + minSessionIntervalMs - now);
  }

  const recipientLast = recipientLastSentAt.get(recipientKey) || 0;
  if (minRecipientIntervalMs > 0 && recipientLast > 0) {
    waitMs = Math.max(waitMs, recipientLast + minRecipientIntervalMs - now);
  }

  if (jitterMs > 0) {
    waitMs += Math.floor(Math.random() * jitterMs);
  }

  if (waitMs > 0) {
    logger.info(
      `WhatsApp anti-spam pacing ${waitMs}ms | tenant=${params.tenantId} session=${sessionKey} recipient=${params.recipient} source=${params.source}`
    );
    await sleep(waitMs);
  }

  const sentAt = Date.now();
  state.lastSentAt = sentAt;
  state.sentAt = prune([...state.sentAt, sentAt], minuteWindowMs, sentAt);
  sessionState.set(sessionKey, state);
  recipientLastSentAt.set(recipientKey, sentAt);

  if (signature && maxDuplicateMessages > 0) {
    const duplicateKey = `${recipientKey}:${signature}`;
    duplicateSentAt.set(
      duplicateKey,
      prune(
        [...(duplicateSentAt.get(duplicateKey) || []), sentAt],
        duplicateWindowMs,
        sentAt
      )
    );
  }
};

export const guardWhatsAppSend = async (params: GuardParams): Promise<void> => {
  if (!isEnabled()) return;
  await lockSession(String(params.whatsappId), () => applyGuard(params));
};
