import { readFileSync } from "fs";
import path from "path";
import { format } from "date-fns";
import expressInstance, {
  Application,
  Request,
  Response,
  NextFunction
} from "express";
import * as Sentry from "@sentry/node";
import swaggerUi from "swagger-ui-express";
import routes from "../routes";
import uploadConfig from "../config/upload";
import AppError from "../errors/AppError";
import { logger } from "../utils/logger";
import { openApiSpec } from "../docs/openapi";
import { apiDocsAuth } from "../middleware/apiDocsAuth";

export default async function modules(app: Application): Promise<void> {
  const { version } = JSON.parse(readFileSync("./package.json").toString());
  const started = new Date();
  const { env } = process;

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    serverName: env.BACKEND_URL,
    release: version
  });

  app.get("/health", async (req, res) => {
    let checkConnection;
    try {
      checkConnection = "Servidor disponível!";
    } catch (e) {
      checkConnection = `Servidor indisponível! ${e}`;
    }
    res.json({
      started: format(started, "dd/MM/yyyy HH:mm:ss"),
      currentVersion: version,
      uptime: (Date.now() - Number(started)) / 1000,
      statusService: checkConnection
    });
  });
  app.use(Sentry.Handlers.requestHandler());

  app.use("/public", expressInstance.static(uploadConfig.directory));
  app.use(
    "/public/logos",
    expressInstance.static(
      path.resolve(
        process.env.PERSISTENT_DATA_DIR ||
          path.resolve(__dirname, "..", "..", "data"),
        "logos"
      )
    )
  );

  app.use("/api/v1", routes);
  app.use(
    "/api-docs",
    apiDocsAuth,
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec)
  );
  app.use(Sentry.Handlers.errorHandler());

  // error handle
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use(async (err: Error, req: Request, res: Response, _: NextFunction) => {
    if (res.headersSent) {
      return undefined;
    }

    if (err instanceof AppError) {
      if (err.statusCode === 403) {
        logger.warn(err);
      } else {
        logger.error(err);
      }
      res.status(err.statusCode).json({ error: err.message });
      return undefined;
    }

    logger.error(err);
    res.status(500).json({ error: "Internal server error" });
    return undefined;
  });

  logger.info("modules routes already in server!");
}
