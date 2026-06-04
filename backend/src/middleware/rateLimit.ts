import { NextFunction, Request, Response } from "express";
import AppError from "../errors/AppError";
import { redisClient } from "../libs/redisClient";
import { logger } from "../utils/logger";

interface RateLimitOptions {
  windowMs: number;
  max: number;
}

interface ClientWindow {
  count: number;
  resetAt: number;
}

const clients = new Map<string, ClientWindow>();

const rateLimit =
  ({ windowMs, max }: RateLimitOptions) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const now = Date.now();
    const key = `${req.ip}:${req.baseUrl}${req.path}`;

    if (process.env.RATE_LIMIT_STORE === "redis") {
      try {
        const redisKey = `rate-limit:${key}`;
        const count = await redisClient.incr(redisKey);
        if (count === 1) {
          await redisClient.pexpire(redisKey, windowMs);
        }
        if (count > max) {
          throw new AppError("ERR_TOO_MANY_REQUESTS", 429);
        }
        next();
        return;
      } catch (error) {
        if (error instanceof AppError) throw error;
        logger.error(`Redis rate limit unavailable: ${error}`);
      }
    }

    const current = clients.get(key);

    if (clients.size > 10000) {
      clients.forEach((value, clientKey) => {
        if (value.resetAt <= now) {
          clients.delete(clientKey);
        }
      });
    }

    if (!current || current.resetAt <= now) {
      clients.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    current.count += 1;
    if (current.count > max) {
      throw new AppError("ERR_TOO_MANY_REQUESTS", 429);
    }

    next();
  };

export default rateLimit;
