import "reflect-metadata";
import "express-async-errors";
import { Application, json, urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { logger } from "../utils/logger";
import { getFrontendOrigins } from "../utils/frontendUrl";

export default async function express(app: Application): Promise<void> {
  const frontendOrigins = getFrontendOrigins();

  app.use(
    cors({
      origin: frontendOrigins,
      credentials: true
    })
  );

  app.use(helmet());
  // Sets all of the defaults, but overrides script-src
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        "default-src": ["'self'"],
        "base-uri": ["'self'"],
        "block-all-mixed-content": [],
        "font-src": ["'self'", "https:", "data:"],
        "img-src": ["'self'", "data:"],
        "object-src": ["'none'"],
        "script-src-attr": ["'none'"],
        "style-src": ["'self'", "https:", "'unsafe-inline'"],
        "upgrade-insecure-requests": [],
        // ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        scriptSrc: ["'self'"],
        frameAncestors: ["'self'", ...frontendOrigins]
      }
    })
  );
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" }
    } as LegacyAny)
  );

  logger.info(`CORS origin configured: ${frontendOrigins.join(", ")}`);

  app.use(cookieParser());
  app.use(
    json({
      limit: "1MB",
      verify: (req: LegacyAny, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      }
    })
  );
  app.use(urlencoded({ extended: true, limit: "1MB", parameterLimit: 200000 }));

  logger.info("express already in server!");
}
