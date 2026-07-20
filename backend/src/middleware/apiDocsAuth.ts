import { NextFunction, Request, Response } from "express";
import { createBasicAuth } from "./basicAuth";

const { middleware } = createBasicAuth({
  user: process.env.API_DOCS_USER,
  password: process.env.API_DOCS_PASSWORD,
  realm: "API Docs",
  disabledMessage:
    "Swagger /api-docs desabilitado em produção: configure API_DOCS_USER e API_DOCS_PASSWORD para habilitar."
});

export const apiDocsAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (process.env.NODE_ENV !== "production") {
    next();
    return;
  }
  middleware(req, res, next);
};
