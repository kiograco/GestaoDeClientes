import { timingSafeEqual } from "crypto";
import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

const safeEqual = (left: string, right: string): boolean =>
  left.length === right.length &&
  timingSafeEqual(Buffer.from(left), Buffer.from(right));

interface BasicAuthOptions {
  user: string | undefined;
  password: string | undefined;
  realm: string;
  disabledMessage: string;
}

interface BasicAuthMiddleware {
  isConfigured: boolean;
  middleware: (req: Request, res: Response, next: NextFunction) => void;
}

export const createBasicAuth = ({
  user,
  password,
  realm,
  disabledMessage
}: BasicAuthOptions): BasicAuthMiddleware => {
  const isConfigured = Boolean(user && password);

  const middleware = (
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    if (!isConfigured) {
      logger.warn(disabledMessage);
      res.status(404).end();
      return;
    }

    const header = req.headers.authorization || "";
    const [scheme, encoded] = header.split(" ");

    if (scheme === "Basic" && encoded) {
      const [receivedUser, receivedPassword] = Buffer.from(encoded, "base64")
        .toString("utf8")
        .split(":");

      if (
        receivedUser &&
        receivedPassword &&
        safeEqual(receivedUser, user as string) &&
        safeEqual(receivedPassword, password as string)
      ) {
        next();
        return;
      }
    }

    res.setHeader("WWW-Authenticate", `Basic realm="${realm}"`);
    res.status(401).end();
  };

  return { isConfigured, middleware };
};
