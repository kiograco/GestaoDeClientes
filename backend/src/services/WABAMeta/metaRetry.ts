import { logger } from "../../utils/logger";

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

const sleep = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

const isRetryableStatus = (statusCode?: number): boolean =>
  statusCode === 429 ||
  (!!statusCode && statusCode >= 500 && statusCode <= 599);

const getRetryDelayMs = (
  error: LegacyAny,
  attempt: number,
  baseDelayMs: number
): number => {
  const retryAfterHeader = error?.response?.headers?.["retry-after"];
  const retryAfterSeconds = Number(retryAfterHeader);
  if (retryAfterHeader && !Number.isNaN(retryAfterSeconds)) {
    return retryAfterSeconds * 1000;
  }
  return baseDelayMs * 2 ** attempt;
};

// Retenta chamadas à Graph API em erro 429 (rate limit) e 5xx com backoff exponencial,
// respeitando o header Retry-After quando a Meta o informa.
export const withMetaRetry = async <T>(
  action: () => Promise<T>,
  { maxRetries = 3, baseDelayMs = 1000 }: RetryOptions = {}
): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await action();
    } catch (error) {
      const statusCode = (error as LegacyAny)?.response?.status;
      if (attempt >= maxRetries || !isRetryableStatus(statusCode)) {
        throw error;
      }
      const delayMs = getRetryDelayMs(error, attempt, baseDelayMs);
      logger.warn(
        `[MetaGraphAPI] tentativa ${
          attempt + 1
        } falhou (status ${statusCode}), nova tentativa em ${delayMs}ms`
      );
      // eslint-disable-next-line no-await-in-loop
      await sleep(delayMs);
    }
  }
};

export default withMetaRetry;
