import { createBasicAuth } from "./basicAuth";

const { isConfigured, middleware } = createBasicAuth({
  user: process.env.BULL_BOARD_USER,
  password: process.env.BULL_BOARD_PASSWORD,
  realm: "Bull Board",
  disabledMessage:
    "Bull Board desabilitado: configure BULL_BOARD_USER e BULL_BOARD_PASSWORD para habilitar /admin/queues."
});

export const isBullBoardConfigured = (): boolean => isConfigured;
export const bullBoardAuth = middleware;
